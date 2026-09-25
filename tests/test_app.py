"""
Consolidated Playwright suite for CI: login gate, reload and two-context
persistence, offline/online resync, notes autosave, the conflict dialog,
export/import, XSS safety in notes, sign-out and clear-device, IST
formatting across device time zones, 390px/1890px layout, console
cleanliness, and a JS-cost budget check — all against tests/server.py
(which sends the real netlify.toml headers) with the Supabase client
replaced by tests/mock_supabase.js.

Run: python3 tests/test_app.py [--base-url http://127.0.0.1:8765]
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


def make_helpers(base_url):
    def reset_backend():
        urllib.request.urlopen(base_url + "/fake-rest/_reset")

    def debug_db():
        return json.loads(urllib.request.urlopen(base_url + "/fake-rest/_debug").read())

    return reset_backend, debug_db


def route_mock(route):
    if route.request.url == JSDELIVR_URL:
        route.fulfill(status=200, content_type="application/javascript", body=MOCK)
    else:
        route.continue_()


def new_ctx(b, viewport=None, timezone_id=None, reduced_motion=None):
    kwargs = {"viewport": viewport or {"width": 1280, "height": 900}}
    if timezone_id:
        kwargs["timezone_id"] = timezone_id
    if reduced_motion:
        kwargs["reduced_motion"] = reduced_motion
    ctx = b.new_context(**kwargs)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("**/*", route_mock)
    return ctx, page, errors


def login(page, email="owner@example.com", pw="correct-password"):
    page.fill("#loginEmail", email)
    page.fill("#loginPassword", pw)
    page.click("#loginSubmit")
    page.wait_for_timeout(500)


def real_errors(errs):
    skip = ["fonts.g", "ERR_CERT", "ERR_NAME_NOT_RESOLVED", "ERR_INTERNET_DISCONNECTED", "favicon"]
    return [e for e in errs if not any(s in e for s in skip)]


def run(base_url, executable_path=None):
    reset_backend, debug_db = make_helpers(base_url)

    with sync_playwright() as p:
        launch_kwargs = {"executable_path": executable_path} if executable_path else {}
        b = p.chromium.launch(**launch_kwargs)

        print("\n== 1. Login gate ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        check("splash then login card, app hidden", page.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "none")
        check("login form visible", page.eval_on_selector("#loginForm", "el=>el.hidden") == False)
        page.fill("#loginEmail", "owner@example.com")
        page.fill("#loginPassword", "wrong")
        page.click("#loginSubmit")
        page.wait_for_timeout(300)
        err1 = page.inner_text("#loginError")
        page.fill("#loginEmail", "nosuchuser@example.com")
        page.fill("#loginPassword", "whatever")
        page.click("#loginSubmit")
        page.wait_for_timeout(300)
        err2 = page.inner_text("#loginError")
        check("generic error doesn't reveal whether email exists", err1 == err2 and len(err1) > 0)
        login(page)
        check("login reveals app", page.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block")
        check("no console errors after login", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== 2. Reload persistence ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.reload()
        page.wait_for_timeout(700)
        check(
            "session persists across reload (no login card)",
            page.eval_on_selector("#loginForm", "el=>el.hidden") == True
            and page.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block",
        )
        ctx.close()

        print("\n== 3. Two-context persistence / convergence ==")
        reset_backend()
        ctxA, pageA, errA = new_ctx(b)
        pageA.goto(base_url + "/index.html")
        pageA.wait_for_timeout(600)
        login(pageA)
        pageA.click("#expandAll")
        pageA.wait_for_timeout(200)
        inputsA = pageA.query_selector_all(".task input")
        inputsA[0].click(force=True)
        pageA.wait_for_timeout(300)
        inputsA[1].click(force=True)
        pageA.wait_for_timeout(1200)
        idsA = sorted(pageA.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))"))

        ctxB, pageB, errB = new_ctx(b)
        pageB.goto(base_url + "/index.html")
        pageB.wait_for_timeout(600)
        login(pageB)
        pageB.wait_for_timeout(900)
        idsB = sorted(pageB.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))"))
        check("second context adopts first context's progress on login", idsA == idsB, str(idsA) + " vs " + str(idsB))
        check("console errors A", len(real_errors(errA)) == 0, str(real_errors(errA)))
        check("console errors B", len(real_errors(errB)) == 0, str(real_errors(errB)))
        ctxA.close()
        ctxB.close()

        print("\n== 4. Offline then online resync ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        ctx.set_offline(True)
        page.click("#expandAll")
        page.wait_for_timeout(200)
        page.query_selector(".task input").click(force=True)
        page.wait_for_timeout(1200)
        check("offline state shown", "Offline" in page.inner_text("#pillSaved"))
        ctx.set_offline(False)
        page.evaluate("window.dispatchEvent(new Event('online'))")
        page.wait_for_timeout(1200)
        check("resyncs to Saved after coming online", page.inner_text("#pillSaved").startswith("Saved"))
        remote = debug_db()
        check("remote reflects the offline change", bool(remote["progress"].get(UID)))
        ctx.close()

        print("\n== 5. Notes autosave ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.click('[data-notes-scope="p1"]')
        page.wait_for_timeout(300)
        page.fill("#notesTextarea", "autosave check #tag1")
        page.wait_for_timeout(1300)
        remote = debug_db()
        check("note autosaved to backend", remote["notes"].get(UID, {}).get("p1", {}).get("body") == "autosave check #tag1")
        check("dot appears on phase notes button", page.eval_on_selector('[data-notes-scope="p1"] .notes-dot', "el=>el.classList.contains('on')"))
        ctx.close()

        print("\n== 6. Conflict dialog ==")
        reset_backend()
        req = urllib.request.Request(
            base_url + "/fake-rest/notes",
            data=json.dumps({"user_id": UID, "scope": "p2", "body": "remote side", "updated_at": "2026-09-24T12:00:00.000Z"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req)
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.add_init_script(
            """
              window.localStorage.setItem('ssis-to-fabric-notes-v1', JSON.stringify({
                v:1, notes: { p2: { body: 'local side', localUpdatedAt: Date.now(), serverUpdatedAt: 0, dirty: true } }
              }));
            """
        )
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.wait_for_timeout(900)
        page.click('[data-notes-scope="p2"]')
        page.wait_for_timeout(400)
        check("conflict dialog shown", page.eval_on_selector("#conflictDialog", "el=>el.hidden") == False)
        check(
            "both versions shown",
            "local side" in page.inner_text("#conflictLocalBody") and "remote side" in page.inner_text("#conflictRemoteBody"),
        )
        page.click("#conflictUseTheirs")
        page.wait_for_timeout(300)
        check("Use theirs adopts remote text", page.eval_on_selector("#notesTextarea", "el=>el.value") == "remote side")
        ctx.close()

        print("\n== 7. Export / import (progress and notes) ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.click("#expandAll")
        page.wait_for_timeout(200)
        page.query_selector(".task input").click(force=True)
        page.wait_for_timeout(300)
        page.click('[data-notes-scope="p0"]')
        page.wait_for_timeout(300)
        page.fill("#notesTextarea", "export test note")
        page.wait_for_timeout(1300)
        page.click("#notesClose")
        page.wait_for_timeout(300)
        page.click("#accountBtn")
        page.wait_for_timeout(150)
        with page.expect_download() as dl:
            page.click("#menuExportNotesJson")
        notes_json = pathlib.Path(dl.value.path()).read_text()
        page.click("#exportProgress")
        page.wait_for_timeout(300)
        progress_json = page.eval_on_selector("#ioText", "el=>el.value")
        page.click("#ioClose")

        ctx2, page2, errors2 = new_ctx(b)
        page2.goto(base_url + "/index.html")
        page2.wait_for_timeout(600)
        login(page2)
        page2.click("#importProgress")
        page2.wait_for_timeout(200)
        page2.fill("#ioText", progress_json)
        page2.click("#ioPrimary")
        page2.wait_for_timeout(400)
        checked2 = page2.eval_on_selector_all("input[data-task]:checked", "els=>els.length")
        check("progress import restored ticked task", checked2 >= 1)
        page2.click("#accountBtn")
        page2.wait_for_timeout(150)
        page2.click("#menuImportNotes")
        page2.wait_for_timeout(200)
        page2.fill("#ioText", notes_json)
        page2.click("#ioPrimary")
        page2.wait_for_timeout(400)
        imported_notes = page2.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-notes-v1'))")
        check("notes import restored note", imported_notes["notes"].get("p0", {}).get("body") == "export test note")
        ctx.close()
        ctx2.close()

        print("\n== 8. XSS attempts in notes render as inert text ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        dialog_fired = {"v": False}
        page.on("dialog", lambda d: (dialog_fired.update(v=True), d.dismiss()))
        page.click('[data-notes-scope="scratch"]')
        page.wait_for_timeout(300)
        payload = "<img src=x onerror=alert(1)>\n[click me](javascript:alert(1))\n<script>alert(2)</script>"
        page.fill("#notesTextarea", payload)
        page.wait_for_timeout(1300)
        page.click("#notesTabPreview")
        page.wait_for_timeout(200)
        preview_html = page.eval_on_selector("#notesPreview", "el=>el.innerHTML")
        check("no JS dialog fired", dialog_fired["v"] == False)
        check("<img onerror> is not a real tag", "<img" not in preview_html)
        check("<script> is not a real tag", "<script>" not in preview_html)
        check("javascript: not turned into a real anchor", '<a href="javascript' not in preview_html)
        check("no console errors from XSS attempt", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== 9. Sign out and clear device ==")
        reset_backend()
        ctx, page, errors = new_ctx(b)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.click("#expandAll")
        page.wait_for_timeout(200)
        page.query_selector(".task input").click(force=True)
        page.wait_for_timeout(1300)
        page.click("#accountBtn")
        page.wait_for_timeout(150)
        page.click("#menuClearDevice")
        page.wait_for_timeout(600)
        check("clear-device signs out", page.eval_on_selector("#loginForm", "el=>el.hidden") == False)
        check("v2 cleared", page.evaluate("window.localStorage.getItem('ssis-to-fabric-path-v2')") in (None, "{}"))
        check("v3 cleared", page.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-path-v3')||'{\"items\":{}}').items") == {})
        check("notes cleared", page.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-notes-v1')||'{\"notes\":{}}').notes") == {})
        login(page)
        page.wait_for_timeout(900)
        # Clear-device only wipes THIS device's local storage; it does not
        # delete cloud data, so a re-login legitimately pulls the
        # previously-synced progress back down. That is the documented,
        # intended behaviour, not a bug.
        checked_after = page.eval_on_selector_all("input[data-task]:checked", "els=>els.length")
        check("clear-device wipes local storage but cloud progress survives and re-syncs on next login (by design)", checked_after >= 1)
        ctx.close()

        print("\n== 10. IST formatting, device timezone UTC and America/New_York ==")
        reset_backend()
        times = {}
        for tz in ["UTC", "America/New_York", "Asia/Kolkata"]:
            ctx, page, errors = new_ctx(b, timezone_id=tz)
            page.goto(base_url + "/index.html")
            page.wait_for_timeout(600)
            login(page)
            page.click("#expandAll")
            page.wait_for_timeout(200)
            page.query_selector(".task input").click(force=True)
            page.wait_for_timeout(1500)
            times[tz] = page.inner_text("#pillSaved")
            ctx.close()
        check("same IST time shown regardless of device tz", times["UTC"] == times["America/New_York"] == times["Asia/Kolkata"], str(times))
        check("time string ends with IST", times["UTC"].strip().endswith("IST"))

        print("\n== 11. 390px layout ==")
        reset_backend()
        ctx, page, errors = new_ctx(b, viewport={"width": 390, "height": 844})
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        sw = page.evaluate("document.documentElement.scrollWidth")
        vw = page.evaluate("window.innerWidth")
        check("no horizontal overflow at 390px (app view)", sw == vw, str(sw))
        page.click('[data-notes-scope="p0"]')
        page.wait_for_timeout(1300)
        sw2 = page.evaluate("document.documentElement.scrollWidth")
        check("no overflow at 390px with drawer open", sw2 == vw, str(sw2))
        check("drawer is a bottom sheet at 390px", page.eval_on_selector("#notesDrawer", "el=>getComputedStyle(el).left") == "0px")
        page.click("#notesClose")
        page.wait_for_timeout(1300)
        page.click("#insightsPill")
        page.wait_for_timeout(200)
        sw3 = page.evaluate("document.documentElement.scrollWidth")
        check("no overflow at 390px with insights panel open", sw3 == vw, str(sw3))
        check("insights pill collapses to ring+dot at 390px", page.eval_on_selector(".ip-pct", "el=>getComputedStyle(el).display") == "none")
        check("no console errors at 390px", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== 12. 1890px layout ==")
        reset_backend()
        ctx, page, errors = new_ctx(b, viewport={"width": 1890, "height": 1000})
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        check("rail visible at 1890px", page.eval_on_selector("#rail", "el=>getComputedStyle(el).display") == "block")
        check("orbit visible at 1890px", page.eval_on_selector("#orbit", "el=>getComputedStyle(el).display") == "block")
        page.click('[data-notes-scope="p0"]')
        page.wait_for_timeout(1300)
        check("drawer is right-hand panel at 1890px (not full width)", page.eval_on_selector("#notesDrawer", "el=>el.getBoundingClientRect().width") < 900)
        check("no console errors at 1890px", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== 13. JS cost budget (idle + scroll, 1890px) ==")
        reset_backend()
        ctx, page, errors = new_ctx(b, viewport={"width": 1890, "height": 1000})
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        login(page)
        page.click("#expandAll")
        page.wait_for_timeout(1500)
        page.evaluate(
            """() => {
              window.__rafTotal = 0; window.__rafCount = 0;
              var orig = window.requestAnimationFrame;
              window.requestAnimationFrame = function(cb) {
                return orig(function(ts) {
                  var t0 = performance.now();
                  cb(ts);
                  window.__rafTotal += performance.now() - t0;
                  window.__rafCount++;
                });
              };
            }"""
        )
        page.wait_for_timeout(2000)
        idle_total = page.evaluate("window.__rafTotal")
        idle_ms_per_s = idle_total / 2.0
        page.evaluate("window.__rafTotal = 0;")
        for i in range(0, 4000, 200):
            page.mouse.wheel(0, 200)
            page.wait_for_timeout(60)
        scroll_total = page.evaluate("window.__rafTotal")
        scroll_ms_per_s = scroll_total / 1.2
        dom_nodes = page.evaluate("document.querySelectorAll('*').length")
        print("idle JS: %.2f ms/s" % idle_ms_per_s)
        print("scroll JS: %.2f ms/s" % scroll_ms_per_s)
        print("DOM nodes: %d" % dom_nodes)
        # Generous thresholds — this asserts nothing has gone badly wrong
        # (a runaway per-frame redraw, an accidental polling loop), not a
        # tight regression budget. See CLAUDE.md "Design decisions" for the
        # actual measured numbers to compare against by eye.
        check("idle JS not wildly over budget (<25 ms/s)", idle_ms_per_s < 25, str(idle_ms_per_s))
        check("scroll JS not wildly over budget (<40 ms/s)", scroll_ms_per_s < 40, str(scroll_ms_per_s))
        check("no console errors during scroll", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        b.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8765")
    parser.add_argument("--executable-path", default=None, help="Override the Chromium binary Playwright launches (rarely needed — only if a pinned Playwright version and a pre-installed browser cache disagree, e.g. in some dev sandboxes).")
    args = parser.parse_args()

    run(args.base_url, executable_path=args.executable_path)

    print("\n" + "=" * 60)
    if FAILURES:
        print("FAILURES (%d):" % len(FAILURES))
        for f in FAILURES:
            print(" -", f)
        sys.exit(1)
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    main()
