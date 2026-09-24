(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var ESC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return ESC[c];});};
var reduce=false;
try{reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
var R=String.raw;

/* ================================================================== */
/* Content: phases 0, 1, 3, 4, 5, 6 (phase 2 lessons live below)       */
/* ================================================================== */
var P0={
 id:"p0",n:0,short:"Warm-up",name:"Warm-up: Python, JSON, Parquet and Git",layer:"bronze",layerName:"Bronze layer",
 weeks:[1,1],hours:8,cost:"Free",tone:"free",needs:"Nothing, start here",
 goal:"Four small skills that every later phase quietly assumes. Learn them now so that in Spark and Fabric you only ever meet one new thing at a time. If you already write Python and use Git daily, skim this phase and move on.",
 tasks:[
  {id:"p0-a",t:"Learn Python basics",d:"Variables, lists, dictionaries, functions, loops and imports. Skip classes; two focused days is enough."},
  {id:"p0-b",t:"Use pandas on a CSV",d:"Load a file, group and aggregate it, then write the result out as Parquet."},
  {id:"p0-c",t:"Read and edit JSON by hand",d:"Objects, arrays and nesting. Pipeline definitions are JSON underneath."},
  {id:"p0-d",t:"Inspect a Parquet file",d:"Read its schema, then compare its size with the same data saved as CSV."},
  {id:"p0-e",t:"Create your portfolio repo",d:"Make a GitHub repo called fabric-portfolio. Clone it, branch, commit, open a pull request and merge it."},
  {id:"p0-f",t:"Start a learning log",d:"Add a LOG.md file and write one line after every session."}
 ],
 ship:"A repo with a notebook that turns CSV into Parquet, a README, and your first merged pull request.",
 bridge:[["SSIS .dtsx (XML)","Pipeline definition (JSON)"],["Row-store table","Parquet (columnar file)"]],
 links:[["Python tutorial","https://docs.python.org/3/tutorial/"],["Apache Parquet docs","https://parquet.apache.org/docs/"],["Pro Git book","https://git-scm.com/book/en/v2"]]
};

var P1={
 id:"p1",n:1,short:"Fabric foundations",name:"Fabric foundations: Builds 01 and 02",layer:"bronze",layerName:"Bronze layer",
 weeks:[2,3],hours:16,cost:"Free trial",tone:"free",needs:"Phase 0",
 goal:"Land, clean and serve data end to end inside one Fabric workspace, twice, with Power BI on top. This is your first pass through the medallion pattern: raw data in Bronze, cleaned in Silver, business-ready in Gold.",
 tasks:[
  {id:"p1-a",t:"Start the 60-day Fabric trial",d:"Write down the start date. Resizing capacity does not reset the clock. Your tenant gets an F4 or an F64 capacity."},
  {id:"p1-b",t:"Adopt one naming convention",d:"WS-FabricLab-NN-Domain for workspaces, LH_ for lakehouses, brz_ slv_ gld_ for tables, PL_ for pipelines."},
  {id:"p1-c",t:"Install the Capacity Metrics app",d:"Check CU % and throttling before any heavy Spark run. F4 is small."},
  {id:"p1-d",t:"Build 01: retail sales from a REST API",d:"Dataflow Gen2 into a Lakehouse, Silver star schema, Gold aggregates, then a DirectLake report. About 3 to 4 hours."},
  {id:"p1-e",t:"Automate Build 01",d:"Add a daily 06:00 pipeline schedule and a Power Automate flow that posts to Teams when the run ends."},
  {id:"p1-f",t:"Compare the two Direct Lake modes",d:"Point one semantic model at OneLake and another at the SQL analytics endpoint. Note the differences in fallback and refresh behaviour. The DP-600 outline now lists this choice."},
  {id:"p1-g",t:"Build 02: clinic no-shows from a SharePoint list",d:"Dataflow Gen2 into the Lakehouse, a PySpark notebook derives no-show rates, and an event-driven alert fires on a no-show. About 4 to 6 hours. Synthetic data only."},
  {id:"p1-h",t:"Apply roles and a sensitivity label",d:"You are Admin, stakeholders are Viewer only."},
  {id:"p1-i",t:"Tear down each workspace",d:"Delete each build's workspace before starting the next to reclaim capacity and storage."}
 ],
 ship:"Two medallion builds, each with an architecture diagram, report screenshots and a README in your repo.",
 note:"If a source connector defeats you, upload the sample CSV to the Lakehouse and use Load to Tables. That table becomes your Bronze layer, so you can carry on from Silver.",
 bridge:[["Power Query","Dataflow Gen2"],["ADF pipeline","Fabric pipeline"],["Import-mode refresh","DirectLake model"],["SQL Agent schedule","Pipeline schedule"]],
 links:[["Microsoft Fabric documentation","https://learn.microsoft.com/en-us/fabric/"],["Fabric trial","https://learn.microsoft.com/en-us/fabric/fundamentals/fabric-trial"],["Data Factory in Fabric","https://learn.microsoft.com/en-us/fabric/data-factory/"]]
};

var P3={
 id:"p3",n:3,short:"Warehouse and migration",name:"Warehouse, on-prem sources and migration: Build 03",layer:"silver",layerName:"Silver layer",
 weeks:[6,7],hours:18,cost:"Free trial",tone:"free",needs:"Phases 1 and 2",
 goal:"Move data from the world you know into Fabric, and prove you can migrate a legacy estate rather than only build greenfield. The case study you write here is the strongest single item in your portfolio.",
 tasks:[
  {id:"p3-a",t:"Install the on-premises data gateway",d:"Point it at a local SQL Server. The free Developer edition works as your on-prem source."},
  {id:"p3-b",t:"Build 03: finance data from on-prem SQL",d:"Copy activity into a Fabric Warehouse, a Data Activator alert on a threshold, and a report on top. About 6 to 9 hours."},
  {id:"p3-c",t:"Write your Lakehouse versus Warehouse rule",d:"One paragraph, with one real example of each."},
  {id:"p3-d",t:"Build a metadata-driven pipeline",d:"A control table lists the tables, and one pipeline with Lookup and ForEach loads them all."},
  {id:"p3-e",t:"Add incremental loading",d:"Use a watermark column, then handle deletes, which a watermark alone will not catch. Try a Copy job with incremental settings as the low-code alternative."},
  {id:"p3-f",t:"Try the ADF to Fabric migration assistant (Preview)",d:"On a sample ADF factory, run Migrate to Fabric (Preview) for a readiness scan, or mount the factory in a Fabric workspace and run it side by side. Note what it flags: self-hosted integration runtimes become gateways, mapping data flows need rebuilding, and global parameters become variable libraries. Preview tools change, so check the current docs."},
  {id:"p3-g",t:"Migrate one SSIS package",d:"Use a public sample such as AdventureWorks, never client work. Follow inventory, classify, design, convert, validate, cut over. Fabric has no SSIS integration runtime, so either keep running packages in ADF and call them from a Fabric pipeline, or rebuild them as pipelines and notebooks. Automated converters cover only part of a real portfolio."},
  {id:"p3-h",t:"Move one SSRS report to a paginated report",d:"Bring the .rdl across and compare the output page by page."},
  {id:"p3-i",t:"Move one stored procedure to the Warehouse",d:"Call it from a pipeline stored procedure activity."}
 ],
 ship:"An SSIS to Fabric migration case study: before and after diagrams, what converted cleanly, what needed rework, and how you validated it.",
 bridge:[["SSIS package","Pipeline or notebook"],["Foreach Loop container","ForEach activity"],["SSRS .rdl report","Paginated report"],["Self-hosted IR","On-premises data gateway"],["Stored procedure","Warehouse stored procedure"]],
 links:[["Fabric Data Warehouse","https://learn.microsoft.com/en-us/fabric/data-warehouse/"],["ADF to Fabric migration planning","https://learn.microsoft.com/en-us/fabric/data-factory/migrate-planning-azure-data-factory"],["SSIS to Fabric migration guide (EPC Group)","https://www.epcgroup.net/ssis-to-fabric-data-factory-migration-guide-2026"]]
};

var P4={
 id:"p4",n:4,short:"Production readiness",name:"Production readiness",layer:"gold",layerName:"Gold layer",
 weeks:[8,8],hours:10,cost:"Free to low",tone:"low",needs:"Phases 1 to 3",
 goal:"Close the gap between it worked in my workspace and a client can depend on it. Everything here is a discipline you already apply to production SQL Server: version control, monitoring, validation, least privilege and cost control.",
 tasks:[
  {id:"p4-a",t:"Connect a workspace to Git",d:"Use Fabric Git integration and commit your items to a branch."},
  {id:"p4-b",t:"Set up dev, test and prod",d:"Use deployment pipelines, and parameterise connections so environments differ only by configuration."},
  {id:"p4-c",t:"Add data quality gates",d:"Row counts, null checks and referential checks from Bronze to Silver. Fail loudly instead of publishing bad numbers quietly."},
  {id:"p4-d",t:"Add monitoring and one failure alert",d:"Use the monitoring hub for run history and alert on a failed pipeline."},
  {id:"p4-e",t:"Apply security properly",d:"Workspace roles, sensitivity labels and row-level security in the semantic model. Keep credentials in connections, never in code."},
  {id:"p4-f",t:"Review capacity use after a week",d:"Find the most expensive item in the Capacity Metrics app and explain why."},
  {id:"p4-g",t:"Write a one-page production checklist",d:"Version control, monitoring, validation, least privilege and cost control."},
  {id:"p4-h",t:"Side quest for Azure-heavy roles",d:"Create an ADLS Gen2 account with bronze, silver and gold containers, store a secret in Key Vault, and grant a managed identity a role on the storage. About 6 extra hours."}
 ],
 ship:"A repo section with deployment-pipeline screenshots, your production checklist and a short runbook.",
 bridge:[["Dev to UAT to prod SQL release","Deployment pipelines"],["SQL Agent job history","Monitoring hub"],["Database roles and RLS","Workspace roles and model RLS"]],
 links:[["Fabric CI/CD","https://learn.microsoft.com/en-us/fabric/cicd/"],["Azure free account","https://azure.microsoft.com/free"]]
};

var P5={
 id:"p5",n:5,short:"Certification sprint",name:"Certification sprint",layer:"gold",layerName:"Gold layer",
 weeks:[9,11],hours:28,cost:"Exam fees",tone:"paid",needs:"Phases 1 to 4",
 goal:"Turn hands-on work into recognised credentials, in an order that builds on your strengths. Treat exams as confirmation of what you can already show; at your experience level, shipped projects usually count for more. DP-203 has retired and DP-700 is its successor.",
 tasks:[
  {id:"p5-a",t:"Check what you already hold",d:"If you do not have PL-300 yet, book it first. Your Power BI experience makes it the quickest win. Its outline, dated 20 April 2026, includes choosing between DirectLake, DirectQuery and Import."},
  {id:"p5-b",t:"Map the DP-600 outline to your builds",d:"Use the outline that takes effect on 19 October 2026; if you start this week, your exam weeks fall after that date. It lists Direct Lake on OneLake versus the SQL analytics endpoint, .pbip projects and deployment pipelines."},
  {id:"p5-c",t:"Practise DP-600, then patch the gaps",d:"Use the free practice assessment. Focus on semantic models, DAX performance, Direct Lake, and Lakehouse and Warehouse analytics."},
  {id:"p5-d",t:"Sit DP-600",d:"Book it as soon as your practice scores are steady."},
  {id:"p5-e",t:"Map the DP-700 outline to your builds",d:"Blueprint dated 21 July 2026: ingestion and transformation, orchestration, Spark, basic KQL, monitoring, security, and Apache Airflow workspace settings."},
  {id:"p5-f",t:"Practise DP-700 under time",d:"Take the practice assessment, then one timed run."},
  {id:"p5-g",t:"Sit DP-700",d:"Book it once your practice scores are steady. The last exam in this path."},
  {id:"p5-h",t:"Optional: a Databricks certification",d:"Only if you are targeting Databricks-heavy roles."}
 ],
 ship:"Exam results plus a coverage map that links each exam skill to a build in your repo.",
 note:"Exam outlines, prices and languages change. Confirm the current details on the study guide pages before you book.",
 bridge:[["Years of Power BI","PL-300 and DP-600"],["Pipelines and Spark work","DP-700"]],
 links:[["DP-600 study guide","https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600"],["DP-700 study guide","https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-700"],["PL-300 study guide","https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300"]]
};

var STRETCH=[
{name:"Build 04: manufacturing IoT stream",desc:"Event Hub into an Eventstream, a KQL database, a Real-Time Dashboard and a Data Activator anomaly alert. This is Fabric Real-Time Intelligence.",chips:["Advanced","8 to 12 hours","Free trial"]},
{name:"Build 05: logistics control tower",desc:"Link Dataverse to a Lakehouse through shortcuts, enrich with Spark, serve through DirectLake and fan out SLA alerts. Run it first on fresh capacity or upgrade to F64.",chips:["Expert","12 to 18 hours","Logic Apps are billable"]},
{name:"ADF and Databricks together",desc:"Have ADF call a Databricks notebook, pass parameters in and return a value, using a job cluster. This is the pattern behind many Azure-heavy client projects.",chips:["Needs paid Azure Databricks","About 1 week"]},
{name:"Apache Airflow jobs in Fabric",desc:"Copy a small DAG into Fabric's Airflow offering and schedule it. The DP-700 outline now lists Airflow workspace settings.",chips:["Optional","About 4 hours"]},
{name:"Lineage and governance with Purview",desc:"Add cross-system lineage to your medallion builds and document who can see what.",chips:["Optional","Paid tool"]}
];

var ROSETTA=[
["SSIS package","Fabric pipeline or notebook",3],
["SSIS Foreach Loop container","ForEach activity in a pipeline",3],
["SSIS integration runtime","No Fabric equivalent: run in ADF, call from a pipeline",3],
["ADF self-hosted IR","On-premises data gateway",3],
["SQL Agent schedule","Pipeline schedule or trigger",1],
["SSRS .rdl report","Power BI paginated report",3],
["T-SQL SELECT","Spark SQL",2],
["T-SQL MERGE","Delta MERGE INTO",2],
["Temporal tables","Delta time travel",2],
["Staging, cleansed and mart schemas","Bronze, Silver and Gold layers",1],
["Import-mode dataset refresh","Direct Lake semantic model",1],
["Index maintenance","OPTIMIZE and VACUUM",2],
["Stored procedure","Warehouse stored procedure",3]
];

var FRESH=[
["Fabric Spark runtime","Runtime 2.0 (Spark 4.1, Delta 4.2, Python 3.13) is generally available. Microsoft plans to make it the default for new workspaces in late September 2026. Delta 4.x-specific features are experimental.","Phase 2 starts with choosing a runtime, and every lesson runs on 1.3 or 2.0."],
["Databricks Free Edition","Documentation updated 11 September 2026: serverless-only, no custom compute, restricted outbound internet, one small SQL warehouse, Unity Catalog ready to use.","The cluster and auto-terminate steps are gone. Sample data is created in code."],
["DP-600 exam","The current outline is dated 21 July 2026. A new English outline takes effect 19 October 2026 with a minor change to query and analyze data. It lists Direct Lake on OneLake versus the SQL analytics endpoint.","Phase 5 targets the 19 October outline, and phase 1 gains a Direct Lake comparison."],
["DP-700 exam","Blueprint updated 21 July 2026. One change since April: Apache Airflow workspace settings replaced Dataflows Gen2 workspace settings.","Airflow is added as a stretch mission."],
["PL-300 exam","Outline dated 20 April 2026, now listing the choice between DirectLake, DirectQuery and Import.","Phase 5 notes the check."],
["ADF to Fabric","A Migrate to Fabric (Preview) assistant and factory mounting exist. SSIS integration runtimes have no Fabric equivalent, self-hosted IRs become gateways, and mapping data flows need rebuilding.","Phase 3 gains a migration-assistant task and clearer SSIS notes."],
["Fabric trial","Still 60 days, provisioned as F4 or F64 depending on the tenant.","No change."],
["V-Order","Off by default for newly created workspaces.","Noted in the table maintenance lesson."]
];

var COSTS=[
["Phase 0","Free."],
["Phase 1","Free during the trial. Power Automate needs no premium connector for these builds."],
["Phase 2","Free. Databricks Free Edition is serverless-only and quota-limited, so treat it as a classroom."],
["Phase 3","Free during the trial. SQL Server Developer edition is free for the on-prem source."],
["Phase 4","Free to low. The Azure side quest may use free-account credit, so set a budget alert on day one."],
["Phase 5","Exam fees. Check the current price and any discount offers."],
["Stretch","Azure Databricks and Logic Apps are billable; the rest stays on the trial."]
];

/* ================================================================== */
/* Phase 2 pilot: tasks broken into lessons (learn, try, break, prove) */
/* ================================================================== */
var P2={
 id:"p2",n:2,short:"Spark and Delta",name:"Spark and Delta: think in DataFrames",layer:"silver",layerName:"Silver layer",
 weeks:[4,5],hours:18,cost:"Free",tone:"free",needs:"Phases 0 and 1",lessons:true,
 goal:"This is the one place where SQL Server instincts can mislead you. Spark is distributed and lazy: nothing runs until you ask for a result. Each task below is split into short lessons. Learn a little, run it, break it on purpose, then prove you understood. Use Databricks Free Edition or a Fabric notebook; lessons say where the two differ.",
 tasks:[

 /* ---------------------------------------------------------------- */
 {id:"p2-runtime",t:"Pick your Fabric Spark runtime",d:"Know which runtime your notebooks use before you write any code.",subs:[
  {id:"p2-runtime-1",t:"Check and choose a runtime",mins:15,
   learn:["A Fabric runtime bundles Spark, Delta Lake, Python and Java. Runtime 1.3 is Spark 3.5 with Delta 3.2. Runtime 2.0 is Spark 4.1 with Delta 4.2 and Python 3.13, and it is generally available.",
          "Existing workspaces stay on 1.3 until you opt in. Microsoft plans to make 2.0 the default for new workspaces and environments in late September 2026, so a workspace you create now may already be on 2.0."],
   try:[{p:"Open a Fabric notebook, attach a Lakehouse and run this cell."},
        {lang:"python",label:"Python, Fabric notebook",code:R`print("Spark version:", spark.version)
import sys
print("Python version:", sys.version.split()[0])`},
        {p:"Then open Workspace settings, choose Data Engineering/Science, then Spark settings, then the Environment tab, and find the Runtime version dropdown."}],
   expect:"Spark 3.5 with Python 3.11 means runtime 1.3. Spark 4.1 with Python 3.13 means runtime 2.0.",
   brk:"Create an Environment item on the other runtime, attach it to a copy of the notebook and rerun the cell. Same code, different versions. Notice that you chose the runtime per environment, which overrides the workspace default.",
   prove:["You can say which runtime each of your workspaces uses.","You can explain why you would not enable Delta 4.x-specific features on tables that other Fabric workloads read."],
   quiz:[["Your Delta tables feed both notebooks and Power BI Direct Lake. Should you enable Delta 4.x-specific features?","Not by default. Microsoft says Delta 4.x-specific features are experimental and only work in Spark experiences such as notebooks and Spark job definitions, so other workloads may not be able to read those tables."]],
   watch:"Runtime 2.0 is a big jump: Spark, Delta, Python and Java all change at once. Test existing notebooks on a copy before you switch a workspace.",
   links:[["Runtime 2.0 in Fabric","https://learn.microsoft.com/en-us/fabric/data-engineering/runtime-2-0"],["Delta Lake interoperability","https://learn.microsoft.com/en-us/fabric/fundamentals/delta-lake-interoperability"]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-spark",t:"Explain Spark in your own words",d:"Driver, executors, partitions, lazy evaluation, and the difference between a transformation and an action.",subs:[
  {id:"p2-spark-1",t:"Partitions: how Spark splits the work",mins:15,
   learn:["Your T-SQL query runs on one server that picks an execution plan. Spark splits data into partitions and hands them to executors that work in parallel, while a driver plans the job and coordinates. Too few partitions waste cores; too many add overhead."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

df = spark.range(0, 1_000_000)
(df.withColumn("partition_id", F.spark_partition_id())
   .groupBy("partition_id").count()
   .orderBy("partition_id").show())`}],
   expect:"Several partition ids, each holding a share of the million rows. The number depends on the compute you are on.",
   brk:[{p:"Force two partitions, then many, and watch the counts per partition change."},
        {lang:"python",label:"Python",code:R`(df.repartition(2).withColumn("partition_id", F.spark_partition_id())
   .groupBy("partition_id").count().show())

(df.repartition(200).withColumn("partition_id", F.spark_partition_id())
   .groupBy("partition_id").count().count())   # how many partitions have rows?`}],
   prove:["You can say what the driver does and what the executors do.","You can explain why 200 partitions for a million rows is probably too many."],
   quiz:[["Which part runs your tasks in parallel, the driver or the executors?","The executors run tasks on partitions in parallel. The driver plans the job and coordinates them."]],
   watch:"The RDD-based getNumPartitions call may not be available on Databricks serverless compute, which is why this lesson uses spark_partition_id instead."},
  {id:"p2-spark-2",t:"Lazy evaluation: transformations versus actions",mins:20,
   learn:["Transformations such as filter, select, groupBy and join only describe what you want. Nothing runs until an action such as show(), count() or a write asks for a result. Spark then optimises the whole plan at once, a bit like SQL Server building one execution plan for a whole query."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

big = spark.range(0, 5_000_000).withColumn("bucket", F.col("id") % 10)
plan = big.filter("bucket = 3").groupBy("bucket").count()   # transformations: returns at once
print("Plan built. No job has run yet.")
plan.show()                                                   # action: the job runs now`}],
   expect:"The print line appears immediately. The work only happens when show() runs.",
   brk:"Call plan.show() twice and time each call. Spark did the work twice, because it does not remember results between actions unless you save them to a table.",
   prove:["You can name three transformations and three actions.","You can explain why plan returned instantly."],
   quiz:[["Is df.filter(...) a transformation or an action?","A transformation. It returns a new DataFrame that describes the filter. No data is processed until an action runs."]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-dbx",t:"Sign up for Databricks Free Edition",d:"Set up a workspace, create sample data in code, and run one query in both SQL and PySpark.",subs:[
  {id:"p2-dbx-1",t:"Create your Free Edition workspace",mins:15,
   learn:["Databricks Free Edition is a no-cost workspace for learning. It is serverless-only, so there are no clusters to size or stop. Unity Catalog is already set up: tables live in a three-level name, catalog.schema.table, and your default is usually workspace.default. Outbound internet is restricted, and accounts cannot be used commercially."],
   try:[{p:"Sign up from the Databricks Free Edition page, create a notebook and attach it to Serverless. Then run this in a SQL cell."},
        {lang:"sql",label:"SQL, Databricks",code:R`SELECT current_catalog() AS catalog, current_schema() AS schema;`}],
   expect:"workspace and default, unless you have changed them.",
   brk:"In a Python cell, try to download a file from a public website. With restricted outbound access it may fail. That is why the next lesson builds its data in code instead of downloading it.",
   prove:["A notebook attached to Serverless returns your catalog and schema.","You can read a fully qualified name such as workspace.default.sales_raw."],
   watch:"Free Edition accounts that are inactive for a long time may be deleted, and there is no support agreement. Keep your notebooks in a Git repo.",
   links:[["Free Edition limitations","https://docs.databricks.com/aws/en/getting-started/free-edition-limitations"],["Databricks Free Edition","https://www.databricks.com/learn/free-edition"]]},
  {id:"p2-dbx-2",t:"Create sample data in code",mins:15,
   learn:["You will not download anything. You create a small sales dataset in code, with mess on purpose: a duplicate order and a missing amount. It becomes your Bronze table for the rest of the phase, on either platform."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

rows = [
  (1, "C001", "2026-09-01", "Laptop",   1, 72000.0),
  (2, "C002", "2026-09-01", "Mouse",    2,   900.0),
  (3, "C001", "2026-09-02", "Monitor",  1, 15500.0),
  (4, "C003", "2026-09-02", "Laptop",   1, 71000.0),
  (5, "C004", "2026-09-03", "Keyboard", 1,  2500.0),
  (5, "C004", "2026-09-03", "Keyboard", 1,  2500.0),   # duplicate on purpose
  (6, "C002", "2026-09-03", "Monitor",  2,    None),   # missing amount on purpose
]
cols = ["order_id", "customer_id", "order_date", "product", "qty", "amount"]
sales = (spark.createDataFrame(rows, cols)
         .withColumn("order_date", F.to_date("order_date")))

sales.write.mode("overwrite").format("delta").saveAsTable("sales_raw")
print(spark.table("sales_raw").count())`}],
   expect:"A table called sales_raw and a count of 7.",
   brk:[{p:"Run the write again with append instead of overwrite, then count."},
        {lang:"python",label:"Python",code:R`sales.write.mode("append").format("delta").saveAsTable("sales_raw")
print(spark.table("sales_raw").count())    # 14: every row doubled`},
        {p:"Now run the overwrite cell again to reset. This is why Bronze loads need a plan for reruns."}],
   prove:["SELECT COUNT(*) FROM sales_raw returns 7 after a clean overwrite."],
   watch:"On Fabric, attach a Lakehouse to the notebook first, or saveAsTable has nowhere to write."},
  {id:"p2-dbx-3",t:"Same question in SQL and PySpark",mins:15,
   learn:["Spark SQL is real SQL. The DataFrame API expresses the same plan in Python. Both go through the same optimiser, so use whichever reads better. To switch a notebook cell to SQL, start it with %sql on Databricks or %%sql on Fabric."],
   try:[{lang:"sql",label:"SQL cell",code:R`SELECT product, SUM(amount) AS revenue, COUNT(*) AS orders
FROM sales_raw
GROUP BY product
ORDER BY revenue DESC`},
        {lang:"python",label:"PySpark, same question",code:R`from pyspark.sql import functions as F

(spark.table("sales_raw")
   .groupBy("product")
   .agg(F.sum("amount").alias("revenue"), F.count("*").alias("orders"))
   .orderBy(F.desc("revenue"))
   .show())`}],
   expect:"Identical numbers from both. The duplicate keyboard counts twice, and the missing amount is ignored by SUM.",
   brk:"Add .explain() to the end of the PySpark version, and put EXPLAIN in front of the SQL. Compare the two plans. They match, which is the point: the language is a matter of taste.",
   prove:["Both versions return the same three columns and the same values."],
   quiz:[["A NULL amount appears inside SUM. What happens?","SUM ignores NULLs, exactly as in T-SQL. If every value is NULL, the result is NULL."]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-df",t:"Learn the core DataFrame calls",d:"select, filter, withColumn, groupBy, join and window, each mapped to the T-SQL clause you already use.",subs:[
  {id:"p2-df-1",t:"select, filter, withColumn and groupBy",mins:25,
   learn:["Each DataFrame call is a T-SQL clause in disguise. select is the SELECT list, filter is WHERE, withColumn adds a computed column, groupBy().agg() is GROUP BY, and a filter after agg is HAVING. Chain them top to bottom; each call returns a new DataFrame."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

s = spark.table("sales_raw")
result = (s
  .filter(F.col("amount").isNotNull())                       # WHERE amount IS NOT NULL
  .withColumn("amount_k", F.round(F.col("amount") / 1000, 1))  # computed column
  .groupBy("customer_id")                                    # GROUP BY
  .agg(F.sum("amount").alias("spend"), F.count("*").alias("orders"))
  .filter(F.col("spend") > 10000)                            # HAVING
  .orderBy(F.desc("spend")))
result.show()`}],
   expect:"C001 with 2 orders and 87500 first, then C003 with 1 order and 71000.",
   brk:"Move the .filter(F.col('spend') > 10000) line above .agg(...) and run it. It fails because spend does not exist yet. It is the same reason HAVING cannot be a WHERE.",
   prove:["You can translate each line of the chain back into a T-SQL clause."]},
  {id:"p2-df-2",t:"Joins",mins:20,
   learn:["A join needs a key and a type. Passing the key as a column name string keeps one copy of the column, which avoids ambiguous-column errors. The default type is inner, as in T-SQL."],
   try:[{lang:"python",label:"Python, either platform",code:R`customers = spark.createDataFrame(
  [("C001", "Bengaluru"), ("C002", "Mysuru"), ("C003", "Chennai"), ("C005", "Pune")],
  ["customer_id", "city"])

s = spark.table("sales_raw")
(s.join(customers, "customer_id", "left")
  .select("order_id", "customer_id", "city", "amount")
  .show())`}],
   expect:"Customer C004 has no city (NULL) because it is missing from customers. C005 does not appear, since a left join keeps rows from sales only.",
   brk:[{p:"Duplicate the customers table and join again. The row count grows, because duplicates on the right side multiply matches."},
        {lang:"python",label:"Python",code:R`print(s.count())                                            # 7
print(s.join(customers.union(customers), "customer_id", "left").count())   # more than 7`}],
   prove:["You can predict the row count of a left join before you run it."],
   quiz:[["What kind of join does join(customers, 'customer_id') run when you skip the type?","An inner join."]]},
  {id:"p2-df-3",t:"Window functions for deduplication",mins:20,
   learn:["Window functions work like OVER (PARTITION BY ... ORDER BY ...) in T-SQL. Number the rows inside each key, then keep row 1. It is the standard way to deduplicate before a MERGE."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F
from pyspark.sql.window import Window

w = Window.partitionBy("order_id").orderBy(F.col("order_date").desc())
dedup = (spark.table("sales_raw")
           .withColumn("rn", F.row_number().over(w))
           .filter("rn = 1")
           .drop("rn"))
print(dedup.count())    # 6: the duplicate order 5 is gone`}],
   expect:"A count of 6, with order 5 appearing once.",
   brk:"Change the orderBy to a column that does not break ties, such as order_id itself, and think about which of two different rows for the same key would survive. Without a meaningful order, Spark keeps an arbitrary one. Always choose the tie-breaker on purpose.",
   prove:["The count is 6 and order 5 appears once.","You can say why the order in the window matters when duplicates differ."]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-delta",t:"Break a Delta table on purpose",d:"Run an UPDATE, time-travel to the earlier version, then try a mismatched-schema write and watch it be rejected.",subs:[
  {id:"p2-delta-1",t:"What Delta adds to Parquet",mins:15,
   learn:["A Delta table is Parquet files plus a transaction log in a _delta_log folder. The log gives you ACID transactions, versions and time travel: the same promises you rely on from SQL Server, kept on files."],
   try:[{lang:"sql",label:"SQL cell",code:R`DESCRIBE HISTORY sales_raw;
DESCRIBE DETAIL sales_raw;`}],
   expect:"History lists numbered versions with the operation for each. Detail shows the format (delta) and the number of files.",
   brk:"Re-run the write cell from the sample-data lesson, then run DESCRIBE HISTORY again. A new version appears, and the previous data is still there in the older version.",
   prove:["You can point to the version list and explain what a version is."]},
  {id:"p2-delta-2",t:"UPDATE, then time travel",mins:20,
   learn:["Because every change is a new version, you can read the table as it was, or roll back. This is your safety net when an UPDATE goes wrong."],
   try:[{p:"First note the latest version from DESCRIBE HISTORY. Then change one row, and read it before and after."},
        {lang:"sql",label:"SQL cell",code:R`UPDATE sales_raw SET amount = amount * 10 WHERE order_id = 1;

SELECT order_id, amount FROM sales_raw WHERE order_id = 1;
-- Replace 1 with the version number just before your UPDATE:
SELECT order_id, amount FROM sales_raw VERSION AS OF 1 WHERE order_id = 1;`}],
   expect:"The current row shows the multiplied amount. The VERSION AS OF query shows the original.",
   brk:[{p:"Now make the classic mistake: run the UPDATE without its WHERE clause. Every row changes. Recover with RESTORE."},
        {lang:"sql",label:"SQL cell",code:R`UPDATE sales_raw SET amount = amount * 10;               -- oops, no WHERE
RESTORE TABLE sales_raw TO VERSION AS OF 1;             -- use the version before the mistake`}],
   prove:["You recovered the original amounts with RESTORE."],
   watch:"Time travel is limited by log and file retention. VACUUM removes old files, after which old versions can no longer be read."},
  {id:"p2-delta-3",t:"Schema enforcement and evolution",mins:20,
   learn:["Delta refuses writes that do not match the table's schema. That protects you from silent upstream changes. When you do want the schema to change, you say so explicitly."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

extra = spark.table("sales_raw").limit(1).withColumn("coupon", F.lit("DIWALI10"))
extra.write.mode("append").format("delta").saveAsTable("sales_raw")   # fails: extra column`}],
   expect:"An AnalysisException about a schema mismatch. Delta rejected the extra column.",
   brk:[{p:"Now evolve the schema on purpose, then reset the table so later lessons start clean."},
        {lang:"python",label:"Python",code:R`(extra.write.mode("append").format("delta")
      .option("mergeSchema", "true").saveAsTable("sales_raw"))         # succeeds, adds coupon

# Reset for the next lessons:
(sales.write.mode("overwrite").format("delta")
      .option("overwriteSchema", "true").saveAsTable("sales_raw"))`}],
   prove:["You saw the failed append and the successful mergeSchema append, and can say when each is the right choice."],
   quiz:[["When is silent schema evolution dangerous?","When an upstream system changes a column by mistake. Enforcement is your early warning, so evolve schemas only on purpose."]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-merge",t:"Write a Delta MERGE",d:"Build the upsert first, then extend it into a Type 2 slowly changing dimension.",subs:[
  {id:"p2-merge-1",t:"Build an upsert",mins:25,
   learn:["MERGE compares a source set with a target table on a key, updates the matches and inserts the rest. It is the same idea as T-SQL MERGE. Silver tables are usually built this way so a rerun does not create duplicates."],
   try:[{lang:"sql",label:"SQL cells: create Silver, a source, then merge",code:R`CREATE OR REPLACE TABLE sales_silver AS
SELECT order_id, customer_id, order_date, product, qty, amount
FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date DESC) AS rn
      FROM sales_raw)
WHERE rn = 1;

CREATE OR REPLACE TEMP VIEW sales_updates AS
SELECT * FROM VALUES
  (3, 'C001', DATE'2026-09-02', 'Monitor', 1, 16500.0D),   -- price changed
  (7, 'C005', DATE'2026-09-04', 'Laptop',  1, 68000.0D),   -- new order
  (8, 'C003', DATE'2026-09-04', 'Mouse',   3,  1300.0D)    -- new order
AS t(order_id, customer_id, order_date, product, qty, amount);

MERGE INTO sales_silver AS t
USING sales_updates AS s
  ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;`}],
   expect:"Order 3 now has amount 16500, and orders 7 and 8 are new. sales_silver holds 8 rows.",
   brk:"Run the same MERGE a second time. Nothing changes: no duplicates and no errors. That repeatable behaviour is the reason to use MERGE. Then run DESCRIBE HISTORY sales_silver and read the merge metrics.",
   prove:["SELECT COUNT(*) FROM sales_silver returns 8, both after the first run and after the second."],
   links:[["Delta: updates and merges","https://docs.delta.io/latest/delta-update.html"]]},
  {id:"p2-merge-2",t:"Break it: duplicate keys in the source",mins:15,
   learn:["A MERGE fails when one target row matches more than one source row, because the result would be ambiguous. T-SQL raises a similar error. The fix is always to deduplicate the source on the merge key first."],
   try:[{lang:"sql",label:"SQL cell",code:R`CREATE OR REPLACE TEMP VIEW sales_updates_dupes AS
SELECT * FROM VALUES
  (3, 'C001', DATE'2026-09-02', 'Monitor', 1, 16500.0D),
  (3, 'C001', DATE'2026-09-02', 'Monitor', 1, 16800.0D)
AS t(order_id, customer_id, order_date, product, qty, amount);

MERGE INTO sales_silver AS t
USING sales_updates_dupes AS s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *;`}],
   expect:"An error saying that multiple source rows matched the same target row.",
   brk:[{p:"Now fix it. Keep one row per key, choosing the tie-breaker on purpose, then merge the cleaned set."},
        {lang:"python",label:"Python",code:R`from pyspark.sql import functions as F
from pyspark.sql.window import Window

src = spark.table("sales_updates_dupes")
w = Window.partitionBy("order_id").orderBy(F.col("amount").desc())
clean = src.withColumn("rn", F.row_number().over(w)).filter("rn = 1").drop("rn")
clean.createOrReplaceTempView("sales_updates_clean")

spark.sql("""
MERGE INTO sales_silver AS t
USING sales_updates_clean AS s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
""")`}],
   prove:["You can explain why the first MERGE failed and what your fix guarantees."],
   watch:"Deduplicate on the merge key with a deliberate tie-breaker such as the latest timestamp. Picking an arbitrary row can silently load the wrong value."},
  {id:"p2-merge-3",t:"The Python DeltaTable API",mins:15,
   learn:["The same MERGE can be written in Python with DeltaTable. Use it when the logic needs loops or conditions around the merge, and use SQL when it reads better."],
   try:[{lang:"python",label:"Python, either platform",code:R`from delta.tables import DeltaTable

src = spark.table("sales_updates")
(DeltaTable.forName(spark, "sales_silver").alias("t")
   .merge(src.alias("s"), "t.order_id = s.order_id")
   .whenMatchedUpdateAll()
   .whenNotMatchedInsertAll()
   .execute())`}],
   expect:"The same result as the SQL MERGE, with no new rows on a rerun.",
   brk:[{p:"Update only one column instead of all of them, and check that the others stay untouched."},
        {lang:"python",label:"Python",code:R`(DeltaTable.forName(spark, "sales_silver").alias("t")
   .merge(src.alias("s"), "t.order_id = s.order_id")
   .whenMatchedUpdate(set={"amount": "s.amount"})
   .execute())`}],
   prove:["You can write the same merge in SQL and in Python."],
   watch:"If your environment rejects the DeltaTable import, use the SQL form. The outcome is identical."},
  {id:"p2-merge-4",t:"Type 2 slowly changing dimension",mins:30,
   learn:["A Type 2 dimension keeps history. When a tracked attribute changes, you close the old row and add a new current row. It is the classic Kimball pattern you have built in SSIS. Here it takes two set-based statements."],
   try:[{lang:"sql",label:"SQL: seed the dimension and a batch of changes",code:R`CREATE OR REPLACE TABLE dim_customer AS
SELECT * FROM VALUES
  ('C001', 'Bengaluru', DATE'2026-01-01', DATE'9999-12-31', true),
  ('C002', 'Mysuru',    DATE'2026-01-01', DATE'9999-12-31', true),
  ('C003', 'Chennai',   DATE'2026-01-01', DATE'9999-12-31', true)
AS t(customer_id, city, effective_from, effective_to, is_current);

CREATE OR REPLACE TEMP VIEW customer_updates AS
SELECT * FROM VALUES ('C001', 'Mysuru'), ('C004', 'Pune') AS t(customer_id, city);`},
        {lang:"sql",label:"SQL step 1: close changed rows, add new customers",code:R`MERGE INTO dim_customer AS t
USING customer_updates AS s
  ON t.customer_id = s.customer_id AND t.is_current = true
WHEN MATCHED AND t.city <> s.city THEN
  UPDATE SET t.is_current = false, t.effective_to = current_date()
WHEN NOT MATCHED THEN
  INSERT (customer_id, city, effective_from, effective_to, is_current)
  VALUES (s.customer_id, s.city, current_date(), DATE'9999-12-31', true);`},
        {lang:"sql",label:"SQL step 2: add the new version for changed customers",code:R`INSERT INTO dim_customer
SELECT s.customer_id, s.city, current_date(), DATE'9999-12-31', true
FROM customer_updates s
JOIN dim_customer t
  ON t.customer_id = s.customer_id AND t.is_current = false AND t.effective_to = current_date()
LEFT JOIN dim_customer c
  ON c.customer_id = s.customer_id AND c.is_current = true
WHERE c.customer_id IS NULL;

SELECT * FROM dim_customer ORDER BY customer_id, effective_from;`}],
   expect:"C001 has two rows: Bengaluru closed today, and a new current row for Mysuru. C004 is new. C002 and C003 are untouched.",
   brk:"Run step 1 and step 2 again straight away. Nothing changes, because the source now matches the current row. Then send C002 with a new city and run both steps: only C002 gets a new version.",
   prove:["Each customer has exactly one row with is_current = true.","You can explain why step 2 needs the LEFT JOIN."],
   quiz:[["Why not just UPDATE the city in place?","Then you lose history. Reports about last quarter would show today's city instead of the city that was true at the time."]],
   watch:"This simplified version assumes one change per customer per day. Real pipelines add a hash of the tracked columns and handle late-arriving changes."}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-maint",t:"Maintain the table",d:"Compact small files with OPTIMIZE and clear old versions with VACUUM.",subs:[
  {id:"p2-maint-1",t:"The small files problem",mins:20,
   learn:["Every write adds files. Many small appends leave thousands of tiny files, and queries slow down because Spark has to open each one. OPTIMIZE compacts them into fewer, larger files."],
   try:[{lang:"python",label:"Python, either platform: create 20 tiny appends",code:R`from pyspark.sql import functions as F

for i in range(20):
    (spark.range(i * 10, i * 10 + 10).select(F.col("id").alias("order_id"))
        .withColumn("customer_id", F.lit("C999"))
        .withColumn("order_date", F.current_date())
        .withColumn("product", F.lit("Cable"))
        .withColumn("qty", F.lit(1))
        .withColumn("amount", F.lit(100.0))
        .write.mode("append").format("delta").saveAsTable("sales_small_files"))`},
        {lang:"sql",label:"SQL cell",code:R`DESCRIBE DETAIL sales_small_files;`}],
   expect:"numFiles is around 20 for a table that holds only 200 small rows.",
   brk:"Think about the same pattern at scale: a job that appends every minute for a month. Nothing fails, it just gets slower each day. That is why maintenance is part of the design, not an afterthought.",
   prove:["You can explain the small files problem in one sentence."]},
  {id:"p2-maint-2",t:"OPTIMIZE and VACUUM",mins:20,
   learn:["OPTIMIZE rewrites many small files into fewer large ones. VACUUM deletes files that are no longer referenced by the table, but only those older than the retention window, 7 days by default."],
   try:[{lang:"sql",label:"SQL cell",code:R`OPTIMIZE sales_small_files;
DESCRIBE DETAIL sales_small_files;        -- numFiles drops
VACUUM sales_small_files DRY RUN;         -- lists what it would delete, deletes nothing`}],
   expect:"numFiles falls to one or a few files. The dry run lists nothing yet, because your old files are newer than the retention window.",
   brk:"On this learning table only, try VACUUM with RETAIN 0 HOURS. It is refused by a safety check. Read the error and leave the check switched on: shortening retention on a real table can break readers and time travel.",
   prove:["numFiles dropped after OPTIMIZE.","You can explain why VACUUM did not delete anything yet."],
   watch:"In Fabric, V-Order is off by default for newly created workspaces, so check the V-Order guidance if Power BI read speed matters. On Databricks, liquid clustering is now generally recommended for layout on new tables, and ZORDER still works on existing ones. Check the current docs for your workload.",
   links:[["V-Order in Fabric","https://learn.microsoft.com/en-us/fabric/data-engineering/delta-optimization-and-v-order"],["Delta utility commands","https://docs.delta.io/latest/delta-utility.html"]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-auto",t:"Ingest files incrementally with Auto Loader",d:"Let the platform track which files it has already loaded (Databricks).",subs:[
  {id:"p2-auto-1",t:"The idea: a checkpoint remembers files",mins:15,
   learn:["In SSIS you kept a control table of processed files. Auto Loader keeps that state for you in a checkpoint. It finds new files in a folder and loads each one once. Auto Loader is a Databricks feature. In Fabric, comparable patterns are a Copy job with incremental settings or a Structured Streaming file source."],
   try:[{lang:"python",label:"Python, Databricks: create a volume and land one file",code:R`spark.sql("CREATE VOLUME IF NOT EXISTS workspace.default.landing")
base = "/Volumes/workspace/default/landing"

dbutils.fs.put(f"{base}/incoming/orders_1.csv",
               "order_id,amount\n101,500\n102,750\n", True)
display(dbutils.fs.ls(f"{base}/incoming"))`}],
   expect:"One file, orders_1.csv, listed in the incoming folder.",
   brk:"Open the volume in the Catalog explorer and find the file there. Volumes are Unity Catalog's home for files, the way tables are for rows.",
   prove:["Your volume holds orders_1.csv."]},
  {id:"p2-auto-2",t:"Run Auto Loader twice",mins:25,
   learn:["With the trigger set to availableNow, Auto Loader processes everything new and then stops. That works on serverless compute and behaves like a scheduled batch load."],
   try:[{lang:"python",label:"Python, Databricks",code:R`def load_new_files():
    (spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "csv")
        .option("header", "true")
        .option("cloudFiles.schemaLocation", f"{base}/_schema")
        .load(f"{base}/incoming")
        .writeStream
        .option("checkpointLocation", f"{base}/_checkpoint")
        .trigger(availableNow=True)
        .toTable("orders_bronze")
        .awaitTermination())

load_new_files()
print(spark.table("orders_bronze").count())     # 2`},
        {p:"Now land a second file and load again."},
        {lang:"python",label:"Python, Databricks",code:R`dbutils.fs.put(f"{base}/incoming/orders_2.csv",
               "order_id,amount\n103,900\n104,1200\n", True)
load_new_files()
print(spark.table("orders_bronze").count())     # 4: only the new file was read`}],
   expect:"A count of 2 after the first run and 4 after the second. The first file was not loaded again.",
   brk:[{p:"Run load_new_files() again with no new file. The count stays 4. Then delete the checkpoint and run it once more."},
        {lang:"python",label:"Python, Databricks",code:R`dbutils.fs.rm(f"{base}/_checkpoint", True)
load_new_files()
print(spark.table("orders_bronze").count())     # 8: every file loaded a second time`}],
   prove:["The count goes 2, then 4, then stays 4 on a rerun.","You can say what the checkpoint holds and what happens when you delete it."],
   watch:"CSV columns arrive as strings unless you turn on type inference. Deleting a checkpoint on a real pipeline reloads everything and creates duplicates."}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-b02",t:"Rebuild Build 02 in a Fabric notebook",d:"Same transform as the clinic no-show build, in PySpark on Delta tables, with a row-count gate at the end.",subs:[
  {id:"p2-b02-1",t:"Create the Bronze appointments table",mins:15,
   learn:["Build 02 tracked clinic no-shows. You will rebuild its transform in code. First, generate a synthetic Bronze table with a few duplicates. It contains no real patient data, only made-up ids."],
   try:[{lang:"python",label:"Python, Fabric notebook with a Lakehouse attached",code:R`import random, datetime as dt
from pyspark.sql import functions as F

random.seed(7)
providers = ["Dr Rao", "Dr Iyer", "Dr Shah"]
statuses  = ["Attended", "Attended", "Attended", "No-show", "Cancelled"]
rows = [(i, f"P{random.randint(1, 40):03d}", random.choice(providers),
         (dt.date(2026, 9, 1) + dt.timedelta(days=random.randint(0, 20))).isoformat(),
         random.choice(statuses)) for i in range(1, 301)]
rows += rows[:5]                                   # 5 duplicate rows on purpose

cols = ["appointment_id", "patient_id", "provider", "appt_date", "status"]
(spark.createDataFrame(rows, cols)
      .write.mode("overwrite").format("delta").saveAsTable("brz_appointments"))
print(spark.table("brz_appointments").count())`}],
   expect:"A count of 305.",
   brk:"Change random.seed(7) to another number and rerun. The data changes but stays reproducible for a given seed, which is what makes a test dataset useful.",
   prove:["brz_appointments exists with 305 rows."]},
  {id:"p2-b02-2",t:"Silver: type, deduplicate and flag",mins:20,
   learn:["Silver is where you fix types, drop duplicates and add helper columns. The window function from the earlier lesson does the deduplication."],
   try:[{lang:"python",label:"Python, Fabric",code:R`from pyspark.sql import functions as F
from pyspark.sql.window import Window

bronze = spark.table("brz_appointments")
w = Window.partitionBy("appointment_id").orderBy(F.col("appt_date").desc())
silver = (bronze
  .withColumn("appt_date", F.to_date("appt_date"))
  .withColumn("weekday", F.date_format("appt_date", "EEEE"))
  .withColumn("is_no_show", (F.col("status") == "No-show").cast("int"))
  .withColumn("rn", F.row_number().over(w)).filter("rn = 1").drop("rn"))

silver.write.mode("overwrite").format("delta").saveAsTable("slv_appointments")
print(bronze.count(), silver.count())     # 305 300`}],
   expect:"305 rows in Bronze and 300 in Silver: the five duplicates are gone.",
   brk:"Remove the deduplication lines and rerun. Silver now equals Bronze and the no-show rate is skewed by the duplicates. Put the lines back.",
   prove:["slv_appointments has 300 rows with a weekday and an is_no_show column."]},
  {id:"p2-b02-3",t:"Gold and a row-count gate",mins:20,
   learn:["Gold holds business-ready aggregates. A quality gate fails the run loudly when the numbers look wrong, instead of publishing them quietly."],
   try:[{lang:"python",label:"Python, Fabric",code:R`from pyspark.sql import functions as F

gold = (spark.table("slv_appointments")
  .groupBy("provider", "weekday")
  .agg(F.count("*").alias("appointments"),
       F.round(F.avg("is_no_show") * 100, 1).alias("no_show_pct")))
gold.write.mode("overwrite").format("delta").saveAsTable("gld_no_show_rate")

# Quality gate: fail loudly instead of publishing bad numbers
b = spark.table("brz_appointments").count()
s = spark.table("slv_appointments").count()
if s == 0 or s > b:
    raise Exception(f"Row-count gate failed: bronze={b}, silver={s}")
print("Gate passed:", b, "bronze rows,", s, "silver rows")`}],
   expect:"Gate passed with 305 and 300. gld_no_show_rate has one row per provider and weekday, with a no-show percentage.",
   brk:"Change the gate to fail when s != b. It now fails, because removing five duplicates is correct behaviour. A gate must encode what you actually expect: Silver never empty and never larger than Bronze.",
   prove:["The gate passes and gold has a no_show_pct for each provider and weekday.","You can explain why Silver has fewer rows than Bronze."],
   quiz:[["Why raise an exception instead of printing a warning?","A warning lets the pipeline carry on and publish bad numbers. An exception stops the run so someone looks at it before users do."]]}
 ]},

 /* ---------------------------------------------------------------- */
 {id:"p2-plan",t:"Read one Spark execution plan",d:"Find a shuffle and explain why it costs time.",subs:[
  {id:"p2-plan-1",t:"Spot the shuffle",mins:20,
   learn:["A shuffle moves data between executors so that rows with the same key end up together. groupBy and joins need one. It is usually the most expensive step in a Spark job, a bit like a sort that spills in SQL Server. In a physical plan, look for Exchange."],
   try:[{lang:"python",label:"Python, either platform",code:R`from pyspark.sql import functions as F

spark.table("sales_silver").groupBy("customer_id").agg(F.sum("amount")).explain()`}],
   expect:"A physical plan with an Exchange node that hash-partitions by customer_id. That is the shuffle. Node names can differ when the native execution engine is on.",
   brk:[{p:"Now run a query with no grouping or join and compare. No aggregation means no Exchange."},
        {lang:"python",label:"Python",code:R`spark.table("sales_silver").filter("amount > 1000").select("order_id", "amount").explain()`}],
   prove:["You can point at the Exchange and say which operation caused it.","You can name one query shape that avoids a shuffle."],
   watch:"To see the same run visually, open it from the Monitor hub in Fabric and use the Spark UI. If the classic Spark UI is missing on Databricks serverless, use the query profile instead. Check the current docs for where to find it."}
 ]}

 ],
 ship:"A notebook pair, one in Databricks and one in Fabric, doing incremental Bronze to Silver with MERGE and a row-count check.",
 note:"Stuck on PySpark syntax? Drop into a SQL cell. It is the same engine and optimiser. Use it as a crutch early, then wean off it.",
 bridge:[["T-SQL SELECT","Spark SQL"],["T-SQL MERGE","Delta MERGE INTO"],["Temporal tables","Delta time travel"],["Execution plan","Spark plan and Exchange"]],
 links:[["Databricks Free Edition","https://www.databricks.com/learn/free-edition"],["Runtime 2.0 in Fabric","https://learn.microsoft.com/en-us/fabric/data-engineering/runtime-2-0"],["Delta Lake docs","https://docs.delta.io/latest/index.html"],["PySpark API reference","https://spark.apache.org/docs/latest/api/python/index.html"]]
};

/* ================================================================== */
/* Assemble + state                                                    */
/* ================================================================== */
var PHASES=[P0,P1,P2,P3,P4,P5];
var LESSONS=0;
PHASES.forEach(function(p){p.tasks.forEach(function(t){if(t.subs){LESSONS+=t.subs.length;}});});
var RGB={bronze:[226,144,79],silver:[195,206,230],gold:[255,203,77]};
var HI={bronze:"#ffd0a4",silver:"#f2f6ff",gold:"#fff3c2"};

var BRAND=window.BRAND||"Learning";
var WEEKS_TOTAL=11;

var KEY_V2="ssis-to-fabric-path-v2";
var KEY_V3="ssis-to-fabric-path-v3";
var items={};
var done={};
(function loadItems(){
  try{
    var raw=window.localStorage.getItem(KEY_V3);
    if(raw){
      var parsed=JSON.parse(raw);
      if(parsed&&parsed.items&&typeof parsed.items==="object"){items=parsed.items;return;}
    }
  }catch(e){}
  /* No v3 yet: migrate the legacy v2 flat {id:1} object. Every migrated
     item gets the same "now" timestamp; a real edit after this always
     has a later one, so future merges still resolve correctly. */
  try{
    var v2=JSON.parse(window.localStorage.getItem(KEY_V2)||"{}")||{};
    var now=Date.now();
    Object.keys(v2).forEach(function(id){if(v2[id]){items[id]=[1,now];}});
  }catch(e){}
  /* Only write v3 now if there was actually something to migrate. An
     empty v3 written pre-emptively (nothing in v2 either) would wrongly
     look like "already migrated" on a later load and block picking up
     a v2 write that happens afterwards (e.g. from an older cached tab). */
  if(Object.keys(items).length){persistItems();}
})();
function rebuildDone(){
  done={};
  Object.keys(items).forEach(function(id){if(items[id]&&items[id][0]){done[id]=1;}});
}
rebuildDone();
function persistItems(){try{window.localStorage.setItem(KEY_V3,JSON.stringify({v:1,items:items}));}catch(e){}}
function setItem(id,val){
  items[id]=[val?1:0,Date.now()];
  if(val){done[id]=1;}else{delete done[id];}
}
function persist(){rebuildDone();persistItems();}
function taskDone(t){return t.subs?t.subs.every(function(s){return !!done[s.id];}):!!done[t.id];}
var TOTAL=PHASES.reduce(function(a,p){return a+p.tasks.length;},0);
var TOTAL_HOURS=PHASES.reduce(function(a,p){return a+p.hours;},0);
var KNOWN_IDS={};
PHASES.forEach(function(p){p.tasks.forEach(function(t){KNOWN_IDS[t.id]=1;if(t.subs){t.subs.forEach(function(s){KNOWN_IDS[s.id]=1;});}});});

var META_KEY="ssis-to-fabric-path-meta";
var meta={};
try{meta=JSON.parse(window.localStorage.getItem(META_KEY)||"{}")||{};}catch(e){meta={};}
function persistMeta(){try{window.localStorage.setItem(META_KEY,JSON.stringify(meta));}catch(e){}}
function touchMeta(){meta.lastChangeAt=Date.now();persistMeta();updateSyncUI();}
function progressChanged(){touchMeta();scheduleSync();}

/* ================================================================== */
/* Rendering                                                           */
/* ================================================================== */
function weeksLabel(w){return w[0]===w[1]?"Week "+w[0]:"Weeks "+w[0]+" to "+w[1];}
function layerVars(p){return "--layer:var(--"+p.layer+");--layer2:var(--"+p.layer+"-2);--pl-hi:"+HI[p.layer];}
var ARROW='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h10M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV='<svg class="chev" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 8l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var TCHEV='<svg class="tchev" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 8l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function esc1(c){return ESC[c]||c;}
/* tiny highlighter: comments and strings only */
function hl(code,lang){
  var cm=lang==="sql"?"--":"#";
  return code.split("\n").map(function(line){
    var out="",i=0,q=null;
    while(i<line.length){
      var c=line.charAt(i);
      if(q){
        out+=esc1(c);
        if(c==="\\"&&i+1<line.length){out+=esc1(line.charAt(i+1));i+=2;continue;}
        if(c===q){out+="</span>";q=null;}
        i++;continue;
      }
      if(c==='"'||c==="'"){q=c;out+='<span class="ts">'+esc1(c);i++;continue;}
      if(line.substr(i,cm.length)===cm){out+='<span class="tc">'+esc(line.slice(i))+"</span>";i=line.length;break;}
      out+=esc1(c);i++;
    }
    if(q){out+="</span>";}
    return out;
  }).join("\n");
}

function ringSVG(uid,r,sw){
  var s=2*(r+sw),c=r+sw,len=2*Math.PI*r;
  return '<svg viewBox="0 0 '+s+' '+s+'" aria-hidden="true"><defs><linearGradient id="g'+uid+'" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#e2904f"/><stop offset=".5" stop-color="#c3cee6"/><stop offset="1" stop-color="#ffcb4d"/></linearGradient></defs>'+
   '<circle class="rt" cx="'+c+'" cy="'+c+'" r="'+r+'" stroke-width="'+sw+'"/>'+
   '<circle class="rf" data-len="'+len+'" cx="'+c+'" cy="'+c+'" r="'+r+'" stroke-width="'+sw+'" stroke="url(#g'+uid+')" stroke-dasharray="'+len+'" stroke-dashoffset="'+len+'" transform="rotate(-90 '+c+' '+c+')"/></svg>';
}
function mountRing(id,r,sw,withLabel){
  $("#"+id).innerHTML=ringSVG(id,r,sw)+(withLabel?'<span class="rl" data-rl>0%</span>':"");
}

function renderRoute(){
  var weeks="",grid="";
  for(var i=1;i<=11;i++){weeks+="<span>W"+i+"</span>";grid+="<span></span>";}
  var rows=PHASES.map(function(p){
    var len=p.weeks[1]-p.weeks[0]+1;
    return '<div class="rrow"><div class="rlabel"><span class="dot" style="background:radial-gradient(circle at 32% 28%,'+HI[p.layer]+',var(--'+p.layer+'))"></span>'+esc(p.short)+"</div>"+
     '<button type="button" class="rbar" data-go="'+p.id+'" style="'+layerVars(p)+';grid-column:'+(p.weeks[0]+1)+' / span '+len+'" aria-label="Open phase '+p.n+': '+esc(p.name)+', '+weeksLabel(p.weeks)+'">'+
     '<span class="rt">'+(len>1?"About "+p.hours+" h":p.hours+" h")+'</span><i class="rp"></i></button></div>';
  }).join("");
  var flags='<div class="rrow"><div class="rlabel" style="color:var(--dim)">Milestones</div>'+
   '<div class="rflag" style="grid-column:3 / span 2">Start the trial</div>'+
   '<div class="rflag end" style="grid-column:9 / span 3">Trial ends, about week 10</div></div>';
  $("#routeChart").innerHTML='<div class="rgrid">'+grid+'</div><div class="rhead"><span></span>'+weeks+"</div>"+rows+flags;
}

function renderStatic(){
  $("#rosetta").innerHTML=ROSETTA.map(function(r){
    return "<tr><td>"+esc(r[0])+"</td><td>"+esc(r[1])+'</td><td><button type="button" class="jump" data-go="p'+r[2]+'">Phase '+r[2]+"</button></td></tr>";
  }).join("");
  $("#freshRows").innerHTML=FRESH.map(function(r){
    return "<tr><td>"+esc(r[0])+"</td><td>"+esc(r[1])+"</td><td>"+esc(r[2])+"</td></tr>";
  }).join("");
  $("#stretchList").innerHTML=STRETCH.map(function(s,i){
    return '<div class="st spot rv soft" style="--d:'+(i%2?".12":"0")+'s"><h3>'+esc(s.name)+"</h3><p>"+esc(s.desc)+'</p><div class="chips">'+s.chips.map(function(c){return '<span class="chip">'+esc(c)+"</span>";}).join("")+"</div></div>";
  }).join("");
  $("#costList").innerHTML=COSTS.map(function(c){return "<li><b>"+esc(c[0])+"</b><span>"+esc(c[1])+"</span></li>";}).join("");
  $("#factLessons").textContent=LESSONS+" lessons";
  $("#factLessonsSub").textContent="in the phase 2 pilot";
}

function codeHTML(b){
  return '<div class="code"><div class="code-h"><span>'+esc(b.label||b.lang)+'</span><button type="button" class="copy" data-copy>Copy</button></div><pre><code>'+hl(b.code,b.lang)+"</code></pre></div>";
}
function blocksHTML(arr){
  return arr.map(function(b){return b.p?"<p>"+esc(b.p)+"</p>":codeHTML(b);}).join("");
}
function textOrBlocks(x){return typeof x==="string"?"<p>"+esc(x)+"</p>":blocksHTML(x);}

function lessonHTML(s){
  var quiz=(s.quiz||[]).map(function(q){return '<details class="q"><summary>'+esc(q[0])+"</summary><p>"+esc(q[1])+"</p></details>";}).join("");
  var proof=s.prove.map(function(x){return "<li>"+esc(x)+"</li>";}).join("");
  var links=(s.links||[]).length?'<p class="note">'+s.links.map(function(l){return '<a href="'+esc(l[1])+'" target="_blank" rel="noopener noreferrer">'+esc(l[0])+"</a>";}).join(" &nbsp; ")+"</p>":"";
  return '<div class="lesson">'+
   '<section class="ls"><h5>Learn</h5>'+s.learn.map(function(x){return "<p>"+esc(x)+"</p>";}).join("")+"</section>"+
   '<section class="ls try"><h5>Try it</h5>'+blocksHTML(s.try)+'<div class="expect"><b>You should see</b> '+esc(s.expect)+"</div></section>"+
   '<section class="ls brk"><h5>Break it</h5>'+textOrBlocks(s.brk)+"</section>"+
   '<section class="ls prove"><h5>Prove it</h5><ul class="proof">'+proof+"</ul>"+quiz+"</section>"+
   (s.watch?'<p class="gotcha"><b>Watch out.</b> '+esc(s.watch)+"</p>":"")+links+
   '<div class="lf"><label class="lchk"><input type="checkbox" data-lesson="'+s.id+'"><span class="box" aria-hidden="true"></span><span>Mark this lesson done</span></label>'+
   '<button type="button" class="mini" data-next="'+s.id+'">Next lesson</button></div></div>';
}

var SUBMAP={};
PHASES.forEach(function(p){p.tasks.forEach(function(t){if(t.subs){t.subs.forEach(function(s){SUBMAP[s.id]=s;});}});});
function ensureLesson(li){
  if(li.getAttribute("data-ready")) return;
  var id=li.getAttribute("data-sub"),clip=$(".sub-clip",li);
  clip.innerHTML=lessonHTML(SUBMAP[id]);
  var c=$("input[data-lesson]",clip); if(c) c.checked=!!done[id];
  li.setAttribute("data-ready","1");
}
function subHTML(s){
  return '<li class="sub" id="sub-'+s.id+'" data-sub="'+s.id+'"><span class="moon" aria-hidden="true"></span>'+
   '<button type="button" class="sub-head" aria-expanded="false" aria-controls="sb-'+s.id+'"><span class="sname">'+esc(s.t)+'</span><span class="mins">'+s.mins+' min</span></button>'+
   '<div class="sub-body" id="sb-'+s.id+'"><div class="sub-clip"></div></div></li>';
}

function taskHTML(t){
  var txt='<span class="txt"><span class="tt">'+esc(t.t)+"</span>"+(t.d?'<span class="td">'+esc(t.d)+"</span>":"")+"</span>";
  if(t.subs){
    return '<li class="task-item" id="task-'+t.id+'" data-task-item="'+t.id+'">'+
     '<button type="button" class="task-head" aria-expanded="false" aria-controls="tl-'+t.id+'"><span class="orbp" aria-hidden="true"></span>'+txt+'<span class="lp">0/'+t.subs.length+' lessons</span>'+TCHEV+"</button>"+
     '<div class="tl" id="tl-'+t.id+'"><div class="tl-clip"><ol class="subs">'+t.subs.map(subHTML).join("")+"</ol></div></div></li>";
  }
  return '<li id="task-'+t.id+'"><label class="task"><input type="checkbox" data-task="'+t.id+'"><span class="box" aria-hidden="true"></span>'+txt+"</label></li>";
}

function renderPhases(){
  var html=PHASES.map(function(p){
    var lc=0; p.tasks.forEach(function(t){if(t.subs){lc+=t.subs.length;}});
    var bridge=p.bridge.map(function(b){return '<div class="pair"><span class="o">'+esc(b[0])+"</span>"+ARROW+'<span class="n">'+esc(b[1])+"</span></div>";}).join("");
    var links=p.links.map(function(l){return '<li><a href="'+esc(l[1])+'" target="_blank" rel="noopener noreferrer">'+esc(l[0])+"</a></li>";}).join("");
    return '<li class="phase rv soft'+(p.lessons?" wide":"")+'" id="phase-'+p.id+'" data-layer="'+p.layer+'" style="'+layerVars(p)+'">'+
     '<span class="node" aria-hidden="true"><span>'+p.n+"</span></span>"+
     '<article class="panel spot">'+
      '<button type="button" class="ph-head" aria-expanded="false" aria-controls="body-'+p.id+'">'+
       '<span><span class="ph-layer"><i></i><b>Phase '+p.n+"</b><span>"+esc(p.layerName)+'</span></span><span class="ph-name">'+esc(p.name)+"</span>"+
       '<span class="ph-meta"><span class="chip">'+weeksLabel(p.weeks)+'</span><span class="chip">About '+p.hours+' hours</span><span class="chip '+p.tone+'">'+esc(p.cost)+'</span><span class="chip">Needs: '+esc(p.needs)+"</span>"+(lc?'<span class="chip new">'+lc+" lessons</span>":"")+"</span></span>"+
       '<span class="ph-right"><span class="pct" aria-label="Tasks done">0/'+p.tasks.length+"</span>"+CHEV+"</span>"+
       '<span class="pbar"><i></i></span>'+
      "</button>"+
      '<div class="ph-body" id="body-'+p.id+'"><div class="ph-clip"><div class="ph-inner">'+
       '<p class="goal">'+esc(p.goal)+"</p>"+
       '<div class="col"><h4>What to do</h4><ul class="tasks">'+p.tasks.map(taskHTML).join("")+"</ul></div>"+
       '<div class="col side">'+
        '<div class="ship"><h4>What you ship</h4><p>'+esc(p.ship)+"</p></div>"+
        "<div><h4>Bridge from what you know</h4>"+bridge+"</div>"+
        '<div><h4>Resources</h4><ul class="links">'+links+"</ul></div>"+
        (p.note?'<p class="note">'+esc(p.note)+"</p>":"")+
       "</div>"+
      "</div></div></div>"+
     "</article></li>";
  }).join("");
  html+='<li class="trail" id="trail" aria-hidden="true"></li><li class="probe" id="probe" aria-hidden="true"></li>';
  $("#phases").innerHTML=html;
}

/* ================================================================== */
/* Feedback: toast + star bursts                                       */
/* ================================================================== */
var toastT;
function toast(msg){
  var t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove("show");},4800);
}
var fx=$("#fx"),fctx=fx.getContext("2d"),sparks=[],fxRun=false;
function fxResize(){var d=Math.min(window.devicePixelRatio||1,1.5);fx.width=Math.round(innerWidth*d);fx.height=Math.round(innerHeight*d);fctx.setTransform(d,0,0,d,0,0);}
function burst(el,layer,n){
  if(reduce||!el) return;
  var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,c=RGB[layer]||RGB.gold;
  n=n||28;
  for(var i=0;i<n;i++){
    var a=Math.random()*6.283,s=.5+Math.random()*2.1;
    sparks.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,dec:.005+Math.random()*.006,r:.8+Math.random()*2,c:c});
  }
  if(!fxRun){fxRun=true;requestAnimationFrame(fxFrame);}
}
function fxFrame(){
  fctx.clearRect(0,0,innerWidth,innerHeight);
  fctx.globalCompositeOperation="lighter";
  for(var i=sparks.length-1;i>=0;i--){
    var p=sparks[i];
    p.x+=p.vx;p.y+=p.vy;p.vx*=.986;p.vy*=.986;p.life-=p.dec;
    if(p.life<=0){sparks.splice(i,1);continue;}
    fctx.fillStyle="rgba("+p.c[0]+","+p.c[1]+","+p.c[2]+","+(p.life*.9).toFixed(3)+")";
    fctx.beginPath();fctx.arc(p.x,p.y,p.r*(.6+p.life*.6),0,6.283);fctx.fill();
  }
  fctx.globalCompositeOperation="source-over";
  if(sparks.length){requestAnimationFrame(fxFrame);}else{fxRun=false;fctx.clearRect(0,0,innerWidth,innerHeight);}
}

/* ================================================================== */
/* State refresh                                                       */
/* ================================================================== */
function setRing(el,frac){
  var f=$(".rf",el); if(!f) return;
  var len=parseFloat(f.getAttribute("data-len"));
  f.style.strokeDashoffset=String(len*(1-frac));
  var l=$("[data-rl]",el); if(l) l.textContent=Math.round(frac*100)+"%";
}
var prevPhase={},prevTask={};

function nextItem(){
  for(var i=0;i<PHASES.length;i++){
    var p=PHASES[i];
    for(var j=0;j<p.tasks.length;j++){
      var t=p.tasks[j];
      if(!taskDone(t)){
        var s=null;
        if(t.subs){for(var k=0;k<t.subs.length;k++){if(!done[t.subs[k].id]){s=t.subs[k];break;}}}
        return {p:p,t:t,s:s};
      }
    }
  }
  return null;
}
function renderNext(){
  var n=nextItem(),box=$("#nextUp");
  if(!n){box.innerHTML='<div><span class="nu-t">Every phase is complete</span><strong>You have shipped the whole path</strong><span class="nu-s">Every build is in your repo, ready to show.</span></div>';return;}
  box.innerHTML='<div><span class="nu-t">Next up: phase '+n.p.n+", "+esc(n.p.short)+"</span><strong>"+esc(n.s?n.s.t:n.t.t)+'</strong><span class="nu-s">'+(n.s?esc(n.t.t)+", about "+n.s.mins+" minutes":"Task in "+esc(n.p.name))+'</span></div><button type="button" class="btn primary" data-open-next>Open it</button>';
}

function refresh(silent){
  var all=0,curFound=false,curPhase=null;
  PHASES.forEach(function(p,i){
    var n=0;
    p.tasks.forEach(function(t){
      var d=taskDone(t); if(d) n++;
      if(t.subs){
        var item=$("#task-"+t.id),sd=t.subs.filter(function(s){return done[s.id];}).length;
        item.classList.toggle("done",d);
        $(".orbp",item).style.setProperty("--p",String(sd/t.subs.length*100));
        $(".lp",item).textContent=sd+"/"+t.subs.length+" lessons";
        t.subs.forEach(function(s){$("#sub-"+s.id).classList.toggle("done",!!done[s.id]);});
        if(!silent&&d&&!prevTask[t.id]){burst($(".orbp",item),p.layer,34);}
        prevTask[t.id]=d;
      }
    });
    var full=n===p.tasks.length,li=$("#phase-"+p.id);
    all+=n;
    li.classList.toggle("complete",full);
    var isCur=!curFound&&!full; if(isCur){curFound=true;curPhase=p;}
    li.classList.toggle("current",isCur);
    $(".pbar i",li).style.width=(n/p.tasks.length*100)+"%";
    $(".pct",li).textContent=n+"/"+p.tasks.length;
    var bar=$('.rbar[data-go="'+p.id+'"]');
    bar.classList.toggle("current",isCur);bar.classList.toggle("complete",full);
    $(".rp",bar).style.width=(n/p.tasks.length*100)+"%";
    if(!silent&&full&&!prevPhase[p.id]){
      li.classList.add("burst");setTimeout(function(){li.classList.remove("burst");},1800);
      burst($(".node",li),p.layer,60);
      toast(i<PHASES.length-1?"Phase "+p.n+" is refined. Next up: phase "+PHASES[i+1].n+", "+PHASES[i+1].short.toLowerCase()+".":"Every phase is complete. You have shipped the whole path.");
    }
    prevPhase[p.id]=full;
  });
  var frac=all/TOTAL;
  setRing($("#navRing"),frac);setRing($("#heroRing"),frac);
  $("#navPct").textContent=Math.round(frac*100)+"%";
  $("#heroLine").textContent=all+" of "+TOTAL+" tasks done";
  $("#heroSub").textContent=all===0?"Tick tasks as you go. Progress is saved in this browser.":(curPhase?"Current phase: "+curPhase.n+", "+curPhase.short+".":"The whole path is complete.");
  $("#startBtn").textContent=all===0?"Start with phase 0":(curPhase?"Continue with phase "+curPhase.n:"Review the path");
  renderNext();
}

/* ================================================================== */
/* Open / close                                                        */
/* ================================================================== */
function setOpen(li,open,btnSel){
  li.classList.toggle("open",open);
  var b=$(btnSel,li); if(b) b.setAttribute("aria-expanded",open?"true":"false");
}
function openPhase(id){var li=$("#phase-"+id); if(li) setOpen(li,true,".ph-head");return li;}
function openTask(id){var li=$("#task-"+id); if(li&&li.classList.contains("task-item")) setOpen(li,true,".task-head");return li;}
function openSub(id){
  var li=$("#sub-"+id); if(!li) return null;
  $$(".sub.open",li.parentNode).forEach(function(o){if(o!==li) setOpen(o,false,".sub-head");});
  ensureLesson(li);setOpen(li,true,".sub-head");return li;
}
function goTo(el,delay){
  if(!el) return;
  setTimeout(function(){el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});},delay||150);
}
function openNext(){
  var n=nextItem(); if(!n) return;
  var ph=openPhase(n.p.id);
  if(n.s){openTask(n.t.id);var sub=openSub(n.s.id);goTo($(".sub-head",sub),250);}
  else{goTo($("#task-"+n.t.id),250);}
  if(!n.s&&!ph){return;}
}
function nextLesson(afterId){
  var flat=[];
  PHASES.forEach(function(p){p.tasks.forEach(function(t){if(t.subs){t.subs.forEach(function(s){flat.push({p:p,t:t,s:s});});}});});
  for(var i=0;i<flat.length;i++){
    if(flat[i].s.id===afterId){
      var nx=flat[i+1];
      if(nx){
        setOpen($("#sub-"+afterId),false,".sub-head");
        openPhase(nx.p.id);openTask(nx.t.id);var sub=openSub(nx.s.id);goTo($(".sub-head",sub),250);
      }else{setOpen($("#sub-"+afterId),false,".sub-head");toast("That was the last lesson in this pilot. Continue with phase 3.");goTo($("#phase-p3"),300);}
      return;
    }
  }
}

function copyText(t,btn){
  function finish(ok){btn.textContent=ok?"Copied":"Select and copy";setTimeout(function(){btn.textContent="Copy";},1800);}
  function fallback(){
    var ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();
    var ok=false;try{ok=document.execCommand("copy");}catch(e){}
    document.body.removeChild(ta);finish(ok);
  }
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){finish(true);},fallback);return;}
  }catch(e){}
  fallback();
}

function bindIO(){
  var panel=$("#ioPanel"),title=$("#ioTitle"),hint=$("#ioHint"),text=$("#ioText"),primary=$("#ioPrimary"),closeBtn=$("#ioClose");
  var exportBtn=$("#exportProgress"),importBtn=$("#importProgress");
  var mode="export",opener=null;
  function writeClipboard(s,onDone){
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(s).then(function(){onDone(true);},function(){onDone(false);});return;}
    }catch(e){}
    onDone(false);
  }
  function openIO(m,btn){
    mode=m;opener=btn||document.activeElement;
    if(mode==="export"){
      title.textContent="Export progress";
      text.value=JSON.stringify(done,null,2);
      text.readOnly=true;
      primary.textContent="Copy";
      hint.textContent="Copying to your clipboard...";
      writeClipboard(text.value,function(ok){
        hint.textContent=ok?"Copied to your clipboard.":"Could not copy automatically. Select the text below and copy it.";
      });
    }else{
      title.textContent="Import progress";
      text.value="";
      text.readOnly=false;
      primary.textContent="Import";
      hint.textContent="Paste progress JSON exported from this page, then select Import. Unrecognised ids are skipped and your current progress is kept and merged.";
    }
    panel.hidden=false;
    text.focus();
    if(mode==="export"){text.select();}
  }
  function closeIO(){
    panel.hidden=true;
    if(opener&&opener.focus){opener.focus();}
  }
  function doImport(){
    var parsed;
    try{parsed=JSON.parse(text.value);}catch(e){hint.textContent="That is not valid JSON.";return;}
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)){hint.textContent="Expected a JSON object of id to 1.";return;}
    var added=0,skipped=0;
    Object.keys(parsed).forEach(function(id){
      if(!KNOWN_IDS[id]){skipped++;return;}
      if(parsed[id]){setItem(id,1);added++;}
    });
    persistItems();syncChecks();refresh(true);progressChanged();
    closeIO();
    toast("Imported "+added+" item"+(added===1?"":"s")+(skipped?", skipped "+skipped+" unrecognised":"")+".");
  }
  exportBtn.addEventListener("click",function(){openIO("export",exportBtn);});
  importBtn.addEventListener("click",function(){openIO("import",importBtn);});
  closeBtn.addEventListener("click",closeIO);
  primary.addEventListener("click",function(){
    if(mode==="export"){writeClipboard(text.value,function(ok){hint.textContent=ok?"Copied to your clipboard.":"Could not copy automatically. Select the text below and copy it.";});}
    else{doImport();}
  });
  panel.addEventListener("click",function(e){if(e.target===panel){closeIO();}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){closeIO();}});
}

/* ================================================================== */
/* Time (always IST), stats and the insights + account UI              */
/* ================================================================== */
var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var IST_FMT=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true});
function istParts(ts){
  var out={};
  IST_FMT.formatToParts(new Date(ts)).forEach(function(p){out[p.type]=p.value;});
  return out;
}
function fmtIST(ts){
  var p=istParts(ts),now=istParts(Date.now());
  var time=p.hour+":"+p.minute+" "+p.dayPeriod.toLowerCase()+" IST";
  if(p.year===now.year&&p.month===now.month&&p.day===now.day){return time;}
  return Number(p.day)+" "+MONTHS[Number(p.month)-1]+", "+time;
}
function istDateKey(ts){
  var p=istParts(ts);
  return [p.year,p.month.length<2?"0"+p.month:p.month,p.day.length<2?"0"+p.day:p.day].join("-");
}

