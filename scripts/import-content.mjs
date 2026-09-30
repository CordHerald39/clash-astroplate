import {readFile,writeFile,rename,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv[2])throw Error('Usage: node scripts/import-content.mjs article.json');
const data=JSON.parse(await readFile(process.argv[2],'utf8'));
const fail=s=>{throw Error(s)};
for(const k of ['id','slug','title','description','publishedAt','updatedAt','category','body','status'])if(typeof data[k]!=='string'||!data[k].trim())fail('Missing '+k);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)||data.slug.length>100)fail('Invalid slug');
const date=s=>{if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s.slice(0,10))fail('Invalid ISO date');return s.slice(0,10)};
const published=date(data.publishedAt),updated=date(data.updatedAt);
if(Date.parse(data.updatedAt)<Date.parse(data.publishedAt))fail('updatedAt precedes publishedAt');
if(!['draft','published'].includes(data.status))fail('Invalid status');
if(!Array.isArray(data.tags)||data.tags.some(t=>typeof t!=='string'))fail('Invalid tags');
if(!Array.isArray(data.sources)||data.sources.some(s=>!s||typeof s.title!=='string'||!s.title.trim()||typeof s.url!=='string'))fail('Invalid sources');
for(const s of data.sources){const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password)fail('Invalid source URL')}
if(/<\s*(script|iframe|object|embed)\b/i.test(data.body)||/^# /m.test(data.body))fail('Unsafe HTML or body H1');
const fields={title:data.title,description:data.description,date:published,updated,category:data.category,tags:data.tags,author:'编辑部',draft:data.status==='draft'};
const text='---\n'+Object.entries(fields).map(([k,v])=>k+': '+JSON.stringify(v)).join('\n')+'\n---\n\n'+data.body.trim()+(data.sources.length?'\n\n## 参考来源\n\n'+data.sources.map(s=>'- ['+s.title.replace(/[\[\]\n]/g,' ')+']('+encodeURI(s.url).replaceAll('(','%28').replaceAll(')','%29')+')').join('\n'):'')+'\n';
const dir=path.join(root,'src/content/blog');await mkdir(dir,{recursive:true});
const dest=path.join(dir,data.slug+'.md'),tmp=dest+'.tmp-'+process.pid;
try{await writeFile(tmp,text,{flag:'wx'});await rename(tmp,dest)}catch(e){await rm(tmp,{force:true});throw e}
console.log('Imported '+data.slug+' ('+data.status+')');
