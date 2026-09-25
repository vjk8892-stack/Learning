"""
Assertion functions for the phase-2 (Spark and Delta) and phase-3
(Warehouse and migration) lesson code, run by tools/run-lessons.py after
it executes each lesson's actual shipped code (pulled from js/app.js by
tools/extract-lessons.js).

Each function is registered in CHECKS under its lesson id and takes
(spark, ctx). ctx is the shared run context tools/run-lessons.py builds:
ctx["ns"] is the exec namespace lesson code ran in, ctx["lessons"] is the
id -> lesson dict from the extracted JSON (so a check can re-run a
lesson's own shipped code, e.g. to confirm a MERGE is idempotent, without
duplicating that code as a separate copy here), and ctx["run_cell_list"]
executes a list of try/brk-style cells the same way tools/run-lessons.py
did for the lesson itself. A check raises AssertionError (with a message
naming the mismatch) on failure. A lesson with no entry here still ran;
it's just not asserted beyond "the code executed without raising".
"""
import contextlib
import io

CHECKS = {}


def check(lesson_id):
    def wrap(fn):
        CHECKS[lesson_id] = fn
        return fn

    return wrap


def _row_count(spark, table):
    return spark.table(table).count()


def _amount_for_order(spark, table, order_id):
    row = spark.table(table).filter(f"order_id = {order_id}").select("amount").collect()
    assert len(row) == 1, f"expected exactly one row for order_id={order_id} in {table}, got {len(row)}"
    return row[0]["amount"]


def capture_explain(df, mode=None):
    """Capture DataFrame.explain() output as a string via stdout redirection,
    rather than relying on any private/internal API, so this stays stable
    across Spark versions."""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        if mode:
            df.explain(mode)
        else:
            df.explain()
    return buf.getvalue()


def expect_raises(fn, what):
    try:
        fn()
    except Exception:
        return
    raise AssertionError(f"expected an exception ({what}) but none was raised")


@check("p2-dbx-2")
def _check_sales_raw(spark, ctx):
    n = _row_count(spark, "sales_raw")
    assert n == 7, f"sales_raw should have 7 rows after a clean overwrite, got {n}"


@check("p2-df-3")
def _check_dedup(spark, ctx):
    # The shipped code binds its result to `dedup` — read that directly
    # rather than re-deriving it, so this asserts on what the real lesson
    # code actually produced.
    dedup = ctx["ns"]["dedup"]
    n = dedup.count()
    assert n == 6, f"deduplicated sales_raw should have 6 rows, got {n}"


@check("p2-df-1")
def _check_df1(spark, ctx):
    # The shipped code binds its result to `result` — read that directly.
    result = ctx["ns"]["result"].collect()
    assert len(result) >= 2, f"expected at least 2 rows above the spend threshold, got {len(result)}"
    first, second = result[0], result[1]
    assert first["customer_id"] == "C001", f"expected C001 first, got {first['customer_id']}"
    assert first["orders"] == 2 and first["spend"] == 87500, f"expected C001 (2, 87500), got ({first['orders']}, {first['spend']})"
    assert second["customer_id"] == "C003", f"expected C003 second, got {second['customer_id']}"
    assert second["orders"] == 1 and second["spend"] == 71000, f"expected C003 (1, 71000), got ({second['orders']}, {second['spend']})"


@check("p2-df-2")
def _check_df2(spark, ctx):
    # The shipped code's join and count calls are inline (piped straight
    # into .show()/print(), never bound to a variable), so there is nothing
    # to read back from the exec namespace here. `customers` and `s`
    # themselves ARE bound and come from the real run, so re-run the same
    # join expression the lesson shows — over those same real objects,
    # not reconstructed data — to get an assertable result.
    customers = ctx["ns"]["customers"]
    s = ctx["ns"]["s"]
    left = s.join(customers, "customer_id", "left").select("order_id", "customer_id", "city", "amount")
    c004_rows = left.filter("customer_id = 'C004'").collect()
    assert len(c004_rows) >= 1, "expected at least one row for C004"
    assert all(r["city"] is None for r in c004_rows), "C004 should have no city after the left join"

    base_count = s.count()
    dup_count = s.join(customers.union(customers), "customer_id", "left").count()
    assert dup_count > base_count, (
        f"joining against a duplicated customers table should return more than {base_count} rows, got {dup_count}"
    )


