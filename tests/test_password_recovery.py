"""
Password recovery: "Forgot password?" always shows the same generic
message regardless of whether the email exists; a simulated recovery
link shows the "Set a new password" card (12-char minimum, confirm
match); cancelling out of a recovery-token session signs it out and
returns to the plain login card; the account menu's "Change password"
reaches the same card voluntarily, and cancelling that just returns to
the still-signed-in app.

Run: python3 tests/test_password_recovery.py [--base-url ...] [--executable-path ...]
Exit code 0 if every check passes, 1 otherwise.
"""
import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
MOCK = (HERE / "mock_supabase.js").read_text()
JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js"

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


def real_errors(errs):
    skip = ["fonts.g", "ERR_CERT", "ERR_NAME_NOT_RESOLVED", "ERR_INTERNET_DISCONNECTED", "favicon"]
    return [e for e in errs if not any(s in e for s in skip)]


def run(base_url, executable_path=None):
    with sync_playwright() as p:
        launch_kwargs = {"executable_path": executable_path} if executable_path else {}
        b = p.chromium.launch(**launch_kwargs)

        print("\n== Forgot password: same generic message regardless of email ==")
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.route("**/*", route_mock)
        page.goto(base_url + "/index.html")
        page.wait_for_timeout(600)
        page.click("#forgotLink")
        page.wait_for_timeout(200)
        check("reset form shown", page.eval_on_selector("#resetForm", "el=>el.hidden") == False)
        page.fill("#resetEmail", "nosuchuser@example.com")
        page.click("#resetSubmit")
        page.wait_for_timeout(200)
        msg1 = page.inner_text("#resetMsg")
        page.click("#resetBack")
        page.wait_for_timeout(200)
        check("back to sign in works", page.eval_on_selector("#loginForm", "el=>el.hidden") == False)
        page.click("#forgotLink")
        page.wait_for_timeout(200)
        page.fill("#resetEmail", "owner@example.com")
        page.click("#resetSubmit")
        page.wait_for_timeout(200)
        msg2 = page.inner_text("#resetMsg")
        check("same generic message regardless of whether email exists", msg1 == msg2 and len(msg1) > 0, repr(msg1) + " vs " + repr(msg2))
        check("no console errors", len(real_errors(errors)) == 0, str(errors))
        ctx.close()

        print("\n== Recovery link -> set new password -> app opens ==")
        ctx2 = b.new_context(viewport={"width": 1280, "height": 900})
        page2 = ctx2.new_page()
        errors2 = []
        page2.on("console", lambda m: errors2.append(m.text) if m.type == "error" else None)
        page2.on("pageerror", lambda e: errors2.append(str(e)))
        page2.route("**/*", route_mock)
        page2.goto(base_url + "/index.html#type=recovery")
        page2.wait_for_timeout(600)
        check("new password form shown from recovery link", page2.eval_on_selector("#newPasswordForm", "el=>el.hidden") == False)
        page2.fill("#newPassword", "short")
        page2.click("#newPasswordSubmit")
        page2.wait_for_timeout(150)
        check("rejects too-short password", "12 characters" in page2.inner_text("#newPasswordError"))
        page2.fill("#newPassword", "longenoughpassword1")
        page2.fill("#newPasswordConfirm", "longenoughpassword2")
        page2.click("#newPasswordSubmit")
        page2.wait_for_timeout(150)
        check("rejects mismatched confirmation", "match" in page2.inner_text("#newPasswordError").lower())
        page2.fill("#newPassword", "longenoughpassword1")
        page2.fill("#newPasswordConfirm", "longenoughpassword1")
        page2.click("#newPasswordSubmit")
        page2.wait_for_timeout(300)
        check("app opens after setting new password", page2.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block")
        check("no console errors", len(real_errors(errors2)) == 0, str(errors2))
        ctx2.close()

        print("\n== Cancel during recovery returns to login ==")
        ctx3 = b.new_context(viewport={"width": 1280, "height": 900})
        page3 = ctx3.new_page()
        page3.route("**/*", route_mock)
        page3.goto(base_url + "/index.html#type=recovery")
        page3.wait_for_timeout(600)
        page3.click("#newPasswordCancel")
        page3.wait_for_timeout(300)
        check("cancel during recovery returns to login card", page3.eval_on_selector("#loginForm", "el=>el.hidden") == False)
        ctx3.close()

        print("\n== Change password from account menu (voluntary) ==")
        ctx4 = b.new_context(viewport={"width": 1280, "height": 900})
        page4 = ctx4.new_page()
        page4.route("**/*", route_mock)
        page4.goto(base_url + "/index.html")
        page4.wait_for_timeout(600)
        page4.fill("#loginEmail", "owner@example.com")
        page4.fill("#loginPassword", "correct-password")
        page4.click("#loginSubmit")
        page4.wait_for_timeout(500)
        page4.click("#accountBtn")
        page4.wait_for_timeout(150)
        page4.click("#menuChangePassword")
        page4.wait_for_timeout(200)
        check("change password form shown voluntarily", page4.eval_on_selector("#newPasswordForm", "el=>el.hidden") == False)
        page4.click("#newPasswordCancel")
        page4.wait_for_timeout(200)
        check("cancel voluntary change returns to app (still signed in)", page4.eval_on_selector("header.nav", "el=>getComputedStyle(el).display") == "block")
        ctx4.close()

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
    print("ALL PASSWORD RECOVERY CHECKS PASSED")


if __name__ == "__main__":
    main()
