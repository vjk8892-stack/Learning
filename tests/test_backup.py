"""
Manual backup/restore and safety snapshots: Download backup produces a
combined progress+notes learning-backup-YYYY-MM-DD.json (IST date),
updates meta.lastBackupAt (shown in both the account menu and the
insights panel, with a dot on the account circle once it's over 7 days
old); Restore from backup previews counts before applying; a safety
snapshot is taken automatically before a destructive action (clear
device here) and survives it (separate storage key), and can be
restored afterward.

Run: python3 tests/test_backup.py [--base-url ...] [--executable-path ...]
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

    with sync_playwright() as p:
        launch_kwargs = {"executable_path": executable_path} if executable_path else {}
        b = p.chromium.launch(**launch_kwargs)

        print("\n== Download backup: filename, contents, meta, insights panel, dot ==")
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
        page.click("#expandAll")
        page.wait_for_timeout(200)
        page.locator(".task input").nth(0).click(force=True)
        page.wait_for_timeout(300)
        page.click('[data-notes-scope="p1"]')
        page.wait_for_timeout(300)
        page.fill("#notesTextarea", "backup test note")
        page.wait_for_timeout(300)
        page.click("#notesClose")
        page.wait_for_timeout(1300)

        page.click("#accountBtn")
        page.wait_for_timeout(150)
        check("backup-due dot shown before any backup", page.eval_on_selector("#backupDueDot", "el=>el.hidden") == False)
        with page.expect_download() as dl:
            page.click("#menuDownloadBackup")
        backup_json = pathlib.Path(dl.value.path()).read_text()
        check(
            "backup filename matches learning-backup-*.json",
            dl.value.suggested_filename.startswith("learning-backup-") and dl.value.suggested_filename.endswith(".json"),
            dl.value.suggested_filename,
        )
        parsed_backup = json.loads(backup_json)
        check("backup contains progress items", "p0-a" in parsed_backup["progress"]["items"])
        check("backup contains the note", parsed_backup["notes"]["notes"].get("p1", {}).get("body") == "backup test note")
        page.click("#accountBtn")
        page.wait_for_timeout(150)
        check("backup-due dot hidden right after a backup", page.eval_on_selector("#backupDueDot", "el=>el.hidden") == True)
        check("account menu hint shows last backup time", "Last manual backup" in page.inner_text("#backupHint"))

        page.click("#insightsPill")
        page.wait_for_timeout(200)
        check("insights panel shows last manual backup line", "Last manual backup" in page.inner_text("#ipLastBackup"))
        check("no console errors", len(real_errors(errors)) == 0, str(real_errors(errors)))
        ctx.close()

        print("\n== Restore from a pasted backup into a fresh session (preview -> confirm) ==")
        reset_backend()
        ctx2 = b.new_context(viewport={"width": 1280, "height": 900})
        page2 = ctx2.new_page()
        page2.route("**/*", route_mock)
        page2.goto(base_url + "/index.html")
        page2.wait_for_timeout(600)
        login(page2)
        page2.wait_for_timeout(900)
        page2.click("#accountBtn")
        page2.wait_for_timeout(150)
        page2.click("#menuRestoreBackup")
        page2.wait_for_timeout(200)
        page2.fill("#ioText", backup_json)
        page2.click("#ioPrimary")
        page2.wait_for_timeout(200)
        check("preview shows counts before applying", "Found" in page2.inner_text("#ioHint"))
        check("primary button now says confirm", "Confirm" in page2.inner_text("#ioPrimary"))
        page2.click("#ioPrimary")
        page2.wait_for_timeout(500)
        note_after_restore = page2.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-notes-v1')).notes.p1.body")
        check("note restored from backup", note_after_restore == "backup test note")
        checked = page2.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))")
        check("progress item restored from backup", "p0-a" in checked, str(checked))
        ctx2.close()

        print("\n== Safety snapshot: taken before clear-device, survives it, restorable after ==")
        reset_backend()
        ctx3 = b.new_context(viewport={"width": 1280, "height": 900})
        page3 = ctx3.new_page()
        page3.route("**/*", route_mock)
        page3.goto(base_url + "/index.html")
        page3.wait_for_timeout(600)
        login(page3)
        page3.click("#expandAll")
        page3.wait_for_timeout(200)
        page3.locator(".task input").nth(2).click(force=True)
        page3.wait_for_timeout(1300)
        ticked_id = page3.locator(".task input").nth(2).get_attribute("data-task")

        page3.click("#accountBtn")
        page3.wait_for_timeout(150)
        page3.click("#menuClearDevice")
        page3.wait_for_timeout(200)
        if page3.eval_on_selector("#syncWarn", "el=>el.hidden") == False:
            page3.click("#syncWarnProceed")
        page3.wait_for_timeout(600)
        check(
            "clear-device actually cleared progress",
            page3.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-path-v3')||'{\"items\":{}}').items") == {},
        )
        snapshot_survived = page3.evaluate("JSON.parse(window.localStorage.getItem('ssis-to-fabric-path-safety')||'[]').length")
        check("a safety snapshot survived the clear-device wipe (separate key)", snapshot_survived >= 1, str(snapshot_survived))

        login(page3)
        page3.wait_for_timeout(900)
        page3.click("#accountBtn")
        page3.wait_for_timeout(150)
        page3.click("#menuRestoreSafety")
        page3.wait_for_timeout(200)
        check("safety snapshot preview shown", "snapshot" in page3.inner_text("#ioHint").lower())
        page3.click("#ioPrimary")
        page3.wait_for_timeout(500)
        checked3 = page3.eval_on_selector_all("input[data-task]:checked", "els=>els.map(e=>e.getAttribute('data-task'))")
        check("ticked task recovered from safety snapshot", ticked_id in checked3, str(checked3) + " looking for " + str(ticked_id))
        ctx3.close()

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
    print("ALL BACKUP/RESTORE CHECKS PASSED")


if __name__ == "__main__":
    main()
