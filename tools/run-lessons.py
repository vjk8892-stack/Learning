#!/usr/bin/env python3
"""
Runs every phase-2 (Spark and Delta) lesson's actual shipped code, in
dependency (source) order, in one local SparkSession with Delta and a
temp warehouse — exactly the code tools/extract-lessons.js pulled out of
js/app.js, not a hand-copied re-implementation of it.

A handful of lessons need something other than "just run the try[] then
brk[] code cells in order":
  - p2-runtime-1 and both p2-auto-* lessons are skipped (with a reason)
    because they need a real Fabric/Databricks environment (a runtime
    identity check, and dbutils/cloudFiles/Unity Catalog volumes, which
    don't exist locally) — their Python is still compile-checked.
  - p2-delta-2 needs the real Delta table version captured at runtime
    before substituting it for the lesson text's illustrative "VERSION
    AS OF 1" (the lesson itself tells the human reader to make this
    exact substitution).
  - p2-merge-2 needs one specific statement (the MERGE against duplicate
    source keys) wrapped so failure is the expected, asserted outcome
    rather than a lesson failure.
Both are handled in CUSTOM_HANDLERS below, still executing the lesson's
own extracted code text.

Usage: python3 tools/run-lessons.py [--extracted tools/.extracted/p2.json]
                                     [--report tools/.extracted/lesson-report.json]
Exit code 0 if every lesson ran (or was deliberately skipped) and every
registered check passed; 1 otherwise.
"""
import argparse
import ast
import json
import sys
import tempfile
import time
import traceback
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# "lesson-checks" is not a valid Python module name (hyphen), so load it
# directly from its file path instead of via a normal import statement.
import importlib.util

_spec = importlib.util.spec_from_file_location("lesson_checks", Path(__file__).parent / "lesson-checks.py")
lesson_checks = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(lesson_checks)


SKIP_LESSONS = {
    "p2-runtime-1": "Fabric/Databricks runtime-identity check (spark.version/sys.version) — informational only, no assertable behaviour, and the local CI Spark version deliberately differs from either platform's shipped runtime.",
    "p2-auto-1": "Uses dbutils and Unity Catalog volumes (Databricks-only) — not available outside a real Databricks workspace.",
    "p2-auto-2": "Uses dbutils and Auto Loader's cloudFiles source (Databricks-only) — not available outside a real Databricks workspace.",
}


def split_sql_statements(text):
    """Split a block of SQL text on top-level semicolons, skipping ones
    inside single-quoted string/date literals, and dropping -- line
    comments and blank statements. Good enough for this fixed lesson
    content; not a general SQL parser."""
    statements = []
    buf = []
    in_string = False
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "-" and i + 1 < n and text[i + 1] == "-" and not in_string:
            # line comment: skip to end of line
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "'":
            in_string = not in_string
            buf.append(ch)
            i += 1
            continue
        if ch == ";" and not in_string:
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def run_code_item(item, ns, spark):
    """Execute one {lang, code} cell (a `try`/`brk` list entry). Items with
    no "code" key are prose-only steps for the human reader and are
    skipped."""
    code = item.get("code")
    if not code:
        return
    lang = item.get("lang", "python")
    if lang == "python":
        exec(compile(code, "<lesson>", "exec"), ns)
    elif lang == "sql":
        for stmt in split_sql_statements(code):
            spark.sql(stmt)
    else:
        raise AssertionError(f"unknown lang {lang!r} in lesson code cell")


def run_cell_list(cells, ns, spark):
    if not cells:
        return
    for item in cells:
        if isinstance(item, dict):
            run_code_item(item, ns, spark)


def run_lesson_generic(lesson, ns, spark):
    run_cell_list(lesson.get("try"), ns, spark)
    brk = lesson.get("brk")
    if isinstance(brk, list):
        run_cell_list(brk, ns, spark)
    # a plain string brk is prose-only (no code) — nothing to execute.


