const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8');
const ast=ts.createSourceFile('game.js',source,ts.ScriptTarget.Latest,true),functions={};
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name)functions[n.name.text]=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
function setup(){
 const c={Math,Uint8Array,Int32Array,TILE:34,EXT:0,WALL:1,FLOOR:2,PROP:3,BROKEN:4,WATER:5,RUBBLE:6,level:3,mapKind:'sea',now:0,wind:0,state:'play',player:{x:400,y:2150,dead:false},piloting:false,aboard:false,drone:null,seaBossSpawned:false,seaBossDefeated:false,shake:0,money:0,gunboatRespawn:0,rr:(a,b)=>(a+b)/2,ri:(a,b)=>Math.floor((a+b)/2),pick:a=>a[0],actBtn:{classList:{remove(){}}}};
 for(const k of 'props holes roads duck wires bunkers bases flags edrones emps depots depotWorkers aaGuns refineries sams samShots ships missiles wakes floaters seaMines motorcade truckRoute seaWrecks seaSharks seaGulls fx plume embers enemies'.split(' '))c[k]=[];
 for(const k of 'placeFires buildStatic initWallHP setupTruck hud banner sfx launchPart updatePatrolTanks dustPuff rebuildDroneBay explode'.split(' '))c[k]=()=>{};
 c.setMapSize=(w,h)=>{c.MW=w;c.MH=h;c.WW=w*34;c.WH=h*34;c.grid=new Uint8Array(w*h);};c.downPlayer=()=>{c.player.dead=true;};
 vm.createContext(c);
 for(const name of ['T','setT','fill','addProp','isWater','inBase','hs','waterNear','buildSea','buildSeaExpansion','seaRoom','prepareSeaRoute','planSeaRoute','moveSeaShip','seaHullDistance','damageSeaBridge','sinkPlayerGunboat','updateSeaExpansion','detonateSeaMine'])vm.runInContext(functions[name],c);
 c.buildSea();return c;
}
test('enlarged fleet and both landing ships follow navigable water routes',()=>{
 const c=setup();assert.equal(c.ships.length,7);assert(c.seaMines.length>=65);assert.equal(c.seaGulls.length,42);assert.equal(c.motorcade.length,3);assert.equal(c.aaGuns.length,4);
 for(const S of c.ships){assert(c.seaRoom(S,S.x,S.y,S.ang),S.name+' initial clearance');const target=S.lander?[S.landX,S.landY]:[S.lane[S.wp][0]*34,S.lane[S.wp][1]*34];let arrived=false;for(let frame=0;frame<9000&&!arrived;frame++){arrived=c.moveSeaShip(S,.1,...target);assert(c.seaRoom(S,S.x,S.y,S.ang),S.name+' hit land');}assert(arrived,S.name+' never reached destination');}
});
test('heavy-drone train hit collapses bridge; ordinary hits chip its health',()=>{
 const c=setup(),B=c.seaBridge;c.damageSeaBridge(B.trainX,B.railY,100,false);assert.equal(B.hp,1700);assert(!B.dead);c.damageSeaBridge(B.trainX,B.railY,100,true);assert(B.dead);assert(B.trainBlast);assert.equal(c.aaGuns.length,0);assert(c.motorcade.every(t=>t.dead));assert.equal(c.T(50,8),c.WATER);assert.equal(c.droneCam.t,10);
});
test('gunboat loss kills occupant and replacement returns to dock',()=>{
 const c=setup();c.aboard=true;c.sinkPlayerGunboat();assert(c.player.dead);assert.equal(c.gunboat,null);assert.equal(c.gunboatRespawn,12);c.updateSeaExpansion(12);assert(c.gunboat);assert.equal(c.gunboat.hp,340);assert.equal(c.gunboat.x,32*34);
});
test('bird collisions damage airborne drones and remove the collided gull',()=>{
 const c=setup();c.updateSeaExpansion(.1);const g=c.seaGulls[0];c.drone={x:g.x,y:g.y,hp:100,kind:'drone'};c.piloting=true;c.updateSeaExpansion(.1);assert(g.dead);assert.equal(c.drone.hp,82);
});

