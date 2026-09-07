import re, json, os, sys

def parse_values(sql):
    """Yield row tuples from mysqldump extended INSERT statements."""
    rows=[]
    i=0; n=len(sql)
    while i<n:
        if sql.startswith('INSERT INTO', i):
            j=sql.index(' VALUES ', i)+8
            i=j
            # parse tuples until end of statement (;\n)
            while i<n:
                while i<n and sql[i] in ' \r\n,': i+=1
                if i<n and sql[i]==';': i+=1; break
                if i>=n or sql[i]!='(': break
                i+=1
                row=[]; 
                while True:
                    while i<n and sql[i]==' ': i+=1
                    if sql[i]=="'":
                        i+=1; buf=[]
                        while True:
                            c=sql[i]
                            if c=='\\':
                                nx=sql[i+1]
                                buf.append({'n':'\n','r':'\r','t':'\t','0':'\0','b':'\b','Z':'\x1a'}.get(nx,nx)); i+=2
                            elif c=="'":
                                if i+1<n and sql[i+1]=="'": buf.append("'"); i+=2
                                else: i+=1; break
                            else: buf.append(c); i+=1
                        row.append(''.join(buf))
                    else:
                        k=i
                        while sql[k] not in ',)': k+=1
                        tok=sql[i:k].strip(); i=k
                        row.append(None if tok=='NULL' else tok)
                    if sql[i]==',': i+=1; continue
                    if sql[i]==')': i+=1; break
                rows.append(row)
        else:
            i+=1
    return rows

def cols_for(table, ddl_text):
    m=re.search(r'CREATE TABLE `%s` \((.*?)\n\) ENGINE'%re.escape(table), ddl_text, re.S)
    if not m: return None
    cols=[]
    for line in m.group(1).split('\n'):
        line=line.strip()
        cm=re.match(r'`([^`]+)`\s',line)
        if cm: cols.append(cm.group(1))
    return cols

ddl=open('ddl.txt').read()
out={}
for fn in sorted(os.listdir('tbl')):
    t=fn[:-4]
    sql=open('tbl/'+fn, encoding='utf-8', errors='replace').read()
    rows=parse_values(sql)
    cols=cols_for(t, ddl)
    out[t]={'cols':cols,'n':len(rows)}
    json.dump({'cols':cols,'rows':rows}, open('json/%s.json'%t,'w'), ensure_ascii=False)
for t in sorted(out): print(f"{t:32} {out[t]['n']:>7}  {len(out[t]['cols'] or [])} cols")
