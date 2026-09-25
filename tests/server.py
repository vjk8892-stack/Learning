#!/usr/bin/env python3
"""
A local server for the Playwright suite: serves the repo's static files
while sending the exact same security headers netlify.toml configures
for the live deployment (parsed from netlify.toml itself, not
duplicated here, so the test headers can't drift from the real ones),
plus a fake REST backend for public.progress and public.notes so two
separate Playwright browser contexts can converge against a shared
in-memory store, the way two real browsers converge against Supabase.

Usage: python3 tests/server.py [port] [repo_root]
"""
import functools
import http.server
import json
import re
import sys
import threading
from pathlib import Path

REPO_ROOT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent


def load_headers_from_netlify_toml():
    text = (REPO_ROOT / "netlify.toml").read_text()
    headers = {}
    for name in ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"]:
        m = re.search(re.escape(name) + r'\s*=\s*"((?:[^"\\]|\\.)*)"', text)
        if m:
            headers[name] = m.group(1)
    if "Content-Security-Policy" not in headers:
        raise RuntimeError("Could not parse Content-Security-Policy out of netlify.toml — the test server must send the real headers, not a guess.")
    return headers


HEADERS = load_headers_from_netlify_toml()

# In-memory fake tables, shared across all requests to this server process —
# lets two separate Playwright browser contexts see the same simulated
# backend, like two real browsers hitting Supabase.
FAKE_DB = {}  # progress: {user_id: {data, updated_at}}
FAKE_NOTES_DB = {}  # notes: {user_id: {scope: {scope, body, updated_at}}}
FAKE_DB_LOCK = threading.Lock()
FAIL_NEXT = {"count": 0}  # simple fault injection: next N fake-rest requests fail


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        for name, value in HEADERS.items():
            self.send_header(name, value)
        super().end_headers()

    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _maybe_fail(self):
        if FAIL_NEXT["count"] > 0:
            FAIL_NEXT["count"] -= 1
            return True
        return False

    def _params(self):
        qs = self.path.split("?", 1)[1] if "?" in self.path else ""
        return dict(p.split("=", 1) for p in qs.split("&") if "=" in p)

    def do_GET(self):
        if self.path.startswith("/fake-rest/progress"):
            if self._maybe_fail():
                self._json({"error": "simulated failure"}, 500)
                return
            uid = self._params().get("user_id")
            with FAKE_DB_LOCK:
                row = FAKE_DB.get(uid)
            self._json({"data": row, "error": None})
            return
        if self.path.startswith("/fake-rest/notes"):
            if self._maybe_fail():
                self._json({"error": "simulated failure"}, 500)
                return
            uid = self._params().get("user_id")
            with FAKE_DB_LOCK:
                rows = list(FAKE_NOTES_DB.get(uid, {}).values())
            self._json({"data": rows, "error": None})
            return
        if self.path.startswith("/fake-rest/_debug"):
            with FAKE_DB_LOCK:
                self._json({"progress": FAKE_DB, "notes": FAKE_NOTES_DB})
            return
        if self.path.startswith("/fake-rest/_fail"):
            FAIL_NEXT["count"] = int(self._params().get("n", "1"))
            self._json({"ok": True})
            return
        if self.path.startswith("/fake-rest/_reset"):
            with FAKE_DB_LOCK:
                FAKE_DB.clear()
                FAKE_NOTES_DB.clear()
            FAIL_NEXT["count"] = 0
            self._json({"ok": True})
            return
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/fake-rest/progress"):
            if self._maybe_fail():
                self._json({"error": "simulated failure"}, 500)
                return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
            uid = body.get("user_id")
            with FAKE_DB_LOCK:
                FAKE_DB[uid] = {"data": body.get("data"), "updated_at": body.get("updated_at")}
            self._json({"data": [FAKE_DB[uid]], "error": None})
            return
        if self.path.startswith("/fake-rest/notes"):
            if self._maybe_fail():
                self._json({"error": "simulated failure"}, 500)
                return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
            uid = body.get("user_id")
            scope = body.get("scope")
            row = {"scope": scope, "body": body.get("body"), "updated_at": body.get("updated_at")}
            with FAKE_DB_LOCK:
                FAKE_NOTES_DB.setdefault(uid, {})[scope] = row
            self._json({"data": [row], "error": None})
            return
        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        if self.path.startswith("/fake-rest/notes"):
            if self._maybe_fail():
                self._json({"error": "simulated failure"}, 500)
                return
            params = self._params()
            uid = params.get("user_id")
            scope = params.get("scope")
            with FAKE_DB_LOCK:
                if uid in FAKE_NOTES_DB and scope in FAKE_NOTES_DB[uid]:
                    del FAKE_NOTES_DB[uid][scope]
            self._json({"data": [], "error": None})
            return
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def log_message(self, fmt, *args):
        pass  # keep CI logs focused on the test output, not every static-file GET


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(Handler, directory=str(REPO_ROOT))
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