test('grenades damage the visible bow even when the ship centre is outside blast radius',()=>{
 const c=setup(),S=c.ships[0];S.ang=0;c.shipHit=(ship,damage)=>{ship.hp-=damage;};vm.runInContext(functions.fragExplosion,c);const hp=S.hp;c.fragExplosion(S.x+S.len*.5+15,S.y,80,100);assert(S.hp<hp);
});
test('boss cannot spawn before bridge destruction and has clear water afterwards',()=>{
 const c=setup();vm.runInContext(functions.spawnSeaBoss,c);c.spawnSeaBoss();assert(!c.seaBossSpawned);c.seaBridge.dead=true;c.spawnSeaBoss();assert(c.seaBossSpawned);const boss=c.ships.at(-1);assert.equal(boss.hp,2200);assert(c.seaRoom(boss,boss.x,boss.y,boss.ang));
});
test('bridge and sea effects render finite geometry before and during collapse',()=>{
 const c=setup();c.cam={x:0,y:0};c.VW=c.WW;c.VH=c.WH;
 for(const name of ['drawSeaExpansion','drawSeagulls','gearBox','gearLine','gearPoly','outl','rrect'])vm.runInContext(functions[name],c);
 let depth=0;
 const canvas=new Proxy({save(){depth++;},restore(){depth--;assert(depth>=0);},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' invalid coordinate');};},set(o,k,v){o[k]=v;return true;}});
 c.drawSeaExpansion(canvas);c.drawSeagulls(canvas);c.seaBridge.dead=true;c.seaBridge.fall=5;c.seaWrecks=[{x:1000,y:900,a:1,len:200,wid:80,t:4}];c.seaSharks=[{x:1000,y:900,a:1,t:4}];c.drawSeaExpansion(canvas);assert.equal(depth,0);
});

test('ordinary gun bullets damage ships without the naval-ammo flag',()=>{
 const c=setup(),S=c.ships[0];S.ang=0;c.bu={x:S.x+S.len*.3,y:S.y,dmg:26};c.bullets=[c.bu];c.b=0;c.shipHit=(ship,damage)=>{ship.hp-=damage;};const hp=S.hp;
 const start=source.indexOf('      for(var ns=0;ns<ships.length;ns++){');const end=source.indexOf('      if(!bu) break;',start);
 vm.runInContext(source.slice(start,end),c);assert.equal(S.hp,hp-26);assert.equal(c.bullets.length,0);
});
test('both landing beaches connect to the home compound on foot',()=>{
 const c=setup(),q=[Math.floor(c.homeSpawn.y)*c.MW+Math.floor(c.homeSpawn.x)],seen=new Set(q);
 for(let i=0;i<q.length;i++){const x=q[i]%c.MW,y=Math.floor(q[i]/c.MW);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*c.MW+nx;if(nx<0||ny<0||nx>=c.MW||ny>=c.MH||seen.has(n)||[c.WALL,c.PROP,c.BROKEN,c.WATER].includes(c.T(nx,ny)))continue;seen.add(n);q.push(n);}}
 for(const S of c.ships.filter(s=>s.lander))assert(seen.has(Math.floor(S.shoreY/34)*c.MW+Math.floor(S.shoreX/34)),S.name+' beach disconnected');
});

test('retry preserves the current sector',()=>{
 const start=source.indexOf("bindTap(document.getElementById('retry'),function(){");
 const end=source.indexOf('\n});',start)+4;
 const c={level:3,startCoins:100,document:{getElementById(){return {classList:{add(){}}};}},bindTap(element,callback){callback();},startSector(n){assert.equal(n,3);}};
 vm.runInNewContext(source.slice(start,end),c);
});
test('bridge spans the full map and the west access path is water',()=>{
 const c=setup();assert.equal(c.seaBridge.x0,0);assert.equal(c.seaBridge.x1,c.WW);
 for(let y=14;y<38;y++)assert.equal(c.T(4,y),c.WATER);
});
test('grenades and ordinary bullets remove sea mines',()=>{
 const c=setup();c.ships=[];c.seaMines=[{x:1000,y:1000,dead:0}];vm.runInContext(functions.fragExplosion,c);
 c.fragExplosion(1000,1000,80,100);assert.equal(c.seaMines.length,0);
 c.seaMines=[{x:1000,y:1000,dead:0}];c.bu={x:1000,y:1000,dmg:24};c.b=0;c.bullets=[c.bu];
 const start=source.indexOf('      for(var mi=seaMines.length-1;mi>=0;mi--){');
 const end=source.indexOf('      if(!bu)break;',start);
 vm.runInContext(source.slice(start,end),c);assert.equal(c.seaMines.length,0);assert.equal(c.bullets.length,0);
});
