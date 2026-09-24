const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const e={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/progress-outbox.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(e);
const entry=n=>({gameId:'game',sector:n,kills:10,squadLost:0,moneyEnd:20,timeAlive:30,belt:[]});
const tick=()=>new Promise(r=>setImmediate(r));
test('failed saves survive reload and retry in sector order without dropping entries',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},key=e.progressQueueKey('pilot','game');let messages=[];
 const q=e.createProgressOutbox(storage,key,async()=>{throw Error('offline')},m=>messages.push(m));
 q.enqueue(entry(1));q.enqueue(entry(2));await tick();assert.equal(JSON.parse(values.get(key)).length,2);assert(messages.at(-1).includes('pending'));q.stop();
 let saved=[];const retry=e.createProgressOutbox(storage,key,async p=>saved.push(p.sector),m=>messages.push(m));await retry.flush();assert.deepEqual(saved,[1,2]);assert.equal(values.get(key),'[]');assert.equal(messages.at(-1),'Progress saved');
});
test('duplicate solved/continue messages do not create duplicate in-flight saves',async()=>{
 let resolve,sent=0;const values=new Map();const q=e.createProgressOutbox({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},'pilot',()=>{sent++;return new Promise(r=>resolve=r)},()=>{});
 q.enqueue(entry(1));q.enqueue(entry(1));assert.equal(sent,1);resolve();await tick();assert.equal(values.get('pilot'),'[]');
});
test('accounts use separate queue keys',()=>assert.notEqual(e.progressQueueKey('a','g'),e.progressQueueKey('b','g')));