@check("p2-delta-2")
def _check_delta2(spark, ctx):
    # The actual UPDATE / VERSION AS OF / RESTORE sequence runs from
    # tools/run-lessons.py's custom handler for this lesson (it needs to
    # capture the real pre-update version number dynamically, since the
    # lesson text's hardcoded "VERSION AS OF 1" assumes this is the
    # table's very first version, which won't hold once earlier lessons
    # have already written a few versions of sales_raw in this harness).
    # This function only re-confirms the end state: the table is back to
    # its original, clean values after RESTORE.
    n = _row_count(spark, "sales_raw")
    assert n == 7, f"sales_raw should still have 7 rows after restore, got {n}"
    amt = _amount_for_order(spark, "sales_raw", 1)
    assert amt == 72000.0, f"order_id=1 should be back to its original amount 72000.0 after RESTORE, got {amt}"


@check("p2-delta-3")
def _check_delta3(spark, ctx):
    n = _row_count(spark, "sales_raw")
    assert n == 7, f"sales_raw should be back to 7 rows after the overwriteSchema reset, got {n}"
    cols = spark.table("sales_raw").columns
    assert "coupon" not in cols, "sales_raw should be back to its original schema (no 'coupon' column) after the reset"


@check("p2-merge-1")
def _check_merge1(spark, ctx):
    n = _row_count(spark, "sales_silver")
    assert n == 8, f"sales_silver should have 8 rows after the MERGE, got {n}"
    amt = _amount_for_order(spark, "sales_silver", 3)
    assert amt == 16500.0, f"order_id=3 in sales_silver should be 16500.0 after the MERGE, got {amt}"

    # "Run the same MERGE a second time. Nothing changes" — rerun the lesson's
    # own shipped code (not a re-typed copy of it) and reconfirm.
    lesson = ctx["lessons"]["p2-merge-1"]
    ctx["run_cell_list"](lesson["try"], ctx["ns"])
    n2 = _row_count(spark, "sales_silver")
    assert n2 == 8, f"sales_silver should still have 8 rows after rerunning the MERGE, got {n2}"
    amt2 = _amount_for_order(spark, "sales_silver", 3)
    assert amt2 == 16500.0, f"order_id=3 should still be 16500.0 after rerunning the MERGE, got {amt2}"


@check("p2-merge-2")
def _check_merge2(spark, ctx):
    # The MERGE-fails-on-duplicate-keys / dedup-fixes-it assertions are made
    # inline by tools/run-lessons.py's custom handler for this lesson (it
    # needs expect_raises() wrapped around one specific statement out of a
    # multi-statement SQL block). This just reconfirms the fixed state: one
    # row for order_id=3 in sales_silver, no duplicate inserted by the fix.
    rows = spark.table("sales_silver").filter("order_id = 3").collect()
    assert len(rows) == 1, f"order_id=3 should still be exactly one row in sales_silver, got {len(rows)}"