def compile_check_lesson(lesson):
    """For skipped lessons: still confirm the Python is at least valid
    syntax, so a real typo in unreachable-in-CI code doesn't go unnoticed
    until someone runs it on a real platform."""
    for cell in (lesson.get("try") or []) + (lesson.get("brk") if isinstance(lesson.get("brk"), list) else []):
        if not isinstance(cell, dict):
            continue
        code = cell.get("code")
        if code and cell.get("lang", "python") == "python":
            ast.parse(code, filename=f"<{lesson['id']} skipped cell>")


def handler_dbx2(lesson, ctx):
    spark = ctx["spark"]
    ns = ctx["ns"]
    try_code = next(c["code"] for c in lesson["try"] if "code" in c)
    exec(compile(try_code, "<lesson>", "exec"), ns)  # creates sales_raw, 7 rows

    brk_code = next(c["code"] for c in lesson["brk"] if "code" in c)
    exec(compile(brk_code, "<lesson>", "exec"), ns)  # appends a duplicate write, 14 rows
    n_after_append = spark.table("sales_raw").count()
    assert n_after_append == 14, f"expected 14 rows after the append-instead-of-overwrite demo, got {n_after_append}"

    # The lesson's last brk step is prose only ("Now run the overwrite cell
    # again to reset"), with no code block of its own — do exactly what it
    # says by re-running the lesson's own try[] cell a second time, rather
    # than writing a separate reset in Python.
    exec(compile(try_code, "<lesson>", "exec"), ns)


def handler_delta3(lesson, ctx):
    spark = ctx["spark"]
    ns = ctx["ns"]
    try_code = next(c["code"] for c in lesson["try"] if "code" in c)
    lesson_checks.expect_raises(
        lambda: exec(compile(try_code, "<lesson>", "exec"), ns),
        "an append with an extra column should be rejected by schema enforcement",
    )
    brk_code = next(c["code"] for c in lesson["brk"] if "code" in c)
    exec(compile(brk_code, "<lesson>", "exec"), ns)  # mergeSchema succeeds, then resets sales_raw


def handler_delta2(lesson, ctx):
    spark = ctx["spark"]
    from delta.tables import DeltaTable

    version_before = (
        DeltaTable.forName(spark, "sales_raw").history(1).select("version").collect()[0]["version"]
    )

    try_code = next(c["code"] for c in lesson["try"] if "code" in c)
    # The lesson text tells the human reader to "Replace 1 with the version
    # number just before your UPDATE" — do exactly that substitution here,
    # with the real captured version, rather than running the placeholder.
    fixed_try = try_code.replace("VERSION AS OF 1", f"VERSION AS OF {version_before}")
    statements = split_sql_statements(fixed_try)
    spark.sql(statements[0])  # UPDATE ... WHERE order_id = 1
    current = spark.sql(statements[1]).collect()[0]  # SELECT current amount
    assert current["amount"] == 720000.0, f"expected order_id=1 to be 720000.0 after the scoped UPDATE, got {current['amount']}"
    original = spark.sql(statements[2]).collect()[0]  # SELECT ... VERSION AS OF <before>
    assert original["amount"] == 72000.0, f"VERSION AS OF the pre-update version should show 72000.0, got {original['amount']}"

    brk_code = next(c["code"] for c in lesson["brk"] if "code" in c)
    fixed_brk = brk_code.replace("VERSION AS OF 1", f"VERSION AS OF {version_before}")
    for stmt in split_sql_statements(fixed_brk):
        spark.sql(stmt)


def handler_merge2(lesson, ctx):
    spark = ctx["spark"]
    ns = ctx["ns"]
    try_code = next(c["code"] for c in lesson["try"] if "code" in c)
    statements = split_sql_statements(try_code)
    for stmt in statements[:-1]:
        spark.sql(stmt)
    lesson_checks.expect_raises(
        lambda: spark.sql(statements[-1]), "MERGE with duplicate matched source rows"
    )
    run_cell_list(lesson.get("brk"), ns, spark)


CUSTOM_HANDLERS = {
    "p2-dbx-2": handler_dbx2,
    "p2-delta-2": handler_delta2,
    "p2-delta-3": handler_delta3,
    "p2-merge-2": handler_merge2,
}


