const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',source,99,true),f={};
(function walk(n){if(ts.isFunctionDeclaration(n)&&n.name)f[n.name.text]=n.getText(ast);ts.forEachChild(n,walk);})(ast);
function setup(level){
 const c={setTimeout(){},truck:null,Math,TILE:34,HX:18,HY:12,EXT:0,FLOOR:1,WALL:2,BROKEN:3,RUBBLE:4,CRATER:5,PROP:6,CRUMBLE:7,WATER:8,level,BASE_COMPOUND:{x0:51.6,y0:1.6,x1:67.6,y1:14.6},SPAWNS_COMPOUND:[],rr:(a,b)=>(a+b)/2,ri:(a,b)=>Math.floor((a+b)/2),player:{dead:true},piloting:false,COMMANDER_ENABLED:false,money:0,shake:0};
 for(const k of 'motorcade props holes roads duck wires bunkers bases flags rescueGroups captives edrones emps depots depotWorkers aaGuns sams samShots seaMines aircraft truckRoute embers plume fires'.split(' '))c[k]=[];
 for(const k of 'buildStatic initWallHP placeFires setupTruck hud banner sfx launchPart dustPuff explode'.split(' '))c[k]=()=>{};
 c.setMapSize=(w,h)=>{c.MW=w;c.MH=h;c.WW=w*34;c.WH=h*34;c.grid=new Uint8Array(w*h);};
 c.hitBox=()=>false;
 vm.createContext(c);
 for(const k of ['T','setT','fill','addProp','inBase','hs','blast','dig','blocksMove','plantCompoundTrees','scatterTrenchTimber','buildMap','buildTrench','tankGroundClear','tankRoamPath','seedEarlyPatrolTanks','updatePatrolTanks','hitMotorcadeCar','destroyPatrolTank','updateTankWreck'])vm.runInContext(f[k],c);
 c.buildMap();c.seedEarlyPatrolTanks();return c;
}
for(const level of [1,2])test('sector '+level+' starts with clear, moving city tanks and shared destruction',()=>{
 const c=setup(level),tanks=c.motorcade.filter(t=>t.patrolTank);assert.equal(tanks.length,level===1?1:2);
 if(level===1)assert(c.motorcade.includes(c.compoundDroneHub));
 const positions=tanks.map(t=>[t.x,t.y]),travel=tanks.map(()=>0);
 for(let frame=0;frame<600;frame++){c.updatePatrolTanks(.05);tanks.forEach((t,i)=>{assert(c.tankGroundClear(t.x,t.y),'hull intersects terrain');travel[i]=Math.max(travel[i],Math.hypot(t.x-positions[i][0],t.y-positions[i][1]));});}
 tanks.forEach((t,i)=>{assert(travel[i]>34);assert.equal(t.hp,420);c.hitMotorcadeCar(t,24);assert.equal(t.hp,396);c.hitMotorcadeCar(t,400);assert(t.dead);assert(t.wreckTurret);assert(t.burnTime>0);});
 c.updatePatrolTanks(2);assert(tanks.every(t=>t.wreckTurret.landed));
});
test('switching sector clears previous tanks and does not add a delayed legacy tank',()=>{
 const c=setup(1);c.level=2;c.buildMap();c.seedEarlyPatrolTanks();assert.equal(c.motorcade.length,2);assert(c.motorcade.every(t=>t.patrolTank));
 assert(!source.includes('tankSent=1; spawnTank();'));
});
test('ordinary bullets hit patrol tanks in both early sectors',()=>{
 for(const level of [1,2]){
  const c=setup(level),tank=c.motorcade.find(t=>t.patrolTank);c.bu={x:tank.x,y:tank.y,dmg:27};c.bullets=[c.bu];c.b=0;c.impact=()=>{};
  const start=source.indexOf('      var hitAny=false;'),end=source.indexOf('      if(!bu) break;',start);
  vm.runInContext(source.slice(start,end),c);assert.equal(tank.hp,393);assert.equal(c.bullets.length,0);
 }
});