function computeStats(){
  var doneCount=0,hoursDone=0,lessonsDone=0;
  var phaseStats=PHASES.map(function(p){
    var n=0;
    p.tasks.forEach(function(t){
      if(taskDone(t)){n++;}
      if(t.subs){t.subs.forEach(function(s){if(done[s.id]){lessonsDone++;}});}
    });
    doneCount+=n;
    var hrs=n*p.hours/p.tasks.length;
    hoursDone+=hrs;
    return {phase:p,done:n,total:p.tasks.length,hours:hrs};
  });
  return {doneCount:doneCount,totalTasks:TOTAL,hoursDone:hoursDone,totalHours:TOTAL_HOURS,lessonsDone:lessonsDone,lessonsTotal:LESSONS,phaseStats:phaseStats};
}

/* ================================================================== */
/* Sync: local-first, debounced push, pull + per-item merge            */
/* ================================================================== */
var SYNC_DEBOUNCE_MS=800;
var SYNC_BACKOFF_MAX_MS=60000;
var syncTimer=null,syncBackoffMs=2000;
var syncInFlight=null,syncDirty=false;
var localGen=0,savedGen=-1;
var syncState="idle";
var hasPulledThisSession=false;

function setSyncState(s){syncState=s;updateSyncUI();}

function mergeItems(remoteItems){
  var changed=false;
  Object.keys(remoteItems||{}).forEach(function(id){
    var r=remoteItems[id],l=items[id];
    if(r&&(!l||r[1]>l[1])){items[id]=r;changed=true;}
  });
  return changed;
}