def build_spark(warehouse_dir):
    from pyspark.sql import SparkSession

    builder = (
        SparkSession.builder.appName("learning-lessons-ci")
        .master("local[2]")
        .config("spark.sql.warehouse.dir", str(warehouse_dir))
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
        # Fabric and Databricks both default new tables to Delta. Bare OSS
        # Spark does not: CREATE TABLE (AS SELECT) with no USING clause
        # otherwise falls through to a legacy Hive-table codepath (and even
        # CREATE OR REPLACE TABLE AS SELECT fails outright) unless both of
        # these are set — a well-known gap between local Spark and either
        # real platform, not something the lesson code itself needs to
        # know about.
        .config("spark.sql.legacy.createHiveTableByDefault", "false")
        .config("spark.sql.sources.default", "delta")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "4")
    )
    try:
        from delta import configure_spark_with_delta_pip

        builder = configure_spark_with_delta_pip(builder)
    except ImportError:
        pass
    spark = builder.getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--extracted", default=str(REPO_ROOT / "tools" / ".extracted" / "p2.json"))
    parser.add_argument("--report", default=str(REPO_ROOT / "tools" / ".extracted" / "lesson-report.json"))
    args = parser.parse_args()

    extracted_path = Path(args.extracted)
    if not extracted_path.exists():
        print(f"Extracted lesson JSON not found at {extracted_path}. Run tools/extract-lessons.js first.", file=sys.stderr)
        sys.exit(2)
    data = json.loads(extracted_path.read_text())

    lessons_by_id = {}
    order = []
    for task in data["P2"]["tasks"]:
        for lesson in task.get("subs", []):
            lessons_by_id[lesson["id"]] = lesson
            order.append(lesson["id"])

    warehouse_dir = Path(tempfile.mkdtemp(prefix="learning-lessons-warehouse-"))
    print(f"Temp warehouse: {warehouse_dir}", file=sys.stderr)
    spark = build_spark(warehouse_dir)

    ns = {"spark": spark}
    ctx = {
        "spark": spark,
        "ns": ns,
        "lessons": lessons_by_id,
        "run_cell_list": lambda cells, ns_: run_cell_list(cells, ns_, spark),
    }

    report = {"startedAt": time.time(), "lessons": []}
    failed = False

    for lesson_id in order:
        lesson = lessons_by_id[lesson_id]
        entry = {"id": lesson_id, "title": lesson.get("t")}
        t0 = time.time()
        try:
            if lesson_id in SKIP_LESSONS:
                compile_check_lesson(lesson)
                entry["status"] = "skipped"
                entry["skipReason"] = SKIP_LESSONS[lesson_id]
                print(f"SKIP  {lesson_id}: {SKIP_LESSONS[lesson_id]}")
            else:
                if lesson_id in CUSTOM_HANDLERS:
                    CUSTOM_HANDLERS[lesson_id](lesson, ctx)
                else:
                    run_lesson_generic(lesson, ns, spark)
                if lesson_id in lesson_checks.CHECKS:
                    lesson_checks.CHECKS[lesson_id](spark, ctx)
                    entry["status"] = "checked"
                else:
                    entry["status"] = "ran"
                print(f"OK    {lesson_id} ({entry['status']})")
        except Exception as e:
            entry["status"] = "failed"
            entry["error"] = f"{type(e).__name__}: {e}"
            entry["traceback"] = traceback.format_exc()
            failed = True
            print(f"FAIL  {lesson_id}: {entry['error']}", file=sys.stderr)
            print(entry["traceback"], file=sys.stderr)
        entry["durationMs"] = int((time.time() - t0) * 1000)
        report["lessons"].append(entry)
        if failed:
            break  # dependency order: a later lesson failing on broken state from here is just noise

    report["finishedAt"] = time.time()
    report["ok"] = not failed
    report["lessonCount"] = len(order)
    report["ranOrChecked"] = sum(1 for e in report["lessons"] if e["status"] in ("ran", "checked"))
    report["skipped"] = sum(1 for e in report["lessons"] if e["status"] == "skipped")

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {report_path}", file=sys.stderr)

    spark.stop()

    if failed:
        sys.exit(1)
    print(f"All {report['ranOrChecked']} runnable lessons passed, {report['skipped']} skipped.")


if __name__ == "__main__":
    main()
