const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',source,99,true),f={};
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name)f[n.name.text]=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
test('formation transfers twice, preserves surviving health and releases pad only after last loss',()=>{
 const pad={inFlight:true,cool:58,cd:0};
 const c={Math,drone:{x:0,y:0,ang:1,t:20,kind:'droneL',hp:0,mx:125,pad,flight:1},wingmen:[{x:70,y:80,hp:210,mx:340,vx:2,vy:3,rot:0},{x:90,y:100,hp:125,mx:340,vx:1,vy:1,rot:0}],pendingFlightLeader:null,piloting:true,droneCam:{t:3},banner(){},hud(){}};
 vm.createContext(c);vm.runInContext(f.rebuildDroneBay+'\n'+f.resumeDroneFormation,c);
 for(const hp of [210,125]){c.rebuildDroneBay(c.drone);c.drone=null;c.piloting=false;c.resumeDroneFormation();assert(c.piloting);assert.equal(c.drone.hp,hp);assert.equal(c.drone.kind,'droneL');assert(pad.inFlight);assert.equal(pad.cd,0);assert.equal(c.droneCam,null);}
 c.rebuildDroneBay(c.drone);c.drone=null;c.piloting=false;c.resumeDroneFormation();assert(!c.piloting);assert.equal(c.drone,null);assert(!pad.inFlight);assert.equal(pad.cd,58);
});
test('dead wingmen never become the controlled drone',()=>{
 const c={wingmen:[{hp:0}],pendingFlightLeader:null,drone:null};vm.createContext(c);vm.runInContext(f.rebuildDroneBay,c);
 const pad={inFlight:true,cool:58};c.rebuildDroneBay({flight:1,pad});assert.equal(c.pendingFlightLeader,null);assert.equal(pad.inFlight,false);
});