function runSync(){
  var client=window.APP_AUTH_CLIENT;
  if(!client){return Promise.resolve();}
  if(syncInFlight){localGen++;return syncInFlight;}
  if(navigator.onLine===false){setSyncState("offline");return Promise.resolve();}
  var startGen=localGen;
  setSyncState("saving");
  var payload={v:1,items:items,meta:{startDate:meta.startDate||null}};
  syncInFlight=client.auth.getSession().then(function(res){
    var session=res&&res.data&&res.data.session,uid=session&&session.user&&session.user.id;
    if(!uid){throw new Error("not signed in");}
    return client.from("progress").upsert({user_id:uid,data:payload,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  }).then(function(res){
    if(res&&res.error){throw res.error;}
    syncBackoffMs=2000;
    savedGen=startGen;
    if(localGen===startGen){syncDirty=false;}
    meta.lastSavedAt=Date.now();persistMeta();
    setSyncState("saved");
    syncInFlight=null;
    if(localGen!==startGen){scheduleSync();}
  }).catch(function(){
    syncInFlight=null;
    setSyncState("error");
    scheduleRetry();
  });
  return syncInFlight;
}
function scheduleSync(){
  if(!window.APP_AUTH_CLIENT){return;}
  localGen++;syncDirty=true;
  setSyncState("saving");
  clearTimeout(syncTimer);
  syncTimer=setTimeout(runSync,SYNC_DEBOUNCE_MS);
}
function scheduleRetry(){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(runSync,syncBackoffMs);
  syncBackoffMs=Math.min(syncBackoffMs*2,SYNC_BACKOFF_MAX_MS);
}
function pullAndMerge(){
  var client=window.APP_AUTH_CLIENT;
  if(!client){return Promise.resolve();}
  return client.auth.getSession().then(function(res){
    var session=res&&res.data&&res.data.session,uid=session&&session.user&&session.user.id;
    if(!uid){return;}
    return client.from("progress").select("data,updated_at").eq("user_id",uid).maybeSingle().then(function(res2){
      if(res2&&res2.error){throw res2.error;}
      var remote=res2&&res2.data,remoteItems=remote&&remote.data&&remote.data.items;
      if(remoteItems&&Object.keys(remoteItems).length){
        mergeItems(remoteItems);
        if(remote.data.meta&&remote.data.meta.startDate&&!meta.startDate){meta.startDate=remote.data.meta.startDate;persistMeta();}
        rebuildDone();persistItems();syncChecks();refresh(true);
      }
      clearTimeout(syncTimer);
      return runSync();
    });
  }).catch(function(){
    setSyncState("error");
  });
}
function pullAll(){pullAndMerge();pullNotes();}

/* ================================================================== */
/* Notes: local-first store + per-scope sync (storage layer; the       */
/* drawer/editor UI reads and writes through the functions below)      */
/* ================================================================== */
var NOTES_KEY="ssis-to-fabric-notes-v1";
var NOTE_DEBOUNCE_MS=800;
var NOTE_BACKOFF_MAX_MS=60000;
var notesDoc={v:1,notes:{}};
(function loadNotes(){
  try{
    var raw=window.localStorage.getItem(NOTES_KEY);
    if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.notes&&typeof parsed.notes==="object"){notesDoc=parsed;}}
  }catch(e){}
})();
function persistNotes(){try{window.localStorage.setItem(NOTES_KEY,JSON.stringify(notesDoc));}catch(e){}}

