import gzip, os, re
SRC="/Users/mac/Downloads/pmtts_latest_2026-08-27_174421.sql.gz"
WANT = set("""project work_package project_activity activity task activity_task hoursworked
company contact aircraft serialnumber approval approvalissue approval_aircraft approval_serialnumber
deliverable deliverablerev designdata designdatarev project_deliverablerev project_designdatarev
project_aircraft project_approval tccaproject tccadocstatus tccaproject_project
tccaproject_deliverablerev atachapter atasubchapter user userprofile auth_item auth_assignment
auth_item_child auth_rule setting report usergroup discipline taskgroup checklist""".split())
os.makedirs("tbl", exist_ok=True)
cur=None; out=None
ddl={}; ddl_cur=None; ddl_buf=[]
with gzip.open(SRC,'rt',encoding='utf-8',errors='replace') as f:
    for line in f:
        m=re.match(r'^CREATE TABLE `([^`]+)`',line)
        if m:
            ddl_cur=m.group(1); ddl_buf=[line]; continue
        if ddl_cur:
            ddl_buf.append(line)
            if line.startswith(') ENGINE'):
                ddl[ddl_cur]=''.join(ddl_buf); ddl_cur=None
            continue
        m=re.match(r'^INSERT INTO `([^`]+)` VALUES ',line)
        if m:
            t=m.group(1)
            if t in WANT:
                if cur!=t:
                    if out: out.close()
                    cur=t; out=open(f"tbl/{t}.sql","a")
                out.write(line)
if out: out.close()
with open("ddl.txt","w") as f:
    for t in sorted(ddl):
        if t in WANT: f.write(ddl[t]+"\n")
print("done")
