"""
Session expiry without losing data: a 401/expired-JWT error during a save
triggers one refreshSession() attempt; if that succeeds, the save is
retried transparently (no banner shown). If it fails, the change stays
dirty in localStorage (never cleared), a non-blocking banner shows
("Session expired... Sign in to sync") while the app stays fully usable,
and only clicking the banner's own button brings up the login card as an
overlay. Confirms the exact scenario asked for: edit a note and tick a
task while expired, sign in, and nothing is lost or duplicated.

Run: python3 tests/test_session_expiry.py [--base-url ...] [--executable-path ...]
Exit code 0 if every check passes, 1 otherwise.
"""
import argparse
import json
import pathlib
import sys
import urllib.request

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
MOCK = (HERE / "mock_supabase.js").read_text()
JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js"
UID = "user-owner-1"

FAILURES = []


def check(label, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(("%-6s " % status) + label + ((" -- " + detail) if detail else ""))
    if not cond:
        FAILURES.append(label)


def route_mock(route):
    if route.request.url == JSDELIVR_URL:
        route.fulfill(status=200, content_type="application/javascript", body=MOCK)
    else:
        route.continue_()


def login(page):
    page.fill("#loginEmail", "owner@example.com")
    page.fill("#loginPassword", "correct-password")
    page.click("#loginSubmit")
    page.wait_for_timeout(500)


def real_errors(errs):
    skip = ["fonts.g", "ERR_CERT", "ERR_NAME_NOT_RESOLVED", "ERR_INTERNET_DISCONNECTED", "favicon"]
    return [e for e in errs if not any(s in e for s in skip)]


def run(base_url, executable_path=None):
    def reset_backend():
        urllib.request.urlopen(base_url + "/fake-rest/_reset")

    def debug_db():
        return json.loads(urllib.request.urlopen(base_url + "/fake-rest/_debug").read())

    with sync_playwright() as p:
        launch_kwargs = {"executable_path": executable_path} if executable_path else {}
        b = p.chromium.launch(**launch_kwargs)

        print("\n== Refresh succeeds: transparent retry, no banner ==")
        reset_backend()
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.route("**/*", route_mock)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.evaluate("window.__mockForce401Count = 1")
        page.click("#expandAll")
        page.wait_for_timeout(200)
        page.locator(".task input").nth(0).click(force=True)
        page.wait_for_timeout(1500)
        check("no expired banner shown when refresh succeeds", page.eval_on_selector("#expiredBanner", "el=>el.hidden") == True)
        check("gate stays closed", page.eval_on_selector("#gate", "el=>el.hidden") == True)
        check("save eventually succeeds after transparent refresh+retry", page.inner_text("#pillSaved").startswith("Saved"))
        remote = debug_db()
        check("change reached the backend", bool(remote["progress"].get(UID)))
        check("no console errors", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== Refresh fails: non-blocking banner, edit while expired, sign in, no loss/duplication ==")
        reset_backend()
        ctx2 = b.new_context(viewport={"width": 1280, "height": 900})
        page2 = ctx2.new_page()
        errors2 = []
        page2.on("console", lambda m: errors2.append(m.text) if m.type == "error" else None)
        page2.on("pageerror", lambda e: errors2.append(str(e)))
        page2.route("**/*", route_mock)
        page2.goto(base_url + "/index.html")
        page2.wait_for_timeout(600)
        login(page2)
        page2.evaluate("window.__mockRefreshShouldFail = true; window.__mockForce401Count = 1")
        page2.click("#expandAll")
        page2.wait_for_timeout(200)
        page2.locator(".task input").nth(0).click(force=True)
        page2.wait_for_timeout(1500)
        check("expired banner shown (not the blocking gate)", page2.eval_on_selector("#expiredBanner", "el=>el.hidden") == False)
        check("gate stays closed while banner shows", page2.eval_on_selector("#gate", "el=>el.hidden") == True)
        check("app fully visible and usable", page2.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block")

        page2.evaluate("window.__mockForce401Count = 5")
        page2.click('[data-notes-scope="p0"]')
        page2.wait_for_timeout(300)
        page2.fill("#notesTextarea", "written while expired")
        page2.wait_for_timeout(300)
        page2.click("#notesClose")
        page2.wait_for_timeout(1300)
        page2.locator(".task input").nth(1).click(force=True)
        page2.wait_for_timeout(500)

        checked_before = sorted(page2.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))"))
        note_before = page2.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-notes-v1')).notes.p0.body")
        check("both task edits registered locally while expired", len(checked_before) == 2, str(checked_before))
        check("note edit registered locally while expired", note_before == "written while expired")

        page2.click("#expiredBannerSignIn")
        page2.wait_for_timeout(200)
        check("login card appears as an overlay", page2.eval_on_selector("#loginForm", "el=>el.hidden") == False)
        check("app still visible behind the overlay", page2.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block")
        page2.evaluate("window.__mockRefreshShouldFail = false; window.__mockForce401Count = 0")
        page2.fill("#loginEmail", "owner@example.com")
        page2.fill("#loginPassword", "correct-password")
        page2.click("#loginSubmit")
        page2.wait_for_timeout(1500)

        check("gate closes after signing back in", page2.eval_on_selector("#gate", "el=>el.hidden") == True)
        check("expired banner hidden after signing back in", page2.eval_on_selector("#expiredBanner", "el=>el.hidden") == True)
        checked_after = sorted(page2.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))"))
        check("no duplication after resync", checked_after == checked_before, str(checked_after))
        remote2 = debug_db()
        remote_items = (remote2["progress"].get(UID) or {}).get("data", {}).get("items", {})
        check("both task edits reached the backend after recovery", len([k for k in remote_items if remote_items[k][0]]) == 2, str(remote_items))
        note_remote = remote2["notes"].get(UID, {}).get("p0", {}).get("body")
        check("the note reached the backend after recovery", note_remote == "written while expired", str(note_remote))
        check("no console errors", len(real_errors(errors2)) == 0, str(real_errors(errors2)))
        ctx2.close()

        b.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8765")
    parser.add_argument("--executable-path", default=None)
    args = parser.parse_args()

    run(args.base_url, executable_path=args.executable_path)

    print("\n" + "=" * 60)
    if FAILURES:
        print("FAILURES (%d):" % len(FAILURES))
        for f in FAILURES:
            print(" -", f)
        sys.exit(1)
    print("ALL SESSION EXPIRY CHECKS PASSED")


if __name__ == "__main__":
    main()