var KNOWN_LESSON_IDS={};
PHASES.forEach(function(p){p.tasks.forEach(function(t){if(t.subs){t.subs.forEach(function(s){KNOWN_LESSON_IDS[s.id]=1;});}});});
var PHASE_SCOPE_RE=/^p[0-5]$/;
var LESSON_SCOPE_RE=/^lesson:([a-z0-9-]+)$/;
function isValidScope(scope){
  if(scope==="scratch"||PHASE_SCOPE_RE.test(scope)){return true;}
  var m=LESSON_SCOPE_RE.exec(scope);
  return !!(m&&KNOWN_LESSON_IDS[m[1]]);
}

var noteSyncTimers={},noteSyncInFlight={},noteSyncBackoff={},noteSyncState={};
var noteConflicts={};
var notesListeners=[];
function onNotesChanged(fn){notesListeners.push(fn);}
function fireNotesChanged(){notesListeners.forEach(function(fn){try{fn();}catch(e){}});}

function noteRecord(scope){return notesDoc.notes[scope];}
function setNoteSyncState(scope,s){noteSyncState[scope]=s;updateSyncUI();}

function setNoteBody(scope,body){
  if(!isValidScope(scope)){return;}
  var rec=notesDoc.notes[scope];
  if(!body&&!rec){return;}
  if(!rec){rec=notesDoc.notes[scope]={body:"",localUpdatedAt:0,serverUpdatedAt:0,dirty:false};}
  rec.body=body;
  rec.localUpdatedAt=Date.now();
  rec.dirty=true;
  delete noteConflicts[scope];
  persistNotes();
  touchMeta();
  fireNotesChanged();
  scheduleNoteSync(scope);
}
function deleteNoteLocal(scope){
  delete notesDoc.notes[scope];
  delete noteConflicts[scope];
  persistNotes();
  fireNotesChanged();
}