@check("p2-merge-4")
def _check_merge4(spark, ctx):
    dim = spark.table("dim_customer")
    c001_rows = dim.filter("customer_id = 'C001'").collect()
    assert len(c001_rows) == 2, f"C001 should have 2 rows in dim_customer (history kept), got {len(c001_rows)}"
    c001_current = [r for r in c001_rows if r["is_current"]]
    assert len(c001_current) == 1, "C001 should have exactly one current row"
    assert c001_current[0]["city"] == "Mysuru", f"C001's current city should be Mysuru, got {c001_current[0]['city']}"

    c004_rows = dim.filter("customer_id = 'C004'").collect()
    assert len(c004_rows) >= 1, "C004 should be a new row in dim_customer"
    assert any(r["is_current"] for r in c004_rows), "C004 should have a current row"

    import pyspark.sql.functions as F

    counts = (
        dim.groupBy("customer_id")
        .agg(F.sum(F.col("is_current").cast("int")).alias("n_current"))
        .collect()
    )
    for r in counts:
        assert r["n_current"] == 1, f"{r['customer_id']} should have exactly one current row, got {r['n_current']}"

    # "Run step 1 and step 2 again straight away. Nothing changes" — rerun
    # the lesson's own shipped SQL cells (steps 1 and 2, not the seed cell)
    # and confirm the row count is unchanged.
    before = dim.count()
    lesson = ctx["lessons"]["p2-merge-4"]
    step1_and_2 = [c for c in lesson["try"] if "code" in c][1:]
    ctx["run_cell_list"](step1_and_2, ctx["ns"])
    after = spark.table("dim_customer").count()
    assert after == before, f"rerunning the SCD2 steps with no new changes should leave row count at {before}, got {after}"


@check("p2-maint-1")
def _check_maint1(spark, ctx):
    n = _row_count(spark, "sales_small_files")
    assert n == 200, f"sales_small_files should have 200 rows (20 appends of 10), got {n}"
    num_files = spark.sql("DESCRIBE DETAIL sales_small_files").collect()[0]["numFiles"]
    # "about 20 files" — generous range, since exact file counts can vary
    # with local parallelism/core count.
    assert 10 <= num_files <= 40, f"expected roughly 20 files before OPTIMIZE, got {num_files}"
    ctx["maint_files_before_optimize"] = num_files


@check("p2-maint-2")
def _check_maint2(spark, ctx):
    num_files_after = spark.sql("DESCRIBE DETAIL sales_small_files").collect()[0]["numFiles"]
    before = ctx.get("maint_files_before_optimize")
    if before is not None:
        assert num_files_after < before, (
            f"OPTIMIZE should reduce numFiles (was {before}, now {num_files_after})"
        )

    # "VACUUM DRY RUN works" is already covered — it's part of this lesson's
    # own shipped try[] code and tools/run-lessons.py already ran it without
    # raising by this point.
    #
    # "RETAIN 0 HOURS is refused" has NO code block in the shipped lesson —
    # the lesson text describes it as something for the reader to try
    # themselves ("On this learning table only, try VACUUM with RETAIN 0
    # HOURS..."), with no `code` field to extract. This check is therefore
    # SUPPLEMENTAL: the SQL below is written here, not pulled from js/app.js,
    # to verify the claim the lesson text makes about Delta's default safety
    # check, not to re-run shipped code.
    expect_raises(
        lambda: spark.sql("VACUUM sales_small_files RETAIN 0 HOURS"),
        "VACUUM RETAIN 0 HOURS should be refused by Delta's retention safety check",
    )


@check("p2-b02-3")
def _check_b02(spark, ctx):
    b = _row_count(spark, "brz_appointments")
    s = _row_count(spark, "slv_appointments")
    assert b == 305, f"brz_appointments should have 305 rows, got {b}"
    assert s == 300, f"slv_appointments should have 300 rows, got {s}"
    assert spark.catalog.tableExists("gld_no_show_rate"), "gld_no_show_rate should exist"
    g = _row_count(spark, "gld_no_show_rate")
    assert g > 0, "gld_no_show_rate should have at least one row"


@check("p2-plan-1")
def _check_plan(spark, ctx):
    # The shipped code calls .explain() inline (never binding the DataFrame
    # to a variable), and the real run already printed its plan to stdout
    # uncaptured. .explain() has no side effects and the query is
    # deterministic given the table state, so re-building the identical
    # chain here to capture its output is equivalent to capturing the
    # original call, not a different assertion.
    from pyspark.sql import functions as F

    grouped = spark.table("sales_silver").groupBy("customer_id").agg(F.sum("amount"))
    plan_with_shuffle = capture_explain(grouped)
    assert "Exchange" in plan_with_shuffle, "groupBy should trigger a shuffle (Exchange) in the plan"

    filtered = spark.table("sales_silver").filter("amount > 1000").select("order_id", "amount")
    plan_no_shuffle = capture_explain(filtered)
    assert "Exchange" not in plan_no_shuffle, "a plain filter+select should not trigger a shuffle (Exchange)"


