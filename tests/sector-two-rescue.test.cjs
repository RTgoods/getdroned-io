const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',source,99,true),f={};
(function walk(n){if(ts.isFunctionDeclaration(n)&&n.name)f[n.name.text]=n.getText(ast);ts.forEachChild(n,walk);})(ast);
function setup(level){
 const c={setTimeout(){},truck:null,Math,TILE:34,HX:18,HY:12,EXT:0,FLOOR:1,WALL:2,BROKEN:3,RUBBLE:4,CRATER:5,PROP:6,CRUMBLE:7,WATER:8,level,BASE_COMPOUND:{x0:51.6,y0:1.6,x1:67.6,y1:14.6},SPAWNS_COMPOUND:[],rr:(a,b)=>(a+b)/2,ri:(a,b)=>Math.floor((a+b)/2),player:{dead:false},enemies:[],levelTwoBossDefeated:false,objectiveSnapshot:"",window:{location:{origin:"https://game.test"},parent:{postMessage(){}}},piloting:false,COMMANDER_ENABLED:false,money:0,shake:0};
 for(const k of 'motorcade props holes roads duck wires bunkers bases flags rescueGroups captives edrones emps depots depotWorkers aaGuns sams samShots seaMines aircraft truckRoute embers plume fires'.split(' '))c[k]=[];
 for(const k of 'buildStatic initWallHP placeFires setupTruck hud banner sfx launchPart dustPuff explode'.split(' '))c[k]=()=>{};
 c.setMapSize=(w,h)=>{c.MW=w;c.MH=h;c.WW=w*34;c.WH=h*34;c.grid=new Uint8Array(w*h);c.pfPrev=new Int32Array(w*h);c.pfSeen=new Int32Array(w*h);c.pfQ=new Int32Array(w*h);c.pfMark=0;};
 c.PFD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 vm.createContext(c);
 for(const k of ['T','setT','fill','addProp','inBase','hs','blast','dig','blocksMove','plantCompoundTrees','scatterTrenchTimber','buildMap','buildTrench','tankGroundClear','tankRoamPath','seedEarlyPatrolTanks','updatePatrolTanks','hitMotorcadeCar','destroyPatrolTank','updateTankWreck','hitBox','moveEnt','findPath','baseGarrisonClear','updateCaptives','trenchRescueDone','missionObjectives','checkObjMilestones'])vm.runInContext(f[k],c);
 c.buildMap();c.seedEarlyPatrolTanks();return c;
}
test('all six rescued soldiers return across the Sector 2 map and log the objective',()=>{
 const c=setup(2),messages=[];c.window.parent.postMessage=m=>messages.push(m);
 for(const group of c.rescueGroups){
  c.player.x=group.x;c.player.y=group.y;
  for(let frame=0;frame<40;frame++)c.updateCaptives(.05);
 }
 for(let frame=0;frame<6000&&!c.trenchRescueDone();frame++){
  c.updateCaptives(.05);
  for(const soldier of c.captives)assert(Number.isFinite(soldier.x)&&Number.isFinite(soldier.y),'rescued soldier must retain a finite position');
 }
 assert.equal(c.captives.filter(s=>s.state==='home').length,6,JSON.stringify(c.captives));
 assert(c.trenchRescueDone());assert(c.missionObjectives()[1].done);
 c.checkObjMilestones();assert(messages.at(-1).completed.includes(1));
});