function anyNoteSyncInFlight(){return Object.keys(noteSyncInFlight).length>0;}
function anyNoteUnsynced(){
  return Object.keys(notesDoc.notes).some(function(scope){
    var r=notesDoc.notes[scope];
    return r.dirty||noteSyncState[scope]==="error"||noteSyncState[scope]==="offline";
  })||Object.keys(noteConflicts).length>0;
}
function combinedSyncState(){
  var states=[syncState];
  Object.keys(noteSyncState).forEach(function(k){states.push(noteSyncState[k]);});
  if(states.indexOf("error")>-1||Object.keys(noteConflicts).length){return "error";}
  if(states.indexOf("saving")>-1){return "saving";}
  if(states.indexOf("offline")>-1){return "offline";}
  return "saved";
}

function runNoteSync(scope){
  var client=window.APP_AUTH_CLIENT;
  if(!client){return Promise.resolve();}
  if(noteSyncInFlight[scope]){return noteSyncInFlight[scope];}
  var rec=notesDoc.notes[scope];
  if(!rec){return Promise.resolve();}
  if(navigator.onLine===false){setNoteSyncState(scope,"offline");return Promise.resolve();}
  setNoteSyncState(scope,"saving");
  var startAt=rec.localUpdatedAt;
  var body=rec.body;
  var isDelete=!body||!body.trim();
  var iso=new Date().toISOString();
  var p=client.auth.getSession().then(function(res){
    var session=res&&res.data&&res.data.session,uid=session&&session.user&&session.user.id;
    if(!uid){throw new Error("not signed in");}
    if(isDelete){return client.from("notes").delete().eq("user_id",uid).eq("scope",scope);}
    return client.from("notes").upsert({user_id:uid,scope:scope,body:body,updated_at:iso},{onConflict:"user_id,scope"});
  }).then(function(res){
    if(res&&res.error){throw res.error;}
    delete noteSyncInFlight[scope];
    noteSyncBackoff[scope]=2000;
    var current=notesDoc.notes[scope];
    if(current&&current.localUpdatedAt===startAt){
      if(isDelete){delete notesDoc.notes[scope];}
      else{current.serverUpdatedAt=Date.parse(iso);current.dirty=false;}
      persistNotes();
      setNoteSyncState(scope,"saved");
    }else if(current){
      setNoteSyncState(scope,"saved");
      scheduleNoteSync(scope);
    }
    meta.lastSavedAt=Date.now();persistMeta();updateSyncUI();
    fireNotesChanged();
  }).catch(function(){
    delete noteSyncInFlight[scope];
    setNoteSyncState(scope,"error");
    scheduleNoteRetry(scope);
  });
  noteSyncInFlight[scope]=p;
  return p;
}
function scheduleNoteSync(scope){
  if(!window.APP_AUTH_CLIENT){return;}
  clearTimeout(noteSyncTimers[scope]);
  setNoteSyncState(scope,"saving");
  noteSyncTimers[scope]=setTimeout(function(){runNoteSync(scope);},NOTE_DEBOUNCE_MS);
}
function scheduleNoteRetry(scope){
  clearTimeout(noteSyncTimers[scope]);
  var ms=noteSyncBackoff[scope]||2000;
  noteSyncTimers[scope]=setTimeout(function(){runNoteSync(scope);},ms);
  noteSyncBackoff[scope]=Math.min(ms*2,NOTE_BACKOFF_MAX_MS);
}

