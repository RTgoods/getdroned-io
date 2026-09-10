const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),vm=require('node:vm');
const code=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true);const functions={};
function visit(n){if(ts.isFunctionDeclaration(n)&&['fireRailgun','shoot','startReload'].includes(n.name?.text))functions[n.name.text]=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
test('three railgun shots pierce terrain and every aligned target without hitting off-axis enemies',()=>{
const hits=[],tiles=new Set(),fx=[];const c={Math,MW:20,TILE:34,WW:680,WH:340,player:{x:34,y:170,wep:'railgun',face:0,mag:3,res:0,reload:0,stim:0},WEAPONS:{railgun:{rail:true,dmg:500,mag:3,rof:1.15,spd:3000,kick:8}},enemies:[{x:200,y:170,hp:100},{x:400,y:170,hp:2000},{x:400,y:250,hp:100}],ships:[],motorcade:[],refineries:[],aircraft:[],sams:[{x:300,y:170}],aaGuns:[],edrones:[],tank:null,fx,bullets:[],shake:0,nearestTarget:()=>null,manualAim:()=>false,damageWall:(x,y)=>tiles.add(x+','+y),hurtEnemy:(e,damage)=>{assert(damage>=e.hp);hits.push(e.x)},explode:()=>{},syncGun:()=>{},hud:()=>{},sfx:()=>{}};
vm.createContext(c);vm.runInContext(Object.values(functions).join('\n'),c);
for(let i=0;i<4;i++)c.shoot();assert.equal(c.player.mag,0);assert.equal(fx.filter(f=>f.t==='rail').length,3);assert.deepEqual(hits,[200,400,200,400,200,400]);assert(tiles.has('15,5'));assert.equal(c.sams.length,0);assert.equal(c.player.res,0);
});

test('beam intersects the visible upper body, including enemies behind walls',()=>{
 const hits=[];const c={Math,MW:20,TILE:34,WW:680,WH:340,player:{x:34,y:150},enemies:[{x:200,y:170,hp:100},{x:400,y:170,hp:2500},{x:400,y:250,hp:100},{x:0,y:150,hp:100}],ships:[],motorcade:[],refineries:[],aircraft:[],sams:[],aaGuns:[],edrones:[],tank:null,fx:[],damageWall:()=>{},hurtEnemy:(e,d)=>{hits.push(e.x);e.hp-=d;}};
 vm.createContext(c);vm.runInContext(functions.fireRailgun,c);c.fireRailgun(0);
 assert.deepEqual(hits,[200,400]);assert.equal(c.enemies[1].hp,0);assert.equal(c.enemies[2].hp,100);
});
