const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const ast=ts.createSourceFile('game.js',fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),99,true),f={};
function walk(n){if(ts.isFunctionDeclaration(n)&&n.name)f[n.name.text]=n.getText(ast);ts.forEachChild(n,walk);}walk(ast);
function setup(){const c={Math,TILE:34,reinforcements:[],reinforcementFragCD:0,nades:[],crew:[],player:{x:300,y:300,face:0},PKITS:[{col:'#abc',band:'#123'}],hitBox:()=>false,findPath:()=>[{x:300,y:300},{x:340,y:300}],banner(){},sfx(){},enemies:[],fires:[],bullets:[],fx:[],hs:()=>.5,rr:(a,b)=>(a+b)/2,los:()=>true,smokeBlocked:()=>false,inBase:()=>false,moveEnt(s,x,y){s.x+=x;s.y+=y;},bakeCorpse(){c.deaths=(c.deaths||0)+1;},enemyShot(){c.returnFire=(c.returnFire||0)+1;}};vm.createContext(c);for(const name of ['deployReinforcements','hurtReinforcement','reinforcementTarget','updateReinforcements'])vm.runInContext(f[name],c);return c;}
test('deploys five vulnerable soldiers and expires after 15 seconds',()=>{const c=setup();assert(c.deployReinforcements());assert.equal(c.reinforcements.length,5);assert(c.reinforcements.every(s=>s.hp===80&&s.t===15));c.updateReinforcements(15);assert.equal(c.reinforcements.length,0);});
test('blocked deployment keeps the tool available',()=>{const c=setup();c.hitBox=()=>true;assert.equal(c.deployReinforcements(),false);assert.equal(c.reinforcements.length,0);});
test('soldiers fire real bullets, can be killed, and dead soldiers stop fighting',()=>{const c=setup();c.deployReinforcements();c.enemies=[{x:400,y:300,hp:100,d:{range:350,rof:1.5}}];c.updateReinforcements(.6);assert.equal(c.bullets.length,5);assert(c.bullets.every(b=>b.dmg===15));const s=c.reinforcements[0];c.hurtReinforcement(s,80);c.hurtReinforcement(s,80);assert.equal(c.deaths,1);c.updateReinforcements(.1);assert.equal(c.reinforcements.length,4);});
test('enemies engage reinforcements when player is hidden',()=>{const c=setup();c.deployReinforcements();c.player.x=1200;c.enemies=[{x:400,y:300,hp:100,d:{range:350,rof:1.5}}];c.updateReinforcements(.1);assert.equal(c.returnFire,1);});

test('reinforcements throw staggered frags without using player inventory',()=>{const c=setup();c.deployReinforcements();c.enemies=[{x:570,y:300,hp:100,d:{range:350,rof:1.5}}];c.updateReinforcements(3);assert.equal(c.nades.length,1);assert.equal(c.reinforcements.reduce((n,s)=>n+s.frags,0),9);c.updateReinforcements(.1);assert.equal(c.nades.length,1);});
test('squad holds away from player when idle and does not frag allies',()=>{const c=setup();c.deployReinforcements();const x=c.reinforcements[0].x;c.updateReinforcements(.1);assert.equal(c.reinforcements[0].x,x);c.enemies=[{x:570,y:300,hp:100,d:{range:350,rof:1.5}}];c.crew=[{x:570,y:300}];c.updateReinforcements(3);assert.equal(c.nades.length,0);});

test('overlapping deployments add five soldiers with independent timers and clear spawn positions',()=>{
 const c=setup();c.deployReinforcements();c.updateReinforcements(5);
 const first=c.reinforcements.slice();assert(c.deployReinforcements());assert.equal(c.reinforcements.length,10);
 const second=c.reinforcements.slice(5);assert(first.every(s=>s.t===10));assert(second.every(s=>s.t===15));
 assert(second.every(s=>first.every(a=>Math.hypot(s.x-a.x,s.y-a.y)>=27)));
 c.updateReinforcements(10);assert.equal(c.reinforcements.length,5);assert(c.reinforcements.every(s=>s.t===5));
 c.updateReinforcements(5);assert.equal(c.reinforcements.length,0);
});