function pullNotes(){
  var client=window.APP_AUTH_CLIENT;
  if(!client){return Promise.resolve();}
  return client.auth.getSession().then(function(res){
    var session=res&&res.data&&res.data.session,uid=session&&session.user&&session.user.id;
    if(!uid){return;}
    return client.from("notes").select("scope,body,updated_at").eq("user_id",uid).then(function(res2){
      if(res2&&res2.error){throw res2.error;}
      (res2&&res2.data||[]).forEach(function(row){
        if(!isValidScope(row.scope)){return;}
        var remoteTs=Date.parse(row.updated_at);
        var rec=notesDoc.notes[row.scope];
        if(!rec){
          notesDoc.notes[row.scope]={body:row.body,localUpdatedAt:remoteTs,serverUpdatedAt:remoteTs,dirty:false};
          return;
        }
        if(remoteTs>rec.serverUpdatedAt){
          if(rec.dirty){
            noteConflicts[row.scope]={local:{body:rec.body,at:rec.localUpdatedAt},remote:{body:row.body,at:remoteTs}};
          }else{
            rec.body=row.body;rec.localUpdatedAt=remoteTs;rec.serverUpdatedAt=remoteTs;rec.dirty=false;
          }
        }
      });
      persistNotes();
      Object.keys(notesDoc.notes).forEach(function(scope){
        if(notesDoc.notes[scope].dirty&&!noteConflicts[scope]){scheduleNoteSync(scope);}
      });
      updateSyncUI();
      fireNotesChanged();
    });
  }).catch(function(){});
}

function resolveConflictKeepMine(scope){
  var c=noteConflicts[scope];if(!c){return;}
  delete noteConflicts[scope];
  var rec=notesDoc.notes[scope];
  if(!rec){return;}
  rec.localUpdatedAt=Date.now();rec.dirty=true;
  persistNotes();fireNotesChanged();
  scheduleNoteSync(scope);
}
function resolveConflictUseTheirs(scope){
  var c=noteConflicts[scope];if(!c){return;}
  delete noteConflicts[scope];
  notesDoc.notes[scope]={body:c.remote.body,localUpdatedAt:c.remote.at,serverUpdatedAt:c.remote.at,dirty:false};
  persistNotes();fireNotesChanged();updateSyncUI();
}
function resolveConflictCopyMine(scope){
  var c=noteConflicts[scope];if(!c){return;}
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(c.local.body);}
  }catch(e){}
  resolveConflictUseTheirs(scope);
}