@check("p3-b-1")
def _check_p3b1(spark, ctx):
    # run_lesson_generic runs try[] then brk[] back-to-back before this check
    # sees any state, so only the final (post-append) state is observable
    # here. The pre-append values (207000/810000/215000) are confirmed
    # separately: the try cell's own .show() printed them to the real CI/
    # local run log before the append happened, matching this lesson's
    # "expect" text.
    n_after = _row_count(spark, "finance_raw")
    assert n_after == 10, f"expected 10 rows in finance_raw after the duplicate append, got {n_after}"
    rows_after = {
        r["invoice_date"].isoformat(): r["daily_total"]
        for r in spark.sql(
            "SELECT invoice_date, SUM(amount) AS daily_total FROM finance_raw GROUP BY invoice_date"
        ).collect()
    }
    assert len(rows_after) == 3, f"expected 3 distinct invoice dates, got {len(rows_after)}"
    assert rows_after["2026-09-02"] == 1620000.0, f"2026-09-02 should double to 1620000.0 after the append, got {rows_after['2026-09-02']}"


@check("p3-c-1")
def _check_p3c1(spark, ctx):
    # Runs after p3-b-1 in source order, so finance_raw is still in the
    # doubled (10-row) state left by that lesson's brk step -- this lesson's
    # own "expect" text says as much.
    row = spark.sql(
        "SELECT SUM(amount) AS daily_total FROM finance_raw WHERE invoice_date = '2026-09-02'"
    ).collect()[0]
    assert row["daily_total"] == 1620000.0, f"expected the T-SQL-style read to match p3-b-1's post-append total, got {row['daily_total']}"


@check("p3-d-1")
def _check_p3d1(spark, ctx):
    for table, n in (("dim_customers", 2), ("dim_products", 2), ("dim_regions", 2)):
        assert spark.catalog.tableExists(table), f"{table} should exist after the control-table loop"
        got = _row_count(spark, table)
        assert got == n, f"{table} should have {n} rows, got {got}"

    loaded = set(ctx["ns"]["loaded"])
    assert loaded == {"dim_customers", "dim_products", "dim_regions"}, f"unexpected set of loaded tables: {loaded}"

    # The brk step's bad control-table row should be reported, not silently
    # dropped and not allowed to kill the whole loop.
    errors = ctx["ns"]["errors"]
    assert errors == ["suppliers"], f"expected exactly one reported failure ('suppliers'), got {errors}"
    assert not spark.catalog.tableExists("dim_suppliers"), "dim_suppliers should never have been created"


@check("p3-e-1")
def _check_p3e1(spark, ctx):
    n = _row_count(spark, "orders_incremental")
    assert n == 3, f"orders_incremental should have 3 rows after the day-1 full load plus the day-2 incremental append, got {n}"
    ids = {r["order_id"] for r in spark.table("orders_incremental").select("order_id").collect()}
    assert ids == {1, 2, 3}, f"expected order_ids {{1, 2, 3}}, got {ids}"

    # The brk step's delete-blindness demonstration: order 1 was removed
    # from the simulated source but is still present (orphaned) in the
    # already-loaded target table.
    next_incremental_count = ctx["ns"]["next_incremental"].count()
    assert next_incremental_count == 0, f"a later incremental pull after a delete-only change should find 0 new rows, got {next_incremental_count}"
    orphan_count = spark.table("orders_incremental").filter("order_id = 1").count()
    assert orphan_count == 1, f"order 1 should still be present (orphaned) in orders_incremental, got {orphan_count} rows"