function guardSignOut(onProceed){
  function decide(){
    if(!syncDirty&&syncState!=="error"&&syncState!=="offline"&&!anyNoteUnsynced()){onProceed();return;}
    openSyncWarn(onProceed);
  }
  var pending=[];
  if(syncInFlight){pending.push(syncInFlight.catch(function(){}));}
  Object.keys(noteSyncInFlight).forEach(function(scope){pending.push(noteSyncInFlight[scope].catch(function(){}));});
  if(pending.length){
    toast("Finishing save before sign out…");
    Promise.race([Promise.all(pending),new Promise(function(res){setTimeout(res,8000);})]).then(decide);
  }else{
    decide();
  }
}
function openSyncWarn(onProceed){
  var dlg=$("#syncWarn"),body=$("#syncWarnBody"),exportBtn=$("#syncWarnExport"),cancelBtn=$("#syncWarnCancel"),proceedBtn=$("#syncWarnProceed");
  body.textContent=syncState==="error"?
    "Your last save to the cloud failed. Signing out now could lose that change on this device if something happens to it before you sign back in.":
    "Your latest change has not finished saving to the cloud yet. Signing out now could lose it on this device if something happens to it before you sign back in.";
  dlg.hidden=false;
  proceedBtn.focus();
  function onKey(e){if(e.key==="Escape"){close();return;}trapTab(e,dlg);}
  function close(){dlg.hidden=true;document.removeEventListener("keydown",onKey);}
  document.addEventListener("keydown",onKey);
  exportBtn.onclick=function(){close();$("#exportProgress").click();};
  cancelBtn.onclick=function(){close();};
  proceedBtn.onclick=function(){close();onProceed();};
}
window.APP_SYNC={guardSignOut:guardSignOut};

function syncStatus(){
  var client=window.APP_AUTH_CLIENT;
  if(!client){
    var text="Saved on this device";
    if(meta.lastChangeAt){text+=" · "+fmtIST(meta.lastChangeAt);}
    return {dot:"local",text:text};
  }
  var combined=combinedSyncState();
  if(combined==="saving"){return {dot:"saving",text:"Saving…"};}
  if(combined==="offline"){return {dot:"offline",text:"Offline · saved on this device"};}
  if(combined==="error"){return {dot:"error",text:"Could not save to the cloud · retrying"};}
  if(meta.lastSavedAt){return {dot:"saved",text:"Saved "+fmtIST(meta.lastSavedAt)};}
  var fallback="Saved on this device";
  if(meta.lastChangeAt){fallback+=" · "+fmtIST(meta.lastChangeAt);}
  return {dot:"local",text:fallback};
}

function updateSyncUI(){
  var s=syncStatus(),dot=$("#pillDot"),saved=$("#pillSaved");
  if(dot){dot.className="ip-dot ip-dot-"+s.dot;}
  if(saved){saved.textContent=s.text;}
  var panel=$("#insightsPanel");
  if(panel&&!panel.hidden){renderInsightsPanel();}
}

function weekInfo(){
  if(!meta.startDate){return null;}
  var sp=meta.startDate.split("-").map(Number);
  var startUTC=Date.UTC(sp[0],sp[1]-1,sp[2]);
  var np=istDateKey(Date.now()).split("-").map(Number);
  var nowUTC=Date.UTC(np[0],np[1]-1,np[2]);
  var days=Math.floor((nowUTC-startUTC)/86400000);
  var week=Math.max(1,Math.floor(days/7)+1);
  var planned=TOTAL_HOURS*Math.min(1,week/WEEKS_TOTAL);
  return {week:week,planned:planned};
}

function renderInsightsPanel(){
  var stats=computeStats();
  $("#ipDoneFrac").textContent=stats.doneCount+" of "+stats.totalTasks;
  $("#ipDonePct").textContent="("+(stats.totalTasks?Math.round(stats.doneCount/stats.totalTasks*100):0)+"%)";
  $("#ipLessons").textContent=stats.lessonsDone+" of "+stats.lessonsTotal+" lessons done";
  $("#ipHours").innerHTML="About "+Math.round(stats.hoursDone)+" of "+stats.totalHours+' hours <span class="ip-est">(estimate)</span>';
  $("#ipPhaseBars").innerHTML=stats.phaseStats.map(function(ps){
    var p=ps.phase,pct=ps.total?Math.round(ps.done/ps.total*100):0;
    return '<li class="ip-pbrow" style="'+layerVars(p)+'"><span class="ip-pname">'+esc(p.short)+'</span><span class="ip-pbar"><i style="width:'+pct+'%"></i></span><span class="ip-pcount">'+ps.done+"/"+ps.total+"</span></li>";
  }).join("");
  var n=nextItem(),openBtn=$("#ipOpenNext");
  if(!n){
    $("#ipCurrent").textContent="Every phase is complete.";
    $("#ipNext").textContent="You have shipped the whole path.";
    openBtn.hidden=true;
  }else{
    $("#ipCurrent").textContent="Phase "+n.p.n+": "+n.p.short;
    $("#ipNext").textContent=n.s?n.s.t+" ("+n.t.t+")":n.t.t;
    openBtn.hidden=false;
  }
  var s=syncStatus();
  $("#ipSaveStatus").textContent=s.text;
  $("#ipLastSaved").textContent=meta.lastSavedAt?("Last saved "+fmtIST(meta.lastSavedAt)):"Not yet saved to the cloud.";
  $("#ipLastChange").textContent=meta.lastChangeAt?("Last change on this device "+fmtIST(meta.lastChangeAt)):"No changes yet.";
  var wi=weekInfo(),weekEl=$("#ipWeekInfo");
  if(wi){
    weekEl.hidden=false;
    weekEl.textContent="Week "+wi.week+" of "+WEEKS_TOTAL+" · about "+Math.round(stats.hoursDone)+" hours done, about "+Math.round(wi.planned)+" planned by now.";
  }else{
    weekEl.hidden=true;
  }
  $("#ipStartDateInput").value=meta.startDate||"";
}

function focusables(container){
  return $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',container).filter(function(el){return !el.disabled&&el.offsetParent!==null;});
}
function trapTab(e,container){
  if(e.key!=="Tab"){return;}
  var f=focusables(container);
  if(!f.length){return;}
  var first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}

function bindInsights(){
  var pill=$("#insightsPill"),panel=$("#insightsPanel"),closeBtn=$("#insightsClose");
  var accountWrap=$("#accountWrap"),accountBtn=$("#accountBtn"),accountMenu=$("#accountMenu");
  var accountInitial=$("#accountInitial"),accountEmail=$("#accountEmail");
  var menuExport=$("#menuExport"),menuImport=$("#menuImport"),menuSignOut=$("#menuSignOut"),menuClearDevice=$("#menuClearDevice");

  function onInsightsKey(e){
    if(e.key==="Escape"){closeInsights();return;}
    trapTab(e,panel);
  }
  function onInsightsOutside(e){
    if(panel.contains(e.target)||pill.contains(e.target)){return;}
    closeInsights();
  }
  function openInsights(){
    closeAccountMenu();
    renderInsightsPanel();
    panel.hidden=false;
    pill.setAttribute("aria-expanded","true");
    closeBtn.focus();
    document.addEventListener("keydown",onInsightsKey);
    document.addEventListener("click",onInsightsOutside,true);
  }
  function closeInsights(){
    if(panel.hidden){return;}
    panel.hidden=true;
    pill.setAttribute("aria-expanded","false");
    document.removeEventListener("keydown",onInsightsKey);
    document.removeEventListener("click",onInsightsOutside,true);
    pill.focus();
  }
  pill.addEventListener("click",function(){if(panel.hidden){openInsights();}else{closeInsights();}});
  closeBtn.addEventListener("click",closeInsights);
  $("#ipOpenNext").addEventListener("click",function(){closeInsights();openNext();});
  $("#ipStartDateSave").addEventListener("click",function(){
    var v=$("#ipStartDateInput").value;
    meta.startDate=v||null;
    persistMeta();
    renderInsightsPanel();
    toast(v?"Start date set.":"Start date cleared.");
  });

  function menuItemEls(){return $$(".account-item",accountMenu);}
  function onAccountKey(e){
    var items=menuItemEls(),idx=items.indexOf(document.activeElement);
    if(e.key==="Escape"){closeAccountMenu();accountBtn.focus();return;}
    if(e.key==="ArrowDown"){e.preventDefault();items[(idx+1+items.length)%items.length].focus();return;}
    if(e.key==="ArrowUp"){e.preventDefault();items[(idx-1+items.length)%items.length].focus();return;}
    if(e.key==="Tab"){closeAccountMenu();}
  }
  function onAccountOutside(e){
    if(accountMenu.contains(e.target)||accountBtn.contains(e.target)){return;}
    closeAccountMenu();
  }
  function openAccountMenu(){
    closeInsights();
    accountMenu.hidden=false;
    accountBtn.setAttribute("aria-expanded","true");
    var items=menuItemEls();
    if(items[0]){items[0].focus();}
    document.addEventListener("keydown",onAccountKey);
    document.addEventListener("click",onAccountOutside,true);
  }
  function closeAccountMenu(){
    if(accountMenu.hidden){return;}
    accountMenu.hidden=true;
    accountBtn.setAttribute("aria-expanded","false");
    document.removeEventListener("keydown",onAccountKey);
    document.removeEventListener("click",onAccountOutside,true);
  }
  accountBtn.addEventListener("click",function(){
    if(accountMenu.hidden){openAccountMenu();}else{closeAccountMenu();accountBtn.focus();}
  });
  menuExport.addEventListener("click",function(){closeAccountMenu();$("#exportProgress").click();});
  menuImport.addEventListener("click",function(){closeAccountMenu();$("#importProgress").click();});
  menuSignOut.addEventListener("click",function(){
    closeAccountMenu();
    guardSignOut(function(){if(window.APP_AUTH_SIGNOUT){window.APP_AUTH_SIGNOUT();}else{$("#signOut").click();}});
  });
  menuClearDevice.addEventListener("click",function(){
    closeAccountMenu();
    guardSignOut(function(){
      try{
        window.localStorage.removeItem(KEY_V2);
        window.localStorage.removeItem(KEY_V3);
        window.localStorage.removeItem(META_KEY);
        window.localStorage.removeItem(NOTES_KEY);
      }catch(e){}
      items={};meta={};rebuildDone();persistItems();persistMeta();syncChecks();prevPhase={};prevTask={};refresh(true);
      syncDirty=false;clearTimeout(syncTimer);setSyncState("idle");
      notesDoc={v:1,notes:{}};noteConflicts={};noteSyncState={};
      Object.keys(noteSyncTimers).forEach(function(s){clearTimeout(noteSyncTimers[s]);});
      noteSyncTimers={};fireNotesChanged();
      if(window.APP_AUTH_SIGNOUT){window.APP_AUTH_SIGNOUT();}else{$("#signOut").click();}
    });
  });

  var authClient=window.APP_AUTH_CLIENT;
  if(!authClient){accountWrap.hidden=true;}
  else{
    var applySession=function(session){
      var signedIn=!!session;
      accountWrap.hidden=!signedIn;
      if(signedIn){
        var email=(session.user&&session.user.email)||"";
        accountInitial.textContent=email?email.charAt(0).toUpperCase():"?";
        accountEmail.textContent=email;
        if(!hasPulledThisSession){hasPulledThisSession=true;pullAll();}
      }else{
        closeAccountMenu();
        hasPulledThisSession=false;
      }
      updateSyncUI();
    };
    authClient.auth.getSession().then(function(res){applySession(res&&res.data&&res.data.session);}).catch(function(){accountWrap.hidden=true;});
    authClient.auth.onAuthStateChange(function(event,session){applySession(session);});
    document.addEventListener("visibilitychange",function(){if(!document.hidden){pullAll();}});
    window.addEventListener("online",function(){pullAll();});
    window.addEventListener("offline",function(){setSyncState("offline");});
  }
}

function bind(){
  document.addEventListener("change",function(e){
    var t=e.target; if(!t.matches) return;
    var id=t.getAttribute("data-task")||t.getAttribute("data-lesson"); if(!id) return;
    setItem(id,t.checked);
    if(t.checked){burst(t.nextElementSibling,t.closest(".phase")?t.closest(".phase").getAttribute("data-layer"):"gold",22);}
    persistItems();refresh(false);progressChanged();
  });
  document.addEventListener("click",function(e){
    var tg=e.target; if(!tg.closest) return;
    var b;
    if((b=tg.closest("[data-copy]"))){var pre=b.closest(".code").querySelector("pre");copyText(pre.textContent,b);return;}
    if((b=tg.closest("[data-next]"))){nextLesson(b.getAttribute("data-next"));return;}
    if((b=tg.closest("[data-open-next]"))){openNext();return;}
    if((b=tg.closest(".sub-head"))){var s=b.closest(".sub");if(s.classList.contains("open")){setOpen(s,false,".sub-head");}else{openSub(s.getAttribute("data-sub"));}return;}
    if((b=tg.closest(".task-head"))){var ti=b.closest(".task-item");setOpen(ti,!ti.classList.contains("open"),".task-head");return;}
    if((b=tg.closest(".ph-head"))){var li=b.closest(".phase");setOpen(li,!li.classList.contains("open"),".ph-head");return;}
    if((b=tg.closest("[data-go]"))){var ph=openPhase(b.getAttribute("data-go"));goTo(ph,150);return;}
  });
  $("#expandAll").addEventListener("click",function(){$$(".phase").forEach(function(li){setOpen(li,true,".ph-head");});});
  $("#collapseAll").addEventListener("click",function(){$$(".phase").forEach(function(li){setOpen(li,false,".ph-head");});});
  var rt,rb=$("#reset");
  rb.addEventListener("click",function(){
    if(!rb.getAttribute("data-arm")){
      rb.setAttribute("data-arm","1");rb.textContent="Select again to confirm";
      rt=setTimeout(function(){rb.removeAttribute("data-arm");rb.textContent="Reset progress";},4000);return;
    }
    clearTimeout(rt);rb.removeAttribute("data-arm");rb.textContent="Reset progress";
    Object.keys(items).forEach(function(id){if(items[id][0]){setItem(id,0);}});
    persistItems();syncChecks();prevPhase={};prevTask={};refresh(true);progressChanged();toast("Progress cleared.");
  });
  bindIO();
  bindInsights();
  var spEv=null,spRaf=0;
  document.addEventListener("pointermove",function(e){
    spEv=e;
    if(!spRaf){spRaf=requestAnimationFrame(function(){
      spRaf=0;var t=spEv&&spEv.target&&spEv.target.closest?spEv.target.closest(".spot"):null;
      if(t){var r=t.getBoundingClientRect();t.style.setProperty("--mx",(spEv.clientX-r.left)+"px");t.style.setProperty("--my",(spEv.clientY-r.top)+"px");}
    });}
  },{passive:true});
}
function syncChecks(){
  $$("input[data-task],input[data-lesson]").forEach(function(c){c.checked=!!done[c.getAttribute("data-task")||c.getAttribute("data-lesson")];});
}
function restore(){
  syncChecks();
  PHASES.forEach(function(p){
    var all=true;
    p.tasks.forEach(function(t){var d=taskDone(t);if(t.subs){prevTask[t.id]=d;}if(!d){all=false;}});
    prevPhase[p.id]=all;
  });
  refresh(true);
  var h=location.hash||"",n=nextItem();
  if(h.indexOf("#phase-")===0){openPhase(h.replace("#phase-",""));}
  else if(n){openPhase(n.p.id);if(n.s){openTask(n.t.id);}}
  else{openPhase(PHASES[0].id);}
}

/* ================================================================== */
/* Deep space (optimised): star tiles on compositor layers, event-     */
/* driven scroll work, on-demand easing loops.                         */
/* ================================================================== */
function cosmos(){
  var root=document.documentElement;
  var layers=$$("#starfield .sl"),planets=[[$(".pl-sun"),-.03],[$(".pl-ring"),-.02],[$(".pl-rock"),-.11]];
  var bar=$("#scrollbar"),phasesEl=$("#phases"),probe=$("#probe"),trail=$("#trail"),aura=$("#aura"),shoot=$("#shoot");
  var rail=$("#rail"),railDot=$("#railDot"),railFill=$("#railFill"),railPct=$("#railPct"),railSec=$("#railSec");
  var W=innerWidth,H=innerHeight;

  /* ---- star tiles: drawn once per size, animated by CSS ---- */
  var CFG=[
    {n:120,r:[.4,.9],a:[.35,.75],dur:220,tw:9,o:[.75,1]},
    {n:74,r:[.7,1.3],a:[.5,.9],dur:150,tw:7,o:[.65,1]},
    {n:36,r:[1.1,2],a:[.7,1],dur:95,tw:11,o:[.55,1]}
  ];
  var TINT=["255,255,255","205,220,255","255,232,205"],blobs=[];
  function buildStars(){
    var scale=Math.max(1,Math.min(2.2,(W*H)/(1366*768)));
    layers.forEach(function(L,i){
      var cf=CFG[i],cv=document.createElement("canvas"),ctx;
      cv.width=W;cv.height=H;ctx=cv.getContext("2d");
      var n=Math.round(cf.n*scale);
      for(var k=0;k<n;k++){
        var x=Math.random()*W,y=Math.random()*H,r=cf.r[0]+Math.random()*(cf.r[1]-cf.r[0]),a=cf.a[0]+Math.random()*(cf.a[1]-cf.a[0]),c=TINT[(Math.random()*3)|0];
        ctx.fillStyle="rgba("+c+","+a.toFixed(2)+")";ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
        if(r>1.4){ctx.fillStyle="rgba("+c+","+(a*.16).toFixed(3)+")";ctx.beginPath();ctx.arc(x,y,r*3.2,0,6.283);ctx.fill();}
      }
      var it=$("i",L);
      (function(it,i){
        if(cv.toBlob){cv.toBlob(function(bl){
          if(!bl) return;
          var u=URL.createObjectURL(bl);
          it.style.backgroundImage="url("+u+")";
          if(blobs[i]){URL.revokeObjectURL(blobs[i]);}
          blobs[i]=u;
        });}else{it.style.backgroundImage="url("+cv.toDataURL("image/png")+")";}
      })(it,i);
      it.style.backgroundSize=W+"px "+H+"px";
      it.style.setProperty("--dur",cf.dur+"s");it.style.setProperty("--tw",cf.tw+"s");
      it.style.setProperty("--o1",cf.o[0]);it.style.setProperty("--o2",cf.o[1]);
    });
  }

  /* ---- shooting stars: CSS animation fired on a slow timer ---- */
  function shootLoop(){
    if(reduce) return;
    setTimeout(function(){
      if(!document.hidden){
        shoot.classList.remove("go");
        shoot.style.left=Math.round(W*(.05+Math.random()*.6))+"px";
        shoot.style.top=Math.round(H*(.03+Math.random()*.35))+"px";
        void shoot.offsetWidth;shoot.classList.add("go");
      }
      shootLoop();
    },14000+Math.random()*12000);
  }

  /* ---- cached geometry (recomputed on resize / height change only) ---- */
  var phTop=0,phH=1,nodeY=[],nodeLis=[],docMax=1,secs=[],ticks=[],railOn=false,passedN=-1,activeSec=-1,lastSY=-1,py=0,ptarget=0,probeRun=false;
  var SECS=[["Launch",null],["Route","route"],["Start","start"],["Fresh","fresh"],["Phases","path"],["Stretch","stretch"],["Guardrails","guardrails"]];
  function measure(){
    var sy=window.scrollY||0,r=phasesEl.getBoundingClientRect();
    phTop=r.top+sy;phH=r.height;
    nodeLis=$$(".phase",phasesEl);
    nodeY=nodeLis.map(function(li){return li.offsetTop+33;});
    docMax=Math.max(1,document.documentElement.scrollHeight-H);
    secs=SECS.map(function(s){var el=s[1]?document.getElementById(s[1]):null;return el?el.getBoundingClientRect().top+sy:0;});
    railOn=!!rail&&getComputedStyle(rail).display!=="none";
    if(railOn&&!ticks.length){
      SECS.forEach(function(s,i){
        var a=document.createElement("a");a.className="rl-tick";a.href=s[1]?"#"+s[1]:"#top";a.textContent=s[0];rail.appendChild(a);ticks.push(a);
      });
    }
    if(railOn){ticks.forEach(function(a,i){a.style.top=Math.min(100,secs[i]/docMax*100)+"%";});}
    lastSY=-1;update();
  }

  /* ---- scroll-driven work, one rAF per scroll burst ---- */
  var pending=false;
  function onScroll(){if(!pending){pending=true;requestAnimationFrame(function(){pending=false;update();});}}
  function update(){
    var sy=window.scrollY||0;
    if(sy===lastSY) return;
    lastSY=sy;
    for(var i=0;i<layers.length;i++){
      var sp=parseFloat(layers[i].getAttribute("data-sp"));
      layers[i].style.transform="translate3d(0,"+(-((sy*sp)%H)).toFixed(1)+"px,0)";
    }
    for(var j=0;j<planets.length;j++){planets[j][0].style.transform="translate3d(0,"+(sy*planets[j][1]).toFixed(1)+"px,0)";}
    var f=Math.min(1,sy/docMax);
    bar.style.transform="scaleX("+f.toFixed(4)+")";
    if(railOn){
      var rh=rail.clientHeight;
      railDot.style.transform="translate3d(0,"+(f*rh).toFixed(1)+"px,0)";
      railFill.style.height=(f*rh).toFixed(1)+"px";
      railPct.textContent=Math.round(f*100)+"%";
      var act=0;for(var k=0;k<secs.length;k++){if(secs[k]<=sy+H*.4){act=k;}}
      if(act!==activeSec){activeSec=act;railSec.textContent=SECS[act][0];ticks.forEach(function(a,n){a.classList.toggle("on",n===act);});}
    }
    ptarget=Math.max(0,Math.min(phH-52,H*.45-(phTop-sy)-26));
    if(!probeRun){probeRun=true;requestAnimationFrame(probeStep);}
  }
  var pl=0;
  function probeStep(ts){
    var dt=Math.min(.05,(ts-pl)/1000||.016);pl=ts;
    py+=(ptarget-py)*(reduce?1:Math.min(1,dt*4));
    var y=26+py;
    probe.style.top=y.toFixed(1)+"px";trail.style.height=py.toFixed(1)+"px";
    var n=0;for(var i=0;i<nodeY.length;i++){if(y>=nodeY[i]){n++;}}
    if(n!==passedN){passedN=n;nodeLis.forEach(function(li,i){li.classList.toggle("passed",i<n);});}
    if(Math.abs(ptarget-py)>.5&&!reduce){requestAnimationFrame(probeStep);}else{py=ptarget;probeRun=false;}
  }

  /* ---- pointer aura: eases only while moving ---- */
  var fine=false;try{fine=window.matchMedia("(pointer: fine)").matches;}catch(e){}
  var mx=W/2,my=H/2,ax=mx,ay=my,auraRun=false,al=0;
  function auraStep(ts){
    var dt=Math.min(.05,(ts-al)/1000||.016);al=ts;
    ax+=(mx-ax)*Math.min(1,dt*2.4);ay+=(my-ay)*Math.min(1,dt*2.4);
    aura.style.transform="translate3d("+ax.toFixed(1)+"px,"+ay.toFixed(1)+"px,0)";
    if(Math.abs(mx-ax)+Math.abs(my-ay)>.6){requestAnimationFrame(auraStep);}else{auraRun=false;}
  }
  if(fine&&!reduce){
    window.addEventListener("pointermove",function(e){
      mx=e.clientX;my=e.clientY;aura.classList.add("on");
      if(!auraRun){auraRun=true;al=performance.now();requestAnimationFrame(auraStep);}
    },{passive:true});
  }

  /* ---- wire up ---- */
  var rt=0;
  function relayout(force){
    var nw=innerWidth,nh=innerHeight;
    if(force||Math.abs(nw-W)>64||Math.abs(nh-H)>140){W=nw;H=nh;buildStars();fxResize();}
    else{W=nw;H=nh;}
    measure();
  }
  buildStars();fxResize();measure();shootLoop();
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){relayout(false);},160);});
  if("ResizeObserver" in window){var ro=new ResizeObserver(function(){clearTimeout(rt);rt=setTimeout(function(){measure();},80);});ro.observe(phasesEl);ro.observe(document.body);}
  update();
}

function reveals(){
  var els=$$(".rv");
  if(!("IntersectionObserver" in window)){els.forEach(function(e){e.classList.add("in");});return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});
  },{threshold:.08,rootMargin:"0px 0px -6% 0px"});
  els.forEach(function(e){io.observe(e);});
}

function spy(){
  if(!("IntersectionObserver" in window)) return;
  var links=$$(".nav-links a"),map={};
  links.forEach(function(a){map[a.getAttribute("href").slice(1)]=a;});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){links.forEach(function(a){a.classList.remove("on");});var a=map[en.target.id];if(a) a.classList.add("on");}
    });
  },{rootMargin:"-40% 0px -55% 0px"});
  Object.keys(map).forEach(function(id){var s=document.getElementById(id);if(s) io.observe(s);});
}

/* ================================================================== */
/* Hero: raw bronze data drifts through two portals, is cleaned, then  */
/* converges into a gold beam.                                         */
/* ================================================================== */
function hero(){
  var c=$("#flow"); if(!c||!c.getContext) return;
  var ctx=c.getContext("2d"),W=0,H=0,dpr=1,parts=[],raf=0,running=false,last=0,time=0,inView=true;
  var G=[.36,.66];
  var COL={b:[226,144,79],s:[195,206,230],g:[255,203,77]};
  function sm(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
  function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
  function colour(x){return mix(mix(COL.b,COL.s,sm(G[0]-.03,G[0]+.03,x)),COL.g,sm(G[1]-.03,G[1]+.03,x));}
  function kAt(x){return 1-.84*sm(G[0]-.05,G[1]+.12,x);}
  function spawn(init){
    return {x:init?Math.random()*1.02:-.03-Math.random()*.12,lane:Math.random()*2-1,sp:.05+Math.random()*.07,ph:Math.random()*6.283,f:1.5+Math.random()*2.5,sz:.9+Math.random()*1.5,dup:Math.random()<.3};
  }
  function build(){
    var n=Math.round(Math.max(70,Math.min(170,W/8)));
    parts=[];for(var i=0;i<n;i++){parts.push(spawn(true));}
  }
  function resize(){
    var r=c.getBoundingClientRect(); if(!r.width||!r.height) return;
    dpr=Math.min(window.devicePixelRatio||1,1.25);W=r.width;H=r.height;
    c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    build();draw(0);
  }
  function pos(p,x){
    var k=kAt(x),wob=Math.sin(x*p.f*6.283+p.ph+time*.7)*H*.07*k;
    return [x*W,H*.5+p.lane*H*.4*k+wob];
  }
  function portal(x,col,idx){
    var px=x*W,cy=H*.5,ry=H*(.42*kAt(x)+.05),rx=Math.max(10,W*.011);
    var g=ctx.createRadialGradient(px,cy,0,px,cy,ry);
    g.addColorStop(0,"rgba("+col+",.16)");g.addColorStop(1,"rgba("+col+",0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(px,cy,rx*3.4,ry,0,0,6.283);ctx.fill();
    ctx.strokeStyle="rgba("+col+",.6)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,cy,rx,ry,0,0,6.283);ctx.stroke();
    ctx.strokeStyle="rgba("+col+",.24)";ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(px,cy,rx*2.2,ry*1.05,0,0,6.283);ctx.stroke();
    ctx.setLineDash([3,12]);ctx.lineDashOffset=-time*18*(idx?1:-1);
    ctx.strokeStyle="rgba("+col+",.4)";ctx.beginPath();ctx.ellipse(px,cy,rx*1.5,ry*.97,0,0,6.283);ctx.stroke();
    ctx.setLineDash([]);
  }
  function beam(){
    var x0=G[1]*W,cy=H*.5;
    var g=ctx.createLinearGradient(x0,0,W,0);
    g.addColorStop(0,"rgba(255,203,77,0)");g.addColorStop(.35,"rgba(255,203,77,.24)");g.addColorStop(1,"rgba(255,203,77,.55)");
    ctx.fillStyle=g;ctx.fillRect(x0,cy-1.5,W-x0,3);
    var v=ctx.createLinearGradient(x0,cy-24,x0,cy+24);
    v.addColorStop(0,"rgba(255,203,77,0)");v.addColorStop(.5,"rgba(255,203,77,.1)");v.addColorStop(1,"rgba(255,203,77,0)");
    ctx.fillStyle=v;ctx.fillRect(x0,cy-24,W-x0,48);
  }
  function draw(dt){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation="source-over";
    beam();portal(G[0],"195,206,230",0);portal(G[1],"255,203,77",1);
    ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    /* batch strokes per colour zone: 3 paths plus a small flash pass at the portals */
    var zp=[new Path2D(),new Path2D(),new Path2D()],fl=new Path2D(),hasFl=false;
    for(var i=0;i<parts.length;i++){
      var p=parts[i];
      p.x+=p.sp*dt*(1+sm(G[0],G[1],p.x)*.7);
      if(p.x>1.03){parts[i]=spawn(false);continue;}
      if(p.dup&&p.x>G[0]+.05) {parts[i]=spawn(false);continue;}
      var a=pos(p,p.x),t=pos(p,Math.max(-.05,p.x-.03-p.sp*.12));
      var z=p.x<G[0]?0:(p.x<G[1]?1:2),path=zp[z];
      path.moveTo(t[0],t[1]);path.lineTo(a[0],a[1]);
      if(Math.abs(p.x-G[0])<.018||Math.abs(p.x-G[1])<.018){fl.moveTo(t[0],t[1]);fl.lineTo(a[0],a[1]);hasFl=true;}
    }
    ctx.lineWidth=1.5;
    ctx.strokeStyle="rgba(226,144,79,.8)";ctx.stroke(zp[0]);
    ctx.strokeStyle="rgba(195,206,230,.85)";ctx.stroke(zp[1]);
    ctx.strokeStyle="rgba(255,203,77,.9)";ctx.lineWidth=1.7;ctx.stroke(zp[2]);
    if(hasFl){ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=2.6;ctx.stroke(fl);}
    ctx.globalCompositeOperation="source-over";
  }
  function frame(ts){
    if(!running) return;
    var el=ts-last;
    if(el<20){raf=requestAnimationFrame(frame);return;}
    var dt=Math.min(.05,el/1000);last=ts;time+=dt;
    draw(dt);raf=requestAnimationFrame(frame);
  }
  function start(){if(running||reduce) return;running=true;last=performance.now();raf=requestAnimationFrame(frame);}
  function stop(){running=false;cancelAnimationFrame(raf);}
  resize();
  if("ResizeObserver" in window){new ResizeObserver(function(){resize();}).observe(c.parentElement);}else{window.addEventListener("resize",resize);}
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){inView=es[0].isIntersecting;if(inView){start();}else{stop();}},{threshold:0}).observe(c);
  }else{start();}
  document.addEventListener("visibilitychange",function(){if(document.hidden){stop();}else if(inView){start();}});
}

/* ================================================================== */
/* Boot                                                                */
/* ================================================================== */
$("#brandText").textContent=BRAND;
$("#brandLink").setAttribute("aria-label",BRAND+", back to top");
mountRing("navRing",12,3,false);
mountRing("heroRing",30,5,true);
renderRoute();renderStatic();renderPhases();
bind();restore();
updateSyncUI();
cosmos();hero();spy();reveals();
})();
