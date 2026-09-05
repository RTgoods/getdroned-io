(function(){
'use strict';
/* =========================================================================
   BOMBED OUT — top-down house clearing
   ========================================================================= */
var TILE=34, MW=70, MH=52, WW=MW*TILE, WH=MH*TILE;
var MW0=70, MH0=52;
var HX=18, HY=12;   // where the main house sits on the bigger board
var EXT=0, FLOOR=1, WALL=2, BROKEN=3, RUBBLE=4, CRATER=5, PROP=6, CRUMBLE=7, WATER=8;

var cv=document.getElementById('cv'), ctx=cv.getContext('2d');
var VW=0, VH=0, DPR=1;
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  VW=window.innerWidth; VH=window.innerHeight;
  cv.width=Math.floor(VW*DPR); cv.height=Math.floor(VH*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled=true;
}
window.addEventListener('resize',resize); resize();

/* ---------- rng ---------- */
var seed=1337;
function rnd(){ seed=(seed*1664525+1013904223)&0x7fffffff; return seed/0x7fffffff; }
function rr(a,b){ return a+rnd()*(b-a); }
function ri(a,b){ return Math.floor(rr(a,b+1)); }
function pick(a){ return a[Math.floor(rnd()*a.length)]; }

/* ---------- world state ---------- */
var grid, props=[], crates=[], enemies=[], bullets=[], eb=[], fx=[], nades=[], smoke=[], holes=[];
var player=null, cam={x:0,y:0}, shake=0, level=1, state='menu', muted=false;
var wallHP, dmgList=[], dmgMap={};
var tankSent=0;
var edrones=[], emps=[], flames=[], shopScroll=0, shopDrag=null;
var droneCam=null, respawnT=0, squadLost=0, enades=[], bossBarrels=[];
var mapKind='compound', duck=[], wires=[], droneT;
var gunboat=null, aboard=false, jetty=null, aircraft=[], motorcade=[], redBossSpawned=0, redBossDefeated=0, compoundBossSpawned=0, compoundBossDefeated=0, bossHammers=[], levelTwoBossSpawned=0, levelTwoBossDefeated=0, meatShots=[], meatBits=[], oilBossSpawned=0, oilBossDefeated=0, fireBottles=[], airfieldBossSpawned=0, airfieldBossDefeated=0, miniNukes=[], airAssaultWave=0, airAssaultT=0;
var ships=[], missiles=[], wakes=[], floaters=[], seaMines=[], baseHP=100, baseMX=100, seaPad=null, seaCD=0, baseFlash=0;
var seaBossSpawned=0, seaBossDefeated=0;
var homeSpawn={x:61.5,y:8.6};
var padList=[], wingmen=[], relaunch=0, truck=null, truckRoute=[], depots=[], depotWorkers=[], aaGuns=[], refineries=[], sams=[], samShots=[], smog=0;
var bunkers=[], roads=[], bases=[], flags=[], intro=[], introT=0;
var rescueGroups=[], captives=[];
var BASE={x0:55.5,y0:2.2,x1:67.8,y1:13.6}, wave=0, dronePad=null, droneCD=0, tank=null;
var flag=null, baseFlags=[], crew=[], civs=[], civT=4, shopPad=null, shopCD=0, bought={}, upgAP=60, upgHP=100;
var belt=[], drops=[], twitchers=[], money=0, sentries=[], strikes=[], smokes=[], drone=null, piloting=false, fx2=[];
var fires=[], plume=[], embers=[], motes=[], flares=[], chunks=[], mist=[], splat=[], pools=[], arty={t:5,flash:0}, wind=14, now=0;
var medStation=null;
var spawnQ=0, spawnT=0, aliveTarget=0, killed=0, totalKills=0, timeAlive=0;

function inBase(x,y){
  var tx=x/TILE, ty=y/TILE;
  return tx>=BASE.x0&&tx<=BASE.x1&&ty>=BASE.y0&&ty<=BASE.y1;
}
function T(x,y){ return (x<0||y<0||x>=MW||y>=MH)?WALL:grid[y*MW+x]; }
function setT(x,y,v){ if(x>=0&&y>=0&&x<MW&&y<MH) grid[y*MW+x]=v; }
function blocksMove(t){ return t===WALL||t===BROKEN||t===PROP||t===WATER; }
function blocksShot(t){ return t===WALL||t===PROP; }
function isWater(x,y){ return T(Math.floor(x/TILE),Math.floor(y/TILE))===WATER; }
function slowT(t){ return t===RUBBLE||t===CRATER||t===CRUMBLE; }

/* =========================================================================
   MAP
   ========================================================================= */
function fill(x0,y0,x1,y1,v){ for(var y=y0;y<=y1;y++) for(var x=x0;x<=x1;x++) setT(x,y,v); }

function blast(cx,cy,r,inside){
  for(var y=Math.floor(cy-r);y<=cy+r;y++) for(var x=Math.floor(cx-r);x<=cx+r;x++){
    var d=Math.hypot(x-cx,y-cy)+rr(-.5,.5); if(d>r) continue;
    var t=T(x,y);
    if(t===WALL) setT(x,y, d<r*0.62?RUBBLE:CRUMBLE);
    else if(t===FLOOR) setT(x,y, d<r*0.8?RUBBLE:FLOOR);
    else if(t===EXT) setT(x,y, d<r*0.7?CRATER:EXT);
  }
  if(inside) holes.push({x:cx*TILE,y:cy*TILE,r:r*TILE*0.75});
}

function addProp(x,y,w,h,kind,cover){
  props.push({x:x,y:y,w:w,h:h,kind:kind});
  for(var j=0;j<h;j++) for(var i=0;i<w;i++) setT(x+i,y+j, cover?BROKEN:PROP);
}

function buildMap(){
  aircraft.length=0;
  medStation=null;
  rescueGroups.length=0; captives.length=0;
  mapKind=(level===2)?'trench':((level===3)?'sea':((level===4)?'oil':((level===5)?'airfield':((level===6)?'redSquare':'compound'))));
  if(mapKind==='trench'){ buildTrench(); return; }
  if(mapKind==='sea'){ buildSea(); return; }
  if(mapKind==='oil'){ buildOil(); return; }
  if(mapKind==='airfield'){ buildAirfield(); return; }
  if(mapKind==='redSquare'){ buildRedSquare(); return; }
  setMapSize(70,52,false);
  SPAWNS=SPAWNS_COMPOUND.slice();
  BASE={x0:BASE_COMPOUND.x0,y0:BASE_COMPOUND.y0,x1:BASE_COMPOUND.x1,y1:BASE_COMPOUND.y1};
  homeSpawn={x:57.5,y:8.5};
  seed=9001+level*77;
  grid.fill(EXT); props.length=0; holes.length=0; depots.length=0; depotWorkers.length=0; aaGuns.length=0;
  function F(x0,y0,x1,y1,v){ fill(x0+HX,y0+HY,x1+HX,y1+HY,v); }
  function AP(x,y,w,h,k,c){ addProp(x+HX,y+HY,w,h,k,c); }
  function BL(x,y,r,i){ blast(x+HX,y+HY,r,i); }

  // ===== roads, laid before anything is built on top =====
  roads.length=0;
  function road(x0,y0,x1,y1){ roads.push([x0,y0,x1,y1]); fill(x0,y0,x1,y1,EXT); }
  road(18,3,21,48);      // west lane, between the outbuilding and the house
  road(2,44,67,47);      // the approach road along the south
  road(21,12,58,14);     // north lane running past the front of the house
  road(59,15,62,44);     // east lane down from the base

  // ===== the house, tightened up =====
  F(5,4,34,25);
  F(6,5,33,24,FLOOR);
  F(20,5,20,14,WALL);   F(20,9,20,10,FLOOR);
  F(6,15,33,15,WALL);   F(11,15,12,15,FLOOR); F(27,15,28,15,FLOOR);
  F(6,19,33,19,WALL);   F(9,19,10,19,FLOOR);  F(21,19,22,19,FLOOR); F(30,19,31,19,FLOOR);
  F(16,20,16,24,WALL);  F(16,22,16,23,FLOOR);
  F(26,20,26,24,WALL);  F(26,21,26,22,FLOOR);
  F(5,17,5,18,FLOOR); F(34,10,34,11,FLOOR); F(17,4,18,4,FLOOR);

  AP(7,6,3,4,'bed');      AP(11,6,1,1,'night');
  AP(16,5,3,1,'dresser'); AP(17,12,2,2,'brokenchair');
  AP(13,8,2,1,'mattress'); AP(10,12,1,1,'cabinet');
  AP(18,8,1,1,'rubblepile');
  AP(22,5,5,1,'counter'); AP(29,5,2,1,'stove');  AP(31,5,2,2,'fridge');
  AP(23,11,4,3,'smashtable'); AP(30,12,2,2,'shelf');
  AP(27,8,1,2,'cabinet');  AP(21,8,1,1,'rubblepile'); AP(31,9,1,1,'brokenchair');
  AP(12,16,3,1,'shelf');  AP(23,16,2,1,'crateP');
  AP(16,16,1,1,'rubblepile'); AP(28,16,2,1,'smashtable');
  AP(7,22,4,2,'sofa');    AP(7,20,1,1,'brokentv'); AP(11,20,2,1,'smashtable');
  AP(14,24,1,1,'brokenchair'); AP(9,24,1,1,'rubblepile');
  AP(17,20,3,2,'tub');    AP(22,23,2,1,'sink');
  AP(19,23,1,1,'cabinet');
  AP(28,20,4,5,'car');    AP(32,20,2,4,'bench'); AP(27,20,1,1,'barrel');
  AP(30,16,1,1,'rubblepile');

  // ===== outbuilding across the yard =====
  fill(4,6,17,17,WALL); fill(5,7,16,16,FLOOR);
  fill(10,17,11,17,FLOOR); fill(17,10,17,11,FLOOR);
  addProp(6,8,2,4,'bench'); addProp(13,8,3,2,'crateP'); addProp(6,14,1,1,'barrel');
  addProp(14,13,2,3,'shelf'); addProp(9,11,4,3,'car');

  // ===== shed on the far side =====
  fill(60,30,68,38,WALL); fill(61,31,67,37,FLOOR); fill(60,33,60,34,FLOOR);
  addProp(62,32,3,2,'crateP'); addProp(66,35,1,2,'barrel');

  // ===== perimeter wall with gates =====
  fill(1,2,68,2,WALL); fill(1,49,68,49,WALL);
  fill(1,2,1,49,WALL); fill(68,2,68,49,WALL);
  fill(32,2,36,2,EXT); fill(30,49,34,49,EXT); fill(1,24,1,27,EXT); fill(68,20,68,23,EXT);

  // ===== approach road and forecourt =====
  fill(2,44,67,47,EXT);
  addProp(50,44,5,3,'car'); addProp(20,45,4,2,'car');
  addProp(24,42,1,4,'sand',true); addProp(44,42,1,4,'sand',true);
  addProp(8,26,1,5,'sand',true);  addProp(58,12,1,5,'sand',true);
  addProp(36,6,5,1,'sand',true);  addProp(12,40,4,1,'sand',true);
  addProp(62,24,3,1,'sand',true); addProp(6,20,3,1,'sand',true);

  // ===== the forward operating base, north-east corner =====
  fill(52,2,67,14,WALL); fill(53,3,66,13,FLOOR);
  fill(58,14,60,14,FLOOR);                        // south gate
  fill(52,8,52,9,FLOOR);                          // west gate
  fill(60,3,60,7,WALL); fill(60,5,60,6,FLOOR);    // internal partition
  shopPad={x:(56.5)*TILE,y:(6.5)*TILE};
  dronePad={x:(64.5)*TILE,y:(6.85)*TILE};
  addProp(55,5,3,1,'shoptable'); addProp(53,3,1,2,'shelf');
  addProp(53,10,4,1,'console');  addProp(57,12,2,1,'console');
  addProp(65,3,1,2,'dronerack'); addProp(65,11,1,2,'dronerack');
  addProp(53,12,2,1,'ammocrate');addProp(62,12,2,1,'ammocrate');
  addProp(58,3,1,1,'barrel');    addProp(62,8,1,1,'crateP');
  addProp(61,3,2,1,'medbed');    addProp(61,5,2,1,'medbed');
  medStation={x:63.5*TILE,y:4.5*TILE,nurse:1,
    healX:64.35*TILE,healY:5.45*TILE,healR:25,healing:0,healFx:0};
  padList=[{x:64.5*TILE,y:6.85*TILE,standX:62.5*TILE,standY:6.85*TILE,table:1,kind:'droneS',cd:0,cool:24,n:'SCOUT'},
           {x:64.5*TILE,y:9.85*TILE,standX:62.5*TILE,standY:9.85*TILE,table:1,kind:'drone', cd:0,cool:36,n:'FPV'}];
  setupTruck(null);

  // ===== busted-up vehicles littering the roads =====
  addProp(19,21,2,4,'wreck');   addProp(18,35,2,4,'wreck');
  addProp(30,45,4,2,'truck');   addProp(48,44,4,2,'wreck');
  addProp(24,12,4,2,'wreck');   addProp(53,12,4,2,'truck');
  addProp(59,26,2,4,'wreck');   addProp(9,45,4,2,'wreck');
  addProp(38,45,2,2,'burnt');   addProp(21,44,2,2,'burnt');

  // ===== shipping container with flag — south entrance of the FOB =====
  addProp(61,15,3,1,'container');
  // ===== our colours over the compound base =====
  baseFlags=[{x:52.4*TILE,y:15.6*TILE,h:62,crest:0},{x:67.4*TILE,y:15.6*TILE,h:62,crest:0},
             {x:59.5*TILE,y:16.4*TILE,h:66,crest:2},{x:63.5*TILE,y:14.6*TILE,h:52,crest:0}];

  // ===== barricades around the base =====
  addProp(53,16,3,1,'sand',true); addProp(63,16,3,1,'sand',true);
  addProp(50,4,1,3,'sand',true);  addProp(50,11,1,3,'sand',true);
  addProp(56,18,1,1,'hedgehog');  addProp(62,18,1,1,'hedgehog');
  addProp(49,8,1,1,'hedgehog');   addProp(68,16,1,1,'hedgehog');
  addProp(51,16,1,1,'block');     addProp(58,17,2,1,'block');

  flag=null;

  // ===== three sealed enemy bases — no way in but through a wall =====
  bunkers.length=0; bases.length=0; flags.length=0;
  var BP=[[26,3],[5,24],[30,38]];
  for(var bi2=0;bi2<BP.length;bi2++){
    var bx=BP[bi2][0], by=BP[bi2][1];
    fill(bx,by,bx+8,by+8,WALL);
    fill(bx+1,by+1,bx+7,by+7,FLOOR);
    setT(bx+4,by,BROKEN); setT(bx+4,by+8,BROKEN);        // firing slits, not doorways
    setT(bx,by+4,BROKEN); setT(bx+8,by+4,BROKEN);
    addProp(bx-2,by-2,3,1,'sand',true); addProp(bx+7,by-2,3,1,'sand',true);
    addProp(bx-2,by+9,3,1,'sand',true); addProp(bx+7,by+9,3,1,'sand',true);
    addProp(bx-2,by+2,1,3,'sand',true); addProp(bx+10,by+2,1,3,'sand',true);
    addProp(bx-2,by+6,1,2,'sand',true); addProp(bx+10,by+6,1,2,'sand',true);
    addProp(bx+1,by+1,1,1,'crateP');    addProp(bx+7,by+7,1,1,'barrel');
    addProp(bx+7,by+1,1,1,'block');     addProp(bx+1,by+7,1,1,'block');
    bases.push({i:bi2,x0:bx,y0:by,x1:bx+8,y1:by+8,fx:(bx+4.5)*TILE,fy:(by+4.5)*TILE});
    flags.push({x:(bx+4.5)*TILE,y:(by+4.5)*TILE,base:bi2,state:'idle',p:0,wave:rr(0,3),
                heap:null,contest:0,assault:0});
  }
  // ===== ordnance damage =====  // ===== ordnance damage =====
  BL(33,24,5.6,true); BL(20,5.5,3.2,true); BL(6,17.5,2.8,true); BL(13,9,2.1,true);
  blast(10,16,3.0,true); blast(64,34,2.6,true);
  blast(6,40,2.6,false); blast(52,6,2.4,false); blast(30,47,2.8,false);
  blast(2,30,2.2,false); blast(66,14,2.0,false); blast(40,50,2.4,false);
  blast(18,4,2.2,false); blast(56,45,2.6,false);

  for(var sb=0;sb<bases.length;sb++){          // the bases start the level intact
    var SB=bases[sb];
    for(var sx2=SB.x0;sx2<=SB.x1;sx2++){ setT(sx2,SB.y0,WALL); setT(sx2,SB.y1,WALL); }
    for(var sy2=SB.y0;sy2<=SB.y1;sy2++){ setT(SB.x0,sy2,WALL); setT(SB.x1,sy2,WALL); }
    fill(SB.x0+1,SB.y0+1,SB.x1-1,SB.y1-1,FLOOR);
    setT(SB.x0+4,SB.y0,BROKEN); setT(SB.x0+4,SB.y1,BROKEN);
    setT(SB.x0,SB.y0+4,BROKEN); setT(SB.x1,SB.y0+4,BROKEN);
  }
  // Toilets are distributed inside and immediately outside all enemy bases.
  // Their centre firing slits and approaches remain clear.
  for(var lp=0;lp<BP.length;lp++){
    var lbx=BP[lp][0], lby=BP[lp][1];
    addProp(lbx+2,lby+2,1,1,'toilet');
    addProp(lbx+6,lby+2,1,1,lp===1?'looStack':'toilet');
    addProp(lbx+2,lby+6,1,1,'toilet');
    addProp(lbx+6,lby+6,1,1,lp===2?'looStack':'toilet');
    addProp(lbx-1,lby+6,1,1,'toilet');
    addProp(lbx+9,lby+6,1,1,'toilet');
    addProp(lbx+2,lby+9,1,1,'toilet');
  }
  placeFires();
  buildStatic();
  initWallHP();
}
var FLAGT=[36,42];
function placeFires(){
  fires.length=0; plume.length=0; embers.length=0; flares.length=0;
  if(mapKind==='sea'||mapKind==='oil'){ return; }
  if(mapKind==='trench'){
    var TF=[[20,17],[38,26],[52,20],[10,33],[60,30],[30,8],[46,42],[26,45]];
    for(var t3=0;t3<TF.length;t3++)
      fires.push({x:TF[t3][0]*TILE,y:TF[t3][1]*TILE,r:rr(9,15),p:rr(0,6),life:-1,sp:0});
    return;
  }
  function F(tx,ty,r){ fires.push({x:tx*TILE+TILE/2,y:ty*TILE+TILE/2,r:r,p:rr(0,6),life:-1,sp:0}); }
  F(HX+29,HY+22,14);        // the burning car in the garage
  F(HX+33.5,HY+24.5,17);    // the blown-out corner
  F(HX+20,HY+5.5,11);       // roof breach over the divider
  F(10,16,11);              // the outbuilding is alight
  F(30,47,12); F(52,6,10);  // craters off the road
  F(64,34,9);
  if(level%2===0) F(HX+8,HY+21,9);
  F(31,45.5,12); F(24.5,12.5,10);      // wrecks still burning on the roads
}

function initWallHP(){
  dmgList.length=0; dmgMap={};
  for(var y=0;y<MH;y++) for(var x=0;x<MW;x++){
    var t=grid[y*MW+x], i=y*MW+x;
    wallHP[i] = t===WALL?110 : (t===BROKEN?60 : (t===CRUMBLE?48 : (t===PROP?70:0)));
  }
}
function markDmg(tx,ty,mode){
  var i=ty*MW+tx;
  if(dmgMap[i]===undefined) dmgList.push({x:tx,y:ty,i:i});
  dmgMap[i]=mode;
  var bi=(ty+1)*MW+tx, bt=T(tx,ty+1);
  if(bt!==WALL&&bt!==PROP&&dmgMap[bi]===undefined){ dmgList.push({x:tx,y:ty+1,i:bi}); dmgMap[bi]=0; }
}
function damageWall(tx,ty,amt){
  var t=T(tx,ty), i=ty*MW+tx;
  if(t!==WALL&&t!==BROKEN&&t!==CRUMBLE&&t!==PROP) return false;
  wallHP[i]=Math.max(0,wallHP[i]-amt);
  if(wallHP[i]>0) return false;
  var cx=tx*TILE+TILE/2, cy=ty*TILE+TILE/2;
  if(t===WALL||t===BROKEN){ setT(tx,ty,CRUMBLE); wallHP[i]=48; markDmg(tx,ty,1); }
  else { setT(tx,ty,RUBBLE); wallHP[i]=0; markDmg(tx,ty,2); }
  for(var d=0;d<ri(4,8);d++) launchPart(cx,cy,'debris',null,null,rr(0,6.3),rr(.5,1.1));
  dustPuff(cx,cy,ri(7,13),1.5);
  for(var pz=0;pz<ri(2,4);pz++) plume.push({x:cx+rr(-12,12),y:cy+rr(-12,12),vx:rr(-20,20),vy:rr(-34,6),
    life:rr(1.2,2.4),max:2.4,s:rr(7,15),hot:0,dust:1});
  dc.fillStyle='rgba(120,112,98,'+rr(.1,.24)+')';
  dc.beginPath(); dc.arc(cx+rr(-10,10),cy+rr(-10,10),rr(6,14),0,6.3); dc.fill();
  flowT=0;
  for(var ab=0;ab<bases.length;ab++){
    var AB=bases[ab];
    if(tx>=AB.x0-1&&tx<=AB.x1+1&&ty>=AB.y0-1&&ty<=AB.y1+1&&!AB.alert){
      AB.alert=1; banner('BASE '+(ab+1)+' BREACHED','THEY ARE READY FOR YOU',1.8); sfx('boom',.25);
    }
  }
  return true;
}
function blastWalls(x,y,r,pw){
  if(r<70) return;
  var col=0;
  for(var ty=Math.floor((y-r)/TILE);ty<=Math.floor((y+r)/TILE);ty++)
  for(var tx=Math.floor((x-r)/TILE);tx<=Math.floor((x+r)/TILE);tx++){
    var d=Math.hypot(tx*TILE+TILE/2-x,ty*TILE+TILE/2-y);
    var jit=1+Math.sin(tx*1.9+ty*2.7)*.15+Math.sin(tx*.7-ty*1.3)*.09;
    if(d>r*1.15*jit) continue;
    if(damageWall(tx,ty,pw*(1-d/(r*1.15*jit))*1.7)) col++;
  }
  if(col){ sfx('boom',.22); sfx('crate',.5); shake=Math.min(22,shake+col*1.6); }
}

/* ---------- spawn points (exterior) ---------- */
var SPAWNS;
var SPAWNS_COMPOUND=[[34,3],[32,48],[3,25],[66,21],[4,4],[65,4],[4,47],[65,47],[20,3],[50,3],
            [3,38],[66,40],[24,48],[52,48],[10,22],[60,15],[45,46],[16,46]];
var BASE_COMPOUND={x0:51.6,y0:1.6,x1:67.6,y1:14.6};
SPAWNS=SPAWNS_COMPOUND.slice();
function validSpawn(s){ var t=T(s[0],s[1]); return !blocksMove(t); }

/* =========================================================================
   STATIC WORLD LAYER
   ========================================================================= */
function setMapSize(w,h,lightDecals){
  MW=w; MH=h; WW=MW*TILE; WH=MH*TILE;
  grid=new Uint8Array(MW*MH);
  wallHP=new Uint8Array(MW*MH);
  flow=new Int8Array(MW*MH*2); fq=new Int32Array(MW*MH); dist=new Int32Array(MW*MH);
  pfPrev=new Int32Array(MW*MH); pfSeen=new Int32Array(MW*MH); pfQ=new Int32Array(MW*MH); pfMark=0;
  stat.width=WW; stat.height=WH;
  if(lightDecals){ deco.width=deco.height=1; bloodC.width=bloodC.height=1; }
  else { deco.width=WW; deco.height=WH; bloodC.width=WW; bloodC.height=WH; }
}
var stat=document.createElement('canvas'); stat.width=WW; stat.height=WH;
var sc=stat.getContext('2d');
var deco=document.createElement('canvas'); deco.width=WW; deco.height=WH;
var dc=deco.getContext('2d');
var bloodC=document.createElement('canvas'); bloodC.width=WW; bloodC.height=WH;
var bc=bloodC.getContext('2d');
var BLOOD_FADE=15, fadeT=0;

function shade(c,f){ // hex tint
  var n=parseInt(c.slice(1),16), r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.max(0,Math.min(255,r*f))|0; g=Math.max(0,Math.min(255,g*f))|0; b=Math.max(0,Math.min(255,b*f))|0;
  return 'rgb('+r+','+g+','+b+')';
}

function buildStatic(){
  seed=4242+level;
  sc.clearRect(0,0,WW,WH); dc.clearRect(0,0,WW,WH); bc.clearRect(0,0,WW,WH);

  // ---- ground pass
  for(var y=0;y<MH;y++) for(var x=0;x<MW;x++){
    var t=grid[y*MW+x], px=x*TILE, py=y*TILE;
    var onRoad=false;
    for(var rq=0;rq<roads.length;rq++){ var RD=roads[rq];
      if(x>=RD[0]&&x<=RD[2]&&y>=RD[1]&&y<=RD[3]){ onRoad=true; break; } }
    if(t===WATER){
      var deep=Math.min(1,(Math.hypot(x-11,y-45)/46));
      sc.fillStyle=shade('#1d3b4e',.82+deep*.34); sc.fillRect(px,py,TILE,TILE);
      for(var wv=0;wv<3;wv++){
        sc.strokeStyle='rgba('+ri(120,190)+','+ri(180,225)+',225,'+rr(.05,.16)+')'; sc.lineWidth=1.3;
        var wy4=py+rr(2,TILE-2);
        sc.beginPath(); sc.moveTo(px,wy4);
        sc.quadraticCurveTo(px+TILE*.5,wy4+rr(-4,4),px+TILE,wy4); sc.stroke();
      }
      if(!blocksMove(T(x,y+1))||!blocksMove(T(x-1,y))||!blocksMove(T(x+1,y))||!blocksMove(T(x,y-1))){
        sc.fillStyle='rgba(226,240,246,.16)';                       // surf along the shore
        for(var fo=0;fo<5;fo++) sc.fillRect(px+rr(0,TILE),py+rr(0,TILE),rr(3,10),rr(1,2.4));
      }
    } else if(onRoad&&(t===EXT||t===CRATER||t===RUBBLE)){
      sc.fillStyle=shade(mapKind==='airfield'?'#aeb7bb':'#4a4740',rr(.9,1.08)); sc.fillRect(px,py,TILE,TILE);
      for(var gr=0;gr<14;gr++){ sc.fillStyle='rgba('+ri(90,140)+','+ri(88,134)+','+ri(80,124)+','+rr(.15,.4)+')';
        sc.fillRect(px+rr(0,TILE),py+rr(0,TILE),rr(1,3),rr(1,2.4)); }
      for(var pt=0;pt<3;pt++){ sc.fillStyle='rgba(28,26,22,'+rr(.12,.3)+')';
        sc.beginPath(); sc.ellipse(px+rr(2,32),py+rr(2,32),rr(3,8),rr(2,5),rr(0,3),0,6.3); sc.fill(); }
      if(mapKind==='airfield'){
        sc.fillStyle='rgba(241,247,249,.72)';
        for(var sr=0;sr<7;sr++) sc.fillRect(px+rr(0,TILE),py+rr(0,TILE),rr(2,9),rr(1,3));
      }
    } else if(t===EXT||t===CRATER){
      sc.fillStyle=shade(mapKind==='airfield'?'#dbe4e8':'#5d5a44',rr(.86,1.06)); sc.fillRect(px,py,TILE,TILE);
      for(var i=0;i<5;i++){ sc.fillStyle=mapKind==='airfield'?'rgba(145,165,176,.22)':'rgba(40,44,26,'+rr(.1,.3)+')'; sc.fillRect(px+rr(0,TILE),py+rr(0,TILE),rr(2,7),rr(1,3)); }
      if(mapKind==='sea'){
        // Narrow sandy bands trace every land edge without blocking boats.
        sc.fillStyle=shade('#c9ad72',rr(.9,1.08));
        if(T(x-1,y)===WATER) sc.fillRect(px,py,9,TILE);
        if(T(x+1,y)===WATER) sc.fillRect(px+TILE-9,py,9,TILE);
        if(T(x,y-1)===WATER) sc.fillRect(px,py,TILE,9);
        if(T(x,y+1)===WATER) sc.fillRect(px,py+TILE-9,TILE,9);
        if(T(x-1,y)===WATER||T(x+1,y)===WATER||T(x,y-1)===WATER||T(x,y+1)===WATER){
          for(var sg=0;sg<7;sg++){ sc.fillStyle='rgba(91,72,42,'+rr(.12,.28)+')'; sc.fillRect(px+rr(1,TILE-2),py+rr(1,TILE-2),rr(1,2.4),rr(1,2.4)); }
        }
      }
      if(mapKind==='airfield'&&rnd()<.28){ sc.fillStyle='rgba(250,253,255,.8)'; for(var sn=0;sn<5;sn++) sc.fillRect(px+rr(2,30),py+rr(2,30),rr(2,6),rr(1,2.5)); }
      else if(mapKind!=='airfield'&&rnd()<.13){ sc.fillStyle='rgba(96,110,58,.5)'; for(var g=0;g<4;g++) sc.fillRect(px+rr(2,30),py+rr(2,30),2,rr(3,6)); }
    } else if(mapKind==='trench'){
      sc.fillStyle=shade('#4b4034',rr(.84,1.12)); sc.fillRect(px,py,TILE,TILE);
      for(var mp=0;mp<7;mp++){ sc.fillStyle='rgba('+ri(38,74)+','+ri(32,62)+','+ri(26,50)+','+rr(.2,.5)+')';
        sc.beginPath(); sc.ellipse(px+rr(0,TILE),py+rr(0,TILE),rr(3,9),rr(2,6),rr(0,3),0,6.3); sc.fill(); }
      if(rnd()<.4){ sc.fillStyle='rgba(58,66,74,'+rr(.12,.3)+')';      // standing water
        sc.beginPath(); sc.ellipse(px+rr(6,28),py+rr(6,28),rr(5,12),rr(3,8),rr(0,3),0,6.3); sc.fill(); }
    } else {
      // interior floorboards
      sc.fillStyle=shade('#7a5f3e',rr(.82,1.05)); sc.fillRect(px,py,TILE,TILE);
      sc.strokeStyle='rgba(30,20,12,.35)'; sc.lineWidth=1;
      for(var b=0;b<3;b++){ var yy=py+b*(TILE/3)+.5; sc.beginPath(); sc.moveTo(px,yy); sc.lineTo(px+TILE,yy); sc.stroke(); }
      sc.strokeStyle='rgba(30,20,12,.22)'; sc.beginPath(); sc.moveTo(px+.5,py); sc.lineTo(px+.5,py+TILE); sc.stroke();
    }
  }
  // craters
  if(mapKind==='airfield'){
    // Layered snow hills around the perimeter leave both runways readable.
    var snowHills=[[5,7,5,2.4],[15,14,7,3],[24,4,6,2.5],[8,28,8,3.2],[18,36,6,2.6],[76,4,6,2.5],[78,22,5,2.4],[72,43,8,3.2],[35,48,7,2.8]];
    for(var sh=0;sh<snowHills.length;sh++){
      var SH=snowHills[sh],shx=SH[0]*TILE,shy=SH[1]*TILE,shw=SH[2]*TILE,shh=SH[3]*TILE;
      sc.fillStyle='rgba(90,108,120,.28)'; sc.beginPath(); sc.ellipse(shx+8,shy+10,shw,shh,0,0,6.3); sc.fill();
      sc.fillStyle='#cbd7dd'; sc.beginPath(); sc.ellipse(shx,shy,shw,shh,0,0,6.3); sc.fill();
      sc.fillStyle='rgba(248,252,255,.9)'; sc.beginPath(); sc.ellipse(shx-shw*.12,shy-shh*.22,shw*.78,shh*.58,-.08,0,6.3); sc.fill();
      sc.strokeStyle='rgba(126,151,164,.4)'; sc.lineWidth=2; sc.beginPath(); sc.arc(shx,shy,shw*.55,3.5,5.8); sc.stroke();
    }
  }

  // craters
  for(var y2=0;y2<MH;y2++) for(var x2=0;x2<MW;x2++) if(grid[y2*MW+x2]===CRATER){
    var cx=x2*TILE+TILE/2, cy=y2*TILE+TILE/2;
    sc.fillStyle='rgba(28,24,16,.72)'; sc.beginPath(); sc.ellipse(cx,cy,TILE*.62,TILE*.5,rr(0,3),0,6.3); sc.fill();
    sc.fillStyle='rgba(20,17,11,.55)'; sc.beginPath(); sc.ellipse(cx,cy+2,TILE*.36,TILE*.28,0,0,6.3); sc.fill();
  }
  // rubble
  for(var y3=0;y3<MH;y3++) for(var x3=0;x3<MW;x3++) if(grid[y3*MW+x3]===RUBBLE){
    var rx=x3*TILE, ry=y3*TILE;
    sc.fillStyle='rgba(35,32,26,.35)'; sc.fillRect(rx,ry,TILE,TILE);
    if(mapKind==='sea'&&(T(x3-1,y3)===WATER||T(x3+1,y3)===WATER||T(x3,y3-1)===WATER||T(x3,y3+1)===WATER)){
      sc.fillStyle='#c9ad72';
      if(T(x3-1,y3)===WATER) sc.fillRect(rx,ry,8,TILE);
      if(T(x3+1,y3)===WATER) sc.fillRect(rx+TILE-8,ry,8,TILE);
      if(T(x3,y3-1)===WATER) sc.fillRect(rx,ry,TILE,8);
      if(T(x3,y3+1)===WATER) sc.fillRect(rx,ry+TILE-8,TILE,8);
    }
    for(var k=0;k<9;k++){
      var s=rr(3,9);
      sc.fillStyle=shade('#9a917f',rr(.55,1.1));
      sc.save(); sc.translate(rx+rr(2,TILE-4),ry+rr(2,TILE-4)); sc.rotate(rr(0,3.14));
      sc.fillRect(-s/2,-s/3,s,s*.66); sc.restore();
    }
  }

  if(mapKind==='trench'){                                        // duckboards
    for(var dk=0;dk<duck.length;dk++){
      var DX2=duck[dk][0]*TILE, DY2=duck[dk][1]*TILE;
      var horiz2=!blocksMove(T(duck[dk][0]-1,duck[dk][1]))||!blocksMove(T(duck[dk][0]+1,duck[dk][1]));
      sc.save(); sc.translate(DX2+TILE/2,DY2+TILE/2); if(!horiz2) sc.rotate(Math.PI/2);
      sc.fillStyle='rgba(102,78,48,.45)'; sc.fillRect(-TILE/2+1,-11,TILE-2,22);
      sc.strokeStyle='rgba(52,38,22,.45)'; sc.lineWidth=1.3;
      for(var pk2=0;pk2<5;pk2++){ sc.beginPath();
        sc.moveTo(-TILE/2+3+pk2*7,-11); sc.lineTo(-TILE/2+3+pk2*7,11); sc.stroke(); }
      sc.strokeStyle='rgba(70,52,30,.5)'; sc.strokeRect(-TILE/2+1,-11,TILE-2,22);
      sc.restore();
    }
  }

  // ---- wall drop shadow onto ground
  sc.fillStyle='rgba(0,0,0,.32)';
  for(var y4=0;y4<MH;y4++) for(var x4=0;x4<MW;x4++){
    var tt=grid[y4*MW+x4];
    if(tt===WALL&&!blocksMove(T(x4,y4+1))) sc.fillRect(x4*TILE,(y4+1)*TILE,TILE,9);
  }

  // ---- walls
  for(var y5=0;y5<MH;y5++) for(var x5=0;x5<MW;x5++){
    var t5=grid[y5*MW+x5], X=x5*TILE, Y=y5*TILE;
    if(t5===WALL&&mapKind==='trench'){
      sc.fillStyle=shade('#6a5b41',rr(.86,1.14)); sc.fillRect(X,Y,TILE,TILE);
      for(var eb2=0;eb2<10;eb2++){ sc.fillStyle='rgba('+ri(58,106)+','+ri(50,90)+','+ri(32,64)+','+rr(.2,.5)+')';
        sc.beginPath(); sc.ellipse(X+rr(0,TILE),Y+rr(0,TILE),rr(2,7),rr(2,5),rr(0,3),0,6.3); sc.fill(); }
      if(!blocksMove(T(x5,y5+1))){
        sc.fillStyle='rgba(28,22,15,.5)'; sc.fillRect(X,Y+TILE-8,TILE,8);
        for(var sbx=0;sbx<3;sbx++){ sc.fillStyle=shade('#8a7c55',rr(.8,1.16));
          rrect(sc,X+sbx*12+1,Y+TILE-13,11,9,3.5); sc.fill();
          sc.strokeStyle='rgba(40,34,20,.5)'; sc.lineWidth=1.1; sc.stroke(); }
      }
      if(rnd()<.35){ sc.strokeStyle='rgba(96,116,54,.4)'; sc.lineWidth=1.3;
        for(var gt=0;gt<4;gt++){ var gx2=X+rr(3,30), gy2=Y+rr(3,30);
          sc.beginPath(); sc.moveTo(gx2,gy2); sc.lineTo(gx2+rr(-3,3),gy2-rr(4,9)); sc.stroke(); } }
    } else if(t5===WALL){
      sc.fillStyle=shade('#b9b0a0',rr(.9,1.05)); sc.fillRect(X,Y,TILE,TILE);
      sc.fillStyle='rgba(255,255,255,.10)'; sc.fillRect(X,Y,TILE,5);
      sc.fillStyle='rgba(0,0,0,.16)'; sc.fillRect(X,Y+TILE-6,TILE,6);
      for(var s5=0;s5<3;s5++){ sc.fillStyle='rgba(90,82,70,'+rr(.1,.25)+')'; sc.fillRect(X+rr(0,26),Y+rr(0,26),rr(4,10),rr(2,5)); }
      sc.strokeStyle='rgba(28,24,18,.9)'; sc.lineWidth=2;
      if(T(x5,y5-1)!==WALL){sc.beginPath();sc.moveTo(X,Y+1);sc.lineTo(X+TILE,Y+1);sc.stroke();}
      if(T(x5,y5+1)!==WALL){sc.beginPath();sc.moveTo(X,Y+TILE-1);sc.lineTo(X+TILE,Y+TILE-1);sc.stroke();}
      if(T(x5-1,y5)!==WALL){sc.beginPath();sc.moveTo(X+1,Y);sc.lineTo(X+1,Y+TILE);sc.stroke();}
      if(T(x5+1,y5)!==WALL){sc.beginPath();sc.moveTo(X+TILE-1,Y);sc.lineTo(X+TILE-1,Y+TILE);sc.stroke();}
    }
  }
  // ---- broken stubs (waist high cover)
  for(var y6=0;y6<MH;y6++) for(var x6=0;x6<MW;x6++){
    var tv6=grid[y6*MW+x6];
    if(tv6!==BROKEN&&tv6!==CRUMBLE) continue;
    var bx=x6*TILE, by=y6*TILE, isSand=false;
    for(var p6=0;p6<props.length;p6++){ var pr=props[p6];
      if(pr.kind==='sand'&&x6>=pr.x&&x6<pr.x+pr.w&&y6>=pr.y&&y6<pr.y+pr.h) isSand=true; }
    sc.fillStyle='rgba(0,0,0,.3)'; sc.fillRect(bx+2,by+TILE-7,TILE-4,8);
    if(isSand){
      for(var sb=0;sb<3;sb++){ sc.fillStyle=shade('#8a7c55',rr(.85,1.12));
        rrect(sc,bx+2,by+3+sb*9,TILE-4,10,4); sc.fill();
        sc.strokeStyle='rgba(40,34,20,.6)'; sc.lineWidth=1.4; sc.stroke(); }
    } else {
      var low=(tv6===CRUMBLE);
      sc.fillStyle=shade('#a79c8b',rr(.85,1.05));
      sc.beginPath(); sc.moveTo(bx,by+TILE);
      var steps=5; for(var q=0;q<=steps;q++) sc.lineTo(bx+q*TILE/steps, by+(low?rr(15,25):rr(6,17)));
      sc.lineTo(bx+TILE,by+TILE); sc.closePath(); sc.fill();
      sc.strokeStyle='rgba(30,26,20,.85)'; sc.lineWidth=2; sc.stroke();
      if(low){ for(var lc=0;lc<7;lc++){ var lsz=rr(3,8);
        sc.fillStyle=shade('#9a917f',rr(.55,1.1));
        sc.save(); sc.translate(bx+rr(2,TILE-3),by+rr(16,TILE-2)); sc.rotate(rr(0,3.14));
        sc.fillRect(-lsz/2,-lsz/3,lsz,lsz*.66); sc.restore(); } }
      for(var br=0;br<4;br++){ sc.fillStyle='rgba(150,72,52,'+rr(.3,.7)+')'; sc.fillRect(bx+rr(2,24),by+rr(14,26),rr(6,10),4); }
    }
  }

  // ---- props
  for(var p=0;p<props.length;p++){ var o=props[p]; if(o.kind!=='sand') drawProp(sc,o); }

  // ---- bullet pocks, cracks and soot on the walls
  for(var wy=0;wy<MH;wy++) for(var wx=0;wx<MW;wx++){
    if(grid[wy*MW+wx]!==WALL) continue;
    var WX=wx*TILE, WY=wy*TILE, near=0;
    for(var hh=0;hh<holes.length;hh++) if(Math.hypot(WX-holes[hh].x,WY-holes[hh].y)<holes[hh].r*2.6) near=1;
    var pocks=near?ri(5,11):ri(0,4);
    for(var pk=0;pk<pocks;pk++){
      var px2=WX+rr(3,TILE-3), py2=WY+rr(3,TILE-3), pr=rr(1.3,3.2);
      sc.fillStyle='rgba(60,54,44,.75)'; sc.beginPath(); sc.arc(px2,py2,pr,0,6.3); sc.fill();
      sc.fillStyle='rgba(255,255,255,.16)'; sc.beginPath(); sc.arc(px2-pr*.4,py2-pr*.4,pr*.6,0,6.3); sc.fill();
    }
    if(rnd()<.34){ // crack
      sc.strokeStyle='rgba(48,42,34,.55)'; sc.lineWidth=rr(.8,1.6); sc.beginPath();
      var kx=WX+rr(4,30), ky=WY+rr(2,10); sc.moveTo(kx,ky);
      for(var kk=0;kk<3;kk++){ kx+=rr(-8,8); ky+=rr(6,12); sc.lineTo(kx,ky); }
      sc.stroke();
    }
    if(near&&rnd()<.6){ sc.fillStyle='rgba(26,22,18,'+rr(.12,.34)+')'; sc.fillRect(WX,WY,TILE,TILE); }
  }

  // ---- debris strewn across the floors
  for(var dy2=0;dy2<MH;dy2++) for(var dx2=0;dx2<MW;dx2++){
    var dt2=grid[dy2*MW+dx2]; if(dt2!==FLOOR&&dt2!==EXT) continue;
    var DX=dx2*TILE, DY=dy2*TILE;
    if(rnd()<(dt2===FLOOR?.55:.3)){
      var bits=ri(2,6);
      for(var bb=0;bb<bits;bb++){
        var ex=DX+rr(2,TILE-2), ey=DY+rr(2,TILE-2), roll=rnd();
        sc.save(); sc.translate(ex,ey); sc.rotate(rr(0,3.14));
        if(roll<.34){ sc.fillStyle='rgba(120,92,58,'+rr(.4,.8)+')'; sc.fillRect(-rr(3,9),-1,rr(6,16),rr(1.5,3)); }      // splinters
        else if(roll<.6){ sc.fillStyle='rgba(168,158,142,'+rr(.35,.75)+')'; sc.fillRect(-3,-2,rr(4,8),rr(3,5)); }       // plaster
        else if(roll<.78){ sc.fillStyle='rgba(146,74,54,'+rr(.4,.8)+')'; sc.fillRect(-4,-2,rr(7,11),rr(3,5)); }         // brick
        else if(roll<.9){ sc.fillStyle='rgba(232,228,214,'+rr(.35,.7)+')'; sc.fillRect(-4,-3,rr(7,10),rr(6,9)); }       // paper
        else { sc.fillStyle='rgba(190,215,220,'+rr(.3,.6)+')'; sc.beginPath(); sc.moveTo(0,0); sc.lineTo(rr(3,7),rr(-4,-1)); sc.lineTo(rr(4,8),rr(2,5)); sc.closePath(); sc.fill(); } // glass
        sc.restore();
      }
    }
    if(dt2===EXT&&rnd()<.09){ // spent casings
      for(var cs=0;cs<ri(3,8);cs++){ sc.save(); sc.translate(DX+rr(4,30),DY+rr(4,30)); sc.rotate(rr(0,3.14));
        sc.fillStyle='rgba(196,158,74,'+rr(.4,.8)+')'; sc.fillRect(-3,-1,6,2); sc.restore(); }
    }
  }

  // ---- collapsed ceiling beams
  var beams=mapKind==='trench'?[]:[[HX+9,HY+8,3.0,.4],[HX+25,HY+9,2.4,-.5],[HX+11,HY+22,2.6,.25],
             [HX+30,HY+17,3.0,-.2],[HX+18,HY+13,2.0,1.1],[9,12,2.6,.6],[63,34,2.2,-.4]];
  for(var bm=0;bm<beams.length;bm++){
    var B=beams[bm], bxx=B[0]*TILE, byy=B[1]*TILE, bl=B[2]*TILE;
    sc.save(); sc.translate(bxx,byy); sc.rotate(B[3]);
    sc.fillStyle='rgba(0,0,0,.35)'; sc.fillRect(-bl/2+4,-4,bl,13);
    sc.fillStyle='#5c452a'; sc.fillRect(-bl/2,-6,bl,12);
    sc.strokeStyle='rgba(24,18,10,.85)'; sc.lineWidth=2; sc.strokeRect(-bl/2,-6,bl,12);
    sc.fillStyle='rgba(30,22,12,.45)';
    for(var gg2=0;gg2<5;gg2++) sc.fillRect(-bl/2+gg2*bl/5,-6,2,12);
    sc.restore();
  }

  // ---- lane markings and gravel shoulders
  for(var rr2=0;rr2<roads.length;rr2++){
    var R=roads[rr2], horiz=(R[2]-R[0])>(R[3]-R[1]);
    var cx2=(R[0]+R[2]+1)/2*TILE, cy2=(R[1]+R[3]+1)/2*TILE;
    sc.strokeStyle='rgba(214,198,140,.28)'; sc.lineWidth=3; sc.setLineDash([22,26]);
    sc.beginPath();
    if(horiz){ sc.moveTo(R[0]*TILE,cy2); sc.lineTo((R[2]+1)*TILE,cy2); }
    else { sc.moveTo(cx2,R[1]*TILE); sc.lineTo(cx2,(R[3]+1)*TILE); }
    sc.stroke(); sc.setLineDash([]);
    sc.strokeStyle='rgba(70,66,56,.5)'; sc.lineWidth=2;
    sc.beginPath();
    if(horiz){ sc.moveTo(R[0]*TILE,R[1]*TILE+2); sc.lineTo((R[2]+1)*TILE,R[1]*TILE+2);
               sc.moveTo(R[0]*TILE,(R[3]+1)*TILE-2); sc.lineTo((R[2]+1)*TILE,(R[3]+1)*TILE-2); }
    else { sc.moveTo(R[0]*TILE+2,R[1]*TILE); sc.lineTo(R[0]*TILE+2,(R[3]+1)*TILE);
           sc.moveTo((R[2]+1)*TILE-2,R[1]*TILE); sc.lineTo((R[2]+1)*TILE-2,(R[3]+1)*TILE); }
    sc.stroke();
  }

  // ---- tyre ruts through the yard
  if(mapKind!=='trench'){
  sc.strokeStyle='rgba(40,34,22,.35)'; sc.lineWidth=7; sc.setLineDash([9,7]);
  sc.beginPath(); sc.moveTo(0,MH*TILE-90); sc.bezierCurveTo(WW*.3,MH*TILE-140,WW*.6,MH*TILE-40,WW,MH*TILE-110); sc.stroke();
  sc.beginPath(); sc.moveTo(0,MH*TILE-68); sc.bezierCurveTo(WW*.3,MH*TILE-118,WW*.6,MH*TILE-18,WW,MH*TILE-88); sc.stroke();
  sc.setLineDash([]);
  }

  // ---- scorch beneath every fire
  for(var fi=0;fi<fires.length;fi++){
    var FR=fires[fi];
    scorch(sc,FR.x,FR.y,FR.r*2.1);
    scorch(sc,FR.x+rr(-FR.r,FR.r),FR.y+rr(-FR.r*.6,FR.r*.6),FR.r*1.2);
    sc.fillStyle='rgba(40,32,24,.5)';
    for(var ch=0;ch<10;ch++){ sc.save(); sc.translate(FR.x+rr(-FR.r,FR.r),FR.y+rr(-FR.r,FR.r)); sc.rotate(rr(0,3.14));
      sc.fillRect(-4,-2,rr(6,12),rr(3,5)); sc.restore(); }
  }

  for(var wr=0;wr<wires.length;wr++){                          // barbed wire
    var W3=wires[wr], wx3=W3.x*TILE+TILE/2, wy3=W3.y*TILE+TILE/2;
    sc.save(); sc.translate(wx3,wy3); sc.rotate(W3.a);
    sc.strokeStyle='rgba(38,36,32,.8)'; sc.lineWidth=1.4;
    for(var ln=-1;ln<=1;ln++){
      sc.beginPath();
      for(var seg=-18;seg<=18;seg+=3) sc.lineTo(seg,ln*5+Math.sin(seg*.6)*2);
      sc.stroke();
      for(var brb=-15;brb<=15;brb+=6){
        sc.beginPath(); sc.moveTo(brb-2,ln*5-3); sc.lineTo(brb+2,ln*5+3);
        sc.moveTo(brb+2,ln*5-3); sc.lineTo(brb-2,ln*5+3); sc.stroke();
      }
    }
    sc.strokeStyle='rgba(62,54,42,.85)'; sc.lineWidth=2.6;
    sc.beginPath(); sc.moveTo(-16,-9); sc.lineTo(-16,9); sc.moveTo(16,-9); sc.lineTo(16,9); sc.stroke();
    sc.restore();
  }

  // ---- light shafts through roof holes
  for(var h=0;h<holes.length;h++){
    var hl=holes[h], g=sc.createRadialGradient(hl.x,hl.y,4,hl.x,hl.y,hl.r*1.5);
    g.addColorStop(0,'rgba(255,236,190,.28)'); g.addColorStop(1,'rgba(255,236,190,0)');
    sc.fillStyle=g; sc.beginPath(); sc.arc(hl.x,hl.y,hl.r*1.5,0,6.3); sc.fill();
  }
  // scorch around blasts
  for(var h2=0;h2<holes.length;h2++){
    var b2=holes[h2], g2=sc.createRadialGradient(b2.x,b2.y,b2.r*.2,b2.x,b2.y,b2.r*1.2);
    g2.addColorStop(0,'rgba(20,15,10,.55)'); g2.addColorStop(1,'rgba(20,15,10,0)');
    sc.fillStyle=g2; sc.beginPath(); sc.arc(b2.x,b2.y,b2.r*1.2,0,6.3); sc.fill();
  }
}

function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function outl(c,col,w){ c.strokeStyle=col||'#1e1a14'; c.lineWidth=w||2; c.stroke(); }

/* a toilet in side elevation: tank, seat, bowl, pedestal */
function loo(c,sc,white){
  c.save(); c.scale(sc,sc);
  var shade2='#c6c6bf';
  c.fillStyle=shade2; rrect(c,-9,-27,12,13,2.5); c.fill(); outl(c,'#1e1a14',1.7);   // cistern
  c.fillStyle=white;  rrect(c,-9,-27,12,4,2); c.fill(); outl(c,'#1e1a14',1.3);      // cistern lid
  c.fillStyle='#9aa0a2'; rrect(c,2,-24,3,2,1); c.fill();                            // handle
  c.fillStyle=white;                                                                 // bowl
  c.beginPath(); c.moveTo(-8,-14); c.lineTo(9,-14);
  c.quadraticCurveTo(11,-6,6,-3); c.lineTo(-5,-3); c.quadraticCurveTo(-10,-6,-8,-14);
  c.closePath(); c.fill(); outl(c,'#1e1a14',1.8);
  c.fillStyle=shade2; c.beginPath(); c.ellipse(.5,-14.5,9,3.4,0,0,6.3); c.fill(); outl(c,'#1e1a14',1.5);
  c.fillStyle=white;  c.beginPath(); c.ellipse(.5,-16.5,9.4,3.6,0,0,6.3); c.fill(); outl(c,'#1e1a14',1.5);
  c.fillStyle='#8fa0a6'; c.beginPath(); c.ellipse(.5,-14.4,5.6,1.9,0,0,6.3); c.fill();
  c.fillStyle=shade2; rrect(c,-5,-4,9,4,1.5); c.fill(); outl(c,'#1e1a14',1.6);      // pedestal
  c.restore();
}
function drawProp(c,o){
  var x=o.x*TILE, y=o.y*TILE, w=o.w*TILE, h=o.h*TILE, k=o.kind;
  c.save();
  c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+3,y+5,w-4,h-4,4); c.fill();
  if(k==='medbed'){
    // Floor blood pools — drawn before the frame so they sit under the bed.
    c.fillStyle='rgba(98,16,12,.62)';  c.beginPath(); c.ellipse(x+w*.52,y+h*1.5, w*.3, h*.28,.10,0,6.3); c.fill();
    c.fillStyle='rgba(85,12,8,.48)';   c.beginPath(); c.ellipse(x+w*.38,y+h*1.78,w*.18,h*.18,-.25,0,6.3); c.fill();
    c.fillStyle='rgba(78,10,6,.40)';   c.beginPath(); c.ellipse(x-w*.06,y+h*.75, w*.10,h*.20,.40,0,6.3); c.fill();
    c.fillStyle='rgba(90,14,10,.38)';  c.beginPath(); c.ellipse(x+w*.75,y+h*1.35,w*.14,h*.15,.20,0,6.3); c.fill();
    c.fillStyle='#69736c'; rrect(c,x+2,y+3,w-4,h-6,4); c.fill(); outl(c);
    c.fillStyle='#d9ddd8'; rrect(c,x+5,y+5,w-10,h-10,4); c.fill(); outl(c,'#1e1a14',1.4);
    c.fillStyle='#b9c8b9'; rrect(c,x+w*.34,y+7,w*.58,h-14,3); c.fill();
    // Heavy blood stains spreading across the wounded soldier's sheet.
    c.fillStyle='rgba(140,28,22,.75)'; c.beginPath(); c.ellipse(x+w*.56,y+h*.52,w*.22,h*.20,.18,0,6.3); c.fill();
    c.fillStyle='rgba(125,22,18,.60)'; c.beginPath(); c.ellipse(x+w*.65,y+h*.40,w*.13,h*.15,-.12,0,6.3); c.fill();
    c.fillStyle='rgba(105,18,14,.50)'; c.beginPath(); c.ellipse(x+w*.44,y+h*.62,w*.10,h*.12,.28,0,6.3); c.fill();
    // Splatter dots on the sheet.
    c.fillStyle='rgba(130,25,20,.65)';
    c.beginPath(); c.arc(x+w*.71,y+h*.38,2.2,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.64,y+h*.70,1.8,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.76,y+h*.53,2.6,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.49,y+h*.34,1.4,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.58,y+h*.72,2.0,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.83,y+h*.44,1.6,0,6.3); c.fill();
    // Drip streaks down the near bed edge and drops on the floor.
    c.strokeStyle='rgba(108,18,12,.50)'; c.lineWidth=2.2; c.lineCap='round';
    c.beginPath(); c.moveTo(x+w*.42,y+h*.98); c.bezierCurveTo(x+w*.40,y+h*1.20,x+w*.39,y+h*1.38,x+w*.38,y+h*1.50); c.stroke();
    c.beginPath(); c.moveTo(x+w*.57,y+h*.98); c.bezierCurveTo(x+w*.59,y+h*1.22,x+w*.61,y+h*1.40,x+w*.62,y+h*1.52); c.stroke();
    c.fillStyle='rgba(112,30,26,.56)';
    c.beginPath(); c.ellipse(x+w*.74,y+h+6, 5.0,2.8,0,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.82,y+h+11,2.4,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.66,y+h+15,1.7,0,6.3); c.fill();
    c.beginPath(); c.arc(x+w*.45,y+h+20,2.1,0,6.3); c.fill();
    // Per-bed breathing animation — phase offset from tile position keeps beds out of sync
    var bph=(o.x*6.7+o.y*13.1);
    var br=Math.sin(timeAlive*1.6+bph)*0.9;          // chest rise/fall ~0.25Hz, ±0.9px
    var brS=Math.sin(timeAlive*1.6+bph)*0.4;         // subtle sheet y shift
    var brA=Math.sin(timeAlive*1.6+bph+0.6)*0.6;     // arm follows chest slightly
    var hdS=Math.sin(timeAlive*.55+bph+2.1)*0.7;     // very slow head micro-movement
    // Side-profile head and short neck align with the horizontal body.
    c.fillStyle=SKIN2; rrect(c,x+w*.25,y+h*.44+hdS,7,5,2); c.fill(); outl(c,'#15130e',1);
    c.fillStyle=SKIN; c.beginPath(); c.ellipse(x+w*.2,y+h*.5+hdS,7.5,5.4,0,0,6.3); c.fill(); outl(c,'#15130e',1.3);
    c.beginPath(); c.moveTo(x+w*.27,y+h*.48+hdS); c.lineTo(x+w*.31,y+h*.51+hdS); c.lineTo(x+w*.27,y+h*.54+hdS); c.closePath(); c.fill(); outl(c,'#15130e',.8);
    c.fillStyle='#59634f'; rrect(c,x+w*.29,y+h*.35+brS,w*.52,h*.3,3); c.fill(); outl(c,'#15130e',1.2);
    c.save(); rrect(c,x+w*.29,y+h*.35+brS,w*.52,h*.3,3); c.clip();
    camoFleck(c,o.x*37+o.y*11,x+w*.29,y+h*.35+brS,w*.52,h*.3,8,MC); c.restore();
    // Two uniformed arms resting across the soldier and sheet.
    c.strokeStyle='#59634f'; c.lineWidth=5; c.lineCap='round'; c.lineJoin='round';
    c.beginPath(); c.moveTo(x+w*.36,y+h*.4+brA); c.lineTo(x+w*.48,y+h*.3+br); c.lineTo(x+w*.59,y+h*.39+brA); c.stroke();
    c.beginPath(); c.moveTo(x+w*.36,y+h*.59+brA); c.lineTo(x+w*.49,y+h*.68+br); c.lineTo(x+w*.61,y+h*.57+brA); c.stroke();
    c.fillStyle=SKIN2; c.beginPath(); c.arc(x+w*.59,y+h*.39+brA,2.4,0,6.3); c.fill(); outl(c,'#15130e',1);
    c.beginPath(); c.arc(x+w*.61,y+h*.57+brA,2.4,0,6.3); c.fill(); outl(c,'#15130e',1);
    c.fillStyle='#343a31'; rrect(c,x+w*.77,y+h*.34,w*.12,h*.32,2); c.fill(); // boots
    // Plain arm dressing—kept away from the face.
    c.fillStyle='#e7ebe6'; rrect(c,x+w*.38,y+h*.34+brS,w*.12,h*.3,2); c.fill(); outl(c,'#7e8881',.8);
    c.fillStyle='#526048'; c.beginPath(); c.ellipse(x+w*.19,y+h*.43+hdS,7.3,4.4,0,Math.PI,Math.PI*2); c.fill(); outl(c,'#15130e',1.1);
    c.fillStyle='#2f6fd0'; rrect(c,x+w*.48,y+h*.33+brS,5,h*.34,1); c.fill(); outl(c,'#15130e',.8);
    // Forehead wrap leaves the side-profile face unobstructed.
    c.fillStyle='#e9ece7'; rrect(c,x+w*.16,y+h*.36+hdS,w*.11,3.5,1.5); c.fill(); outl(c,'#7e8881',.7);
    c.strokeStyle='#282d28'; c.lineWidth=1;
    c.beginPath(); c.moveTo(x+w*.22,y+h*.49+hdS); c.lineTo(x+w*.26,y+h*.49+hdS); c.stroke();
    c.strokeStyle='#d9ddd8'; c.lineWidth=3;
    c.beginPath(); c.moveTo(x+w*.38,y+h*.43+brA); c.lineTo(x+w*.52,y+h*.57+br); c.lineTo(x+w*.61,y+h*.43+brA); c.stroke();
  } else if(k==='bed'){
    c.fillStyle='#6b5340'; rrect(c,x+2,y+2,w-4,h-4,4); c.fill(); outl(c);
    c.fillStyle='#c8bfae'; rrect(c,x+5,y+5,w-10,h*.42,4); c.fill(); outl(c,'#1e1a14',1.5);
    c.fillStyle='#8a5f52'; rrect(c,x+5,y+h*.48,w-10,h*.45,4); c.fill(); outl(c,'#1e1a14',1.5);
    c.fillStyle='rgba(80,20,12,.5)'; c.beginPath(); c.ellipse(x+w*.5,y+h*.6,w*.22,h*.14,0,0,6.3); c.fill();
  } else if(k==='sofa'){
    c.fillStyle='#4d5a4a'; rrect(c,x+2,y+2,w-4,h-4,6); c.fill(); outl(c);
    c.fillStyle='#5f6f5a'; rrect(c,x+7,y+7,w-14,h-14,4); c.fill(); outl(c,'#1e1a14',1.5);
  } else if(k==='table'||k==='bench'||k==='counter'||k==='dresser'||k==='shelf'){
    var col=k==='counter'?'#8b8578':(k==='shelf'?'#6a5238':'#7d6244');
    c.fillStyle=col; rrect(c,x+2,y+2,w-4,h-4,3); c.fill(); outl(c);
    c.strokeStyle='rgba(30,22,14,.5)'; c.lineWidth=1;
    for(var i=1;i<o.w;i++){ c.beginPath(); c.moveTo(x+i*TILE,y+3); c.lineTo(x+i*TILE,y+h-3); c.stroke(); }
    if(k==='shelf'){ for(var s=0;s<5;s++){ c.fillStyle=shade('#c2ab7a',rr(.6,1.1)); c.fillRect(x+5+s*(w-10)/5,y+5,(w-14)/5,h-10); } }
  } else if(k==='stove'){
    c.fillStyle='#8f9298'; rrect(c,x+2,y+2,w-4,h-4,3); c.fill(); outl(c);
    for(var b=0;b<4;b++){ c.fillStyle='#2b2b2b'; c.beginPath(); c.arc(x+12+ (b%2)*24, y+11+Math.floor(b/2)*13, 7,0,6.3); c.fill(); }
  } else if(k==='fridge'){
    c.fillStyle='#c3c6c2'; rrect(c,x+2,y+2,w-4,h-4,4); c.fill(); outl(c);
    c.fillStyle='#8d9089'; c.fillRect(x+w-13,y+9,5,h-20);
    c.strokeStyle='rgba(30,30,30,.5)'; c.beginPath(); c.moveTo(x+4,y+h*.5); c.lineTo(x+w-4,y+h*.5); c.stroke();
  } else if(k==='tv'){
    c.fillStyle='#1c1c1e'; rrect(c,x+3,y+6,w-6,h-10,2); c.fill(); outl(c);
    c.fillStyle='#3a4a52'; c.fillRect(x+7,y+9,w-14,h-16);
    c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(x+7,y+9,(w-14)*.4,h-16);
  } else if(k==='tub'){
    c.fillStyle='#dcdcd6'; rrect(c,x+2,y+2,w-4,h-4,10); c.fill(); outl(c);
    c.fillStyle='#a9bcc4'; rrect(c,x+7,y+7,w-14,h-14,8); c.fill();
  } else if(k==='looStack'){
    var sx0=x+w/2, sy0=y+h-3;
    c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(sx0,sy0+1,13,5,0,0,6.3); c.fill();
    for(var ls=2;ls>=0;ls--){
      c.save(); c.translate(sx0+(ls-1)*2.5,sy0-ls*11); c.rotate((ls===1?.12:-.07));
      loo(c,.82,ls===1?'#d8d8d1':'#ecece6'); c.restore();
    }
  } else if(k==='toilet'){
    var tx0=x+w/2, ty0=y+h-3, tip=(rnd()<.42);
    c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(tx0,ty0+1,tip?13:9,5,0,0,6.3); c.fill();
    c.save(); c.translate(tx0,ty0);
    if(tip){ c.rotate(rr(1.2,1.9)); c.translate(0,-4); }
    else c.rotate(rr(-.16,.16));
    loo(c,1,'#eeeee8'); c.restore();
  } else if(k==='sink'){
    c.fillStyle='#e2e2dc'; rrect(c,x+4,y+4,w-8,h-8,7); c.fill(); outl(c);
    c.fillStyle='#b6bfc2'; c.beginPath(); c.ellipse(x+w/2,y+h/2,w*.22,h*.22,0,0,6.3); c.fill();
  } else if(k==='car'){
    c.fillStyle='#4a3f3a'; rrect(c,x+3,y+3,w-6,h-6,10); c.fill(); outl(c,'#15120e',2.5);
    c.fillStyle='#2c2622'; rrect(c,x+7,y+h*.18,w-14,h*.24,5); c.fill();
    c.fillStyle='#3a3330'; rrect(c,x+7,y+h*.52,w-14,h*.3,5); c.fill();
    c.fillStyle='rgba(0,0,0,.55)'; c.fillRect(x+1,y+h*.2,5,14); c.fillRect(x+w-6,y+h*.2,5,14);
    c.fillRect(x+1,y+h*.7,5,14); c.fillRect(x+w-6,y+h*.7,5,14);
    c.fillStyle='rgba(150,60,30,.35)'; c.beginPath(); c.arc(x+w*.5,y+h*.35,w*.3,0,6.3); c.fill();
  } else if(k==='barrel'||k==='crateP'){
    for(var bx2=0;bx2<o.w;bx2++){
      var cx2=x+bx2*TILE+TILE/2, cy2=y+h/2;
      if(k==='barrel'){ c.fillStyle='#6d7a45'; c.beginPath(); c.arc(cx2,cy2,TILE*.42,0,6.3); c.fill(); outl(c);
        c.strokeStyle='rgba(20,24,12,.6)'; c.beginPath(); c.arc(cx2,cy2,TILE*.26,0,6.3); c.stroke(); }
      else { c.fillStyle='#8a6b3f'; rrect(c,cx2-TILE*.42,cy2-TILE*.42,TILE*.84,TILE*.84,3); c.fill(); outl(c);
        c.strokeStyle='rgba(40,28,14,.6)'; c.beginPath(); c.moveTo(cx2-TILE*.4,cy2-TILE*.4); c.lineTo(cx2+TILE*.4,cy2+TILE*.4); c.moveTo(cx2+TILE*.4,cy2-TILE*.4); c.lineTo(cx2-TILE*.4,cy2+TILE*.4); c.stroke(); }
    }
  } else if(k==='wreck'||k==='truck'||k==='burnt'){
    var vert=(h>w), L=vert?h:w, Wd=vert?w:h;
    c.save(); c.translate(x+w/2,y+h/2);
    if(vert) c.rotate(Math.PI/2);
    c.rotate(rr(-.09,.09));
    var hl=L/2-3, hw=Wd/2-3;
    c.fillStyle='rgba(0,0,0,.4)'; rrect(c,-hl+3,-hw+4,L-6,Wd-6,7); c.fill();
    // burnt shell
    c.fillStyle=k==='burnt'?'#24211c':'#3a332c';
    rrect(c,-hl,-hw,L-6,Wd-6,k==='truck'?4:9); c.fill(); outl(c,'#121009',2.4);
    // rust and heat bloom
    for(var rz=0;rz<7;rz++){ c.fillStyle='rgba('+ri(90,150)+','+ri(50,80)+',30,'+rr(.1,.3)+')';
      c.beginPath(); c.ellipse(rr(-hl,hl-6),rr(-hw,hw-6),rr(3,9),rr(2,6),rr(0,3),0,6.3); c.fill(); }
    if(k==='truck'){
      c.fillStyle='#2c2721'; rrect(c,-hl+2,-hw+2,L*.34,Wd-10,3); c.fill(); outl(c,'#121009',1.8);  // cab
      c.fillStyle='#171512'; rrect(c,-hl+L*.4,-hw+3,L*.5,Wd-12,2); c.fill();                       // bed
      c.strokeStyle='rgba(20,18,14,.7)'; c.lineWidth=1.5;
      for(var rb=0;rb<4;rb++){ c.beginPath(); c.moveTo(-hl+L*.42+rb*L*.11,-hw+3);
        c.lineTo(-hl+L*.42+rb*L*.11,hw-9); c.stroke(); }
    } else {
      c.fillStyle='#191713'; rrect(c,-hl+L*.22,-hw+4,L*.42,Wd-14,3); c.fill();                     // gutted cabin
      c.fillStyle='rgba(120,140,150,.18)'; rrect(c,-hl+L*.24,-hw+5,L*.16,Wd-16,2); c.fill();
      c.save(); c.translate(-hl+L*.2,hw-6); c.rotate(-.9);                                          // door hanging open
      c.fillStyle='#332c25'; rrect(c,0,0,L*.24,4.5,2); c.fill(); outl(c,'#121009',1.8); c.restore();
    }
    // wheels, one or two missing
    var wh=[[-hl+7,-hw+1],[-hl+7,hw-7],[hl-13,-hw+1],[hl-13,hw-7]];
    for(var wq=0;wq<4;wq++){
      if(k!=='truck'&&wq===3) { c.fillStyle='#242019';
        c.beginPath(); c.ellipse(wh[wq][0]+rr(8,16),wh[wq][1]+rr(4,10),5,3.4,rr(0,3),0,6.3); c.fill(); continue; }
      c.fillStyle='#1c1a16'; rrect(c,wh[wq][0],wh[wq][1],9,6,2.5); c.fill(); outl(c,'#0d0c08',1.5);
    }
    if(k==='burnt'){ c.fillStyle='rgba(10,9,7,.55)'; rrect(c,-hl,-hw,L-6,Wd-6,8); c.fill(); }
    c.restore();
  } else if(k==='shoptable'){
    var tx8=x, ty8=y, tw8=w, th8=h;
    c.fillStyle='rgba(0,0,0,.4)'; rrect(c,tx8+4,ty8+7,tw8-4,th8-4,3); c.fill();
    c.fillStyle='#6b5230'; rrect(c,tx8+1,ty8+2,tw8-2,th8-6,3); c.fill(); outl(c,'#241a0e',2.2);
    c.fillStyle='#7d6238'; rrect(c,tx8+3,ty8+3,tw8-6,th8-10,2); c.fill();
    c.strokeStyle='rgba(40,28,14,.5)'; c.lineWidth=1.2;
    for(var pk8=1;pk8<o.w*2;pk8++){ c.beginPath();
      c.moveTo(tx8+pk8*(tw8/(o.w*2)),ty8+3); c.lineTo(tx8+pk8*(tw8/(o.w*2)),ty8+th8-8); c.stroke(); }
    c.fillStyle='#4a3720'; c.fillRect(tx8+2,ty8+th8-8,tw8-4,5);           // table edge
    // stock laid out on top
    var slots=Math.max(3,o.w*2);
    for(var it8=0;it8<slots;it8++){
      var ix8=tx8+8+it8*((tw8-16)/Math.max(1,slots-1)), iy8=ty8+th8*.42;
      c.save(); c.translate(ix8,iy8); c.rotate(hs(it8*7.7+x)*.5-.25);
      var kind8=it8%5;
      if(kind8===0){                                        // ammo box
        c.fillStyle='#4d5a30'; rrect(c,-8,-5,16,10,1.6); c.fill(); outl(c,'#1e1a14',1.5);
        c.fillStyle='#8a8f7a'; rrect(c,-4,-7,8,2.4,1); c.fill();
        c.fillStyle='rgba(226,177,60,.8)'; c.fillRect(-6,1,12,1.6);
      } else if(kind8===1){                                 // stacked grenades
        c.fillStyle='#4d5a30';
        c.beginPath(); c.ellipse(-3,0,3.4,4.4,0,0,6.3); c.fill(); outl(c,'#15130e',1.3);
        c.beginPath(); c.ellipse(3,1,3.4,4.4,0,0,6.3); c.fill(); outl(c,'#15130e',1.3);
        c.fillStyle='#8a8f7a'; c.fillRect(-4.4,-6,2.6,2); c.fillRect(1.8,-5,2.6,2);
      } else if(kind8===2){                                 // medical kit
        c.fillStyle='#e6e6e0'; rrect(c,-7,-5,14,10,2); c.fill(); outl(c,'#2a1010',1.6);
        c.fillStyle='#c0362f'; c.fillRect(-1.6,-3.4,3.2,6.8); c.fillRect(-5,-1.6,10,3.2);
      } else if(kind8===3){                                 // armour plate
        c.fillStyle='#5d6b74';
        c.beginPath(); c.moveTo(0,-6); c.lineTo(6,-3); c.lineTo(5,4); c.lineTo(0,7);
        c.lineTo(-5,4); c.lineTo(-6,-3); c.closePath(); c.fill(); outl(c,'#101c22',1.6);
        c.fillStyle='rgba(255,255,255,.22)'; c.beginPath();
        c.moveTo(0,-4); c.lineTo(4,-2); c.lineTo(0,2); c.closePath(); c.fill();
      } else {                                              // a drone on the counter
        c.strokeStyle='#2f363c'; c.lineWidth=2;
        c.beginPath(); c.moveTo(-6,-6); c.lineTo(6,6); c.moveTo(6,-6); c.lineTo(-6,6); c.stroke();
        c.strokeStyle='rgba(150,180,200,.55)'; c.lineWidth=1.3;
        [[-6,-6],[6,-6],[-6,6],[6,6]].forEach(function(q8){ c.beginPath(); c.arc(q8[0],q8[1],3.4,0,6.3); c.stroke(); });
        c.fillStyle='#5b6570'; rrect(c,-3.4,-3,6.8,6,2); c.fill(); outl(c,'#12161a',1.4);
        c.fillStyle='#c0392b'; rrect(c,-2,-5.4,4,2.2,.8); c.fill();
      }
      c.restore();
    }
    c.fillStyle='rgba(226,177,60,.9)'; c.font='bold 7px Arial'; c.textAlign='center';
    c.fillText('QUARTERMASTER',tx8+tw8/2,ty8+7); c.textAlign='start';
  } else if(k==='smashtable'){
    var cxq=x+w/2, cyq=y+h/2, sd=(x*7+y*13);
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+4,y+7,w-6,h-9,3); c.fill();
    c.save(); c.translate(cxq,cyq); c.rotate(hs(sd)*.7-.35);
    c.fillStyle='#6b5230'; rrect(c,-w*.42,-h*.3,w*.84,h*.5,2); c.fill(); outl(c,'#241a0e',2);
    c.strokeStyle='rgba(30,20,10,.6)'; c.lineWidth=1.6;                    // split across the top
    c.beginPath(); c.moveTo(-w*.4,-h*.05); c.lineTo(w*.1,h*.06); c.lineTo(w*.42,-h*.1); c.stroke();
    c.fillStyle='#4a3720';
    c.save(); c.rotate(.9); rrect(c,-3,0,6,h*.42,1.5); c.fill(); c.restore();  // legs, snapped off
    c.save(); c.rotate(-1.2); rrect(c,w*.2,2,5,h*.34,1.5); c.fill(); c.restore();
    c.restore();
    for(var sp2=0;sp2<5;sp2++){
      c.fillStyle='rgba(90,70,42,'+rr(.4,.8)+')';
      c.save(); c.translate(x+rr(2,w-2),y+rr(4,h-2)); c.rotate(hs(sd+sp2)*3);
      c.fillRect(-rr(3,8),-1.4,rr(6,16),2.8); c.restore();
    }
  } else if(k==='brokenchair'){
    var bx9=x+w/2, by9=y+h/2;
    c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(bx9+2,by9+5,10,5,0,0,6.3); c.fill();
    c.save(); c.translate(bx9,by9); c.rotate(hs(x+y)*2.4-1.2);
    c.fillStyle='#7a5f3e'; rrect(c,-9,-6,18,11,2); c.fill(); outl(c,'#241a0e',1.8);   // seat, on its side
    c.fillStyle='#6b5230';
    c.save(); c.rotate(1.3); rrect(c,-2,-14,4,15,1.4); c.fill(); c.restore();
    c.save(); c.rotate(1.1); rrect(c,6,-12,4,13,1.4); c.fill(); c.restore();
    c.strokeStyle='#5a4526'; c.lineWidth=2.6; c.lineCap='round';
    c.beginPath(); c.moveTo(-8,-6); c.lineTo(-13,-16); c.stroke();                    // broken back
    c.restore();
  } else if(k==='cabinet'){
    c.fillStyle='rgba(0,0,0,.4)'; rrect(c,x+5,y+8,w-6,h-10,3); c.fill();
    c.save(); c.translate(x+w/2,y+h/2); c.rotate(hs(x*3+y)*.5+.35);
    c.fillStyle='#5f4a2c'; rrect(c,-w*.4,-h*.42,w*.8,h*.84,3); c.fill(); outl(c,'#241a0e',2.2);
    c.fillStyle='#3a2c17'; rrect(c,-w*.32,-h*.34,w*.3,h*.66,2); c.fill();              // door hanging open
    c.save(); c.translate(w*.06,-h*.3); c.rotate(-.8);
    c.fillStyle='#6b5230'; rrect(c,0,0,w*.3,h*.6,2); c.fill(); outl(c,'#241a0e',1.6); c.restore();
    c.fillStyle='#8a8f7a'; c.beginPath(); c.arc(-w*.2,0,2,0,6.3); c.fill();
    c.restore();
    for(var dz2=0;dz2<4;dz2++){
      c.fillStyle='rgba(210,200,180,'+rr(.25,.5)+')';
      c.save(); c.translate(x+rr(3,w-3),y+rr(6,h-3)); c.rotate(hs(dz2+x)*3);
      c.fillRect(-4,-3,8,6); c.restore();
    }
  } else if(k==='rubblepile'){
    c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x+w/2+2,y+h/2+5,w*.46,h*.34,0,0,6.3); c.fill();
    for(var rp9=0;rp9<11;rp9++){
      var ang9=hs(rp9+x)*6.283, dd9=hs(rp9*3+y)*w*.34;
      c.fillStyle=shade('#a49a88',.7+hs(rp9*7)*.6);
      c.save(); c.translate(x+w/2+Math.cos(ang9)*dd9,y+h/2+Math.sin(ang9)*dd9*.7);
      c.rotate(hs(rp9*5)*3);
      rrect(c,-rr(3,7),-rr(2,5),rr(7,14),rr(5,9),1.5); c.fill(); outl(c,'#3a352c',1.2);
      c.restore();
    }
    for(var rb9=0;rb9<3;rb9++){
      c.strokeStyle='rgba(120,110,96,.7)'; c.lineWidth=2;
      c.beginPath(); c.moveTo(x+rr(4,w-4),y+rr(4,h-4));
      c.lineTo(x+rr(4,w-4),y+rr(4,h-4)); c.stroke();
    }
  } else if(k==='brokentv'){
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+5,y+8,w-8,h-10,2); c.fill();
    c.save(); c.translate(x+w/2,y+h/2); c.rotate(hs(x+y*3)*.8-.4);
    c.fillStyle='#3a3a36'; rrect(c,-13,-10,26,20,2); c.fill(); outl(c,'#15150f',2);
    c.fillStyle='#16181a'; rrect(c,-10,-7,20,14,1.6); c.fill();
    c.strokeStyle='rgba(190,205,215,.5)'; c.lineWidth=1.2;                    // shattered screen
    for(var cr9=0;cr9<5;cr9++){
      c.beginPath(); c.moveTo(0,0);
      c.lineTo(-10+hs(cr9*3)*20,-7+hs(cr9*7)*14); c.stroke();
    }
    c.fillStyle='rgba(190,205,215,.25)';
    c.beginPath(); c.moveTo(-3,-2); c.lineTo(4,-5); c.lineTo(2,3); c.closePath(); c.fill();
    c.restore();
  } else if(k==='mattress'){
    c.fillStyle='rgba(0,0,0,.3)'; rrect(c,x+4,y+6,w-6,h-8,4); c.fill();
    c.save(); c.translate(x+w/2,y+h/2); c.rotate(hs(x*5+y)*.6-.3);
    c.fillStyle='#b9ac92'; rrect(c,-w*.42,-h*.34,w*.84,h*.68,5); c.fill(); outl(c,'#4a4133',1.8);
    c.strokeStyle='rgba(120,108,86,.6)'; c.lineWidth=1.2;
    for(var q9=0;q9<3;q9++){ c.beginPath();
      c.moveTo(-w*.36+q9*w*.28,-h*.3); c.lineTo(-w*.36+q9*w*.28,h*.3); c.stroke(); }
    c.fillStyle='rgba(60,52,40,.5)';                                            // scorched patch
    c.beginPath(); c.ellipse(w*.14,h*.06,w*.16,h*.14,0,0,6.3); c.fill();
    c.restore();
  } else if(k==='tree'){
    var tx0=x+w/2, ty0=y+h/2, sd0=(x*13+y*7);
    c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(tx0+2,ty0+6,11,6,0,0,6.3); c.fill();
    c.fillStyle=shade('#4a3a22',.9); rrect(c,tx0-2.5,ty0-2,5,10,2); c.fill();
    var tc=['#2f4a26','#3a5a2c','#27401f','#456a34'][Math.floor(hs(sd0)*4)];
    for(var lf=0;lf<4;lf++){
      c.fillStyle=shade(tc,.8+hs(sd0+lf)*.5);
      c.beginPath(); c.ellipse(tx0+hs(sd0+lf*3)*10-5,ty0-6+hs(sd0+lf*5)*8-4,
        7+hs(sd0+lf*7)*4,6+hs(sd0+lf*2)*3,hs(sd0+lf)*3,0,6.3); c.fill();
    }
    c.fillStyle='rgba(255,255,255,.07)';
    c.beginPath(); c.ellipse(tx0-4,ty0-10,5,4,0,0,6.3); c.fill();
  } else if(k==='oiltank'){
    var ox0=x+w/2, oy0=y+h/2, rr0=Math.min(w,h)*.44;
    c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(ox0+3,oy0+5,rr0,rr0*.8,0,0,6.3); c.fill();
    c.fillStyle='#8d9298'; c.beginPath(); c.arc(ox0,oy0,rr0,0,6.3); c.fill(); outl(c,'#1c2126',2.4);
    c.fillStyle='#a7adb3'; c.beginPath(); c.arc(ox0,oy0-2,rr0*.82,0,6.3); c.fill();
    c.strokeStyle='rgba(40,46,52,.55)'; c.lineWidth=1.4;
    for(var rg2=1;rg2<3;rg2++){ c.beginPath(); c.arc(ox0,oy0-2,rr0*.82*rg2/3,0,6.3); c.stroke(); }
    c.strokeStyle='rgba(40,46,52,.4)';
    for(var sp0=0;sp0<6;sp0++){ var a0=sp0/6*6.283;
      c.beginPath(); c.moveTo(ox0,oy0-2); c.lineTo(ox0+Math.cos(a0)*rr0*.82,oy0-2+Math.sin(a0)*rr0*.82); c.stroke(); }
    c.fillStyle='#5d6469'; rrect(c,ox0-3,oy0-rr0-3,6,5,1.5); c.fill();
    c.fillStyle='rgba(226,177,60,.8)'; c.fillRect(ox0-rr0*.7,oy0+rr0*.55,rr0*1.4,2.4);
  } else if(k==='stack'){
    var sx0=x+w/2, sy0=y+h;
    c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(sx0+3,sy0-2,10,5,0,0,6.3); c.fill();
    c.fillStyle='#7a7f85'; rrect(c,sx0-6,sy0-h*TILE*0-46,12,46,2); c.fill(); outl(c,'#1c2126',2);
    c.fillStyle='#c0392b'; c.fillRect(sx0-6,sy0-38,12,5); c.fillRect(sx0-6,sy0-20,12,5);
    c.fillStyle='#5d6469'; rrect(c,sx0-9,sy0-6,18,7,2); c.fill(); outl(c,'#1c2126',1.6);
    c.fillStyle='rgba(255,170,60,.85)';                                  // flare
    c.beginPath(); c.moveTo(sx0-4,sy0-46); c.quadraticCurveTo(sx0,sy0-60,sx0+4,sy0-46);
    c.quadraticCurveTo(sx0,sy0-50,sx0-4,sy0-46); c.fill();
  } else if(k==='pipes'){
    c.fillStyle='rgba(0,0,0,.32)'; rrect(c,x+4,y+6,w-4,h-8,3); c.fill();
    c.fillStyle='#6f757b';
    for(var pp=0;pp<3;pp++) rrect(c,x+3,y+5+pp*8,w-6,5,2.5), c.fill();
    outl(c,'#1c2126',1.6);
    c.fillStyle='#4c5257'; rrect(c,x+w*.4,y+3,5,h-6,2); c.fill();
  } else if(k==='console'){
    var cx4=x+w/2, cy4=y+h/2;
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+4,y+6,w-6,h-8,3); c.fill();
    c.fillStyle='#3a4048'; rrect(c,x+2,y+3,w-4,h-6,3); c.fill(); outl(c,'#12161a',2);
    c.fillStyle='#22262c'; rrect(c,x+5,y+6,w-10,h-12,2); c.fill();
    for(var sc4=0;sc4<Math.max(1,o.w);sc4++){                    // monitors along the bench
      var mx4=x+8+sc4*TILE, my4=y+2;
      c.fillStyle='#161a1f'; rrect(c,mx4,my4-8,20,14,2); c.fill(); outl(c,'#0c0f12',1.6);
      c.fillStyle=(sc4%3===0)?'#1d5f52':((sc4%3===1)?'#1b4a66':'#4a3a1b');
      c.fillRect(mx4+2,my4-6,16,10);
      c.fillStyle='rgba(150,240,220,.55)';
      for(var ln4=0;ln4<4;ln4++) c.fillRect(mx4+3,my4-5+ln4*2.2,rr(4,14),1);
      c.fillStyle='rgba(120,220,255,.35)'; c.fillRect(mx4+2,my4-6,16,2);
      c.fillStyle='#2b3138'; c.fillRect(mx4+8,my4+6,4,3);
    }
    c.fillStyle='#4a525c';                                        // keyboards
    for(var kb=0;kb<Math.max(1,o.w);kb++) rrect(c,x+9+kb*TILE,y+h-11,18,7,2), c.fill();
    c.fillStyle='#7fe8ff';
    for(var lt=0;lt<3;lt++){ c.beginPath(); c.arc(x+6,y+8+lt*5,1.3,0,6.3); c.fill(); }
  } else if(k==='dronerack'){
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+4,y+6,w-6,h-8,3); c.fill();
    c.fillStyle='#3d4349'; rrect(c,x+2,y+2,w-4,h-4,3); c.fill(); outl(c,'#12161a',2);
    c.strokeStyle='rgba(20,24,28,.6)'; c.lineWidth=1.4;
    for(var sh4=1;sh4<o.h;sh4++){ c.beginPath(); c.moveTo(x+3,y+sh4*TILE); c.lineTo(x+w-3,y+sh4*TILE); c.stroke(); }
    for(var rq3=0;rq3<o.w*o.h*2;rq3++){                           // quadcopters stacked on the shelves
      var qx=x+10+ (rq3%(o.w*2))*(w-20)/Math.max(1,o.w*2-1), qy=y+12+Math.floor(rq3/(o.w*2))*((h-18)/Math.max(1,o.h));
      c.save(); c.translate(qx,qy); c.rotate(rr(-.25,.25)); c.scale(.5,.5);
      c.strokeStyle='#2f363c'; c.lineWidth=3;
      c.beginPath(); c.moveTo(-9,-9); c.lineTo(9,9); c.moveTo(9,-9); c.lineTo(-9,9); c.stroke();
      c.strokeStyle='rgba(150,180,200,.5)'; c.lineWidth=1.6;
      [[-9,-9],[9,-9],[-9,9],[9,9]].forEach(function(o5){ c.beginPath(); c.arc(o5[0],o5[1],5,0,6.3); c.stroke(); });
      c.fillStyle='#5b6570'; rrect(c,-5,-4.5,10,9,2.5); c.fill(); outl(c,'#12161a',1.6);
      c.fillStyle='#c0392b'; rrect(c,-3,-7.5,6,3,1); c.fill();
      c.restore();
    }
  } else if(k==='usvrack'){
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+5,y+7,w-8,h-10,4); c.fill();
    c.fillStyle='#333940'; rrect(c,x+2,y+3,w-4,h-6,3); c.fill(); outl(c,'#12161a',2);
    for(var uq=0;uq<Math.max(1,o.h);uq++){                        // hulls on their cradles
      var uy=y+10+uq*((h-14)/Math.max(1,o.h));
      c.save(); c.translate(x+w/2,uy); c.rotate(rr(-.05,.05)); c.scale(.62,.62);
      c.fillStyle='#4a5560';
      c.beginPath();
      c.moveTo(24,0); c.quadraticCurveTo(14,-6,-5,-7); c.lineTo(-22,-6);
      c.quadraticCurveTo(-25,0,-22,6); c.lineTo(-5,7);
      c.quadraticCurveTo(14,6,24,0); c.closePath(); c.fill(); outl(c,'#0d161d',2.2);
      c.fillStyle='#39434d'; rrect(c,-16,-3.4,30,6.8,2); c.fill();
      c.fillStyle='#2a3138'; c.beginPath(); c.moveTo(24,0); c.lineTo(12,-4); c.lineTo(12,4); c.closePath(); c.fill();
      c.fillStyle='#c0392b'; rrect(c,13,-1.4,4,2.8,1); c.fill();
      c.fillStyle='#8fa2ae'; c.beginPath(); c.arc(2,0,2.6,0,6.3); c.fill();
      c.restore();
      c.fillStyle='#5a4a2c'; c.fillRect(x+6,uy+7,w-12,3);          // cradle
    }
  } else if(k==='ammocrate'){
    c.fillStyle='rgba(0,0,0,.35)'; rrect(c,x+4,y+6,w-6,h-8,3); c.fill();
    for(var ac=0;ac<Math.max(1,o.w*o.h);ac++){
      var ax4=x+3+(ac%Math.max(1,o.w))*TILE, ay4=y+3+Math.floor(ac/Math.max(1,o.w))*TILE;
      c.save(); c.translate(ax4+TILE/2-3,ay4+TILE/2-3); c.rotate(rr(-.08,.08));
      c.fillStyle=(ac%3===0)?'#4d5a30':'#6b5a33';
      rrect(c,-14,-10,28,20,2); c.fill(); outl(c,'#1e1a14',2);
      c.fillStyle='rgba(255,255,255,.09)'; c.fillRect(-14,-10,28,5);
      c.fillStyle='#8a8f7a'; rrect(c,-7,-12,14,4,1.4); c.fill();   // handle
      c.fillStyle='rgba(226,177,60,.75)'; c.fillRect(-11,2,22,2.4);
      c.fillStyle='rgba(20,18,14,.6)'; c.font='bold 6px Arial'; c.textAlign='center';
      c.fillText(ac%2?'7.62':'5.45',0,0); c.textAlign='start';
      c.restore();
    }
  } else if(k==='hedgehog'){
    var hx3=x+w/2, hy3=y+h/2;
    c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(hx3,hy3+7,15,6,0,0,6.3); c.fill();
    c.strokeStyle='#6d6f72'; c.lineWidth=5; c.lineCap='round';
    c.beginPath(); c.moveTo(hx3-13,hy3+8); c.lineTo(hx3+12,hy3-11); c.stroke();
    c.beginPath(); c.moveTo(hx3+13,hy3+8); c.lineTo(hx3-12,hy3-11); c.stroke();
    c.beginPath(); c.moveTo(hx3,hy3+9);   c.lineTo(hx3,hy3-14); c.stroke();
    c.strokeStyle='#3f4245'; c.lineWidth=1.6;
    c.beginPath(); c.moveTo(hx3-13,hy3+8); c.lineTo(hx3+12,hy3-11);
    c.moveTo(hx3+13,hy3+8); c.lineTo(hx3-12,hy3-11);
    c.moveTo(hx3,hy3+9); c.lineTo(hx3,hy3-14); c.stroke();
    c.fillStyle='#8a8d90'; c.beginPath(); c.arc(hx3,hy3-2,3.4,0,6.3); c.fill(); outl(c,'#2b2e30',1.4);
  } else if(k==='block'){
    c.fillStyle='rgba(0,0,0,.34)'; rrect(c,x+4,y+7,w-4,h-6,3); c.fill();
    c.fillStyle='#9d9a92';
    c.beginPath(); c.moveTo(x+3,y+h-3); c.lineTo(x+7,y+4); c.lineTo(x+w-7,y+4); c.lineTo(x+w-3,y+h-3);
    c.closePath(); c.fill(); outl(c,'#2e2c26',2);
    c.fillStyle='#b6b3aa'; rrect(c,x+7,y+3,w-14,5,1.5); c.fill();
    c.fillStyle='rgba(226,177,60,.75)'; c.fillRect(x+6,y+h-11,w-12,3);
    c.fillStyle='rgba(40,38,32,.5)'; c.fillRect(x+9,y+h-11,3,3); c.fillRect(x+w-14,y+h-11,3,3);
  } else if(k==='night'||k==='chair'){
    c.fillStyle='#6f5637'; rrect(c,x+5,y+5,w-10,h-10,3); c.fill(); outl(c);
  } else if(k==='container'){
    // Military ISO shipping container — overhead view
    c.fillStyle='rgba(0,0,0,.40)'; rrect(c,x+5,y+7,w-6,h-5,3); c.fill();
    c.fillStyle='#4e5c3a'; rrect(c,x+2,y+2,w-4,h-4,3); c.fill(); outl(c,'#1c1f14',2);
    // Corrugated roof ribs
    var cnR=Math.max(4,Math.floor(o.w*5)), cnRW=(w-8)/cnR;
    for(var cnI=0;cnI<cnR;cnI++){
      c.fillStyle=cnI%2===0?'rgba(0,0,0,.20)':'rgba(255,255,255,.07)';
      c.fillRect(x+4+cnI*cnRW,y+3,cnRW,h-6);
    }
    // End caps (left = door, right = closed)
    c.fillStyle='#3a4628'; c.fillRect(x+2,y+2,5,h-4); c.fillRect(x+w-7,y+2,5,h-4);
    // Door hinges on left end
    c.fillStyle='#7a8070'; c.fillRect(x+2,y+Math.round(h*.28),4,3); c.fillRect(x+2,y+Math.round(h*.65),4,3);
    // Corner castings — structural ISO fittings
    c.fillStyle='#9aa08e';
    c.fillRect(x+2,y+2,5,5); c.fillRect(x+w-7,y+2,5,5);
    c.fillRect(x+2,y+h-7,5,5); c.fillRect(x+w-7,y+h-7,5,5);
    outl(c,'#1c1f14',1.4);
  }
  c.restore();
}

/* =========================================================================
   WEAPONS + CARDS
   ========================================================================= */
var WEAPONS={
  pistol :{name:'M9 PISTOL',   dmg:26, rof:.30, mag:12, res:72,  spread:.05, spd:660, auto:false,pel:1,kick:2.4,snd:'p'},
  smg    :{name:'VECTOR-9',    dmg:15, rof:.075,mag:32, res:190, spread:.13, spd:640, auto:true, pel:1,kick:1.4,snd:'s'},
  rifle  :{name:'AK-74',       dmg:32, rof:.13, mag:30, res:180, spread:.07, spd:760, auto:true, pel:1,kick:2.2,snd:'r'},
  shotgun:{name:'BREACHER 12', dmg:14, rof:.72, mag:6,  res:42,  spread:.26, spd:560, auto:false,pel:8,kick:6,  snd:'g'},
  dmr    :{name:'MARKSMAN',    dmg:74, rof:.52, mag:10, res:60,  spread:.015,spd:960, auto:false,pel:1,kick:5,  pierce:2,snd:'d'},
  lmg    :{name:'BULLDOG LMG', dmg:21, rof:.065,mag:100,res:240, spread:.16, spd:680, auto:true, pel:1,kick:1.8,snd:'r'}
};
var RAR=[{n:'COMMON',c:'#9aa08e'},{n:'RARE',c:'#5fa8d3'},{n:'EPIC',c:'#b07fd8'},{n:'LEGENDARY',c:'#e2b13c'}];

var CARDS=[
  {k:'w',id:'smg',    rar:1,wt:14},
  {k:'w',id:'rifle',  rar:2,wt:12},
  {k:'w',id:'shotgun',rar:1,wt:12},
  {k:'w',id:'dmr',    rar:2,wt:8},
  {k:'w',id:'lmg',    rar:3,wt:5},
  {k:'a',id:'ammo',   rar:0,wt:22,name:'AMMO CRATE', desc:'+2 mags for your weapon'},
  {k:'a',id:'loose',  rar:0,wt:16,name:'LOOSE ROUNDS',desc:'+1 mag for your weapon'},
  {k:'h',id:'med',    rar:1,wt:14,name:'FIELD DRESSING',desc:'Restore 45 health'},
  {k:'p',id:'plate',  rar:2,wt:9, name:'ARMOUR PLATE', desc:'+30 armour (soaks damage first)'},
  {k:'g',id:'frag',   rar:2,wt:10,name:'FRAG PACK',    desc:'+2 grenades'},
  {k:'t',id:'droneS', rar:1,wt:11,name:'SCOUT DRONE',   desc:'small blast · to belt'},
  {k:'t',id:'drone',  rar:2,wt:9, name:'FPV DRONE',     desc:'medium blast · to belt'},
  {k:'t',id:'droneL', rar:3,wt:4, name:'HEAVY DRONE',   desc:'large blast · to belt'},
  {k:'t',id:'usv',    rar:3,wt:5, name:'SEA DRONE',     desc:'ship killer · to belt'},
  {k:'t',id:'sentry', rar:2,wt:7, name:'SENTRY GUN',    desc:'to belt'},
  {k:'t',id:'smoke',  rar:1,wt:8, name:'SMOKE',         desc:'to belt'},
  {k:'t',id:'flamer', rar:2,wt:8, name:'FLAMETHROWER',  desc:'15s of fire · to belt'},
  {k:'t',id:'emp',    rar:1,wt:9, name:'DRONE JAMMER',  desc:'electronic burst · to belt'},
  {k:'t',id:'stim',   rar:1,wt:7, name:'COMBAT STIM',   desc:'to belt'},
  {k:'p',id:'vest',   rar:2,wt:8, name:'BODY ARMOUR',   desc:'+45 armour'}
];
function rollCard(){
  var pool=[],i;
  for(i=0;i<CARDS.length;i++) if(CARDS[i].k!=='t'||toolAllowed(CARDS[i].id)) pool.push(CARDS[i]);
  var tot=0; for(i=0;i<pool.length;i++) tot+=pool[i].wt;
  var r=Math.random()*tot;
  for(i=0;i<pool.length;i++){ r-=pool[i].wt; if(r<=0) return pool[i]; }
  return pool[0];
}

/* =========================================================================
   TOOLS — six belt slots, dropped by the dead
   ========================================================================= */
var TOOLS={
  droneS:{n:'SCOUT DRONE', c:'#8fd0e8', wt:12, dur:16, blast:[70,90],   desc:'PILOT'},
  drone :{n:'FPV DRONE',   c:'#6fb0d8', wt:11, dur:14, blast:[100,145], desc:'PILOT'},
  droneL:{n:'HEAVY DRONE', c:'#4f86b8', wt:6,  dur:12, blast:[150,215], desc:'PILOT'},
  usv   :{n:'SEA DRONE',   c:'#3fa8a0', wt:7,  dur:26, blast:[180,320], desc:'PILOT'},
  sentry:{n:'SENTRY GUN',  c:'#c8a24a', wt:11, dur:22},
  strike:{n:'FIRE MISSION',c:'#d8603a', wt:8},
  stim  :{n:'COMBAT STIM', c:'#4fd08a', wt:13, dur:12},
  smoke :{n:'SMOKE',       c:'#c9c9c2', wt:12, dur:14},
  incend:{n:'INCENDIARY',  c:'#e2762c', wt:10},
  flamer:{n:'FLAMETHROWER',c:'#f2762c', wt:9,  dur:15},
  emp   :{n:'DRONE JAMMER', c:'#7fe8ff', wt:9},
  med   :{n:'FIELD KIT',   c:'#e0483c', wt:14},
  plate :{n:'ARMOUR PLATE',c:'#8fb6c8', wt:11}
};
var TKEYS=['droneS','drone','droneL','usv','sentry','strike','stim','smoke','incend','flamer','emp','med','plate'];
// Independent aircraft speed tuning for every playable level.
// Level 2 is 50% faster than its previous 1.50 multiplier.
var DRONE_SPEED_BY_LEVEL={1:2.025,2:2.25,3:1.50,4:1.50,5:2.025,6:1.50};
var SEA_DRONE_SPEED_BY_LEVEL={3:1.50};
function toolAllowed(k){ return (k!=='usv')||mapKind==='sea'; }
function rollTool(){
  var keys=[],i;
  for(i=0;i<TKEYS.length;i++) if(toolAllowed(TKEYS[i])) keys.push(TKEYS[i]);
  var tot=0; for(i=0;i<keys.length;i++) tot+=TOOLS[keys[i]].wt;
  var r=Math.random()*tot;
  for(i=0;i<keys.length;i++){ r-=TOOLS[keys[i]].wt; if(r<=0) return keys[i]; }
  return 'med';
}
function dropTool(x,y,kind,ang,pw){
  var a=(ang||rr(0,6.3))+rr(-1,1), sp=rr(40,150)*(pw||1);
  drops.push({x:x,y:y,z:rr(16,28),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.62,vz:rr(200,420)*(pw||1),
    rot:rr(0,6.3),spin:rr(-11,11),cash:0,k:kind,t:0,life:46,landed:false,bounce:0});
}
function dropFrag(x,y,n,ang,pw){
  var a=(ang||rr(0,6.3))+rr(-1.2,1.2), sp=rr(40,130)*(pw||1);
  drops.push({x:x,y:y,z:rr(14,28),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.62,vz:rr(210,450)*(pw||1),
    rot:rr(0,6.3),spin:rr(-13,13),cash:0,frag:n,k:null,t:0,life:44,landed:false,bounce:0});
}
function dropAmmo(x,y,ang,pw){
  var a=(ang||rr(0,6.3))+rr(-1.2,1.2), sp=rr(40,130)*(pw||1);
  drops.push({x:x,y:y,z:rr(14,28),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.62,vz:rr(200,430)*(pw||1),
    rot:rr(0,6.3),spin:rr(-12,12),cash:0,ammo:1,k:null,t:0,life:44,landed:false,bounce:0});
}
function dropGun(x,y,id,ang,pw){
  var a=(ang||rr(0,6.3))+rr(-1.2,1.2), sp=rr(30,105)*(pw||1);
  drops.push({x:x,y:y,z:rr(14,26),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.62,vz:rr(190,400)*(pw||1),
    rot:rr(0,6.3),spin:rr(-10,10),cash:0,gun:id,k:null,t:0,life:52,landed:false,bounce:0});
}
function dropCash(x,y,val,ang,pw){
  if(drops.length>90) return;
  var a=(ang||rr(0,6.3))+rr(-1.4,1.4), sp=rr(40,145)*(pw||1);
  drops.push({x:x,y:y,z:rr(14,30),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.62,vz:rr(210,470)*(pw||1),
    rot:rr(0,6.3),spin:rr(-16,16),cash:val,k:null,t:0,life:34,landed:false,bounce:0});
}
function payday(e,ang){
  var base={rifleman:[10,26],rusher:[8,20],sniper:[22,44],heavy:[48,92]}[e.k]||[10,20];
  var total=ri(base[0],base[1])+Math.floor(level*1.5), n=ri(3,7), left=total;
  for(var i=0;i<n;i++){
    var v=(i===n-1)?left:Math.max(1,Math.round(total/n*rr(.6,1.4)));
    v=Math.min(v,left); left-=v; if(v<=0) continue;
    dropCash(e.x,e.y,v,ang,rr(.7,1.25));
  }
}
var fullMsg=0;
function beltAdd(k){
  if(belt.length>=6){ if(fullMsg<=0){ fullMsg=2.5; banner('BELT FULL','USE A TOOL FIRST',1.1); } return false; }
  belt.push(k); sfx('reload'); return true;
}
function toolIcon(c,k,sz){
  var S=sz/24;
  c.save(); c.scale(S,S); c.lineJoin='round';
  if(k==='truckpad'){
    c.fillStyle='#5b6349'; rrect(c,-11,-5,20,10,2); c.fill(); outl(c,'#171a12',1.8);
    c.fillStyle='#6f785c'; rrect(c,5,-4,6,8,2); c.fill(); outl(c,'#171a12',1.4);
    c.fillStyle='#1e1e1a';
    rrect(c,-9,4,5,3,1.4); c.fill(); rrect(c,1,4,5,3,1.4); c.fill();
    c.save(); c.translate(-3,-2); c.rotate(-.4);
    c.strokeStyle='#8fa2ae'; c.lineWidth=1.6;
    c.beginPath(); c.moveTo(-6,0); c.lineTo(6,0); c.stroke();
    c.fillStyle='#5b6570'; rrect(c,-2,-2.4,5,4.8,1.6); c.fill();
    c.restore();
  }
  else if(k==='drone'||k==='droneS'||k==='droneL'){
    var ds=k==='droneL'?1.12:(k==='droneS'?.82:1);
    c.scale(ds,ds);
    c.strokeStyle=k==='droneL'?'#9ec4dc':'#cfe6f2'; c.lineWidth=2.2;
    c.beginPath(); c.moveTo(-8,-8); c.lineTo(8,8); c.moveTo(8,-8); c.lineTo(-8,8); c.stroke();
    c.fillStyle=TOOLS[k].c; rrect(c,-4.5,-4,9,8,2.5); c.fill(); outl(c,'#0d1418',1.6);
    if(k==='droneL'){ c.fillStyle='#d8402c'; rrect(c,-3,-8.5,6,4,1.5); c.fill(); outl(c,'#0d1418',1.4); }
    c.strokeStyle='rgba(207,230,242,.8)'; c.lineWidth=1.6;
    [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(function(o){ c.beginPath(); c.arc(o[0],o[1],4.2,0,6.3); c.stroke(); });
  } else if(k==='sentry'){
    c.fillStyle='#c8a24a'; rrect(c,-6,-2,12,9,2); c.fill(); outl(c,'#1a1408',1.6);
    c.fillStyle='#8a7a3a'; rrect(c,-1.8,-11,3.6,10,1.4); c.fill(); outl(c,'#1a1408',1.4);
    c.strokeStyle='#c8a24a'; c.lineWidth=2;
    c.beginPath(); c.moveTo(-6,7); c.lineTo(-9,11); c.moveTo(6,7); c.lineTo(9,11); c.stroke();
  } else if(k==='strike'){
    c.fillStyle='#d8603a'; c.beginPath(); c.moveTo(0,-11); c.lineTo(4.5,2); c.lineTo(-4.5,2); c.closePath(); c.fill(); outl(c,'#2a0d06',1.6);
    c.fillStyle='#8a2f18'; c.beginPath(); c.moveTo(-4.5,2); c.lineTo(-8,9); c.lineTo(-1,5); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(4.5,2); c.lineTo(8,9); c.lineTo(1,5); c.closePath(); c.fill();
  } else if(k==='stim'){
    c.fillStyle='#dfe8e2'; rrect(c,-3,-9,6,15,2); c.fill(); outl(c,'#12261c',1.6);
    c.fillStyle='#4fd08a'; rrect(c,-2,-3,4,8,1.4); c.fill();
    c.strokeStyle='#dfe8e2'; c.lineWidth=2; c.beginPath(); c.moveTo(0,6); c.lineTo(0,11); c.stroke();
  } else if(k==='smoke'){
    c.fillStyle='#8d9089'; rrect(c,-4,-4,8,13,2.5); c.fill(); outl(c,'#1a1c19',1.6);
    c.fillStyle='rgba(220,220,214,.85)';
    c.beginPath(); c.arc(-4,-8,4,0,6.3); c.arc(2,-10,5,0,6.3); c.arc(6,-6,3.4,0,6.3); c.fill();
  } else if(k==='emp'){
    c.fillStyle='#4a5560'; rrect(c,-10,-3,14,6,2); c.fill(); outl(c,'#0d1418',1.6);
    c.fillStyle='#7fe8ff'; rrect(c,3,-5,4,10,1.5); c.fill(); outl(c,'#0d1418',1.4);
    c.strokeStyle='#7fe8ff'; c.lineWidth=1.8;
    c.beginPath(); c.arc(8,0,5,-1.1,1.1); c.stroke();
    c.beginPath(); c.arc(8,0,9,-.9,.9); c.stroke();
    c.fillStyle='#cfeeff'; c.beginPath(); c.moveTo(9,-2); c.lineTo(14,0); c.lineTo(9,2); c.closePath(); c.fill();
  } else if(k==='flamer'){
    c.fillStyle='#59544a'; rrect(c,-9,-3,15,6,2); c.fill(); outl(c,'#15130e',1.6);
    c.fillStyle='#8a8f7a'; rrect(c,-11,-6,5,12,2); c.fill(); outl(c,'#15130e',1.4);
    c.fillStyle='#f2762c';
    c.beginPath(); c.moveTo(6,-3); c.quadraticCurveTo(13,-6,17,-1);
    c.quadraticCurveTo(12,2,6,3); c.closePath(); c.fill();
    c.fillStyle='#ffd76a'; c.beginPath(); c.ellipse(9,0,3.4,2,0,0,6.3); c.fill();
  } else if(k==='incend'){
    c.fillStyle='#e2762c';
    c.beginPath(); c.moveTo(0,-11); c.quadraticCurveTo(7,-2,4,4); c.quadraticCurveTo(0,10,-4,4);
    c.quadraticCurveTo(-7,-2,0,-11); c.fill(); outl(c,'#3a1405',1.6);
    c.fillStyle='#ffd76a'; c.beginPath(); c.ellipse(0,2,2.6,4.4,0,0,6.3); c.fill();
  } else if(k==='med'){
    c.fillStyle='#e6e6e0'; rrect(c,-9,-7,18,14,2.5); c.fill(); outl(c,'#2a1010',1.8);
    c.fillStyle='#e0483c'; c.fillRect(-2,-5,4,10); c.fillRect(-6,-2,12,4);
  } else {
    c.fillStyle='#8fb6c8'; c.beginPath(); c.moveTo(0,-10); c.lineTo(9,-5); c.lineTo(7,7); c.lineTo(0,11);
    c.lineTo(-7,7); c.lineTo(-9,-5); c.closePath(); c.fill(); outl(c,'#101c22',1.8);
    c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(0,-7); c.lineTo(6,-3.6); c.lineTo(0,3); c.closePath(); c.fill();
  }
  c.restore();
}

/* =========================================================================
   AUDIO (synth, no files)
   ========================================================================= */
var AC=null;
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function noise(dur){
  var a=ac(); if(!a) return null;
  var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
  for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  var s=a.createBufferSource(); s.buffer=buf; return s;
}
function footSurface(x,y,tile){
  if(jetty&&Math.abs(x-jetty.x)<38&&Math.abs(y-jetty.y)<18) return 'wood';
  if(inBase(x,y)) return 'metal';
  var tx=x/TILE, ty=y/TILE;
  for(var i=0;i<roads.length;i++){
    var R=roads[i]; if(tx>=R[0]&&tx<=R[2]&&ty>=R[1]&&ty<=R[3]) return 'road';
  }
  if(tile===FLOOR) return 'wood';
  if(tile===RUBBLE||tile===CRUMBLE||tile===BROKEN) return 'rubble';
  if(tile===CRATER) return 'mud';
  if(tile===WATER) return 'water';
  return 'dirt';
}
function footstep(surface,vol){
  if(muted) return; var a=ac(); if(!a) return; if(a.state==='suspended') a.resume();
  var t=a.currentTime, S={
    dirt:[.075,'bandpass',430,.55], road:[.055,'bandpass',760,.48],
    wood:[.07,'bandpass',620,.62], metal:[.06,'bandpass',1450,.38],
    rubble:[.115,'highpass',680,.58], mud:[.13,'lowpass',260,.52],
    water:[.16,'bandpass',520,.5]
  }[surface]||[.075,'bandpass',430,.5];
  var n=noise(S[0]); if(!n) return;
  var f=a.createBiquadFilter(), g=a.createGain(); f.type=S[1]; f.frequency.value=S[2]; f.Q.value=.7;
  n.connect(f); f.connect(g); g.connect(a.destination);
  g.gain.setValueAtTime((vol||.12)*S[3],t);
  g.gain.exponentialRampToValueAtTime(.001,t+S[0]); n.start(t);
  // A second, very low layer gives boots weight without becoming a chirp.
  if(surface==='wood'||surface==='metal'||surface==='road'){
    var n2=noise(.045), f2=a.createBiquadFilter(), g2=a.createGain();
    f2.type='lowpass'; f2.frequency.value=surface==='metal'?520:310;
    n2.connect(f2); f2.connect(g2); g2.connect(a.destination);
    g2.gain.setValueAtTime((vol||.12)*.24,t); g2.gain.exponentialRampToValueAtTime(.001,t+.045); n2.start(t);
  }
}
function sfx(kind,vol){
  if(muted) return; var a=ac(); if(!a) return; if(a.state==='suspended') a.resume();
  vol=vol||1; var t=a.currentTime, g=a.createGain(); g.connect(a.destination);
  if(kind==='shot'||kind==='r'||kind==='s'||kind==='p'||kind==='d'||kind==='g'){
    // Three layers: sharp muzzle crack, low receiver thump, short outdoor tail.
    var spec={p:[.075,1650,105,.32],s:[.045,2100,125,.22],r:[.085,1350,82,.38],d:[.15,1050,58,.5],g:[.19,820,48,.62],shot:[.085,1400,85,.35]}[kind];
    var dur=spec[0], n=noise(dur); if(!n) return;
    var f=a.createBiquadFilter(); f.type='bandpass'; f.frequency.value=spec[1]; f.Q.value=.48;
    var cg=a.createGain(); n.connect(f); f.connect(cg); cg.connect(a.destination);
    cg.gain.setValueAtTime(spec[3]*vol,t); cg.gain.exponentialRampToValueAtTime(.001,t+dur); n.start(t);
    var o=a.createOscillator(), og=a.createGain(); o.type='sine';
    o.frequency.setValueAtTime(spec[2],t); o.frequency.exponentialRampToValueAtTime(34,t+dur*.85);
    og.gain.setValueAtTime(spec[3]*.72*vol,t); og.gain.exponentialRampToValueAtTime(.001,t+dur*.9);
    o.connect(og); og.connect(a.destination); o.start(t); o.stop(t+dur);
    var tail=noise(dur*2.8), tf=a.createBiquadFilter(), tg=a.createGain();
    tf.type='lowpass'; tf.frequency.value=520; tail.connect(tf); tf.connect(tg); tg.connect(a.destination);
    tg.gain.setValueAtTime(.001,t); tg.gain.linearRampToValueAtTime(spec[3]*.1*vol,t+.018);
    tg.gain.exponentialRampToValueAtTime(.001,t+dur*2.8); tail.start(t+.012);
  } else if(kind==='enemy'){
    var n2=noise(.085); if(!n2) return; var f2=a.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=1150; f2.Q.value=.55;
    n2.connect(f2); f2.connect(g); g.gain.setValueAtTime(.22*vol,t); g.gain.exponentialRampToValueAtTime(.001,t+.085); n2.start(t);
  } else if(kind==='hit'){
    var nh=noise(.11); if(!nh) return; var fh=a.createBiquadFilter(); fh.type='lowpass'; fh.frequency.value=420;
    nh.connect(fh); fh.connect(g); g.gain.setValueAtTime(.24*vol,t); g.gain.exponentialRampToValueAtTime(.001,t+.11); nh.start(t);
  } else if(kind==='ric'){
    var nr=noise(.075); if(!nr) return; var fr=a.createBiquadFilter(); fr.type='bandpass'; fr.frequency.value=3200; fr.Q.value=2.4;
    nr.connect(fr); fr.connect(g); g.gain.setValueAtTime(.075*vol,t); g.gain.exponentialRampToValueAtTime(.001,t+.075); nr.start(t);
  } else if(kind==='hurt'){
    var nh2=noise(.18); if(!nh2) return; var fh2=a.createBiquadFilter(); fh2.type='lowpass'; fh2.frequency.value=260;
    nh2.connect(fh2); fh2.connect(g); g.gain.setValueAtTime(.2*vol,t); g.gain.exponentialRampToValueAtTime(.001,t+.18); nh2.start(t);
  } else if(kind==='boom'){
    // Four randomized explosion profiles: sharp, heavy, distant and rolling.
    var bv=Math.floor(Math.random()*4);
    var bs=[
      [1.05,2200,105,82,30,.68,2700,.045,.42],
      [1.45,1450,68,64,24,1.02,1850,.065,.62],
      [1.75,1050,55,54,22,1.28,1250,.09,.88],
      [1.35,1750,78,72,25,.92,2150,.055,.56]
    ][bv];
    // Main pressure burst: broad noise falls quickly into a low rumble.
    var bn=noise(bs[0]); if(!bn) return;
    var bf=a.createBiquadFilter(), bg=a.createGain(); bf.type='lowpass';
    bf.frequency.setValueAtTime(bs[1],t); bf.frequency.exponentialRampToValueAtTime(bs[2],t+bs[0]*.9);
    bn.connect(bf); bf.connect(bg); bg.connect(a.destination);
    bg.gain.setValueAtTime((bv===1?.78:.68)*vol,t);
    bg.gain.exponentialRampToValueAtTime(.001,t+bs[0]); bn.start(t);
    // Fast shock crack removes the old soft synthetic character.
    var bc=noise(bs[7]*2.2), bcf=a.createBiquadFilter(), bcg=a.createGain();
    bcf.type='bandpass'; bcf.frequency.value=bs[6]; bcf.Q.value=.55;
    bc.connect(bcf); bcf.connect(bcg); bcg.connect(a.destination);
    bcg.gain.setValueAtTime(.72*vol,t); bcg.gain.exponentialRampToValueAtTime(.001,t+bs[7]); bc.start(t);
    // Sub-bass body supplies the weight of the blast.
    var sub=a.createOscillator(), sg=a.createGain(); sub.type='sine';
    sub.frequency.setValueAtTime(bs[3],t); sub.frequency.exponentialRampToValueAtTime(bs[4],t+bs[5]);
    sg.gain.setValueAtTime((bv===2?.62:.52)*vol,t); sg.gain.exponentialRampToValueAtTime(.001,t+bs[5]);
    sub.connect(sg); sg.connect(a.destination); sub.start(t); sub.stop(t+bs[5]+.03);
    // Dust, debris and terrain echo arrive just behind the initial blast.
    var bt=noise(bs[0]*1.25), btf=a.createBiquadFilter(), btg=a.createGain();
    btf.type='bandpass'; btf.frequency.value=bv===2?260:390; btf.Q.value=.38;
    bt.connect(btf); btf.connect(btg); btg.connect(a.destination);
    btg.gain.setValueAtTime(.001,t); btg.gain.linearRampToValueAtTime(.18*vol,t+bs[8]);
    btg.gain.exponentialRampToValueAtTime(.001,t+bs[0]*1.2); bt.start(t+.02);
    // The rolling variant gets a delayed second low thump.
    if(bv===3){
      var bo=a.createOscillator(), bog=a.createGain(); bo.type='sine';
      bo.frequency.setValueAtTime(58,t+.18); bo.frequency.exponentialRampToValueAtTime(25,t+.72);
      bog.gain.setValueAtTime(.001,t+.17); bog.gain.linearRampToValueAtTime(.28*vol,t+.2);
      bog.gain.exponentialRampToValueAtTime(.001,t+.78);
      bo.connect(bog); bog.connect(a.destination); bo.start(t+.17); bo.stop(t+.8);
    }
  } else if(kind==='crate'){
    var o5=a.createOscillator(); o5.type='square'; o5.frequency.setValueAtTime(160,t); o5.frequency.linearRampToValueAtTime(90,t+.18);
    o5.connect(g); g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.001,t+.2); o5.start(t); o5.stop(t+.22);
  } else if(kind==='card'){
    [660,880,1320].forEach(function(fq,i2){ var o6=a.createOscillator(), g6=a.createGain(); o6.type='triangle'; o6.frequency.value=fq;
      g6.gain.setValueAtTime(0,t+i2*.07); g6.gain.linearRampToValueAtTime(.14,t+i2*.07+.02); g6.gain.exponentialRampToValueAtTime(.001,t+i2*.07+.3);
      o6.connect(g6); g6.connect(a.destination); o6.start(t+i2*.07); o6.stop(t+i2*.07+.32); });
  } else if(kind==='reload'){
    var nc=noise(.055); if(!nc) return; var fc=a.createBiquadFilter(); fc.type='bandpass'; fc.frequency.value=950; fc.Q.value=1.1;
    nc.connect(fc); fc.connect(g); g.gain.setValueAtTime(.11*vol,t); g.gain.exponentialRampToValueAtTime(.001,t+.055); nc.start(t);
  } else if(kind==='clear'){
    [523,659,784,1046].forEach(function(fq,i3){ var o8=a.createOscillator(), g8=a.createGain(); o8.type='triangle'; o8.frequency.value=fq;
      g8.gain.setValueAtTime(0,t+i3*.12); g8.gain.linearRampToValueAtTime(.16,t+i3*.12+.03); g8.gain.exponentialRampToValueAtTime(.001,t+i3*.12+.5);
      o8.connect(g8); g8.connect(a.destination); o8.start(t+i3*.12); o8.stop(t+i3*.12+.55); });
  }
}

// ── MUSIC ENGINE ─────────────────────────────────────────────────────────────
// Six procedurally-generated level soundtracks using Web Audio API.
// Each track: bass line, drum kit (kick/snare/hat), atmospheric pad drone,
// and a sparse melody — all synthesized in real-time, no audio files needed.
// ── Background music — WAV file for level 1, silent on all others ─────────────
var _bgm=null; // current HTMLAudioElement
function stopMusic(fast){
  var el=_bgm; _bgm=null; if(!el) return;
  if(fast){ el.pause(); el.currentTime=0; return; }
  // ~1.2 s fade-out
  var steps=15, delta=el.volume/steps;
  var t=setInterval(function(){
    if(el.volume>delta){ el.volume=Math.max(0,el.volume-delta); }
    else{ el.pause(); el.currentTime=0; clearInterval(t); }
  },80);
}
function startMusic(kind){
  stopMusic(true);
  if(kind!=='compound') return; // only level 1 has a track
  setTimeout(function(){
    if(muted||state!=='play') return;
    var el=new Audio('assets/audio/advance-in-contact-92bpm-lvl1.wav');
    el.loop=true; el.volume=0; _bgm=el;
    el.play().catch(function(){});
    // 4 s fade-in to 0.45
    var target=0.45, steps2=40, delta2=target/steps2;
    var fi=setInterval(function(){
      if(_bgm!==el){ clearInterval(fi); return; }
      if(el.volume<target-delta2){ el.volume=Math.min(target,el.volume+delta2); }
      else{ el.volume=target; clearInterval(fi); }
    },100);
  },300);
}

var SHOP=[
  {id:'plate',  n:'PLATE',        p:120, d:'+40 armour'},
  {id:'med',    n:'FIELD KIT',    p:90,  d:'+50 health'},
  {id:'frag',   n:'FRAGS x3',     p:150, d:'three grenades'},
  {id:'ammo',   n:'RESUPPLY',     p:110, d:'refill every gun'},
  {id:'t_droneS',n:'SCOUT DRONE',  p:160, d:'small blast'},
  {id:'t_drone',n:'FPV DRONE',     p:250, d:'medium blast'},
  {id:'t_droneL',n:'HEAVY DRONE',  p:420, d:'large blast'},
  {id:'t_usv',  n:'SEA DRONE',     p:360, d:'ship killer'},
  {id:'t_sentry',n:'SENTRY GUN',  p:260, d:'to belt'},
  {id:'t_strike',n:'FIRE MISSION',p:320, d:'to belt'},
  {id:'t_stim', n:'COMBAT STIM',  p:150, d:'to belt'},
  {id:'t_flamer',n:'FLAMETHROWER', p:280, d:'15s of fire'},
  {id:'t_emp',  n:'DRONE JAMMER',  p:190, d:'burst kills drones'},
  {id:'u_armor',n:'HEAVY PLATE',  p:400, d:'armour cap 120', once:1},
  {id:'u_hp',   n:'COMBAT VEST',  p:450, d:'health 140', once:1}
];
function shopBox(){
  var w=Math.min(300,VW-28), x=(VW-w)/2;
  var top=Math.max(56,VH*.07), bot=Math.min(VH-72,VH*.88);
  return {x:x,w:w,top:top,bot:bot,listTop:top+68,listBot:bot-48};
}
function shopList(){
  var out=[];
  for(var i=0;i<SHOP.length;i++){
    var id=SHOP[i].id;
    if(id.indexOf('t_')===0&&!toolAllowed(id.slice(2))) continue;
    out.push(SHOP[i]);
  }
  return out;
}
function shopRect(i){
  var B=shopBox(), cw=(B.w-30)/2, ch=46;
  return {x:B.x+8+(i%2)*(cw+14),y:B.listTop+4-shopScroll+Math.floor(i/2)*(ch+8),
          w:cw,h:ch,pw:B.w,px:B.x};
}
function shopMaxScroll(){
  var B=shopBox(), rows=Math.ceil(shopList().length/2);
  return Math.max(0, rows*54+8-(B.listBot-B.listTop));
}
function shopClose(){ var B=shopBox(); return {x:B.x+8,y:B.listBot+10,w:B.w-16,h:42}; }
function buy(i){
  var it=SHOP[i]; if(!it) return;
  if(it.once&&bought[it.id]){ banner('ALREADY FITTED','',1); return; }
  if(money<it.p){ banner('NOT ENOUGH CASH','$'+money+' OF $'+it.p,1.2); sfx('ric',.4); return; }
  if(it.id.indexOf('t_')===0){
    if(belt.length>=6){ banner('BELT FULL','',1.1); return; }
    belt.push(it.id.slice(2));
  }
  else if(it.id==='plate') player.ap=Math.min(upgAP,player.ap+40);
  else if(it.id==='med')   player.hp=Math.min(player.mx,player.hp+50);
  else if(it.id==='frag')  player.nades+=3;
  else if(it.id==='ammo'){ for(var g=0;g<player.guns.length;g++){ var W3=WEAPONS[player.guns[g].id];
      player.guns[g].res=W3.res; player.guns[g].mag=W3.mag; }
      player.wep=player.guns[player.gi].id; player.mag=player.guns[player.gi].mag; player.res=player.guns[player.gi].res; }
  else if(it.id==='u_armor'){ upgAP=120; bought[it.id]=1; }
  else if(it.id==='u_hp'){ upgHP=140; player.mx=140; player.hp=140; bought[it.id]=1; }
  money-=it.p; sfx('card'); banner(it.n,'PURCHASED',1); hud();
}
function drawShopIcon(c,id,x,y,s){
  c.save(); c.translate(x+s/2,y+s/2);
  var h=s/2;
  if(id==='plate'||id==='u_armor'){
    c.fillStyle='#7a8fa8';
    c.beginPath(); c.moveTo(0,-h*.9); c.quadraticCurveTo(h*.8,-h*.6,h*.8,-h*.2);
    c.quadraticCurveTo(h*.8,h*.5,0,h*.9); c.quadraticCurveTo(-h*.8,h*.5,-h*.8,-h*.2);
    c.quadraticCurveTo(-h*.8,-h*.6,0,-h*.9); c.closePath(); c.fill();
    c.fillStyle='#aac4d8'; c.beginPath(); c.arc(0,0,h*.45,0,6.3); c.fill();
  } else if(id==='med'||id==='u_hp'){
    var t=h*.32;
    c.fillStyle='#c0362a'; rrect(c,-t,-h*.85,t*2,h*1.7,2); c.fill(); rrect(c,-h*.85,-t,h*1.7,t*2,2); c.fill();
  } else if(id==='frag'){
    c.fillStyle='#5a6c45'; c.beginPath(); c.ellipse(0,h*.14,h*.5,h*.64,0,0,6.3); c.fill();
    c.fillStyle='#3d4d2e'; c.fillRect(-h*.14,-h*.86,h*.28,h*.32);
    c.fillStyle='#e2b13c'; c.fillRect(-h*.28,-h*.7,h*.56,h*.1);
  } else if(id==='ammo'){
    c.fillStyle='#4d5a30'; rrect(c,-h*.68,-h*.46,h*1.36,h*.96,3); c.fill();
    c.fillStyle='#8a8f7a'; rrect(c,-h*.44,-h*.64,h*.88,h*.22,2); c.fill();
    c.fillStyle='rgba(226,177,60,.85)'; c.fillRect(-h*.5,-h*.1,h*1,h*.08);
  } else if(id==='t_droneS'||id==='t_drone'||id==='t_droneL'){
    var dr=id==='t_droneL'?h*.78:(id==='t_drone'?h*.62:h*.5);
    c.fillStyle='#383c35'; rrect(c,-h*.22,-h*.22,h*.44,h*.44,3); c.fill();
    c.strokeStyle='#5a6050'; c.lineWidth=s*.052; c.lineCap='round';
    c.beginPath(); c.moveTo(-h*.12,-h*.12); c.lineTo(-dr,-dr); c.stroke();
    c.beginPath(); c.moveTo(h*.12,-h*.12); c.lineTo(dr,-dr); c.stroke();
    c.beginPath(); c.moveTo(-h*.12,h*.12); c.lineTo(-dr,dr); c.stroke();
    c.beginPath(); c.moveTo(h*.12,h*.12); c.lineTo(dr,dr); c.stroke();
    c.fillStyle='#e2b13c';
    c.beginPath(); c.arc(-dr,-dr,h*.18,0,6.3); c.fill();
    c.beginPath(); c.arc(dr,-dr,h*.18,0,6.3); c.fill();
    c.beginPath(); c.arc(-dr,dr,h*.18,0,6.3); c.fill();
    c.beginPath(); c.arc(dr,dr,h*.18,0,6.3); c.fill();
    c.fillStyle='#8fd0e8'; c.beginPath(); c.arc(0,0,h*.12,0,6.3); c.fill();
  } else if(id==='t_usv'){
    c.fillStyle='#3a5a7a'; c.beginPath(); c.moveTo(0,-h*.8); c.lineTo(h*.5,h*.6);
    c.lineTo(-h*.5,h*.6); c.closePath(); c.fill();
    c.fillStyle='#5a8aaa'; c.fillRect(-h*.16,-h*.36,h*.32,h*.64);
  } else if(id==='t_sentry'){
    c.fillStyle='#4a4840'; rrect(c,-h*.42,-h*.42,h*.84,h*.84,3); c.fill(); outl(c,'#1e1a14',1.2);
    c.fillStyle='#6a6860'; c.fillRect(-h*.14,-h*.74,h*.28,h*.74);
    c.fillStyle='#8fa0a8'; c.fillRect(-h*.18,-h*.82,h*.36,h*.14);
  } else if(id==='t_strike'){
    c.fillStyle='#e07840'; c.beginPath(); c.moveTo(0,-h*.96); c.lineTo(h*.18,-h*.24); c.lineTo(-h*.18,-h*.24); c.closePath(); c.fill();
    c.fillStyle='#c04830'; c.beginPath(); c.ellipse(0,h*.5,h*.4,h*.32,0,0,6.3); c.fill();
    c.beginPath(); c.ellipse(h*.28,h*.12,h*.28,h*.22,0,0,6.3); c.fill();
  } else if(id==='t_stim'){
    c.fillStyle='#4fd08a'; c.fillRect(-h*.14,-h*.88,h*.28,h*1.1);
    c.fillStyle='rgba(200,255,230,.55)'; c.fillRect(-h*.1,-h*.76,h*.2,h*.64);
    c.fillStyle='#2ea865'; c.fillRect(-h*.14,-h*.96,h*.28,h*.14);
    c.fillStyle='#4fd08a'; c.fillRect(-h*.05,h*.22,h*.1,h*.28);
    c.fillStyle='#b8f4d8'; c.fillRect(-h*.18,-h*.3,h*.36,h*.1);
  } else if(id==='t_flamer'){
    c.fillStyle='#c0562f';
    c.beginPath(); c.ellipse(-h*.18,h*.34,h*.3,h*.58,-.3,0,6.3); c.fill();
    c.fillStyle='#e2a02c';
    c.beginPath(); c.ellipse(h*.06,h*.1,h*.26,h*.46,0.2,0,6.3); c.fill();
    c.fillStyle='#f2d060';
    c.beginPath(); c.ellipse(h*.2,-h*.22,h*.18,h*.3,.3,0,6.3); c.fill();
  } else if(id==='t_emp'){
    c.strokeStyle='#4fa8d0'; c.lineWidth=s*.07; c.lineCap='round';
    for(var ea=0;ea<6;ea++){
      var ea2=ea*Math.PI/3;
      c.beginPath(); c.moveTo(Math.cos(ea2)*h*.26,Math.sin(ea2)*h*.26);
      c.lineTo(Math.cos(ea2)*h*.88,Math.sin(ea2)*h*.88); c.stroke();
    }
    c.fillStyle='#8fd8f0'; c.beginPath(); c.arc(0,0,h*.24,0,6.3); c.fill();
  }
  c.restore();
}
function drawShop(){
  var B=shopBox();
  shopScroll=Math.max(0,Math.min(shopMaxScroll(),shopScroll));
  ctx.fillStyle='rgba(4,4,3,.78)'; ctx.fillRect(0,0,VW,VH);
  ctx.fillStyle='#2a271f'; rrect(ctx,B.x,B.top,B.w,B.bot-B.top,10); ctx.fill();
  ctx.strokeStyle='#8a7a4c'; ctx.lineWidth=2; rrect(ctx,B.x,B.top,B.w,B.bot-B.top,10); ctx.stroke();
  ctx.textAlign='center';
  ctx.fillStyle='#f2ead2'; ctx.font='bold 17px Arial'; ctx.fillText('QUARTERMASTER',VW/2,B.top+30);
  ctx.fillStyle='#e2b13c'; ctx.font='bold 14px Arial'; ctx.fillText('$'+money,VW/2,B.top+52);
  ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(B.x+8,B.listTop-4); ctx.lineTo(B.x+B.w-8,B.listTop-4); ctx.stroke();

  ctx.save();
  ctx.beginPath(); ctx.rect(B.x+2,B.listTop,B.w-4,B.listBot-B.listTop); ctx.clip();
  var SL=shopList();
  for(var i=0;i<SL.length;i++){
    var R=shopRect(i), it=SL[i], own=(it.once&&bought[it.id]), can=money>=it.p&&!own;
    if(R.y>B.listBot+8||R.y+R.h<B.listTop-8) continue;
    ctx.fillStyle=own?'rgba(80,110,70,.35)':(can?'rgba(255,255,255,.09)':'rgba(255,255,255,.03)');
    rrect(ctx,R.x,R.y,R.w,R.h,6); ctx.fill();
    ctx.strokeStyle=own?'#6f9a5e':(can?'rgba(226,177,60,.55)':'rgba(255,255,255,.12)');
    ctx.lineWidth=1.5; rrect(ctx,R.x,R.y,R.w,R.h,6); ctx.stroke();
    // Icon (top-right of card)
    drawShopIcon(ctx,it.id,R.x+R.w-38,R.y+4,32);
    ctx.textAlign='left';
    ctx.fillStyle=can||own?'#f2ead2':'#7d786c'; ctx.font='bold 11px Arial';
    ctx.fillText(it.n,R.x+9,R.y+18);
    ctx.fillStyle='#8f8a7c'; ctx.font='9px Arial'; ctx.fillText(it.d,R.x+9,R.y+31);
    ctx.textAlign='right';
    ctx.fillStyle=own?'#6f9a5e':(can?'#e2b13c':'#7d786c'); ctx.font='bold 11px Arial';
    ctx.fillText(own?'FITTED':'$'+it.p,R.x+R.w-9,R.y+41);
  }
  ctx.restore();

  var ms=shopMaxScroll();
  if(ms>0){                                   // scrollbar
    var trH=B.listBot-B.listTop, thH=Math.max(30,trH*trH/(trH+ms));
    var thY=B.listTop+(trH-thH)*(shopScroll/ms);
    ctx.fillStyle='rgba(255,255,255,.08)'; rrect(ctx,B.x+B.w-7,B.listTop,4,trH,2); ctx.fill();
    ctx.fillStyle='rgba(226,177,60,.6)'; rrect(ctx,B.x+B.w-7,thY,4,thH,2); ctx.fill();
    if(shopScroll<ms-1){
      ctx.fillStyle='rgba(226,177,60,'+(.35+Math.abs(Math.sin(now*3))*.35)+')';
      ctx.font='bold 9px Arial'; ctx.textAlign='center';
      ctx.fillText('MORE BELOW',VW/2,B.listBot-4);
    }
  }
  var C=shopClose();
  ctx.fillStyle='#c0562f'; rrect(ctx,C.x,C.y,C.w,C.h,5); ctx.fill();
  ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='bold 13px Arial';
  ctx.fillText('BACK TO IT',C.x+C.w/2,C.y+27); ctx.textAlign='start';
}
function shopPoint(cx,cy){
  if(state!=='shop') return;
  var C=shopClose(), B=shopBox();
  if(cx>=C.x&&cx<=C.x+C.w&&cy>=C.y&&cy<=C.y+C.h){ state='play'; shopCD=1.2; hud(); return; }
  if(cy>=B.listTop&&cy<=B.listBot){
    var SL2=shopList();
    for(var i=0;i<SL2.length;i++){ var R=shopRect(i);
      if(cx>=R.x&&cx<=R.x+R.w&&cy>=R.y&&cy<=R.y+R.h){ buy(SHOP.indexOf(SL2[i])); return; } }
  }
  if(cx<B.x||cx>B.x+B.w||cy<B.top||cy>B.bot){ state='play'; shopCD=1.2; hud(); }
}
function shopScrollBy(d){
  shopScroll=Math.max(0,Math.min(shopMaxScroll(),shopScroll+d));
}
function aimPoint(range){
  var t=nearestTarget();
  if(t) return {x:t.x,y:t.y};
  return {x:player.x+Math.cos(player.face)*range, y:player.y+Math.sin(player.face)*range};
}
function useTool(i){
  if(state!=='play'||piloting||i>=belt.length) return;
  var k=belt[i]; belt.splice(i,1);
  var T2=TOOLS[k];
  if(k==='med'){ player.hp=Math.min(player.mx,player.hp+50); sfx('card'); banner('PATCHED UP','',1); }
  else if(k==='plate'){ player.ap=Math.min(upgAP,player.ap+40); sfx('card'); banner('PLATE ON','',1); }
  else if(k==='stim'){ player.stim=T2.dur; sfx('card'); banner('STIM','SPEED + RATE OF FIRE',1.2); }
  else if(k==='flamer'){ player.flamer=T2.dur; sfx('card'); banner('FLAMETHROWER','HOLD FIRE TO SPRAY',1.6); }
  else if(k==='emp'){ fireEMP(); }
  else if(k==='sentry'){
    sentries.push({x:player.x,y:player.y,ang:player.face,t:T2.dur,cd:0});
    sfx('reload'); banner('SENTRY DEPLOYED','',1.2);
  }
  else if(k==='smoke'){
    var ap=aimPoint(150); smokes.push({x:ap.x,y:ap.y,r:0,max:95,t:T2.dur,dur:T2.dur});
    sfx('boom',.2); banner('SMOKE OUT','THEY CANNOT SEE YOU',1.3);
  }
  else if(k==='incend'){
    var ip=aimPoint(170);
    for(var f=0;f<6;f++) if(fires.length<16)
      fires.push({x:ip.x+rr(-42,42),y:ip.y+rr(-38,38),r:rr(9,15),p:rr(0,6),life:rr(14,20),sp:0,hot:1});
    explode(ip.x,ip.y,60,40,true); banner('INCENDIARY','',1.2);
  }
  else if(k==='strike'){
    var sp2=aimPoint(230);
    for(var q=0;q<7;q++) strikes.push({x:sp2.x+rr(-75,75),y:sp2.y+rr(-70,70),t:1.4+q*.28});
    sfx('boom',.25); banner('FIRE MISSION','ROUNDS INBOUND',1.8);
  }
  else if(k==='usv'&&mapKind!=='sea'){
    belt.push('usv'); banner('NO WATER HERE','THE BOAT STAYS ON ITS TRAILER',1.6); return;
  }
  else if(k==='drone'||k==='droneS'||k==='droneL'||k==='usv'){
    var lp2=(k==='usv')?((seaPad&&mapKind==='sea')?waterNear(seaPad.x+30,seaPad.y):waterNear(player.x,player.y))
                       :{x:player.x,y:player.y};
    drone={x:lp2.x,y:lp2.y,vx:0,vy:0,ang:player.face,t:T2.dur,rot:0,kind:k,hp:k==='usv'?420:170,mx:k==='usv'?420:170};
    piloting=true; firing=false; actBtn.classList.remove('on');
    sfx('card'); banner('DRONE UPLINK','STEER IN · ACT TO DETONATE',1.8);
  }
  hud();
}
/* everything a heavy warhead does to what it lands on */
function strikeAt(x,y,bl){
  explode(x,y,bl[0],bl[1],true);
  for(var mc0=0;mc0<motorcade.length;mc0++){
    var MC0=motorcade[mc0],mcd0=Math.hypot(MC0.x-x,MC0.y-y);
    if(!MC0.dead&&mcd0<bl[0]*1.15) hitMotorcadeCar(MC0,bl[1]*1.5*(1-mcd0/(bl[0]*1.4)));
  }
  for(var ac0=0;ac0<aircraft.length;ac0++){
    var AC0=aircraft[ac0],ad0=Math.hypot(AC0.x-x,AC0.y-y);
    if(!AC0.dead&&ad0<bl[0]*1.25) hitAircraft(AC0,bl[1]*1.8*(1-ad0/(bl[0]*1.5)));
  }
  for(var r0=0;r0<refineries.length;r0++){
    var R0=refineries[r0]; if(R0.dead) continue;
    var rd0=Math.hypot(R0.cx-x,R0.cy-y);
    if(rd0<bl[0]*1.5) hitRefinery(R0,bl[1]*1.7*(1-rd0/(bl[0]*1.9)),x,y);
  }
  for(var s0=sams.length-1;s0>=0;s0--){
    if(Math.hypot(sams[s0].x-x,sams[s0].y-y)<bl[0]*.9){
      sams[s0].hp-=bl[1];
      if(sams[s0].hp<=0){ explode(sams[s0].x,sams[s0].y,80,20,true); sams.splice(s0,1); }
    }
  }
  for(var g0=aaGuns.length-1;g0>=0;g0--){
    if(Math.hypot(aaGuns[g0].x-x,aaGuns[g0].y-y)<bl[0]*.9){
      aaGuns[g0].hp-=bl[1];
      if(aaGuns[g0].hp<=0){ explode(aaGuns[g0].x,aaGuns[g0].y,70,20,true); aaGuns.splice(g0,1); }
    }
  }
  for(var sp0=0;sp0<ships.length;sp0++){
    var SP0=ships[sp0]; if(SP0.sink>0) continue;
    var sd0=Math.hypot(SP0.x-x,SP0.y-y);
    if(sd0<bl[0]*1.1) shipHit(SP0,bl[1]*(1-sd0/(bl[0]*1.4)),0);
  }
  for(var d0=0;d0<depots.length;d0++){
    var D0=depots[d0];
    if(!D0.blown&&x>D0.x0*TILE&&x<(D0.x1+1)*TILE&&y>D0.y0*TILE&&y<(D0.y1+1)*TILE) blowDepot(D0);
  }
  if(tank&&Math.hypot(tank.x-x,tank.y-y)<bl[0]*.6){
    tank.hp-=2; tank.hurt=.3;
    if(tank.hp<=0) killTank();
  }
  for(var dz=0;dz<20;dz++) launchPart(x,y,'debris',null,null,rr(0,6.283),rr(1,2.2));
  for(var pz=0;pz<14&&plume.length<300;pz++)
    plume.push({x:x+rr(-24,24),y:y+rr(-20,20),vx:rr(-40,40),vy:-rr(40,100),
      life:rr(2,4.5),max:4.5,s:rr(9,20),hot:1});
  shake=Math.min(28,shake+9);
}
function wingBoom(W){
  strikeAt(W.x,W.y,[TOOLS.droneL.blast[0]*1.15,TOOLS.droneL.blast[1]*1.3]);
  sfx('boom',.6);
}
function detonateSeaMine(M,hitDrone){
  if(!M||M.dead) return;
  M.dead=1;
  explode(M.x,M.y,185,105,true);
  explode(M.x+rr(-20,20),M.y+rr(-18,18),125,55,true);
  for(var mw=0;mw<7&&wakes.length<160;mw++) wakes.push({x:M.x,y:M.y,a:mw/7*6.283,life:2,max:2,w:22});
  for(var me=0;me<42&&embers.length<260;me++) embers.push({x:M.x,y:M.y,vx:rr(-150,150),vy:rr(-190,30),life:rr(.8,2),max:2});
  shake=Math.min(30,shake+24); sfx('boom'); sfx('boom',.65);
  banner('SEA MINE','CONTACT DETONATION',1.5);
  if(hitDrone&&drone) droneBoom(drone.x,drone.y);
}
function droneBoom(x,y){
  var dk=(drone&&drone.kind)||'drone', bl=(TOOLS[dk]&&TOOLS[dk].blast)||[100,145];
  var onTank = tank&&Math.hypot(tank.x-x,tank.y-y)<bl[0]*.55;
  if(onTank){
    tank.hp-=(dk==='droneL'?3:1); tank.hurt=.3; shake=Math.min(22,shake+10);
    explode(x,y,bl[0],bl[1],true);
    var killed=(tank.hp<=0);
    if(killed) killTank(); else banner('ARMOUR HIT','ONE MORE',1.4);
    droneCam={x:x,y:y,t:killed?3.2:2.4};
  } else {
    explode(x,y,bl[0],bl[1],true);
    for(var rq9=0;rq9<refineries.length;rq9++){
      var RQ9=refineries[rq9];
      if(RQ9.dead) continue;
      var rd9=Math.hypot(RQ9.cx-x,RQ9.cy-y);
      if(rd9<bl[0]*1.5) hitRefinery(RQ9,bl[1]*1.7*(1-rd9/(bl[0]*1.9)),x,y);
    }
    for(var sq9=sams.length-1;sq9>=0;sq9--){
      var SQ9=sams[sq9];
      if(Math.hypot(SQ9.x-x,SQ9.y-y)<bl[0]*.9){
        SQ9.hp-=bl[1];
        if(SQ9.hp<=0){
          explode(SQ9.x,SQ9.y,80,20,true);
          for(var sd9=0;sd9<16;sd9++) launchPart(SQ9.x,SQ9.y,'debris',null,null,rr(0,6.283),rr(.9,1.8));
          sams.splice(sq9,1); banner('SAM SITE DESTROYED','',1.2);
        }
      }
    }
    var onShip=false;
    for(var sq3=0;sq3<ships.length;sq3++){
      var SH2=ships[sq3];
      if(SH2.sink>0) continue;
      var dsh=Math.hypot(SH2.x-x,SH2.y-y);
      if(dsh<bl[0]*1.1){ shipHit(SH2,bl[1]*(1-dsh/(bl[0]*1.4)),0); if(dsh<bl[0]*.6) onShip=SH2; }
    }
    if(onShip){                                     // a warhead going off against steel
      var SS=onShip, ba=Math.atan2(y-SS.y,x-SS.x), scl=bl[0]/100;
      explode(x,y,bl[0]*1.35,6,true);
      explode(x+Math.cos(ba)*22,y+Math.sin(ba)*22,bl[0]*.8,4,true);
      shake=Math.min(28,shake+10*scl);
      sfx('boom'); sfx('boom',.5);
      for(var pl5=0;pl5<Math.round(20*scl)&&plume.length<300;pl5++)          // a column of smoke off the hull
        plume.push({x:x+rr(-26,26)*scl,y:y+rr(-20,20)*scl,vx:rr(-42,42)*scl,vy:-rr(40,110)*scl,
          life:rr(2.4,4.6),max:4.6,s:rr(9,24)*Math.min(1.5,scl),hot:1});
      for(var dz=0;dz<Math.round(24*scl);dz++)                               // plating and fittings
        launchPart(x+rr(-18,18)*scl,y+rr(-14,14)*scl,'debris',null,null,rr(0,6.283),rr(1.1,2.4)*Math.min(1.4,scl));
      for(var ez=0;ez<Math.round(18*scl)&&embers.length<260;ez++)
        embers.push({x:x+rr(-16,16),y:y+rr(-12,12),vx:rr(-110,110),vy:-rr(70,200),
          life:rr(.9,2.2),max:2.2});
      dustPuff(x,y,Math.round(7*scl),1.8);
      for(var ff2=0;ff2<Math.max(1,Math.round(scl))&&fires.length<16;ff2++)
        fires.push({x:x+rr(-14,14),y:y+rr(-10,10),r:rr(12,18)*Math.min(1.4,scl),p:rr(0,6),life:rr(20,40),sp:0});
      for(var wz=0;wz<3&&wakes.length<160;wz++)               // the blast throws water out
        wakes.push({x:x,y:y,a:ba+wz*2.1,life:1.4,max:1.4,w:16});
      fx.push({t:'gore',x:x,y:y,life:.34,max:.34});
    }
    if(onShip&&onShip.sink>0) droneCam={x:onShip.x,y:onShip.y,t:5.2,ship:onShip};
    else if(onShip) droneCam={x:onShip.x,y:onShip.y,t:3.4+bl[0]/120,ship:onShip};
    else droneCam={x:x,y:y,t:(dk==='droneL'||dk==='usv')?2.9:2.2};
    banner('IMPACT','',1);
  }
  for(var wq=0;wq<wingmen.length;wq++){                              // the flight goes in on the mark
    var WQ=wingmen[wq];
    var wa=Math.atan2(y-WQ.y,x-WQ.x), wd=Math.hypot(x-WQ.x,y-WQ.y);
    var lead=Math.min(wd,170);
    wingBoom({x:WQ.x+Math.cos(wa)*lead,y:WQ.y+Math.sin(wa)*lead});
  }
  if(wingmen.length){ shake=Math.min(30,shake+14); droneCam={x:x,y:y,t:5.2}; }
  wingmen.length=0;
  if(dk&&drone&&drone.pad&&!drone.flight) drone.pad.cd=0;          // a lost single frees its bay
  drone=null; piloting=false; firing=false; actBtn.classList.remove('on');
}

/* =========================================================================
   ENTITIES
   ========================================================================= */

/* ============================ LEVEL 2 — THE TRENCHES ============================ */
function dig(x0,y0,w,h){ fill(x0,y0,x0+w-1,y0+h-1,FLOOR); }
function buildTrench(){
  seed=5150+level*31;
  setMapSize(50,38,false);
  grid.fill(WALL); props.length=0; holes.length=0; roads.length=0;
  duck.length=0; wires.length=0; bunkers.length=0; bases.length=0; flags.length=0;
  rescueGroups.length=0; captives.length=0;
  edrones.length=0; emps.length=0; depots.length=0; depotWorkers.length=0; aaGuns.length=0;

  var TSUP=3, TFRONT=8, OFRONT=27, OSUP=32;

  // four continuous lines with fire bays stepped off them
  dig(3,TSUP,34,2); dig(3,TFRONT,34,2); dig(3,OFRONT,44,2); dig(3,OSUP,44,2);
  for(var bx2=4;bx2<34;bx2+=6){
    dig(bx2,TSUP-2,3,2); dig(bx2+3,TFRONT+2,3,2);
    dig(bx2,OFRONT-2,3,2); dig(bx2+3,OSUP+2,3,2);
  }
  for(var c1=6;c1<34;c1+=8) dig(c1,TSUP,2,TFRONT-TSUP+2);
  for(var c2=8;c2<45;c2+=8) dig(c2,OFRONT,2,OSUP-OFRONT+2);

  // no man's land: a maze of saps
  var MX=4, MY=11, CELL=4, COLS=Math.floor((40-MX)/CELL), ROWS=4;
  var vis={}, stack=[];
  function cellDig(cx,cy){ dig(MX+cx*CELL,MY+cy*CELL,2,2); }
  function link(ax,ay,bx,by){
    var lx=MX+Math.min(ax,bx)*CELL, ly=MY+Math.min(ay,by)*CELL;
    if(ax===bx) dig(lx,ly,2,CELL+2); else dig(lx,ly,CELL+2,2);
  }
  var sx0=ri(0,COLS-1), sy0=ri(0,ROWS-1);
  vis[sx0+','+sy0]=1; cellDig(sx0,sy0); stack.push([sx0,sy0]);
  var guard=0;
  while(stack.length&&guard++<9000){
    var cur=stack[stack.length-1], nb=[], dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var d=0;d<4;d++){
      var nx=cur[0]+dirs[d][0], ny=cur[1]+dirs[d][1];
      if(nx<0||ny<0||nx>=COLS||ny>=ROWS||vis[nx+','+ny]) continue;
      nb.push([nx,ny]);
    }
    if(!nb.length){ stack.pop(); continue; }
    var nxt=nb[ri(0,nb.length-1)];
    vis[nxt[0]+','+nxt[1]]=1; cellDig(nxt[0],nxt[1]); link(cur[0],cur[1],nxt[0],nxt[1]);
    stack.push(nxt);
  }
  for(var lp=0;lp<12;lp++){
    var lx2=ri(0,COLS-2), ly2=ri(0,ROWS-2);
    if(Math.random()<.5) link(lx2,ly2,lx2+1,ly2); else link(lx2,ly2,lx2,ly2+1);
  }
  for(var sp=0;sp<COLS;sp+=2){
    var sxx=MX+sp*CELL;
    dig(sxx,TFRONT,2,MY-TFRONT+2);
    dig(sxx,MY+(ROWS-1)*CELL,2,OFRONT-(MY+(ROWS-1)*CELL)+2);
  }
  for(var sh=0;sh<9;sh++){
    var hx=ri(6,42), hy=ri(12,25), hr=ri(2,3);
    for(var yy2=hy-hr;yy2<=hy+hr;yy2++) for(var xx2=hx-hr;xx2<=hx+hr;xx2++)
      if(Math.hypot(xx2-hx,yy2-hy)<hr+rr(-.4,.4)) setT(xx2,yy2,RUBBLE);
    holes.push({x:hx*TILE,y:hy*TILE,r:hr*TILE*.8});
  }

  // our compound, squared off in the bottom-left corner
  fill(0,27,20,37,WALL); fill(1,28,19,36,FLOOR);
  fill(20,31,20,33,FLOOR);                       // east gate onto the support line
  fill(9,27,11,27,FLOOR);                        // north gate up to the works
  fill(10,28,10,32,WALL); fill(10,30,10,31,FLOOR);  // partition: quarters | launch bay
  dig(6,OSUP,2,28-OSUP+1);                       // stair from the support line
  dig(16,OSUP,2,28-OSUP+1);
  BASE={x0:-.4,y0:26.6,x1:20.4,y1:37.4};
  homeSpawn={x:7.5,y:32.5};
  shopPad={x:3.5*TILE,y:31.5*TILE};
  dronePad={x:15.5*TILE,y:30.5*TILE};
  padList=[{x:15.5*TILE,y:30.5*TILE,kind:'droneS',cd:0,cool:24,n:'SCOUT'},
           {x:15.5*TILE,y:35.5*TILE,kind:'drone', cd:0,cool:36,n:'FPV'},
           {x:17.5*TILE,y:32.5*TILE,standX:15.5*TILE,standY:32.5*TILE,table:1,kind:'droneL',cd:0,cool:54,n:'HEAVY'},
           {x:5.5*TILE, y:35.5*TILE,kind:'droneL',cd:0,cool:62,n:'MOBILE',mobile:1}];
  setupTruck([[34,30],[42,24],[38,17],[30,26]]);
  baseFlags=[{x:.6*TILE,y:26.4*TILE,h:60,crest:0},{x:20.4*TILE,y:26.4*TILE,h:60,crest:0},
             {x:10.5*TILE,y:38.4*TILE,h:54,crest:0},{x:21.4*TILE,y:32.5*TILE,h:62,crest:2}];
  addProp(1,28,3,1,'shoptable'); addProp(8,28,1,2,'shelf');
  addProp(1,33,3,1,'console');   addProp(6,29,3,1,'console');
  addProp(12,28,4,1,'console');  addProp(16,33,3,1,'console');
  addProp(11,35,2,1,'console');  addProp(17,29,2,1,'console');
  addProp(18,28,1,2,'dronerack');addProp(18,34,1,2,'dronerack');
  addProp(1,36,2,1,'ammocrate'); addProp(12,36,2,1,'ammocrate');
  addProp(4,28,1,1,'barrel');    addProp(11,34,1,1,'crateP');

  // two weapons depots, sealed, sitting in the solid ground between their lines
  depots.length=0;
  // Keep the ammunition dumps well north of the player's main compound.
  var DP2=[[9,6],[27,6]];
  for(var di2=0;di2<DP2.length;di2++){
    var dx2=DP2[di2][0], dy2=DP2[di2][1];
    fill(dx2,dy2,dx2+5,dy2+4,WALL);
    fill(dx2+1,dy2+1,dx2+4,dy2+3,FLOOR);
    setT(dx2+2,dy2+4,BROKEN); setT(dx2+3,dy2,BROKEN);      // firing slits, no door
    addProp(dx2+1,dy2+1,1,1,'ammocrate');
    addProp(dx2+4,dy2+3,1,1,'ammocrate');
    addProp(dx2-1,dy2+5,2,1,'sand',true); addProp(dx2+4,dy2+5,2,1,'sand',true);
    var DD={i:di2,x0:dx2,y0:dy2,x1:dx2+5,y1:dy2+4,
      cx:(dx2+3)*TILE,cy:(dy2+2.5)*TILE,blown:0,
      truckX:(dx2-2.15)*TILE,truckY:(dy2+2.55)*TILE};
    depots.push(DD);
    // A loading detail continuously moves ammunition from the parked truck.
    for(var dcw=0;dcw<3;dcw++) depotWorkers.push({depot:di2,depotWorker:1,
      x:DD.truckX+rr(-12,12),y:DD.truckY+rr(-8,8),fromX:DD.truckX+18,fromY:DD.truckY,
      toX:(dx2+.8)*TILE,toY:(dy2+2+dcw*.55)*TILE,trip:dcw/3,dir:1,
      ang:0,walk:rr(0,6.28),amt:1,carry:dcw!==2,sid:5200+di2*70+dcw*13,alive:1});
    // four AA mounts covering the approaches
    var AAP=[[dx2-2,dy2-1],[dx2+7,dy2-1],[dx2-2,dy2+5],[dx2+7,dy2+5]];
    for(var ai=0;ai<AAP.length;ai++){
      var ax9=AAP[ai][0], ay9=AAP[ai][1];
      fill(ax9,ay9,ax9+1,ay9+1,FLOOR);
      aaGuns.push({depot:di2,x:(ax9+1)*TILE,y:(ay9+1)*TILE,ang:rr(0,6.283),
        cd:rr(.2,1.2),burst:0,hp:110,mx:110,hurt:0,spin:0});
    }
  }

  // Two sealed enemy headquarters. Each holds three captured allied soldiers.
  var TB=[[38,2],[38,15]];
  for(var ti=0;ti<TB.length;ti++){
    var ex=TB[ti][0], ey=TB[ti][1];
    fill(ex,ey,ex+9,ey+8,WALL); fill(ex+1,ey+1,ex+8,ey+7,FLOOR);
    setT(ex+4,ey+8,BROKEN); setT(ex+5,ey+8,BROKEN);
    setT(ex,ey+4,BROKEN);   setT(ex+9,ey+4,BROKEN);
    addProp(ex+1,ey+1,1,1,'crateP'); addProp(ex+8,ey+7,1,1,'barrel');
    var B2={i:ti,x0:ex,y0:ey,x1:ex+9,y1:ey+8,fx:(ex+4.5)*TILE,fy:(ey+4.5)*TILE};
    bases.push(B2);
    flags.push({x:B2.fx,y:B2.fy,base:ti,state:'idle',p:0,wave:rr(0,3),
                heap:null,contest:0,assault:0});
    var RG={base:ti,x:(ex+2.5)*TILE,y:(ey+6.25)*TILE,state:'held',p:0,home:0,total:3};
    rescueGroups.push(RG);
    var CO=[[-12,4],[12,4],[0,-9]];
    for(var ci=0;ci<CO.length;ci++) captives.push({captive:1,group:ti,state:'held',
      x:RG.x+CO[ci][0],y:RG.y+CO[ci][1],ang:Math.PI/2+rr(-.16,.16),walk:rr(0,6.28),amt:0,
      path:null,pi:0,slot:ci,sid:2100+ti*17+ci*43});
    dig(ex-3,ey+3,4,2);                            // sap up to the west wall
    if(ti===0) dig(ex-3,TSUP,2,ey+3-TSUP+2);
    else dig(ex-3,ey+3,2,OFRONT-(ey+3)+2);         // lower base joins the front line
  }

  for(var pb=0;pb<70;pb++){
    var px2=ri(3,46), py2=ri(2,36);
    if(T(px2,py2)===WALL&&!blocksMove(T(px2,py2+1))&&Math.random()<.5) addProp(px2,py2,2,1,'sand',true);
  }
  for(var wq=0;wq<22;wq++){
    var wx2=ri(5,45), wy2=ri(11,26);
    if(T(wx2,wy2)===WALL) wires.push({x:wx2,y:wy2,a:rr(0,3.14)});
  }
  for(var dbx=0;dbx<MW;dbx++) for(var dby=0;dby<MH;dby++)
    if(T(dbx,dby)===FLOOR&&(dbx+dby)%3===0) duck.push([dbx,dby]);

  SPAWNS=[[5,TFRONT],[14,TFRONT],[23,TFRONT],[32,TFRONT],[41,TFRONT],
          [5,TSUP],[18,TSUP],[30,TSUP],[44,TSUP],[26,TFRONT]];
  placeFires(); buildStatic(); initWallHP();
}
/* ============================ LEVEL 3 — THE BLACK SEA ============================ */
function waterNear(x,y){
  for(var r=0;r<26;r++) for(var a=0;a<12;a++){
    var ax=x+Math.cos(a/12*6.283)*r*TILE*.6, ay=y+Math.sin(a/12*6.283)*r*TILE*.6;
    if(ax>20&&ay>20&&ax<WW-20&&ay<WH-20&&isWater(ax,ay)) return {x:ax,y:ay};
  }
  return {x:x,y:y};
}
function buildSea(){
  seed=7300+level*17;
  setMapSize(98,74,true);
  grid.fill(WATER); props.length=0; holes.length=0; roads.length=0;
  duck.length=0; wires.length=0; bunkers.length=0; bases.length=0; flags.length=0;
  edrones.length=0; emps.length=0; ships.length=0; missiles.length=0; wakes.length=0; seaMines.length=0;
  baseHP=baseMX=400;

  // ---- our enlarged headland, south-west
  fill(2,38,41,73,EXT);
  for(var cy=38;cy<=73;cy++) for(var cx=2;cx<=41;cx++){           // ragged coastline
    var edge=Math.min(cx-2,cy-38,41-cx,73-cy);
    if(edge<2&&Math.random()<.5) setT(cx,cy,WATER);
  }
  fill(5,56,26,70,EXT);
  // the compound itself
  fill(6,57,24,69,WALL); fill(7,58,23,68,FLOOR);
  fill(13,69,15,69,FLOOR); fill(24,62,24,63,FLOOR);         // south and east doors
  fill(15,58,15,63,WALL); fill(15,60,15,61,FLOOR);          // internal partition
  fill(25,58,29,68,EXT);                                    // the hard standing
  BASE={x0:4.5,y0:54.5,x1:30.5,y1:71.5};
  homeSpawn={x:11.5,y:63.5};
  shopPad={x:9.5*TILE,y:60.5*TILE};
  dronePad={x:19.5*TILE,y:60.5*TILE};
  setupTruck(null);
  padList=[{x:19.5*TILE,y:60.5*TILE,kind:'droneS',cd:0,cool:22,n:'SCOUT'},
           {x:19.5*TILE,y:66.5*TILE,kind:'drone', cd:0,cool:34,n:'FPV'},
           {x:11.5*TILE,y:66.5*TILE,kind:'droneL',cd:0,cool:50,n:'HEAVY'}];
  seaPad={x:32.5*TILE,y:61.5*TILE};
  jetty={x:29.5*TILE,y:65.5*TILE};
  var gb=waterNear(jetty.x+34,jetty.y);
  gunboat={x:gb.x,y:gb.y,ang:-1.2,vx:0,vy:0,hp:340,mx:340,cd:0,turret:-1.2,wake:0,hurt:0};                              // slipway on the east shore
  // Wide, continuous launch basin and exit channel. The old one-tile gap
  // could trap the USV against the port wall, especially on touch controls.
  fill(30,57,44,70,WATER); fill(25,58,29,68,EXT);
  addProp(7,58,3,1,'shoptable');  addProp(23,58,1,2,'shelf');
  addProp(8,61,1,1,'barrel');
  addProp(10,58,4,1,'console');   addProp(16,58,4,1,'console');
  addProp(7,64,4,1,'console');    addProp(21,64,2,1,'console');
  addProp(22,59,1,2,'dronerack'); addProp(22,66,1,2,'dronerack');
  addProp(7,66,1,2,'usvrack');    addProp(25,64,1,2,'usvrack');
  addProp(13,67,3,1,'ammocrate'); addProp(26,59,2,2,'ammocrate');
  addProp(17,62,2,1,'ammocrate'); addProp(26,66,3,1,'usvrack');
  addProp(4,39,3,1,'sand',true); addProp(14,39,3,1,'sand',true);
  addProp(3,44,1,3,'sand',true); addProp(17,43,1,3,'sand',true);
  addProp(5,49,2,1,'block');    addProp(14,49,2,1,'block');
  baseFlags=[{x:6.4*TILE,y:56.4*TILE,h:64,crest:0},{x:24.4*TILE,y:56.4*TILE,h:64,crest:0},
             {x:15.5*TILE,y:71.4*TILE,h:58,crest:0},{x:30.4*TILE,y:62.5*TILE,h:64,crest:2}];

  // ---- a couple of rocky islets to break up the water
  var ROCK=[[42,28,4],[34,48,4],[68,12,3],[36,36,3],[58,58,4],[80,40,3],[62,20,2],[76,64,3]];
  for(var r2=0;r2<ROCK.length;r2++){
    var R2=ROCK[r2];
    for(var ry=R2[1]-R2[2];ry<=R2[1]+R2[2];ry++)
      for(var rx=R2[0]-R2[2];rx<=R2[0]+R2[2];rx++)
        if(Math.hypot(rx-R2[0],ry-R2[1])<R2[2]+rr(-.5,.5)) setT(rx,ry,RUBBLE);
  }
  // Contact mines sit in open water, well clear of the home port channel.
  var MINE_POS=[[48,12],[59,31],[72,27],[84,47],[53,64],[89,17],[70,60],[43,25],[78,68],[92,37]];
  for(var mn0=0;mn0<MINE_POS.length;mn0++){
    var mp0=waterNear(MINE_POS[mn0][0]*TILE,MINE_POS[mn0][1]*TILE);
    if(Math.hypot(mp0.x-seaPad.x,mp0.y-seaPad.y)>430)
      seaMines.push({x:mp0.x,y:mp0.y,bob:rr(0,6.283),dead:0});
  }

  // ---- the fleet
  var LANES=[
    [[48,8],[82,8],[88,26],[56,20]],
    [[70,36],[90,46],[76,62],[60,42]],
    [[36,18],[60,6],[80,18],[54,26]],
    [[82,54],[94,38],[74,28],[86,62]],
    [[48,66],[74,70],[90,60],[64,48]]
  ];
  var CLASS=[{n:'CRUISER',hp:520,len:6,w:2.2},{n:'FRIGATE',hp:380,len:5,w:2},
             {n:'CORVETTE',hp:300,len:4,w:1.8},{n:'FRIGATE',hp:380,len:5,w:2},
             {n:'LANDING SHIP',hp:460,len:6,w:2.4}];
  function openWater(tx,ty,len){                    // shove a waypoint out to water with room
    var best=null,bd=1e9;
    for(var rr7=0;rr7<26;rr7++) for(var aa7=0;aa7<16;aa7++){
      var qx=tx+Math.cos(aa7/16*6.283)*rr7, qy=ty+Math.sin(aa7/16*6.283)*rr7;
      if(qx<4||qy<4||qx>MW-5||qy>MH-5) continue;
      var ok=true;
      for(var cl=-len;cl<=len;cl++) for(var cw=-2;cw<=2;cw++)
        if(T(Math.round(qx+cl),Math.round(qy+cw))!==WATER){ ok=false; break; }
      if(!ok) continue;
      var dd7=Math.hypot(qx-tx,qy-ty);
      if(dd7<bd){ bd=dd7; best=[Math.round(qx),Math.round(qy)]; }
    }
    return best||[tx,ty];
  }
  for(var sI=0;sI<5;sI++){
    var C2=CLASS[sI], L=LANES[sI];
    for(var wq7=0;wq7<L.length;wq7++) L[wq7]=openWater(L[wq7][0],L[wq7][1],Math.ceil(C2.len*.6));
    ships.push({i:sI,name:C2.n,hp:C2.hp,mx:C2.hp,len:C2.len*TILE,wid:C2.w*TILE,
      x:(L[0][0]+.5)*TILE,y:(L[0][1]+.5)*TILE,ang:Math.atan2(L[1][1]-L[0][1],L[1][0]-L[0][0]),lane:L,wp:1,spd:rr(26,40),
      aa:rr(.4,1.6),gun:rr(.6,2),msl:rr(8,22),hurt:0,wake:0,sink:0,salvo:(C2.hp>440?2:1)});
  }
  // Two assault transports beach at separate points and unload onto the island.
  ships.push({i:5,name:'LANDING SHIP A',hp:420,mx:420,len:5.5*TILE,wid:2.3*TILE,
    x:52*TILE,y:16*TILE,ang:Math.PI/2,lane:[],wp:0,spd:34,aa:9,gun:9,msl:99,hurt:0,wake:0,sink:0,salvo:0,
    lander:1,landX:13*TILE,landY:35*TILE,shoreX:13*TILE,shoreY:40*TILE,landed:0,deployed:0,deployT:0});
  ships.push({i:6,name:'LANDING SHIP B',hp:420,mx:420,len:5.5*TILE,wid:2.3*TILE,
    x:86*TILE,y:58*TILE,ang:Math.PI,lane:[],wp:0,spd:36,aa:9,gun:9,msl:99,hurt:0,wake:0,sink:0,salvo:0,
    lander:1,landX:44*TILE,landY:58*TILE,shoreX:39*TILE,shoreY:58*TILE,landed:0,deployed:0,deployT:0});

  SPAWNS=[[44,8],[80,10],[68,36],[34,18],[82,56]];
  placeFires(); buildStatic(); initWallHP();
}
/* ======================= LEVEL 6 — RED SQUARE ======================= */
function buildRedSquare(){
  seed=11620; setMapSize(68,52,false); grid.fill(EXT);
  redBossSpawned=0; redBossDefeated=0;
  baseHP=baseMX=420; baseFlash=0;
  props.length=0; holes.length=0; roads.length=0; duck.length=0; wires.length=0; bunkers.length=0; bases.length=0; flags.length=0;
  aircraft.length=0; motorcade.length=0; refineries.length=0; sams.length=0; samShots.length=0; ships.length=0; missiles.length=0; aaGuns.length=0;
  // Forward operations base south-west of the fortified square.
  fill(2,40,21,50,WALL); fill(3,41,20,49,FLOOR); fill(10,40,13,40,FLOOR); fill(21,45,21,47,FLOOR);
  BASE={x0:1.6,y0:39.6,x1:21.4,y1:50.4}; homeSpawn={x:9.5,y:46.5}; shopPad={x:5.5*TILE,y:44.5*TILE};
  padList=[{x:17*TILE,y:43*TILE,kind:'droneS',cd:0,cool:20,n:'SCOUT'},
    {x:17*TILE,y:48*TILE,kind:'drone',cd:0,cool:28,n:'FPV'},
    {x:10.5*TILE,y:49*TILE,kind:'droneL',cd:0,cool:44,n:'HEAVY'}];
  addProp(3,42,4,1,'console'); addProp(8,42,3,1,'console'); addProp(3,47,3,1,'shoptable'); addProp(15,41,2,1,'console');
  baseFlags=[{x:2.5*TILE,y:39.5*TILE,h:60,crest:0},{x:21.5*TILE,y:39.5*TILE,h:60,crest:0}]; setupTruck(null);
  // Broad ceremonial approaches surrounding a large red-brick plaza.
  roads.push([27,6,65,36]); roads.push([27,37,65,40]); roads.push([24,6,27,40]);
  var targets=[[37,16,'RED SQUARE CATHEDRAL',11,10,'cathedral'],[55,27,'KREMLIN COMPLEX',15,10,'kremlin']];
  for(var rb=0;rb<targets.length;rb++){
    var BT=targets[rb],cx=BT[0]*TILE,cy=BT[1]*TILE;
    refineries.push({i:rb,cx:cx,cy:cy,name:BT[2],bw:BT[3]*TILE,bh:BT[4]*TILE,style:BT[5],hp:720,mx:720,dead:0,burn:0,msl:9999});
    var rsam=[[cx-BT[3]*18,cy-BT[4]*18],[cx+BT[3]*18,cy+BT[4]*18]];
    for(var rs=0;rs<rsam.length;rs++) sams.push({building:rb,x:rsam[rs][0],y:rsam[rs][1],ang:rr(0,6.28),cd:rr(2,6),hp:110,mx:110,hurt:0,rack:2});
  }
  SPAWNS=[[26,16],[44,7],[64,15],[31,35],[53,38],[65,35]];
  placeFires(); buildStatic();
  // Red paving and pale stone lines make the central square visually distinct.
  sc.fillStyle='#7a3932'; sc.fillRect(28*TILE,6*TILE,37*TILE,31*TILE);
  sc.strokeStyle='rgba(226,192,170,.22)'; sc.lineWidth=1;
  for(var pxr=28;pxr<=65;pxr+=2){ sc.beginPath(); sc.moveTo(pxr*TILE,6*TILE); sc.lineTo(pxr*TILE,37*TILE); sc.stroke(); }
  for(var pyr=6;pyr<=37;pyr+=2){ sc.beginPath(); sc.moveTo(28*TILE,pyr*TILE); sc.lineTo(65*TILE,pyr*TILE); sc.stroke(); }
  // Dense paving texture, stone sidewalks and formal road approaches.
  for(var cob=0;cob<1500;cob++){
    var cbx=rr(28*TILE,65*TILE),cby=rr(6*TILE,37*TILE);
    sc.fillStyle='rgba('+ri(130,190)+','+ri(72,112)+','+ri(62,92)+','+rr(.08,.22)+')'; sc.fillRect(cbx,cby,rr(2,7),rr(1,3));
  }
  sc.fillStyle='#4a4c4e'; sc.fillRect(24*TILE,5*TILE,4*TILE,35*TILE); sc.fillRect(24*TILE,37*TILE,42*TILE,4*TILE);
  // Connected inner streets give the motorcade several visible routes through the district.
  sc.fillRect(30*TILE,9*TILE,34*TILE,3*TILE); sc.fillRect(30*TILE,24*TILE,34*TILE,3*TILE);
  sc.fillRect(31*TILE,9*TILE,3*TILE,28*TILE); sc.fillRect(62*TILE,9*TILE,3*TILE,28*TILE);
  sc.fillStyle='#c6beb0'; sc.fillRect(27*TILE,5*TILE,TILE,35*TILE); sc.fillRect(24*TILE,37*TILE,42*TILE,TILE);
  sc.fillStyle='#eee8d8';
  for(var lm=0;lm<16;lm++){ sc.fillRect(25.8*TILE,(6+lm*2)*TILE,4,25); sc.fillRect((26+lm*2.45)*TILE,39*TILE,27,4); }
  // Zebra crossings at the main entrances.
  for(var zc=0;zc<7;zc++){ sc.fillRect((26+zc*.62)*TILE,35.8*TILE,13,2.1*TILE); sc.fillRect(26.2*TILE,(15+zc*.62)*TILE,2.1*TILE,13); }
  // Lamps, bollards, benches and clipped trees line the ceremonial routes.
  for(var decoR=0;decoR<14;decoR++){
    var side=decoR%2,dxr=(side?66:27.2)*TILE,dyr=(7+Math.floor(decoR/2)*4.1)*TILE;
    sc.fillStyle='rgba(0,0,0,.28)'; sc.beginPath(); sc.ellipse(dxr+7,dyr+7,10,5,.5,0,6.3); sc.fill();
    sc.fillStyle='#27302c'; sc.beginPath(); sc.arc(dxr,dyr,6,0,6.3); sc.fill();
    sc.fillStyle='#e5c56c'; sc.beginPath(); sc.arc(dxr,dyr,2.4,0,6.3); sc.fill();
  }
  for(var tr=0;tr<8;tr++){
    var trx=(30+tr*4.6)*TILE,tryy=(tr%2?36.2:6.7)*TILE;
    sc.fillStyle='rgba(0,0,0,.22)'; sc.beginPath(); sc.ellipse(trx+6,tryy+8,18,10,.4,0,6.3); sc.fill();
    sc.fillStyle='#314e3d'; sc.beginPath(); sc.arc(trx,tryy,14,0,6.3); sc.fill();
    sc.fillStyle='#4f7355'; sc.beginPath(); sc.arc(trx-4,tryy-5,9,0,6.3); sc.fill();
    sc.fillStyle='#b6aa91'; sc.fillRect(trx-2,tryy+10,4,9);
  }
  for(var bol=0;bol<15;bol++){
    var bxr=(29+bol*2.35)*TILE,byr=37.5*TILE;
    sc.fillStyle='#343638'; sc.beginPath(); sc.arc(bxr,byr,4,0,6.3); sc.fill(); sc.fillStyle='#c7a94c'; sc.beginPath(); sc.arc(bxr,byr,1.4,0,6.3); sc.fill();
  }
  // Moving black motorcade uses the inner street loop and periodically deploys security teams.
  var carRoute=[[31*TILE,10.5*TILE],[63*TILE,10.5*TILE],[63*TILE,25.5*TILE],[63*TILE,38.5*TILE],[31*TILE,38.5*TILE],[31*TILE,25.5*TILE]];
  for(var car=0;car<6;car++) motorcade.push({i:car,x:(31+car*4.8)*TILE,y:38.5*TILE,ang:Math.PI,hp:180,mx:180,dead:0,route:carRoute,wp:4,stop:rr(0,3),checks:0,hurt:0});
  // Kremlin wall and corner towers establish a separate fortified complex beside the cathedral.
  sc.fillStyle='rgba(0,0,0,.32)'; rrect(sc,47*TILE+14,21*TILE+18,18*TILE,15*TILE,6); sc.fill();
  sc.fillStyle='#8e3d35'; rrect(sc,47*TILE,21*TILE,18*TILE,15*TILE,5); sc.fill(); outl(sc,'#3b2723',3);
  sc.fillStyle='#d8c9b2'; for(var kr=0;kr<12;kr++) sc.fillRect((47.3+kr*1.48)*TILE,21*TILE,18,8);
  sc.fillStyle='#6a302c'; sc.fillRect(48*TILE,33.5*TILE,16*TILE,2.2*TILE);
  for(var kt=0;kt<4;kt++){
    var ktx=(kt%2?63:49)*TILE,kty=(kt<2?22.5:34)*TILE;
    sc.fillStyle='#a94b40'; rrect(sc,ktx-16,kty-20,32,40,4); sc.fill(); outl(sc,'#3b2723',2);
    sc.fillStyle='#1f654d'; sc.beginPath(); sc.moveTo(ktx,kty-48); sc.lineTo(ktx+22,kty-20); sc.lineTo(ktx-22,kty-20); sc.closePath(); sc.fill(); outl(sc,'#173b31',1.6);
    sc.fillStyle='#c7a94c'; sc.beginPath(); sc.arc(ktx,kty-49,3,0,6.3); sc.fill();
  }
  sc.fillStyle='#f0dfc5'; sc.font='bold 10px Arial'; sc.textAlign='center'; sc.fillText('KREMLIN',56*TILE,35.5*TILE); sc.textAlign='start';
  initWallHP();
}

/* ======================= LEVEL 5 — THE AIRFIELD ======================= */
function buildAirfield(){
  seed=9900+level*19; setMapSize(82,58,false); grid.fill(EXT);
  airAssaultWave=0; airAssaultT=18; airfieldBossSpawned=0; airfieldBossDefeated=0; miniNukes.length=0;
  props.length=0; holes.length=0; roads.length=0; duck.length=0; wires.length=0; bunkers.length=0; bases.length=0; flags.length=0;
  aircraft.length=0; sams.length=0; samShots.length=0; refineries.length=0; ships.length=0; missiles.length=0; aaGuns.length=0;
  // home operations base
  fill(2,43,24,56,WALL); fill(3,44,23,55,FLOOR); fill(12,43,14,43,FLOOR); fill(24,48,24,50,FLOOR);
  BASE={x0:1.6,y0:42.6,x1:24.4,y1:56.4}; homeSpawn={x:10.5,y:50.5}; shopPad={x:5.5*TILE,y:48.5*TILE};
  padList=[{x:19.5*TILE,y:46.5*TILE,kind:'droneS',cd:0,cool:20,n:'SCOUT'},
    {x:19.5*TILE,y:52.5*TILE,kind:'drone',cd:0,cool:28,n:'FPV'},
    {x:12.5*TILE,y:54*TILE,kind:'droneL',cd:0,cool:44,n:'HEAVY'}];
  addProp(3,45,4,1,'console'); addProp(8,45,3,1,'console'); addProp(3,51,3,1,'shoptable');
  addProp(16,44,2,1,'console'); addProp(21,44,1,2,'dronerack'); addProp(21,53,1,2,'dronerack');
  addProp(5,54,2,1,'ammocrate'); addProp(14,45,1,1,'barrel'); setupTruck(null);
  baseFlags=[{x:2.5*TILE,y:42.5*TILE,h:60,crest:0},{x:24.5*TILE,y:42.5*TILE,h:60,crest:0}];
  // two broad concrete runways and taxiways
  roads.push([29,8,77,14]); roads.push([29,27,77,33]); roads.push([35,14,39,27]); roads.push([65,14,69,27]);
  fill(29,8,77,14,EXT); fill(29,27,77,33,EXT); fill(35,14,39,27,EXT); fill(65,14,69,27,EXT);
  // Three North Korean cargo aircraft actively unloading weapons and troops.
  var AP=[[40,11,0,'NK CARGO 1'],[62,11,0,'NK CARGO 2'],[56,30,0,'NK CARGO 3']];
  for(var ai=0;ai<AP.length;ai++){
    var A=AP[ai]; aircraft.push({i:ai,x:A[0]*TILE,y:A[1]*TILE,ang:A[2],name:A[3],cargo:true,hp:620,mx:620,dead:0,hurt:0,unload:1+ai*.45,deployed:0,weaponPile:2});
    var aa=[[A[0]-5,A[1]-4],[A[0]+5,A[1]+4]];
    for(var sj=0;sj<aa.length;sj++) sams.push({aircraft:ai,x:aa[sj][0]*TILE,y:aa[sj][1]*TILE,ang:rr(0,6.28),cd:rr(2,6),hp:95,mx:95,hurt:0,rack:2});
    // Separate unloading areas make each cargo operation look different.
    for(var cr=0;cr<6;cr++) addProp(A[0]+7+(cr%2)*2,A[1]+3+Math.floor(cr/2)*2,1,1,'ammocrate');
  }
  SPAWNS=[[34,18],[48,20],[62,20],[74,20],[32,38],[52,39],[72,39]];
  placeFires(); buildStatic(); initWallHP();
}
/* ======================= LEVEL 4 — THE REFINERIES ======================= */
function buildOil(){
  seed=8800+level*13;
  setMapSize(70,52,false);
  grid.fill(EXT); props.length=0; holes.length=0; roads.length=0;
  duck.length=0; wires.length=0; bunkers.length=0; bases.length=0; flags.length=0;
  edrones.length=0; emps.length=0; depots.length=0; depotWorkers.length=0; aaGuns.length=0;
  refineries.length=0; sams.length=0; samShots.length=0; smog=0;
  ships.length=0; missiles.length=0; wakes.length=0; floaters.length=0;
  baseHP=baseMX=460;

  // ---- rivers winding across the country
  function river(pts,w){
    for(var i=0;i<pts.length-1;i++){
      var a=pts[i], b=pts[i+1];
      for(var t=0;t<=1;t+=.01){
        var cx=a[0]+(b[0]-a[0])*t, cy=a[1]+(b[1]-a[1])*t;
        var ww=w+Math.sin(t*9+i)*.8;
        for(var oy=-ww;oy<=ww;oy++) for(var ox=-ww;ox<=ww;ox++)
          if(ox*ox+oy*oy<=ww*ww) setT(Math.round(cx+ox),Math.round(cy+oy),WATER);
      }
    }
  }
  river([[0,30],[14,27],[26,32],[38,26],[52,30],[69,24]],1.6);
  river([[30,51],[33,40],[44,34],[46,20],[54,8],[62,0]],1.4);
  // ---- roads between the plants
  roads.push([2,44,67,46]); roads.push([40,2,42,47]);
  fill(2,44,67,46,EXT); fill(40,2,42,47,EXT);

  // ---- forest
  function wood(cx,cy,r,n){
    for(var i=0;i<n;i++){
      var a=rr(0,6.283), d=Math.sqrt(Math.random())*r;
      var tx=Math.round(cx+Math.cos(a)*d), ty=Math.round(cy+Math.sin(a)*d);
      if(tx<1||ty<1||tx>MW-2||ty>MH-2) continue;
      if(T(tx,ty)!==EXT) continue;
      addProp(tx,ty,1,1,'tree');
    }
  }
  wood(16,14,9,50); wood(30,10,7,34); wood(54,18,8,42); wood(24,38,8,40);
  wood(58,40,7,34); wood(8,34,5,20); wood(44,44,6,26); wood(64,8,5,18);

  // ---- our base, bottom-left: a big operations compound
  fill(2,36,26,50,WALL); fill(3,37,25,49,FLOOR);
  fill(13,36,15,36,FLOOR);            // north gate
  fill(26,42,26,44,FLOOR);            // east gate
  fill(9,50,11,50,FLOOR);             // south gate
  fill(11,37,11,44,WALL); fill(11,40,11,41,FLOOR);      // an internal partition
  fill(18,44,18,49,WALL); fill(18,46,18,47,FLOOR);
  BASE={x0:1.6,y0:35.6,x1:26.4,y1:50.4};
  homeSpawn={x:14.5,y:46.5};
  shopPad={x:5.5*TILE,y:47.5*TILE};
  dronePad={x:21.5*TILE,y:39.5*TILE};
  seaPad=null; jetty=null; gunboat=null;

  // operations wing, west of the partition
  addProp(3,38,4,1,'console');  addProp(3,41,4,1,'console');
  addProp(8,38,1,3,'console');  addProp(4,44,3,1,'shoptable');
  addProp(3,46,1,2,'dronerack');addProp(9,44,2,1,'ammocrate');
  addProp(8,47,2,1,'console');  addProp(4,49,2,1,'ammocrate');
  addProp(9,37,1,1,'barrel');
  // hangar and launch apron, east of it
  addProp(12,37,4,1,'console');
  addProp(23,37,2,2,'dronerack');addProp(23,41,2,2,'dronerack');
  addProp(12,43,2,1,'ammocrate');addProp(19,49,3,1,'ammocrate');
  addProp(24,45,1,3,'shelf');   addProp(12,48,1,1,'barrel');
  addProp(16,41,2,1,'console'); addProp(20,48,1,1,'crateP');
  // three big pads out on the apron, well apart
  padList=[{x:15.5*TILE,y:39.5*TILE,kind:'droneS',cd:0,cool:20,n:'SCOUT'},
           {x:19.5*TILE,y:44.5*TILE,kind:'drone', cd:0,cool:28,n:'FPV'},
           {x:22.5*TILE,y:47.5*TILE,kind:'droneL',cd:0,cool:42,n:'HEAVY'},
           {x:15.5*TILE,y:47.5*TILE,kind:'droneL',cd:0,cool:58,n:'MOBILE',mobile:1}];
  setupTruck([[41,24],[41,36],[30,30],[52,28]]);
  dronePad=padList[0];
  // defences
  addProp(2,34,3,1,'sand',true);  addProp(23,34,3,1,'sand',true);
  addProp(1,38,1,3,'sand',true);  addProp(27,40,1,3,'sand',true);
  addProp(27,47,1,1,'hedgehog');  addProp(1,47,1,1,'hedgehog');
  addProp(13,52,1,1,'hedgehog');  addProp(19,34,1,1,'hedgehog');
  addProp(6,51,2,1,'block');      addProp(20,51,2,1,'block');
  baseFlags=[{x:3.4*TILE,y:36.6*TILE,h:62,crest:0},{x:25.4*TILE,y:36.6*TILE,h:62,crest:0},
             {x:14.5*TILE,y:51.2*TILE,h:56,crest:0},{x:27.4*TILE,y:44.4*TILE,h:62,crest:2}];

  // ---- six refineries, each with its own SAM ring
  var RF=[[22,8],[46,6],[62,14],[20,26],[54,30],[34,42]];
  for(var ri2=0;ri2<RF.length;ri2++){
    var rx=RF[ri2][0], ry=RF[ri2][1];
    for(var cy2=ry-3;cy2<=ry+3;cy2++) for(var cx2=rx-4;cx2<=rx+4;cx2++)
      if(T(cx2,cy2)===WATER) setT(cx2,cy2,EXT);
    addProp(rx-4,ry-2,2,2,'oiltank');  addProp(rx-1,ry-3,2,2,'oiltank');
    addProp(rx+2,ry-1,2,2,'oiltank');  addProp(rx-3,ry+1,2,2,'oiltank');
    addProp(rx+1,ry+2,2,2,'oiltank');
    addProp(rx,ry,1,2,'stack');        addProp(rx-2,ry-1,1,1,'pipes');
    addProp(rx+3,ry+2,1,1,'pipes');
    refineries.push({i:ri2,cx:(rx+.5)*TILE,cy:(ry+.5)*TILE,x0:rx-5,y0:ry-4,x1:rx+5,y1:ry+4,
      hp:420,mx:420,dead:0,burn:0,msl:rr(20,50)});
    var SP=[[rx-6,ry-4],[rx+6,ry-4],[rx-6,ry+4],[rx+6,ry+4],[rx,ry-6]];
    var nSam=3+(ri2%2);
    for(var si=0;si<nSam;si++){
      var sx2=SP[si][0], sy2=SP[si][1];
      if(sx2<2||sy2<2||sx2>MW-3||sy2>MH-3) continue;
      for(var cy3=sy2-1;cy3<=sy2+1;cy3++) for(var cx3=sx2-1;cx3<=sx2+1;cx3++) setT(cx3,cy3,EXT);
      sams.push({ref:ri2,x:(sx2+.5)*TILE,y:(sy2+.5)*TILE,ang:rr(0,6.283),
        cd:rr(1,5),hp:95,mx:95,hurt:0,rack:2});
    }
  }

  SPAWNS=[[22,12],[46,10],[60,18],[20,30],[52,34],[34,46],[40,20],[30,20]];
  placeFires(); buildStatic(); initWallHP();
}
function openTile(tx,ty){
  for(var r=0;r<20;r++) for(var a=0;a<14;a++){
    var qx=Math.round(tx+Math.cos(a/14*6.283)*r), qy=Math.round(ty+Math.sin(a/14*6.283)*r);
    if(qx<2||qy<2||qx>MW-3||qy>MH-3) continue;
    if(blocksMove(T(qx,qy))||inBase(qx*TILE,qy*TILE)) continue;
    var clear=true;
    for(var oy=-1;oy<=1&&clear;oy++) for(var ox=-1;ox<=1;ox++)
      if(blocksMove(T(qx+ox,qy+oy))){ clear=false; break; }
    if(clear) return [qx,qy];
  }
  return null;
}
function setupTruck(anchors){
  truck=null; truckRoute.length=0;
  if(!anchors||mapKind==='sea') return;
  for(var i=0;i<anchors.length;i++){
    var w=openTile(anchors[i][0],anchors[i][1]);
    if(w) truckRoute.push(w);
  }
  if(truckRoute.length<2) return;
  truck={x:(truckRoute[0][0]+.5)*TILE,y:(truckRoute[0][1]+.5)*TILE,ang:0,
    wp:1,path:null,pi:0,hp:220,mx:220,hurt:0,dust:0,wheel:0,down:0,grace:12};
}
function updateTruck(dt){
  if(!truck) return;
  var K=truck;
  if(K.down>0){                                   // knocked out, a replacement rolls up
    K.down-=dt;
    if(Math.random()<.5&&plume.length<300)
      plume.push({x:K.x+rr(-14,14),y:K.y+rr(-10,10),vx:rr(-10,10),vy:-rr(18,44),
        life:rr(2,4),max:4,s:rr(8,18),hot:.5});
    if(K.down<=0){
      var st=truckRoute[ri(0,truckRoute.length-1)];
      K.x=(st[0]+.5)*TILE; K.y=(st[1]+.5)*TILE; K.hp=K.mx; K.path=null; K.grace=6;
      banner('LAUNCH TRUCK BACK UP','',1.4);
    }
    return;
  }
  if(K.hurt>0) K.hurt-=dt;
  if(K.grace>0) K.grace=Math.max(0,K.grace-dt);
  var goal=truckRoute[K.wp%truckRoute.length];
  if(!K.path||K.pi>=K.path.length){
    K.path=findPath(Math.floor(K.x/TILE),Math.floor(K.y/TILE),goal[0],goal[1]);
    K.pi=1;
    if(!K.path){ K.wp++; return; }
  }
  while(K.pi<K.path.length-1&&Math.hypot(K.path[K.pi].x-K.x,K.path[K.pi].y-K.y)<26) K.pi++;
  var nx=K.path[K.pi].x, ny=K.path[K.pi].y;
  var a=Math.atan2(ny-K.y,nx-K.x), step=58*dt;
  var dA=((a-K.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
  K.ang+=Math.max(-2.4*dt,Math.min(2.4*dt,dA));
  var ox2=K.x, oy2=K.y;
  moveEnt({x:K.x,y:K.y,r:13,set:0},0,0);
  var tx2=K.x+Math.cos(K.ang)*step, ty2=K.y+Math.sin(K.ang)*step;
  if(!hitBox(tx2,K.y,13)) K.x=tx2;
  if(!hitBox(K.x,ty2,13)) K.y=ty2;
  if(Math.hypot(K.x-ox2,K.y-oy2)<step*.3){ K.path=null; K.wp++; }
  if(Math.hypot(K.x-goal[0]*TILE,K.y-goal[1]*TILE)<50){ K.wp++; K.path=null; }
  K.wheel+=dt*7; K.dust-=dt;
  if(K.dust<=0){ K.dust=.16; dustPuff(K.x-Math.cos(K.ang)*20,K.y-Math.sin(K.ang)*20,1,.5); }
}
function hurtTruck(dmg){
  if(!truck||truck.down>0||truck.grace>0) return;
  truck.hp-=dmg; truck.hurt=.15;
  if(truck.hp<=0){
    explode(truck.x,truck.y,110,20,true);
    for(var d=0;d<24;d++) launchPart(truck.x,truck.y,'debris',null,null,rr(0,6.283),rr(1,2));
    if(fires.length<16) fires.push({x:truck.x,y:truck.y,r:14,p:rr(0,6),life:30,sp:0});
    truck.down=28; banner('LAUNCH TRUCK HIT','',1.6); sfx('boom',.5);
  }
}
function drawTruck(c){
  if(!truck) return;
  var K=truck;
  if(K.x<cam.x-140||K.x>cam.x+VW+140||K.y<cam.y-140||K.y>cam.y+VH+140) return;
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(K.x+3,K.y+6,26,12,0,0,6.3); c.fill();
  c.save(); c.translate(K.x,K.y); c.rotate(K.ang);
  if(K.down>0) c.globalAlpha=.55;
  c.fillStyle='#2b2b26';                                   // wheels
  [[-16,-11],[-16,7],[4,-11],[4,7],[13,-11],[13,7]].forEach(function(w){
    c.save(); c.translate(w[0],w[1]); c.fillStyle='#1e1e1a';
    rrect(c,-4,0,8,5,2); c.fill(); outl(c,'#0d0d0a',1.2); c.restore(); });
  c.fillStyle=K.down>0?'#40382c':'#5b6349';                 // chassis
  rrect(c,-22,-10,44,20,3); c.fill(); outl(c,'#171a12',2.2);
  c.save(); rrect(c,-22,-10,44,20,3); c.clip();
  camoFleck(c,41,-22,-10,44,20,16,MC); c.restore();
  rrect(c,-22,-10,44,20,3); outl(c,'#171a12',2.2);
  c.fillStyle='#6f785c'; rrect(c,12,-9,10,18,3); c.fill(); outl(c,'#171a12',1.8);   // cab
  c.fillStyle='#2b3038'; rrect(c,18,-6,4,12,1.5); c.fill();
  c.fillStyle=K.down>0?'#3a3830':'#454d3a'; rrect(c,-20,-8,28,16,2); c.fill();      // launch bed
  if(K.down<=0){
    c.fillStyle='#39413a';                                                          // the rail and its bird
    c.save(); c.translate(-6,0); c.rotate(-.35);
    rrect(c,-10,-3,22,6,2); c.fill(); outl(c,'#171a12',1.6);
    c.strokeStyle='#8fa2ae'; c.lineWidth=1.8;
    c.beginPath(); c.moveTo(-4,-6); c.lineTo(4,-6); c.moveTo(-4,6); c.lineTo(4,6); c.stroke();
    c.fillStyle='#5b6570'; rrect(c,-3,-3.4,7,6.8,2); c.fill(); outl(c,'#12161a',1.4);
    c.fillStyle='#c0392b'; rrect(c,3,-2,3,4,1); c.fill();
    c.restore();
    c.fillStyle='#7fe8ff'; c.beginPath(); c.arc(-18,0,2.2,0,6.3); c.fill();          // uplink light
    c.strokeStyle='#c9d2d8'; c.lineWidth=1.4;
    c.beginPath(); c.moveTo(-20,-2); c.lineTo(-24,-12); c.stroke();
  }
  c.restore();
  if(K.hurt>0){ c.globalAlpha=Math.min(.6,K.hurt*5); c.fillStyle='#fff';
    c.beginPath(); c.ellipse(K.x,K.y,26,13,K.ang,0,6.3); c.fill(); c.globalAlpha=1; }
  c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(K.x-20,K.y-26,40,5);
  c.fillStyle=K.down>0?'#6a6a60':(K.hp>K.mx*.5?'#4fd08a':'#e2b13c');
  c.fillRect(K.x-19,K.y-25.2,38*Math.max(0,K.hp/K.mx),3);
  c.fillStyle='rgba(200,214,222,.75)'; c.font='bold 7px Arial'; c.textAlign='center';
  c.fillText(K.down>0?'RECOVERING '+Math.ceil(K.down)+'s':(K.grace>0?'DEPLOYING '+Math.ceil(K.grace)+'s':'LAUNCH TRUCK'),K.x,K.y-29);
  if(K.grace>0){ c.strokeStyle='rgba(127,232,255,'+(.35+Math.sin(now*5)*.15)+')'; c.lineWidth=2;
    c.beginPath(); c.ellipse(K.x,K.y,31,17,K.ang,0,6.3); c.stroke(); }
  c.textAlign='start';
}
function makePlayer(){
  var hs0=freeSpot(homeSpawn.x*TILE,homeSpawn.y*TILE);
  return {x:hs0.x, y:hs0.y, r:11, hp:upgHP, mx:upgHP, ap:0, ang:-1.57, face:-1.57,
    wep:'pistol', amt:0, mag:WEAPONS.pistol.mag, res:WEAPONS.pistol.res,
    guns:[{id:'pistol',mag:WEAPONS.pistol.mag,res:WEAPONS.pistol.res}], gi:0, cd:0, reload:0,
    nades:5, walk:0, hurt:0, dead:false, open:0, openC:null};
}
var ETYPE={
  rifleman:{hp:62, spd:74, dmg:7,  rof:1.45,burst:3, gap:.15, range:330, pref:190, col:'#5b6146', band:'#c0392b', spread:.17, spd2:400},
  rusher  :{hp:42, spd:122,dmg:5,  rof:1.25,burst:4, gap:.09, range:210, pref:90,  col:'#6b6d4c', band:'#d0453a', spread:.24, spd2:380},
  sniper  :{hp:48, spd:58, dmg:22, rof:3.0, burst:1, gap:0,   range:520, pref:400, col:'#4c563f', band:'#a8322a', spread:.035,spd2:620, laser:1},
  elite   :{hp:250,spd:70, dmg:11, rof:1.15,burst:3, gap:.12, range:350, pref:150, col:'#43483a', band:'#e2b13c', spread:.12, spd2:480},
  heavy   :{hp:170,spd:52, dmg:7,  rof:2.1, burst:1, gap:0,   range:190, pref:110, col:'#565a4a', band:'#e05038', spread:.34, spd2:380, pel:5}
};
function spawnEnemy(kind,x,y,dug,home,boss){
  var d=ETYPE[kind];
  var hp=dug?Math.round(d.hp*2.3):d.hp;
  if(boss) hp=Math.round(d.hp*2.4);
  var elite=(kind==='elite');
  enemies.push({k:kind,x:x,y:y,r:(boss||elite)?13:10,hp:hp,mx:hp,dug:!!dug,home:home||null,boss:!!boss,elite:elite,cd:rr(.4,1.6),bl:0,bt:0,ang:0,walk:0,hurt:0,
    aim:0, stag:0, acq:.55, amt:0, sid:Math.floor(Math.random()*9000), d:d, sep:{x:0,y:0}});
}

/* ---------- collision ---------- */
function solidAt(x,y){ return blocksMove(T(Math.floor(x/TILE),Math.floor(y/TILE))); }
function moveEnt(e,dx,dy){
  var i,k,off=[3,-3,6,-6,10,-10];
  if(dx!==0){
    if(!hitBox(e.x+dx,e.y,e.r)) e.x+=dx;
    else for(i=0;i<off.length;i++){ k=off[i];
      if(!hitBox(e.x,e.y+k,e.r)&&!hitBox(e.x+dx,e.y+k,e.r)){ e.y+=k*.3; e.x+=dx*.8; break; } }
  }
  if(dy!==0){
    if(!hitBox(e.x,e.y+dy,e.r)) e.y+=dy;
    else for(i=0;i<off.length;i++){ k=off[i];
      if(!hitBox(e.x+k,e.y,e.r)&&!hitBox(e.x+k,e.y+dy,e.r)){ e.x+=k*.3; e.y+=dy*.8; break; } }
  }
  e.x=Math.max(e.r,Math.min(WW-e.r,e.x)); e.y=Math.max(e.r,Math.min(WH-e.r,e.y));
}
function hitBox(x,y,r){
  var x0=Math.floor((x-r)/TILE), x1=Math.floor((x+r)/TILE), y0=Math.floor((y-r)/TILE), y1=Math.floor((y+r)/TILE);
  for(var yy=y0;yy<=y1;yy++) for(var xx=x0;xx<=x1;xx++) if(blocksMove(T(xx,yy))) return true;
  return false;
}
function segDist(px,py,x0,y0,x1,y1){
  var dx=x1-x0, dy=y1-y0, l2=dx*dx+dy*dy;
  var t=l2?Math.max(0,Math.min(1,((px-x0)*dx+(py-y0)*dy)/l2)):0;
  return Math.hypot(px-(x0+dx*t),py-(y0+dy*t));
}
function smokeBlocked(x0,y0,x1,y1){
  for(var i=0;i<smokes.length;i++){ var S2=smokes[i];
    if(S2.r>18&&segDist(S2.x,S2.y,x0,y0,x1,y1)<S2.r*.82) return true; }
  return false;
}
function los(x0,y0,x1,y1){
  var dx=x1-x0, dy=y1-y0, d=Math.hypot(dx,dy), st=Math.max(1,Math.floor(d/9));
  for(var i=1;i<st;i++){
    var x=x0+dx*i/st, y=y0+dy*i/st;
    if(blocksShot(T(Math.floor(x/TILE),Math.floor(y/TILE)))) return false;
  }
  return true;
}

/* ---------- flow field ---------- */
var flow, flowT=0, fq, dist;
function buildFlow(){
  dist.fill(-1);
  var src=(flag&&(flag.state==='lower'||flag.state==='raise'))?flag:player;
  var head=0,tail=0, sx=Math.floor(src.x/TILE), sy=Math.floor(src.y/TILE);
  if(blocksMove(T(sx,sy))) return;
  dist[sy*MW+sx]=0; fq[tail++]=sy*MW+sx;
  var dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(head<tail){
    var c=fq[head++], cx=c%MW, cy=(c/MW)|0;
    for(var i=0;i<8;i++){
      var nx=cx+dirs[i][0], ny=cy+dirs[i][1];
      if(nx<0||ny<0||nx>=MW||ny>=MH) continue;
      if(blocksMove(T(nx,ny))) continue;
      if(i>3 && (blocksMove(T(cx+dirs[i][0],cy))||blocksMove(T(cx,cy+dirs[i][1])))) continue;
      if(inBase(nx*TILE+TILE/2,ny*TILE+TILE/2)) continue;
      var ni=ny*MW+nx; if(dist[ni]!==-1) continue;
      dist[ni]=dist[c]+1; flow[ni*2]=-dirs[i][0]; flow[ni*2+1]=-dirs[i][1]; fq[tail++]=ni;
    }
  }
}
function flowDir(x,y){
  var i=(y*MW+x); if(dist[i]===-1) return null;
  return {x:flow[i*2],y:flow[i*2+1]};
}

// Add future base-soldier dialogue here. An empty list keeps soldiers silent.
var CREWSAY=[];
var CREWSPOT_HUT=[[54.5,7.5],[58.5,6.5],[55.5,11.5],[62.5,4.5],[61.5,9.5],[59.5,9.5],[54.5,4.5],[63.5,5.5],[56.5,9.5],[61.5,6.5]];
var CREWSPOT_DUG=[[3.5,30.5],[6.5,32.5],[2.5,35.5],[8.5,35.5],[13.5,31.5],[17.5,31.5],[13.5,34.5],[5.5,33.5],[16.5,29.5],[8.5,30.5]];
var CREWSPOT_SEA=[[9.5,62.5],[12.5,59.5],[13.5,63.5],[18.5,59.5],[20.5,62.5],[9.5,67.5],[16.5,66.5],[21.5,68.5],[11.5,60.5],[17.5,68.5]];
var CREWSPOT_AIR=[[5.5,46.5],[9.5,46.5],[13.5,46.5],[17.5,48.5],[20.5,50.5],[6.5,53.5],[10.5,52.5],[16.5,53.5]];
var CREWSPOT=CREWSPOT_HUT;
var CREWZONE={x0:60.2,y0:5.2,x1:65.8,y1:9.8};
function setCrewZone(){
  if(mapKind==='trench'){ CREWSPOT=CREWSPOT_DUG; CREWZONE={x0:1.4,y0:28.4,x1:18.6,y1:36.6}; }
  else if(mapKind==='sea'){ CREWSPOT=CREWSPOT_SEA; CREWZONE={x0:7.4,y0:58.4,x1:22.6,y1:68.6}; }
  else if(mapKind==='airfield'){ CREWSPOT=CREWSPOT_AIR; CREWZONE={x0:3.4,y0:44.4,x1:22.6,y1:54.6}; }
  else if(mapKind==='redSquare'){ CREWSPOT=CREWSPOT_AIR; CREWZONE={x0:3.4,y0:41.4,x1:20.4,y1:49.2}; }
  else { CREWSPOT=CREWSPOT_HUT; CREWZONE={x0:53.4,y0:3.4,x1:66.4,y1:13.4}; }
}
function buildCrew(){
  crew.length=0;
  for(var i=0;i<PKITS.length;i++){
    if(i===kitIdx) continue;
    var sp5=CREWSPOT[crew.length%CREWSPOT.length];
    crew.push({x:sp5[0]*TILE,y:sp5[1]*TILE,r:9,kit:PKITS[i],sid:i*211+31,
      walk:0,amt:0,ang:rr(0,6.3),task:rr(1,4),tx:sp5[0]*TILE,ty:sp5[1]*TILE,
      say:0,line:'',bob:rr(0,6)});
  }
}
function rebuildCrew(){
  var keep=[]; for(var i=0;i<crew.length;i++) keep.push(crew[i].kit);
  crew.length=0;
  for(var j=0;j<keep.length;j++){
    var sp8=CREWSPOT[j%CREWSPOT.length];
    crew.push({x:sp8[0]*TILE,y:sp8[1]*TILE,r:9,kit:keep[j],sid:j*211+31,
      walk:0,amt:0,ang:rr(0,6.3),task:rr(1,4),tx:sp8[0]*TILE,ty:sp8[1]*TILE,
      say:0,line:'',bob:rr(0,6)});
  }
}
function updateCrew(dt){
  for(var i=0;i<crew.length;i++){
    var C=crew[i];
    C.bob+=dt*3.4; if(C.say>0) C.say-=dt;
    C.task-=dt;
    if(C.task<=0){
      var sp6=pick(CREWSPOT);
      C.tx=sp6[0]*TILE+rr(-6,6); C.ty=sp6[1]*TILE+rr(-5,5);
      C.task=rr(3.5,9);
      if(CREWSAY.length&&Math.random()<.45){ C.say=2.4; C.line=pick(CREWSAY); }
    }
    var dx=C.tx-C.x, dy=C.ty-C.y, d=Math.hypot(dx,dy);
    if(d>7){
      var step=64*dt, base=Math.atan2(dy,dx), off=[0,.6,-.6,1.2,-1.2];
      for(var o=0;o<off.length;o++){
        var aa=base+off[o], ox=C.x, oy=C.y;
        moveEnt(C,Math.cos(aa)*step,Math.sin(aa)*step);
        if(Math.hypot(C.x-ox,C.y-oy)>step*.6) break;
      }
      C.ang=base; C.walk+=dt*9; C.amt=Math.min(1,C.amt+dt*7);
      C.x=Math.max(CREWZONE.x0*TILE,Math.min(CREWZONE.x1*TILE,C.x));
      C.y=Math.max(CREWZONE.y0*TILE,Math.min(CREWZONE.y1*TILE,C.y));
    } else {
      C.amt=Math.max(0,C.amt-dt*6);
      C.walk+=dt*2.2;                       // hands busy on the spot
      C.ang+=Math.sin(C.bob*.6)*dt*.7;
    }
  }
}
function drawCrew(c,C){
  var keep=PK; PK=C.kit;
  var lift=Math.sin(C.bob)*1.2*(1-C.amt);
  drawUnit(c,C.x,C.y-lift,C.ang,C.kit.col,C.kit.band,C.walk,Math.max(C.amt,.18),null,'pistol',false,false,false,C.sid);
  PK=keep;
  if(C.say>0){
    c.font='bold 9px Arial'; c.textAlign='center';
    var tw=c.measureText(C.line).width+12;
    c.fillStyle='rgba(240,236,224,.92)'; rrect(c,C.x-tw/2,C.y-60,tw,15,4); c.fill();
    c.fillStyle='#1a1814'; c.fillText(C.line,C.x,C.y-49.5); c.textAlign='start';
  }
}
var CIVCOL=['#8a5f52','#4f6b7a','#7a6a8a','#5f7a5a','#8a7a4a','#6a5a4a'];
var CIVSAY=['GO! GO!','MY HOUSE!','NOT AGAIN','RUN!','THIS WAY!','DON\u2019T SHOOT','KEEP MOVING','HURRY'];
var pfPrev, pfSeen, pfQ, pfMark=0;
var PFD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function findPath(sx,sy,tx,ty){
  if(sx<0||sy<0||sx>=MW||sy>=MH||tx<0||ty<0||tx>=MW||ty>=MH) return null;
  if(blocksMove(T(sx,sy))||blocksMove(T(tx,ty))) return null;
  pfMark++;
  var head=0,tail=0, si=sy*MW+sx, ti=ty*MW+tx;
  pfSeen[si]=pfMark; pfPrev[si]=-1; pfQ[tail++]=si;
  while(head<tail){
    var c=pfQ[head++];
    if(c===ti) break;
    var cx=c%MW, cy=(c/MW)|0;
    for(var i=0;i<8;i++){
      var nx=cx+PFD[i][0], ny=cy+PFD[i][1];
      if(nx<0||ny<0||nx>=MW||ny>=MH) continue;
      if(blocksMove(T(nx,ny))) continue;
      if(i>3&&(blocksMove(T(cx+PFD[i][0],cy))||blocksMove(T(cx,cy+PFD[i][1])))) continue;
      var ni=ny*MW+nx; if(pfSeen[ni]===pfMark) continue;
      pfSeen[ni]=pfMark; pfPrev[ni]=c; pfQ[tail++]=ni;
    }
  }
  if(pfSeen[ti]!==pfMark) return null;
  var path=[], cur=ti, guard=0;
  while(cur!==-1&&guard++<4000){
    path.push({x:(cur%MW)*TILE+TILE/2,y:(((cur/MW)|0))*TILE+TILE/2});
    cur=pfPrev[cur];
  }
  path.reverse();
  return path.length>1?path:null;
}
function randWalk(){
  for(var i=0;i<250;i++){
    var x=ri(2,MW-3), y=ri(2,MH-3);
    if(!blocksMove(T(x,y))&&!inBase(x*TILE,y*TILE)) return [x,y];
  }
  return pick(SPAWNS);
}
function civRoute(C,tries){
  for(var t=0;t<(tries||6);t++){
    var g;
    if(C.baseCat) g=pick(CREWSPOT_HUT);
    else g=(C.pet?randWalk():pick(SPAWNS));
    var gx=C.baseCat?Math.round(g[0]):g[0], gy=C.baseCat?Math.round(g[1]):g[1];
    var pth=findPath(Math.floor(C.x/TILE),Math.floor(C.y/TILE),gx,gy);
    var minLen=C.baseCat?2:6;
    if(pth&&pth.length>minLen){ C.path=pth; C.pi=1; return true; }
  }
  return false;
}
var DOGCOL=[['#6b4a2c','#3a2a1a'],['#8a7a5c','#5a4a34'],['#3a3630','#1e1c18'],['#9a8a72','#c8bca0']];
var CATCOL=[['#c8843c','#e0b070'],['#5c5a54','#8a8880'],['#2a2724','#4a4744'],['#d8d2c4','#a08a6a']];
var baseCatsDone=0;
function spawnBaseCat(){
  var sp=pick(CREWSPOT_HUT);
  var pc=pick(CATCOL);
  var C0={x:sp[0]*TILE+TILE/2+rr(-5,5),y:sp[1]*TILE+TILE/2+rr(-5,5),r:6,
    pet:'cat',pcol:pc[0],pcol2:pc[1],tail:rr(0,6.3),baseCat:true,
    ox:rr(-5,5),oy:rr(-5,5),path:null,pi:0,tx:0,ty:0,
    col:null,hair:null,walk:0,amt:0,ang:rr(0,6.3),panic:0,life:999999,sid:Math.floor(Math.random()*9000)};
  if(civRoute(C0,8)) civs.push(C0);
}
function spawnCiv(){
  var r=Math.random();
  var pet=(mapKind==='trench')?(r<.55?'dog':'cat'):
          (mapKind==='compound')?(r<.28?'dog':(r<.46?'cat':null)):null;
  var tries=0,sp;
  if(pet) sp=randWalk();
  else do{ sp=pick(SPAWNS); tries++; } while(blocksMove(T(sp[0],sp[1]))&&tries<20);
  var pc=pet?(pet==='dog'?pick(DOGCOL):pick(CATCOL)):null;
  var C0={x:sp[0]*TILE+TILE/2+rr(-8,8),y:sp[1]*TILE+TILE/2+rr(-8,8),r:pet?6:10,
    pet:pet,pcol:pc?pc[0]:null,pcol2:pc?pc[1]:null,tail:rr(0,6.3),
    ox:rr(-9,9),oy:rr(-8,8),path:null,pi:0,tx:0,ty:0,
    col:pick(CIVCOL),hair:pick(['#3a2a1c','#6a4a28','#1f1a16','#8a7a5a']),
    walk:0,amt:0,ang:0,panic:0,life:80,sid:Math.floor(Math.random()*9000)};
  if(!civRoute(C0)) return;
  civs.push(C0);
}
function updateCivs(dt){
  civT-=dt;
  // Spawn base cats on first compound ticks (deferred so findPath works)
  if(mapKind==='compound'&&state==='play'&&baseCatsDone<3){ baseCatsDone++; spawnBaseCat(); }
  if(civT<=0&&mapKind!=='sea'&&mapKind!=='redSquare'&&civs.length<(mapKind==='trench'?8:(mapKind==='compound'?9:6))&&state==='play'){
    civT=(mapKind==='trench')?rr(1.4,3.6):(mapKind==='compound'?rr(2,5):rr(3,8)); spawnCiv(); }
  for(var i=civs.length-1;i>=0;i--){
    var C=civs[i]; C.life-=dt; if(C.say>0) C.say-=dt;
    if(C.life<=0||!C.path){ civs.splice(i,1); continue; }
    while(C.pi<C.path.length-1 &&
          Math.hypot(C.path[C.pi].x+C.ox-C.x,C.path[C.pi].y+C.oy-C.y)<24) C.pi++;
    if(C.pi>=C.path.length-1 &&
       Math.hypot(C.path[C.path.length-1].x-C.x,C.path[C.path.length-1].y-C.y)<44){
      if(C.pet&&civRoute(C,4)) { }                 // strays just pick a new corner to trot to
      else { civs.splice(i,1); continue; }
    }
    C.tx=C.path[C.pi].x+C.ox; C.ty=C.path[C.pi].y+C.oy;
    var dx=C.tx-C.x, dy=C.ty-C.y, d=Math.hypot(dx,dy)||1;
    // gunfire nearby sends them bolting
    C.panic=Math.max(0,C.panic-dt);
    if(!C.pet) C.panic=Math.max(C.panic,1); // civilians remain frightened and keep fleeing
    for(var b=0;b<bullets.length;b++) if(Math.hypot(bullets[b].x-C.x,bullets[b].y-C.y)<120){ C.panic=2.2; break; }
    for(var e2=0;e2<enemies.length;e2++) if(Math.hypot(enemies[e2].x-C.x,enemies[e2].y-C.y)<130){ C.panic=2.2; break; }
    var base2=C.pet?(C.pet==='cat'?128:136):112;
    var spd=(C.panic>0?base2*1.78:base2)*(slowT(T(Math.floor(C.x/TILE),Math.floor(C.y/TILE)))?.7:1);
    C.tail=(C.tail||0)+dt*(C.panic>0?14:7);
    var mvx=dx/d, mvy=dy/d;
    if(!C.pet){
      // A small side-to-side panic weave keeps the crowd from running in rigid lines.
      var weave=Math.sin(C.walk*.43+C.sid)*.24;
      mvx+=(-dy/d)*weave; mvy+=(dx/d)*weave;
    }
    for(var f2=0;f2<fires.length;f2++){ var FF=fires[f2], fd=Math.hypot(FF.x-C.x,FF.y-C.y);
      if(fd<FF.r*3&&fd>1){ mvx-=(FF.x-C.x)/fd*1.4; mvy-=(FF.y-C.y)/fd*1.4; } }
    var ml=Math.hypot(mvx,mvy)||1, step=spd*dt, base=Math.atan2(mvy/ml,mvx/ml);
    var off=[0,.45,-.45,.95,-.95,1.5,-1.5,2.2,-2.2,3.14];
    var sx5=C.x, sy5=C.y;
    for(var o2=0;o2<off.length;o2++){
      var aa=base+off[o2]+(C.jink||0), ox=C.x, oy=C.y;
      moveEnt(C,Math.cos(aa)*step,Math.sin(aa)*step);
      if(Math.hypot(C.x-ox,C.y-oy)>step*.7) break;
    }
    C.ang=base; C.walk+=dt*(C.panic>0?15:9); C.amt=Math.min(1,C.amt+dt*8);
    // if they stop making ground, try a new way out, then give up and leave
    C.chk=(C.chk||0)+dt;
    C.moved=(C.moved||0)+Math.hypot(C.x-sx5,C.y-sy5);
    if(C.chk>1.6){
      if(C.moved<18){
        C.stuck=(C.stuck||0)+1;
        C.jink=rr(-1.2,1.2);
        if(!civRoute(C,3)||C.stuck>=3){ civs.splice(i,1); continue; }
      } else { C.stuck=0; C.jink=0; }
      C.chk=0; C.moved=0;
    }
  }
}
function baseGarrisonClear(i){
  for(var e=0;e<enemies.length;e++) if(enemies[e].home&&enemies[e].home.i===i) return false;
  return true;
}
function updateCaptives(dt){
  if(mapKind!=='trench') return;
  for(var gi=0;gi<rescueGroups.length;gi++){
    var G=rescueGroups[gi];
    if(G.state==='held'&&baseGarrisonClear(G.base)){
      var near=!piloting&&!player.dead&&Math.hypot(player.x-G.x,player.y-G.y)<46;
      if(near){
        G.p=Math.min(1,G.p+dt/.15/10);
        if(G.p>=1){
          G.state='returning'; sfx('clear'); banner('SOLDIERS FREED','ESCORTING THEM HOME',1.8);
          for(var cf=0;cf<captives.length;cf++) if(captives[cf].group===gi){
            var C=captives[cf]; C.state='run'; C.repath=0;
            C.path=findPath(Math.floor(C.x/TILE),Math.floor(C.y/TILE),Math.floor(homeSpawn.x),Math.floor(homeSpawn.y));
            C.pi=1;
          }
        }
      } else G.p=Math.max(0,G.p-dt*.15);
    }
  }
  for(var i=0;i<captives.length;i++){
    var C2=captives[i]; if(C2.state!=='run') continue;
    C2.repath-=dt;
    if(!C2.path||C2.pi>=C2.path.length){
      C2.path=findPath(Math.floor(C2.x/TILE),Math.floor(C2.y/TILE),Math.floor(homeSpawn.x),Math.floor(homeSpawn.y));
      C2.pi=1; C2.repath=1;
    }
    if(C2.path){
      while(C2.pi<C2.path.length-1&&Math.hypot(C2.path[C2.pi].x-C2.x,C2.path[C2.pi].y-C2.y)<20) C2.pi++;
      var P=C2.path[Math.min(C2.pi,C2.path.length-1)], dx=P.x-C2.x, dy=P.y-C2.y, dd=Math.hypot(dx,dy)||1;
      var step=112*dt, ox=C2.x, oy=C2.y;
      moveEnt(C2,dx/dd*step,dy/dd*step);
      C2.ang=Math.atan2(dy,dx); C2.walk+=dt*13; C2.amt=1;
      if(Math.hypot(C2.x-ox,C2.y-oy)<step*.35&&C2.repath<=0) C2.path=null;
    }
    if(Math.hypot(C2.x-homeSpawn.x*TILE,C2.y-homeSpawn.y*TILE)<58){
      C2.state='home'; C2.path=null; C2.amt=0;
      C2.x=homeSpawn.x*TILE+(C2.slot-1)*18; C2.y=homeSpawn.y*TILE+34+C2.group*13;
      var RG=rescueGroups[C2.group], safe=0;
      for(var rc=0;rc<captives.length;rc++) if(captives[rc].group===C2.group&&captives[rc].state==='home') safe++;
      RG.home=safe;
      if(safe>=RG.total){ RG.state='done'; banner('RESCUE GROUP SAFE',(C2.group+1)+' OF '+rescueGroups.length,1.8); hud(); }
    }
  }
}
function trenchRescueDone(){
  if(!rescueGroups.length) return false;
  for(var i=0;i<rescueGroups.length;i++) if(rescueGroups[i].state!=='done') return false;
  return true;
}
function drawCaptive(c,C){
  // Use the same fully detailed character renderer as the player. Captives are
  // unarmed, but keep the allied yellow armband and full run-cycle animation.
  var moving=C.state==='run', idle=C.state==='held'?.04:0;
  drawUnit(c,C.x,C.y,C.ang||Math.PI/2,PK.col,'#f2c744',C.walk||0,moving?1:idle,
           null,null,false,false,false,C.sid||7,0);
  if(C.slot===0&&C.state==='held'){
    var G=rescueGroups[C.group], clear=baseGarrisonClear(C.group);
    c.fillStyle='rgba(8,14,12,.78)'; rrect(c,G.x-42,G.y-49,84,13,3); c.fill();
    c.fillStyle=clear?'#f2c744':'#c3cbc4'; c.font='bold 7px Arial'; c.textAlign='center';
    c.fillText(clear?'STAND HERE TO FREE':'CAPTURED SOLDIERS',G.x,G.y-40); c.textAlign='start';
    if(clear&&G.p>0){ c.fillStyle='rgba(0,0,0,.65)'; rrect(c,G.x-30,G.y+22,60,7,3); c.fill();
      c.fillStyle='#f2c744'; rrect(c,G.x-29,G.y+23,58*G.p,5,2); c.fill(); }
  }
}
function drawAnimal(c,C){
  var mir=Math.cos(C.ang)<0?-1:1, dog=(C.pet==='dog');
  var ph=C.walk, sA=Math.sin(ph)*.9*C.amt, sB=Math.sin(ph+Math.PI)*.9*C.amt;
  var bob=-Math.abs(Math.sin(ph*2))*1.4*C.amt;
  var S=dog?.72:.58;
  c.save(); c.translate(C.x,C.y);
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0,1,13*S,5*S,0,0,6.3); c.fill();
  c.save(); c.scale(mir*S,S); c.translate(0,bob);

  // legs
  c.strokeStyle='#15130e'; c.lineCap='round';
  for(var lg=0;lg<4;lg++){
    var lx=(lg<2?-7:7), sw=(lg%2?sA:sB)*(dog?7:6);
    c.lineWidth=5; c.strokeStyle=shade(C.pcol,.72);
    c.beginPath(); c.moveTo(lx,-9); c.lineTo(lx+sw,-1); c.stroke();
    c.lineWidth=1.6; c.strokeStyle='#15130e';
    c.beginPath(); c.moveTo(lx,-9); c.lineTo(lx+sw,-1); c.stroke();
    c.fillStyle=shade(C.pcol,.55);
    c.beginPath(); c.ellipse(lx+sw,-1,3,2,0,0,6.3); c.fill();
  }
  // tail
  c.strokeStyle=C.pcol; c.lineWidth=dog?4:3.4; c.lineCap='round';
  c.beginPath(); c.moveTo(-10,-16);
  if(dog) c.quadraticCurveTo(-17,-22+Math.sin(C.tail)*4,-19,-13+Math.sin(C.tail)*5);
  else    c.quadraticCurveTo(-18,-20,-15,-30+Math.sin(C.tail*.6)*3);
  c.stroke();
  c.strokeStyle='#15130e'; c.lineWidth=1.2; c.stroke();
  // body
  c.fillStyle=C.pcol; c.beginPath(); c.ellipse(0,-15,13,8.5,0,0,6.3); c.fill(); outl(c,'#15130e',1.8);
  c.fillStyle=C.pcol2; c.beginPath(); c.ellipse(-3,-13,6.5,4.5,rr(-.1,.1),0,6.3); c.fill();
  // head
  c.fillStyle=C.pcol; c.beginPath(); c.arc(11,-19,7*(dog?1:.92),0,6.3); c.fill(); outl(c,'#15130e',1.8);
  c.fillStyle=shade(C.pcol,.9);
  if(dog){ c.beginPath(); c.ellipse(17,-17,5,3.6,0,0,6.3); c.fill(); outl(c,'#15130e',1.5); }
  else   { c.beginPath(); c.ellipse(16,-18,3.4,2.8,0,0,6.3); c.fill(); outl(c,'#15130e',1.4); }
  // ears
  c.fillStyle=shade(C.pcol,.82);
  if(dog){
    c.beginPath(); c.moveTo(8,-24); c.quadraticCurveTo(5,-16,10,-15);
    c.quadraticCurveTo(12,-20,8,-24); c.closePath(); c.fill(); outl(c,'#15130e',1.4);
  } else {
    c.beginPath(); c.moveTo(7,-24); c.lineTo(9.5,-30); c.lineTo(12.5,-23); c.closePath(); c.fill(); outl(c,'#15130e',1.4);
    c.beginPath(); c.moveTo(13,-24); c.lineTo(16,-29); c.lineTo(17.5,-22); c.closePath(); c.fill(); outl(c,'#15130e',1.4);
  }
  c.fillStyle='#15130e'; c.beginPath(); c.arc(14,-20.5,1.1,0,6.3); c.fill();
  c.beginPath(); c.arc(dog?20:18.5,-16.6,1.3,0,6.3); c.fill();
  c.restore(); c.restore();
}
function drawCiv(c,C){
  var mir=Math.cos(C.ang)<0?-1:1, ph=C.walk, sA=Math.sin(ph)*.95*C.amt, sB=Math.sin(ph+Math.PI)*.95*C.amt;
  var bob=-Math.abs(Math.sin(ph))*2.4*C.amt, solid=[C.col,C.col,C.col,C.col];
  c.save(); c.translate(C.x,C.y);
  c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(0,1,10.5,4.6,0,0,6.3); c.fill();
  c.save(); c.scale(mir,1);
  leg(c,-3,sB,'#3f4a5c',.8,C.sid,['#3f4a5c','#3f4a5c','#3f4a5c','#3f4a5c']);
  leg(c, 3,sA,'#3f4a5c',.9,C.sid+4,['#3f4a5c','#3f4a5c','#3f4a5c','#3f4a5c']);
  c.translate(0,bob);
  c.fillStyle=C.col; rrect(c,-6.8,-24,13.6,13.5,5); c.fill(); outl(c,'#15130e',1.9);
  c.fillStyle=shade(C.col,.8); rrect(c,-2,-24,4,13.5,1.5); c.fill();
  // Both hands stay clearly above the head while the elbows and hands wave.
  var waveL=Math.sin(ph*1.55+C.sid)*2.8, waveR=Math.sin(ph*1.73+C.sid*1.7)*2.8;
  var lhx=-8+waveL, lhy=-43+Math.cos(ph*1.3)*1.5;
  var rhx= 8+waveR, rhy=-43+Math.sin(ph*1.45)*1.5;
  c.strokeStyle=shade(C.col,1.05); c.lineWidth=5; c.lineCap='round'; c.lineJoin='round';
  c.beginPath(); c.moveTo(-5,-22); c.lineTo(-9,-32); c.lineTo(lhx,lhy); c.stroke();
  c.beginPath(); c.moveTo( 5,-22); c.lineTo( 9,-32); c.lineTo(rhx,rhy); c.stroke();
  c.strokeStyle='#15130e'; c.lineWidth=1.35;
  c.beginPath(); c.moveTo(-5,-22); c.lineTo(-9,-32); c.lineTo(lhx,lhy); c.stroke();
  c.beginPath(); c.moveTo( 5,-22); c.lineTo( 9,-32); c.lineTo(rhx,rhy); c.stroke();
  c.fillStyle=SKIN2; c.beginPath(); c.arc(lhx,lhy,2.8,0,6.3); c.fill(); outl(c,'#15130e',1.3);
  c.fillStyle=SKIN2; c.beginPath(); c.arc(rhx,rhy,2.8,0,6.3); c.fill(); outl(c,'#15130e',1.3);
  c.fillStyle=SKIN; c.beginPath(); c.arc(1,-30,7,0,6.3); c.fill(); outl(c,'#15130e',1.8);
  c.fillStyle=C.hair; c.beginPath(); c.arc(1,-31,7.2,Math.PI*1.05,Math.PI*2.05); c.fill();
  c.fillStyle='#15130e'; c.beginPath(); c.arc(-1.4,-28.4,1.05,0,6.3); c.fill();
  c.beginPath(); c.arc(3.6,-28.4,1.05,0,6.3); c.fill();
  if(C.panic>0){ c.fillStyle='#15130e'; c.beginPath(); c.ellipse(1.4,-25.4,2,1.4,0,0,6.3); c.fill(); }
  c.restore();
  c.restore();
  if(C.say>0){
    c.font='bold 9px Arial'; c.textAlign='center';
    var tw=c.measureText(C.line).width+12;
    c.fillStyle='rgba(240,236,224,.92)'; rrect(c,C.x-tw/2,C.y-58,tw,15,4); c.fill();
    c.fillStyle='#1a1814'; c.fillText(C.line,C.x,C.y-47.5); c.textAlign='start';
  }
}
function drawNurse(c,N){
  // Male military medic coasts smoothly between the two beds, pausing at each patient.
  var cycle=(now*.24)%2, travel=cycle<1?cycle:(2-cycle);
  var smooth=travel*travel*(3-2*travel);
  var nx=N.x+Math.sin(now*.9)*2, ny=N.y+(smooth-.5)*58;
  var reach=Math.sin(now*2.4)*2;
  c.save(); c.translate(nx,ny);
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0,2,10,4.5,0,0,6.3); c.fill();
  // Military trousers and field boots.
  c.fillStyle='#4f5b49'; rrect(c,-8,-13,7,13,2); c.fill(); outl(c,'#27302b',1.3);
  rrect(c,1,-13,7,13,2); c.fill(); outl(c,'#27302b',1.3);
  c.fillStyle='#262b26'; rrect(c,-8,-3,7,5,2); c.fill(); outl(c,'#171a17',1.1);
  rrect(c,1,-3,7,5,2); c.fill(); outl(c,'#171a17',1.1);
  // Tunic, web belt, buckle and breast pockets.
  c.fillStyle='#657158'; rrect(c,-9,-26,18,17,4); c.fill(); outl(c,'#27302b',1.7);
  c.fillStyle='#313a30'; c.fillRect(-9,-13,18,3); c.fillStyle='#b59b5b'; c.fillRect(-2,-14,4,4);
  c.fillStyle='#4d5848'; rrect(c,-7,-22,5,5,1); c.fill(); rrect(c,2,-22,5,5,1); c.fill();
  // Small shoulder rank tabs.
  c.fillStyle='#b7a56a'; c.fillRect(-8,-25,4,2); c.fillRect(4,-25,4,2);
  c.strokeStyle='#657158'; c.lineWidth=4.5; c.lineCap='round';
  c.beginPath(); c.moveTo(-5,-21); c.lineTo(-10,-14+reach); c.stroke();
  c.beginPath(); c.moveTo(5,-21); c.lineTo(11,-15-reach); c.stroke();
  // White medical armband with a red cross.
  c.strokeStyle='#ecefe8'; c.lineWidth=5.4; c.beginPath(); c.moveTo(-7,-18); c.lineTo(-9,-16+reach*.45); c.stroke();
  c.fillStyle='#c83b35'; c.fillRect(-9.4,-19+reach*.3,1.7,5); c.fillRect(-11,-17.4+reach*.3,5,1.7);
  c.fillStyle=SKIN2; c.beginPath(); c.arc(-10,-14+reach,2.5,0,6.3); c.fill(); outl(c,'#27302b',1.1);
  c.beginPath(); c.arc(11,-15-reach,2.5,0,6.3); c.fill(); outl(c,'#27302b',1.1);
  // Field medical satchel hangs from the web belt.
  c.strokeStyle='#3b3325'; c.lineWidth=1.5; c.beginPath(); c.moveTo(4,-24); c.lineTo(10,-9); c.stroke();
  c.fillStyle='#776342'; rrect(c,6,-11,9,9,2); c.fill(); outl(c,'#2b261d',1.2);
  c.fillStyle='#e8e9df'; c.fillRect(9.3,-9.5,2.2,5); c.fillRect(7.9,-8.1,5,2.2);
  c.fillStyle=SKIN; c.beginPath(); c.ellipse(0,-31,7.4,7,0,0,6.3); c.fill(); outl(c,'#27302b',1.6);
  // Olive field cap with medical badge.
  c.fillStyle='#4d5848'; c.beginPath(); c.arc(0,-34,7.2,Math.PI,0); c.fill(); outl(c,'#27302b',1.3);
  c.fillStyle='#424b3e'; c.beginPath(); c.ellipse(3,-34,6,2,0,0,6.3); c.fill();
  c.fillStyle='#ecefe8'; c.beginPath(); c.arc(0,-35.5,2.7,0,6.3); c.fill(); outl(c,'#27302b',.7);
  c.fillStyle='#c83b35'; c.fillRect(-.7,-37.2,1.4,3.4); c.fillRect(-1.7,-36.2,3.4,1.4);
  // Dark full beard, sideburns and moustache make the medic clearly male.
  c.fillStyle='#302720'; c.beginPath(); c.moveTo(-6.2,-31);
  c.quadraticCurveTo(-6.4,-25.7,0,-23.4); c.quadraticCurveTo(6.4,-25.7,6.2,-31);
  c.lineTo(4.7,-28.5); c.quadraticCurveTo(0,-26.1,-4.7,-28.5); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(-1.8,-28.2,2.3,1.1,-.18,0,6.3); c.fill();
  c.beginPath(); c.ellipse(1.8,-28.2,2.3,1.1,.18,0,6.3); c.fill();
  c.fillStyle='#26302a'; c.beginPath(); c.arc(-2,-30,1,0,6.3); c.fill(); c.beginPath(); c.arc(2,-30,1,0,6.3); c.fill();
  c.restore();
}
function drawHealSpot(c,N){
  if(!N||N.healX===undefined) return;
  var x=N.healX, y=N.healY, active=N.healing, pulse=.5+Math.sin(now*3.2)*.5;
  c.save();
  c.fillStyle=active?'rgba(82,190,132,'+(.22+pulse*.1)+')':'rgba(35,58,49,.45)';
  rrect(c,x-23,y-23,46,46,5); c.fill();
  c.strokeStyle=active?'rgba(125,238,170,'+(.7+pulse*.25)+')':'rgba(155,205,176,.58)'; c.lineWidth=2.2;
  rrect(c,x-23,y-23,46,46,5); c.stroke();
  c.setLineDash([5,4]); c.lineWidth=1;
  rrect(c,x-18,y-18,36,36,3); c.stroke(); c.setLineDash([]);
  c.fillStyle=active?'rgba(238,246,238,.95)':'rgba(218,229,218,.72)';
  c.fillRect(x-3,y-11,6,22); c.fillRect(x-11,y-3,22,6);
  if(active&&player){
    c.strokeStyle='#72e0a0'; c.lineWidth=2.5; c.beginPath();
    c.arc(x,y,28,-Math.PI/2,-Math.PI/2+Math.PI*2*(player.hp/player.mx)); c.stroke();
  }
  c.fillStyle='rgba(10,17,14,.8)'; rrect(c,x-25,y-36,50,10,2); c.fill();
  c.fillStyle=active?'#86edac':'#b8cbbd'; c.font='bold 6px Arial'; c.textAlign='center';
  c.fillText(active?'HEALING':'FIELD AID',x,y-29); c.textAlign='start';
  c.restore();
}
/* =========================================================================
   CRATES
   ========================================================================= */
function seedCrates(n){
  var tries=0;
  while(crates.length<n && tries++<800){
    var x=ri(1,MW-2), y=ri(1,MH-2), t=T(x,y);
    if(blocksMove(t)) continue;
    var wx=x*TILE+TILE/2, wy=y*TILE+TILE/2;
    if(Math.hypot(wx-player.x,wy-player.y)<TILE*4) continue;
    var ok=true;
    for(var i=0;i<crates.length;i++) if(Math.hypot(crates[i].x-wx,crates[i].y-wy)<TILE*3.5) ok=false;
    if(!ok) continue;
    crates.push({x:wx,y:wy,tx:x,ty:y,open:false,pop:0,rot:rr(-.25,.25)});
  }
}

/* =========================================================================
   INPUT
   ========================================================================= */
var mv={x:0,y:0,m:0}, firing=false, keys={};
var joyZone=document.getElementById('joyZone'), joyBase=document.getElementById('joyBase'), joyKnob=document.getElementById('joyKnob');
var actBtn=document.getElementById('act'), nadeBtn=document.getElementById('nade');
var joyId=null, joyOx=0, joyOy=0, joyHX=0, joyHY=0;
var joyVis={cx:112,cy:600,kx:112,ky:600,on:0};
function placeJoyHome(){
  joyHX=112; joyHY=window.innerHeight-152;
  if(joyId===null){ joyVis.cx=joyHX; joyVis.cy=joyHY; joyVis.kx=joyHX; joyVis.ky=joyHY; joyVis.on=0; }
}
window.addEventListener('resize',placeJoyHome); placeJoyHome();

function joyStart(e){
  var t=e.changedTouches?e.changedTouches[0]:e;
  if(gunHit(t.clientX,t.clientY)>=0) return;
  joyId=e.changedTouches?t.identifier:'m';
  joyOx=t.clientX; joyOy=t.clientY;
  joyVis.cx=joyOx; joyVis.cy=joyOy; joyVis.kx=joyOx; joyVis.ky=joyOy; joyVis.on=1;
  e.preventDefault();
}
function joyMove(e){
  var list=e.changedTouches?e.changedTouches:[e];
  for(var i=0;i<list.length;i++){
    var t=list[i]; if(e.changedTouches && t.identifier!==joyId) continue;
    if(joyId===null) continue;
    var dx=t.clientX-joyOx, dy=t.clientY-joyOy, d=Math.hypot(dx,dy), R=58;
    var cl=Math.min(d,R);
    if(d>0.001){ mv.x=dx/d; mv.y=dy/d; mv.m=Math.min(1,d/45); } else { mv.m=0; }
    joyVis.kx=joyOx+(dx/(d||1))*cl; joyVis.ky=joyOy+(dy/(d||1))*cl; joyVis.on=1;
  }
  e.preventDefault();
}
function joyEnd(e){
  var list=e.changedTouches?e.changedTouches:[e];
  for(var i=0;i<list.length;i++){ var t=list[i];
    if(e.changedTouches && t.identifier!==joyId) continue;
    joyId=null; mv.m=0; placeJoyHome();
  }
}
joyZone.addEventListener('touchstart',joyStart,{passive:false});
joyZone.addEventListener('touchmove',joyMove,{passive:false});
joyZone.addEventListener('touchend',joyEnd); joyZone.addEventListener('touchcancel',joyEnd);
joyZone.addEventListener('mousedown',function(e){joyStart(e); window.addEventListener('mousemove',joyMove); window.addEventListener('mouseup',mu);});
function mu(e){ joyEnd(e); window.removeEventListener('mousemove',joyMove); window.removeEventListener('mouseup',mu); }

function bindTap(el,fn){
  if(!el) return;
  var lastRun=0;
  function run(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    var now=Date.now();
    if(now-lastRun<500) return;
    lastRun=now;
    fn();
  }
  if(window.PointerEvent) el.addEventListener('pointerup',run,{passive:false});
  else el.addEventListener('touchend',run,{passive:false});
  el.addEventListener('click',run);
  el.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '||e.key==='Spacebar') run(e);
  });
}
function actDown(e){ firing=true; actBtn.classList.add('on'); if(ac()&&AC.state==='suspended')AC.resume(); if(e)e.preventDefault(); }
function actUp(e){ firing=false; actBtn.classList.remove('on'); if(player){player.open=0; player.openC=null;} if(e)e.preventDefault(); }
actBtn.addEventListener('touchstart',actDown,{passive:false});
actBtn.addEventListener('touchend',actUp); actBtn.addEventListener('touchcancel',actUp);
actBtn.addEventListener('mousedown',actDown); window.addEventListener('mouseup',function(){ if(firing) actUp(); });
bindTap(nadeBtn,throwNade);

window.addEventListener('keydown',function(e){
  keys[e.key.toLowerCase()]=true;
  if(e.key===' '||e.key.toLowerCase()==='j'){ firing=true; e.preventDefault(); }
  if(e.key.toLowerCase()==='g') throwNade();
});
window.addEventListener('keyup',function(e){
  keys[e.key.toLowerCase()]=false;
  if(e.key===' '||e.key.toLowerCase()==='j'){ firing=false; if(player){player.open=0;player.openC=null;} }
});
function keyVec(){
  var x=0,y=0;
  if(keys['a']||keys['arrowleft'])x-=1; if(keys['d']||keys['arrowright'])x+=1;
  if(keys['w']||keys['arrowup'])y-=1;   if(keys['s']||keys['arrowdown'])y+=1;
  if(x||y){ var d=Math.hypot(x,y); return {x:x/d,y:y/d,m:1}; }
  return null;
}

/* =========================================================================
   COMBAT
   ========================================================================= */
function nearestTarget(){
  var best=null, bd=1e9;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i], d=Math.hypot(e.x-player.x,e.y-player.y);
    var targetRange=(e.compoundBoss||e.levelTwoBoss||e.oilBoss||e.airfieldBoss)?720:560;
    if(d>targetRange) continue;
    if(!los(player.x,player.y,e.x,e.y)) continue;
    if(e.compoundBoss||e.levelTwoBoss||e.oilBoss||e.airfieldBoss) return e;
    if(d<bd){ bd=d; best=e; }
  }
  return best;
}
function syncGun(){
  if(!player.guns[player.gi]) player.guns[player.gi]={id:player.wep,mag:0,res:0};
  player.guns[player.gi].id=player.wep; player.guns[player.gi].mag=player.mag; player.guns[player.gi].res=player.res;
}
function equipGun(i){
  if(!player.guns[i]||i===player.gi) return;
  syncGun(); player.gi=i;
  var g=player.guns[i];
  player.wep=g.id; player.mag=g.mag; player.res=g.res; player.reload=0; player.cd=.2;
  sfx('reload'); banner(WEAPONS[g.id].name,'',.8); hud();
}
function addGun(id){
  var W2=WEAPONS[id];
  for(var i=0;i<player.guns.length;i++) if(player.guns[i].id===id){
    if(i===player.gi) player.res+=W2.mag*2; else player.guns[i].res+=W2.mag*2;
    hud(); return '+'+(W2.mag*2)+' RDS';
  }
  syncGun();
  if(player.guns.length<4){
    player.guns.push({id:id,mag:W2.mag,res:W2.res});
    player.gi=player.guns.length-1;
  } else {
    player.guns[player.gi]={id:id,mag:W2.mag,res:W2.res};
  }
  var g2=player.guns[player.gi];
  player.wep=g2.id; player.mag=g2.mag; player.res=g2.res; player.reload=0;
  hud(); return W2.name;
}
function spray(dt){
  var tgt=nearestTarget(), ang=player.face;
  var moving=Math.hypot(player.lvx||0,player.lvy||0)>8;
  if(!moving&&tgt&&Math.hypot(tgt.x-player.x,tgt.y-player.y)<150) ang=Math.atan2(tgt.y-player.y,tgt.x-player.x);
  player.face=ang; player.ang=ang;
  for(var i=0;i<3&&flames.length<190;i++){
    var a=ang+rr(-.26,.26), sp=rr(170,330);
    flames.push({x:player.x+Math.cos(ang)*15,y:player.y+Math.sin(ang)*15,
      vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.75,life:rr(.32,.6),max:.6,s:rr(4,9)});
  }
  if(Math.random()<.25) sfx('enemy',.25);
  shake=Math.min(6,shake+.35);
  for(var e=enemies.length-1;e>=0;e--){
    var en=enemies[e], dx=en.x-player.x, dy=en.y-player.y, d=Math.hypot(dx,dy);
    if(d>145||d<1) continue;
    var da=Math.abs(((Math.atan2(dy,dx)-ang+Math.PI*3)%(Math.PI*2))-Math.PI);
    if(da>.42) continue;
    if(!los(player.x,player.y,en.x,en.y)) continue;
    hurtEnemy(en,58*dt,Math.atan2(dy,dx));
    if(en.hp>0) igniteEnemy(en);
  }
  if(Math.random()<.05&&fires.length<15){
    var fx5=player.x+Math.cos(ang)*rr(50,130), fy5=player.y+Math.sin(ang)*rr(50,130)*.8;
    if(!onWall(fx5,fy5)) fires.push({x:fx5,y:fy5,r:rr(7,10),p:rr(0,6),life:rr(6,12),sp:0});
  }
}
function igniteEnemy(en){
  if(!en.fire){ sfx('hurt',.35); }
  en.fire=Math.max(en.fire||0,rr(4.5,7));
}
function shoot(){
  var W=WEAPONS[player.wep];
  if(player.reload>0) return;
  if(player.mag<=0){ startReload(); return; }
  var tgt=nearestTarget(), ang=player.face;
  var moving=Math.hypot(player.lvx||0,player.lvy||0)>8;
  if(tgt&&(!moving||tgt.compoundBoss||tgt.levelTwoBoss||tgt.oilBoss||tgt.airfieldBoss)){
    var aimX=tgt.x,aimY=tgt.y;
    if(tgt.compoundBoss){
      var shotTravel=Math.min(.48,Math.hypot(tgt.x-player.x,tgt.y-player.y)/Math.max(1,W.spd));
      aimX+=(tgt.cvx||0)*shotTravel; aimY+=(tgt.cvy||0)*shotTravel;
    }
    ang=Math.atan2(aimY-player.y,aimX-player.x); player.face=ang;
  }
  player.ang=ang;
  var pel=W.pel||1;
  for(var i=0;i<pel;i++){
    var a=ang+rr(-W.spread,W.spread)*(pel>1?1:.7);
    bullets.push({x:player.x+Math.cos(ang)*16,y:player.y+Math.sin(ang)*16,
      vx:Math.cos(a)*W.spd, vy:Math.sin(a)*W.spd, dmg:W.dmg, life:1.4, pierce:W.pierce||0, trail:W.spd>800?18:12});
  }
  player.mag--; player.cd=W.rof*(player.stim>0?.62:1); syncGun();
  player.recoil=1;
  fx.push({t:'flash',x:player.x,y:player.y,a:ang,life:.06,max:.06,s:W.pel>1?1.6:1});
  shake=Math.min(9,shake+(W.kick||2));
  sfx(W.snd||'shot',.9);
  if(player.mag<=0) startReload();
  hud();
}
function startReload(){
  if(player.res<=0||player.reload>0) return;
  var W=WEAPONS[player.wep];
  player.reload=W.mag>50?2.6:1.45;
  sfx('reload');
}
function finishReload(){
  var W=WEAPONS[player.wep], need=W.mag-player.mag, take=Math.min(need,player.res);
  player.mag+=take; player.res-=take; syncGun(); hud();
}
function throwNade(){
  if(!player||state!=='play'||player.nades<=0) return;
  var tgt=nearestTarget(),targetX=tgt?tgt.x:player.x+Math.cos(player.face)*220,targetY=tgt?tgt.y:player.y+Math.sin(player.face)*220;
  if(tgt&&tgt.compoundBoss){ targetX+=(tgt.cvx||0)*.62; targetY+=(tgt.cvy||0)*.62; }
  var ang=Math.atan2(targetY-player.y,targetX-player.x);
  var dist2=tgt?Math.min(tgt.compoundBoss?460:300,Math.hypot(targetX-player.x,targetY-player.y)):220;
  player.nades--; player.face=ang;
  nades.push({x:player.x,y:player.y,sx:player.x,sy:player.y,
    tx:player.x+Math.cos(ang)*dist2, ty:player.y+Math.sin(ang)*dist2, t:0, dur:.62, spin:0});
  sfx('reload'); hud();
}
function explode(x,y,r,dmg,fromPlayer){
  fx.push({t:'boom',x:x,y:y,life:.5,max:.5,r:r});
  blastWalls(x,y,r,dmg);
  for(var dq7=0;dq7<depots.length;dq7++){
    var DQ7=depots[dq7];
    if(DQ7.blown) continue;
    if(x>DQ7.x0*TILE&&x<(DQ7.x1+1)*TILE&&y>DQ7.y0*TILE&&y<(DQ7.y1+1)*TILE) blowDepot(DQ7);
  }
  if(depotJustBlown()) return;
  for(var wq=0;wq<6;wq++) wallHit(x,y,wq*1.047+rr(-.3,.3),r*1.25,1.5);
  dustPuff(x,y,ri(6,10),1.6);
  for(var i=0;i<16;i++) smoke.push({x:x,y:y,vx:rr(-70,70),vy:rr(-70,70),life:rr(.6,1.5),max:1.5,s:rr(8,22)});
  shake=Math.min(20,shake+13); sfx('boom');
  scorch(dc,x,y,r*.72);
  if(fires.length<14) fires.push({x:x,y:y,r:rr(7,11),p:rr(0,6),life:rr(7,13),sp:0});
  if(fromPlayer!==false) for(var e2=enemies.length-1;e2>=0;e2--){
    var en=enemies[e2], d=Math.hypot(en.x-x,en.y-y);
    if(d<r&&los(x,y,en.x,en.y)) hurtEnemy(en, dmg*(1-d/r*.6), Math.atan2(en.y-y,en.x-x), d<r*.62);
  }
  if(!fromPlayer){
    var dp=Math.hypot(player.x-x,player.y-y);
    if(dp<r*.8) hurtPlayer(dmg*.45*(1-dp/r));
  }
}
function hurtEnemy(e,dmg,ang,blast){
  e.hp-=dmg; e.hurt=.14; e.stag=Math.min(.28,(e.stag||0)+.1);
  mistBurst(e.x,e.y-16,ang,Math.min(14,3+Math.round(dmg/6)),.8+dmg/90);
  bloodSpray(e.x,e.y,(ang||0),18+dmg*.8,Math.min(20,4+Math.round(dmg/5)));
  if(dmg>22) wallHit(e.x,e.y,(ang||0),90);
  for(var i=0;i<4;i++){
    var a=(ang||0)+rr(-.7,.7), d=rr(4,18), sx2=e.x+Math.cos(a)*d, sy2=e.y+Math.sin(a)*d;
    if(onWall(sx2,sy2)) continue;
    bc.fillStyle='rgba('+ri(110,150)+',18,12,'+rr(.35,.75)+')';
    dc.beginPath(); dc.arc(sx2,sy2,rr(1.5,4),0,6.3); dc.fill();
  }
  if(e.hp<=0) killEnemy(e,ang,blast||(-e.hp)>28||(blast!==true&&dmg>=60&&Math.random()<.4));
  else sfx('hit',.5);
}
function showCompoundBossClear(x,y){
  state='play'; firing=false; actBtn.classList.remove('on');
  var victory=document.getElementById('bossVictory');
  banner('BOSS DOWN','EXPLOSION CHAIN',1.5);
  var blastTimes=[0,360,760,1180,1660,2180];
  for(var bi=0;bi<blastTimes.length;bi++) (function(delay,index){
    setTimeout(function(){
      var bx=x+rr(-22,22),by=y+rr(-18,18);
      fx.push({t:'boom',x:bx,y:by,life:.65,max:.65,r:90+index*9});
      fx.push({t:'ring',x:bx,y:by,life:.55,max:.55});
      dustPuff(bx,by,10,1.4); shake=Math.min(18,shake+5+index*.8); sfx('boom',Math.max(.35,1-index*.08));
    },delay);
  })(blastTimes[bi],bi);
  setTimeout(function(){ state='pause'; victory.classList.add('show'); sfx('clear'); },2850);
  setTimeout(function(){ victory.classList.remove('show'); },6500);
  setTimeout(function(){ sectorClear(); },7050);
}
function showAirfieldBossClear(x,y){
  state='play'; firing=false; actBtn.classList.remove('on'); miniNukes.length=0;
  var victory=document.getElementById('airBossVictory');
  banner('LEVEL 5 BOSS DOWN','AIRFIELD SECURED',1.5);
  fx.push({t:'miniNuke',x:x,y:y,life:1.45,max:1.45,r:112});
  fx.push({t:'boom',x:x,y:y,life:.7,max:.7,r:130}); sfx('boom',.9); shake=Math.min(18,shake+12);
  setTimeout(function(){ state='pause'; victory.classList.add('show'); sfx('clear'); },1550);
  setTimeout(function(){ victory.classList.remove('show'); },5200);
  setTimeout(function(){ sectorClear(); },5750);
}
function showLevelTwoBossClear(x,y){
  state='play'; firing=false; actBtn.classList.remove('on'); meatShots.length=0; meatBits.length=0;
  var victory=document.getElementById('levelTwoBossVictory');
  banner('LEVEL 2 BOSS DEFEATED','THE TRENCHES ARE SECURE',1.5);
  fx.push({t:'boom',x:x,y:y,life:.85,max:.85,r:120}); fx.push({t:'ring',x:x,y:y,life:.7,max:.7});
  shake=Math.min(16,shake+10); sfx('boom',.8);
  setTimeout(function(){ state='pause'; victory.classList.add('show'); sfx('clear'); },1450);
  setTimeout(function(){ victory.classList.remove('show'); },5100);
  setTimeout(function(){ sectorClear(); },5600);
}
function showOilBossClear(x,y){
  state='play'; firing=false; actBtn.classList.remove('on'); fireBottles.length=0;
  var victory=document.getElementById('levelFourBossVictory');
  banner('LEVEL 4 BOSS DEFEATED','THE OIL FIELDS ARE SECURE',1.5);
  fx.push({t:'boom',x:x,y:y,life:.8,max:.8,r:120}); fx.push({t:'ring',x:x,y:y,life:.65,max:.65});
  shake=Math.min(16,shake+10); sfx('boom',.8);
  setTimeout(function(){ state='pause'; victory.classList.add('show'); sfx('clear'); },1450);
  setTimeout(function(){ victory.classList.remove('show'); },5100);
  setTimeout(function(){ sectorClear(); },5600);
}
function killEnemy(e,ang,gib){
  var idx=enemies.indexOf(e); if(idx>=0) enemies.splice(idx,1);
  if(e.finalBoss){ redBossDefeated=1; bossBarrels.length=0; banner('FINAL BOSS DEFEATED','RED SQUARE SECURED',2.5);
    try{ window.parent.postMessage({type:'gd:sectorComplete',sector:6},'*'); }catch(ex){} }
  if(e.airfieldBoss){
    airfieldBossDefeated=1; miniNukes.length=0; killed++; totalKills++;
    showAirfieldBossClear(e.x,e.y); hud(); return;
  }
  if(e.compoundBoss){
    compoundBossDefeated=1; bossHammers.length=0; killed++; totalKills++;
    fx.push({t:'ring',x:e.x,y:e.y,life:.5,max:.5}); showCompoundBossClear(e.x,e.y); hud(); return;
  }
  if(e.levelTwoBoss){
    levelTwoBossDefeated=1; meatShots.length=0; meatBits.length=0; killed++; totalKills++;
    showLevelTwoBossClear(e.x,e.y); hud(); return;
  }
  if(e.oilBoss){
    oilBossDefeated=1; fireBottles.length=0; killed++; totalKills++;
    showOilBossClear(e.x,e.y); hud(); return;
  }
  killed++; totalKills++;
  var a=(ang||0);
  var behead = !gib && !e.compoundBoss && Math.random()<.3;
  bakeCorpse(e.x,e.y,a+rr(-.35,.35),e.d.col,e.d.band,e.k,!!gib,behead);
  if(behead){
    launchPart(e.x,e.y,'head',e.d.col,e.d.band,a,1.25);
    mistBurst(e.x,e.y,a,26,1.5);
    bloodSpray(e.x,e.y,a,rr(90,160),44);
    wallHit(e.x,e.y,a,150);
  }
  mistBurst(e.x,e.y,a,gib?46:16,gib?1.9:1);
  if(Math.hypot(e.x-player.x,e.y-player.y)<190) screenSplat(gib?ri(9,16):ri(3,7));
  for(var bf=0;bf<fires.length;bf++){ // bodies dropped in a fire start burning
    if(Math.hypot(e.x-fires[bf].x,e.y-fires[bf].y)<fires[bf].r*2.4&&fires.length<15){
      fires.push({x:e.x,y:e.y,r:rr(8,12),p:rr(0,6),life:rr(14,26),sp:0});
      dc.fillStyle='rgba(14,10,8,.55)'; dc.beginPath(); dc.ellipse(e.x,e.y,20,13,0,0,6.3); dc.fill();
      break;
    }
  }
  payday(e,a);
  if(Math.random()<.34) dropFrag(e.x,e.y,ri(1,2),a,gib?1.2:.95);
  if(Math.random()<.36) dropGun(e.x,e.y,gunFor(e.k),a,gib?1.2:.9);
  if(Math.random()<.45) dropAmmo(e.x,e.y,a,gib?1.15:.9);
  if(e.fire>0&&fires.length<16)
    fires.push({x:e.x,y:e.y,r:rr(9,13),p:rr(0,6),life:rr(12,22),sp:0});
  var dropChance = e.boss?1:(e.k==='heavy'?.5:(e.k==='sniper'?.34:.26));
  if(e.boss){ dropTool(e.x,e.y,rollTool(),a,1.2); dropTool(e.x,e.y,'droneL',a+2,1.2); }
  if(Math.random()<dropChance) dropTool(e.x,e.y,rollTool(),a,gib?1.25:.95);
  if(!gib){
    for(var i=0;i<ri(6,11);i++) launchPart(e.x,e.y,'meat',e.d.col,e.d.band,a+rr(-1.2,1.2),rr(.55,.95));
    if(Math.random()<.35) launchPart(e.x,e.y,'hand',e.d.col,e.d.band,a,1.0);
    if(Math.random()<.3)  launchPart(e.x,e.y,'helmet',e.d.col,e.d.band,rr(0,6.3),1.1);
  }
  if(gib){ shake=Math.min(20,shake+8); sfx('hit',1); sfx('boom',.28);
    fx.push({t:'ring',x:e.x,y:e.y,life:.4,max:.4}); fx.push({t:'gore',x:e.x,y:e.y,life:.3,max:.3}); }
  else { sfx('hit',.8); fx.push({t:'ring',x:e.x,y:e.y,life:.3,max:.3}); }
  hud();
}
function downPlayer(){
  if(player.dead) return;
  if(aboard) aboard=false;
  player.dead=true; squadLost++;
  bakeCorpse(player.x,player.y,rr(0,6.28),PK.col,PK.band,player.wep,false);
  bloodPool(player.x,player.y,rr(20,30));
  mistBurst(player.x,player.y-16,rr(0,6.28),20,1.3);
  for(var i=0;i<ri(6,10);i++) launchPart(player.x,player.y,'meat',PK.col,PK.band,rr(0,6.28),rr(.6,1));
  droneCam={x:player.x,y:player.y,t:2.6};
  shake=Math.min(18,shake+8); sfx('hurt',1); screenSplat(ri(8,14));
  firing=false; actBtn.classList.remove('on');
  piloting=false; drone=null;
  respawnT=2.8;
  banner('MAN DOWN', crew.length? crew.length+' STILL STANDING':'NO ONE LEFT',2.2);
  hud();
}
function reviveOrEnd(){
  if(!crew.length){ banner('SQUAD WIPED OUT','',2.4); gameOver(false,'squad'); return; }
  var C=crew.shift();
  kitIdx=PKITS.indexOf(C.kit); if(kitIdx<0) kitIdx=0;
  PK=C.kit;
  player.dead=false; player.hp=player.mx; player.ap=0; player.hurt=0; player.bleed=0;
  var hs2=freeSpot(homeSpawn.x*TILE,homeSpawn.y*TILE);
  player.x=hs2.x; player.y=hs2.y;
  player.walk=0; player.amt=0; player.open=0; player.openC=null;
  player.nades=Math.max(player.nades,3);
  player.mag=WEAPONS[player.wep].mag;
  sfx('card'); banner(C.kit.n+' TAKING OVER',(crew.length+1)+' OF 5 LEFT',2.4);
  hud();
}
function hurtPlayer(dmg){
  if(player.dead) return;
  if(inBase(player.x,player.y)){                       // safe behind the wire
    fx.push({t:'ring',x:player.x,y:player.y-16,life:.25,max:.25});
    return;
  }
  if(piloting) dmg*=.5;
  if(player.ap>0){ var soak=Math.min(player.ap,dmg*.7); player.ap-=soak; dmg-=soak; }
  player.hp-=dmg; player.hurt=.2;
  flash.style.opacity=Math.min(.9,.25+dmg/40); setTimeout(function(){flash.style.opacity=0;},130);
  shake=Math.min(14,shake+dmg*.4); sfx('hurt',.7); hud();
  if(player.hp<=0){ player.hp=0; downPlayer(); }
}

/* =========================================================================
   UPDATE
   ========================================================================= */
function update(dt){
  timeAlive+=dt;
  if(player.dead&&state==='play'){
    respawnT-=dt;
    if(respawnT<=0) reviveOrEnd();
  }
  var W=WEAPONS[player.wep];

  // --- crate interaction takes over ACT
  var onCrate=null;
  for(var i=0;i<crates.length;i++){ var c=crates[i];
    if(!player.dead&&!c.open&&Math.hypot(c.x-player.x,c.y-player.y)<TILE*.95){ onCrate=c; break; } }

  // --- piloting the drone takes over the stick and the ACT button
  if(piloting&&drone){
    var kv2=keyVec(), dm=kv2||mv;
    drone.t-=dt;
    // Faster response and top speed for player-controlled aircraft.
    var dacc=drone.kind==='usv'?450:(drone.kind==='droneL'?1225:(drone.kind==='droneS'?1950:1700));
    var dmax=drone.kind==='usv'?135:(drone.kind==='droneL'?270:(drone.kind==='droneS'?380:335));
    if(drone.kind==='usv'){
      var seaDroneSpeed=SEA_DRONE_SPEED_BY_LEVEL[level]||1;
      dacc*=seaDroneSpeed; dmax*=seaDroneSpeed;
    } else {
      var levelDroneSpeed=DRONE_SPEED_BY_LEVEL[level]||1.50;
      dacc*=levelDroneSpeed; dmax*=levelDroneSpeed;
    }
    if(dm.m>0.05){
      drone.vx+=dm.x*dacc*dt*dm.m; drone.vy+=dm.y*dacc*dt*dm.m;
      drone.ang=Math.atan2(dm.y,dm.x);
    }
    var drag=drone.kind==='usv'?.93:.955;
    drone.vx*=drag; drone.vy*=drag;
    var dsp=Math.hypot(drone.vx,drone.vy);
    if(dsp>dmax){ drone.vx=drone.vx/dsp*dmax; drone.vy=drone.vy/dsp*dmax; }
    var nx3=Math.max(8,Math.min(WW-8,drone.x+drone.vx*dt));
    var ny3=Math.max(8,Math.min(WH-8,drone.y+drone.vy*dt));
    if(drone.kind==='usv'&&mapKind==='sea'){
      if(isWater(nx3,drone.y)) drone.x=nx3;
      else { drone.vx*=-.25; drone.vy+=(drone.vy>=0?1:-1)*120*dt; }
      if(isWater(drone.x,ny3)) drone.y=ny3;
      else { drone.vy*=-.25; drone.vx+=(drone.vx>=0?1:-1)*120*dt; }
      if(Math.random()<.7&&wakes.length<160) wakes.push({x:drone.x,y:drone.y,a:Math.atan2(drone.vy,drone.vx),
        life:1.6,max:1.6,w:9});
      for(var sm=seaMines.length-1;sm>=0&&piloting&&drone;sm--){
        if(!seaMines[sm].dead&&Math.hypot(drone.x-seaMines[sm].x,drone.y-seaMines[sm].y)<22){
          var hitMine=seaMines.splice(sm,1)[0]; detonateSeaMine(hitMine,true);
        }
      }
    } else { drone.x=nx3; drone.y=ny3; }
    drone.rot+=dt*40;
    if(Math.random()<.4) plume.push({x:drone.x+rr(-6,6),y:drone.y+rr(-6,6),vx:rr(-8,8),vy:rr(-4,10),
      life:rr(.3,.7),max:.7,s:rr(1.5,3.5),hot:0});
    for(var sq2=0;sq2<ships.length;sq2++){
      var SH=ships[sq2];
      if(SH.sink>0) continue;
      var rel=Math.atan2(drone.y-SH.y,drone.x-SH.x)-SH.ang, dr2=Math.hypot(drone.x-SH.x,drone.y-SH.y);
      if(Math.abs(Math.cos(rel)*dr2)<SH.len*.5+16&&Math.abs(Math.sin(rel)*dr2)<SH.wid*.5+16){
        droneBoom(drone.x,drone.y); break;
      }
    }
    if(piloting&&tank&&Math.hypot(tank.x-drone.x,tank.y-drone.y)<30) droneBoom(drone.x,drone.y);
    for(var di=0;piloting&&di<enemies.length;di++){
      if(Math.hypot(enemies[di].x-drone.x,enemies[di].y-drone.y)<19){ droneBoom(drone.x,drone.y); break; }
    }
    for(var wm=wingmen.length-1;wm>=0;wm--){
      var W=wingmen[wm];
      if(W.hurt>0) W.hurt-=dt;
      var ca=Math.cos(drone.ang), sa=Math.sin(drone.ang);
      var sx=drone.x+ca*(-W.off.dy)-sa*W.off.dx;
      var sy=drone.y+sa*(-W.off.dy)+ca*W.off.dx;
      var dx=sx-W.x, dy=sy-W.y, dd=Math.hypot(dx,dy);
      // Match the leader's velocity and aggressively correct back into formation.
      W.vx+=(drone.vx-W.vx)*Math.min(1,dt*7);
      W.vy+=(drone.vy-W.vy)*Math.min(1,dt*7);
      var pull=Math.min(2200,700+dd*12);
      if(dd>1){ W.vx+=dx/dd*pull*dt; W.vy+=dy/dd*pull*dt; }
      W.vx*=.965; W.vy*=.965;
      var wsp=Math.hypot(W.vx,W.vy), wmax=dmax*1.08;
      if(wsp>wmax){ W.vx=W.vx/wsp*wmax; W.vy=W.vy/wsp*wmax; }
      W.x+=W.vx*dt; W.y+=W.vy*dt; W.rot+=dt*40;
      if(Math.random()<.25&&plume.length<300)
        plume.push({x:W.x+rr(-5,5),y:W.y+rr(-5,5),vx:rr(-8,8),vy:rr(-4,10),
          life:rr(.25,.6),max:.6,s:rr(1.5,3.5),hot:0});
      // Companions stay with the leader and attack as one formation.
      if(W.hp<=0){ wingBoom(W); wingmen.splice(wm,1); }
    }
    if(piloting&&firing){ droneBoom(drone.x,drone.y); }
    if(piloting&&drone&&drone.t<=0) droneBoom(drone.x,drone.y);
    if(!piloting&&mapKind==='oil'&&relaunch>0) relaunch-=dt;
  }

  // --- parts that are not done moving
  for(var tw=twitchers.length-1;tw>=0;tw--){
    var TW=twitchers[tw];
    TW.life-=dt; TW.next-=dt;
    TW.z+=TW.vz*dt; if(TW.z>0) TW.vz-=GRAV*dt; else { TW.z=0; TW.vz=0; }
    if(TW.jerk>0){ TW.jerk-=dt; TW.rot+=TW.spin*dt; TW.spin*=.86; }
    if(TW.next<=0&&TW.count>0){
      TW.count--; TW.jerk=rr(.18,.4); TW.spin=rr(-9,9); TW.vz=rr(35,120);
      TW.x+=rr(-3,3); TW.y+=rr(-2,2);
      TW.next=rr(.7,3.4);
      mistBurst(TW.x,TW.y-4,rr(0,6.3),2,.5);
      bc.fillStyle='rgba('+ri(96,132)+',15,11,'+rr(.2,.45)+')';
      dc.beginPath(); dc.ellipse(TW.x+rr(-6,6),TW.y+rr(-4,4),rr(1.5,4),rr(1,2.6),rr(0,3),0,6.3); dc.fill();
    }
    if(TW.count<=0&&TW.jerk<=0&&TW.z<=0||TW.life<=0){ bakePart(TW); twitchers.splice(tw,1); }
  }

  if(fullMsg>0) fullMsg-=dt;
  // --- loot in flight, then on the ground
  for(var dp=drops.length-1;dp>=0;dp--){
    var DP=drops[dp]; DP.t+=dt;
    if(!DP.landed){
      DP.rot+=DP.spin*dt;
      DP.z+=DP.vz*dt; DP.vz-=GRAV*dt;
      DP.x+=DP.vx*dt; DP.y+=DP.vy*dt; DP.vx*=.995; DP.vy*=.995;
      if(DP.z<34&&blocksMove(T(Math.floor(DP.x/TILE),Math.floor(DP.y/TILE)))){
        DP.x-=DP.vx*dt; DP.y-=DP.vy*dt; DP.vx*=-.35; DP.vy*=-.35;
      }
      if(DP.z<=0){
        DP.z=0;
        if(Math.abs(DP.vz)>90&&DP.bounce<2){ DP.bounce++; DP.vz=-DP.vz*.36; DP.vx*=.5; DP.vy*=.5; DP.spin*=.5; }
        else {
          DP.landed=true; DP.vx=0; DP.vy=0; DP.vz=0;
          // Nudge off any prop/wall tile so players can reach the drop
          if(blocksMove(T(Math.floor(DP.x/TILE),Math.floor(DP.y/TILE)))){
            var dpFound=false;
            for(var dpR=1;dpR<=3&&!dpFound;dpR++){
              for(var dpD=0;dpD<8&&!dpFound;dpD++){
                var dpA=dpD*Math.PI/4, dpNX=DP.x+Math.cos(dpA)*dpR*TILE*.52, dpNY=DP.y+Math.sin(dpA)*dpR*TILE*.52;
                if(!blocksMove(T(Math.floor(dpNX/TILE),Math.floor(dpNY/TILE)))){ DP.x=dpNX; DP.y=dpNY; dpFound=true; }
              }
            }
          }
        }
      }
    } else {
      DP.life-=dt;
      if(DP.life<=0){ drops.splice(dp,1); continue; }
      var pdx=player.x-DP.x, pdy=player.y-DP.y, pdd=Math.hypot(pdx,pdy);
      if(!piloting&&(DP.cash>0||DP.frag||DP.ammo||DP.gun)&&pdd<(DP.gun?105:125)){   // cash and frags are drawn to you
        var pull=Math.min(620,140+ (125-pdd)*6);
        DP.x+=pdx/pdd*pull*dt; DP.y+=pdy/pdd*pull*dt;
      }
      if(!piloting&&pdd<((DP.cash>0||DP.frag||DP.ammo)?19:30)){
        if(DP.cash>0){
          money+=DP.cash; sfx('ric',.35);
          fx.push({t:'txt',x:DP.x,y:DP.y,life:.85,max:.85,s:'+'+DP.cash,c:'#e2b13c'});
          drops.splice(dp,1); hud(); continue;
        } else if(DP.frag){
          player.nades+=DP.frag; sfx('reload',.6);
          fx.push({t:'txt',x:DP.x,y:DP.y,life:.85,max:.85,s:'+'+DP.frag+' FRAG',c:'#9db35a'});
          drops.splice(dp,1); hud(); continue;
        } else if(DP.ammo){
          var Wa=WEAPONS[player.wep], got2=Math.round(Wa.mag*rr(1.2,2.4));
          player.res+=got2; syncGun(); sfx('reload',.5);
          fx.push({t:'txt',x:DP.x,y:DP.y,life:.85,max:.85,s:'+'+got2+' RDS',c:'#c8a24a'});
          drops.splice(dp,1); hud(); continue;
        } else if(DP.gun){
          var got=addGun(DP.gun);
          fx.push({t:'txt',x:DP.x,y:DP.y,life:.95,max:.95,s:got,c:'#e8e4d8'});
          drops.splice(dp,1); hud(); continue;
        } else if(belt.length<6){
          if(beltAdd(DP.k)){ banner(TOOLS[DP.k].n,'PICKED UP',1); drops.splice(dp,1); continue; }
        } else if((fullMsg||0)<=0){ fullMsg=2.5; banner('BELT FULL','USE A TOOL FIRST',1.1); }
      }
    }
  }
  // --- sentries
  for(var sy=sentries.length-1;sy>=0;sy--){
    var SY=sentries[sy]; SY.t-=dt; SY.cd-=dt;
    if(SY.t<=0){ sentries.splice(sy,1); continue; }
    var bt=null,bdd=1e9;
    for(var se=0;se<enemies.length;se++){ var EN=enemies[se], dd2=Math.hypot(EN.x-SY.x,EN.y-SY.y);
      if(dd2<340&&dd2<bdd&&los(SY.x,SY.y,EN.x,EN.y)&&!smokeBlocked(SY.x,SY.y,EN.x,EN.y)){ bdd=dd2; bt=EN; } }
    if(bt){
      SY.ang=Math.atan2(bt.y-SY.y,bt.x-SY.x);
      if(SY.cd<=0){ SY.cd=.16;
        var sa=SY.ang+rr(-.06,.06);
        bullets.push({x:SY.x+Math.cos(SY.ang)*13,y:SY.y+Math.sin(SY.ang)*13,
          vx:Math.cos(sa)*700,vy:Math.sin(sa)*700,dmg:13,life:1.1,pierce:0,trail:12});
        fx.push({t:'flash',x:SY.x,y:SY.y,a:SY.ang,life:.05,max:.05,s:.7}); sfx('enemy',.35);
      }
    }
  }
  // --- called-in rounds
  for(var sk=strikes.length-1;sk>=0;sk--){
    strikes[sk].t-=dt;
    if(strikes[sk].t<=0){ explode(strikes[sk].x,strikes[sk].y,105,120,true); strikes.splice(sk,1); }
  }
  // --- smoke
  for(var sm2=smokes.length-1;sm2>=0;sm2--){
    var SM=smokes[sm2]; SM.t-=dt;
    SM.r=SM.max*Math.min(1,(SM.dur-SM.t)/1.6)*Math.min(1,SM.t/1.2+.15);
    if(SM.t<=0){ smokes.splice(sm2,1); continue; }
    if(Math.random()<.7) plume.push({x:SM.x+rr(-SM.r*.7,SM.r*.7),y:SM.y+rr(-SM.r*.5,SM.r*.5),
      vx:rr(-9,9),vy:rr(-14,4),life:rr(1,2),max:2,s:rr(9,18),hot:0});
  }
  // --- standing in fire hurts
  for(var fd2=0;fd2<fires.length;fd2++){
    var FD=fires[fd2];
    for(var fe=enemies.length-1;fe>=0;fe--){
      var FE=enemies[fe];
      if(Math.hypot(FE.x-FD.x,FE.y-FD.y)<FD.r*1.15) hurtEnemy(FE,26*dt,rr(0,6.3));
    }
    if(!piloting&&Math.hypot(player.x-FD.x,player.y-FD.y)<FD.r*.95){
      player.fireT=(player.fireT||0)+dt;
      if(player.fireT>.4){ player.fireT=0; hurtPlayer(4); }
    }
  }

  // --- movement
  var kv=keyVec(), m=kv||mv;
  if(piloting||player.dead||aboard){ m={x:0,y:0,m:0}; }
  if(player.stim>0) player.stim-=dt;
  if(player.recoil>0) player.recoil=Math.max(0,player.recoil-dt*11);
  if(player.flamer>0){ player.flamer-=dt; if(player.flamer<=0){ player.flamer=0; hud(); } }
  var sp=162*(player.stim>0?1.45:1), tt=T(Math.floor(player.x/TILE),Math.floor(player.y/TILE));
  if(slowT(tt)) sp*=.66;
  if(player.open>0) sp*=.0;
  if(m.m>0.05){
    var v=sp*m.m*dt;
    moveEnt(player,m.x*v,m.y*v);
    player.lvx=m.x*sp*m.m; player.lvy=m.y*sp*m.m;
    // Movement owns the character's facing direction. Auto-aim may only turn
    // the character while standing still, preventing backward moonwalking.
    player.face=Math.atan2(m.y,m.x);
    player.walk+=dt*m.m*12;
    // Footfalls trigger sound only. No player footprint or ground-trail marks
    // are painted on any terrain type or level.
    var foot=Math.floor(player.walk/Math.PI);
    if(foot!==player.lastFoot){
      player.lastFoot=foot;
      footstep(footSurface(player.x,player.y,tt),.16);
    }
    player.amt=Math.min(1,(player.amt||0)+dt*9);
  } else { player.amt=Math.max(0,(player.amt||0)-dt*9); player.lvx=0; player.lvy=0; }

  // --- ACT
  if(onCrate&&!piloting){
    if(player.openC!==onCrate){ player.openC=onCrate; player.open=0; }
    player.open+=dt/(firing?.45:1.0);   // opens on its own, ACT just hurries it
    if(player.open>=1){ openCrate(onCrate); player.open=0; player.openC=null; }
  } else if(!onCrate&&!piloting&&!player.dead){
    player.open=0; player.openC=null;
    player.cd-=dt;
    if(player.reload>0){ player.reload-=dt; if(player.reload<=0){ player.reload=0; finishReload(); } }
    if(aboard){ }
    else if(player.flamer>0){
      if(firing&&!player.dead) spray(dt);
    } else if(firing&&!player.dead&&player.cd<=0) shoot();
  }
  if(player.hurt>0) player.hurt-=dt;
  // Remaining in the marked field-aid zone restores health slowly.
  if(medStation&&medStation.healX!==undefined&&!player.dead&&!piloting&&!aboard){
    var inHeal=Math.hypot(player.x-medStation.healX,player.y-medStation.healY)<=medStation.healR;
    medStation.healing=inHeal&&player.hp<player.mx;
    if(medStation.healing){
      player.hp=Math.min(player.mx,player.hp+4*dt);
      medStation.healFx-=dt;
      if(medStation.healFx<=0){
        medStation.healFx=.55;
        fx.push({t:'ring',x:player.x,y:player.y-8,life:.45,max:.45,c:'#72e0a0'});
      }
      hud();
    }
  } else if(medStation) medStation.healing=0;
  if(!player.dead&&player.hp<=player.mx*.5){
    player.bleed=(player.bleed||0)-dt;
    if(player.bleed<=0){
      player.bleed=player.hp<=player.mx*.25?.1:.24;
      if(!onWall(player.x,player.y)){
        bc.fillStyle='rgba('+ri(96,140)+',15,11,'+rr(.3,.62)+')';
        dc.beginPath(); dc.ellipse(player.x+rr(-5,5),player.y+rr(-3,4),rr(1.4,3.6),rr(1,2.6),rr(0,3),0,6.3); dc.fill();
      }
      if(Math.random()<.5) mistBurst(player.x,player.y-14,rr(0,6.3),1,.45);
    }
  }
  setAct(onCrate);

  // --- flow field
  flowT-=dt; if(flowT<=0){ buildFlow(); flowT=.3; }

  // --- spawning
  if(queue.length<4){                        // a steady flow keeps coming while any base holds
    var open=0;
    for(var oq=0;oq<flags.length;oq++) if(flags[oq].state!=='done') open++;
    if(open&&mapKind==='compound') for(var rf=0;rf<6;rf++) queue.push(fieldKind(level));
    spawnQ=queue.length;
  }
  var basesLeft=0;
  for(var bl2=0;bl2<flags.length;bl2++) if(flags[bl2].state!=='done') basesLeft++;
  if(!basesLeft&&queue.length){ queue.length=0; spawnQ=0; }
  if(spawnQ>0){ spawnT-=dt;
    if(spawnT<=0){
      var fieldCount=0;
      for(var fc=0;fc<enemies.length;fc++) if(!enemies[fc].home) fieldCount++;
      var cap=8+Math.min(8,level)+((flag&&flag.assault)?6:0);
      if(fieldCount<cap){ doSpawn(); spawnT=rr(3.56,7.59)/(1+level*.13)*(flag&&flag.assault?.45:1); }
      else spawnT=.6;
    } }

  // --- Level 5 boss: fictional mini-nukes with compact arcade blast effects
  for(var mn=miniNukes.length-1;mn>=0;mn--){
    var MN=miniNukes[mn]; MN.t+=dt; MN.rot+=dt*8;
    var mp=Math.min(1,MN.t/MN.dur); MN.x=MN.sx+(MN.tx-MN.sx)*mp; MN.y=MN.sy+(MN.ty-MN.sy)*mp;
    if(mp>=1){
      fx.push({t:'miniNuke',x:MN.x,y:MN.y,life:1.45,max:1.45,r:112}); fx.push({t:'boom',x:MN.x,y:MN.y,life:.6,max:.6,r:112}); fx.push({t:'ring',x:MN.x,y:MN.y,life:.75,max:.75});
      for(var nc=0;nc<18;nc++) plume.push({x:MN.x+rr(-18,18),y:MN.y+rr(-12,12),vx:rr(-35,35),vy:-rr(35,95),life:rr(.8,1.7),max:1.7,s:rr(6,13),hot:.75});
      if(Math.hypot(player.x-MN.x,player.y-MN.y)<105) hurtPlayer(38);
      if(drone&&Math.hypot(drone.x-MN.x,drone.y-MN.y)<110){ drone.hp-=90; if(drone.hp<=0){ if(drone.pad) drone.pad.cd=0; drone=null; piloting=false; banner('DRONE LOST','MINI-NUKE BLAST',1.5); } }
      shake=Math.min(16,shake+10); sfx('boom',.85); miniNukes.splice(mn,1);
    }
  }

  // --- Level 1 boss: high arcing, spinning hammers aimed at player or drone.
  for(var hm=bossHammers.length-1;hm>=0;hm--){
    var HM=bossHammers[hm]; HM.t+=dt; HM.rot+=HM.spin*dt;
    var hp0=Math.min(1,HM.t/HM.dur); HM.x=HM.sx+(HM.tx-HM.sx)*hp0; HM.y=HM.sy+(HM.ty-HM.sy)*hp0;
    if(hp0>=1){
      fx.push({t:'ring',x:HM.x,y:HM.y,life:.35,max:.35}); dustPuff(HM.x,HM.y,8,1.1);
      if(Math.hypot(player.x-HM.x,player.y-HM.y)<52) hurtPlayer(30);
      for(var hw=wingmen.length-1;hw>=0;hw--) if(Math.hypot(wingmen[hw].x-HM.x,wingmen[hw].y-HM.y)<52){ wingmen[hw].hp-=70; wingmen[hw].hurt=.2; }
      if(drone&&Math.hypot(drone.x-HM.x,drone.y-HM.y)<58){
        drone.hp-=75; fx.push({t:'spark',x:drone.x,y:drone.y,life:.2,max:.2});
        if(drone.hp<=0){
          explode(drone.x,drone.y,40,0,true); if(drone.pad) drone.pad.cd=0;
          drone=null; piloting=false; firing=false; actBtn.classList.remove('on'); banner('DRONE HIT BY HAMMER','ANOTHER IS READY',1.6);
        }
      }
      shake=Math.min(10,shake+4); sfx('ric',.8); bossHammers.splice(hm,1);
    }
  }

  // Level 2 boss: oversized arcade meat projectiles and stylized impact debris.
  for(var ms=meatShots.length-1;ms>=0;ms--){
    var MS=meatShots[ms]; MS.t+=dt; MS.rot+=dt*MS.spin;
    var msp=Math.min(1,MS.t/MS.dur); MS.x=MS.sx+(MS.tx-MS.sx)*msp; MS.y=MS.sy+(MS.ty-MS.sy)*msp;
    MS.trail=(MS.trail||0)-dt;
    if(MS.trail<=0){ MS.trail=.055; meatBits.push({kind:'drop',x:MS.x+rr(-7,7),y:MS.y-rr(4,14),vx:rr(-18,18),vy:rr(5,34),life:rr(.35,.65),max:.65,s:rr(1.8,3.5),rot:0}); }
    if(msp>=1){
      if(Math.hypot(player.x-MS.x,player.y-MS.y)<62) hurtPlayer(34);
      if(drone&&Math.hypot(drone.x-MS.x,drone.y-MS.y)<72){
        drone.hp-=85; fx.push({t:'spark',x:drone.x,y:drone.y,life:.25,max:.25});
        if(drone.hp<=0){ explode(drone.x,drone.y,45,0,true); if(drone.pad) drone.pad.cd=0; drone=null; piloting=false; firing=false; actBtn.classList.remove('on'); banner('DRONE HIT BY GRINDER SHOT','ANOTHER DRONE IS READY',1.6); }
      }
      // Impact: skull + hand fly out, plus a handful of meat — same as a frag kill but capped.
      launchPart(MS.x,MS.y-10,'skull',null,null,rr(0,6.3),rr(.9,1.3));
      launchPart(MS.x,MS.y-10,'hand', null,null,rr(0,6.3),rr(.9,1.3));
      for(var mb=0;mb<ri(6,10);mb++) launchPart(MS.x,MS.y-10,'meat',null,null,rr(0,6.3),rr(.7,1.2));
      fx.push({t:'boom',x:MS.x,y:MS.y,life:.58,max:.58,r:88}); fx.push({t:'ring',x:MS.x,y:MS.y,life:.45,max:.45});
      fx.push({t:'ring',x:MS.x,y:MS.y,life:.7,max:.7,c:'#b54735'});
      dustPuff(MS.x,MS.y,16,1.5); shake=Math.min(16,shake+10); sfx('boom',.62); meatShots.splice(ms,1);
    }
  }

  for(var mbi=meatBits.length-1;mbi>=0;mbi--){
    var MB=meatBits[mbi]; MB.life-=dt; if(MB.life<=0){ meatBits.splice(mbi,1); continue; }
    MB.vy+=260*dt; MB.x+=MB.vx*dt; MB.y+=MB.vy*dt; MB.rot+=dt*5;
  }

  // Level 4 boss: arcing, stylized fire bottles that leave short-lived fire patches.
  for(var fb4=fireBottles.length-1;fb4>=0;fb4--){
    var F4=fireBottles[fb4]; F4.t+=dt; F4.rot+=F4.spin*dt;
    var fp4=Math.min(1,F4.t/F4.dur); F4.x=F4.sx+(F4.tx-F4.sx)*fp4; F4.y=F4.sy+(F4.ty-F4.sy)*fp4;
    if(fp4>=1){
      fx.push({t:'boom',x:F4.x,y:F4.y,life:.5,max:.5,r:82}); fx.push({t:'ring',x:F4.x,y:F4.y,life:.48,max:.48,c:'#ff8b2b'});
      fires.push({x:F4.x,y:F4.y,r:30,p:rr(0,6),life:10,sp:0});
      for(var ff4=0;ff4<4&&fires.length<16;ff4++) fires.push({x:F4.x+rr(-38,38),y:F4.y+rr(-28,28),r:rr(9,17),p:rr(0,6),life:rr(5,9),sp:0});
      if(Math.hypot(player.x-F4.x,player.y-F4.y)<82) hurtPlayer(34);
      if(drone&&Math.hypot(drone.x-F4.x,drone.y-F4.y)<88){ drone.hp-=80; if(drone.hp<=0){ explode(drone.x,drone.y,45,0,true); if(drone.pad) drone.pad.cd=0; drone=null; piloting=false; firing=false; actBtn.classList.remove('on'); banner('DRONE LOST','FIRE-BOTTLE IMPACT',1.5); } }
      shake=Math.min(13,shake+7); sfx('boom',.7); fireBottles.splice(fb4,1);
    }
  }

  // --- final boss flaming oil barrels
  for(var bb=bossBarrels.length-1;bb>=0;bb--){
    var BR=bossBarrels[bb]; BR.t+=dt; BR.rot+=BR.spin*dt;
    var bp=Math.min(1,BR.t/BR.dur);
    BR.x=BR.sx+(BR.tx-BR.sx)*bp; BR.y=BR.sy+(BR.ty-BR.sy)*bp;
    if(bp>=1){
      fx.push({t:'boom',x:BR.x,y:BR.y,life:.5,max:.5,r:96});
      fires.push({x:BR.x,y:BR.y,r:34,p:rr(0,6),life:12,sp:0});
      for(var bf=0;bf<5;bf++) fires.push({x:BR.x+rr(-48,48),y:BR.y+rr(-34,34),r:rr(10,20),p:rr(0,6),life:rr(7,12),sp:0});
      if(Math.hypot(player.x-BR.x,player.y-BR.y)<94) hurtPlayer(42);
      if(mapKind==='redSquare'&&inBase(BR.x,BR.y)){
        baseHP=Math.max(0,baseHP-60); baseFlash=.7;
        banner('HOME BASE HIT',Math.round(baseHP/baseMX*100)+'% INTEGRITY',1.1); hud();
        if(baseHP<=0){ bossBarrels.length=0; banner('BASE DESTROYED','MISSION FAILED',2.2); gameOver(false,'base'); }
      }
      shake=Math.min(14,shake+8); sfx('boom',.8); bossBarrels.splice(bb,1);
    }
  }

  // --- enemies
  for(var e=0;e<enemies.length;e++){
    var en=enemies[e], d=en.d;
    var pd=Math.hypot(player.x-en.x,player.y-en.y);
    var see=pd<d.range&&(!inBase(player.x,player.y)||en.marine)&&los(en.x,en.y,player.x,player.y)&&!smokeBlocked(en.x,en.y,player.x,player.y);
    if(en.airGuard){
      var guardedPlane=aircraft[en.guardAircraft];
      if(guardedPlane&&Math.hypot(player.x-guardedPlane.x,player.y-guardedPlane.y)>430) see=false;
    }
    if(en.redGuard){
      var redCx=(en.home.x0+en.home.x1)*.5*TILE,redCy=(en.home.y0+en.home.y1)*.5*TILE;
      if(Math.hypot(player.x-redCx,player.y-redCy)>410) see=false;
    }
    if(en.hurt>0) en.hurt-=dt;
    if(en.fire>0){
      en.fire-=dt;
      hurtEnemy(en,26*dt,rr(0,6.28));
      if(!en.hp||en.hp<=0) continue;
      if(flames.length<200&&Math.random()<.6)
        flames.push({x:en.x+rr(-7,7),y:en.y-rr(4,26),vx:rr(-16,16),vy:-rr(24,60),
          life:rr(.3,.6),max:.6,s:rr(3,7)});
      if(Math.random()<.05) embers.push({x:en.x+rr(-8,8),y:en.y-rr(2,20),
        vx:rr(-24,24),vy:-rr(30,70),life:rr(.5,1.2),max:1.2});
      for(var oe=0;oe<enemies.length;oe++){                       // fire spreads in a huddle
        var O2=enemies[oe];
        if(O2!==en&&!O2.fire&&Math.hypot(O2.x-en.x,O2.y-en.y)<26&&Math.random()<.02) igniteEnemy(O2);
      }
    }
    if(en.hp<en.mx*.55){
      en.drip=(en.drip||0)-dt;
      if(en.drip<=0){ en.drip=en.hp<en.mx*.25?.09:.2;
        bc.fillStyle='rgba('+ri(96,138)+',15,11,'+rr(.3,.65)+')';
        dc.beginPath(); dc.ellipse(en.x+rr(-4,4),en.y+rr(-3,3),rr(1.6,4),rr(1.2,3),rr(0,3),0,6.3); dc.fill();
        if(en.hp<en.mx*.25&&Math.random()<.5) mistBurst(en.x,en.y-14,rr(0,6.3),2,.5);
      }
    }
    if(en.stag>0) en.stag-=dt;
    if(en.levelTwoBoss){
      var mgTarget=(piloting&&drone)?drone:player,mgx=mgTarget.x-en.x,mgy=mgTarget.y-en.y,mgd=Math.hypot(mgx,mgy)||1;
      en.ang=Math.atan2(mgy,mgx);
      var mgDir=mgd>305?1:(mgd<220?-1:0),mgVX,mgVY;
      if(mgDir){ mgVX=mgx/mgd*d.spd*mgDir; mgVY=mgy/mgd*d.spd*mgDir; }
      else { mgVX=Math.cos(en.ang+Math.PI/2)*d.spd*.42; mgVY=Math.sin(en.ang+Math.PI/2)*d.spd*.42; }
      en.cvx+=(mgVX-en.cvx)*Math.min(1,dt*4); en.cvy+=(mgVY-en.cvy)*Math.min(1,dt*4);
      var mgOX=en.x,mgOY=en.y; moveEnt(en,en.cvx*dt,en.cvy*dt);
      var mgMoved=Math.hypot(en.x-mgOX,en.y-mgOY); en.walk+=mgMoved*.12; en.amt+=(Math.min(1,mgMoved/Math.max(dt,.001)/38)-en.amt)*Math.min(1,dt*7);
      en.meatCd-=dt; en.grind=(en.grind||0)+dt*10;
      if(en.meatCd<=0&&mgd<720&&los(en.x,en.y,mgTarget.x,mgTarget.y)){
        var mgSx=en.x+24,mgSy=en.y-23;
        var mgAng2=Math.atan2(mgTarget.y-mgSy,mgTarget.x-mgSx);
        var mgKnd=Math.random()<.28?'hand':(Math.random()<.45?'arm':'meat');
        meatShots.push({sx:mgSx,sy:mgSy,x:mgSx,y:mgSy,tx:mgTarget.x+(mgTarget.vx||mgTarget.lvx||0)*.2,ty:mgTarget.y+(mgTarget.vy||mgTarget.lvy||0)*.2,t:0,dur:rr(.72,.92),rot:0,spin:rr(7,11),trail:0,kind:mgKnd});
        // Launch a burst of body parts from the grinder mouth toward the target.
        launchPart(mgSx,mgSy,'hand',en.d?en.d.col:null,en.d?en.d.band:null,mgAng2+rr(-.35,.35),rr(1.2,1.6));
        launchPart(mgSx,mgSy,'arm', en.d?en.d.col:null,en.d?en.d.band:null,mgAng2+rr(-.45,.45),rr(1.1,1.5));
        for(var gpl=0;gpl<ri(3,5);gpl++)
          launchPart(mgSx,mgSy,'meat',en.d?en.d.col:null,en.d?en.d.band:null,mgAng2+rr(-.6,.6),rr(1.1,1.6));
        en.meatCd=rr(1.35,1.8); banner('GRINDER SHOT','MOVE AWAY FROM THE IMPACT ZONE',.7);
      }
      continue;
    }
    if(en.oilBoss){
      var fireTarget=(piloting&&drone)?drone:player,fdx=fireTarget.x-en.x,fdy=fireTarget.y-en.y,fdd=Math.hypot(fdx,fdy)||1;
      en.ang=Math.atan2(fdy,fdx);
      var fdir=fdd>290?1:(fdd<190?-1:0),fwx,fwy;
      if(fdir){ fwx=fdx/fdd*d.spd*fdir; fwy=fdy/fdd*d.spd*fdir; }
      else { fwx=Math.cos(en.ang+Math.PI/2)*d.spd*.46; fwy=Math.sin(en.ang+Math.PI/2)*d.spd*.46; }
      en.cvx+=(fwx-en.cvx)*Math.min(1,dt*4.5); en.cvy+=(fwy-en.cvy)*Math.min(1,dt*4.5);
      var fox=en.x,foy=en.y; moveEnt(en,en.cvx*dt,en.cvy*dt); var fmove=Math.hypot(en.x-fox,en.y-foy);
      en.walk+=fmove*.12; en.amt+=(Math.min(1,fmove/Math.max(dt,.001)/38)-en.amt)*Math.min(1,dt*7);
      en.fireBottleCd-=dt;
      if(en.fireBottleCd<=0&&fdd<700&&los(en.x,en.y,fireTarget.x,fireTarget.y)){
        fireBottles.push({sx:en.x,sy:en.y-25,x:en.x,y:en.y-25,tx:fireTarget.x+(fireTarget.vx||fireTarget.lvx||0)*.22,ty:fireTarget.y+(fireTarget.vy||fireTarget.lvy||0)*.22,t:0,dur:rr(.68,.88),rot:0,spin:rr(8,12)});
        en.fireBottleCd=rr(1.15,1.55); banner('FIRE BOTTLE INBOUND','MOVE OUT OF THE BURN ZONE',.7);
      }
      continue;
    }
    if(en.airfieldBoss){
      var nkTarget=(piloting&&drone)?drone:player,nkx=nkTarget.x-en.x,nky=nkTarget.y-en.y,nkd=Math.hypot(nkx,nky)||1;
      en.ang=Math.atan2(nky,nkx);
      var nDir=nkd>285?1:(nkd<205?-1:0),nWantX,nWantY;
      if(nDir){ nWantX=nkx/nkd*d.spd*nDir; nWantY=nky/nkd*d.spd*nDir; }
      else { nWantX=Math.cos(en.ang+Math.PI/2)*d.spd*.42; nWantY=Math.sin(en.ang+Math.PI/2)*d.spd*.42; }
      var nSm=Math.min(1,dt*4.5); en.cvx+=(nWantX-en.cvx)*nSm; en.cvy+=(nWantY-en.cvy)*nSm;
      moveEnt(en,en.cvx*dt,en.cvy*dt); en.walk+=dt*(3+Math.hypot(en.cvx,en.cvy)/15); en.amt=1;
      en.nukeCd-=dt;
      if(en.nukeCd<=0&&nkd<720&&los(en.x,en.y,nkTarget.x,nkTarget.y)){
        miniNukes.push({sx:en.x,sy:en.y-24,x:en.x,y:en.y-24,tx:nkTarget.x,ty:nkTarget.y,t:0,dur:rr(.9,1.1),rot:0});
        en.nukeCd=rr(1.8,2.4); banner('MINI-NUKE INBOUND','CLEAR THE BLAST MARKER',.8);
      }
      continue;
    }
    if(en.compoundBoss){
      var hammerTarget=(piloting&&drone)?drone:player;
      var hdx=hammerTarget.x-en.x,hdy=hammerTarget.y-en.y,hpd=Math.hypot(hdx,hdy);
      en.ang=Math.atan2(hdy,hdx);
      // Relentless pursuit: close distance whenever possible and circle at close range; never retreat.
      var oldBX=en.x,oldBY=en.y,chDir=hpd>115?1:0,strafeSide=(en.sid%2?1:-1);
      var wantVX,wantVY;
      if(chDir){ wantVX=Math.cos(en.ang)*d.spd*chDir; wantVY=Math.sin(en.ang)*d.spd*chDir; }
      else { wantVX=Math.cos(en.ang+strafeSide*Math.PI/2)*d.spd*.38+Math.cos(en.ang)*d.spd*.16; wantVY=Math.sin(en.ang+strafeSide*Math.PI/2)*d.spd*.38+Math.sin(en.ang)*d.spd*.16; }
      var smoothMove=Math.min(1,dt*5.2);
      en.cvx+=(wantVX-en.cvx)*smoothMove; en.cvy+=(wantVY-en.cvy)*smoothMove;
      moveEnt(en,en.cvx*dt,en.cvy*dt);
      var movedBoss=Math.hypot(en.x-oldBX,en.y-oldBY),bossSpeed=movedBoss/Math.max(dt,.001);
      if(movedBoss<.18){
        en.stuckT=(en.stuckT||0)+dt;
        en.cvx=Math.cos(en.ang+strafeSide*Math.PI/2)*d.spd*.62;
        en.cvy=Math.sin(en.ang+strafeSide*Math.PI/2)*d.spd*.62;
        moveEnt(en,en.cvx*dt,en.cvy*dt);
      } else en.stuckT=Math.max(0,(en.stuckT||0)-dt*2);
      if(en.stuckT>2.4){ var escape=freeSpot(en.x+Math.cos(en.ang+strafeSide*Math.PI/2)*TILE*1.5,en.y+Math.sin(en.ang+strafeSide*Math.PI/2)*TILE*1.5); en.x=escape.x; en.y=escape.y; en.cvx=en.cvy=0; en.stuckT=0; }
      // Drive the gait from distance actually travelled, so blocked movement cannot
      // make the boss moonwalk or rapidly cycle his legs in place.
      movedBoss=Math.hypot(en.x-oldBX,en.y-oldBY); bossSpeed=movedBoss/Math.max(dt,.001);
      var gaitTarget=Math.min(1,bossSpeed/42);
      en.walkBlend=(en.walkBlend||0)+(gaitTarget-(en.walkBlend||0))*Math.min(1,dt*7);
      if(movedBoss>.025) en.walk+=movedBoss*.115;
      en.amt=en.walkBlend;
      en.hammerCd=(en.hammerCd||0)-dt;
      if(en.hammerWind>0){
        en.hammerWind-=dt;
        if(en.hammerWind<=0){
          var hdur=rr(.42,.52),htx=en.hammerTX,hty=en.hammerTY;
          bossHammers.push({sx:en.x-18,sy:en.y-28,x:en.x-18,y:en.y-28,tx:htx,ty:hty,t:0,dur:hdur,rot:0,spin:rr(10,15)});
          en.hammerCd=rr(.48,.68); banner('HAMMER THROW','KEEP MOVING',.42);
        }
      } else if(en.hammerCd<=0&&hpd<680&&los(en.x,en.y,hammerTarget.x,hammerTarget.y)){
        en.hammerWind=.30;
        en.hammerTX=hammerTarget.x+(hammerTarget.vx||hammerTarget.lvx||0)*.32;
        en.hammerTY=hammerTarget.y+(hammerTarget.vy||hammerTarget.lvy||0)*.32;
      }
      continue;
    }
    if(en.finalBoss){
      en.horsePhase=(en.horsePhase||0)+dt*7;
      en.ang=Math.atan2(player.y-en.y,player.x-en.x);
      var bossStep=d.spd*dt, bossDir=pd>235?1:(pd<150?-1:0);
      if(bossDir) moveEnt(en,Math.cos(en.ang)*bossStep*bossDir,Math.sin(en.ang)*bossStep*bossDir);
      else moveEnt(en,Math.cos(en.ang+Math.PI/2)*bossStep*.55,Math.sin(en.ang+Math.PI/2)*bossStep*.55);
      en.walk+=dt*7; en.amt=1; en.barrelCd=(en.barrelCd||0)-dt;
      if(en.barrelCd<=0&&pd<560&&los(en.x,en.y,player.x,player.y)){
        en.barrelCount=(en.barrelCount||0)+1;
        var attackBase=en.barrelCount%4===0,throwDur=attackBase?1.05:rr(.62,.78);
        var leadX=attackBase?(BASE.x0+BASE.x1)*.5*TILE:player.x+(player.lvx||0)*.22;
        var leadY=attackBase?(BASE.y0+BASE.y1)*.5*TILE:player.y+(player.lvy||0)*.22;
        bossBarrels.push({sx:en.x,sy:en.y-24,x:en.x,y:en.y-24,tx:leadX,ty:leadY,t:0,dur:throwDur,rot:0,spin:rr(7,11)});
        en.barrelCd=rr(1.05,1.45); banner('FLAMING BARREL','MOVE OUT OF THE TARGET CIRCLE',.65);
      }
      continue;
    }
    // steering
    var mvx=0,mvy=0;
    // Airfield cargo crews shuttle weapon cases from the aircraft to the apron piles.
    if(en.airWorker){
      var workPlane=aircraft[en.guardAircraft];
      if(!workPlane||workPlane.dead){ en.dug=true; en.airWorker=0; continue; }
      var wax=en.workDir>0?en.workToX:en.workFromX, way=en.workDir>0?en.workToY:en.workFromY;
      var wdx=wax-en.x,wdy=way-en.y,wdd=Math.hypot(wdx,wdy)||1,wstep=d.spd*.58*dt;
      if(wdd<8){
        if(en.workDir>0) workPlane.weaponPile=Math.min(14,(workPlane.weaponPile||0)+1);
        en.workDir*=-1; en.carry=en.workDir>0; en.workPause=rr(.25,.7);
      } else if((en.workPause||0)>0) en.workPause-=dt;
      else moveEnt(en,wdx/wdd*wstep,wdy/wdd*wstep);
      en.ang=Math.atan2(wdy,wdx); en.walk+=dt*8; en.amt=(en.workPause||0)>0?0:1;
      en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.45;
      continue;
    }
    // Aircraft guards roam around their assigned plane and cargo instead of standing still.
    if(en.airGuard&&!see){
      en.patrolT=(en.patrolT||0)-dt;
      if(en.patrolT<=0||en.patrolX===undefined||Math.hypot(en.patrolX-en.x,en.patrolY-en.y)<14){
        en.patrolX=rr((en.home.x0+1)*TILE,(en.home.x1-1)*TILE);
        en.patrolY=rr((en.home.y0+1)*TILE,(en.home.y1-1)*TILE);
        en.patrolT=rr(2.2,5.2);
      }
      var agx=en.patrolX-en.x,agy=en.patrolY-en.y,agd=Math.hypot(agx,agy)||1;
      var agStep=d.spd*.62*dt,agOldX=en.x,agOldY=en.y;
      moveEnt(en,agx/agd*agStep,agy/agd*agStep);
      if(en.x<en.home.x0*TILE||en.x>en.home.x1*TILE||en.y<en.home.y0*TILE||en.y>en.home.y1*TILE){ en.x=agOldX; en.y=agOldY; en.patrolT=0; }
      en.ang=Math.atan2(agy,agx); en.walk+=dt*8; en.amt=1;
      en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.4;
      continue;
    }
    // Red Square guards circulate around their assigned building and return after contact.
    if(en.redGuard&&!see){
      en.patrolT=(en.patrolT||0)-dt;
      if(en.patrolT<=0||en.patrolX===undefined||Math.hypot(en.patrolX-en.x,en.patrolY-en.y)<13){
        var redAng=rr(0,6.283),redRadX=rr(105,175),redRadY=rr(82,135);
        en.patrolX=redCx+Math.cos(redAng)*redRadX; en.patrolY=redCy+Math.sin(redAng)*redRadY;
        en.patrolT=rr(2.3,5.8);
      }
      var rgx=en.patrolX-en.x,rgy=en.patrolY-en.y,rgd=Math.hypot(rgx,rgy)||1,rgStep=d.spd*.66*dt;
      moveEnt(en,rgx/rgd*rgStep,rgy/rgd*rgStep);
      en.ang=Math.atan2(rgy,rgx); en.walk+=dt*8.5; en.amt=1;
      en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.4;
      continue;
    }
    // Depot guards patrol between the stockpiles until they spot the player.
    if(en.depotPatrol&&!see){
      en.patrolT=(en.patrolT||0)-dt;
      if(en.patrolT<=0||en.patrolX===undefined||Math.hypot(en.patrolX-en.x,en.patrolY-en.y)<12){
        en.patrolX=rr((en.home.x0+1.35)*TILE,(en.home.x1-.35)*TILE);
        en.patrolY=rr((en.home.y0+1.35)*TILE,(en.home.y1-.35)*TILE);
        en.patrolT=rr(2.5,6);
      }
      var pdx9=en.patrolX-en.x,pdy9=en.patrolY-en.y,pdl9=Math.hypot(pdx9,pdy9)||1;
      var pst9=d.spd*.52*dt, pox9=en.x,poy9=en.y;
      moveEnt(en,pdx9/pdl9*pst9,pdy9/pdl9*pst9);
      if(en.x<(en.home.x0+1)*TILE||en.x>(en.home.x1)*TILE||en.y<(en.home.y0+1)*TILE||en.y>(en.home.y1)*TILE){ en.x=pox9; en.y=poy9; en.patrolT=0; }
      en.ang=Math.atan2(pdy9,pdx9); en.walk+=dt*7; en.amt=Math.min(1,en.amt+dt*6);
      en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.35;
      continue;
    }
    if(en.dug){                                  // dug in: they do not come to you, they dig in harder
      var pdd=Math.hypot(player.x-en.x,player.y-en.y);
      var alert=(en.home&&en.home.alert)?1:0;
      var seeD=pdd<d.range+140&&!inBase(player.x,player.y)
               &&los(en.x,en.y,player.x,player.y)&&!smokeBlocked(en.x,en.y,player.x,player.y);
      if(seeD) en.ang=Math.atan2(player.y-en.y,player.x-en.x);
      en.amt=Math.max(0,en.amt-dt*6);
      if(en.hurt>0) en.hurt-=dt;
      // grenades over the wall
      en.nade=(en.nade===undefined)?rr(3,8):en.nade-dt;
      if(seeD&&en.nade<=0&&pdd>90&&pdd<330){ enemyNade(en,1); en.nade=rr(alert?7:11,alert?12:18); }
      var rofD=d.rof*(alert?.72:.9), sprD=d.spread*.92, burD=d.burst+(alert?2:1);
      if(seeD&&en.acq>0) en.acq-=dt*2.2;
      else if(seeD){
        if(d.laser){
          if(en.aim>0){ en.aim-=dt; if(en.aim<=0){ enemyShot(en,d,sprD,.6); en.cd=rofD; } }
          else if(en.cd<=0) en.aim=.6; else en.cd-=dt;
        } else {
          if(en.bl>0){ en.bt-=dt; if(en.bt<=0){ enemyShot(en,d,sprD,.55); en.bl--; en.bt=d.gap*.85; if(en.bl<=0) en.cd=rofD; } }
          else { en.cd-=dt; if(en.cd<=0){ en.bl=burD; en.bt=0; } }
        }
      } else { en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.5; }
      continue;
    }
    // the commander works the breach and lobs frags
    if(en.boss){
      en.nade=(en.nade===undefined)?rr(2,5):en.nade-dt;
      var bpd=Math.hypot(player.x-en.x,player.y-en.y);
      if(en.nade<=0&&bpd>90&&bpd<350&&!inBase(player.x,player.y)
         &&los(en.x,en.y,player.x,player.y)){ enemyNade(en,1.2); en.nade=rr(6,10); }
    }
    if(en.fire>0&&!en.dug){                       // alight: they run, they do not shoot
      en.panicA=(en.panicA===undefined)?rr(0,6.28):en.panicA+rr(-1.4,1.4)*dt*4;
      var pstep=d.spd*1.45*dt, po=[0,.7,-.7,1.4,-1.4,2.6,-2.6];
      for(var pq2=0;pq2<po.length;pq2++){
        var pa=en.panicA+po[pq2], ox2=en.x, oy2=en.y;
        moveEnt(en,Math.cos(pa)*pstep,Math.sin(pa)*pstep);
        if(inBase(en.x,en.y)){ en.x=ox2; en.y=oy2; continue; }
        if(Math.hypot(en.x-ox2,en.y-oy2)>pstep*.6) break;
        en.panicA+=2.1;
      }
      en.ang=en.panicA; en.walk+=dt*15; en.amt=1;
      en.cd=Math.max(en.cd,.4); en.bl=0;
      continue;
    }
    var rush=(flag&&flag.assault&&(flag.state==='lower'||flag.state==='raise'));
    var pref=rush?d.pref*.55:d.pref;
    // he is behind the wire: form a cordon at a standoff instead of chewing the boundary
    if(BASE&&inBase(player.x,player.y)&&!rush&&!en.marine){
      var bcx=(BASE.x0+BASE.x1)*.5*TILE, bcy=(BASE.y0+BASE.y1)*.5*TILE;
      var bhw=(BASE.x1-BASE.x0)*.5*TILE, bhh=(BASE.y1-BASE.y0)*.5*TILE;
      var relx=en.x-bcx, rely=en.y-bcy;
      var scale=Math.max(Math.abs(relx)/(bhw+110),Math.abs(rely)/(bhh+110));
      // each man picks a post on the cordon once and keeps it
      if(en.post===undefined||en.postT===undefined||(en.postT<=0&&en.settled)){
        en.post=Math.atan2(rely,relx)+rr(-.25,.25);
        en.postR=rr(1.10,1.34);
        en.postT=rr(6,14);
      }
      en.postT-=dt;
      var pr=en.postR;
      var tgx=bcx+Math.cos(en.post)*(bhw+110)*pr;
      var tgy=bcy+Math.sin(en.post)*(bhh+110)*pr;
      var tdx=tgx-en.x, tdy=tgy-en.y, tdd=Math.hypot(tdx,tdy);
      if(tdd>34){ mvx=tdx/tdd; mvy=tdy/tdd; en.settled=0; }
      else if(scale<1){                                // shoved inside the ring: step straight out
        var pl2=Math.hypot(relx,rely)||1; mvx=relx/pl2; mvy=rely/pl2; en.settled=0;
      }
      else { mvx=0; mvy=0; en.settled=1; }             // on his post: stand and watch
      en.ang=Math.atan2(bcy-en.y,bcx-en.x);
      // separation, then move — skip the usual pursuit entirely
      var sepR=en.settled?17:26;
      for(var oc=0;oc<enemies.length;oc++){ if(oc===e) continue; var oo=enemies[oc];
        var odd=Math.hypot(oo.x-en.x,oo.y-en.y);
        if(odd<sepR&&odd>0.01){ mvx-=(oo.x-en.x)/odd*(en.settled?.9:.5); mvy-=(oo.y-en.y)/odd*(en.settled?.9:.5); }
      }
      if(en.settled&&Math.hypot(mvx,mvy)<.35){ mvx=0; mvy=0; }   // deadzone: no shuffling
      var cml=Math.hypot(mvx,mvy);
      if(cml>0.01){
        var cstep=d.spd*.7*dt, ca2=Math.atan2(mvy,mvx);
        var coff=[0,.6,-.6,1.3,-1.3,2.4,-2.4], cox=en.x, coy=en.y;
        for(var ci=0;ci<coff.length;ci++){
          var cang=ca2+coff[ci], px2=en.x, py2=en.y;
          moveEnt(en,Math.cos(cang)*cstep,Math.sin(cang)*cstep);
          if(inBase(en.x,en.y)){ en.x=px2; en.y=py2; continue; }
          if(Math.hypot(en.x-px2,en.y-py2)>cstep*.6) break;
        }
        var got2=Math.hypot(en.x-cox,en.y-coy);
        en.walk+=dt*(d.spd/13)*Math.min(1,got2/(cstep*.6)+.1);
        en.amt=Math.min(1,(en.amt||0)+dt*7);
      } else en.amt=Math.max(0,(en.amt||0)-dt*7);
      if(en.hurt>0) en.hurt-=dt;
      en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.5;
      continue;
    }
    if(rush&&Math.hypot(flag.x-en.x,flag.y-en.y)>70){        // get to the pole first
      var fdp=flowDir(Math.floor(en.x/TILE),Math.floor(en.y/TILE));
      if(fdp){ var lp=Math.hypot(fdp.x,fdp.y)||1; mvx=fdp.x/lp; mvy=fdp.y/lp; }
      else { mvx=(flag.x-en.x)/Math.max(1,Math.hypot(flag.x-en.x,flag.y-en.y));
             mvy=(flag.y-en.y)/Math.max(1,Math.hypot(flag.x-en.x,flag.y-en.y)); }
    }
    else if(see&&pd<pref){ mvx=-(player.x-en.x)/pd; mvy=-(player.y-en.y)/pd; if(pd>pref*.7){mvx*=.2;mvy*=.2;} }
    else if(see&&pd>pref*1.15){ mvx=(player.x-en.x)/pd; mvy=(player.y-en.y)/pd; }
    else if(!see){
      var fd=flowDir(Math.floor(en.x/TILE),Math.floor(en.y/TILE));
      if(fd){ var l=Math.hypot(fd.x,fd.y)||1; mvx=fd.x/l; mvy=fd.y/l; }
      else { mvx=(player.x-en.x)/pd; mvy=(player.y-en.y)/pd; }
    }
    // separation
    for(var o=0;o<enemies.length;o++){ if(o===e) continue; var ot=enemies[o];
      var od=Math.hypot(ot.x-en.x,ot.y-en.y);
      if(od<24&&od>0.01){ mvx-=(ot.x-en.x)/od*.4; mvy-=(ot.y-en.y)/od*.4; }
    }
    var ml=Math.hypot(mvx,mvy);
    if(ml>0.01&&en.stag<=0){
      var esp=d.spd*(slowT(T(Math.floor(en.x/TILE),Math.floor(en.y/TILE)))?.6:1)
              *((flag&&flag.assault&&flag.state!=='done')?1.22:1)
              *(level===1?.80:1); // level 1 paced back a bit
      var step=esp*dt, dirA=Math.atan2(mvy,mvx);
      if(en.slideT>0) en.slideT-=dt; else en.slide=0;
      // if the straight line is blocked, follow the trench/flow route instead of grinding the wall
      if(hitBox(en.x+Math.cos(dirA)*14,en.y+Math.sin(dirA)*14,en.r)){
        var fdz=flowDir(Math.floor(en.x/TILE),Math.floor(en.y/TILE));
        if(fdz&&(fdz.x||fdz.y)) dirA=Math.atan2(fdz.y,fdz.x);
        if(!en.slideT||en.slideT<=0){ en.slide=(Math.random()<.5?1:-1)*rr(.6,1.15); en.slideT=rr(.55,1.2); }
      }
      var off=[0,en.slide,en.slide*1.9,-en.slide,3.14];
      var ox0=en.x, oy0=en.y;
      for(var ti=0;ti<off.length;ti++){
        var aa=dirA+off[ti], ox=en.x, oy=en.y;
        moveEnt(en,Math.cos(aa)*step,Math.sin(aa)*step);
        if(inBase(en.x,en.y)){ en.x=ox; en.y=oy; continue; }
        if(en.home&&(en.x<(en.home.x0+1)*TILE||en.x>(en.home.x1)*TILE
                   ||en.y<(en.home.y0+1)*TILE||en.y>(en.home.y1)*TILE)){ en.x=ox; en.y=oy; continue; }
        if(Math.hypot(en.x-ox,en.y-oy)>step*.7){ en.ang2=aa; break; }
      }
      var got=Math.hypot(en.x-ox0,en.y-oy0);
      if(got<step*.3){                                  // still jammed: commit to one side and hold it
        en.jam=(en.jam||0)+dt;
        if(en.jam>.35){ en.slide=(en.slide>0?-1:1)*rr(.8,1.5); en.slideT=rr(.8,1.6); en.jam=0; }
      } else en.jam=0;
      en.walk+=dt*(d.spd/11)*Math.min(1,got/(step*.7)+.15);
      en.amt=Math.min(1,(en.amt||0)+dt*9);
    } else en.amt=Math.max(0,(en.amt||0)-dt*9);
    en.stuckT=(en.stuckT||0)+dt;
    if(en.stuckT>3){
      if(Math.hypot(en.x-(en.px||en.x),en.y-(en.py||en.y))<26) en.lost=(en.lost||0)+1; else en.lost=0;
      en.px=en.x; en.py=en.y; en.stuckT=0;
      if(en.lost>=3){ en.lost=0; relocate(en); }
    }
    if(see) en.ang=Math.atan2(player.y-en.y,player.x-en.x);
    else if(en.ang2!==undefined&&en.jam===0) en.ang=en.ang2;
    else if(ml>0.01) en.ang=Math.atan2(mvy,mvx);

    // firing
    if(see&&en.acq>0){ en.acq-=dt; }
    else if(see){
      if(d.laser){
        if(en.aim>0){ en.aim-=dt; if(en.aim<=0){ enemyShot(en,d); en.cd=d.rof; } }
        else if(en.cd<=0){ en.aim=.85; }
        else en.cd-=dt;
      } else {
        if(en.bl>0){ en.bt-=dt; if(en.bt<=0){ enemyShot(en,d); en.bl--; en.bt=d.gap; if(en.bl<=0) en.cd=d.rof; } }
        else { en.cd-=dt; if(en.cd<=0){ en.bl=d.burst; en.bt=0; } }
      }
    } else if(!see){ en.cd=Math.max(en.cd-dt,0); en.bl=0; en.aim=0; en.acq=.55; }
  }

  // --- player bullets
  for(var b=bullets.length-1;b>=0;b--){
    var bu=bullets[b], steps=3;
    for(var s=0;s<steps;s++){
      bu.x+=bu.vx*dt/steps; bu.y+=bu.vy*dt/steps;
      if(blocksShot(T(Math.floor(bu.x/TILE),Math.floor(bu.y/TILE)))){
        impact(bu.x,bu.y); bullets.splice(b,1); bu=null; break;
      }
      var hitAny=false;
      if(mapKind==='redSquare'){
        for(var mcb=0;mcb<motorcade.length;mcb++){
          var shotCar=motorcade[mcb]; if(shotCar.dead) continue;
          var crx=bu.x-shotCar.x,cry=bu.y-shotCar.y,cca=Math.cos(-shotCar.ang),csa=Math.sin(-shotCar.ang);
          var carLocalX=crx*cca-cry*csa,carLocalY=crx*csa+cry*cca;
          if(Math.abs(carLocalX)<51&&Math.abs(carLocalY)<23){
            shotCar.gunHits=(shotCar.gunHits||0)+1;
            hitMotorcadeCar(shotCar,shotCar.mx/3+.01); banner('MOTORCADE HIT',Math.min(3,shotCar.gunHits)+'/3',.7); impact(bu.x,bu.y); bullets.splice(b,1); bu=null; break;
          }
        }
      }
      if(!bu) break;
      for(var sg=0;sg<sams.length;sg++){
        var SG=sams[sg];
        if(Math.hypot(SG.x-bu.x,SG.y-bu.y)<17){
          SG.hp-=bu.dmg; SG.hurt=.12; impact(bu.x,bu.y);
          if(SG.hp<=0){
            explode(SG.x,SG.y,80,20,true);
            for(var sd8=0;sd8<14;sd8++) launchPart(SG.x,SG.y,'debris',null,null,rr(0,6.283),rr(.9,1.8));
            sams.splice(sg,1); banner('SAM SITE DESTROYED','',1.2);
          }
          bullets.splice(b,1); bu=null; break;
        }
      }
      if(!bu) break;
      for(var ag=0;ag<aaGuns.length;ag++){
        var AG=aaGuns[ag];
        if(Math.hypot(AG.x-bu.x,AG.y-bu.y)<15){
          AG.hp-=bu.dmg; AG.hurt=.12; impact(bu.x,bu.y);
          if(AG.hp<=0){
            explode(AG.x,AG.y,70,20,true);
            for(var ad=0;ad<14;ad++) launchPart(AG.x,AG.y,'debris',null,null,rr(0,6.283),rr(.8,1.6));
            aaGuns.splice(ag,1); sfx('boom',.35); banner('AA GUN DOWN','',1.1);
          }
          bullets.splice(b,1); bu=null; break;
        }
      }
      if(!bu) break;
      if(bu.navy) for(var ns=0;ns<ships.length;ns++){
        var NS=ships[ns]; if(NS.sink>0) continue;
        var nrel=Math.atan2(bu.y-NS.y,bu.x-NS.x)-NS.ang, nd=Math.hypot(bu.x-NS.x,bu.y-NS.y);
        if(Math.abs(Math.cos(nrel)*nd)<NS.len*.5&&Math.abs(Math.sin(nrel)*nd)<NS.wid*.5){
          shipHit(NS,bu.navy,0);
          explode(bu.x,bu.y,54,4,true);
          for(var nd2=0;nd2<6;nd2++) launchPart(bu.x,bu.y,'debris',null,null,rr(0,6.283),rr(.6,1.2));
          sfx('boom',.35);
          bullets.splice(b,1); bu=null; break;
        }
      }
      if(!bu) break;
      for(var dq5=0;dq5<edrones.length;dq5++){
        var ED=edrones[dq5];
        if(Math.hypot(ED.x-bu.x,ED.y-bu.y)<15){
          ED.hp-=bu.dmg; ED.hurt=.12; impact(bu.x,bu.y);
          if(ED.hp<=0) killEDrone(ED,false);
          bullets.splice(b,1); bu=null; break;
        }
      }
      if(!bu) break;
      if(tank&&Math.hypot(tank.x-bu.x,tank.y-bu.y)<24){
        impact(bu.x,bu.y); tank.hurt=.08; if(Math.random()<.5) sfx('ric',.5);
        bullets.splice(b,1); bu=null; break;
      }
      for(var k=0;k<enemies.length;k++){ var tE=enemies[k];
        var bulletHitRadius=(tE.compoundBoss||tE.levelTwoBoss||tE.oilBoss||tE.airfieldBoss)?34:tE.r+3;
        if(Math.hypot(tE.x-bu.x,tE.y-bu.y)<bulletHitRadius){
          if(tE.compoundBoss||tE.levelTwoBoss||tE.oilBoss||tE.airfieldBoss) impact(bu.x,bu.y);
          hurtEnemy(tE,bu.dmg,Math.atan2(bu.vy,bu.vx));
          if(bu.pierce>0) bu.pierce--; else { bullets.splice(b,1); hitAny=true; }
          break;
        }
      }
      if(hitAny){ bu=null; break; }
    }
    if(!bu) continue;
    bu.life-=dt; if(bu.life<=0||bu.x<0||bu.y<0||bu.x>WW||bu.y>WH) bullets.splice(b,1);
  }
  // --- enemy bullets
  for(var b2=eb.length-1;b2>=0;b2--){
    var e2b=eb[b2], done=false;
    for(var s2=0;s2<3;s2++){
      e2b.x+=e2b.vx*dt/3; e2b.y+=e2b.vy*dt/3;
      if(blocksShot(T(Math.floor(e2b.x/TILE),Math.floor(e2b.y/TILE)))){
        if(e2b.shell) explode(e2b.x,e2b.y,96,58,false); else impact(e2b.x,e2b.y);
        done=true; break; }
      if(e2b.aa){
        if(aboard&&gunboat&&Math.hypot(gunboat.x-e2b.x,gunboat.y-e2b.y)<22){
          var boatHit=ri(7,13)*e2b.mul;
          gunboat.hp-=boatHit; gunboat.hurt=.12;
          player.x=gunboat.x; player.y=gunboat.y;
          hurtPlayer(Math.max(3,boatHit*.55));
          fx.push({t:'spark',x:e2b.x,y:e2b.y,life:.14,max:.14});
          if(gunboat.hp<=0){
            explode(gunboat.x,gunboat.y,120,0,true);
            for(var gd3=0;gd3<26;gd3++) launchPart(gunboat.x,gunboat.y,'debris',null,null,rr(0,6.283),rr(1,2));
            banner('BOAT SUNK','',2); aboard=false; gunboat=null;
            downPlayer();
          }
          done=true; break;
        }
        var wingHit=false;
        for(var wz=0;wz<wingmen.length;wz++){
          if(Math.hypot(wingmen[wz].x-e2b.x,wingmen[wz].y-e2b.y)<16){
            wingmen[wz].hp-=ri(9,16)*e2b.mul; wingmen[wz].hurt=.12;
            fx.push({t:'spark',x:e2b.x,y:e2b.y,life:.14,max:.14});
            wingHit=true; break;
          }
        }
        if(wingHit){ done=true; break; }
        if(drone&&piloting&&Math.hypot(drone.x-e2b.x,drone.y-e2b.y)<16){
          drone.hp=(drone.hp||100)-ri(9,16)*e2b.mul;
          fx.push({t:'spark',x:e2b.x,y:e2b.y,life:.14,max:.14});
          if(drone.hp<=0){
            explode(drone.x,drone.y,40,0,true);
            if(drone.pad) drone.pad.cd=0;
            drone=null; piloting=false; firing=false; actBtn.classList.remove('on');
            banner('DRONE SHOT DOWN','ANOTHER IS READY',1.8); sfx('ric',.8);
          }
          done=true; break;
        }
        if(e2b.life<.06){ done=true; break; }
        continue;
      }
      if(Math.hypot(player.x-e2b.x,player.y-e2b.y)<player.r+(e2b.shell?14:3)){
        if(e2b.shell) explode(e2b.x,e2b.y,96,58,false); else hurtPlayer(e2b.dmg);
        done=true; break; }
      if(e2b.shell&&e2b.life<.05){ explode(e2b.x,e2b.y,96,58,false); done=true; break; }
    }
    if(done){ eb.splice(b2,1); continue; }
    e2b.life-=dt; if(e2b.life<=0) eb.splice(b2,1);
  }
  // --- their grenades
  for(var q3=enades.length-1;q3>=0;q3--){
    var EN2=enades[q3]; EN2.t+=dt; EN2.rot+=EN2.spin*dt;
    var pr=Math.min(1,EN2.t/EN2.dur);
    EN2.x=EN2.sx+(EN2.tx-EN2.sx)*pr; EN2.y=EN2.sy+(EN2.ty-EN2.sy)*pr;
    if(pr>=1){
      explode(EN2.x,EN2.y,62*EN2.pw,30*EN2.pw,false);
      enades.splice(q3,1);
    }
  }

  // --- grenades
  for(var n=nades.length-1;n>=0;n--){
    var g=nades[n]; g.t+=dt; g.spin+=dt*14;
    var p=Math.min(1,g.t/g.dur);
    g.x=g.sx+(g.tx-g.sx)*p; g.y=g.sy+(g.ty-g.sy)*p;
    if(p>=1){ explode(g.x,g.y,86,120,true); nades.splice(n,1); }
  }
  // --- fx
  for(var f=fx.length-1;f>=0;f--){ fx[f].life-=dt; if(fx[f].life<=0) fx.splice(f,1); }
  for(var sm=smoke.length-1;sm>=0;sm--){ var S=smoke[sm];
    S.x+=S.vx*dt; S.y+=S.vy*dt; S.vx*=.94; S.vy*=.94; S.life-=dt; if(S.life<=0) smoke.splice(sm,1); }
  for(var cr=0;cr<crates.length;cr++) if(crates[cr].pop>0) crates[cr].pop-=dt;

  for(var mi=mist.length-1;mi>=0;mi--){ var MI=mist[mi];
    MI.x+=MI.vx*dt; MI.y+=MI.vy*dt; MI.vx*=.88; MI.vy*=.88; MI.life-=dt;
    if(MI.life<=0) mist.splice(mi,1); }
  for(var po=pools.length-1;po>=0;po--){ var PO=pools[po];
    PO.t+=dt; PO.r=PO.max*Math.min(1,PO.t/2.1);
    if(PO.t>2.3){ bloodPool(PO.x,PO.y,PO.r); pools.splice(po,1); } }
  for(var sp2=splat.length-1;sp2>=0;sp2--){ splat[sp2].life-=dt; if(splat[sp2].life<=0) splat.splice(sp2,1); }
  for(var ck=chunks.length-1;ck>=0;ck--){
    var CK=chunks[ck];
    CK.rot=(CK.rot||0)+(CK.spin||0)*dt;
    CK.sq=(CK.sq||0)+(CK.tilt||0)*dt;
    CK.z=(CK.z||0)+CK.vz*dt; CK.vz-=GRAV*dt;
    var px3=CK.x, py3=CK.y;
    CK.x+=CK.vx*dt; CK.y+=CK.vy*dt; CK.vx*=.996; CK.vy*=.996;
    if(CK.x<8){ CK.x=8; CK.vx=-CK.vx*.4; } else if(CK.x>WW-8){ CK.x=WW-8; CK.vx=-CK.vx*.4; }
    if(CK.y<8){ CK.y=8; CK.vy=-CK.vy*.4; } else if(CK.y>WH-8){ CK.y=WH-8; CK.vy=-CK.vy*.4; }
    // slap into a wall on the way through
    if(CK.z<40&&blocksShot(T(Math.floor(CK.x/TILE),Math.floor(CK.y/TILE)))){
      wallHit(px3,py3,Math.atan2(CK.vy,CK.vx),26);
      CK.x=px3; CK.y=py3; CK.vx*=-.34; CK.vy*=-.34; CK.spin*=-.6;
    }
    if(CK.z<=0){
      CK.z=0;
      if(Math.abs(CK.vz)>110&&CK.bounce<2){
        CK.bounce++; CK.vz=-CK.vz*.34; CK.vx*=.5; CK.vy*=.5; CK.spin*=.55;
        if(!onWall(CK.x,CK.y)){
          bc.fillStyle='rgba('+ri(96,138)+',16,11,'+rr(.3,.6)+')';
          bc.beginPath(); bc.ellipse(CK.x,CK.y,CK.s*rr(1.2,2.2),CK.s*.8,rr(0,3),0,6.3); bc.fill(); }
        if(CK.k!=='debris') bloodSpray(CK.x,CK.y,Math.atan2(CK.vy,CK.vx),rr(14,36),7);
        if(CK.k!=='meat'&&CK.k!=='debris') sfx('hit',.22);
      } else { landPart(CK); chunks.splice(ck,1); continue; }
    }
    if(CK.z>18&&CK.k!=='debris'&&Math.random()<.5) mistBurst(CK.x,CK.y-CK.z,rr(0,6.3),1,.45);
    CK.life-=dt; if(CK.life<=0){ landPart(CK); chunks.splice(ck,1); }
  }
  if(mapKind==='sea'||mapKind==='oil') updateShips(dt);
  for(var fq6=floaters.length-1;fq6>=0;fq6--){
    var FLo=floaters[fq6];
    FLo.t+=dt; FLo.bob+=dt*1.7; FLo.rot+=FLo.spin*dt;
    FLo.x+=(FLo.vx+wind*.12)*dt; FLo.y+=FLo.vy*dt;
    FLo.vx*=.985; FLo.vy*=.985; FLo.spin*=.99;
    if(FLo.t>120) floaters.splice(fq6,1);
  }
  if(mapKind==='oil') updateOil(dt);
  if(mapKind==='airfield') updateAirfield(dt);
  if(mapKind==='redSquare') updateRedSquare(dt);
  updateTruck(dt);
  updateDepotWorkers(dt);
  updateAA(dt);
  updateEDrones(dt);
  updateTank(dt);
  for(var ep=emps.length-1;ep>=0;ep--){ var EP=emps[ep];
    EP.t+=dt; EP.r=EP.max*Math.min(1,EP.t/.45); if(EP.t>.75) emps.splice(ep,1); }
  updateCrew(dt);
  for(var fl2=flames.length-1;fl2>=0;fl2--){
    var FL3=flames[fl2];
    FL3.x+=FL3.vx*dt; FL3.y+=FL3.vy*dt; FL3.vx*=.9; FL3.vy*=.9; FL3.vy-=22*dt;
    FL3.s+=dt*16; FL3.life-=dt;
    if(FL3.life<=0) flames.splice(fl2,1);
  }
  updateCivs(dt);
  updateCaptives(dt);
  updateAtmos(dt);
  if(baseFlash>0) baseFlash-=dt*1.6;
  if(shake>0) shake=Math.max(0,shake-dt*32);

  // --- drone launch bays
  if(droneCD>0) droneCD-=dt;
  var onPad=null;
  for(var pl0=0;pl0<padList.length;pl0++){
    var PL0=padList[pl0];
    // Every fixed drone station uses a table plus a separate square two tiles in front.
    if(!PL0.mobile&&PL0.standX===undefined){ PL0.table=1; PL0.standX=PL0.x-2*TILE; PL0.standY=PL0.y; }
    if(PL0.cd>0) PL0.cd-=dt;
    if(PL0.mobile&&(!truck||truck.down>0)) continue;
    var useX=PL0.standX===undefined?PL0.x:PL0.standX;
    var useY=PL0.standY===undefined?PL0.y:PL0.standY;
    if(!piloting&&!player.dead&&PL0.cd<=0&&Math.abs(player.x-useX)<25&&Math.abs(player.y-useY)<25) onPad=PL0;
  }
  if(onPad){
    player.dHold=(player.dHold||0)+dt/(firing?.4:.85);
    if(player.dHold>=1){
      player.dHold=0; onPad.cd=onPad.cool;
      var kk0=onPad.kind, hp0=(kk0==='droneL')?340:((kk0==='drone')?260:180);
      var extra=(mapKind==='oil')?14:4;
      var lx0=onPad.table?onPad.x:player.x, ly0=onPad.table?onPad.y:player.y, from='';
      wingmen.length=0;
      if(onPad.mobile&&truck&&truck.down<=0){
        lx0=truck.x+Math.cos(truck.ang)*6; ly0=truck.y-14;
        from='OFF THE TRUCK'; droneCam=null;
        kk0='droneL'; hp0=340;
        for(var wg=0;wg<2;wg++)
          wingmen.push({x:lx0+(wg?-58:58),y:ly0+40,vx:0,vy:0,rot:rr(0,6.3),
            hp:340,mx:340,off:{dx:(wg?-46:46),dy:34},hurt:0});
      }
      drone={x:lx0,y:ly0,vx:0,vy:0,ang:player.face,t:TOOLS[kk0].dur+extra,
        rot:0,kind:kk0,hp:hp0,mx:hp0,pad:onPad,flight:(wingmen.length?1:0)};
      piloting=true; firing=false; actBtn.classList.remove('on');
      sfx('card');
      banner(TOOLS[kk0].n+(from?' '+from:' AWAY'),'STEER IN · ACT TO DETONATE',1.8);
      if(onPad.mobile){
        for(var lp0=0;lp0<12&&plume.length<300;lp0++)
          plume.push({x:lx0+rr(-10,10),y:ly0+rr(-6,10),vx:rr(-30,30),vy:rr(-10,40),
            life:rr(.5,1.2),max:1.2,s:rr(4,10),hot:.8});
      }
    }
  } else player.dHold=0;

  // --- the gunboat
  if(gunboat&&!player.dead){
    if(!aboard){
      if(!piloting&&Math.hypot(player.x-gunboat.x,player.y-gunboat.y)<40){
        player.bHold=(player.bHold||0)+dt/(firing?.4:.9);
        if(player.bHold>=1){
          player.bHold=0; aboard=true; firing=false; actBtn.classList.remove('on');
          sfx('card'); banner('ABOARD','STEER OUT · ACT TO FIRE',1.8);
        }
      } else player.bHold=0;
    } else {
      var G=gunboat, kv3=keyVec(), gm=kv3||mv;
      if(gm.m>0.05){
        G.vx+=gm.x*430*dt*gm.m; G.vy+=gm.y*430*dt*gm.m;
        G.ang=Math.atan2(G.vy,G.vx);
      }
      G.vx*=.94; G.vy*=.94;
      var gs=Math.hypot(G.vx,G.vy), gmax=165;
      if(gs>gmax){ G.vx=G.vx/gs*gmax; G.vy=G.vy/gs*gmax; }
      var gnx=G.x+G.vx*dt, gny=G.y+G.vy*dt;
      if(isWater(gnx,G.y)&&gnx>40&&gnx<WW-40) G.x=gnx; else G.vx*=-.3;
      if(isWater(G.x,gny)&&gny>40&&gny<WH-40) G.y=gny; else G.vy*=-.3;
      player.x=G.x; player.y=G.y;
      for(var gm0=seaMines.length-1;gm0>=0;gm0--){
        if(!seaMines[gm0].dead&&Math.hypot(G.x-seaMines[gm0].x,G.y-seaMines[gm0].y)<28){
          var boatMine=seaMines.splice(gm0,1)[0]; detonateSeaMine(boatMine,false);
          G.hp=Math.max(0,G.hp-190); G.hurt=.8; G.vx*=-.45; G.vy*=-.45;
          if(G.hp<=0){ explode(G.x,G.y,130,0,true); aboard=false; downPlayer(); }
          hud(); break;
        }
      }
      G.wake+=dt;
      if(G.wake>.1&&gs>25&&wakes.length<160){ G.wake=0;
        wakes.push({x:G.x-Math.cos(G.ang)*26,y:G.y-Math.sin(G.ang)*26,a:G.ang,life:1.8,max:1.8,w:8}); }
      if(G.hurt>0) G.hurt-=dt;
      // the bow gun
      var tgtS=null, bd9=1e9;
      for(var gq=0;gq<ships.length;gq++){
        var GS=ships[gq]; if(GS.sink>0) continue;
        var gd=Math.hypot(GS.x-G.x,GS.y-G.y);
        if(gd<bd9){ bd9=gd; tgtS=GS; }
      }
      var wantT=tgtS?Math.atan2(tgtS.y-G.y,tgtS.x-G.x):G.ang;
      var dT=((wantT-G.turret+Math.PI*3)%(Math.PI*2))-Math.PI;
      G.turret+=Math.max(-2.4*dt,Math.min(2.4*dt,dT));
      G.cd-=dt;
      if(firing&&G.cd<=0){
        G.cd=.55;
        var ga=G.turret+rr(-.03,.03);
        bullets.push({x:G.x+Math.cos(G.turret)*30,y:G.y+Math.sin(G.turret)*30,
          vx:Math.cos(ga)*620,vy:Math.sin(ga)*620,dmg:12,life:1.6,pierce:0,trail:20,navy:52});
        fx.push({t:'flash',x:G.x,y:G.y,a:G.turret,life:.07,max:.07,s:1.7});
        shake=Math.min(9,shake+2.4); sfx('r',.9);
        dustPuff(G.x+Math.cos(G.turret)*36,G.y+Math.sin(G.turret)*36,2,.7);
      }
      // step off at the jetty
      if(jetty&&Math.hypot(G.x-jetty.x,G.y-jetty.y)<70&&gs<18){
        player.oHold=(player.oHold||0)+dt/1.1;
        if(player.oHold>=1){
          player.oHold=0; aboard=false;
          var off=freeSpot(jetty.x-20,jetty.y-20);
          player.x=off.x; player.y=off.y;
          banner('ASHORE','',1.2); sfx('reload');
        }
      } else player.oHold=0;
    }
  }

  // --- slipway
  if(seaCD>0) seaCD-=dt;
  if(seaPad&&!piloting&&!player.dead&&seaCD<=0&&Math.hypot(player.x-seaPad.x,player.y-seaPad.y)<32){
    player.sHold=(player.sHold||0)+dt/(firing?.4:.9);
    if(player.sHold>=1){
      player.sHold=0;
      var lw=waterNear(seaPad.x+30,seaPad.y);
      drone={x:lw.x,y:lw.y,vx:0,vy:0,ang:1.57,t:TOOLS.usv.dur,rot:0,kind:'usv',hp:420,mx:420};
      piloting=true; firing=false; actBtn.classList.remove('on'); seaCD=16;
      sfx('card'); banner('SEA DRONE AWAY','STEER INTO A HULL',1.8);
    }
  } else player.sHold=0;

  // --- the quartermaster
  if(shopCD>0) shopCD-=dt;
  if(shopPad&&!piloting&&!player.dead&&shopCD<=0&&Math.hypot(player.x-shopPad.x,player.y-shopPad.y)<30){
    player.shopHold=(player.shopHold||0)+dt/(firing?.4:.8);
    if(player.shopHold>=1){ player.shopHold=0; state='shop'; shopScroll=0; shopDrag=null; sfx('crate'); }
  } else player.shopHold=0;

  if(mapKind==='trench'){
    var roam=0;
    for(var rc=0;rc<enemies.length;rc++) if(!enemies[rc].home) roam++;
    if(roam===0&&spawnQ<=0&&!player.dead&&state==='play'){
      if(wave===0){
        wave=1; queue=trenchWave(1,level); spawnQ=queue.length; spawnT=.5;
        banner('SECOND WAVE','MORE COMMANDERS',2.4); sfx('boom',.3); hud();
      } else if(wave===1){
        wave=2; banner('THE LINE IS BROKEN','TAKE THEIR HEADQUARTERS',2.6); hud();
      }
    }
    droneT=(droneT===undefined)?rr(30,50):droneT-dt;
    if(droneT<=0&&!player.dead){
      droneT=rr(40,70);
      var eb2=bases[0];
      if(eb2&&edrones.length<3){
        edrones.push({x:eb2.fx,y:eb2.fy,vx:0,vy:0,hx:eb2.fx,hy:eb2.fy,base:0,state:'hunt',
          rot:0,hp:14,mx:14,bob:rr(0,6.3),hurt:0,warn:1.6});
        banner('DRONE SORTIE','SHOOT IT DOWN OR JAM IT',1.8); sfx('ric',.5);
      }
    }
  }

  // --- waves keep the pressure up, the bases are the objective
  if(!tank&&!tankSent&&!player.dead&&state==='play'&&mapKind==='compound'){
    var taken0=0;
    for(var tq=0;tq<flags.length;tq++) if(flags[tq].state==='done') taken0++;
    if(taken0>=1){ tankSent=1; spawnTank(); hud(); }
  }

  // --- the three bases
  flag=null;
  for(var fi2=0;fi2<flags.length;fi2++){
    var F2=flags[fi2];
    F2.wave+=dt;
    if(F2.state==='done'){
      if(F2.heap&&F2.heap.burn<1){
        F2.heap.burn=Math.min(1,F2.heap.burn+dt/7.5);
        if(Math.random()<.2) embers.push({x:F2.heap.x+rr(-12,12),y:F2.heap.y+rr(-9,9),
          vx:rr(-26,26),vy:-rr(30,80),life:rr(.6,1.5),max:1.5});
      }
      continue;
    }
    var live=0;
    for(var ge=0;ge<enemies.length;ge++) if(enemies[ge].home&&enemies[ge].home.i===fi2) live++;
    if(F2.state==='idle'&&live===0){
      F2.state='ready'; banner('BASE '+(fi2+1)+' GARRISON DOWN','TAKE THE POLE',2.2); hud();
    }
    var atP=!piloting&&!player.dead&&Math.hypot(player.x-F2.x,player.y-F2.y)<42;
    if(F2.state==='ready'&&atP){
      F2.state='lower'; F2.assault=1; flag=F2;
      banner('LOWERING THEIR COLOURS','HOLD THE POLE',2); counterAttack(); hud();
    }
    if(F2.state==='lower'||F2.state==='raise'){
      flag=F2;
      var inC=0;
      for(var ce=0;ce<enemies.length;ce++)
        if(Math.hypot(enemies[ce].x-F2.x,enemies[ce].y-F2.y)<58) inC++;
      F2.contest=inC;
      if(atP){
        F2.p+=dt*(firing?.42:.3)*(inC?.4:1);
        if(F2.p>=1&&F2.state==='lower'){
          F2.state='raise'; sfx('reload'); banner('COLOURS DOWN','BURN THEM',1.6);
          var ha2=rr(0,6.283), hd2=rr(58,84);
          var hspot=freeSpot(F2.x+Math.cos(ha2)*hd2,F2.y+Math.sin(ha2)*hd2*.72);
          var folds=[]; for(var fq3=0;fq3<7;fq3++) folds.push([rr(-3.5,3.5),rr(-2.5,2.5),rr(.7,1.25)]);
          F2.heap={x:hspot.x,y:hspot.y,rot:rr(0,6.3),burn:0,folds:folds};
          if(fires.length<16) fires.push({x:hspot.x,y:hspot.y,r:11.5,p:rr(0,6),life:60,sp:0});
          sfx('boom',.2); shake=Math.min(12,shake+3);
          for(var em2=0;em2<14;em2++) embers.push({x:hspot.x+rr(-10,10),y:hspot.y+rr(-8,8),
            vx:rr(-40,40),vy:-rr(40,110),life:rr(.8,1.9),max:1.9});
          dustPuff(hspot.x,hspot.y,4,.8);
        }
        if(F2.p>=2){
          F2.p=2; F2.state='done'; F2.assault=0; sfx('clear');
          var done=0; for(var dq3=0;dq3<flags.length;dq3++) if(flags[dq3].state==='done') done++;
          var depLeft=0; for(var dq8=0;dq8<depots.length;dq8++) if(!depots[dq8].blown) depLeft++;
          banner('BASE '+(fi2+1)+' TAKEN',
                 depLeft? depLeft+' DEPOT'+(depLeft>1?'S':'')+' STILL STANDING':done+' OF '+flags.length,2.4);
          hud();
          if(done>=flags.length&&depLeft===0&&(mapKind!=='trench'||trenchRescueDone())){
            if(mapKind==='compound'&&level===1) spawnCompoundBoss();
            else if(mapKind==='trench'&&level===2){ if(!levelTwoBossSpawned) spawnLevelTwoBoss(); }
            else sectorClear();
          }
        }
      } else if(F2.p>0){
        F2.p=Math.max(F2.state==='raise'?1:0,F2.p-dt*.12);
      }
      if(F2.heap&&F2.heap.burn<1) F2.heap.burn=Math.min(1,F2.heap.burn+dt/7.5);
    }
  }

  if(mapKind==='trench'&&state==='play'&&!player.dead&&flags.length){
    var allDone=true;
    for(var cf=0;cf<flags.length;cf++) if(flags[cf].state!=='done') allDone=false;
    for(var cd2=0;cd2<depots.length;cd2++) if(!depots[cd2].blown) allDone=false;
    if(!trenchRescueDone()) allDone=false;
    if(allDone&&!levelTwoBossSpawned) spawnLevelTwoBoss();
  }

  // --- opening orders
  if(intro.length&&state==='play'){
    introT+=dt;
    while(intro.length&&introT>=intro[0].t){ var IN=intro.shift(); banner(IN.a,IN.b,2.2); }
  }

  // --- camera  // --- camera
  if(droneCam&&droneCam.ship){
    if(ships.indexOf(droneCam.ship)>=0){ droneCam.x=droneCam.ship.x; droneCam.y=droneCam.ship.y; }
    else droneCam.ship=null;
  }
  var foc=(piloting&&drone)?drone:(droneCam?droneCam:player);
  var tx=foc.x-VW/2, ty=foc.y-VH/2;
  cam.x+=(tx-cam.x)*Math.min(1,dt*7); cam.y+=(ty-cam.y)*Math.min(1,dt*7);
  cam.x=Math.max(0,Math.min(WW-VW,cam.x)); cam.y=Math.max(0,Math.min(WH-VH,cam.y));
  if(WW<VW) cam.x=(WW-VW)/2; if(WH<VH) cam.y=(WH-VH)/2;
}

function relocate(en){
  var best=null,bd=1e9;
  for(var i=0;i<400;i++){
    var x=ri(1,MW-2), y=ri(1,MH-2);
    if(blocksMove(T(x,y))||dist[y*MW+x]<0) continue;
    var wx=x*TILE+TILE/2, wy=y*TILE+TILE/2, d2=Math.hypot(wx-player.x,wy-player.y);
    if(d2<TILE*7) continue;
    if(d2<bd){ bd=d2; best={x:wx,y:wy}; }
  }
  if(!best) return;
  for(var s2=0;s2<6;s2++) smoke.push({x:en.x,y:en.y,vx:rr(-30,30),vy:rr(-30,30),life:.5,max:.5,s:rr(5,11)});
  en.x=best.x; en.y=best.y; en.acq=.55;
}
function updateAtmos(dt){
  now+=dt;
  fadeT+=dt;
  if(fadeT>=.2){
    var steps=Math.min(8,Math.floor(fadeT/.2)); fadeT-=steps*.2;
    var per=1-Math.pow(.03,1/(BLOOD_FADE/.2));
    bc.globalCompositeOperation='destination-out';
    bc.fillStyle='rgba(0,0,0,'+(1-Math.pow(1-per,steps)).toFixed(4)+')';
    bc.fillRect(0,0,WW,WH);
    bc.globalCompositeOperation='source-over';
  }
  wind=14+Math.sin(now*.21)*9;
  for(var i=fires.length-1;i>=0;i--){
    var f=fires[i]; f.p+=dt*(6+f.r*.05);
    if(f.life>0){ f.life-=dt; if(f.life<=0){ fires.splice(i,1); continue; } }
    f.sp-=dt;
    if(f.sp<=0){
      f.sp=.11+ .7/f.r;
      if(plume.length<158) plume.push({x:f.x+rr(-f.r*.5,f.r*.5),y:f.y-f.r*.4,vx:wind*rr(.4,1.1)+rr(-8,8),vy:-rr(24,44),
        life:rr(2.2,4.2),max:4.2,s:f.r*rr(.4,.65),hot:1});
      if(Math.random()<.4&&embers.length<70) embers.push({x:f.x+rr(-f.r*.4,f.r*.4),y:f.y,vx:wind*rr(.3,1)+rr(-14,14),vy:-rr(45,95),life:rr(.7,1.7),max:1.7});
    }
  }
  for(var q=plume.length-1;q>=0;q--){ var P=plume[q];
    P.x+=(P.vx+wind*.4)*dt; P.y+=P.vy*dt; P.vy*=.992; P.vx*=.995; P.s+=dt*7; P.hot*=.96;
    P.life-=dt; if(P.life<=0) plume.splice(q,1); }
  for(var em=embers.length-1;em>=0;em--){ var E=embers[em];
    E.x+=(E.vx+Math.sin(now*3+E.y*.05)*12)*dt; E.y+=E.vy*dt; E.vy*=.985; E.life-=dt;
    if(E.life<=0) embers.splice(em,1); }
  // drifting dust caught in the light
  if(motes.length<70) motes.push({x:cam.x+rr(-60,VW+60),y:cam.y+rr(-60,VH+60),vx:rr(6,26),vy:rr(-9,9),s:rr(.8,2.2),a:rr(.06,.24)});
  for(var mo=motes.length-1;mo>=0;mo--){ var M=motes[mo]; M.x+=M.vx*dt; M.y+=M.vy*dt;
    if(M.x>cam.x+VW+90||M.y<cam.y-90||M.y>cam.y+VH+90||M.x<cam.x-90) motes.splice(mo,1); }
  // the war going on beyond the house
  arty.flash=Math.max(0,arty.flash-dt*4);
  arty.t-=dt;
  if(arty.t<=0){
    arty.t=rr(6,15); arty.flash=.22; shake=Math.min(16,shake+rr(2.5,6)); sfx('boom',.3);
    for(var d2=0;d2<14;d2++) plume.push({x:cam.x+rr(0,VW),y:cam.y+rr(0,VH*.7),vx:rr(-6,6),vy:rr(20,55),
      life:rr(.7,1.5),max:1.5,s:rr(1.5,4),hot:0,fall:1});
    if(Math.random()<.35) flares.push({x:rr(0,WW),y:cam.y-40,vy:rr(26,44),life:rr(7,11),max:11});
  }
  for(var fl=flares.length-1;fl>=0;fl--){ var FL=flares[fl];
    FL.y+=FL.vy*dt; FL.x+=wind*.5*dt; FL.life-=dt; if(FL.life<=0) flares.splice(fl,1); }
}
function enemyNade(en,pw){
  if(enades.length>14) return;
  var lead=.35, tx=player.x+(player.lvx||0)*lead, ty=player.y+(player.lvy||0)*lead;
  tx+=rr(-26,26); ty+=rr(-22,22);
  enades.push({sx:en.x,sy:en.y,x:en.x,y:en.y,tx:tx,ty:ty,t:0,
    dur:Math.max(.7,Math.hypot(tx-en.x,ty-en.y)/300),spin:rr(-14,14),rot:0,pw:pw||1});
  en.cd=Math.max(en.cd,.5);
  sfx('reload',.5);
}
function enemyShot(en,d,spreadOverride,dmgMul){
  var pel=d.pel||1, spr=(spreadOverride===undefined)?d.spread:spreadOverride;
  for(var i=0;i<pel;i++){
    var a=en.ang+rr(-spr,spr);
    eb.push({x:en.x+Math.cos(en.ang)*15,y:en.y+Math.sin(en.ang)*15,
      vx:Math.cos(a)*d.spd2, vy:Math.sin(a)*d.spd2, dmg:d.dmg*(dmgMul||1), life:1.5});
  }
  fx.push({t:'flash',x:en.x,y:en.y,a:en.ang,life:.05,max:.05,s:.8});
  sfx('enemy',.55);
}
function impact(x,y){
  fx.push({t:'spark',x:x,y:y,life:.14,max:.14});
  dc.fillStyle='rgba(28,23,17,.55)'; dc.beginPath(); dc.arc(x,y,rr(1.5,3.5),0,6.3); dc.fill();
  dc.fillStyle='rgba(216,208,190,'+rr(.1,.26)+')';
  dc.beginPath(); dc.arc(x+rr(-3,3),y+rr(-3,3),rr(2.5,6),0,6.3); dc.fill();
  for(var i=0;i<3;i++){ dc.fillStyle='rgba('+ri(160,200)+','+ri(152,190)+','+ri(136,172)+','+rr(.14,.4)+')';
    dc.beginPath(); dc.arc(x+rr(-9,9),y+rr(-8,8),rr(.7,1.9),0,6.3); dc.fill(); }
  dustPuff(x,y,ri(1,2),.55);
  if(Math.random()<.5&&chunks.length<130&&Math.random()<.3) launchPart(x,y,'debris',null,null,rr(0,6.3),.35);
  if(Math.random()<.35) sfx('ric',.6);
}

/* =========================================================================
   CRATE → CARD
   ========================================================================= */
var pendingCard=null;
function openCrate(c){
  c.open=true; c.pop=.5; sfx('crate');
  for(var i=0;i<8;i++) smoke.push({x:c.x,y:c.y,vx:rr(-40,40),vy:rr(-40,40),life:rr(.3,.7),max:.7,s:rr(4,10)});
  pendingCard=rollCard();
  showCard(pendingCard);
}
var cardOv=document.getElementById('cardOv'), cardCv=document.getElementById('cardCv'), cardC=cardCv.getContext('2d');
function showCard(cd){
  firing=false; actBtn.classList.remove('on');
  var rar=RAR[cd.rar], nm, rows=[];
  if(cd.k==='w'){
    var W=WEAPONS[cd.id]; nm=W.name;
    rows.push(['DAMAGE',(W.pel>1?W.dmg+' x '+W.pel:''+W.dmg)]);
    rows.push(['RATE',Math.round(60/W.rof)+' rpm '+(W.auto?'auto':'semi')]);
    rows.push(['MAGAZINE',W.mag+' rds']);
    rows.push(['SUPPLY',W.res+' rds']);
    if(W.pierce) rows.push(['PENETRATION',W.pierce+' targets']);
  } else if(cd.k==='t'){
    nm=cd.name;
    rows.push(['TOOL',TOOLS[cd.id].n]);
    if(TOOLS[cd.id].blast) rows.push(['BLAST',TOOLS[cd.id].blast[0]+' r · '+TOOLS[cd.id].blast[1]+' dmg']);
    if(TOOLS[cd.id].dur) rows.push(['DURATION',TOOLS[cd.id].dur+'s']);
    rows.push(['','goes to your belt']);
  } else {
    nm=cd.name; rows.push(['EFFECT','']);
    rows.push(['',cd.desc]);
    if(cd.id==='ammo'||cd.id==='loose'){
      var Wc=WEAPONS[player.wep], nn=(cd.id==='ammo'?2:1)*Wc.mag;
      rows.push(['ROUNDS','+'+nn+' '+Wc.name]);
    }
  }
  cardData={cd:cd,rar:rar,name:nm,rows:rows,take:(cd.k==='w'?'EQUIP':'TAKE')};
  pendingCard=cd; state='card'; cardT=0; sfx('card');
}
function dressCard(cd){
  var rar=RAR[cd.rar], name, stats='';
  if(cd.k==='w'){
    var W=WEAPONS[cd.id]; name=W.name;
    stats+=row('DAMAGE',(W.pel>1?W.dmg+' × '+W.pel:W.dmg));
    stats+=row('FIRE RATE',Math.round(60/W.rof)+' rpm'+(W.auto?' · auto':' · semi'));
    stats+=row('MAGAZINE',W.mag+' rds');
    stats+=row('SUPPLY',W.res+' rds');
    if(W.pierce) stats+=row('PENETRATION',W.pierce+' targets');
  } else {
    name=cd.name; stats+=row('EFFECT',cd.desc);
    if(cd.id==='ammo'||cd.id==='loose'){
      var Wc=WEAPONS[player.wep], n=(cd.id==='ammo'?2:1)*Wc.mag;
      stats+=row('ROUNDS','+'+n+' · '+Wc.name);
    }
  }
  document.getElementById('cardRar').textContent=rar.n;
  document.getElementById('cardRar').style.color=rar.c;
  document.getElementById('cardName').textContent=name;
  document.getElementById('cardStats').innerHTML=stats;
  document.getElementById('card').style.background='linear-gradient(160deg,'+rar.c+','+shade(rar.c.length===7?rar.c:'#888888',.35)+')';
  document.getElementById('take').textContent = cd.k==='w' ? 'EQUIP' : 'TAKE';
  try{ drawCardArt(cd); }catch(e2){}
}
function row(a,b){ return '<div class="statRow"><span>'+a+'</span><b>'+b+'</b></div>'; }
function drawCardArt(cd){
  cardC.clearRect(0,0,220,104); cardC.save(); cardC.translate(110,52);
  if(cd.k==='w'){ cardC.scale(2.1,2.1); drawGun(cardC,cd.id,0,0); }
  else if(cd.k==='a'){
    cardC.fillStyle='#7d6238'; rrect(cardC,-42,-28,84,56,4); cardC.fill(); outl(cardC,'#1e1a14',3);
    cardC.fillStyle='#5d4726'; cardC.fillRect(-42,-6,84,12);
    cardC.fillStyle='#c9b47a'; cardC.font='bold 13px Arial'; cardC.textAlign='center'; cardC.fillText('7.62',0,4);
    for(var i=0;i<4;i++){ cardC.fillStyle='#c8a24a'; rrect(cardC,-34+i*20,-46,9,17,2); cardC.fill(); outl(cardC,'#1e1a14',2); }
  } else if(cd.k==='h'){
    cardC.fillStyle='#e8e4d8'; rrect(cardC,-36,-28,72,56,6); cardC.fill(); outl(cardC,'#1e1a14',3);
    cardC.fillStyle='#c0362f'; cardC.fillRect(-8,-18,16,36); cardC.fillRect(-24,-8,48,16);
  } else if(cd.k==='p'){
    cardC.fillStyle='#5d6b74'; cardC.beginPath(); cardC.moveTo(0,-32); cardC.lineTo(32,-16); cardC.lineTo(26,26); cardC.lineTo(0,34); cardC.lineTo(-26,26); cardC.lineTo(-32,-16); cardC.closePath();
    cardC.fill(); outl(cardC,'#1e1a14',3);
    cardC.fillStyle='rgba(255,255,255,.18)'; cardC.beginPath(); cardC.moveTo(0,-24); cardC.lineTo(20,-12); cardC.lineTo(0,10); cardC.closePath(); cardC.fill();
  } else {
    cardC.fillStyle='#4d5a30'; cardC.beginPath(); cardC.ellipse(0,6,24,30,0,0,6.3); cardC.fill(); outl(cardC,'#1e1a14',3);
    cardC.strokeStyle='rgba(20,26,10,.6)'; cardC.lineWidth=2;
    for(var g=-2;g<=2;g++){ cardC.beginPath(); cardC.moveTo(-22,g*11); cardC.lineTo(22,g*11); cardC.stroke(); }
    cardC.fillStyle='#8a8f7a'; cardC.fillRect(-6,-32,12,10); outl(cardC,'#1e1a14',2);
    cardC.strokeStyle='#8a8f7a'; cardC.lineWidth=4; cardC.beginPath(); cardC.arc(8,-27,9,-1.2,1.6); cardC.stroke();
  }
  cardC.restore();
}
function takeCard(){
  if(state!=='card') return;
  var cd=pendingCard;
  if(cd){ try{
    if(cd.k==='w'){ addGun(cd.id);
    } else if(cd.k==='a'){
      var Wc=WEAPONS[player.wep]; player.res+=(cd.id==='ammo'?2:1)*Wc.mag; syncGun();
    } else if(cd.k==='h'){ player.hp=Math.min(player.mx,player.hp+45); }
    else if(cd.k==='p'){ player.ap=Math.min(upgAP,player.ap+(cd.id==='vest'?45:30)); }
    else if(cd.k==='t'){
      if(belt.length>=6){ banner('BELT FULL','',1.1); }
      else { belt.push(cd.id); }
    }
    else if(cd.k==='g'){ player.nades+=2; }
    sfx('reload');
  }catch(err){} }
  closeCard();
}
/* The card resolves by hit-testing the raw pointer position against the button
   rectangles. No reliance on the buttons receiving their own events. */
function cardBox(){
  var w=Math.min(268,VW-44), h=316, x=(VW-w)/2, y=(VH-h)/2-14;
  return {x:x,y:y,w:w,h:h,
    take:{x:x+w/2+5,y:y+h-56,w:w/2-19,h:44},
    leave:{x:x+14,y:y+h-56,w:w/2-19,h:44}};
}
function inBox(b,x,y){ return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h; }
function cardPoint(cx,cy){
  if(state!=='card') return;
  var B=cardBox();
  if(inBox(B.take,cx,cy)){ takeCard(); return; }
  if(inBox(B.leave,cx,cy)){ closeCard(); return; }
  if(!inBox(B,cx,cy)) closeCard();
}
window.addEventListener('touchstart',function(e){
  if(state!=='play') return;
  var t=e.changedTouches[0], i=beltHit(t.clientX,t.clientY);
  if(i>=0&&belt[i]){ e.preventDefault(); e.stopPropagation(); useTool(i); return; }
  var g=gunHit(t.clientX,t.clientY);
  if(g>=0&&player.guns[g]){ e.preventDefault(); e.stopPropagation(); equipGun(g); }
},{passive:false,capture:true});
window.addEventListener('mousedown',function(e){
  if(state!=='play') return;
  var i=beltHit(e.clientX,e.clientY);
  if(i>=0&&belt[i]){ e.preventDefault(); e.stopPropagation(); useTool(i); return; }
  var g=gunHit(e.clientX,e.clientY);
  if(g>=0&&player.guns[g]){ e.preventDefault(); e.stopPropagation(); equipGun(g); }
},true);
window.addEventListener('keydown',function(e){
  if(state!=='play') return;
  var n=parseInt(e.key,10);
  if(n>=1&&n<=6&&belt[n-1]) useTool(n-1);
  if(e.key==='q'||e.key==='Q'){ equipGun((player.gi+1)%player.guns.length); }
});
document.addEventListener('touchmove',function(e){
  if(state!=='shop'||!shopDrag) return;
  var tm=e.changedTouches[0]; e.preventDefault(); e.stopPropagation();
  var dy=tm.clientY-shopDrag.y0;
  shopDrag.moved=Math.max(shopDrag.moved,Math.abs(dy));
  shopScroll=Math.max(0,Math.min(shopMaxScroll(),shopDrag.s0-dy));
},{passive:false,capture:true});
document.addEventListener('touchend',function(e){
  if(state!=='shop'||!shopDrag) return;
  var te=e.changedTouches[0]; e.preventDefault(); e.stopPropagation();
  var d=shopDrag; shopDrag=null;
  if(d.moved<10) shopPoint(te.clientX,te.clientY);
},{passive:false,capture:true});
window.addEventListener('wheel',function(e){
  if(state!=='shop') return;
  e.preventDefault(); shopScrollBy(e.deltaY*.6);
},{passive:false});
document.addEventListener('touchstart',function(e){
  if(state==='shop'){ var ts=e.changedTouches[0]; e.preventDefault(); e.stopPropagation();
    shopDrag={y0:ts.clientY,s0:shopScroll,moved:0}; return; }
  if(state!=='card') return;
  var t=e.changedTouches[0]; e.preventDefault(); e.stopPropagation();
  cardPoint(t.clientX,t.clientY);
},{passive:false,capture:true});
document.addEventListener('mousedown',function(e){
  if(state==='shop'){ e.preventDefault(); e.stopPropagation(); shopPoint(e.clientX,e.clientY); return; }
  if(state!=='card') return;
  e.preventDefault(); e.stopPropagation(); cardPoint(e.clientX,e.clientY);
},true);
bindTap(document.getElementById('take'),takeCard);
bindTap(document.getElementById('leave'),closeCard);
window.addEventListener('keydown',function(e){
  if(state!=='card') return;
  if(e.key==='Enter') takeCard(); else if(e.key===' '||e.key==='Escape') closeCard();
});
function closeCard(){ pendingCard=null; cardData=null; firing=false; actBtn.classList.remove('on'); state='play'; hud(); }

/* =========================================================================
   SECTOR FLOW
   ========================================================================= */
function spawnTank(){
  var best=null,bd=-1;
  for(var i=0;i<SPAWNS.length;i++){
    var sx=SPAWNS[i][0]*TILE+TILE/2, sy=SPAWNS[i][1]*TILE+TILE/2;
    if(blocksMove(T(SPAWNS[i][0],SPAWNS[i][1]))||inBase(sx,sy)) continue;
    var d=Math.hypot(sx-player.x,sy-player.y);
    if(d>bd){ bd=d; best={x:sx,y:sy}; }
  }
  if(!best) return;
  tank={x:best.x,y:best.y,r:19,hp:2,ang:0,tang:0,cd:4.5,mg:0,mgb:0,track:0,hurt:0};
  for(var e=0;e<5;e++) spawnEnemy(Math.random()<.4?'rusher':'rifleman',best.x+rr(-40,40),best.y+rr(-40,40));
  banner('ARMOUR INBOUND','ONLY A DRONE WILL STOP IT',2.6); sfx('boom',.4);
}
function killTank(){
  if(!tank) return;
  var x=tank.x, y=tank.y;
  explode(x,y,150,180,true);
  for(var i=0;i<3;i++) setTimeout?0:0;
  for(var f=0;f<3;f++) if(fires.length<16)
    fires.push({x:x+rr(-22,22),y:y+rr(-18,18),r:rr(12,18),p:rr(0,6),life:60,sp:0});
  for(var d=0;d<22;d++) launchPart(x,y,'debris',null,null,rr(0,6.3),rr(.9,1.7));
  for(var c=0;c<14;c++) dropCash(x,y,ri(18,44),rr(0,6.3),1.2);
  dropTool(x,y,rollTool(),0,1.1); dropFrag(x,y,3,1,1.1);
  shake=Math.min(24,shake+16); sfx('boom'); banner('ARMOUR DESTROYED','',2);
  tank=null; hud();
}
/* is there enough water for a hull of this size, centred here and lying this way? */
function seaRoom(S,x,y,ang){
  var hl=S.len*.55, hw=S.wid*.6, ca=Math.cos(ang), sa=Math.sin(ang);
  for(var l=-1;l<=1.001;l+=.5) for(var w=-1;w<=1.001;w+=.5){
    var px7=x+ca*hl*l-sa*hw*w, py7=y+sa*hl*l+ca*hw*w;
    if(px7<40||py7<40||px7>WW-40||py7>WH-40) return false;
    if(!isWater(px7,py7)) return false;
  }
  return true;
}
function shipHit(S,dmg,ang){
  S.hp-=dmg; S.hurt=.3;
  if(dmg>40&&S.hp>0){
    for(var sf=0;sf<2&&fires.length<16;sf++)
      fires.push({x:S.x+rr(-S.len*.4,S.len*.4),y:S.y+rr(-S.wid*.4,S.wid*.4),
        r:rr(10,15),p:rr(0,6),life:rr(25,50),sp:0});
    for(var sp9=0;sp9<10&&plume.length<300;sp9++)
      plume.push({x:S.x+rr(-S.len*.4,S.len*.4),y:S.y+rr(-S.wid*.4,S.wid*.4),
        vx:rr(-20,20),vy:-rr(20,60),life:rr(2,4),max:4,s:rr(8,18),hot:.8});
  }
  if(S.hp<=0&&!S.sink){
    S.sink=9; S.hp=0; S.blast=0; S.pops=ri(5,8);
    // the first detonation, right through the hull
    explode(S.x,S.y,210,10,true);
    explode(S.x+Math.cos(S.ang)*S.len*.3,S.y+Math.sin(S.ang)*S.len*.3,150,10,true);
    explode(S.x-Math.cos(S.ang)*S.len*.3,S.y-Math.sin(S.ang)*S.len*.3,150,10,true);
    for(var f=0;f<9;f++) if(fires.length<16)
      fires.push({x:S.x+rr(-S.len*.45,S.len*.45),y:S.y+rr(-S.wid*.5,S.wid*.5),
        r:rr(15,26),p:rr(0,6),life:70,sp:0});
    for(var d=0;d<70;d++)                                    // hull plating thrown clear
      launchPart(S.x+rr(-S.len*.4,S.len*.4),S.y+rr(-S.wid*.4,S.wid*.4),
                 'debris',null,null,rr(0,6.3),rr(1.1,2.6));
    for(var pm=0;pm<40&&plume.length<300;pm++)
      plume.push({x:S.x+rr(-S.len*.5,S.len*.5),y:S.y+rr(-S.wid*.5,S.wid*.5),
        vx:rr(-40,40),vy:-rr(30,90),life:rr(2.5,5),max:5,s:rr(10,26),hot:1});
    dustPuff(S.x,S.y,20,2.2);
    for(var em3=0;em3<40&&embers.length<260;em3++) embers.push({x:S.x+rr(-S.len*.4,S.len*.4),y:S.y+rr(-20,20),
      vx:rr(-90,90),vy:-rr(60,190),life:rr(1,2.6),max:2.6});
    shake=Math.min(28,shake+22); sfx('boom'); sfx('boom',.6);
    droneCam={x:S.x,y:S.y,t:5.2,ship:S};                     // hold on her while she burns
    var left=0; for(var q=0;q<ships.length;q++) if(ships[q].hp>0) left++;
    banner(S.name+' HIT', left? left+' STILL AFLOAT':'THE SEA IS CLEAR',2.4);
    money+=S.boss3?1200:300; hud();
    if(S.boss3) showSeaBossClear();
  }
}
function shipFireAA(S,tx,ty,mul){
  var a=Math.atan2(ty-S.y,tx-S.x)+rr(-.05,.05);
  eb.push({x:S.x+Math.cos(a)*S.len*.3,y:S.y+Math.sin(a)*S.len*.3,
    vx:Math.cos(a)*640,vy:Math.sin(a)*640,dmg:0,life:1.1,aa:1,mul:mul||1});
  fx.push({t:'flash',x:S.x,y:S.y,a:a,life:.05,max:.05,s:.9});
  sfx('enemy',.3);
}
function spawnSeaBoss(){
  if(mapKind!=='sea'||seaBossSpawned) return;
  seaBossSpawned=1;
  var L=[[72,10],[90,20],[82,42],[62,30]];
  var boss={i:99,name:'ALEKSANDR MOISEYEV',boss3:1,hp:1450,mx:1450,len:8*TILE,wid:3*TILE,
    x:72.5*TILE,y:10.5*TILE,ang:.45,lane:L,wp:1,spd:44,aa:.15,gun:.2,sam:.8,msl:5,hurt:0,wake:0,sink:0,salvo:3};
  for(var sr3=0;sr3<30&&!seaRoom(boss,boss.x,boss.y,boss.ang);sr3++){
    var pos=waterNear((58+sr3%5*7)*TILE,(8+Math.floor(sr3/5)*8)*TILE); boss.x=pos.x; boss.y=pos.y;
  }
  ships.push(boss);
  banner('ALEKSANDR MOISEYEV','COMMAND SHIP INBOUND · GUNS BLAZING',3.2);
  hud();
}
function showSeaBossClear(){
  if(seaBossDefeated) return;
  seaBossDefeated=1;
  banner('LEVEL THREE CLEAR','ALEKSANDR MOISEYEV DEFEATED',3);
  setTimeout(function(){ var c=document.getElementById('seaBossVictory'); state='pause'; if(c) c.classList.add('show'); sfx('clear'); },1450);
  setTimeout(function(){ var c=document.getElementById('seaBossVictory'); if(c) c.classList.remove('show'); },5100);
  setTimeout(function(){ sectorClear(); },5600);
}
function updateShips(dt){
  var alive=0;
  for(var i=ships.length-1;i>=0;i--){
    var S=ships[i];
    if(S.sink>0){
      S.sink-=dt; S.hurt=0;
      var dx7=S.x+Math.cos(S.ang)*10*dt, dy7=S.y+Math.sin(S.ang)*10*dt;
      if(seaRoom(S,dx7,dy7,S.ang)){ S.x=dx7; S.y=dy7; }
      var na9=S.ang+dt*.06;
      if(seaRoom(S,S.x,S.y,na9)) S.ang=na9;
      // magazines cooking off as she settles
      S.blast=(S.blast||0)-dt;
      if(S.blast<=0&&S.pops>0){
        S.pops--; S.blast=rr(.5,1.3);
        var bx3=S.x+rr(-S.len*.45,S.len*.45), by3=S.y+rr(-S.wid*.5,S.wid*.5);
        explode(bx3,by3,rr(90,150),8,true);
        for(var d2=0;d2<ri(10,20);d2++) launchPart(bx3,by3,'debris',null,null,rr(0,6.3),rr(.9,2.2));
        for(var p4=0;p4<10&&plume.length<300;p4++) plume.push({x:bx3,y:by3,vx:rr(-30,30),vy:-rr(30,80),
          life:rr(2,4),max:4,s:rr(8,20),hot:1});
        for(var e4=0;e4<14&&embers.length<260;e4++) embers.push({x:bx3,y:by3,vx:rr(-70,70),vy:-rr(50,150),
          life:rr(.8,2),max:2});
        shake=Math.min(20,shake+7); sfx('boom',.5);
        if(droneCam) droneCam.t=Math.max(droneCam.t,1.6);
      }
      // she smokes hard the whole way down
      for(var pz=0;pz<2&&plume.length<300;pz++) plume.push({x:S.x+rr(-S.len*.45,S.len*.45),y:S.y+rr(-S.wid*.6,S.wid*.6),
        vx:rr(-16,16)+wind*.3,vy:-rr(18,50),life:rr(2.5,5),max:5,s:rr(9,22),hot:.55});
      if(Math.random()<.5&&embers.length<220) embers.push({x:S.x+rr(-S.len*.4,S.len*.4),y:S.y+rr(-16,16),
        vx:rr(-40,40),vy:-rr(40,110),life:rr(.8,2),max:2});
      if(Math.random()<.25&&wakes.length<160) wakes.push({x:S.x,y:S.y,a:S.ang,life:2,max:2,w:S.wid*.6});
      if(S.dumped===undefined) S.dumped=0;
      if(S.dumped<1&&S.sink<6.5){                      // her people go over the side
        S.dumped=1;
        var crewN=ri(7,13);
        for(var fl=0;fl<crewN;fl++){
          var fa=rr(0,6.283), fd=rr(10,S.len*.55);
          floaters.push({x:S.x+Math.cos(fa)*fd,y:S.y+Math.sin(fa)*fd*.7,
            vx:Math.cos(fa)*rr(6,26),vy:Math.sin(fa)*rr(4,18),
            rot:rr(0,6.283),spin:rr(-.5,.5),bob:rr(0,6.283),
            col:pick(['#5b6146','#6b6d4c','#4c563f','#565a4a']),
            face:Math.random()<.5, t:0});
        }
      }
      if(S.sink<=0){
        for(var lf=0;lf<3;lf++) if(fires.length<16)
          fires.push({x:S.x+rr(-30,30),y:S.y+rr(-20,20),r:rr(10,16),p:rr(0,6),life:50,sp:0});
        for(var sl=0;sl<14&&plume.length<300;sl++) plume.push({x:S.x+rr(-40,40),y:S.y+rr(-24,24),
          vx:rr(-12,12),vy:-rr(10,34),life:rr(3,6),max:6,s:rr(12,26),hot:.2});
        banner(S.name+' SUNK','',1.8);
        ships.splice(i,1);
      }
      continue;
    }
    alive++;
    if(S.hurt>0) S.hurt-=dt;
    // Assault transports make a direct run to shore, beach, then unload six troops.
    if(S.lander){
      if(!S.landed){
        var ldx=S.landX-S.x,ldy=S.landY-S.y,ldd=Math.hypot(ldx,ldy)||1;
        var lwant=Math.atan2(ldy,ldx),lda=((lwant-S.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
        S.ang+=Math.max(-.72*dt,Math.min(.72*dt,lda));
        var lst=Math.min(S.spd*dt,ldd);
        S.x+=Math.cos(S.ang)*lst; S.y+=Math.sin(S.ang)*lst;
        S.wake+=dt;
        if(S.wake>.12&&wakes.length<160){ S.wake=0; wakes.push({x:S.x-Math.cos(S.ang)*S.len*.42,y:S.y-Math.sin(S.ang)*S.len*.42,a:S.ang,life:2.4,max:2.4,w:S.wid*.5}); }
        if(ldd<28){ S.x=S.landX; S.y=S.landY; S.ang=lwant; S.landed=1; S.deployT=.8;
          banner('ENEMY LANDING','TROOPS COMING ASHORE',2.4); }
      } else if(S.deployed<6){
        S.deployT-=dt;
        if(S.deployT<=0){
          var dsx=S.shoreX+rr(-18,18),dsy=S.shoreY+rr(-18,18),dsp=freeSpot(dsx,dsy);
          spawnEnemy(S.deployed===0?'elite':(Math.random()<.4?'rusher':'rifleman'),dsp.x,dsp.y,false,null,false);
          enemies[enemies.length-1].marine=1;
          S.deployed++; S.deployT=.55;
          if(S.deployed===6) banner('LANDING FORCE ASHORE','DEFEND THE BASE',2.2);
        }
      }
      continue;
    }
    // patrol
    var wp=S.lane[S.wp], tx=wp[0]*TILE, ty=wp[1]*TILE;
    var d=Math.hypot(tx-S.x,ty-S.y);
    if(d<40){ S.wp=(S.wp+1)%S.lane.length; }
    var want=Math.atan2(ty-S.y,tx-S.x);
    // give way to anything close ahead or abeam
    var avx=0, avy=0, crowded=0;
    for(var oi=0;oi<ships.length;oi++){
      if(oi===i) continue;
      var O3=ships[oi];
      var sep=Math.hypot(O3.x-S.x,O3.y-S.y), keep=(S.len+O3.len)*.95;
      if(sep<keep&&sep>1){
        avx-=(O3.x-S.x)/sep*(1-sep/keep);
        avy-=(O3.y-S.y)/sep*(1-sep/keep);
        crowded=Math.max(crowded,1-sep/keep);
      }
    }
    if(crowded>0){
      var wx6=Math.cos(want)+avx*3.4, wy6=Math.sin(want)+avy*3.4;
      want=Math.atan2(wy6,wx6);
    }
    var dA=((want-S.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
    var na7=S.ang+Math.max(-.6*dt,Math.min(.6*dt,dA));
    if(seaRoom(S,S.x,S.y,na7)) S.ang=na7;
    var thr=S.spd*(1-crowded*.7);                     // and take way off when it gets tight
    var nx7=S.x+Math.cos(S.ang)*thr*dt, ny7=S.y+Math.sin(S.ang)*thr*dt;
    if(seaRoom(S,nx7,ny7,S.ang)){ S.x=nx7; S.y=ny7; S.aground=0; }
    else {
      // shoal ahead: put the helm over and creep until she is clear
      S.aground=(S.aground||0)+dt;
      var turned=false;
      for(var tw7=1;tw7<=8;tw7++){
        var ta=S.ang+(tw7%2?1:-1)*(Math.ceil(tw7/2))*.42;
        var tx7=S.x+Math.cos(ta)*thr*dt*.6, ty7=S.y+Math.sin(ta)*thr*dt*.6;
        if(seaRoom(S,tx7,ty7,ta)){ S.x=tx7; S.y=ty7; S.ang=ta; turned=true; break; }
      }
      if(!turned){ S.ang+=(S.turnAway||(S.turnAway=Math.random()<.5?1:-1))*1.4*dt; }
      if(S.aground>3){ S.wp=(S.wp+1)%S.lane.length; S.aground=0; }   // give up on that waypoint
    }
    // last resort: never let two hulls occupy the same water
    for(var oj=0;oj<ships.length;oj++){
      if(oj===i) continue;
      var O4=ships[oj];
      var dx6=S.x-O4.x, dy6=S.y-O4.y, dd6=Math.hypot(dx6,dy6);
      var minSep=(S.len+O4.len)*.5;
      if(dd6<minSep&&dd6>0.01){
        var push=(minSep-dd6)*.55;
        S.x+=dx6/dd6*push; S.y+=dy6/dd6*push;
        O4.x-=dx6/dd6*push; O4.y-=dy6/dd6*push;
        if(Math.random()<.06&&wakes.length<160)
          wakes.push({x:(S.x+O4.x)/2,y:(S.y+O4.y)/2,a:Math.atan2(dy6,dx6),life:1,max:1,w:10});
      }
    }
    S.x=Math.max(70,Math.min(WW-70,S.x)); S.y=Math.max(70,Math.min(WH-70,S.y));
    if(!seaRoom(S,S.x,S.y,S.ang)){                      // last resort: warp her back into open water
      S.strand=(S.strand||0)+dt;
      if(S.strand>.35){
        for(var rr8=1;rr8<30&&!seaRoom(S,S.x,S.y,S.ang);rr8++){
          for(var aa8=0;aa8<12;aa8++){
            var qx8=S.x+Math.cos(aa8/12*6.283)*rr8*10, qy8=S.y+Math.sin(aa8/12*6.283)*rr8*10;
            if(seaRoom(S,qx8,qy8,S.ang)){ S.x=qx8; S.y=qy8; break; }
          }
        }
        S.strand=0;
      }
    } else S.strand=0;
    S.wake+=dt;
    if(S.wake>.12&&wakes.length<160){ S.wake=0;
      wakes.push({x:S.x-Math.cos(S.ang)*S.len*.45,y:S.y-Math.sin(S.ang)*S.len*.45,
        a:S.ang,life:2.4,max:2.4,w:S.wid*.5}); }
    // close-in weapons against our drones
    S.aa-=dt; S.gun-=dt;
    if(aboard&&gunboat){
      var gdd=Math.hypot(gunboat.x-S.x,gunboat.y-S.y);
      if(gdd<340&&S.gun<=0){ S.gun=rr(.6,1.1); shipFireAA(S,gunboat.x,gunboat.y,1.4); }
    }
    if(S.boss3&&!aboard&&!player.dead){
      var pdd=Math.hypot(player.x-S.x,player.y-S.y);
      if(pdd<720&&S.gun<=0){ S.gun=.22; shipFireAA(S,player.x,player.y,1.25); }
    }
    if(drone&&piloting){
      var dd=Math.hypot(drone.x-S.x,drone.y-S.y);
      var sea=(drone.kind==='usv');
      if(dd<(sea?280:330)){
        if(!sea&&S.aa<=0){ S.aa=rr(.30,.55); shipFireAA(S,drone.x,drone.y,1); }
        if(sea&&S.gun<=0){ S.gun=rr(.85,1.45); shipFireAA(S,drone.x,drone.y,1.6); }
      }
      if(S.boss3&&!sea){
        S.sam-=dt;
        if(dd<720&&S.sam<=0){
          S.sam=rr(1.5,2.1);
          var sa3=Math.atan2(drone.y-S.y,drone.x-S.x)+rr(-.025,.025);
          eb.push({x:S.x+Math.cos(sa3)*18,y:S.y+Math.sin(sa3)*18,vx:Math.cos(sa3)*470,vy:Math.sin(sa3)*470,
            dmg:0,life:1.65,aa:1,mul:2.2,seaSAM:1});
          for(var ss3=0;ss3<8&&plume.length<300;ss3++) plume.push({x:S.x+rr(-12,12),y:S.y+rr(-12,12),vx:rr(-25,25),vy:rr(-25,25),life:rr(.5,1.1),max:1.1,s:rr(4,9),hot:.8});
          banner('SHIP SAM LAUNCH','MISSILE TRACKING DRONE',1.1); sfx('boom',.3);
        }
      }
    }
    // missiles at our base
    S.msl-=dt;
    if(S.msl<=0&&baseHP>0){
      var hurt2=(S.hp<S.mx*.4);                       // a wounded ship shoots off everything it has
      S.msl=rr(hurt2?20:30,hurt2?34:50);
      var salvo=(S.salvo||1)+(hurt2?1:0);
      for(var sv=0;sv<salvo;sv++){
        var bx=(BASE.x0+BASE.x1)/2*TILE+rr(-110,110), by=(BASE.y0+BASE.y1)/2*TILE+rr(-80,80);
        missiles.push({x:S.x,y:S.y,sx:S.x,sy:S.y,tx:bx,ty:by,t:-sv*.35,
          dur:Math.hypot(bx-S.x,by-S.y)/430,rot:0});
      }
      sfx('boom',.3); banner(salvo>1?'SALVO INBOUND':'MISSILE INBOUND','',1.2);
    }
  }
  // missiles run in
  for(var m=missiles.length-1;m>=0;m--){
    var M=missiles[m]; M.t+=dt;
    if(M.t<0) continue;
    var pr=Math.min(1,M.t/M.dur);
    M.x=M.sx+(M.tx-M.sx)*pr; M.y=M.sy+(M.ty-M.sy)*pr;
    if(Math.random()<.7) plume.push({x:M.x-rr(0,10),y:M.y,vx:rr(-14,14),vy:rr(-14,14),
      life:rr(.4,.9),max:.9,s:rr(2,5),hot:.7});
    if(pr>=1){
      explode(M.x,M.y,110,0,true);
      baseHP=Math.max(0,baseHP-ri(7,12)); baseFlash=.6;
      flash.style.opacity=.35; setTimeout(function(){flash.style.opacity=0;},140);
      shake=Math.min(20,shake+10); sfx('boom'); hud();
      if(Math.hypot(player.x-M.x,player.y-M.y)<120&&!player.dead){
        player.hp-=18; if(player.hp<=0){ player.hp=0; downPlayer(); }
      }
      if(baseHP<=0){ banner('BASE DESTROYED','',2.6); gameOver(false,'base'); }
      missiles.splice(m,1);
    }
  }
  if(mapKind==='sea'&&alive===0&&ships.length===0&&enemies.length===0&&state==='play'&&!player.dead&&!seaBossDefeated) spawnSeaBoss();
}
function hitRefinery(R,dmg,x,y){
  if(R.dead) return;
  R.hp-=dmg; R.burn=Math.max(R.burn,.6);
  if(mapKind==='redSquare'){
    if(R.hp<=0) blowRedBuilding(R);
    return;
  }
  if(fires.length<16&&Math.random()<.6)
    fires.push({x:x+rr(-30,30),y:y+rr(-24,24),r:rr(11,18),p:rr(0,6),life:60,sp:0});
  for(var p0=0;p0<12&&plume.length<300;p0++)
    plume.push({x:x+rr(-30,30),y:y+rr(-24,24),vx:rr(-24,24),vy:-rr(30,70),
      life:rr(2.5,5),max:5,s:rr(10,22),hot:1,oil:1});
  if(R.hp<=0) blowRefinery(R);
}
function blowRedBuilding(R){
  if(R.dead) return;
  R.dead=1; R.hp=0;
  explode(R.cx,R.cy,190,28,true); blastWalls(R.cx,R.cy,150,420);
  for(var sr=sams.length-1;sr>=0;sr--) if(sams[sr].building===R.i) sams.splice(sr,1);
  for(var dp=0;dp<26;dp++) launchPart(R.cx+rr(-60,60),R.cy+rr(-45,45),'debris',null,null,rr(0,6.283),rr(.8,1.8));
  money+=350; shake=Math.min(18,shake+12); sfx('boom',.7);
  var left=0; for(var rb=0;rb<refineries.length;rb++) if(!refineries[rb].dead) left++;
  banner(R.name+' DOWN',left?left+' TARGET BUILDINGS REMAIN':'ALL TARGET BUILDINGS DOWN',2.4); hud();
}
function compoundRoadSpot(preferX,avoidX,avoidY){
  var xOffsets=[0,-2,2,-4,4,-6,6,-8,8,-10,10],yRows=[45.5,44.5,46.5];
  for(var ry=0;ry<yRows.length;ry++) for(var xo=0;xo<xOffsets.length;xo++){
    var px=(preferX+xOffsets[xo])*TILE,py=yRows[ry]*TILE;
    if(px<3*TILE||px>WW-3*TILE) continue;
    if(avoidX!==undefined&&Math.hypot(px-avoidX,py-avoidY)<8*TILE) continue;
    if(hitBox(px,py,24)) continue;
    var openAll=true;
    for(var ca=0;ca<8;ca++) if(hitBox(px+Math.cos(ca/8*6.283)*24,py+Math.sin(ca/8*6.283)*24,16)){ openAll=false; break; }
    if(openAll) return {x:px,y:py};
  }
  return freeSpot(preferX*TILE,45.5*TILE);
}
function compoundBossRandomSpot(targetX,targetY){
  var targetTX=Math.floor(targetX/TILE),targetTY=Math.floor(targetY/TILE);
  for(var attempt=0;attempt<180;attempt++){
    var tx=ri(3,MW-4),ty=ri(3,MH-4),px=(tx+.5)*TILE,py=(ty+.5)*TILE;
    if(Math.hypot(px-targetX,py-targetY)<10*TILE||hitBox(px,py,24)) continue;
    var clearRing=true;
    for(var ca=0;ca<12;ca++){
      var aa=ca/12*6.283;
      if(hitBox(px+Math.cos(aa)*30,py+Math.sin(aa)*30,18)){ clearRing=false; break; }
    }
    if(!clearRing) continue;
    // A candidate only qualifies when navigation proves there is a usable exit.
    var escapePath=findPath(tx,ty,targetTX,targetTY);
    if(escapePath&&escapePath.length>10) return {x:px,y:py};
  }
  return compoundRoadSpot(27.5,targetX,targetY);
}
function spawnAirfieldBoss(){
  if(airfieldBossSpawned) return;
  airfieldBossSpawned=1;
  var bossSpot=freeSpot(50*TILE,21*TILE);
  spawnEnemy('heavy',bossSpot.x,bossSpot.y,false,null,true);
  var KB=enemies[enemies.length-1];
  KB.airfieldBoss=1; KB.boss=1; KB.elite=0; KB.r=24; KB.bossScale=1.18;
  KB.hp=KB.mx=700; KB.nukeCd=.7; KB.walk=0; KB.cvx=0; KB.cvy=0;
  KB.d=Object.assign({},KB.d,{col:'#17191d',band:'#751f26',dmg:0,range:0,rof:9,pref:245,spd:64});
  banner('LEVEL 5 BOSS','KIM JONG UN ENTERS THE AIRFIELD',2.8); hud();
}
function spawnOilBoss(){
  if(oilBossSpawned) return;
  oilBossSpawned=1;
  var bossSpot=freeSpot(49*TILE,24*TILE);
  spawnEnemy('heavy',bossSpot.x,bossSpot.y,false,null,true);
  var MB=enemies[enemies.length-1];
  MB.oilBoss=1; MB.boss=1; MB.elite=0; MB.r=21; MB.bossScale=1.16;
  MB.hp=MB.mx=760; MB.fireBottleCd=.7; MB.walk=0; MB.cvx=0; MB.cvy=0;
  MB.d=Object.assign({},MB.d,{col:'#24282d',band:'#a8322a',dmg:0,range:0,rof:9,pref:240,spd:68});
  banner('LEVEL 4 BOSS','DMITRY MEDVEDEV ENTERS THE OIL FIELDS',2.8); hud();
}
function spawnCompoundBoss(){
  if(compoundBossSpawned) return;
  compoundBossSpawned=1;
  var playerSpot=compoundRoadSpot(42.5);
  var bossSpot=compoundBossRandomSpot(playerSpot.x,playerSpot.y);
  spawnEnemy('heavy',bossSpot.x,bossSpot.y,false,null,true);
  var CB=enemies[enemies.length-1];
  CB.compoundBoss=1; CB.boss=1; CB.elite=0; CB.r=16; CB.bossScale=1.14;
  CB.hp=CB.mx=1040; CB.hammerCd=.35; CB.hammerWind=0; CB.walk=0; CB.walkBlend=0; CB.stuckT=0; CB.cvx=0; CB.cvy=0; CB.amt=0;
  CB.d=Object.assign({},CB.d,{col:'#c5b58f',band:'#7f7159',dmg:0,range:0,rof:9,pref:235,spd:72});
  if(player){
    player.x=playerSpot.x; player.y=playerSpot.y; player.face=Math.atan2(CB.y-player.y,CB.x-player.x);
    cam.x=player.x-VW/2; cam.y=player.y-VH/2;
  }
  banner('LEVEL 1 BOSS','YEVGENY PRIGOZHIN ENTERS THE FIGHT',2.8); hud();
}
function spawnLevelTwoBoss(){
  if(levelTwoBossSpawned) return;
  levelTwoBossSpawned=1;
  // Keep the player's existing verified walkable position; only randomize the boss.
  var target={x:player.x,y:player.y},spot=null;
  for(var st2=0;st2<100&&!spot;st2++){
    var tx2=ri(4,MW-5),ty2=ri(4,MH-5),px2=(tx2+.5)*TILE,py2=(ty2+.5)*TILE;
    if(hitBox(px2,py2,28)||Math.hypot(px2-target.x,py2-target.y)<9*TILE) continue;
    var pth2=findPath(tx2,ty2,Math.floor(target.x/TILE),Math.floor(target.y/TILE));
    if(pth2&&pth2.length>9) spot={x:px2,y:py2};
  }
  if(!spot) spot=freeSpot(48*TILE,42*TILE);
  spawnEnemy('heavy',spot.x,spot.y,false,null,true);
  var GB=enemies[enemies.length-1]; GB.levelTwoBoss=1; GB.boss=1; GB.elite=0; GB.r=16; GB.bossScale=0.83;
  GB.hp=GB.mx=680; GB.meatCd=.8; GB.grind=0; GB.cvx=0; GB.cvy=0; GB.walk=0; GB.amt=0;
  GB.d=Object.assign({},GB.d,{col:'#4f5945',band:'#a8322a',dmg:0,range:0,rof:9,pref:265,spd:62});
  if(player){ player.face=Math.atan2(GB.y-player.y,GB.x-player.x); cam.x=player.x-VW/2; cam.y=player.y-VH/2; }
  banner('LEVEL 2 BOSS','VALERY GERASIMOV · THE MEAT GRINDER',3); hud();
}
function spawnRedBoss(){
  if(redBossSpawned) return;
  redBossSpawned=1;
  var bossSpot=freeSpot(55*TILE,27*TILE);
  spawnEnemy('heavy',bossSpot.x,bossSpot.y,false,null,true);
  var PB=enemies[enemies.length-1];
  PB.finalBoss=1; PB.boss=1; PB.elite=0; PB.r=24; PB.bossScale=1.12;
  PB.hp=PB.mx=1224;
  PB.d=Object.assign({},PB.d,{col:'#252a31',band:'#a8322a',dmg:0,range:0,rof:9,pref:210,spd:78});
  PB.barrelCd=.7; PB.horsePhase=0;
  banner('FINAL BOSS','PUTIN ENTERS FROM THE KREMLIN',2.8); hud();
}
function updateRedSquare(dt){
  updateOil(dt);
  for(var mc=0;mc<motorcade.length;mc++){
    var C=motorcade[mc]; if(C.dead) continue;
    if(C.hurt>0) C.hurt-=dt;
    if(C.stop>0){ C.stop-=dt; continue; }
    var CP=C.route[C.wp],cdx=CP[0]-C.x,cdy=CP[1]-C.y,cdd=Math.hypot(cdx,cdy)||1;
    if(cdd<12){
      C.wp=(C.wp+1)%C.route.length; C.stop=rr(3.2,6.4);
      if(C.checks<2){
        C.checks++;
        for(var cg=0;cg<2;cg++){
          var guardSpot=freeSpot(C.x+rr(-36,36),C.y+rr(-38,38));
          spawnEnemy(cg===0?'elite':'rifleman',guardSpot.x,guardSpot.y,false,null,false);
          var security=enemies[enemies.length-1];
          security.d=Object.assign({},security.d,{col:'#171a1d',band:'#2b2f33'});
          security.redGuard=1; security.motorSecurity=1; security.patrolT=0;
          security.home={x0:C.x/TILE-3.8,y0:C.y/TILE-3.8,x1:C.x/TILE+3.8,y1:C.y/TILE+3.8,alert:1};
        }
        banner('MOTORCADE CHECKPOINT','BLACK-UNIFORMED SECURITY DEPLOYING',1.8); hud();
      }
      continue;
    }
    C.ang=Math.atan2(cdy,cdx); var csp=72*dt; C.x+=cdx/cdd*csp; C.y+=cdy/cdd*csp;
  }
  var left=0; for(var rb=0;rb<refineries.length;rb++) if(!refineries[rb].dead) left++;
  var carsLeft=0; for(var mcl=0;mcl<motorcade.length;mcl++) if(!motorcade[mcl].dead) carsLeft++;
  if(carsLeft===0&&!redBossSpawned&&state==='play'&&!player.dead) spawnRedBoss();
  if(left===0&&carsLeft===0&&redBossDefeated&&enemies.length===0&&state==='play'&&!player.dead) sectorClear();
}
function hitMotorcadeCar(C,dmg){
  if(C.dead) return; C.hp-=dmg; C.hurt=.22;
  if(C.hp<=0){ C.dead=1; C.hp=0; explode(C.x,C.y,105,18,true); money+=150; banner('MOTORCADE VEHICLE DOWN','',1.3); hud(); }
}
function blowRefinery(R){
  if(R.dead) return;
  R.dead=1; R.hp=0;
  banner('REFINERY DESTROYED','',2.4);
  explode(R.cx,R.cy,300,40,true);
  explode(R.cx+rr(-70,70),R.cy+rr(-50,50),220,20,true);
  explode(R.cx+rr(-70,70),R.cy+rr(-50,50),220,20,true);
  blastWalls(R.cx,R.cy,240,700);
  for(var e=enemies.length-1;e>=0;e--){
    var E0=enemies[e], d0=Math.hypot(E0.x-R.cx,E0.y-R.cy);
    if(d0<300) hurtEnemy(E0,9999,0,true);
  }
  for(var sm=sams.length-1;sm>=0;sm--)
    if(Math.hypot(sams[sm].x-R.cx,sams[sm].y-R.cy)<260) sams.splice(sm,1);
  var pd0=Math.hypot(player.x-R.cx,player.y-R.cy);
  if(!player.dead&&!inBase(player.x,player.y)&&pd0<300) hurtPlayer(200*(1-pd0/300)+30);
  for(var f=0;f<12&&fires.length<16;f++)
    fires.push({x:R.cx+rr(-90,90),y:R.cy+rr(-70,70),r:rr(18,30),p:rr(0,6),life:900,sp:0});
  for(var d2=0;d2<80;d2++)
    launchPart(R.cx+rr(-50,50),R.cy+rr(-40,40),'debris',null,null,rr(0,6.283),rr(1.3,2.8));
  for(var p2=0;p2<60&&plume.length<300;p2++)
    plume.push({x:R.cx+rr(-80,80),y:R.cy+rr(-60,60),vx:rr(-60,60),vy:-rr(50,140),
      life:rr(4,8),max:8,s:rr(16,36),hot:1,oil:1});
  for(var e2=0;e2<60&&embers.length<260;e2++)
    embers.push({x:R.cx+rr(-60,60),y:R.cy+rr(-40,40),vx:rr(-150,150),vy:-rr(80,240),
      life:rr(1.2,3),max:3});
  dustPuff(R.cx,R.cy,24,2.6);
  shake=Math.min(30,shake+26); sfx('boom'); sfx('boom',.7); sfx('boom',.4);
  droneCam={x:R.cx,y:R.cy,t:5.6};
  money+=400;
  var left=0; for(var q=0;q<refineries.length;q++) if(!refineries[q].dead) left++;
  banner('REFINERY DOWN', left? left+' STILL PUMPING':'THE FIELD IS BURNING',2.6);
  hud();
  if(mapKind==='oil'&&left===0&&state==='play'&&!oilBossSpawned) spawnOilBoss();
}
function updateOil(dt){
  var burning=0;
  for(var i=0;i<refineries.length;i++){
    var R=refineries[i];
    if(R.dead){
      burning++;
      // a column of oily black smoke, forever
      if(plume.length<300&&Math.random()<.85)
        plume.push({x:R.cx+rr(-70,70),y:R.cy+rr(-55,55),vx:rr(-14,14)+wind*.5,vy:-rr(24,60),
          life:rr(5,10),max:10,s:rr(14,30),hot:Math.random()<.25?.7:0,oil:1});
      if(Math.random()<.25&&embers.length<260)
        embers.push({x:R.cx+rr(-50,50),y:R.cy+rr(-40,40),vx:rr(-40,40),vy:-rr(50,130),
          life:rr(1,2.4),max:2.4});
      continue;
    }
    if(R.burn>0){
      R.burn-=dt*.2;
      if(plume.length<300&&Math.random()<.4)
        plume.push({x:R.cx+rr(-40,40),y:R.cy+rr(-30,30),vx:rr(-12,12),vy:-rr(20,50),
          life:rr(3,6),max:6,s:rr(10,20),hot:.4,oil:1});
    }
    // they shell our base
    R.msl-=dt;
    if(R.msl<=0&&baseHP>0){
      R.msl=rr(26,48);
      var bx=(BASE.x0+BASE.x1)/2*TILE+rr(-110,110), by=(BASE.y0+BASE.y1)/2*TILE+rr(-80,80);
      missiles.push({x:R.cx,y:R.cy,sx:R.cx,sy:R.cy,tx:bx,ty:by,t:0,
        dur:Math.hypot(bx-R.cx,by-R.cy)/460,rot:0});
      sfx('boom',.3); banner('MISSILE INBOUND','',1.2);
    }
  }
  smog=Math.min(.62,burning*.105);
  // SAM sites
  for(var si=sams.length-1;si>=0;si--){
    var S=sams[si];
    if(S.hurt>0) S.hurt-=dt;
    S.cd-=dt;
    var tgt=(drone&&piloting)?drone:null;
    if(!tgt&&wingmen.length) tgt=wingmen[0];
    if(!tgt){ continue; }
    var td=Math.hypot(tgt.x-S.x,tgt.y-S.y);
    if(td>560) continue;
    S.ang=Math.atan2(tgt.y-S.y,tgt.x-S.x);
    if(S.cd<=0){
      S.cd=rr(5,8.5);
      samShots.push({x:S.x,y:S.y,vx:Math.cos(S.ang)*150,vy:Math.sin(S.ang)*150,
        ang:S.ang,life:7,t:0});
      sfx('boom',.25); banner('SAM LAUNCH','BREAK AWAY',1.1);
      for(var sp3=0;sp3<10&&plume.length<300;sp3++)
        plume.push({x:S.x,y:S.y,vx:rr(-40,40),vy:rr(-40,40),life:rr(.6,1.4),max:1.4,s:rr(5,12),hot:.8});
    }
  }
  // missiles in flight, chasing whatever we have up
  for(var mi=samShots.length-1;mi>=0;mi--){
    var M=samShots[mi]; M.t+=dt; M.life-=dt;
    var tg=(drone&&piloting)?drone:null;
    if(tg){
      var want=Math.atan2(tg.y-M.y,tg.x-M.x);
      var dA=((want-M.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
      M.ang+=Math.max(-1.5*dt,Math.min(1.5*dt,dA));
    }
    var msp=Math.min(360,140+M.t*150);
    M.vx=Math.cos(M.ang)*msp; M.vy=Math.sin(M.ang)*msp;
    M.x+=M.vx*dt; M.y+=M.vy*dt;
    if(Math.random()<.8&&plume.length<300)
      plume.push({x:M.x,y:M.y,vx:rr(-10,10),vy:rr(-10,10),life:rr(.4,.9),max:.9,s:rr(2,5),hot:.9});
    if(tg&&Math.hypot(tg.x-M.x,tg.y-M.y)<20){
      explode(M.x,M.y,70,0,true);
      drone.hp-=mapKind==='redSquare'?999:rr(38,62);
      if(drone.hp<=0){
        explode(drone.x,drone.y,50,0,true);
        if(drone.pad) drone.pad.cd=0;
        drone=null; piloting=false; firing=false; actBtn.classList.remove('on');
        banner('DRONE SHOT DOWN','ANOTHER IS READY',1.8); sfx('ric',.8);
      }
      samShots.splice(mi,1); continue;
    }
    if(M.life<=0||M.x<0||M.y<0||M.x>WW||M.y>WH){ explode(M.x,M.y,50,0,true); samShots.splice(mi,1); }
  }
}
function hitAircraft(A,dmg){
  if(A.dead) return; A.hp-=dmg; A.hurt=.25;
  if(A.hp<=0){
    A.dead=1; A.hp=0; explode(A.x,A.y,A.cargo?260:190,45,true);
    for(var s=sams.length-1;s>=0;s--) if(sams[s].aircraft===A.i) sams.splice(s,1);
    banner(A.name+' DESTROYED',A.cargo?'UNLOADING STOPPED':'',1.8); money+=300; hud();
  }
}
function updateAirfield(dt){
  updateOil(dt); var remaining=0;
  for(var i=0;i<aircraft.length;i++){ var A=aircraft[i]; if(A.dead) continue; remaining++; if(A.hurt>0) A.hurt-=dt;
    if(A.cargo){ A.unload-=dt; if(A.unload<=0&&A.deployed<12){
      var sp=freeSpot(A.x+rr(-80,80),A.y+rr(70,125));
      spawnEnemy(A.deployed%5===0?'elite':(Math.random()<.35?'rusher':'rifleman'),sp.x,sp.y,false,null,false);
      var defender=enemies[enemies.length-1];
      defender.airGuard=1; defender.patrolT=0;
      defender.guardAircraft=A.i;
      defender.home={x0:A.x/TILE-5,y0:A.y/TILE-5,x1:A.x/TILE+9,y1:A.y/TILE+7,alert:1};
      A.deployed++; A.unload=rr(1.4,2.1); if(A.deployed===1) banner(A.name+' UNLOADING','WEAPONS AND TROOPS ON THE APRON',2.4);
    }}
  }
  if(airAssaultWave<2){
    airAssaultT-=dt;
    if(airAssaultT<=0){
      airAssaultWave++;
      for(var aw=0;aw<8;aw++){
        var waveSpot=freeSpot((27+aw%4*1.25)*TILE,(42+Math.floor(aw/4)*10+rr(-1,1))*TILE);
        spawnEnemy(aw===0?'elite':(aw%3===0?'rusher':'rifleman'),waveSpot.x,waveSpot.y,false,null,false);
        var baseRaider=enemies[enemies.length-1]; baseRaider.marine=1; baseRaider.baseAssault=airAssaultWave;
      }
      banner('BASE ASSAULT '+airAssaultWave+' OF 2','ENEMY WAVE INBOUND',2.5);
      airAssaultT=airAssaultWave===1?34:999;
      hud();
    }
  }
  if(!remaining&&enemies.length===0&&airAssaultWave>=2&&state==='play'&&!player.dead) spawnAirfieldBoss();
}
function drawAircraft(c,A){
  var planeScale=A.cargo?6:1;
  c.save(); c.translate(A.x,A.y); c.rotate(A.ang); c.scale(planeScale,planeScale);
  if(A.dead){ c.globalAlpha=.55; }
  c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(4,8,A.cargo?58:42,A.cargo?19:14,0,0,6.3); c.fill();
  c.fillStyle=A.dead?'#252625':(A.cargo?'#59614f':'#68727a');
  c.beginPath(); c.moveTo(A.cargo?64:50,0); c.lineTo(-42,-9); c.lineTo(-55,-5); c.lineTo(-55,5); c.lineTo(-42,9); c.closePath(); c.fill(); outl(c,'#151a1d',2);
  c.beginPath(); c.moveTo(2,-6); c.lineTo(-28,-(A.cargo?42:34)); c.lineTo(-39,-35); c.lineTo(-18,-4); c.closePath(); c.fill(); outl(c,'#151a1d',2);
  c.beginPath(); c.moveTo(2,6); c.lineTo(-28,(A.cargo?42:34)); c.lineTo(-39,35); c.lineTo(-18,4); c.closePath(); c.fill(); outl(c,'#151a1d',2);
  // Cockpit glazing, nose panels and fuselage seams.
  c.fillStyle='#263b43'; rrect(c,39,-6,16,12,5); c.fill(); outl(c,'#11191c',1.2);
  c.strokeStyle='rgba(174,202,211,.7)'; c.lineWidth=.8;
  c.beginPath(); c.moveTo(46,-5); c.lineTo(46,5); c.moveTo(39,0); c.lineTo(55,0); c.stroke();
  c.strokeStyle='rgba(28,34,31,.65)'; c.lineWidth=.7;
  for(var pn=-32;pn<=25;pn+=14){ c.beginPath(); c.moveTo(pn,-8); c.lineTo(pn,8); c.stroke(); }
  c.beginPath(); c.moveTo(-40,-5); c.lineTo(35,-5); c.moveTo(-40,5); c.lineTo(35,5); c.stroke();
  // Four detailed engine nacelles under the wings.
  var engPos=[[-18,-29],[-4,-18],[-18,29],[-4,18]];
  for(var eg=0;eg<engPos.length;eg++){
    var ex=engPos[eg][0],ey=engPos[eg][1];
    c.fillStyle='#424b45'; c.beginPath(); c.ellipse(ex,ey,10,5.3,0,0,6.3); c.fill(); outl(c,'#131713',1.2);
    c.fillStyle='#1a211f'; c.beginPath(); c.ellipse(ex+7,ey,3.6,3.5,0,0,6.3); c.fill();
    c.fillStyle='#87918a'; c.beginPath(); c.arc(ex+7,ey,1.4,0,6.3); c.fill();
  }
  // Landing gear, wing stripes and navigation lights.
  c.fillStyle='#161b19'; c.beginPath(); c.arc(-15,-10,3,0,6.3); c.fill(); c.beginPath(); c.arc(-15,10,3,0,6.3); c.fill();
  c.strokeStyle='rgba(220,226,219,.45)'; c.lineWidth=1.2;
  c.beginPath(); c.moveTo(-25,-35); c.lineTo(-19,-27); c.moveTo(-25,35); c.lineTo(-19,27); c.stroke();
  c.fillStyle='#48a96a'; c.beginPath(); c.arc(-37,-35,1.8,0,6.3); c.fill();
  c.fillStyle='#d6453d'; c.beginPath(); c.arc(-37,35,1.8,0,6.3); c.fill();
  // North Korean flag marking: blue borders, red field, white disc and red star.
  c.fillStyle='#1c4f9b'; c.fillRect(-19,-7,22,14);
  c.fillStyle='#fff'; c.fillRect(-19,-5,22,10);
  c.fillStyle='#c92d35'; c.fillRect(-19,-4,22,8);
  c.fillStyle='#fff'; c.beginPath(); c.arc(-12,0,3.5,0,6.3); c.fill();
  c.fillStyle='#c92d35'; c.beginPath();
  for(var nk=0;nk<10;nk++){ var nka=-Math.PI/2+nk*Math.PI/5,nkr=nk%2?1.25:3; var nkx=-12+Math.cos(nka)*nkr,nky=Math.sin(nka)*nkr; if(nk===0)c.moveTo(nkx,nky);else c.lineTo(nkx,nky); }
  c.closePath(); c.fill();
  if(A.cargo&&!A.dead){
    c.fillStyle='#222823'; rrect(c,-49,10,30,15,2); c.fill(); outl(c,'#121612',1.2);
    c.fillStyle='#596055'; rrect(c,-50,24,34,6,1); c.fill(); outl(c,'#151915',1);
    c.strokeStyle='#98a29a'; c.lineWidth=.8; for(var rl=0;rl<4;rl++){ c.beginPath(); c.moveTo(-47+rl*8,25); c.lineTo(-47+rl*8,29); c.stroke(); }
    c.fillStyle='#917b45'; for(var q=0;q<3;q++){ rrect(c,-45+q*9,13,7,7,1); c.fill(); outl(c,'#342814',.7); }
  }
  c.restore();
  if(!A.dead){
    var pile=A.weaponPile||0,pileX=A.x+460,pileY=A.y+260;
    for(var wp=0;wp<pile;wp++){
      var pc=wp%4,pr=Math.floor(wp/4);
      c.fillStyle=shade('#796a42',.9+(wp%3)*.08); rrect(c,pileX+pc*18,pileY-pr*12,16,11,2); c.fill(); outl(c,'#2a2112',1.2);
      c.strokeStyle='#c6aa4d'; c.lineWidth=1; c.beginPath(); c.moveTo(pileX+pc*18+3,pileY-pr*12+5); c.lineTo(pileX+pc*18+13,pileY-pr*12+5); c.stroke();
    }
    c.fillStyle='rgba(228,238,241,.8)'; c.font='bold 7px Arial'; c.fillText('WEAPON CARGO',pileX,pileY+18);
  }
  if(!A.dead){ var barY=A.y-(A.cargo?310:58),barW=A.cargo?250:72;
    c.fillStyle='rgba(0,0,0,.65)'; rrect(c,A.x-barW/2,barY,barW,7,3); c.fill(); c.fillStyle='#d84a34'; rrect(c,A.x-barW/2+2,barY+1.5,(barW-4)*(A.hp/A.mx),4,2); c.fill();
    c.fillStyle='#dce3e6'; c.font='bold 9px Arial'; c.textAlign='center'; c.fillText(A.name,A.x,barY-5); c.textAlign='start'; }
}
function updateDepotWorkers(dt){
  if(mapKind!=='trench') return;
  for(var i=0;i<depotWorkers.length;i++){
    var W=depotWorkers[i], D=depots[W.depot];
    if(!D||D.blown){ W.alive=0; continue; }
    W.alive=1;
    var ax=W.dir>0?W.toX:W.fromX, ay=W.dir>0?W.toY:W.fromY;
    var dx=ax-W.x,dy=ay-W.y,dd=Math.hypot(dx,dy)||1,spd=58;
    if(dd<5){ W.dir*=-1; W.carry=W.dir>0; continue; }
    W.x+=dx/dd*spd*dt; W.y+=dy/dd*spd*dt; W.ang=Math.atan2(dy,dx);
    W.walk+=dt*8.5; W.amt=1;
  }
}
function drawDepotTruck(c,D){
  if(D.blown) return;
  var x=D.truckX,y=D.truckY;
  c.save(); c.translate(x,y);
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0,11,42,13,0,0,6.3); c.fill();
  c.fillStyle='#4b553d'; rrect(c,-38,-15,55,27,5); c.fill(); outl(c,'#161a12',2.3);
  c.fillStyle='#65704f'; rrect(c,15,-11,25,23,4); c.fill(); outl(c,'#161a12',2.2);
  c.fillStyle='#26302a'; rrect(c,21,-8,13,8,2); c.fill();
  c.fillStyle='#81724b';
  for(var q=0;q<6;q++){ var qx=-33+(q%3)*16,qy=-12+Math.floor(q/3)*12;
    rrect(c,qx,qy,14,10,1.5); c.fill(); outl(c,'#302716',1.1); }
  c.fillStyle='#d4b33f'; c.font='bold 7px Arial'; c.textAlign='center'; c.fillText('AMMO',-11,20); c.textAlign='start';
  c.fillStyle='#1c211a'; c.beginPath(); c.arc(-24,13,7,0,6.3); c.fill(); c.beginPath(); c.arc(28,13,7,0,6.3); c.fill();
  c.fillStyle='#67705c'; c.beginPath(); c.arc(-24,13,3,0,6.3); c.fill(); c.beginPath(); c.arc(28,13,3,0,6.3); c.fill();
  c.restore();
}
function drawDepotWorker(c,W){
  if(!W.alive) return;
  drawUnit(c,W.x,W.y,W.ang,'#59614a','#c0392b',W.walk,W.amt,null,null,false,false,true,W.sid,0);
  if(W.carry){
    c.save(); c.translate(W.x,W.y-15); c.fillStyle='#786941'; rrect(c,-7,-5,14,10,2); c.fill(); outl(c,'#241d10',1.5);
    c.strokeStyle='#c6a94a'; c.lineWidth=1.3; c.beginPath(); c.moveTo(-5,0); c.lineTo(5,0); c.stroke(); c.restore();
  }
}
function updateAA(dt){
  for(var i=aaGuns.length-1;i>=0;i--){
    var G=aaGuns[i];
    if(G.hurt>0) G.hurt-=dt;
    if(depots[G.depot]&&depots[G.depot].blown){ aaGuns.splice(i,1); continue; }
    G.spin+=dt*(G.burst>0?26:4);
    // anything of ours in the air, out to 420px
    var tx=null,ty=null,td=1e9;
    if(drone&&piloting){
      var dd=Math.hypot(drone.x-G.x,drone.y-G.y);
      if(dd<420){ tx=drone.x; ty=drone.y; td=dd; }
    }
    for(var n=0;n<nades.length;n++){
      var nd=Math.hypot(nades[n].x-G.x,nades[n].y-G.y);
      if(nd<300&&nd<td){ tx=nades[n].x; ty=nades[n].y; td=nd; }
    }
    if(tx===null){ G.cd=Math.max(G.cd-dt,0); G.burst=0; continue; }
    G.ang=Math.atan2(ty-G.y,tx-G.x);
    G.cd-=dt;
    if(G.burst>0){
      G.burst-=dt*13;
      if(Math.random()<.62){
        var a9=G.ang+rr(-.07,.07);
        eb.push({x:G.x+Math.cos(G.ang)*13,y:G.y+Math.sin(G.ang)*13,
          vx:Math.cos(a9)*760,vy:Math.sin(a9)*760,dmg:0,life:.9,aa:1,mul:1.5});
        fx.push({t:'flash',x:G.x,y:G.y,a:G.ang,life:.04,max:.04,s:.8});
        sfx('enemy',.28);
      }
    } else if(G.cd<=0){ G.cd=rr(.5,.95); G.burst=8; }
    // frags thrown at the dump get swatted out of the air
    for(var n2=nades.length-1;n2>=0;n2--){
      var N2=nades[n2];
      if(Math.hypot(N2.x-G.x,N2.y-G.y)<250&&Math.random()<.9*dt){
        explode(N2.x,N2.y,50,30,true); nades.splice(n2,1);
        banner('FRAG SHOT DOWN','THE GUNS COVER THE DUMP',1.3);
      }
    }
  }
}
function updateEDrones(dt){
  for(var i=edrones.length-1;i>=0;i--){
    var D=edrones[i];
    D.rot+=dt*38; D.bob+=dt*2.6;
    if(D.hurt>0) D.hurt-=dt;
    var pd=Math.hypot(player.x-D.x,player.y-D.y);
    if(D.state==='idle'){
      var hx=D.hx+Math.cos(D.bob*.7)*26, hy=D.hy+Math.sin(D.bob*.9)*20;
      D.x+=(hx-D.x)*Math.min(1,dt*1.4); D.y+=(hy-D.y)*Math.min(1,dt*1.4);
      if(pd<320&&!inBase(player.x,player.y)&&!player.dead){
        D.state='hunt'; D.warn=1.6;
        banner('DRONE INBOUND','SHOOT IT DOWN',1.6); sfx('ric',.5);
      }
    } else if(D.state==='hunt'){
      if(D.warn>0) D.warn-=dt;
      if(pd>640||player.dead||inBase(player.x,player.y)){ D.state='idle'; continue; }
      var a=Math.atan2(player.y-D.y,player.x-D.x);
      D.vx+=Math.cos(a)*640*dt; D.vy+=Math.sin(a)*640*dt;
      D.vx*=.93; D.vy*=.93;
      var sp=Math.hypot(D.vx,D.vy), mx=210;
      if(sp>mx){ D.vx=D.vx/sp*mx; D.vy=D.vy/sp*mx; }
      D.x+=D.vx*dt; D.y+=D.vy*dt;
      if(Math.random()<.3) plume.push({x:D.x+rr(-5,5),y:D.y+rr(-5,5),vx:rr(-8,8),vy:rr(-4,10),
        life:rr(.25,.6),max:.6,s:rr(1.5,3),hot:0});
      if(pd<22){ killEDrone(D,true); }
    }
  }
}
function killEDrone(D,hit){
  var i=edrones.indexOf(D); if(i>=0) edrones.splice(i,1);
  if(hit) explode(D.x,D.y,74,46,false);
  else { fx.push({t:'ring',x:D.x,y:D.y-30,life:.35,max:.35}); sfx('ric',.6);
         for(var d=0;d<8;d++) launchPart(D.x,D.y,'debris',null,null,rr(0,6.3),rr(.4,.8)); }
  dustPuff(D.x,D.y,4,.7);
  for(var c=0;c<ri(2,5);c++) dropCash(D.x,D.y,ri(8,20),rr(0,6.3),1);
}
function fireEMP(){
  emps.push({x:player.x,y:player.y,r:0,max:300,t:0});
  sfx('ric',.9); sfx('boom',.15); shake=Math.min(10,shake+4);
  for(var i=edrones.length-1;i>=0;i--){
    if(Math.hypot(edrones[i].x-player.x,edrones[i].y-player.y)<300) killEDrone(edrones[i],false);
  }
  banner('JAMMER FIRED','DRONES DOWN',1.4);
}
function updateTank(dt){
  if(!tank) return;
  var T2=tank, pd=Math.hypot(player.x-T2.x,player.y-T2.y);
  if(T2.hurt>0) T2.hurt-=dt;
  var seeP=!inBase(player.x,player.y)&&los(T2.x,T2.y,player.x,player.y)&&!smokeBlocked(T2.x,T2.y,player.x,player.y);
  // grind toward the player, flattening anything in the way
  var mvx=0,mvy=0;
  if(pd>150){
    var fd=flowDir(Math.floor(T2.x/TILE),Math.floor(T2.y/TILE));
    if(fd){ var l=Math.hypot(fd.x,fd.y)||1; mvx=fd.x/l; mvy=fd.y/l; }
    else { mvx=(player.x-T2.x)/pd; mvy=(player.y-T2.y)/pd; }
    var step=46*dt, ox=T2.x, oy=T2.y, base=Math.atan2(mvy,mvx), off=[0,.4,-.4,.9,-.9];
    for(var o=0;o<off.length;o++){
      var aa=base+off[o], px2=T2.x, py2=T2.y;
      moveEnt(T2,Math.cos(aa)*step,Math.sin(aa)*step);
      if(inBase(T2.x,T2.y)){ T2.x=px2; T2.y=py2; continue; }
      if(Math.hypot(T2.x-px2,T2.y-py2)>step*.6) break;
    }
    if(Math.hypot(T2.x-ox,T2.y-oy)<step*.4){          // shoulder the wall out of the way
      var fx4=T2.x+Math.cos(base)*26, fy4=T2.y+Math.sin(base)*26;
      damageWall(Math.floor(fx4/TILE),Math.floor(fy4/TILE),120*dt*10);
      if(Math.random()<.25) dustPuff(fx4,fy4,2,.9);
    }
    T2.ang=base; T2.track+=dt*5;
  }
  var want=Math.atan2(player.y-T2.y,player.x-T2.x), dA=((want-T2.tang+Math.PI*3)%(Math.PI*2))-Math.PI;
  T2.tang+=Math.max(-1.6*dt,Math.min(1.6*dt,dA));
  // main gun
  T2.cd-=dt;
  if(seeP&&pd<620&&T2.cd<=0&&Math.abs(dA)<.3){
    T2.cd=rr(4.5,6.5);
    eb.push({x:T2.x+Math.cos(T2.tang)*30,y:T2.y+Math.sin(T2.tang)*30,
      vx:Math.cos(T2.tang)*420,vy:Math.sin(T2.tang)*420,dmg:0,life:2.2,shell:1});
    fx.push({t:'flash',x:T2.x,y:T2.y,a:T2.tang,life:.1,max:.1,s:2.6});
    dustPuff(T2.x+Math.cos(T2.tang)*36,T2.y+Math.sin(T2.tang)*36,5,1.2);
    shake=Math.min(16,shake+6); sfx('boom',.55);
  }
  // coax machine gun
  T2.mg-=dt;
  if(seeP&&pd<300&&T2.mg<=0){
    T2.mg=rr(1.6,2.6); T2.mgb=6;
  }
  if(T2.mgb>0){
    T2.mgb-=dt*11;
    if(Math.random()<.5){
      var a2=T2.tang+rr(-.12,.12);
      eb.push({x:T2.x+Math.cos(T2.tang)*26,y:T2.y+Math.sin(T2.tang)*26,
        vx:Math.cos(a2)*430,vy:Math.sin(a2)*430,dmg:6,life:1.3});
      sfx('enemy',.4);
    }
  }
}
function drawTank(c,T2){
  c.save(); c.translate(T2.x,T2.y);
  c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(2,4,30,22,0,0,6.3); c.fill();
  c.save(); c.rotate(T2.ang);
  c.fillStyle='#3c4436'; rrect(c,-28,-22,56,12,3); c.fill(); outl(c,'#14170f',2.2);   // tracks
  rrect(c,-28,10,56,12,3); c.fill(); outl(c,'#14170f',2.2);
  c.fillStyle='rgba(20,24,16,.7)';
  for(var i=0;i<7;i++){ var tx2=-26+i*8+((T2.track*7)%8);
    c.fillRect(tx2,-21,3.4,10); c.fillRect(tx2,11,3.4,10); }
  c.fillStyle='#59634a'; rrect(c,-26,-13,52,26,4); c.fill();
  c.save(); rrect(c,-26,-13,52,26,4); c.clip(); camoFleck(c,77,-26,-13,52,26,26,EMR); c.restore();
  rrect(c,-26,-13,52,26,4); outl(c,'#14170f',2.4);
  c.fillStyle='#48503c'; rrect(c,16,-9,10,18,2); c.fill();
  c.restore();
  c.save(); c.rotate(T2.tang);
  c.fillStyle='#5f6a4e'; c.beginPath(); c.ellipse(0,0,17,15,0,0,6.3); c.fill();
  c.save(); c.beginPath(); c.ellipse(0,0,17,15,0,0,6.3); c.clip(); camoFleck(c,91,-17,-15,34,30,16,EMR); c.restore();
  c.beginPath(); c.ellipse(0,0,17,15,0,0,6.3); outl(c,'#14170f',2.4);
  c.fillStyle='#4b543e'; rrect(c,10,-4,34,8,2); c.fill(); outl(c,'#14170f',2.2);      // barrel
  c.fillStyle='#3b4231'; rrect(c,40,-5,6,10,2); c.fill(); outl(c,'#14170f',1.8);
  c.fillStyle='#6e7a58'; c.beginPath(); c.arc(-4,0,6.5,0,6.3); c.fill(); outl(c,'#14170f',1.8);
  c.fillStyle='#3b4231'; rrect(c,-14,-13,8,5,1.5); c.fill();
  c.fillStyle='#c0392b'; rrect(c,-2,-14.5,7,3,1); c.fill();
  c.restore();
  if(T2.hurt>0){ c.globalAlpha=Math.min(.6,T2.hurt*4); c.fillStyle='#fff';
    c.beginPath(); c.ellipse(0,0,30,24,0,0,6.3); c.fill(); c.globalAlpha=1; }
  c.restore();
  c.fillStyle='rgba(0,0,0,.65)'; c.fillRect(T2.x-24,T2.y-40,48,6);
  c.fillStyle='#d84a34'; c.fillRect(T2.x-23,T2.y-39,46*(T2.hp/2),4);
  c.fillStyle='#8fa6b2'; c.font='bold 8px Arial'; c.textAlign='center';
  c.fillText('DRONE ONLY',T2.x,T2.y-44); c.textAlign='start';
}
function depotJustBlown(){ return false; }
function blowDepot(D){
  if(D.blown) return;
  D.blown=1;
  var R=430;
  banner('AMMO DEPOT CHAIN REACTION','GET CLEAR',2.6);
  // The central ammunition pile triggers a wide, layered chain reaction.
  explode(D.cx,D.cy,R,85,true);
  for(var bx7=0;bx7<6;bx7++){
    var ba7=bx7/6*6.283+rr(-.18,.18),bd7=rr(28,105);
    explode(D.cx+Math.cos(ba7)*bd7,D.cy+Math.sin(ba7)*bd7*.65,R*rr(.42,.68),55,true);
  }
  fx.push({t:'boom',x:D.cx,y:D.cy,life:1,max:1,r:R*1.25});
  fx.push({t:'ring',x:D.cx,y:D.cy,life:.8,max:.8,c:'#ffb33c'});
  blastWalls(D.cx,D.cy,R*.85,900);
  // nothing within the radius survives
  for(var e=enemies.length-1;e>=0;e--){
    var E7=enemies[e], d7=Math.hypot(E7.x-D.cx,E7.y-D.cy);
    if(d7<R) hurtEnemy(E7,9999,Math.atan2(E7.y-D.cy,E7.x-D.cx),true);
  }
  var pd7=Math.hypot(player.x-D.cx,player.y-D.cy);
  if(!player.dead&&!inBase(player.x,player.y)&&pd7<R)
    hurtPlayer(220*(1-pd7/R)+40);
  for(var dw7=0;dw7<depotWorkers.length;dw7++) if(depotWorkers[dw7].depot===D.i) depotWorkers[dw7].alive=0;
  for(var f=0;f<14&&fires.length<20;f++)
    fires.push({x:D.cx+rr(-90,90),y:D.cy+rr(-70,70),r:rr(16,26),p:rr(0,6),life:80,sp:0});
  for(var d8=0;d8<90;d8++)
    launchPart(D.cx+rr(-40,40),D.cy+rr(-30,30),'debris',null,null,rr(0,6.283),rr(1.4,3));
  for(var p8=0;p8<50&&plume.length<300;p8++)
    plume.push({x:D.cx+rr(-70,70),y:D.cy+rr(-50,50),vx:rr(-70,70),vy:-rr(50,150),
      life:rr(3,6),max:6,s:rr(14,32),hot:1});
  for(var e8=0;e8<60&&embers.length<260;e8++)
    embers.push({x:D.cx+rr(-60,60),y:D.cy+rr(-40,40),vx:rr(-160,160),vy:-rr(90,260),
      life:rr(1.2,3),max:3});
  dustPuff(D.cx,D.cy,26,2.6);
  screenSplat(ri(6,12));
  shake=Math.min(38,shake+36);
  sfx('boom'); sfx('boom',.9); sfx('boom',.7); sfx('boom',.45);
  droneCam={x:D.cx,y:D.cy,t:6.2};
  var left=0; for(var q7=0;q7<depots.length;q7++) if(!depots[q7].blown) left++;
  money+=250; hud();
  setTimeout?0:0;
}
function counterAttack(){
  var extra=7+Math.round(level*1.7);
  for(var i=0;i<extra;i++){
    var r=Math.random();
    queue.push(fieldKind(level));
  }
  spawnQ=queue.length; spawnT=.12;
  if(flag) flag.assault=1;
  sfx('boom',.35); shake=Math.min(14,shake+5);
  banner('COUNTERATTACK','THEY ARE RUSHING THE POLE',2.6);
  hud();
}
function waveSize(w,n){ return w===0 ? 20+Math.floor(n*1.5) : 30+Math.floor(n*2); }
function fieldKind(n){                       // heavies never leave their base
  var r=Math.random();
  if(n>=3&&r<.15) return 'sniper';
  if(r<.42) return 'rusher';
  return 'rifleman';
}
function makeWave(w,n){
  var list=[], total=waveSize(w,n);
  for(var i=0;i<total;i++) list.push(fieldKind(n));
  return list;
}
function trenchWave(w,n){
  var total=(w===0?22:28)+n*2, cmd=(w===0?.2:.4), list=[];
  for(var i=0;i<total;i++) list.push(Math.random()<cmd?'cmd':fieldKind(n));
  return list;
}
function sectorPlan(n){
  var list=[], total=19+Math.floor(n*1.8);
  for(var i=0;i<total;i++){
    var r=Math.random();
    if(n>=3&&r<.18) list.push('sniper');
    else if(n>=2&&r<.34) list.push('rusher');
    else if(n>=4&&r<.44) list.push('heavy');
    else if(r<.62) list.push('rifleman');
    else list.push(Math.random()<.5?'rusher':'rifleman');
  }
  return list;
}
var queue=[];
function doSpawn(){
  if(!queue.length){ spawnQ=0; return; }
  var k=queue.shift(); spawnQ=queue.length;
  var asCmd=(k==='cmd'); if(asCmd) k='heavy';
  var tries=0,s;
  do{ s=pick(SPAWNS); tries++; } while((!validSpawn(s)||Math.hypot(s[0]*TILE-player.x,s[1]*TILE-player.y)<TILE*9)&&tries<30);
  spawnEnemy(k,s[0]*TILE+TILE/2,s[1]*TILE+TILE/2,false,null,asCmd);
  hud();
}
function startSector(n){
  level=n; killed=0; baseCatsDone=0; compoundBossSpawned=0; compoundBossDefeated=0; levelTwoBossSpawned=0; levelTwoBossDefeated=0; oilBossSpawned=0; oilBossDefeated=0; airfieldBossSpawned=0; airfieldBossDefeated=0; seaBossSpawned=0; seaBossDefeated=0;
  document.getElementById('bossVictory').classList.remove('show');
  document.getElementById('levelTwoBossVictory').classList.remove('show');
  document.getElementById('airBossVictory').classList.remove('show');
  document.getElementById('seaBossVictory').classList.remove('show','preview');
  document.getElementById('levelFourBossVictory').classList.remove('show','preview');
  document.getElementById('finalBossVictory').classList.remove('show','preview');
  buildMap();
  player=makePlayer();
  enemies.length=0; bullets.length=0; eb.length=0; fx.length=0; nades.length=0; smoke.length=0;
  chunks.length=0; mist.length=0; splat.length=0; pools.length=0;
  civs.length=0; civT=4; shopCD=0; droneCam=null; respawnT=0; enades.length=0; flames.length=0; wingmen.length=0;
  for(var pz0=0;pz0<padList.length;pz0++) padList[pz0].cd=0;
  setCrewZone();
  if(!crew.length||squadLost===0) buildCrew(); else rebuildCrew();
  drops.length=0; twitchers.length=0; sentries.length=0; strikes.length=0; smokes.length=0; bossBarrels.length=0; bossHammers.length=0; meatShots.length=0; meatBits.length=0; fireBottles.length=0; miniNukes.length=0; drone=null; piloting=false;
  crates.length=0; seedCrates(9+Math.min(6,Math.floor(n/2)));
  wave=0; tank=null; tankSent=0; droneT=rr(30,50); seaCD=0;
  edrones.length=0; emps.length=0;
  for(var bg=0;bg<bases.length&&mapKind!=='sea';bg++){
    var BK=bases[bg];
    edrones.push({x:BK.fx+rr(-30,30),y:BK.fy+rr(-30,30),vx:0,vy:0,hx:BK.fx,hy:BK.fy,
      base:bg,state:'idle',rot:rr(0,6.3),hp:14,mx:14,bob:rr(0,6.3),hurt:0,warn:0});
    spawnEnemy(mapKind==='trench'?'elite':'heavy',BK.fx+rr(-18,18),BK.fy+rr(-18,18),false,BK,true);
    var garrison=(mapKind==='trench'?5:5+Math.min(4,Math.floor(n/2)));
    for(var g=0;g<garrison;g++){
      var k2=(mapKind==='trench')?'elite':((g===0&&n>=2)?'sniper':(g===1?'heavy':'rifleman'));
      var ax=BK.fx+rr(-70,70), ay=BK.fy+rr(-70,70);
      var sp7=freeSpot(Math.max((BK.x0+1.5)*TILE,Math.min((BK.x1-.5)*TILE,ax)),
                       Math.max((BK.y0+1.5)*TILE,Math.min((BK.y1-.5)*TILE,ay)));
      spawnEnemy(k2,sp7.x,sp7.y,true,BK,false);
    }
  }
  for(var dg=0;dg<depots.length;dg++){
    var DG=depots[dg];
    DG.zone={i:100+dg,x0:DG.x0,y0:DG.y0,x1:DG.x1,y1:DG.y1};
    for(var gd=0;gd<3;gd++){
      var gx9=(DG.x0+1+gd)*TILE+TILE/2, gy9=(DG.y0+2)*TILE+TILE/2;
      if(blocksMove(T(Math.floor(gx9/TILE),Math.floor(gy9/TILE)))) continue;
      spawnEnemy(gd===0?'elite':'rifleman',gx9,gy9,true,DG.zone,false);
      var depotGuard=enemies[enemies.length-1];
      depotGuard.depotPatrol=1; depotGuard.patrolT=0;
    }
  }
  if(mapKind==='airfield'){
    // A standing defensive team starts at every plane and remains on that aircraft apron.
    for(var apg=0;apg<aircraft.length;apg++){
      var guardPlane=aircraft[apg];
      for(var gk=0;gk<3;gk++){
        var ga=-.8+gk*.8,gr=75+gk*18;
        var guardSpot=freeSpot(guardPlane.x+Math.cos(ga)*gr,guardPlane.y+Math.sin(ga)*gr+55);
        spawnEnemy(gk===0?'elite':'rifleman',guardSpot.x,guardSpot.y,false,null,false);
        var apronGuard=enemies[enemies.length-1];
        apronGuard.guardAircraft=guardPlane.i;
        apronGuard.home={x0:guardPlane.x/TILE-5,y0:guardPlane.y/TILE-5,x1:guardPlane.x/TILE+9,y1:guardPlane.y/TILE+7,alert:1};
        if(gk===0){ apronGuard.airGuard=1; apronGuard.patrolT=0; }
        else {
          apronGuard.airWorker=1; apronGuard.workDir=1; apronGuard.carry=true;
          apronGuard.workFromX=guardPlane.x-55+gk*20; apronGuard.workFromY=guardPlane.y+34;
          apronGuard.workToX=guardPlane.x+460+(gk-1)*30; apronGuard.workToY=guardPlane.y+260;
          apronGuard.workPause=rr(0,.6);
        }
      }
    }
  }
  if(mapKind==='redSquare'){
    for(var rbg=0;rbg<refineries.length;rbg++){
      var guardedBuilding=refineries[rbg];
      var buildingZone={x0:guardedBuilding.cx/TILE-5,y0:guardedBuilding.cy/TILE-4,x1:guardedBuilding.cx/TILE+5,y1:guardedBuilding.cy/TILE+4,alert:1};
      for(var rgd=0;rgd<6;rgd++){
        var rga=rgd/6*6.283,rgs=freeSpot(guardedBuilding.cx+Math.cos(rga)*155,guardedBuilding.cy+Math.sin(rga)*118);
        spawnEnemy(rgd===0?'elite':(rgd===1?'sniper':(rgd===2?'rusher':'rifleman')),rgs.x,rgs.y,false,buildingZone,false);
        var squareGuard=enemies[enemies.length-1]; squareGuard.redGuard=1; squareGuard.patrolT=rr(0,3);
      }
    }
  }
  queue=(mapKind==='trench')?trenchWave(0,n):((mapKind==='sea'||mapKind==='oil'||mapKind==='airfield'||mapKind==='redSquare')?[]:makeWave(0,n)); spawnQ=queue.length; spawnT=.6;

  // opening wave
  for(var i=0;i<Math.min(5,queue.length);i++) doSpawn();
  buildFlow();
  cam.x=player.x-VW/2; cam.y=player.y-VH/2;
  if(n===1&&player.nades<5) player.nades=5;
  state='play'; hud(); startMusic(mapKind);
  intro=(mapKind==='redSquare')?[{t:0,a:'SECTOR '+n,b:'RED SQUARE · MOSCOW'},
        {t:2.4,a:'RED SQUARE CATHEDRAL AND KREMLIN',b:'TWO PRIMARY OBJECTIVES'},
        {t:4.8,a:'MOTORCADE CHECKS THE STREETS',b:'SECURITY TEAMS DEPLOY AT STOPS'},
        {t:7.2,a:'CLEAR BUILDINGS, CARS AND GUARDS',b:'ALL TARGETS MUST BE REMOVED'}]:(mapKind==='airfield')?[{t:0,a:'SECTOR '+n,b:'THE AIRFIELD'},
        {t:2.4,a:'THREE CARGO PLANES UNLOADING',b:'NORTH KOREAN WEAPONS AND TROOPS'},
        {t:4.8,a:'MOBILE GUARDS AROUND EVERY PLANE',b:'BREAK THE DEFENSIVE PATROLS'},
        {t:7.2,a:'TWO ASSAULT WAVES WILL HIT BASE',b:'DEFEAT BOTH AND CLEAR THE AIRFIELD'}]:(mapKind==='oil')?[{t:0,a:'SECTOR '+n,b:'THE OIL FIELDS'},
        {t:2.4,a:'SIX REFINERIES',b:'BURN THEM ALL'},
        {t:4.8,a:'FLY FROM THE PAD',b:'OVER THE TREES AND THE RIVERS'},
        {t:7.2,a:'SAM SITES ON EVERY PLANT',b:'BREAK WHEN THEY LAUNCH'},
        {t:9.6,a:'THEY ARE SHELLING THE BASE',b:'WORK FAST'}]:(mapKind==='sea')?[{t:0,a:'SECTOR '+n,b:'THE BLACK SEA'},
        {t:2.4,a:'SEVEN SHIPS OFFSHORE',b:'SINK THEM ALL'},
        {t:4.8,a:'AIR AND SEA DRONES',b:'LAUNCH FROM THE SLIPWAY'},
        {t:7.2,a:'TWO LANDING SHIPS INBOUND',b:'STOP THE TROOPS REACHING SHORE'}]:(mapKind==='trench')?[{t:0,a:'SECTOR '+n,b:'THE TRENCHES'},
        {t:2.4,a:'TWO ENEMY BASES',b:'CLEAR AND CAPTURE BOTH'},
        {t:4.8,a:'PRISONERS IN EACH BASE',b:'FREE THEM AND GET THEM HOME'},
        {t:7.2,a:'TWO WEAPONS DEPOTS',b:'BREACH AND DESTROY BOTH'},
        {t:9.6,a:'LAUNCH TRUCK DEPLOYING',b:'PROTECTED FOR 12 SECONDS'}]:[{t:0,a:'SECTOR '+n,b:'OBJECTIVE'},
         {t:2.4,a:'DESTROY THREE BASES',b:'ONE FLAG IN EACH'},
         {t:4.8,a:'LOWER THE ENEMY FLAG',b:'RUN OURS UP IN ITS PLACE'}];
  introT=0;
}
var clearing=false;
function sectorClear(){
  if(clearing) return; clearing=true;
  state='pause'; sfx('clear');
  // Notify parent window (Next.js) that this sector was completed
  try{ window.parent.postMessage({type:'gd:sectorComplete',sector:level},'*'); }catch(e){}
  banner('SECTOR CLEAR','RESUPPLY · SECTOR '+(level+1),2.2);
  setTimeout(function(){
    clearing=false;
    syncGun();
    var keepHp=player.hp, keepAp=player.ap, nd=player.nades, gr=player.guns, gidx=player.gi;
    startSector(level+1);
    player.hp=Math.min(player.mx,keepHp+22); player.ap=keepAp;
    player.guns=gr; player.gi=gidx;
    var cg=gr[gidx]; cg.res+=Math.floor(WEAPONS[cg.id].mag*1.5);
    player.wep=cg.id; player.mag=cg.mag; player.res=cg.res; player.nades=nd+1;
    hud();
  },2300);
}
function gameOver(win,why){
  state='over'; stopMusic();
  var head='K.I.A.', sub='THE HOUSE HOLDS';
  if(win){ head='CLEARED'; sub='THE GROUND IS YOURS'; }
  else if(why==='base'){ head='BASE LOST'; sub='THEY SHELLED IT FLAT'; }
  else { head='SQUAD WIPED OUT'; sub='ALL FIVE DOWN'; }
  document.getElementById('overT').innerHTML = head+'<small>'+sub+'</small>';
  document.getElementById('overStats').innerHTML =
    ((mapKind==='sea'||mapKind==='redSquare')?('Base integrity <b>'+Math.round(Math.max(0,baseHP)/baseMX*100)+'%</b><br>'):'')+
    'Sector reached <b>'+level+'</b><br>Hostiles down <b>'+totalKills+'</b><br>Squad lost <b>'+squadLost+'/5</b><br>Cash lifted <b>$'+money+'</b><br>Time on target <b>'+Math.floor(timeAlive)+'s</b>';
  document.getElementById('over').classList.remove('hide');
}

/* =========================================================================
   HUD
   ========================================================================= */
var hpF=document.getElementById('hpF'), apF=document.getElementById('apF'), flash=document.getElementById('dmgFlash');
function hud(){
  if(!player) return;
  hpF.style.width=Math.max(0,player.hp/player.mx*100)+'%';
  apF.style.width=Math.max(0,player.ap/upgAP*100)+'%';
  document.getElementById('apBar').style.opacity=player.ap>0?1:.25;
  document.getElementById('wname').innerHTML=WEAPONS[player.wep].name+' &nbsp;·&nbsp; <span id="ammo">'+player.mag+' / '+player.res+'</span>';
  document.getElementById('sector').textContent='SECTOR '+level;
  var rem=enemies.length+spawnQ;
  var lbl=rem+(rem===1?' HOSTILE':' HOSTILES');
  var taken=0;
  for(var dq2=0;dq2<flags.length;dq2++) if(flags[dq2].state==='done') taken++;
  if(mapKind==='oil'){
    var rl=0; for(var rq5=0;rq5<refineries.length;rq5++) if(!refineries[rq5].dead) rl++;
    lbl=(refineries.length-rl)+'/'+refineries.length+' REFINERIES DOWN · '+sams.length+' SAM';
  }
  else if(mapKind==='redSquare'){
    var rbLeft=0; for(var rbq=0;rbq<refineries.length;rbq++) if(!refineries[rbq].dead) rbLeft++;
    var mcLeft=0; for(var mcq=0;mcq<motorcade.length;mcq++) if(!motorcade[mcq].dead) mcLeft++;
    var bossState=redBossDefeated?'BOSS DOWN':(redBossSpawned?'FINAL BOSS ACTIVE':'BOSS LOCKED');
    lbl='BUILDINGS '+(refineries.length-rbLeft)+'/'+refineries.length+' · MOTORCADE '+(motorcade.length-mcLeft)+'/'+motorcade.length+' · '+bossState+' · '+enemies.length+' GUARDS';
  }
  else if(mapKind==='airfield'){
    var planesUp=0; for(var ac5=0;ac5<aircraft.length;ac5++) if(!aircraft[ac5].dead) planesUp++;
    lbl=planesUp+' CARGO PLANES · ASSAULTS '+airAssaultWave+'/2 · '+enemies.length+' NK TROOPS';
  }
  else if(mapKind==='sea'){
    var afloat=0; for(var sq5=0;sq5<ships.length;sq5++) if(ships[sq5].hp>0) afloat++;
    lbl=(seaBossSpawned&&!seaBossDefeated?'BOSS ACTIVE · ':'')+afloat+' SHIPS AFLOAT · '+enemies.length+' SHORE TROOPS';
  }
  else if(mapKind==='trench'){
    var dLeft=0, dTot=depots.length;
    for(var dh=0;dh<depots.length;dh++) if(!depots[dh].blown) dLeft++;
    var safe=0; for(var rg=0;rg<rescueGroups.length;rg++) if(rescueGroups[rg].state==='done') safe++;
    lbl='BASES '+taken+'/'+flags.length+' · RESCUES '+safe+'/'+rescueGroups.length+' · DEPOTS '+(dTot-dLeft)+'/'+dTot;
  }
  else lbl='BASES '+taken+'/'+flags.length+' · '+lbl;
  if(tank) lbl=lbl+' + ARMOUR';

  document.getElementById('left').textContent=lbl;
  document.getElementById('cash').textContent='$'+money;
  var sq=document.getElementById('squad');
  if(sq){ var left=(player&&player.dead?0:1)+crew.length;
    sq.textContent='SQUAD '+left+'/5'+(player&&player.dead?' · MAN DOWN':'');
    sq.style.color=left<=1?'#d84a34':(left<=2?'#e2b13c':'#9db35a'); }
  nadeBtn.innerHTML='FRAG<br>×'+player.nades;
  nadeBtn.classList.toggle('dim',player.nades<=0);
}
function setAct(onCrate){
  if(piloting){ actBtn.textContent='BOOM'; actBtn.classList.remove('dim'); return; }
  if(aboard){ actBtn.textContent='FIRE'; actBtn.classList.remove('dim'); return; }
  if(onCrate){ actBtn.textContent='OPEN'; actBtn.classList.remove('dim'); }
  else if(player.reload>0){ actBtn.textContent='RELOAD'; actBtn.classList.add('dim'); }
  else if(player.mag<=0&&player.res<=0){ actBtn.textContent='DRY'; actBtn.classList.add('dim'); }
  else { actBtn.textContent='FIRE'; actBtn.classList.remove('dim'); }
}
var banEl=document.getElementById('banner'), banTo=null;
function banner(a,b,dur){
  banEl.querySelector('b').textContent=a; banEl.querySelector('small').textContent=b||'';
  banEl.classList.add('show'); clearTimeout(banTo);
  banTo=setTimeout(function(){ banEl.classList.remove('show'); },(dur||2)*1000);
}

/* =========================================================================
   DRAWING — characters
   ========================================================================= */
function drawGun(c,id,x,y){
  c.save(); c.translate(x,y); c.lineJoin='round';
  var body='#33322c', metal='#5a5a52', wood='#6d4f2e';
  if(id==='flamer'){
    c.fillStyle=body; rrect(c,-6,-3,20,6,2); c.fill(); outl(c,'#16150f',1.8);
    c.fillStyle=metal; rrect(c,12,-2.2,10,4.4,2); c.fill(); outl(c,'#16150f',1.5);
    c.fillStyle='#5a6a4a'; rrect(c,-10,-4.5,7,9,2.5); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle='#ffb03c'; c.beginPath(); c.arc(22.5,0,2.1,0,6.3); c.fill();
    c.fillStyle=metal; rrect(c,0,2,4,7,1.5); c.fill();
  }
  else if(id==='pistol'){ c.fillStyle=body; rrect(c,0,-2.5,13,5,1.5); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=metal; rrect(c,-3,-1.5,5,7,1); c.fill(); outl(c,'#16150f',1.4); }
  else if(id==='smg'){ c.fillStyle=body; rrect(c,-2,-2.5,20,5,1.5); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=metal; rrect(c,2,1,4,9,1); c.fill(); outl(c,'#16150f',1.4); }
  else if(id==='rifle'){ c.fillStyle=wood; rrect(c,-6,-2.5,10,5,1.5); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=body; rrect(c,2,-2,24,4,1.2); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=metal; c.save(); c.translate(6,3); c.rotate(.35); rrect(c,-2,0,5,11,1.5); c.fill(); outl(c,'#16150f',1.4); c.restore(); }
  else if(id==='shotgun'){ c.fillStyle=wood; rrect(c,-7,-3,12,6,2); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=body; rrect(c,3,-3,23,6,2); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=metal; rrect(c,10,-1.6,12,3.2,1.2); c.fill(); }
  else if(id==='dmr'){ c.fillStyle=wood; rrect(c,-8,-2.5,12,5,1.5); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=body; rrect(c,2,-1.8,30,3.6,1.2); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle=metal; rrect(c,3,-6,11,3.5,1.2); c.fill(); outl(c,'#16150f',1.4); }
  else if(id==='lmg'){ c.fillStyle=body; rrect(c,-8,-3.5,34,7,2); c.fill(); outl(c,'#16150f',1.8);
    c.fillStyle=metal; rrect(c,0,2,12,10,2); c.fill(); outl(c,'#16150f',1.6);
    c.fillStyle='#7a7a6e'; rrect(c,18,-1.4,12,2.8,1); c.fill(); }
  c.restore();
}
var SKIN='#d9a97c', SKIN2='#c3925f';
var EMR=['#3f4634','#717552','#8d8260','#2b3125'];   // enemy digital flora
var MC =['#8a7f57','#57603c','#9d8b62','#3c4230'];   // player multi-terrain
var PKITS=[
  {id:'woodland',n:'WOODLAND',col:'#6e6a4b',band:'#2f6fd0',rig:'#6d6647',
   pal:['#8a7f57','#57603c','#9d8b62','#3c4230'],mask:0,gog:0,scarf:0,shades:1},
  {id:'urban',   n:'URBAN',   col:'#7b7f82',band:'#2f6fd0',rig:'#4a4f52',
   pal:['#9aa0a3','#5e6468','#c2c6c8','#3a3f42'],mask:1,gog:1,scarf:0},
  {id:'ranger',  n:'RANGER',  col:'#4f5f45',band:'#2f6fd0',rig:'#8a7350',
   pal:['#4f5f45','#4f5f45','#57684c','#4a5941'],mask:0,gog:0,scarf:1},
  {id:'desert',  n:'DESERT',  col:'#9b8a63',band:'#2f6fd0',rig:'#7d6a44',
   pal:['#b3a179','#8a7a55','#c6b territory','#6e6247'],mask:1,gog:0,scarf:1},
  {id:'night',   n:'NIGHT',   col:'#3a3d42',band:'#3f8fe0',rig:'#25282c',
   pal:['#44484e','#2e3136','#53585f','#1f2226'],mask:1,gog:1,scarf:0}
];
PKITS[3].pal=['#b3a179','#8a7a55','#c6b389','#6e6247'];
var kitIdx=0, PK=PKITS[0];
function hs(n){ var v=Math.sin(n*127.1)*43758.5453; return v-Math.floor(v); }
function camoFleck(c,seed,x0,y0,w,h,n,pal){
  pal=pal||EMR;
  for(var i=0;i<n;i++){
    c.fillStyle=pal[Math.floor(hs(seed+i*11.3)*4)];
    c.fillRect(x0+hs(seed+i*1.7)*w, y0+hs(seed+i*3.9)*h,
               1.4+hs(seed+i*5.1)*2.8, 1.4+hs(seed+i*2.3)*2.4);
  }
}
/* Upright 3/4 unit: board is overhead, figures stand up and face the camera-ish.
   Feet sit at (x,y); everything else is built upward from there. */
function drawUnit(c,x,y,ang,col,band,walk,amt,kind,gun,dark,noHead,rus,seed,recoil){
  seed=seed||7;
  recoil=recoil||0;
  var PAL=rus?EMR:PK.pal;
  var mir = Math.cos(ang)<0 ? -1 : 1;
  var facing = Math.sin(ang);
  var front = facing > -0.30, back = facing < -0.55;
  var bulk = kind==='elite'?1.3:(kind==='heavy'?1.16:(kind==='rusher'?.9:1));
  var ph=walk, sA=Math.sin(ph)*.98*amt, sB=Math.sin(ph+Math.PI)*.98*amt;
  var bob=-Math.abs(Math.sin(ph*2))*.85*amt, lean=Math.sin(ph)*amt*.022;
  var gAng=Math.atan2(Math.sin(ang)*.5,Math.cos(ang));
  var kick=recoil*5.5;
  var sx=mir*3, sy=-22+bob, hx=Math.cos(gAng)*(12.5-kick), hy=-20+Math.sin(gAng)*(7.5-kick*.55)+bob;
  var gripX=hx-Math.cos(gAng)*5.5, gripY=hy-Math.sin(gAng)*3.2;

  c.save(); c.translate(x,y); c.scale(bulk,bulk);
  if(!dark){ c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(0,1,11.5,5,0,0,6.3); c.fill(); }

  c.save(); c.scale(mir,1); c.rotate(lean*Math.sin(ph));

  // ---- legs (back first)
  leg(c,-3.2,sB,col,.55,seed+3,PAL);
  leg(c, 3.2,sA,col,.68,seed+9,PAL);

  c.translate(0,bob);

  // ---- torso
  c.fillStyle=col; rrect(c,-7.6,-25,15.2,14.5,5); c.fill();
  c.save(); rrect(c,-7.6,-25,15.2,14.5,5); c.clip(); camoFleck(c,seed,-8,-25.5,15,14,15,PAL); c.restore();
  rrect(c,-7.6,-25,15.2,14.5,5); outl(c,'#15130e',2);
  if(rus){
    var blackOps=col==='#171a1d'||col==='#252a31';
    c.fillStyle=blackOps?'#20252a':'#a8955f'; rrect(c,-5.6,-23.4,11.2,11,3); c.fill(); outl(c,'#15130e',1.4);   // tactical rig
    c.fillStyle=blackOps?'#111519':'#8b7a4c'; rrect(c,-4.4,-22.4,3.6,4.4,1.2); c.fill(); rrect(c,-.2,-22.4,3.6,4.4,1.2); c.fill();
    c.fillStyle=blackOps?'#2b3035':'#7a6b42'; rrect(c,-4.4,-16.8,7.8,3,1); c.fill();
    if(kind==='rusher'){ // telnyashka showing at the collar
      c.fillStyle='#e6eaf0'; rrect(c,-3,-25.6,7,3.4,1.2); c.fill();
      c.fillStyle='#4f7fb5'; c.fillRect(-3,-25,7,.9); c.fillRect(-3,-23.6,7,.9);
      outl(c,'#15130e',1);
    }
    c.fillStyle='#e8e6e0'; c.fillRect(-8.2,-22.6,3.4,1.5);   // national patch
    c.fillStyle='#3a5fa0'; c.fillRect(-8.2,-21.1,3.4,1.5);
    c.fillStyle='#b2312a'; c.fillRect(-8.2,-19.6,3.4,1.5);
    c.fillStyle=band; rrect(c,-8.4,-16.4,3.6,4,1.4); c.fill(); outl(c,'#15130e',1);  // ID armband
  } else {
    c.fillStyle=PK.rig; rrect(c,-5.6,-23.4,11.2,11,3); c.fill(); outl(c,'#15130e',1.4);      // plate carrier
    c.fillStyle=shade(PK.rig,.8); rrect(c,-4.4,-22.4,3.6,4.4,1.2); c.fill(); rrect(c,-.2,-22.4,3.6,4.4,1.2); c.fill();
    c.fillStyle=shade(PK.rig,.68); rrect(c,-4.4,-16.8,7.8,3,1); c.fill();
    if(PK.scarf){ c.fillStyle=shade(col,.72); rrect(c,-4,-26,9,3.6,1.4); c.fill(); outl(c,'#15130e',1); }
    c.fillStyle=band; rrect(c,-8.4,-22.6,3.6,5,1.4); c.fill(); outl(c,'#15130e',1);            // armband
    c.fillStyle='rgba(255,255,255,.55)'; c.fillRect(-8.4,-20.8,3.6,1);
    // MOLLE webbing and buckles give the player carrier more readable detail.
    c.strokeStyle='rgba(28,25,18,.55)'; c.lineWidth=.75;
    for(var mw=0;mw<3;mw++){ c.beginPath(); c.moveTo(-4.4,-20.8+mw*2.5); c.lineTo(3.4,-20.8+mw*2.5); c.stroke(); }
    c.fillStyle='#b9aa79'; c.fillRect(-1,-16.6,2,1.4);
  }
  c.fillStyle=shade(col,.6); rrect(c,-9.5,-23,3,9,2); c.fill(); outl(c,'#15130e',1.4); // pack strap

  // ---- head
  if(noHead){
    c.fillStyle='rgba(126,16,12,.95)'; c.beginPath(); c.arc(1.2,-26,4.2,0,6.3); c.fill();
    c.restore(); c.restore(); return;
  }
  c.fillStyle=rus?(mapKind==='airfield'?'#6f4937':'#31352e'):(PK.mask?'#31352e':SKIN); c.beginPath(); c.arc(1.2,-31.5,7.2,0,6.3); c.fill(); outl(c,'#15130e',1.9);
  c.fillStyle= rus?shade(col,1.02):shade(col,1.1);
  c.beginPath(); c.arc(1.2,-32.5,8,Math.PI,0); c.lineTo(9.2,-30.4); c.lineTo(-6.8,-30.4); c.closePath();
  c.fill();
  c.save(); c.beginPath(); c.arc(1.2,-32.5,8,Math.PI,0); c.lineTo(9.2,-30.4); c.lineTo(-6.8,-30.4);
  c.closePath(); c.clip(); camoFleck(c,seed+40,-7,-40,16,10,10,PAL); c.restore();
  c.beginPath(); c.arc(1.2,-32.5,8,Math.PI,0); c.lineTo(9.2,-30.4); c.lineTo(-6.8,-30.4); c.closePath();
  outl(c,'#15130e',1.9);
  c.strokeStyle='rgba(20,18,13,.7)'; c.lineWidth=1;
  c.beginPath(); c.arc(1.2,-32,6.2,Math.PI*.08,Math.PI*.92); c.stroke();
  c.fillStyle='#292d27'; rrect(c,5.5,-36,3.2,2.1,.7); c.fill(); // helmet rail block
  if(!rus&&PK.gog){ c.fillStyle='rgba(40,52,58,.7)'; rrect(c,-5.4,-35.6,10,3,1.2); c.fill(); outl(c,'#15130e',1.1); }
  c.fillStyle=shade(col,.9); rrect(c,3.4,-31.6,6.6,2.6,1.2); c.fill(); outl(c,'#15130e',1.2); // brim
  if(rus){ c.fillStyle=shade(col,.72); rrect(c,-6.4,-33.4,3,2.2,.8); c.fill(); }              // helmet rail
  if(!rus&&PK.beard&&!back){                                    // full beard
    c.fillStyle=PK.beard;
    c.beginPath();
    c.moveTo(-5.6,-31.4);
    c.quadraticCurveTo(-7.2,-25.4,-2.6,-21.6);
    c.quadraticCurveTo(1.4,-18.8,5.2,-21.8);
    c.quadraticCurveTo(8.6,-25.6,7.8,-31.6);
    c.quadraticCurveTo(1.2,-28.4,-5.6,-31.4);
    c.closePath(); c.fill(); outl(c,'#15130e',1.6);
    c.fillStyle=shade(PK.beard,.78);
    c.beginPath(); c.moveTo(-3.4,-26.6); c.quadraticCurveTo(1.2,-24.2,5.4,-26.4);
    c.quadraticCurveTo(1.4,-22.4,-3.4,-26.6); c.closePath(); c.fill();
  }
  if(!back){
    if(rus&&kind==='heavy'){ c.fillStyle='rgba(40,52,58,.85)'; rrect(c,-4.6,-30.4,11,5,1.6); c.fill(); outl(c,'#15130e',1.2); }
    else if(rus||PK.mask){ c.fillStyle=SKIN; rrect(c,-3.6,-30.2,9.4,3.1,1.3); c.fill(); }      // balaclava eye slit
    if(!rus&&PK.shades){                                        // sunglasses
      c.fillStyle='#15130e'; rrect(c,-5.2,-31.1,11.4,4,1.5); c.fill();
      c.fillStyle='rgba(126,196,224,.4)';
      rrect(c,-4.4,-30.6,4.6,2.7,1); c.fill(); rrect(c,1.4,-30.6,4.6,2.7,1); c.fill();
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(-3.8,-30.4,1.6,.9); c.fillRect(2,-30.4,1.6,.9);
      c.strokeStyle='#0c0a07'; c.lineWidth=1.2; rrect(c,-5.2,-31.1,11.4,4,1.5); c.stroke();
    } else {
      c.fillStyle='#15130e';
      if(front){ c.beginPath(); c.arc(-1.4,-28.9,1.1,0,6.3); c.fill(); }
      c.beginPath(); c.arc(3.6,-28.9,1.1,0,6.3); c.fill();
    }
  } else {
    c.strokeStyle='rgba(20,17,12,.45)'; c.lineWidth=1.3;
    c.beginPath(); c.moveTo(-4.5,-29.5); c.lineTo(6.5,-29.5); c.stroke();
  }
  if(kind==='sniper'){ c.fillStyle='rgba(60,150,190,.85)'; rrect(c,-3,-30.6,9,3,1.2); c.fill(); outl(c,'#15130e',1.2); }
  if(kind==='rusher'){ c.fillStyle=shade(band,.9); rrect(c,-4,-26.5,10,3,1.4); c.fill(); }
  c.restore();

  // Arms, weapon, and hands are only drawn when facing the player.
  // When back-facing (moving north) they would incorrectly appear in front of the body.
  if(!back){
    // ---- support arm reaches across the chest to the weapon's front grip
    // Drawn here (above the torso) so the second arm cannot disappear behind the body.
    var ssx=-4.2, ssy=-22.2+bob, sax=gripX-ssx, say=gripY-ssy, sal=Math.hypot(sax,say);
    c.save(); c.translate(ssx,ssy); c.rotate(Math.atan2(say,sax));
    c.fillStyle=shade(col,.76); rrect(c,-1,-2.6,sal+1.2,5.2,2.6); c.fill(); outl(c,'#15130e',1.5);
    c.fillStyle=rus?band:PK.band; rrect(c,1,-2.8,3.4,5.6,1); c.fill(); outl(c,'#15130e',.9);
    c.restore();

    // Weapon sling runs from the shoulder to the forward weapon mount.
    c.strokeStyle='rgba(35,30,20,.72)'; c.lineWidth=1.25;
    c.beginPath(); c.moveTo(-4.8,-24+bob); c.quadraticCurveTo(0,-15+bob,gripX,gripY+2); c.stroke();

    // ---- gun arm + weapon, aimed in screen space (vertical foreshortened)
    var ax=hx-sx, ay=hy-sy, al=Math.hypot(ax,ay);
    c.save(); c.translate(sx,sy); c.rotate(Math.atan2(ay,ax));
    c.fillStyle=shade(col,.9); rrect(c,-1,-2.7,al+2,5.4,2.7); c.fill(); outl(c,'#15130e',1.5);
    c.restore();
    c.save(); c.translate(hx,hy); c.rotate(gAng); c.scale(.92,.92);
    drawGun(c,gun,0,0);
    // Trigger hand is drawn over the weapon so it remains readable.
    c.fillStyle=SKIN2; c.beginPath(); c.arc(0,1.5,2.8,0,6.3); c.fill(); outl(c,'#15130e',1.4);
    c.restore();

    // Support hand on the foregrip, also above the weapon: both hands stay visible.
    c.fillStyle=SKIN2; c.beginPath(); c.arc(gripX,gripY,2.75,0,6.3); c.fill(); outl(c,'#15130e',1.4);
    // Small glove cuffs help separate both hands from the sleeves and gun.
    c.strokeStyle='#34382f'; c.lineWidth=1.35;
    c.beginPath(); c.arc(gripX,gripY,3.1,.15,2.7); c.stroke();
  }

  c.restore();
}
function leg(c,ox,a,col,f,seed,pal){
  // Wider forward/back swing. The downward correction keeps the boot planted
  // as the leg rotates, avoiding the appearance that the unit is hovering.
  var rot=a*.62, plant=(1-Math.cos(rot))*12;
  c.save(); c.translate(ox+a*1.25,-12.5+plant); c.rotate(rot);
  c.fillStyle=shade(col,f); rrect(c,-3.1,-1,6.2,12,3); c.fill();
  c.save(); rrect(c,-3.1,-1,6.2,12,3); c.clip(); camoFleck(c,seed||5,-3.4,-1.5,6,12,7,pal); c.restore();
  rrect(c,-3.1,-1,6.2,12,3); outl(c,'#15130e',1.6);
  c.fillStyle='#3c4034'; rrect(c,-3.2,3.2,6.4,3.6,1.4); c.fill(); outl(c,'#15130e',1.1);
  // Counter-rotate the boot so its sole stays nearly parallel to the ground.
  c.save(); c.translate(a*1.4,0); c.rotate(-rot*.82);
  c.fillStyle=shade(col,.36); rrect(c,-3.8,9.5,8,4.6,2); c.fill(); outl(c,'#15130e',1.5);
  c.strokeStyle='#171914'; c.lineWidth=.8;
  c.beginPath(); c.moveTo(-2.4,11); c.lineTo(2.5,11); c.moveTo(-2.2,12.4); c.lineTo(2.7,12.4); c.stroke();
  c.fillStyle='#171914'; c.fillRect(-3.4,13.2,7.4,1.15); // grounded boot sole
  c.restore();
  c.restore();
}
function gunFor(kind){
  return kind==='elite'?'lmg':(kind==='heavy'?'shotgun':(kind==='sniper'?'dmr':(kind==='rusher'?'smg':(kind==='rifleman'?'rifle':(kind||'pistol')))));
}
function scorch(c,x,y,r){
  var n=16, pts=[], s1=rr(0,6.28), s2=rr(0,6.28), s3=rr(0,6.28);
  for(var i=0;i<n;i++){
    var a=i/n*6.283;
    var k=1+Math.sin(a*3+s1)*.26+Math.sin(a*5+s2)*.16+Math.sin(a*2+s3)*.12+rr(-.1,.1);
    pts.push({x:x+Math.cos(a)*r*k, y:y+Math.sin(a)*r*k*.76});
  }
  function blot(alpha,scale){
    c.fillStyle='rgba(16,12,8,'+alpha+')';
    c.beginPath();
    var m0={x:x+(pts[0].x-x)*scale,y:y+(pts[0].y-y)*scale};
    c.moveTo(m0.x,m0.y);
    for(var i2=0;i2<n;i2++){
      var p1=pts[i2], p2=pts[(i2+1)%n];
      var q1={x:x+(p1.x-x)*scale,y:y+(p1.y-y)*scale};
      var q2={x:x+(p2.x-x)*scale,y:y+(p2.y-y)*scale};
      c.quadraticCurveTo(q1.x,q1.y,(q1.x+q2.x)/2,(q1.y+q2.y)/2);
    }
    c.closePath(); c.fill();
  }
  blot(.34,1); blot(.3,.62); blot(.28,.3);
  for(var t=0;t<ri(5,9);t++){                     // tongues thrown out of the blast
    var a2=rr(0,6.28), len=r*rr(.95,1.85), w=r*rr(.08,.2);
    c.save(); c.translate(x,y); c.scale(1,.76); c.rotate(a2);
    c.fillStyle='rgba(18,14,9,'+rr(.16,.38)+')';
    c.beginPath(); c.moveTo(0,-w);
    c.quadraticCurveTo(len*.55,-w*.55,len,rr(-2,2));
    c.quadraticCurveTo(len*.55,w*.55,0,w);
    c.closePath(); c.fill(); c.restore();
  }
  for(var sp=0;sp<20;sp++){                       // spatter at the fringe
    var a3=rr(0,6.28), d3=r*rr(.6,1.9);
    c.fillStyle='rgba(20,16,10,'+rr(.1,.34)+')';
    c.save(); c.translate(x+Math.cos(a3)*d3,y+Math.sin(a3)*d3*.76); c.rotate(a3);
    c.beginPath(); c.ellipse(0,0,rr(1.5,r*.16),rr(1,r*.09),0,0,6.3); c.fill(); c.restore();
  }
}
function bloodPool(x,y,r){
  if(onWall(x,y)) return;
  for(var i=0;i<3;i++){
    bc.fillStyle='rgba('+ri(78,104)+',12,9,'+rr(.28,.5)+')';
    bc.beginPath(); bc.ellipse(x+rr(-5,5),y+rr(-4,4),r*rr(.6,1.1),r*rr(.45,.8),rr(0,3),0,6.3); bc.fill();
  }
  for(var j=0;j<7;j++){
    bc.fillStyle='rgba('+ri(100,140)+',16,11,'+rr(.3,.6)+')';
    bc.beginPath(); bc.arc(x+rr(-r,r),y+rr(-r*.7,r*.7),rr(2,5),0,6.3); bc.fill();
  }
}
function bloodSpray(x,y,ang,len,n){
  for(var i=0;i<n;i++){
    var t=Math.random(), a=ang+rr(-.42,.42)*(.35+t), d=t*len, rd=rr(1.1,4.2)*(1.15-t*.6);
    var bx2=x+Math.cos(a)*d, by2=y+Math.sin(a)*d*.62;
    if(onWall(bx2,by2)){ if(Math.random()<.2) dustPuff(bx2,by2,1,.7); continue; }
    bc.fillStyle='rgba('+ri(96,146)+',15,10,'+rr(.22,.66)+')';
    bc.save(); bc.translate(bx2,by2); bc.rotate(a);
    bc.beginPath(); bc.ellipse(0,0,rd*rr(1.2,2.6),rd,0,0,6.3); bc.fill(); bc.restore();
  }
}
function stump(c){ c.fillStyle='rgba(122,16,12,.92)'; }
function onWall(x,y){ return blocksShot(T(Math.floor(x/TILE),Math.floor(y/TILE))); }
function dustPuff(x,y,n,pw){
  pw=pw||1;
  for(var i=0;i<n&&plume.length<176;i++)
    plume.push({x:x+rr(-5,5),y:y+rr(-5,5),vx:rr(-46,46)*pw,vy:rr(-46,46)*pw-rr(2,22),
      life:rr(.45,1.5),max:1.5,s:rr(2.5,8)*pw,hot:0,dust:1});
}
/* anything thrown at a wall knocks powder and grit off it */
function wallHit(x,y,ang,len,pw){
  pw=pw||1;
  for(var st=6;st<len;st+=7){
    var wx=x+Math.cos(ang)*st, wy=y+Math.sin(ang)*st*.7;
    if(!onWall(wx,wy)) continue;
    dc.fillStyle='rgba(214,206,188,'+rr(.12,.3)+')';
    dc.beginPath(); dc.ellipse(wx,wy,rr(6,15)*pw,rr(5,12)*pw,rr(0,3),0,6.3); dc.fill();
    dc.fillStyle='rgba(46,40,32,'+rr(.14,.34)+')';
    dc.beginPath(); dc.ellipse(wx,wy,rr(4,9)*pw,rr(3,7)*pw,rr(0,3),0,6.3); dc.fill();
    for(var g=0;g<7;g++){
      dc.fillStyle='rgba('+ri(150,196)+','+ri(142,186)+','+ri(126,166)+','+rr(.16,.45)+')';
      dc.beginPath(); dc.arc(wx+rr(-17,17),wy+rr(-14,14),rr(.8,2.6),0,6.3); dc.fill();
    }
    dustPuff(wx,wy,ri(2,5)*(pw>1?2:1),pw);
    return true;
  }
  return false;
}
function mistBurst(x,y,ang,n,pw){
  for(var i=0;i<n&&mist.length<170;i++){
    var a=(ang||rr(0,6.3))+rr(-.8,.8), sp=rr(20,110)*(pw||1);
    mist.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6-rr(4,26),life:rr(.3,.9),max:.9,s:rr(1.2,4.2)*(pw||1)});
  }
}
function screenSplat(n){
  for(var i=0;i<n&&splat.length<28;i++)
    splat.push({x:rr(0,VW),y:rr(0,VH),r:rr(5,26),life:rr(6,11),max:11,rot:rr(0,6.3),drip:rr(6,30)});
}
var GRAV=560;
function drawPart(c,p){
  switch(p.k){
    case 'torso':   gibTorso(c,p.col,p.band,p.head); break;
    case 'legs':    gibLegs(c,p.col); break;
    case 'arm':     gibArm(c,p.col); break;
    case 'hand':    gibHand(c); break;
    case 'boot':    gibBoot(c,p.col); break;
    case 'ribs':    gibRibs(c); break;
    case 'spine':   gibSpine(c); break;
    case 'jaw':     gibJaw(c); break;
    case 'viscera': gibViscera(c); break;
    case 'skull':   gibSkull(c); break;
    case 'helmet':  gibHelmet(c,p.col); break;
    case 'head':    gibHead(c,p.col); break;
    case 'debris':
      c.fillStyle=(p.s>3?'rgba(150,76,54,.95)':'rgba(172,163,146,.95)');
      rrect(c,-p.s*1.1,-p.s*.7,p.s*2.2,p.s*1.4,1.4); c.fill(); outl(c,'#2a251c',1.2);
      c.fillStyle='rgba(255,255,255,.14)'; c.fillRect(-p.s*.9,-p.s*.55,p.s*1.8,p.s*.4);
      break;
    default:
      c.fillStyle='rgba(138,20,14,.94)';
      c.beginPath(); c.ellipse(0,0,p.s*1.35,p.s*.8,0,0,6.3); c.fill();
      c.fillStyle='rgba(184,58,42,.6)';
      c.beginPath(); c.ellipse(-p.s*.3,-p.s*.22,p.s*.45,p.s*.26,0,0,6.3); c.fill();
      c.strokeStyle='rgba(70,8,6,.7)'; c.lineWidth=1; c.stroke();
  }
}
var MINOR={meat:1,debris:1};
function launchPart(x,y,k,col,band,ang,pw,head){
  if(chunks.length>230) return;
  if(chunks.length>140&&MINOR[k]) return;   // only filler is ever skipped
  var a=(ang||rr(0,6.3))+rr(-1.0,1.0), sp=rr(50,210)*pw;
  chunks.push({x:x,y:y,z:rr(16,30),k:k,col:col,band:band,head:head,
    vx:Math.cos(a)*sp, vy:Math.sin(a)*sp*.62, vz:rr(230,540)*pw,
    rot:rr(0,6.3), spin:rr(-16,16), tilt:rr(-13,13), sq:0, s:rr(1.8,4.6), bounce:0, life:9});
}
var TWITCHY={arm:1,legs:1,hand:1,torso:1,boot:1,viscera:1,ribs:1,spine:1};
function landPart(p){
  if(TWITCHY[p.k]&&twitchers.length<22&&Math.random()<.6){
    var fs3=freeSpot(p.x,p.y);
    twitchers.push({x:fs3.x,y:fs3.y,z:0,vz:0,k:p.k,col:p.col,band:p.band,head:p.head,s:p.s,
      rot:p.rot,spin:0,next:rr(.25,1.3),jerk:0,count:ri(4,12),life:rr(22,40)});
    bloodSpray(fs3.x,fs3.y,rr(0,6.3),rr(10,26),6);
  } else bakePart(p);
}
function freeSpot(x,y){
  x=Math.max(10,Math.min(WW-10,x)); y=Math.max(10,Math.min(WH-10,y));
  if(!onWall(x,y)) return {x:x,y:y,moved:false};
  for(var rad=9;rad<=80;rad+=9){
    for(var i=0;i<12;i++){
      var a=(i/12)*6.283+rr(-.2,.2), nx=x+Math.cos(a)*rad, ny=y+Math.sin(a)*rad;
      if(nx<10||ny<10||nx>WW-10||ny>WH-10) continue;
      if(!onWall(nx,ny)) return {x:nx,y:ny,moved:true};
    }
  }
  return {x:x,y:y,moved:false};
}
function bakePart(p){
  var fs2=freeSpot(p.x,p.y);
  if(fs2.moved){ dustPuff(p.x,p.y,2,.7); p.x=fs2.x; p.y=fs2.y; }
  else { p.x=fs2.x; p.y=fs2.y; }
  dc.save(); dc.translate(p.x,p.y); dc.scale(1,.6); dc.rotate(p.rot);
  dc.globalAlpha=.94; drawPart(dc,p); dc.restore(); dc.globalAlpha=1;
  if(p.k==='debris') return;
  bloodSpray(p.x,p.y,rr(0,6.3),rr(12,34),8);
  if(p.k!=='meat') bloodPool(p.x,p.y,rr(6,15));
}
function addPool(x,y,mx){ if(pools.length<22) pools.push({x:x,y:y,r:2,max:mx,t:0}); }
function gibSkull(c){
  c.fillStyle='#ded4c0'; c.beginPath(); c.arc(0,-1,5.6,0,6.3); c.fill();
  rrect(c,-3.4,2.6,6.8,5,2); c.fill(); outl(c,'#15130e',1.6);
  c.fillStyle='#15130e'; c.beginPath(); c.arc(-2,-1.4,1.5,0,6.3); c.fill(); c.beginPath(); c.arc(2.2,-1.4,1.5,0,6.3); c.fill();
  c.fillStyle='rgba(122,16,12,.8)'; c.beginPath(); c.arc(0,5,3,0,6.3); c.fill();
}
function gibRibs(c){
  c.fillStyle='rgba(214,204,182,.9)';
  for(var i=0;i<4;i++){ c.beginPath(); c.ellipse(0,-4+i*3.4,5.4-i*.5,1.5,0,0,6.3); c.fill(); }
  c.fillStyle='rgba(122,16,12,.85)'; rrect(c,-1.6,-7,3.2,15,1.4); c.fill();
  outl(c,'#15130e',1);
}
function gibViscera(c){
  c.fillStyle='rgba(146,34,26,.92)';
  c.beginPath();
  for(var i=0;i<9;i++){ var a=i/9*6.3, rr2=5+Math.sin(i*2.2)*3;
    c.arc(Math.cos(a)*rr2,Math.sin(a)*rr2*.7,rr(2.5,4.4),0,6.3); }
  c.fill(); outl(c,'#5c0d09',1.4);
  c.fillStyle='rgba(196,84,66,.5)'; c.beginPath(); c.arc(-2,-1,2.4,0,6.3); c.fill();
}
function gibHand(c){
  c.fillStyle=SKIN2; rrect(c,-2.4,0,4.8,5.4,2); c.fill();
  for(var i=0;i<4;i++){ c.beginPath(); c.ellipse(-2+i*1.4,-1.2,.9,2.4,rr(-.3,.3),0,6.3); c.fill(); }
  outl(c,'#15130e',1.2);
  c.fillStyle='rgba(122,16,12,.9)'; c.beginPath(); c.arc(0,5.4,2.2,0,6.3); c.fill();
}
function gibBoot(c,col){
  c.fillStyle=shade(col,.36); rrect(c,-4,-2.4,9,5,2.2); c.fill(); outl(c,'#15130e',1.5);
  c.fillStyle=shade(col,.6); rrect(c,-5.6,-2,3,4.4,1.6); c.fill(); outl(c,'#15130e',1.3);
  c.fillStyle='rgba(122,16,12,.9)'; c.beginPath(); c.arc(-5.6,0,2.2,0,6.3); c.fill();
}
function gibTorso(c,col,band,head){
  var sd=ri(0,9000);
  c.fillStyle=col; rrect(c,-7.6,-8,15.2,15,5); c.fill();
  c.save(); rrect(c,-7.6,-8,15.2,15,5); c.clip(); camoFleck(c,sd,-8,-8.5,15,15,14); c.restore();
  rrect(c,-7.6,-8,15.2,15,5); outl(c,'#15130e',2);
  c.fillStyle='#a8955f'; rrect(c,-5.6,-6.4,11.2,11,3); c.fill(); outl(c,'#15130e',1.4);
  c.fillStyle='#8b7a4c'; rrect(c,-4.4,-5.4,3.6,4.4,1.2); c.fill(); rrect(c,-.2,-5.4,3.6,4.4,1.2); c.fill();
  c.fillStyle='#e8e6e0'; c.fillRect(-8.2,-5.6,3.4,1.5);
  c.fillStyle='#3a5fa0'; c.fillRect(-8.2,-4.1,3.4,1.5);
  c.fillStyle='#b2312a'; c.fillRect(-8.2,-2.6,3.4,1.5);
  c.fillStyle=band; rrect(c,-8,1,3.2,4.5,1.4); c.fill();
  stump(c); rrect(c,-6.5,5.6,13,4.5,2); c.fill(); outl(c,'#15130e',1.2);
  if(head){
    c.fillStyle=SKIN; c.beginPath(); c.arc(0,-14,6.6,0,6.3); c.fill(); outl(c,'#15130e',1.8);
    c.fillStyle='#31352e'; c.beginPath(); c.arc(0,-14,6.6,0,6.3); c.fill();
    c.fillStyle=shade(col,1.02); c.beginPath(); c.arc(0,-14.8,7.2,Math.PI,0);
    c.lineTo(7.2,-13); c.lineTo(-7.2,-13); c.closePath(); c.fill(); outl(c,'#15130e',1.8);
  } else { stump(c); c.beginPath(); c.arc(0,-8,3.6,0,6.3); c.fill(); }
}
function gibLegs(c,col){
  stump(c); rrect(c,-7,-16,14,5,2); c.fill(); outl(c,'#15130e',1.2);
  leg(c,-3.2,rr(.1,.7),col,.55,ri(0,9000),EMR); leg(c,3.4,rr(-.7,-.1),col,.68,ri(0,9000),EMR);
}
function gibArm(c,col){
  c.save(); c.rotate(rr(-.4,.4));
  c.fillStyle=shade(col,.8); rrect(c,-2.7,-1,5.4,11,2.7); c.fill(); outl(c,'#15130e',1.5);
  c.fillStyle=SKIN2; c.beginPath(); c.arc(0,10.5,2.7,0,6.3); c.fill(); outl(c,'#15130e',1.4);
  stump(c); c.beginPath(); c.arc(0,-1,2.7,0,6.3); c.fill();
  c.restore();
}
function gibHead(c,col){
  c.fillStyle='#31352e'; c.beginPath(); c.arc(0,0,6.2,0,6.3); c.fill(); outl(c,'#15130e',1.7);
  c.fillStyle=SKIN; rrect(c,-3.4,-1.6,7.6,2.8,1.2); c.fill();
  c.fillStyle='#15130e'; c.beginPath(); c.arc(-1.2,-.4,1,0,6.3); c.fill();
  c.beginPath(); c.arc(2.6,-.4,1,0,6.3); c.fill();
  c.fillStyle=shade(col,1.02); c.beginPath(); c.arc(0,-.8,6.9,Math.PI,0);
  c.lineTo(6.9,1); c.lineTo(-6.9,1); c.closePath(); c.fill();
  c.save(); c.beginPath(); c.arc(0,-.8,6.9,Math.PI,0); c.lineTo(6.9,1); c.lineTo(-6.9,1); c.closePath();
  c.clip(); camoFleck(c,ri(0,900),-7,-8,14,9,8); c.restore();
  c.beginPath(); c.arc(0,-.8,6.9,Math.PI,0); c.lineTo(6.9,1); c.lineTo(-6.9,1); c.closePath(); outl(c,'#15130e',1.7);
  c.fillStyle='rgba(126,16,12,.95)'; c.beginPath(); c.arc(0,5.4,3.2,0,6.3); c.fill();
}
function gibSpine(c){
  c.fillStyle='rgba(222,212,190,.92)';
  for(var i=0;i<6;i++){ rrect(c,-2,-9+i*3.2,4,2.6,1.1); c.fill(); }
  outl(c,'#15130e',1);
  c.fillStyle='rgba(122,16,12,.85)'; c.beginPath(); c.arc(0,-10,3,0,6.3); c.fill();
}
function gibJaw(c){
  c.fillStyle='#ded4c0'; c.beginPath(); c.arc(0,0,4.4,.2,3.0); c.fill(); outl(c,'#15130e',1.3);
  c.fillStyle='#fff'; for(var i=0;i<5;i++) c.fillRect(-3.4+i*1.6,-1,1.1,2);
  c.fillStyle='rgba(122,16,12,.8)'; c.beginPath(); c.arc(0,2.6,2,0,6.3); c.fill();
}
function gibHelmet(c,col){
  c.fillStyle=shade(col,1.16); c.beginPath(); c.arc(0,0,7,Math.PI,0); c.lineTo(7,2); c.lineTo(-7,2); c.closePath();
  c.fill(); outl(c,'#15130e',1.8);
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0,1.4,5,1.8,0,0,6.3); c.fill();
}
/* whole bodies land in a few different attitudes */
function bakeCorpse(x,y,ang,col,band,kind,gib,behead){
  if(gib){ bakeGibs(x,y,ang,col,band,kind); return; }
  var pose=ri(0,3), a=(ang||0);
  bloodPool(x,y,rr(19,30)); addPool(x,y,rr(16,26));
  bloodSpray(x,y,a,rr(60,120),40);
  bloodSpray(x,y,a+Math.PI,rr(25,60),18);
  wallHit(x,y,a,130); wallHit(x,y,a+rr(-1.2,1.2),110);
  dc.save(); dc.translate(x,y+3); dc.scale(1,.58);
  dc.rotate(a+Math.PI/2+rr(-.55,.55)); dc.globalAlpha=.93;
  // pose 0 sprawled on the back, 1 face down, 2 twisted, 3 crumpled with the legs folded
  var look=[rr(1.2,1.9),-1.55,rr(-.5,.5),rr(2.4,3.1)][pose];
  var stride=[2.1,0.35,1.5,2.9][pose], amt=[.95,.25,.7,1][pose];
  drawUnit(dc,0,0,look,col,band,stride,amt,kind,gunFor(kind),true,behead,true,ri(0,9000));
  dc.restore(); dc.globalAlpha=1;
  if(behead){ dc.save(); dc.translate(x,y+3); dc.scale(1,.58); dc.rotate(a+Math.PI/2);
    dc.fillStyle='rgba(126,16,12,.92)'; dc.beginPath(); dc.arc(1.2,-30,4.6,0,6.3); dc.fill(); dc.restore(); }
  if(Math.random()<.55){ // weapon dropped clear of the body
    dc.save(); dc.translate(x+rr(-26,26),y+rr(-15,15)); dc.scale(1,.62); dc.rotate(rr(0,6.3));
    drawGun(dc,gunFor(kind),0,0); dc.restore();
  }
}
/* a direct blast takes them apart */
function bakeGibs(x,y,ang,col,band,kind){
  var a=(ang||rr(0,6.3)), head=Math.random()<.45;
  bloodPool(x,y,rr(34,50)); addPool(x,y,rr(26,40));
  bloodSpray(x,y,a,rr(110,200),80);
  bloodSpray(x,y,a+Math.PI+rr(-.7,.7),rr(60,130),50);
  bloodSpray(x,y,a+rr(1.4,2.2),rr(60,130),44);
  bloodSpray(x,y,a-rr(1.4,2.2),rr(60,130),44);
  for(var rg=0;rg<6;rg++) bloodSpray(x,y,rr(0,6.3),rr(30,90),18);
  for(var wd=0;wd<5;wd++) wallHit(x,y,a+wd*1.256+rr(-.3,.3),150);

  // everything comes apart and goes up
  launchPart(x,y,'torso',col,band,a,1.05,head);
  launchPart(x,y,'legs',col,band,a+Math.PI+rr(-.8,.8),1.0);
  var arms=ri(2,3); for(var i=0;i<arms;i++) launchPart(x,y,'arm',col,band,rr(0,6.3),1.15);
  for(var h2=0;h2<ri(1,2);h2++) launchPart(x,y,'hand',col,band,rr(0,6.3),1.3);
  launchPart(x,y,'boot',col,band,rr(0,6.3),1.25);
  launchPart(x,y,'ribs',col,band,rr(0,6.3),1.1);
  launchPart(x,y,'spine',col,band,rr(0,6.3),1.1);
  for(var v=0;v<ri(3,5);v++) launchPart(x,y,'viscera',col,band,rr(0,6.3),.85);
  if(head){ launchPart(x,y,'head',col,band,a,1.2); }
  else { launchPart(x,y,'skull',col,band,rr(0,6.3),1.35);
         launchPart(x,y,'jaw',col,band,rr(0,6.3),1.4);
         launchPart(x,y,'helmet',col,band,rr(0,6.3),1.3); }
  for(var m=0;m<ri(18,28);m++) launchPart(x,y,'meat',col,band,rr(0,6.3),rr(.7,1.35));
}
/* =========================================================================
   DRAW
   ========================================================================= */
function drawMovingWater(c){
  if(mapKind!=='sea') return;
  var x0=Math.max(0,Math.floor(cam.x/TILE)-1),x1=Math.min(MW-1,Math.ceil((cam.x+VW)/TILE)+1);
  var y0=Math.max(0,Math.floor(cam.y/TILE)-1),y1=Math.min(MH-1,Math.ceil((cam.y+VH)/TILE)+1);
  c.save(); c.lineCap='round';
  for(var y=y0;y<=y1;y++) for(var x=x0;x<=x1;x++){
    if(T(x,y)!==WATER) continue;
    var phase=now*1.9+x*.73+y*.41;
    var drift=(now*18+x*11+y*7)%TILE;
    c.strokeStyle='rgba(150,216,238,'+(.11+Math.sin(phase)*.045)+')'; c.lineWidth=1.4;
    c.beginPath();
    var wx=x*TILE+drift-14,wy=y*TILE+9+Math.sin(phase)*4;
    c.moveTo(wx,wy); c.quadraticCurveTo(wx+8,wy-3,wx+17,wy+Math.sin(phase+1.2)*2); c.stroke();
    c.strokeStyle='rgba(216,240,246,'+(.07+Math.cos(phase*.8)*.035)+')'; c.lineWidth=1;
    c.beginPath();
    var wx2=x*TILE+TILE-drift-10,wy2=y*TILE+23+Math.cos(phase*1.2)*3;
    c.moveTo(wx2,wy2); c.quadraticCurveTo(wx2+6,wy2+2,wx2+13,wy2-1); c.stroke();
  }
  c.restore();
}
function drawAirfieldBoss(c,U){
  var sc=U.bossScale||1.18,bob=Math.abs(Math.sin(U.walk||0))*1.1,step=Math.sin(U.walk||0)*4;
  c.save(); c.translate(U.x,U.y); c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0,7,21,8,0,0,6.3); c.fill();
  c.strokeStyle='#111318'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(-7,-10); c.lineTo(-9+step*.45,6); c.moveTo(7,-10); c.lineTo(9-step*.45,6); c.stroke();
  c.translate(0,bob);
  // Broad formal suit silhouette with white shirt and red party pin.
  var sg=c.createLinearGradient(-18,-36,18,-8); sg.addColorStop(0,'#0b0d11'); sg.addColorStop(.5,'#2b2f36'); sg.addColorStop(1,'#090b0e');
  c.fillStyle=sg; rrect(c,-18,-36,36,29,9); c.fill(); outl(c,'#050607',2.2);
  c.fillStyle='#e7e2da'; c.beginPath(); c.moveTo(-7,-34); c.lineTo(0,-18); c.lineTo(7,-34); c.closePath(); c.fill();
  c.fillStyle='#8c1f28'; c.beginPath(); c.moveTo(-2,-31); c.lineTo(2,-31); c.lineTo(4,-17); c.lineTo(0,-13); c.lineTo(-4,-17); c.closePath(); c.fill();
  c.fillStyle='#d5ad45'; c.beginPath(); c.arc(11,-27,2.2,0,6.3); c.fill();
  c.strokeStyle='#1b1e24'; c.lineWidth=8; c.beginPath(); c.moveTo(-14,-30); c.lineTo(-22,-13); c.moveTo(14,-30); c.lineTo(22,-13); c.stroke();
  // Rounded face and distinctive swept-back dark hairstyle from the reference.
  c.fillStyle='#c58f72'; c.beginPath(); c.ellipse(0,-47,13,12,0,0,6.3); c.fill(); outl(c,'#3d2820',2);
  c.fillStyle='#17191d'; c.beginPath(); c.moveTo(-12,-52); c.quadraticCurveTo(-9,-64,0,-63); c.quadraticCurveTo(11,-65,14,-55); c.lineTo(10,-51); c.quadraticCurveTo(0,-57,-12,-52); c.fill(); outl(c,'#070809',1.8);
  c.fillStyle='rgba(235,235,230,.35)'; c.beginPath(); c.moveTo(-9,-57); c.quadraticCurveTo(0,-62,10,-58); c.lineTo(8,-56); c.quadraticCurveTo(0,-59,-9,-55); c.fill();
  // Stern narrowed eyes and a flat, unsmiling mouth.
  c.strokeStyle='#241713'; c.lineWidth=1.8; c.lineCap='round'; c.beginPath(); c.moveTo(-8,-48); c.lineTo(-2,-47.2); c.moveTo(2,-47.2); c.lineTo(8,-48); c.stroke();
  c.fillStyle='#17110f'; c.beginPath(); c.ellipse(-4.5,-47.2,1.5,.7,-.08,0,6.3); c.fill(); c.beginPath(); c.ellipse(4.5,-47.2,1.5,.7,.08,0,6.3); c.fill();
  c.strokeStyle='#6f4031'; c.lineWidth=1.4; c.beginPath(); c.moveTo(-4,-40); c.lineTo(4,-40); c.stroke();
  c.restore();
}
function drawCompoundBoss(c,U){
  var walkPhase=U.walk||0,moveAmt=Math.max(0,Math.min(1,U.walkBlend===undefined?(U.amt||0):U.walkBlend));
  var sc=U.bossScale||1.14,cycle=Math.sin(walkPhase);
  var bob=(1-Math.cos(walkPhase*2))*.24*moveAmt;
  var strideL=cycle*4.6*moveAmt,strideR=-cycle*4.6*moveAmt;
  var liftL=Math.max(0,Math.sin(walkPhase))*1.15*moveAmt,liftR=Math.max(0,-Math.sin(walkPhase))*1.15*moveAmt;
  c.save(); c.translate(U.x,U.y); c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(0,5,17,7,0,0,6.3); c.fill();
  // Natural alternating gait: fixed hips, bending knees and feet that travel forward/back without crossing.
  function drawBossLeg(side,stride,lift){
    var hipX=side*5,hipY=-10,kneeX=side*6+stride*.08,kneeY=-3+stride*.32-lift*.25;
    var footX=side*7+stride*.12,footY=5+stride-lift;
    c.strokeStyle='#6f674f'; c.lineWidth=7; c.lineCap='round'; c.lineJoin='round';
    c.beginPath(); c.moveTo(hipX,hipY); c.lineTo(kneeX,kneeY); c.lineTo(footX,footY); c.stroke();
    c.strokeStyle='#9b8d6d'; c.lineWidth=1.4; c.beginPath(); c.moveTo(hipX-side*.5,hipY+1); c.lineTo(kneeX-side*.4,kneeY); c.stroke();
    c.fillStyle='#766b50'; c.beginPath(); c.ellipse(footX,footY,4.5,2.35,stride*.018,0,6.3); c.fill(); outl(c,'#352f24',1.1);
  }
  drawBossLeg(1,strideR,liftR); drawBossLeg(-1,strideL,liftL);
  c.translate(0,bob);
  // Desert-camouflage jacket based on the supplied reference.
  var dg=c.createLinearGradient(-13,-34,13,-12); dg.addColorStop(0,'#a99a76'); dg.addColorStop(.5,'#d0c39d'); dg.addColorStop(1,'#8f8061');
  c.fillStyle=dg; rrect(c,-13,-35,26,27,6); c.fill(); outl(c,'#332e24',2);
  // High-contrast desert camouflage patches remain readable at game scale.
  c.save(); rrect(c,-13,-35,26,27,6); c.clip();
  c.fillStyle='#756044'; c.beginPath(); c.ellipse(-8,-30,7,4,-.35,0,6.3); c.fill(); c.beginPath(); c.ellipse(8,-17,7,4,.4,0,6.3); c.fill();
  c.fillStyle='#596044'; c.beginPath(); c.ellipse(6,-29,6,3.5,.2,0,6.3); c.fill(); c.beginPath(); c.ellipse(-7,-16,6,4,-.2,0,6.3); c.fill();
  c.fillStyle='#ded0a8'; c.beginPath(); c.ellipse(0,-23,5,3,.5,0,6.3); c.fill(); c.beginPath(); c.ellipse(12,-10,5,3,-.3,0,6.3); c.fill(); c.restore();
  c.strokeStyle='#4e5139'; c.lineWidth=2; c.beginPath(); c.moveTo(-11,-27); c.quadraticCurveTo(-4,-31,1,-26); c.moveTo(2,-19); c.quadraticCurveTo(8,-23,12,-18); c.moveTo(-12,-13); c.quadraticCurveTo(-6,-17,-1,-13); c.stroke();
  c.fillStyle='#b8aa84'; rrect(c,-10,-26,8,7,1.5); c.fill(); outl(c,'#554936',1); rrect(c,3,-26,8,7,1.5); c.fill(); outl(c,'#554936',1);
  // Uploaded emblem worn as a compact left-chest uniform patch.
  var wagnerPatch=document.getElementById('wagnerPatchAsset');
  if(wagnerPatch&&wagnerPatch.complete&&wagnerPatch.naturalWidth){
    c.save(); rrect(c,-12,-34,11,11,2); c.clip(); c.drawImage(wagnerPatch,-12,-34,11,11); c.restore();
    c.strokeStyle='#b62429'; c.lineWidth=1.2; rrect(c,-12,-34,11,11,2); c.stroke();
  }
  // Left arm winds up and throws while the right hand keeps the flag raised.
  var throwP=U.hammerWind>0?Math.max(0,Math.min(1,1-U.hammerWind/.30)):0;
  var throwArc=Math.sin(throwP*Math.PI),hammerHandX=-18-throwP*9,hammerHandY=-13-throwArc*25-throwP*5;
  c.strokeStyle='#aa9670'; c.lineWidth=6; c.lineCap='round'; c.beginPath(); c.moveTo(-10,-29); c.quadraticCurveTo(-16-throwP*5,-28-throwArc*11,hammerHandX,hammerHandY); c.stroke();
  c.strokeStyle='#596044'; c.lineWidth=2.2; c.beginPath(); c.moveTo(-12,-27); c.quadraticCurveTo(-17-throwP*4,-24-throwArc*8,hammerHandX+1,hammerHandY+2); c.stroke();
  c.fillStyle='#bb8061'; c.beginPath(); c.arc(hammerHandX,hammerHandY,3.7,0,6.3); c.fill(); outl(c,'#3b291f',1.3);
  if(U.hammerWind>0){
    c.save(); c.translate(hammerHandX,hammerHandY); c.rotate(.55-throwP*1.65);
    c.fillStyle='#5b3b24'; rrect(c,-2.4,-1,4.8,17,2); c.fill(); outl(c,'#24170f',1.3);
    var handHammer=c.createLinearGradient(-11,-9,11,1); handHammer.addColorStop(0,'#4b5358'); handHammer.addColorStop(.5,'#c8ced0'); handHammer.addColorStop(1,'#33393d');
    c.fillStyle=handHammer; rrect(c,-11,-8,22,9,2.5); c.fill(); outl(c,'#171a1c',1.7);
    c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(-7,-6,8,1.5); c.restore();
  }
  // Raised right arm grips a Wagner flag instead of throwing hammers.
  var flagSway=Math.sin(Date.now()/320+(U.sid||0))*2+Math.sin(walkPhase*.72)*.7*moveAmt,flagPoleX=20;
  c.strokeStyle='#aa9670'; c.lineWidth=6; c.beginPath(); c.moveTo(10,-29); c.quadraticCurveTo(16,-27,flagPoleX,-18); c.stroke();
  c.strokeStyle='#756044'; c.lineWidth=2.2; c.beginPath(); c.moveTo(12,-27); c.lineTo(flagPoleX-1,-19); c.stroke();
  c.strokeStyle='#4a3420'; c.lineWidth=3.4; c.beginPath(); c.moveTo(flagPoleX,3); c.lineTo(flagPoleX+flagSway,-76); c.stroke();
  c.strokeStyle='#c5a56a'; c.lineWidth=1; c.beginPath(); c.moveTo(flagPoleX-1,2); c.lineTo(flagPoleX-1+flagSway,-75); c.stroke();
  c.fillStyle='#bb8061'; c.beginPath(); c.arc(flagPoleX,-18,3.8,0,6.3); c.fill(); outl(c,'#3b291f',1.3);
  c.save(); c.translate(flagPoleX+flagSway,-73); c.rotate(flagSway*.012);
  c.fillStyle='#090a0b'; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(17,-3,35,1+flagSway); c.lineTo(35,28+flagSway*.45); c.quadraticCurveTo(17,24,0,28); c.closePath(); c.fill(); outl(c,'#b62429',1.8);
  if(wagnerPatch&&wagnerPatch.complete&&wagnerPatch.naturalWidth){
    c.save(); c.beginPath(); c.rect(5,2,25,23); c.clip(); c.drawImage(wagnerPatch,5,2,25,23); c.restore();
  }
  c.fillStyle='#d5ad45'; c.beginPath(); c.arc(0,-1,2.4,0,6.3); c.fill(); c.restore();
  // Head, dark beard, wraparound glasses and a desert-camouflage patrol cap.
  c.fillStyle='#bb8061'; c.beginPath(); c.arc(0,-43,10,0,6.3); c.fill(); outl(c,'#3b291f',2);
  c.fillStyle='rgba(245,190,150,.24)'; c.beginPath(); c.ellipse(-2.5,-48.5,5.2,2.2,-.18,0,6.3); c.fill();
  c.fillStyle='#bb8061'; c.beginPath(); c.arc(-9.2,-43,2.1,0,6.3); c.fill(); c.beginPath(); c.arc(9.2,-43,2.1,0,6.3); c.fill();
  var capG=c.createLinearGradient(-10,-57,11,-47); capG.addColorStop(0,'#6d6044'); capG.addColorStop(.5,'#b3a174'); capG.addColorStop(1,'#545b3f');
  c.fillStyle=capG; c.beginPath(); c.moveTo(-10,-49); c.quadraticCurveTo(-9,-58,0,-59); c.quadraticCurveTo(10,-58,11,-49); c.quadraticCurveTo(0,-52,-10,-49); c.closePath(); c.fill(); outl(c,'#302c20',1.6);
  c.save(); c.beginPath(); c.moveTo(-10,-49); c.quadraticCurveTo(-9,-58,0,-59); c.quadraticCurveTo(10,-58,11,-49); c.closePath(); c.clip();
  c.fillStyle='#49503a'; c.beginPath(); c.ellipse(-5,-54,5,2.7,-.3,0,6.3); c.fill(); c.fillStyle='#796548'; c.beginPath(); c.ellipse(6,-52,5,2.5,.25,0,6.3); c.fill(); c.restore();
  c.fillStyle='#7f7050'; c.beginPath(); c.moveTo(-11,-50); c.quadraticCurveTo(1,-53,14,-49); c.quadraticCurveTo(5,-45,-7,-47); c.closePath(); c.fill(); outl(c,'#302c20',1.4);
  c.strokeStyle='rgba(225,210,165,.5)'; c.lineWidth=1; c.beginPath(); c.moveTo(-7,-55); c.quadraticCurveTo(0,-58,7,-54); c.stroke();
  // Sculpted wraparound sunglasses with separate lenses, bridge, arms and highlights.
  var glassG=c.createLinearGradient(-8,-46,8,-40); glassG.addColorStop(0,'#101518'); glassG.addColorStop(.55,'#30434b'); glassG.addColorStop(1,'#080b0d');
  c.fillStyle=glassG; rrect(c,-9.3,-46.5,8.7,6.5,2.4); c.fill(); rrect(c,.6,-46.5,8.7,6.5,2.4); c.fill();
  c.strokeStyle='#050708'; c.lineWidth=1.7; rrect(c,-9.3,-46.5,8.7,6.5,2.4); c.stroke(); rrect(c,.6,-46.5,8.7,6.5,2.4); c.stroke();
  c.beginPath(); c.moveTo(-.8,-43.8); c.quadraticCurveTo(0,-44.8,.8,-43.8); c.moveTo(-9,-44.5); c.lineTo(-11,-45); c.moveTo(9,-44.5); c.lineTo(11,-45); c.stroke();
  c.strokeStyle='rgba(170,224,236,.62)'; c.lineWidth=1; c.beginPath(); c.moveTo(-7.5,-45); c.lineTo(-3.5,-44.2); c.moveTo(2.5,-45); c.lineTo(6.5,-44.2); c.stroke();
  c.strokeStyle='rgba(111,57,40,.55)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-7,-39); c.lineTo(-3,-34); c.moveTo(7,-39); c.lineTo(3,-34); c.stroke();
  c.strokeStyle='#6f3b2d'; c.lineWidth=1.5; c.lineCap='round';
  c.beginPath(); c.moveTo(0,-42); c.lineTo(-1,-36); c.lineTo(2,-35); c.stroke();
  // Angular cheeks and a crooked, clenched sneer make the expression readable at game scale.
  c.strokeStyle='rgba(92,46,34,.75)'; c.lineWidth=1.4; c.beginPath(); c.moveTo(-8,-37); c.lineTo(-4,-34); c.moveTo(8,-37); c.lineTo(4,-34); c.stroke();
  c.fillStyle='#4a211c'; c.beginPath(); c.moveTo(-6,-31); c.quadraticCurveTo(0,-27,7,-33); c.quadraticCurveTo(1,-30,-6,-31); c.closePath(); c.fill();
  c.fillStyle='#e6d6c4'; c.beginPath(); c.moveTo(-4.5,-31); c.quadraticCurveTo(.5,-29,5,-32); c.lineTo(4,-29.8); c.quadraticCurveTo(0,-27.8,-4.5,-29.5); c.closePath(); c.fill();
  c.strokeStyle='#3b1d18'; c.lineWidth=1.1; c.beginPath(); c.moveTo(-5,-27); c.quadraticCurveTo(0,-25,5,-28); c.stroke();
  // Full beard frames the mouth but leaves the expression and glasses visible.
  c.fillStyle='#24201b'; c.beginPath(); c.moveTo(-8,-38); c.quadraticCurveTo(-10,-28,-5,-21); c.lineTo(0,-17); c.lineTo(5,-21); c.quadraticCurveTo(10,-28,8,-38); c.quadraticCurveTo(5,-34,4,-32); c.quadraticCurveTo(0,-28,-4,-32); c.quadraticCurveTo(-5,-34,-8,-38); c.fill(); outl(c,'#0e0d0b',1.5);
  c.strokeStyle='#4b4338'; c.lineWidth=1; for(var bd=-5;bd<=5;bd+=2.5){ c.beginPath(); c.moveTo(bd,-32); c.lineTo(bd*.5,-21); c.stroke(); }
  c.restore();
}
function drawLevelTwoBoss(c,U){
  var sc=U.bossScale||1.18,bob=Math.abs(Math.sin(U.walk||0))*1.1*(U.amt||0),step=Math.sin(U.walk||0)*3.5*(U.amt||0);
  var gr=U.grind||0;
  c.save(); c.translate(U.x,U.y); c.scale(sc,sc);
  // Ground shadow
  c.fillStyle='rgba(0,0,0,.36)'; c.beginPath(); c.ellipse(0,7,24,9,0,0,6.3); c.fill();
  // Legs
  c.strokeStyle='#1a2030'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(-7,-10); c.lineTo(-9+step,6); c.moveTo(7,-10); c.lineTo(9-step,6); c.stroke();
  c.strokeStyle='#2c3550'; c.lineWidth=6; c.beginPath(); c.moveTo(-7,-10); c.lineTo(-9+step,6); c.moveTo(7,-10); c.lineTo(9-step,6); c.stroke();
  c.translate(0,bob);

  // ── TORSO — worn field jacket, olive-brown ────────────────────────────────
  var ug=c.createLinearGradient(-17,-38,17,-8); ug.addColorStop(0,'#2a2c1c'); ug.addColorStop(.5,'#363820'); ug.addColorStop(1,'#1e1f14');
  c.fillStyle=ug; rrect(c,-17,-39,34,31,8); c.fill(); outl(c,'#0f100a',2.2);
  // Worn shoulder pads — dark canvas, no gold
  c.fillStyle='#3a3c28'; rrect(c,-20,-39,9,5,2); c.fill(); outl(c,'#1a1c10',1);
  c.fillStyle='#3a3c28'; rrect(c,11,-39,9,5,2); c.fill(); outl(c,'#1a1c10',1);
  // Stitch lines on shoulder pads
  c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=.7;
  for(var ep=0;ep<3;ep++){ c.beginPath(); c.moveTo(-20+ep*3,-39); c.lineTo(-20+ep*3,-34); c.stroke(); c.beginPath(); c.moveTo(11+ep*3,-39); c.lineTo(11+ep*3,-34); c.stroke(); }
  // Worn patches — faded, no bright colors
  var meds=[['#5a3030','#3a2020'],['#303050','#202030'],['#504a30','#302c18']];
  for(var mi=0;mi<meds.length;mi++){ c.fillStyle=meds[mi][0]; rrect(c,-11+mi*8,-30,6,5,1); c.fill(); c.fillStyle=meds[mi][1]; c.fillRect(-11+mi*8,-30,6,1.5); }
  // Dark tarnished buttons
  c.fillStyle='#3a3828'; for(var bn=0;bn<3;bn++){ c.beginPath(); c.arc(0,-36+bn*5,1.8,0,6.3); c.fill(); }
  // Dirt/grime overlay on jacket
  c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(4,-22,8,10,.1,0,6.3); c.fill();
  c.fillStyle='rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(-6,-28,5,7,-.1,0,6.3); c.fill();

  // ── NECK ─────────────────────────────────────────────────────────────────
  c.fillStyle='#b87860'; rrect(c,-5,-43,10,6,2); c.fill(); outl(c,'#3d2218',1.2);

  // ── FACE ─────────────────────────────────────────────────────────────────
  // Head base — lean angular military face, no jowls
  c.fillStyle='#c08060'; c.beginPath(); c.ellipse(0,-51,10,12,0,0,6.3); c.fill(); outl(c,'#3d2218',1.8);
  // Cheekbone hollows — angular, gaunt
  c.fillStyle='rgba(72,42,24,.28)'; c.beginPath(); c.ellipse(-6.5,-50,3,4,.2,0,6.3); c.fill();
  c.fillStyle='rgba(72,42,24,.28)'; c.beginPath(); c.ellipse(6.5,-50,3,4,-.2,0,6.3); c.fill();
  // Forehead — slightly lighter
  c.fillStyle='#c89070'; c.beginPath(); c.ellipse(0,-56,8,5,0,0,6.3); c.fill();
  // Gray hair at temples — visible below cap band edge
  c.fillStyle='rgba(152,150,138,.78)'; c.beginPath(); c.ellipse(-8,-57,3.5,2,.15,0,6.3); c.fill();
  c.fillStyle='rgba(152,150,138,.78)'; c.beginPath(); c.ellipse(8,-57,3.5,2,-.15,0,6.3); c.fill();
  c.fillStyle='rgba(200,196,182,.4)'; c.beginPath(); c.ellipse(-7.5,-56.5,2,1.1,.15,0,6.3); c.fill();
  c.fillStyle='rgba(200,196,182,.4)'; c.beginPath(); c.ellipse(7.5,-56.5,2,1.1,-.15,0,6.3); c.fill();
  // Heavy brow ridge
  c.fillStyle='#8a5840'; c.beginPath(); c.ellipse(-4,-57,4.5,2,.15,0,6.3); c.fill();
  c.fillStyle='#8a5840'; c.beginPath(); c.ellipse(4,-57,4.5,2,-.15,0,6.3); c.fill();
  // Eye whites
  c.fillStyle='#ddd4b8'; c.beginPath(); c.ellipse(-4,-56.5,2.8,1.8,0,0,6.3); c.fill();
  c.fillStyle='#ddd4b8'; c.beginPath(); c.ellipse(4,-56.5,2.8,1.8,0,0,6.3); c.fill();
  // Irises — dark, cold
  c.fillStyle='#2a3028'; c.beginPath(); c.ellipse(-4,-56.5,1.5,1.5,0,0,6.3); c.fill();
  c.fillStyle='#2a3028'; c.beginPath(); c.ellipse(4,-56.5,1.5,1.5,0,0,6.3); c.fill();
  // Nose bridge and tip
  c.strokeStyle='#7a4830'; c.lineWidth=1.3; c.lineCap='round';
  c.beginPath(); c.moveTo(-1.5,-54); c.quadraticCurveTo(-2.5,-52,-2.8,-50); c.stroke();
  c.beginPath(); c.moveTo(1.5,-54); c.quadraticCurveTo(2.5,-52,2.8,-50); c.stroke();
  c.fillStyle='#8a5038'; c.beginPath(); c.arc(-2.5,-50,1.2,0,6.3); c.fill();
  c.fillStyle='#8a5038'; c.beginPath(); c.arc(2.5,-50,1.2,0,6.3); c.fill();
  // Gray stubble over lean jaw
  c.fillStyle='rgba(110,88,74,.32)'; c.beginPath(); c.ellipse(0,-48.5,7.5,5.5,.05,0,6.3); c.fill();
  // Ear
  c.fillStyle='#b07050'; c.beginPath(); c.ellipse(-10.5,-52,2.8,3.8,-.18,0,6.3); c.fill(); outl(c,'#3d2218',1);
  // Wrinkle lines — furrowed brow
  c.strokeStyle='rgba(80,50,34,.5)'; c.lineWidth=.9;
  c.beginPath(); c.moveTo(-4,-58); c.quadraticCurveTo(-1.5,-57,-.5,-58); c.stroke();
  c.beginPath(); c.moveTo(.5,-58); c.quadraticCurveTo(2.5,-57,4.5,-58); c.stroke();
  c.beginPath(); c.moveTo(-2.5,-55); c.quadraticCurveTo(0,-54.2,2.5,-55); c.stroke();

  // ── SUNGLASSES — tactical aviator, dark tinted ───────────────────────────
  // Dark lens fill
  c.fillStyle='rgba(16,20,18,.92)'; c.beginPath(); c.ellipse(-4,-56.5,3.8,2.6,0,0,6.3); c.fill();
  c.fillStyle='rgba(16,20,18,.92)'; c.beginPath(); c.ellipse(4,-56.5,3.8,2.6,0,0,6.3); c.fill();
  // Subtle green-tinted reflection on lenses
  c.fillStyle='rgba(48,72,52,.32)'; c.beginPath(); c.ellipse(-5.2,-57.4,2,1,-.15,0,6.3); c.fill();
  c.fillStyle='rgba(48,72,52,.32)'; c.beginPath(); c.ellipse(2.8,-57.4,2,1,-.15,0,6.3); c.fill();
  // Frame
  c.strokeStyle='#222018'; c.lineWidth=1.4;
  c.beginPath(); c.ellipse(-4,-56.5,3.8,2.6,0,0,6.3); c.stroke();
  c.beginPath(); c.ellipse(4,-56.5,3.8,2.6,0,0,6.3); c.stroke();
  // Nose bridge
  c.lineCap='round'; c.lineWidth=1.2;
  c.beginPath(); c.moveTo(-.8,-56.5); c.lineTo(.8,-56.5); c.stroke();
  // Temple arms
  c.beginPath(); c.moveTo(-7.8,-56.5); c.lineTo(-10.5,-55.8); c.stroke();
  c.beginPath(); c.moveTo(7.8,-56.5); c.lineTo(10.5,-55.8); c.stroke();

  // ── WORN FIELD CAP ───────────────────────────────────────────────────────
  // Crown — faded olive, beaten up
  var capg=c.createLinearGradient(0,-74,0,-59); capg.addColorStop(0,'#2c2e1c'); capg.addColorStop(1,'#232514');
  c.fillStyle=capg; c.beginPath(); c.arc(0,-62,13,Math.PI,0); c.lineTo(13,-59); c.lineTo(-13,-59); c.closePath(); c.fill(); outl(c,'#0f100a',1.8);
  // Worn crease on crown
  c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=1;
  c.beginPath(); c.moveTo(-4,-68); c.quadraticCurveTo(0,-66,4,-68); c.stroke();
  // Dirty band — dark brown, no gold trim
  c.fillStyle='#3a2418'; rrect(c,-13,-62,26,5,1); c.fill(); outl(c,'#1a1008',1);
  // Faded red star — dull, worn
  c.fillStyle='#8a1c1c'; c.beginPath(); c.arc(0,-62,3,0,6.3); c.fill(); outl(c,'#4a0e0e',1);
  // Dark brim — worn leather/canvas, no shine
  c.fillStyle='#1e1c12'; c.beginPath(); c.moveTo(-13,-59); c.lineTo(-15,-57); c.quadraticCurveTo(0,-55,15,-57); c.lineTo(13,-59); c.closePath(); c.fill();
  c.strokeStyle='#2e2c1a'; c.lineWidth=1; c.beginPath(); c.moveTo(-15,-57); c.quadraticCurveTo(0,-55,15,-57); c.stroke();

  // ── MEAT GRINDER — classic hand-cranked, aged cast iron ──────────────────
  // Cast iron barrel body — light grey with warm rust undertone
  var hg=c.createLinearGradient(-22,-27,14,-4); hg.addColorStop(0,'#a8a49c'); hg.addColorStop(.45,'#928e86'); hg.addColorStop(1,'#787068');
  c.fillStyle=hg; c.beginPath(); c.ellipse(0,-15,22,11,0,0,6.3); c.fill(); outl(c,'#4a4640',2.5);
  // Barrel seam ring
  c.strokeStyle='#6e6a62'; c.lineWidth=2; c.beginPath(); c.ellipse(0,-15,22,11,0,0,6.3); c.stroke();
  // Top sheen — old worn metal
  c.fillStyle='rgba(255,252,245,.13)'; c.beginPath(); c.ellipse(-3,-18,16,5.5,.04,Math.PI*1.1,Math.PI*1.9); c.fill();
  // Rust spots on barrel
  c.fillStyle='rgba(130,68,28,.22)'; c.beginPath(); c.ellipse(-8,-14,4,2.5,.2,0,6.3); c.fill();
  c.fillStyle='rgba(120,58,22,.16)'; c.beginPath(); c.ellipse(6,-17,2.5,1.5,-.1,0,6.3); c.fill();
  // Hopper / funnel — lighter grey, aged
  c.fillStyle='#9e9a92';
  c.beginPath(); c.moveTo(-9,-26); c.lineTo(9,-26); c.lineTo(14,-39); c.lineTo(-14,-39); c.closePath();
  c.fill(); outl(c,'#4a4640',2);
  // Hopper interior — dark cavity
  c.fillStyle='#2e2a24';
  c.beginPath(); c.moveTo(-7,-26); c.lineTo(7,-26); c.lineTo(11,-38); c.lineTo(-11,-38); c.closePath(); c.fill();
  // Hopper rim highlight
  c.strokeStyle='rgba(255,252,245,.12)'; c.lineWidth=1;
  c.beginPath(); c.moveTo(-14,-39); c.lineTo(14,-39); c.stroke();
  // Blood pooled in hopper interior
  c.fillStyle='rgba(140,16,12,.7)'; c.beginPath(); c.ellipse(0,-34,7,3.5,.05,0,6.3); c.fill();
  c.fillStyle='rgba(120,12,8,.5)'; c.beginPath(); c.ellipse(-3,-37,3.2,1.6,.1,0,6.3); c.fill();
  // Output end — perforated disc, lighter aged grey
  c.fillStyle='#9a9690'; c.beginPath(); c.arc(22,-15,9.5,0,6.3); c.fill(); outl(c,'#4a4640',2);
  c.fillStyle='#868280'; c.beginPath(); c.arc(22,-15,7.5,0,6.3); c.fill();
  // Rust ring on disc edge
  c.strokeStyle='rgba(120,60,24,.3)'; c.lineWidth=1.5; c.beginPath(); c.arc(22,-15,8.5,0,6.3); c.stroke();
  // Perforation holes
  c.fillStyle='#2e2a24';
  var pholes=[[-3,-3],[0,-3],[3,-3],[-3,0],[0,0],[3,0],[-3,3],[0,3],[3,3]];
  for(var pi2=0;pi2<pholes.length;pi2++){ c.beginPath(); c.arc(22+pholes[pi2][0],-15+pholes[pi2][1],1,0,6.3); c.fill(); }
  // Blood dripping from output disc
  c.fillStyle='rgba(150,14,10,.85)'; c.beginPath(); c.arc(22,-7,3,0,6.3); c.fill();
  c.strokeStyle='rgba(130,12,8,.72)'; c.lineWidth=2; c.lineCap='round';
  c.beginPath(); c.moveTo(22,-7); c.quadraticCurveTo(23.5,-3.5,22,-1); c.stroke();
  c.beginPath(); c.moveTo(20,-6); c.quadraticCurveTo(18.5,-3,19.5,-1); c.stroke();
  c.fillStyle='rgba(140,14,10,.65)'; c.beginPath(); c.arc(22,1,2.2,0,6.3); c.fill();
  c.fillStyle='rgba(130,12,8,.5)'; c.beginPath(); c.arc(20,4,1.4,0,6.3); c.fill();
  // Crank hub — aged light grey metal
  var ckx=29,cky=-15;
  c.fillStyle='#9a9690'; c.beginPath(); c.arc(ckx,cky,5.5,0,6.3); c.fill(); outl(c,'#4a4640',1.5);
  c.fillStyle='#aeaaa2'; c.beginPath(); c.arc(ckx,cky,3.2,0,6.3); c.fill();
  c.fillStyle='#c8c4bc'; c.beginPath(); c.arc(ckx,cky,1.4,0,6.3); c.fill();
  // Crank arm — rotates with auger (gr = U.grind)
  c.save(); c.translate(ckx,cky); c.rotate(gr);
  c.strokeStyle='#8a8680'; c.lineWidth=4; c.lineCap='round';
  c.beginPath(); c.moveTo(0,0); c.lineTo(0,11); c.stroke();
  c.beginPath(); c.moveTo(0,11); c.lineTo(-5,11); c.stroke();
  c.fillStyle='#aeaaa2'; c.beginPath(); c.arc(-5,11,3.4,0,6.3); c.fill(); outl(c,'#4a4640',1.2);
  c.fillStyle='#c8c4bc'; c.beginPath(); c.arc(-5,11,1.5,0,6.3); c.fill();
  c.restore();
  // Left hand gripping barrel — pushing meat in
  c.fillStyle='#b87860'; c.beginPath(); c.arc(-23,-12,4.5,0,6.3); c.fill(); outl(c,'#3d2218',1.4);
  c.strokeStyle='#8a5038'; c.lineWidth=.9; c.lineCap='round';
  c.beginPath(); c.arc(-23,-12,3,Math.PI*.15,Math.PI*.85); c.stroke();

  c.restore();
}
function drawMountedBoss(c,U){
  var ph=U.horsePhase||0,stepA=Math.sin(ph),stepB=Math.sin(ph+Math.PI),liftA=Math.max(0,-Math.cos(ph))*5,liftB=Math.max(0,Math.cos(ph))*5;
  var bob=Math.abs(Math.sin(ph))*1.6,sc=U.bossScale||1.12;
  // The horse turns with travel, while the rider is drawn separately and stays upright on screen.
  var horseFacing=Math.cos(U.ang)<0?-1:1;
  c.save(); c.translate(U.x,U.y+bob); c.scale(horseFacing*sc,sc);
  c.fillStyle='rgba(0,0,0,.38)'; c.beginPath(); c.ellipse(-1,15,35,12,0,0,6.3); c.fill();
  function horseLeg(x,y,swing,lift,back){
    c.save(); c.translate(x,y); c.rotate(swing*.24);
    c.fillStyle=back?'#4c2b1d':'#633923'; rrect(c,-3,-1,6,14,3); c.fill(); outl(c,'#21150f',1.5);
    c.translate(swing*2,10-lift); c.rotate(-swing*.18);
    c.fillStyle='#3b2419'; rrect(c,-2.7,0,5.4,12,2.4); c.fill(); outl(c,'#21150f',1.4);
    c.fillStyle='#151515'; rrect(c,-3.6,9,8,4,2); c.fill(); outl(c,'#080808',1.2); c.restore();
  }
  horseLeg(-17,1,stepA,liftA,1); horseLeg(-7,3,stepB,liftB,1);
  horseLeg(16,1,stepB,liftB,0); horseLeg(7,3,stepA,liftA,0);
  var bodyG=c.createLinearGradient(-27,-12,27,10); bodyG.addColorStop(0,'#4b291b'); bodyG.addColorStop(.45,'#825037'); bodyG.addColorStop(.72,'#704029'); bodyG.addColorStop(1,'#3d2419');
  c.fillStyle=bodyG; c.beginPath(); c.ellipse(0,-5,30,15,0,0,6.3); c.fill(); outl(c,'#21150f',2.2);
  c.fillStyle='rgba(238,185,128,.16)'; c.beginPath(); c.ellipse(-5,-11,18,5,-.08,0,6.3); c.fill();
  c.fillStyle='#42251a'; c.beginPath(); c.arc(-19,-4,8,0,6.3); c.fill();
  // Saddle, blanket, straps and stirrups.
  c.fillStyle='#8e2020'; rrect(c,-12,-16,24,18,4); c.fill(); outl(c,'#351814',1.8);
  c.fillStyle='#d3aa48'; c.fillRect(-11,-14,22,2); c.fillRect(-11,-1,22,2);
  c.fillStyle='#3a261d'; rrect(c,-9,-18,18,9,4); c.fill(); outl(c,'#17100d',1.6);
  c.strokeStyle='#d0a95c'; c.lineWidth=1.5; c.beginPath(); c.moveTo(-7,-8); c.lineTo(-10,9); c.lineTo(-5,13); c.moveTo(7,-8); c.lineTo(10,9); c.lineTo(5,13); c.stroke();
  // Neck, head, ears, mane, blaze and bridle.
  c.fillStyle='#75452d'; c.beginPath(); c.moveTo(17,-13); c.quadraticCurveTo(23,-31,31,-33); c.lineTo(39,-22); c.lineTo(27,-6); c.closePath(); c.fill(); outl(c,'#21150f',2);
  c.fillStyle='#825139'; c.beginPath(); c.ellipse(38,-30,13,8,-.14,0,6.3); c.fill(); outl(c,'#21150f',2);
  c.fillStyle='#2b1913'; c.beginPath(); c.moveTo(28,-35); c.lineTo(27,-45); c.lineTo(34,-37); c.moveTo(40,-38); c.lineTo(45,-45); c.lineTo(46,-35); c.fill();
  c.fillStyle='#ead9c0'; c.beginPath(); c.moveTo(35,-37); c.quadraticCurveTo(43,-34,46,-25); c.lineTo(41,-25); c.quadraticCurveTo(39,-32,35,-37); c.fill();
  c.fillStyle='#0d0b09'; c.beginPath(); c.arc(42,-31,1.5,0,6.3); c.fill(); c.beginPath(); c.arc(49,-27,1.1,0,6.3); c.fill();
  c.strokeStyle='#24150f'; c.lineWidth=4; c.beginPath(); c.moveTo(24,-28); c.lineTo(20,-17); c.stroke();
  c.strokeStyle='#c69b54'; c.lineWidth=1.6; c.beginPath(); c.moveTo(48,-29); c.quadraticCurveTo(20,-23,5,-20); c.moveTo(45,-24); c.quadraticCurveTo(18,-13,4,-17); c.stroke();
  c.strokeStyle='#2a1711'; c.lineWidth=5; c.beginPath(); c.moveTo(-26,-10); c.quadraticCurveTo(-42,-18,-45,-4+stepA*3); c.stroke();
  c.restore();

  // Upright rider: legs hug the saddle but torso and head never rotate sideways.
  c.save(); c.translate(U.x,U.y-10+bob); c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,4,13,5,0,0,6.3); c.fill();
  // Only the near-side black-panted leg is visible. Its knee and boot follow
  // the horse's facing direction so the rider never appears seated backwards.
  var legDir=horseFacing;
  c.strokeStyle='#0b0e12'; c.lineWidth=7; c.lineCap='round'; c.beginPath();
  c.moveTo(6*legDir,-7); c.quadraticCurveTo(11*legDir,-1,14*legDir,10); c.stroke();
  c.strokeStyle='#30363c'; c.lineWidth=2; c.beginPath(); c.moveTo(7*legDir,-6); c.lineTo(13*legDir,8); c.stroke();
  c.fillStyle='#090a0b'; rrect(c,legDir>0?8:-18,7,10,5,2); c.fill(); outl(c,'#050505',1.3);
  c.fillStyle='#0d1115'; rrect(c,-10,-10,20,17,6); c.fill(); outl(c,'#050607',2);
  c.fillStyle='#262b30'; c.fillRect(-8,-8,16,3); c.fillStyle='#b08a46'; c.fillRect(-8,-6,16,2);
  var skinG=c.createLinearGradient(-9,-33,9,-14); skinG.addColorStop(0,'#9f674d'); skinG.addColorStop(.48,'#c28b69'); skinG.addColorStop(1,'#8f5944');
  c.fillStyle=skinG; rrect(c,-9,-32,18,23,6); c.fill(); outl(c,'#3b2119',2);
  c.strokeStyle='rgba(92,48,35,.55)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(0,-29); c.lineTo(0,-15); c.moveTo(-6,-24); c.quadraticCurveTo(0,-20,6,-24); c.stroke();
  c.strokeStyle='#a96f53'; c.lineWidth=5.5; c.lineCap='round'; c.beginPath(); c.moveTo(-7,-28); c.lineTo(-17,-16); c.moveTo(7,-28); c.lineTo(17,-16); c.stroke();
  c.fillStyle='#b67d5e'; c.beginPath(); c.arc(-18,-15,3.4,0,6.3); c.fill(); c.beginPath(); c.arc(18,-15,3.4,0,6.3); c.fill();
  c.fillStyle='#c28b69'; c.beginPath(); c.arc(0,-42,10,0,6.3); c.fill(); outl(c,'#3b2119',2);
  c.fillStyle='rgba(255,225,190,.42)'; c.beginPath(); c.arc(-3,-46,4,3.2,5.7); c.fill();
  c.fillStyle='#9a654d'; c.beginPath(); c.arc(0,-34,6,0,3.14); c.fill();
  c.fillStyle='#17130f'; c.beginPath(); c.arc(-3,-42,1.2,0,6.3); c.arc(3,-42,1.2,0,6.3); c.fill();
  c.strokeStyle='#3d241c'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-4,-38); c.quadraticCurveTo(0,-36.5,4,-38); c.stroke();
  c.restore();
}
function drawMotorcadeCar(c,C){
  var carScale=1.5;
  c.save(); c.translate(C.x,C.y); c.rotate(C.ang); c.scale(carScale,carScale);
  c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(7,8,37,13,0,0,6.3); c.fill();
  var cg=c.createLinearGradient(-32,-13,32,13); cg.addColorStop(0,C.dead?'#151515':'#090b0c'); cg.addColorStop(.48,C.dead?'#292929':'#363d41'); cg.addColorStop(1,'#050607');
  c.fillStyle=cg; rrect(c,-33,-13,66,26,7); c.fill(); outl(c,'#040505',2);
  c.fillStyle=C.dead?'#202326':'#263943'; rrect(c,-13,-10,28,20,5); c.fill();
  c.fillStyle='rgba(126,166,184,.55)'; c.fillRect(-9,-8,9,16); c.fillRect(3,-8,9,16);
  c.fillStyle='#090a0a'; for(var wh=0;wh<4;wh++){ var wx=wh<2?-23:23,wy=wh%2?-12:12; c.beginPath(); c.arc(wx,wy,5,0,6.3); c.fill(); }
  c.fillStyle=C.dead?'#7b5038':'#eee2b9'; c.fillRect(30,-8,3,5); c.fillRect(30,3,3,5);
  if(C.i===2&&!C.dead){ c.fillStyle='#fff'; c.fillRect(-2,-16,2,9); c.fillStyle='#d52b1e'; c.fillRect(0,-16,10,3); c.fillStyle='#1f4f9b'; c.fillRect(0,-13,10,3); c.fillStyle='#fff'; c.fillRect(0,-10,10,3); }
  if(C.hurt>0&&!C.dead){ c.fillStyle='rgba(255,235,155,'+Math.min(.75,C.hurt*3.4)+')'; rrect(c,-33,-13,66,26,7); c.fill(); }
  c.restore();
  if(!C.dead){
    var hpPct=Math.max(0,C.hp/C.mx), hitCount=Math.min(3,C.gunHits||0);
    c.fillStyle='rgba(0,0,0,.82)'; rrect(c,C.x-55,C.y-57,110,19,4); c.fill();
    c.fillStyle=C.hurt>0?'#fff2a8':'#f4f0df'; c.font='bold 9px Arial'; c.textAlign='center';
    c.fillText('CAR HP '+Math.ceil(C.hp)+'/'+C.mx+'  ·  HITS '+hitCount+'/3',C.x,C.y-48);
    c.fillStyle='rgba(255,255,255,.18)'; rrect(c,C.x-50,C.y-44,100,7,3); c.fill();
    c.fillStyle=C.hurt>0?'#ffd84d':'#d84a34'; rrect(c,C.x-49,C.y-43,98*hpPct,5,2); c.fill();
    c.textAlign='start';
  }
}

function drawOnionDome(c,x,y,w,h,base,accent,pattern){
  c.save();
  c.fillStyle='#b9a16b'; c.fillRect(x-2,y-h-9,4,10); c.beginPath(); c.arc(x,y-h-10,3,0,6.3); c.fill();
  var domeGrad=c.createLinearGradient(x-w*.55,y-h*.5,x+w*.55,y-h*.35); domeGrad.addColorStop(0,shade(base,.55)); domeGrad.addColorStop(.28,base); domeGrad.addColorStop(.52,shade(base,1.28)); domeGrad.addColorStop(1,shade(base,.68));
  c.fillStyle=domeGrad; c.beginPath(); c.moveTo(x,y-h); c.bezierCurveTo(x-w*.16,y-h*.82,x-w*.62,y-h*.56,x-w*.48,y-h*.25); c.bezierCurveTo(x-w*.3,y+2,x+w*.3,y+2,x+w*.48,y-h*.25); c.bezierCurveTo(x+w*.62,y-h*.56,x+w*.16,y-h*.82,x,y-h); c.closePath(); c.fill(); outl(c,'#3a2926',1.6);
  c.save(); c.beginPath(); c.moveTo(x,y-h); c.bezierCurveTo(x-w*.16,y-h*.82,x-w*.62,y-h*.56,x-w*.48,y-h*.25); c.bezierCurveTo(x-w*.3,y+2,x+w*.3,y+2,x+w*.48,y-h*.25); c.bezierCurveTo(x+w*.62,y-h*.56,x+w*.16,y-h*.82,x,y-h); c.closePath(); c.clip();
  c.strokeStyle=accent; c.lineWidth=pattern==='wide'?5:3;
  if(pattern==='diamond'){
    for(var d=-w;d<w*1.5;d+=9){ c.beginPath(); c.moveTo(x+d,y); c.lineTo(x+d+w*.7,y-h); c.stroke(); c.beginPath(); c.moveTo(x+d,y-h); c.lineTo(x+d+w*.7,y); c.stroke(); }
  } else {
    for(var s=-w;s<=w;s+=8){ c.beginPath(); c.moveTo(x+s,y); c.quadraticCurveTo(x+s*.35,y-h*.55,x+s*.12,y-h); c.stroke(); }
  }
  c.restore();
  c.fillStyle='#d8c6ad'; rrect(c,x-w*.42,y-1,w*.84,7,2); c.fill(); outl(c,'#5b3b32',1.2); c.restore();
}

function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#0c0d0b'; ctx.fillRect(0,0,VW,VH);
  if(!player) return;
  var sx=shake>0?rr(-shake,shake)*.5:0, sy=shake>0?rr(-shake,shake)*.5:0;
  ctx.save(); ctx.translate(-Math.round(cam.x)+sx,-Math.round(cam.y)+sy);

  ctx.drawImage(stat,0,0);
  drawMovingWater(ctx);
  paintDamaged(ctx);
  ctx.drawImage(deco,0,0);
  ctx.drawImage(bloodC,0,0);

  // fresh blood still spreading
  for(var pl=0;pl<pools.length;pl++){ var PL=pools[pl];
    ctx.fillStyle='rgba(104,12,9,.62)';
    ctx.beginPath(); ctx.ellipse(PL.x,PL.y,PL.r*1.25,PL.r*.85,0,0,6.3); ctx.fill();
    ctx.fillStyle='rgba(158,26,18,.42)';
    ctx.beginPath(); ctx.ellipse(PL.x,PL.y,PL.r*.85,PL.r*.55,0,0,6.3); ctx.fill();
    ctx.fillStyle='rgba(226,120,100,.16)';
    ctx.beginPath(); ctx.ellipse(PL.x-PL.r*.3,PL.y-PL.r*.25,PL.r*.3,PL.r*.16,0,0,6.3); ctx.fill();
  }

  // firelight pooling on the ground
  ctx.globalCompositeOperation='lighter';
  for(var lf=0;lf<fires.length;lf++){
    var LF=fires[lf], fk=(.72+Math.sin(LF.p*1.7)*.14+Math.sin(LF.p*3.3)*.08);
    if(LF.x<cam.x-260||LF.x>cam.x+VW+260||LF.y<cam.y-260||LF.y>cam.y+VH+260) continue;
    var lg=ctx.createRadialGradient(LF.x,LF.y,2,LF.x,LF.y,LF.r*5.5*fk);
    lg.addColorStop(0,'rgba(255,168,70,.42)'); lg.addColorStop(.45,'rgba(220,96,32,.18)'); lg.addColorStop(1,'rgba(180,60,20,0)');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(LF.x,LF.y,LF.r*5.5*fk,0,6.3); ctx.fill();
  }
  for(var fr=0;fr<flares.length;fr++){ var FR2=flares[fr];
    var fg2=ctx.createRadialGradient(FR2.x,FR2.y,4,FR2.x,FR2.y,300);
    fg2.addColorStop(0,'rgba(255,235,190,.30)'); fg2.addColorStop(1,'rgba(255,200,120,0)');
    ctx.fillStyle=fg2; ctx.beginPath(); ctx.arc(FR2.x,FR2.y,300,0,6.3); ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';

  // parts still twitching on the floor
  for(var tq=0;tq<twitchers.length;tq++){
    var TQ=twitchers[tq];
    ctx.fillStyle='rgba(0,0,0,'+(.3-Math.min(.2,TQ.z/90))+')';
    ctx.beginPath(); ctx.ellipse(TQ.x,TQ.y,TQ.s*1.5+4,TQ.s*.9+2,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(TQ.x,TQ.y-TQ.z); ctx.rotate(TQ.rot);
    ctx.scale(1,TQ.jerk>0?.72:.6);
    drawPart(ctx,TQ); ctx.restore();
  }

  // loot on the deck and in the air
  for(var dq=0;dq<drops.length;dq++){
    var DQ=drops[dq], zz2=DQ.z||0, sh2=Math.max(.08,1-zz2/200);
    ctx.fillStyle='rgba(0,0,0,'+(.32*sh2)+')';
    ctx.beginPath(); ctx.ellipse(DQ.x,DQ.y,(DQ.cash>0?7:10)*(.6+sh2*.6),(DQ.cash>0?3.5:5)*(.6+sh2*.5),0,0,6.3); ctx.fill();
    if(DQ.cash>0){
      var bob2=DQ.landed?Math.sin(DQ.t*3.2)*1.6:0, big=DQ.cash>=25?1.3:(DQ.cash>=12?1.1:.92);
      if(DQ.landed){ ctx.globalAlpha=.16+Math.abs(Math.sin(DQ.t*2.6))*.2; ctx.fillStyle='#e2b13c';
        ctx.beginPath(); ctx.ellipse(DQ.x,DQ.y,15,8,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(DQ.x,DQ.y-zz2-bob2-(DQ.landed?0:2));
      ctx.rotate(DQ.rot); ctx.scale(big*(1+zz2/320),big*(DQ.landed?.58:1)*(1+zz2/320));
      ctx.fillStyle='#6f8f5e'; rrect(ctx,-9,-5,18,10,1.5); ctx.fill(); outl(ctx,'#20301c',1.6);
      ctx.fillStyle='#87a874'; rrect(ctx,-7.4,-3.6,14.8,7.2,1); ctx.fill();
      ctx.fillStyle='#dfe6cf'; ctx.beginPath(); ctx.ellipse(0,0,3.4,3,0,0,6.3); ctx.fill();
      ctx.fillStyle='#20301c'; ctx.fillRect(-6.6,-2.6,1.6,5.2); ctx.fillRect(5,-2.6,1.6,5.2);
      ctx.restore();
    } else if(DQ.ammo){
      var ab2=DQ.landed?Math.sin(DQ.t*3.1)*2:0;
      if(DQ.landed){ ctx.globalAlpha=.14+Math.abs(Math.sin(DQ.t*2.5))*.2; ctx.fillStyle='#c8a24a';
        ctx.beginPath(); ctx.ellipse(DQ.x,DQ.y,14,7,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(DQ.x,DQ.y-zz2-6-ab2); ctx.rotate(DQ.rot); var az=1+zz2/320; ctx.scale(az,az);
      ctx.fillStyle='#6b5a33'; rrect(ctx,-7,-5,14,10,2); ctx.fill(); outl(ctx,'#15130e',1.6);
      ctx.fillStyle='#c8a24a'; rrect(ctx,-5,-7.5,3.4,5,1); ctx.fill(); rrect(ctx,-.6,-7.5,3.4,5,1); ctx.fill();
      rrect(ctx,3.8,-7.5,3.4,5,1); ctx.fill();
      ctx.restore();
    } else if(DQ.frag){
      var fb=DQ.landed?Math.sin(DQ.t*3.2)*2:0;
      if(DQ.landed){ ctx.globalAlpha=.14+Math.abs(Math.sin(DQ.t*2.4))*.2; ctx.fillStyle='#9db35a';
        ctx.beginPath(); ctx.ellipse(DQ.x,DQ.y,14,7,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(DQ.x,DQ.y-zz2-6-fb); ctx.rotate(DQ.rot); var gz2=1+zz2/320; ctx.scale(gz2,gz2);
      ctx.fillStyle='#4d5a30'; ctx.beginPath(); ctx.ellipse(0,0,5.4,7,0,0,6.3); ctx.fill(); outl(ctx,'#15130e',1.8);
      ctx.strokeStyle='rgba(20,26,10,.6)'; ctx.lineWidth=1.4;
      for(var gq=-1;gq<=1;gq++){ ctx.beginPath(); ctx.moveTo(-5,gq*3.2); ctx.lineTo(5,gq*3.2); ctx.stroke(); }
      ctx.fillStyle='#8a8f7a'; rrect(ctx,-2,-9.5,4,3.4,1); ctx.fill(); outl(ctx,'#15130e',1.3);
      ctx.restore();
      if(DQ.landed&&DQ.frag>1){ ctx.fillStyle='#cfe0a0'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
        ctx.fillText('x'+DQ.frag,DQ.x,DQ.y+12); ctx.textAlign='start'; }
    } else if(DQ.gun){
      var wb=DQ.landed?Math.sin(DQ.t*3)*2:0;
      if(DQ.landed){ ctx.globalAlpha=.14+Math.abs(Math.sin(DQ.t*2.2))*.22; ctx.fillStyle='#d8d2c0';
        ctx.beginPath(); ctx.ellipse(DQ.x,DQ.y,17,8,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(DQ.x,DQ.y-zz2-5-wb);
      ctx.rotate(DQ.landed?DQ.rot*0+.35:DQ.rot); var wz=1+zz2/320; ctx.scale(wz,wz*(DQ.landed?.85:1));
      drawGun(ctx,DQ.gun,0,0); ctx.restore();
      if(DQ.landed&&DQ.life<8){ ctx.globalAlpha=.5+Math.sin(DQ.t*14)*.4; ctx.fillStyle='#d8d2c0';
        ctx.fillRect(DQ.x-10,DQ.y+9,20*(DQ.life/8),2); ctx.globalAlpha=1; }
    } else {
      var TC=TOOLS[DQ.k], bob3=DQ.landed?Math.sin(DQ.t*3.4)*3:0;
      if(DQ.landed){ ctx.globalAlpha=.22+Math.abs(Math.sin(DQ.t*2.2))*.32; ctx.strokeStyle=TC.c; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(DQ.x,DQ.y,15+Math.sin(DQ.t*2.2)*3,0,6.3); ctx.stroke(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(DQ.x,DQ.y-zz2-9-bob3);
      ctx.rotate(DQ.landed?0:DQ.rot); var gz=1+zz2/320; ctx.scale(gz,gz);
      ctx.fillStyle='rgba(22,22,18,.9)'; rrect(ctx,-12,-12,24,24,5); ctx.fill();
      ctx.strokeStyle=TC.c; ctx.lineWidth=2; rrect(ctx,-12,-12,24,24,5); ctx.stroke();
      toolIcon(ctx,DQ.k,21); ctx.restore();
      if(DQ.landed&&DQ.life<6){ ctx.globalAlpha=.5+Math.sin(DQ.t*14)*.4; ctx.fillStyle=TC.c;
        ctx.fillRect(DQ.x-10,DQ.y+8,20*(DQ.life/6),2); ctx.globalAlpha=1; }
    }
  }

  // sentries
  for(var sq=0;sq<sentries.length;sq++){
    var SQ=sentries[sq];
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(SQ.x,SQ.y+2,13,7,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(SQ.x,SQ.y);
    ctx.strokeStyle='#7a6a34'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(-9,7); ctx.moveTo(0,-4); ctx.lineTo(9,7); ctx.moveTo(0,-4); ctx.lineTo(0,9); ctx.stroke();
    ctx.rotate(SQ.ang||0);
    ctx.fillStyle='#c8a24a'; rrect(ctx,-8,-16,15,11,3); ctx.fill(); outl(ctx,'#1a1408',2);
    ctx.fillStyle='#5d5a52'; rrect(ctx,5,-12.5,13,4,1.6); ctx.fill(); outl(ctx,'#1a1408',1.5);
    ctx.fillStyle='#e2b13c'; ctx.beginPath(); ctx.arc(-2,-10.5,2.4,0,6.3); ctx.fill();
    ctx.restore();
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(SQ.x-13,SQ.y-30,26,4);
    ctx.fillStyle='#c8a24a'; ctx.fillRect(SQ.x-12,SQ.y-29,24*(SQ.t/22),2);
  }

  // incoming rounds mark the ground
  for(var stq=0;stq<strikes.length;stq++){
    var STQ=strikes[stq], warn=Math.max(0,Math.min(1,1-STQ.t/1.4));
    ctx.strokeStyle='rgba(230,70,40,'+(.35+warn*.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(STQ.x,STQ.y,46*(1.35-warn*.35),0,6.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(STQ.x-14,STQ.y); ctx.lineTo(STQ.x+14,STQ.y);
    ctx.moveTo(STQ.x,STQ.y-14); ctx.lineTo(STQ.x,STQ.y+14); ctx.stroke();
  }

  // crates drawn later (after flag zones) so they're never covered by flag circles

  // Level 5 mini-nukes: bright warning marker, stylized shell and arcade arc.
  for(var mnq=0;mnq<miniNukes.length;mnq++){
    var NQ=miniNukes[mnq],npr=Math.min(1,NQ.t/NQ.dur),nh=Math.sin(npr*Math.PI)*82;
    ctx.strokeStyle='rgba(235,210,55,'+(.4+npr*.5)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(NQ.tx,NQ.ty,48*(1.35-npr*.35),0,6.3); ctx.stroke();
    ctx.strokeStyle='rgba(230,70,45,'+(.3+npr*.55)+')'; ctx.beginPath(); ctx.arc(NQ.tx,NQ.ty,28,0,6.3); ctx.stroke();
    ctx.save(); ctx.translate(NQ.x,NQ.y-nh); ctx.rotate(NQ.rot);
    ctx.fillStyle='#6d793b'; rrect(ctx,-7,-13,14,26,6); ctx.fill(); outl(ctx,'#242a17',2);
    ctx.fillStyle='#d6c74a'; ctx.beginPath(); ctx.arc(0,0,4,0,6.3); ctx.fill(); ctx.fillStyle='#222'; ctx.font='bold 7px Arial'; ctx.textAlign='center'; ctx.fillText('☢',0,2.5); ctx.textAlign='start';
    ctx.restore();
  }

  // Level 2 grinder shots: tumbling body part projectile with ground shadow.
  for(var msq=0;msq<meatShots.length;msq++){
    var MQ=meatShots[msq],mpr=Math.min(1,MQ.t/MQ.dur),mh=Math.sin(mpr*Math.PI)*55;
    ctx.strokeStyle='rgba(196,74,54,'+(.35+mpr*.5)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(MQ.tx,MQ.ty,36*(1.35-mpr*.35),0,6.3); ctx.stroke();
    // Ground shadow shrinks as the part rises.
    var mshad=1-Math.sin(mpr*Math.PI)*.65;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(MQ.x,MQ.y,10*mshad,5.5*mshad,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(MQ.x,MQ.y-mh); ctx.rotate(MQ.rot); ctx.scale(1.25,1.25);
    drawPart(ctx,{k:MQ.kind||'meat',s:5.5,col:'#59614a',band:'#c0392b',head:0});
    ctx.restore();
  }

  for(var mbq=0;mbq<meatBits.length;mbq++){
    var MBQ=meatBits[mbq]; ctx.save(); ctx.globalAlpha=Math.min(1,MBQ.life*2); ctx.translate(MBQ.x,MBQ.y); ctx.rotate(MBQ.rot);
    ctx.fillStyle='rgba(148,48,40,.78)'; ctx.beginPath(); ctx.ellipse(0,0,MBQ.s*.7,MBQ.s,0,0,6.3); ctx.fill();
    ctx.restore();
  }

  // Level 4 fire bottles: warning circle, glass body and bright arcade flame.
  for(var fbq=0;fbq<fireBottles.length;fbq++){
    var FQ=fireBottles[fbq],fpr=Math.min(1,FQ.t/FQ.dur),fh=Math.sin(fpr*Math.PI)*66;
    ctx.strokeStyle='rgba(255,116,36,'+(.35+fpr*.55)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(FQ.tx,FQ.ty,38*(1.35-fpr*.35),0,6.3); ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(FQ.x,FQ.y,7,4,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(FQ.x,FQ.y-fh); ctx.rotate(FQ.rot);
    var fg=ctx.createLinearGradient(-6,-11,7,12); fg.addColorStop(0,'#b8d8cc'); fg.addColorStop(.45,'#42685d'); fg.addColorStop(1,'#172d29');
    ctx.fillStyle=fg; rrect(ctx,-6,-10,12,21,4); ctx.fill(); outl(ctx,'#14201d',1.8);
    ctx.fillStyle='#b8aa83'; rrect(ctx,-3,-15,6,7,2); ctx.fill();
    ctx.fillStyle='#ff7624'; ctx.beginPath(); ctx.arc(0,-18,6,0,6.3); ctx.fill();
    ctx.fillStyle='#ffe269'; ctx.beginPath(); ctx.arc(0,-20,3.2,0,6.3); ctx.fill(); ctx.restore();
  }

  // Level 1 boss hammers: target marker and exaggerated arcade arc.
  for(var hmq=0;hmq<bossHammers.length;hmq++){
    var HQ=bossHammers[hmq],hpr=Math.min(1,HQ.t/HQ.dur),hh=Math.sin(hpr*Math.PI)*68;
    ctx.strokeStyle='rgba(224,175,55,'+(.35+hpr*.55)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(HQ.tx,HQ.ty,31*(1.4-hpr*.4),0,6.3); ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(HQ.x,HQ.y,8,4,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(HQ.x,HQ.y-hh); ctx.rotate(HQ.rot);
    ctx.fillStyle='#5b3b24'; rrect(ctx,-3,-2,6,18,2); ctx.fill(); outl(ctx,'#24170f',1.5);
    var hg=ctx.createLinearGradient(-12,-10,12,2); hg.addColorStop(0,'#555d62'); hg.addColorStop(.5,'#b9c0c2'); hg.addColorStop(1,'#3a4044');
    ctx.fillStyle=hg; rrect(ctx,-12,-9,24,10,3); ctx.fill(); outl(ctx,'#171a1c',2);
    ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fillRect(-8,-7,10,2); ctx.restore();
  }

  // incoming grenades, with the ground they will land on marked
  for(var bbq=0;bbq<bossBarrels.length;bbq++){
    var BQ=bossBarrels[bbq],bpr=Math.min(1,BQ.t/BQ.dur),bh=Math.sin(bpr*Math.PI)*72;
    ctx.strokeStyle='rgba(255,92,34,'+(.35+bpr*.55)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(BQ.tx,BQ.ty,42*(1.35-bpr*.35),0,6.3); ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(BQ.x,BQ.y,10,6,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(BQ.x,BQ.y-bh); ctx.rotate(BQ.rot);
    ctx.fillStyle='#303638'; rrect(ctx,-9,-13,18,26,4); ctx.fill(); outl(ctx,'#111416',2);
    ctx.strokeStyle='#a7a9a6'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,-7); ctx.lineTo(9,-7); ctx.moveTo(-9,7); ctx.lineTo(9,7); ctx.stroke();
    ctx.fillStyle='#ff9b28'; ctx.beginPath(); ctx.arc(0,-16,6,0,6.3); ctx.fill(); ctx.fillStyle='#ffe15c'; ctx.beginPath(); ctx.arc(0,-18,3,0,6.3); ctx.fill();
    ctx.restore();
  }
  for(var q4=0;q4<enades.length;q4++){
    var EG=enades[q4], pr2=Math.min(1,EG.t/EG.dur);
    var warn=.25+pr2*.6;
    ctx.strokeStyle='rgba(226,90,50,'+warn+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(EG.tx,EG.ty,26*(1.5-pr2*.5),16*(1.5-pr2*.5),0,0,6.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(EG.tx-9,EG.ty); ctx.lineTo(EG.tx+9,EG.ty);
    ctx.moveTo(EG.tx,EG.ty-9); ctx.lineTo(EG.tx,EG.ty+9); ctx.stroke();
    var hgt2=Math.sin(pr2*Math.PI)*30;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(EG.x,EG.y,5,3.5,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(EG.x,EG.y-hgt2); ctx.rotate(EG.rot);
    ctx.fillStyle='#4a4436'; rrect(ctx,-4,-5,8,10,3); ctx.fill(); outl(ctx,'#15130e',1.6);
    ctx.fillStyle='#8a8f7a'; rrect(ctx,-2,-7.5,4,3,1); ctx.fill();
    ctx.restore();
  }

  // grenades
  for(var n=0;n<nades.length;n++){ var g=nades[n];
    var hgt=Math.sin(Math.min(1,g.t/g.dur)*Math.PI)*22;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(g.x,g.y,5,4,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(g.x,g.y-hgt); ctx.rotate(g.spin);
    ctx.fillStyle='#4d5a30'; rrect(ctx,-4,-5,8,10,3); ctx.fill(); outl(ctx,'#15130e',1.6); ctx.restore();
  }

  // Standing squares are ground markings, so render them before characters.
  for(var ds0=0;ds0<padList.length;ds0++){
    var DSP=padList[ds0];
    if(!DSP.mobile&&DSP.standX!==undefined) drawDroneStand(DSP,TOOLS[DSP.kind].c,DSP.cd);
  }
  if(medStation) drawHealSpot(ctx,medStation);

  if(mapKind==='redSquare') for(var mcd=0;mcd<motorcade.length;mcd++) drawMotorcadeCar(ctx,motorcade[mcd]);

  // characters, depth-sorted so nearer figures overlap farther ones
  var units=[];
  for(var e=0;e<enemies.length;e++) units.push(enemies[e]);
  if(!player.dead&&!aboard) units.push(player);
  if(medStation) units.push(medStation);
  for(var cp=0;cp<captives.length;cp++) units.push(captives[cp]);
  for(var dwu=0;dwu<depotWorkers.length;dwu++) if(depotWorkers[dwu].alive) units.push(depotWorkers[dwu]);
  for(var ff=0;ff<fires.length;ff++) units.push(fires[ff]);
  for(var cv=0;cv<civs.length;cv++) units.push(civs[cv]);
  for(var cw=0;cw<crew.length;cw++) units.push(crew[cw]);
  if(tank) units.push(tank);
  units.sort(function(A,B){ return A.y-B.y; });
  for(var u=0;u<units.length;u++){
    var U=units[u], isP=(U===player);
    if(U.nurse){ drawNurse(ctx,U); continue; }
    if(U.captive){ drawCaptive(ctx,U); continue; }
    if(U.depotWorker){ drawDepotWorker(ctx,U); continue; }
    if(U===tank){ drawTank(ctx,U); continue; }
    if(U.kit){ drawCrew(ctx,U); continue; }
    if(U.pet){ drawAnimal(ctx,U); continue; }
    if(U.hair){ drawCiv(ctx,U); continue; }
    if(U.p!==undefined&&U.r!==undefined&&!U.d&&!isP){ drawFire(ctx,U); continue; }
    if(!isP && U.d.laser && U.aim>0){
      var la=U.ang, lx=U.x, ly=U.y;
      for(var st=0;st<520;st+=8){ var nx2=U.x+Math.cos(la)*st, ny2=U.y+Math.sin(la)*st;
        if(blocksShot(T(Math.floor(nx2/TILE),Math.floor(ny2/TILE)))) break; lx=nx2; ly=ny2; }
      ctx.strokeStyle='rgba(255,60,40,'+(.25+.5*(1-U.aim/.85))+')'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(U.x,U.y-20); ctx.lineTo(lx,ly-20); ctx.stroke();
    }
    if(!isP&&U.airfieldBoss){
      drawAirfieldBoss(ctx,U);
    } else if(!isP&&U.oilBoss){
      ctx.save(); ctx.translate(U.x,U.y); ctx.scale(1.16,1.16);
      drawUnit(ctx,0,0,U.ang,'#20252b','#9a2228',U.walk||0,U.amt||0,'heavy','pistol',false,false,true,U.sid||0,0);
      ctx.fillStyle='#6b4028'; ctx.beginPath(); ctx.ellipse(0,-42,9,4,0,0,6.3); ctx.fill();
      ctx.restore();
    } else if(!isP&&U.levelTwoBoss){
      drawLevelTwoBoss(ctx,U);
    } else if(!isP&&U.compoundBoss){
      drawCompoundBoss(ctx,U);
    } else if(!isP&&U.finalBoss){
      drawMountedBoss(ctx,U);
    } else {
      // ── stim aura: three expanding rings, yellow + cyan ───────────────
      if(isP&&player.stim>0){
        var stimFrac=Math.min(1,player.stim/12);
        var stimPulse=(now*3.8)%1;
        ctx.save();
        for(var sw=0;sw<3;sw++){
          var swPhase=(stimPulse+sw/3)%1;
          var swR=13+swPhase*36;
          var swA=(1-swPhase)*0.55*stimFrac;
          var swCol=sw%2===0?'226,177,60':'79,208,138';
          ctx.globalAlpha=swA;
          ctx.strokeStyle='rgba('+swCol+',1)';
          ctx.lineWidth=2.8-swPhase*1.8;
          ctx.beginPath(); ctx.ellipse(U.x,U.y-15,swR*.68,swR,0,0,6.3); ctx.stroke();
        }
        ctx.globalAlpha=1; ctx.restore();
      }
      drawUnit(ctx,U.x,U.y,isP?U.face:U.ang,isP?PK.col:U.d.col,isP?PK.band:U.d.band,
               U.walk||0,U.amt||0,isP?null:U.k,isP?((U.flamer>0)?'flamer':U.wep):gunFor(U.k),false,false,!isP,U.sid||0,isP?(U.recoil||0):0);
    }
    if(!isP&&U.airWorker&&U.carry){
      ctx.save(); ctx.translate(U.x,U.y-17); ctx.fillStyle='#786941'; rrect(ctx,-8,-5,16,10,2); ctx.fill(); outl(ctx,'#241d10',1.5);
      ctx.strokeStyle='#c6a94a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.stroke(); ctx.restore();
    }
    if(U.hurt>0){ ctx.globalAlpha=Math.min(.65,U.hurt*4); ctx.fillStyle=isP?'#ff5a3c':'#fff';
      ctx.beginPath(); ctx.ellipse(U.x,U.y-19,12,20,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(!isP && (U.boss||U.elite)){
      var lbl2=U.airfieldBoss?'KIM JONG UN':(U.oilBoss?'DMITRY MEDVEDEV':(U.levelTwoBoss?'VALERY GERASIMOV':(U.compoundBoss?'YEVGENY PRIGOZHIN':(U.finalBoss?'VLADIMIR PUTIN':(U.boss?(U.elite?'BASE COMMANDER':'COMMANDER'):'ELITE')))));
      var bw2=(U.finalBoss||U.compoundBoss||U.levelTwoBoss||U.oilBoss||U.airfieldBoss)?120:48;
      var bossBarY=U.airfieldBoss?-91:(U.oilBoss?-82:(U.levelTwoBoss?-72:(U.compoundBoss?-78:(U.finalBoss?-82:-69))));
      ctx.fillStyle='rgba(0,0,0,.78)'; ctx.fillRect(U.x-bw2/2,U.y+bossBarY,bw2,7);
      ctx.fillStyle=(U.finalBoss||U.compoundBoss||U.levelTwoBoss||U.oilBoss||U.airfieldBoss)?'#d6332f':(U.elite?'#e2b13c':'#c0392b'); ctx.fillRect(U.x-bw2/2+1,U.y+bossBarY+1,(bw2-2)*(U.hp/U.mx),5);
      ctx.fillStyle=U.elite?'#f2ead2':'#e2b13c'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
      ctx.fillText(lbl2,U.x,U.y+bossBarY-4); ctx.textAlign='start';
    } else if(!isP && U.hp<U.mx){
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(U.x-13,U.y-52,26,4);
      ctx.fillStyle='#d84a34'; ctx.fillRect(U.x-12,U.y-51,24*(U.hp/U.mx),2);
    }
  }

  // bullets
  ctx.lineCap='round';
  for(var b=0;b<bullets.length;b++){ var bu=bullets[b], m=Math.hypot(bu.vx,bu.vy)||1;
    ctx.strokeStyle='rgba(255,226,150,.95)'; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.moveTo(bu.x,bu.y-18); ctx.lineTo(bu.x-bu.vx/m*bu.trail,bu.y-18-bu.vy/m*bu.trail*.6); ctx.stroke();
    ctx.strokeStyle='rgba(255,160,60,.35)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(bu.x,bu.y-18); ctx.lineTo(bu.x-bu.vx/m*bu.trail*.7,bu.y-18-bu.vy/m*bu.trail*.42); ctx.stroke();
  }
  for(var b2=0;b2<eb.length;b2++){ var e2=eb[b2], m2=Math.hypot(e2.vx,e2.vy)||1;
    ctx.strokeStyle='rgba(255,110,90,.9)'; ctx.lineWidth=2.2;
    if(e2.seaSAM){
      ctx.save(); ctx.translate(e2.x,e2.y-18); ctx.rotate(Math.atan2(e2.vy,e2.vx));
      ctx.fillStyle='rgba(255,185,75,.9)'; ctx.beginPath(); ctx.ellipse(-12,0,7,3,0,0,6.3); ctx.fill();
      ctx.fillStyle='#e7ecee'; rrect(ctx,-8,-2.5,20,5,2); ctx.fill(); outl(ctx,'#141a1d',1.3);
      ctx.fillStyle='#c0392b'; rrect(ctx,9,-2.2,4,4.4,1); ctx.fill(); ctx.restore();
    } else if(e2.shell){
      ctx.fillStyle='rgba(255,210,140,.95)';
      ctx.beginPath(); ctx.arc(e2.x,e2.y-18,4.2,0,6.3); ctx.fill();
      ctx.strokeStyle='rgba(255,150,60,.5)'; ctx.lineWidth=6;
      ctx.beginPath(); ctx.moveTo(e2.x,e2.y-18); ctx.lineTo(e2.x-e2.vx/m2*22,e2.y-18-e2.vy/m2*13); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(e2.x,e2.y-18); ctx.lineTo(e2.x-e2.vx/m2*11,e2.y-18-e2.vy/m2*6.6); ctx.stroke();
    }
  }

  // fx
  for(var f=0;f<fx.length;f++){ var F=fx[f], k=F.life/F.max;
    if(F.t==='flash'){
      var fg=Math.atan2(Math.sin(F.a)*.5,Math.cos(F.a));
      ctx.save(); ctx.translate(F.x+Math.cos(fg)*23,F.y-20+Math.sin(fg)*13); ctx.rotate(fg);
      ctx.globalAlpha=k; ctx.fillStyle='#ffe08a';
      var s=(F.s||1)*(0.7+k*.6);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(16*s,-7*s); ctx.lineTo(24*s,0); ctx.lineTo(16*s,7*s); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,220,.9)'; ctx.beginPath(); ctx.arc(2,0,5*s,0,6.3); ctx.fill();
      ctx.globalAlpha=1; ctx.restore();
    } else if(F.t==='spark'){
      ctx.globalAlpha=k; ctx.fillStyle='#ffd27a';
      for(var q=0;q<4;q++){ var a2=q*1.7+F.x, d2=(1-k)*9;
        ctx.fillRect(F.x+Math.cos(a2)*d2,F.y+Math.sin(a2)*d2,2,2); }
      ctx.globalAlpha=1;
    } else if(F.t==='ring'){
      ctx.globalAlpha=k*.7; ctx.strokeStyle='#e8dcc0'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(F.x,F.y,(1-k)*26,0,6.3); ctx.stroke(); ctx.globalAlpha=1;
    } else if(F.t==='miniNuke'){
      var np=1-k,nRise=Math.min(1,np*1.8),nFade=Math.min(1,k*1.7);
      ctx.save(); ctx.globalAlpha=nFade;
      var ng=ctx.createRadialGradient(F.x,F.y,3,F.x,F.y,54+np*38);
      ng.addColorStop(0,'rgba(255,252,210,.95)'); ng.addColorStop(.25,'rgba(255,184,55,.8)'); ng.addColorStop(1,'rgba(255,80,20,0)');
      ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(F.x,F.y,54+np*38,0,6.3); ctx.fill();
      ctx.strokeStyle='rgba(255,220,95,'+(.85*k)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(F.x,F.y,24+np*72,12+np*34,0,0,6.3); ctx.stroke();
      var stemTop=F.y-12-nRise*58;
      var stem=ctx.createLinearGradient(F.x,F.y,F.x,stemTop); stem.addColorStop(0,'rgba(75,67,57,.85)'); stem.addColorStop(.45,'rgba(145,116,78,.9)'); stem.addColorStop(1,'rgba(245,176,70,.82)');
      ctx.fillStyle=stem; rrect(ctx,F.x-9-np*3,stemTop,18+np*6,F.y-stemTop,8); ctx.fill();
      ctx.fillStyle='rgba(72,68,66,'+(.88*nFade)+')'; ctx.beginPath(); ctx.ellipse(F.x,stemTop,28+np*25,13+np*9,0,0,6.3); ctx.fill();
      ctx.fillStyle='rgba(235,177,80,'+(.62*nFade)+')'; ctx.beginPath(); ctx.ellipse(F.x-5,stemTop-3,16+np*12,7+np*5,0,0,6.3); ctx.fill();
      ctx.restore();
    } else if(F.t==='gore'){
      ctx.globalAlpha=k*.85; ctx.fillStyle='rgba(170,22,16,.8)';
      ctx.beginPath(); ctx.arc(F.x,F.y-14,(1-k)*44,0,6.3); ctx.fill();
      ctx.strokeStyle='rgba(214,60,44,'+(k*.7)+')'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(F.x,F.y-14,(1-k)*58,0,6.3); ctx.stroke();
      ctx.globalAlpha=1;
    } else if(F.t==='txt'){
      ctx.globalAlpha=Math.min(1,k*1.5); ctx.fillStyle=F.c||'#e8e4d8';
      ctx.font='bold 13px Arial'; ctx.textAlign='center';
      ctx.fillText(F.s,F.x,F.y-24-(1-k)*22); ctx.textAlign='start'; ctx.globalAlpha=1;
    } else if(F.t==='boom'){
      var rr2=(1-k)*F.r;
      if(F.lobe===undefined){ F.lobe=[]; for(var lb=0;lb<7;lb++)
        F.lobe.push([Math.random()*6.283,.55+Math.random()*.7,.35+Math.random()*.5]); }
      var gg=ctx.createRadialGradient(F.x,F.y,rr2*.2,F.x,F.y,rr2);
      gg.addColorStop(0,'rgba(255,240,180,'+(k*.95)+')');
      gg.addColorStop(.5,'rgba(255,140,40,'+(k*.7)+')');
      gg.addColorStop(1,'rgba(80,40,20,0)');
      ctx.fillStyle=gg;
      ctx.beginPath();
      for(var lb2=0;lb2<F.lobe.length;lb2++){
        var L=F.lobe[lb2];
        ctx.ellipse(F.x+Math.cos(L[0])*rr2*L[2], F.y+Math.sin(L[0])*rr2*L[2]*.8,
                    rr2*L[1], rr2*L[1]*.8, L[0],0,6.3);
      }
      ctx.ellipse(F.x,F.y,rr2*.7,rr2*.58,0,0,6.3);
      ctx.fill();
    }
  }
  // smoke
  for(var s3=0;s3<smoke.length;s3++){ var S=smoke[s3], kk=S.life/S.max;
    if(S.sd===undefined) S.sd=Math.random()*971;
    ctx.fillStyle='rgba(150,145,135,'+(kk*.4)+')';
    var sr3=S.s*(1.4-kk*.5);
    ctx.beginPath();
    for(var lb4=0;lb4<3;lb4++){
      var la2=hs(S.sd+lb4*4.3)*6.283+(1-kk)*1.2, ld2=sr3*(.2+hs(S.sd+lb4*8.1)*.45);
      ctx.ellipse(S.x+Math.cos(la2)*ld2,S.y+Math.sin(la2)*ld2*.8,
                  sr3*(.55+hs(S.sd+lb4*2.7)*.4), sr3*(.45+hs(S.sd+lb4*6.1)*.35), la2,0,6.3);
    }
    ctx.fill(); }

  // smoke columns rolling off the fires
  for(var pq=0;pq<plume.length;pq++){
    var P=plume[pq], pk2=P.life/P.max, age=1-pk2;
    if(P.x<cam.x-140||P.x>cam.x+VW+140||P.y<cam.y-200||P.y>cam.y+VH+140) continue;
    var al=Math.min(.42,pk2*.55)*(P.fall?.5:1);
    if(P.oil){ var ot3=Math.round(30+34*P.hot);
      ctx.fillStyle='rgba('+ot3+','+Math.round(ot3*.9)+','+Math.round(ot3*.82)+','+Math.min(.62,al*1.5)+')'; }
    else if(P.dust){ var dt3=Math.round(176+26*pk2);
      ctx.fillStyle='rgba('+dt3+','+(dt3-8)+','+(dt3-26)+','+(al*.9)+')'; }
    else if(P.hot>.25){ ctx.fillStyle='rgba('+Math.round(120+90*P.hot)+','+Math.round(78+40*P.hot)+',56,'+al+')'; }
    else { var gtone=Math.round(74+age*66); ctx.fillStyle='rgba('+gtone+','+(gtone-4)+','+(gtone-12)+','+al+')'; }
    if(P.sd===undefined) P.sd=Math.random()*971;
    var pr3=P.s*(.7+age*1.5), spin=age*1.4+P.sd*.01;
    ctx.beginPath();
    for(var lb3=0;lb3<4;lb3++){
      var la=hs(P.sd+lb3*3.1)*6.283+spin, ld=pr3*(.18+hs(P.sd+lb3*7.7)*.5);
      ctx.ellipse(P.x+Math.cos(la)*ld, P.y+Math.sin(la)*ld*.8,
                  pr3*(.48+hs(P.sd+lb3*2.3)*.42), pr3*(.4+hs(P.sd+lb3*5.9)*.38),
                  la*.6+spin, 0, 6.3);
    }
    ctx.fill();
  }
  // body parts still in the air
  for(var cq=0;cq<chunks.length;cq++){
    var CQ=chunks[cq], zz=CQ.z||0, sh=Math.max(.05,1-zz/220);
    ctx.fillStyle='rgba(0,0,0,'+(.3*sh)+')';
    ctx.beginPath(); ctx.ellipse(CQ.x,CQ.y,CQ.s*(.8+sh*.8),CQ.s*(.4+sh*.45),0,0,6.3); ctx.fill();
    ctx.save();
    ctx.translate(CQ.x,CQ.y-zz);
    var gs=1+zz/340;                       // rises toward the camera
    ctx.scale(gs,gs*(.55+.45*Math.abs(Math.cos(CQ.sq||0))));  // tumbling end over end
    ctx.rotate(CQ.rot||0);
    drawPart(ctx,CQ);
    ctx.restore();
  }
  // smoke screens
  for(var smq=0;smq<smokes.length;smq++){
    var SMQ=smokes[smq];
    for(var pz=0;pz<9;pz++){
      var aa=pz*.7+now*.35, dd3=SMQ.r*(.25+(pz%3)*.28);
      ctx.fillStyle='rgba(206,204,196,'+(.13+Math.min(.1,SMQ.t*.04))+')';
      ctx.beginPath(); ctx.arc(SMQ.x+Math.cos(aa)*dd3,SMQ.y+Math.sin(aa)*dd3*.8,SMQ.r*.62,0,6.3); ctx.fill();
    }
  }

  if(jetty){
    ctx.fillStyle='rgba(70,54,32,.85)'; rrect(ctx,jetty.x-30,jetty.y-9,52,18,2); ctx.fill();
    ctx.strokeStyle='rgba(38,28,16,.7)'; ctx.lineWidth=1.4;
    for(var jp=0;jp<7;jp++){ ctx.beginPath(); ctx.moveTo(jetty.x-28+jp*7,jetty.y-9);
      ctx.lineTo(jetty.x-28+jp*7,jetty.y+9); ctx.stroke(); }
    ctx.fillStyle='#3a2f1c'; rrect(ctx,jetty.x+18,jetty.y-11,6,22,2); ctx.fill();
    if(gunboat&&!aboard&&Math.hypot(player.x-gunboat.x,player.y-gunboat.y)<70){
      ctx.fillStyle='#8fe0d8'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
      ctx.fillText('HOLD TO BOARD',gunboat.x,gunboat.y-38); ctx.textAlign='start';
    }
    if(aboard&&gunboat&&Math.hypot(gunboat.x-jetty.x,gunboat.y-jetty.y)<70){
      ctx.fillStyle='#e2b13c'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
      ctx.fillText('STOP TO STEP ASHORE',gunboat.x,gunboat.y-38); ctx.textAlign='start';
    }
  }
  if(seaPad) drawPadBay(seaPad,'#3fa8a0','SEA DRONE',seaCD,'usv');
  for(var pd0=0;pd0<padList.length;pd0++){
    var PD0=padList[pd0];
    if(PD0.mobile){
      var ready0=(truck&&truck.down<=0);
      drawPadBay(PD0,ready0?'#9db35a':'#7d786c',
                 ready0?'MOBILE LAUNCH':'TRUCK DOWN',PD0.cd,'truckpad');
      if(ready0&&truck){
        ctx.strokeStyle='rgba(157,179,90,.25)'; ctx.lineWidth=1.4; ctx.setLineDash([6,8]);
        ctx.beginPath(); ctx.moveTo(PD0.x,PD0.y); ctx.lineTo(truck.x,truck.y); ctx.stroke();
        ctx.setLineDash([]);
      }
      continue;
    }
    if(PD0.table) drawDroneTable(PD0,TOOLS[PD0.kind].c,TOOLS[PD0.kind].n,PD0.cd,PD0.kind);
    else drawPadBay(PD0,TOOLS[PD0.kind].c,PD0.n+' PAD',PD0.cd,PD0.kind);
  }
  if(shopPad) drawShopBay();

  // refineries and their SAM belt
  for(var rw=0;rw<refineries.length;rw++){
    var RW=refineries[rw];
    if(RW.cx<cam.x-300||RW.cx>cam.x+VW+300||RW.cy<cam.y-300||RW.cy>cam.y+VH+300) continue;
    if(mapKind==='redSquare'){
      if(RW.dead){
        ctx.fillStyle='rgba(42,31,29,.72)'; rrect(ctx,RW.cx-RW.bw/2,RW.cy-RW.bh/2,RW.bw,RW.bh,8); ctx.fill();
        ctx.strokeStyle='rgba(145,116,104,.7)'; ctx.lineWidth=3;
        for(var rrw=0;rrw<7;rrw++){ ctx.beginPath(); ctx.moveTo(RW.cx-RW.bw*.4+rrw*RW.bw*.13,RW.cy-RW.bh*.3); ctx.lineTo(RW.cx-RW.bw*.25+rrw*RW.bw*.08,RW.cy+RW.bh*.35); ctx.stroke(); }
      } else {
        ctx.fillStyle='rgba(0,0,0,.38)'; rrect(ctx,RW.cx-RW.bw/2+16,RW.cy-RW.bh/2+20,RW.bw,RW.bh,10); ctx.fill();
        // Extruded side and roof planes give the facade a clear three-dimensional silhouette.
        ctx.fillStyle='#64322f'; ctx.beginPath(); ctx.moveTo(RW.cx+RW.bw/2,RW.cy-RW.bh/2); ctx.lineTo(RW.cx+RW.bw/2+18,RW.cy-RW.bh/2+15); ctx.lineTo(RW.cx+RW.bw/2+18,RW.cy+RW.bh/2+15); ctx.lineTo(RW.cx+RW.bw/2,RW.cy+RW.bh/2); ctx.closePath(); ctx.fill(); outl(ctx,'#33201e',2);
        ctx.fillStyle='#7a3833'; ctx.beginPath(); ctx.moveTo(RW.cx-RW.bw/2,RW.cy-RW.bh/2); ctx.lineTo(RW.cx-RW.bw/2+18,RW.cy-RW.bh/2-15); ctx.lineTo(RW.cx+RW.bw/2+18,RW.cy-RW.bh/2-15); ctx.lineTo(RW.cx+RW.bw/2,RW.cy-RW.bh/2); ctx.closePath(); ctx.fill(); outl(ctx,'#3a2926',2);
        var wallGrad=ctx.createLinearGradient(RW.cx-RW.bw/2,RW.cy,RW.cx+RW.bw/2,RW.cy); wallGrad.addColorStop(0,'#74352f'); wallGrad.addColorStop(.32,'#a8483c'); wallGrad.addColorStop(.7,'#c05d4d'); wallGrad.addColorStop(1,'#813b35');
        ctx.fillStyle=wallGrad; rrect(ctx,RW.cx-RW.bw/2,RW.cy-RW.bh/2,RW.bw,RW.bh,8); ctx.fill(); outl(ctx,'#3a2926',3);
        ctx.fillStyle='rgba(255,230,205,.16)'; ctx.fillRect(RW.cx-RW.bw/2+7,RW.cy-RW.bh/2+8,5,RW.bh-16);
        // White ornamental bands, arches and green roof trim echo the reference architecture.
        ctx.fillStyle='#e6d7c4'; ctx.fillRect(RW.cx-RW.bw/2+7,RW.cy-RW.bh*.18,RW.bw-14,7); ctx.fillRect(RW.cx-RW.bw/2+7,RW.cy+RW.bh*.18,RW.bw-14,6);
        ctx.fillStyle='#176b52'; ctx.fillRect(RW.cx-RW.bw/2+4,RW.cy-RW.bh/2+5,RW.bw-8,8);
        for(var wy=0;wy<2;wy++) for(var wx=0;wx<6;wx++){
          var arx=RW.cx-RW.bw*.4+wx*RW.bw*.16,ary=RW.cy-RW.bh*.22+wy*RW.bh*.36;
          ctx.fillStyle='#eadfce'; ctx.beginPath(); ctx.arc(arx,ary,8,Math.PI,0); ctx.lineTo(arx+8,ary+12); ctx.lineTo(arx-8,ary+12); ctx.closePath(); ctx.fill();
          ctx.fillStyle='#394b45'; rrect(ctx,arx-4,ary+2,8,10,3); ctx.fill();
        }
        // Clustered towers and differently patterned onion domes make every target recognizable.
        var domeSets=[['#d0a83d','#f4d77a','wide'],['#2f77b8','#f5f2e8','wide'],['#25845d','#d5b84b','wide'],['#bd3935','#24905f','diamond'],['#d5a438','#287b58','diamond']];
        var ds0=domeSets[RW.i%domeSets.length],ds1=domeSets[(RW.i+1)%domeSets.length],ds2=domeSets[(RW.i+3)%domeSets.length];
        ctx.fillStyle='#b34d3e'; rrect(ctx,RW.cx-17,RW.cy-RW.bh/2-58,34,62,4); ctx.fill(); outl(ctx,'#4b2d27',2);
        ctx.fillStyle='#eadfce'; ctx.fillRect(RW.cx-15,RW.cy-RW.bh/2-39,30,7);
        drawOnionDome(ctx,RW.cx,RW.cy-RW.bh/2-57,58,72,ds0[0],ds0[1],ds0[2]);
        ctx.fillStyle='#a8483c'; rrect(ctx,RW.cx-RW.bw*.28-12,RW.cy-RW.bh/2-33,24,37,4); ctx.fill(); outl(ctx,'#4b2d27',1.8);
        ctx.fillStyle='#a8483c'; rrect(ctx,RW.cx+RW.bw*.28-12,RW.cy-RW.bh/2-33,24,37,4); ctx.fill(); outl(ctx,'#4b2d27',1.8);
        drawOnionDome(ctx,RW.cx-RW.bw*.28,RW.cy-RW.bh/2-32,38,48,ds1[0],ds1[1],ds1[2]);
        drawOnionDome(ctx,RW.cx+RW.bw*.28,RW.cy-RW.bh/2-32,38,48,ds2[0],ds2[1],ds2[2]);
      }
      var redLabelY=RW.cy-RW.bh/2-(RW.dead?47:145);
      ctx.fillStyle='rgba(0,0,0,.7)'; rrect(ctx,RW.cx-70,redLabelY,140,9,3); ctx.fill();
      ctx.fillStyle=RW.dead?'#555':(RW.hp>RW.mx*.45?'#e2b13c':'#d84a34'); rrect(ctx,RW.cx-68,redLabelY+2,136*(RW.hp/RW.mx),5,2); ctx.fill();
      ctx.fillStyle='#f2ead2'; ctx.font='bold 9px Arial'; ctx.textAlign='center'; ctx.fillText(RW.name,RW.cx,redLabelY-5); ctx.textAlign='start';
      continue;
    }
    if(RW.dead){
      ctx.fillStyle='rgba(12,9,7,.5)';
      ctx.beginPath(); ctx.ellipse(RW.cx,RW.cy,150,110,0,0,6.3); ctx.fill();
      continue;
    }
    ctx.fillStyle='rgba(0,0,0,.55)'; rrect(ctx,RW.cx-52,RW.cy-84,104,9,3); ctx.fill();
    ctx.fillStyle=RW.hp>RW.mx*.5?'#4fd08a':(RW.hp>RW.mx*.25?'#e2b13c':'#d84a34');
    rrect(ctx,RW.cx-50.5,RW.cy-82.5,101*(RW.hp/RW.mx),6,2); ctx.fill();
    ctx.fillStyle='#cfd8e0'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
    ctx.fillText('REFINERY '+(RW.i+1),RW.cx,RW.cy-88); ctx.textAlign='start';
  }
  for(var sw=0;sw<sams.length;sw++){
    var SW=sams[sw];
    if(SW.x<cam.x-120||SW.x>cam.x+VW+120||SW.y<cam.y-120||SW.y>cam.y+VH+120) continue;
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(SW.x,SW.y+4,17,9,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(SW.x,SW.y);
    ctx.fillStyle='#4a5142'; rrect(ctx,-13,-7,26,14,3); ctx.fill(); outl(ctx,'#161a12',2);   // launcher body
    ctx.fillStyle='#2f352a'; rrect(ctx,-11,4,7,5,2); ctx.fill(); rrect(ctx,4,4,7,5,2); ctx.fill();
    ctx.rotate(SW.ang);
    ctx.fillStyle='#5b6350'; rrect(ctx,-6,-9,20,7,2); ctx.fill(); outl(ctx,'#161a12',1.8);   // rail one
    ctx.fillStyle='#5b6350'; rrect(ctx,-6,2,20,7,2); ctx.fill(); outl(ctx,'#161a12',1.8);
    ctx.fillStyle='#c9ccd2'; rrect(ctx,0,-8,15,4.5,2); ctx.fill();                            // missiles
    ctx.fillStyle='#c0392b'; rrect(ctx,12,-8,4,4.5,1.5); ctx.fill();
    ctx.fillStyle='#c9ccd2'; rrect(ctx,0,3,15,4.5,2); ctx.fill();
    ctx.fillStyle='#c0392b'; rrect(ctx,12,3,4,4.5,1.5); ctx.fill();
    ctx.fillStyle='#8fa2ae'; ctx.beginPath(); ctx.arc(-9,0,3.4,0,6.3); ctx.fill();             // radar
    ctx.restore();
    if(SW.hurt>0){ ctx.globalAlpha=Math.min(.6,SW.hurt*5); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(SW.x,SW.y,18,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(SW.hp<SW.mx){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(SW.x-14,SW.y-24,28,4);
      ctx.fillStyle='#d84a34'; ctx.fillRect(SW.x-13,SW.y-23.2,26*(SW.hp/SW.mx),2.4); }
  }
  for(var sm9=0;sm9<samShots.length;sm9++){
    var SM9=samShots[sm9];
    ctx.save(); ctx.translate(SM9.x,SM9.y); ctx.rotate(SM9.ang);
    ctx.fillStyle='rgba(255,190,90,.9)'; ctx.beginPath(); ctx.ellipse(-12,0,7,3,0,0,6.3); ctx.fill();
    ctx.fillStyle='#dfe3e8'; rrect(ctx,-8,-2.2,17,4.4,2); ctx.fill(); outl(ctx,'#15181c',1.4);
    ctx.fillStyle='#c0392b'; rrect(ctx,7,-2,4,4,1.4); ctx.fill();
    ctx.restore();
  }

  drawTruck(ctx);
  for(var dtw=0;dtw<depots.length;dtw++) drawDepotTruck(ctx,depots[dtw]);

  // AA mounts around the dumps
  for(var ag2=0;ag2<aaGuns.length;ag2++){
    var AG2=aaGuns[ag2];
    if(AG2.x<cam.x-90||AG2.x>cam.x+VW+90||AG2.y<cam.y-90||AG2.y>cam.y+VH+90) continue;
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(AG2.x,AG2.y+3,15,8,0,0,6.3); ctx.fill();
    // sandbag emplacement
    for(var sb9=0;sb9<7;sb9++){
      var sa9=sb9/7*6.283;
      ctx.fillStyle=shade('#8a7c55',.82+hs(sb9+ag2)*.3);
      rrect(ctx,AG2.x+Math.cos(sa9)*15-5,AG2.y+Math.sin(sa9)*10-3.5,10,7,3); ctx.fill();
      outl(ctx,'#2c2416',1.2);
    }
    ctx.save(); ctx.translate(AG2.x,AG2.y); ctx.rotate(AG2.ang);
    ctx.fillStyle='#3d443c'; ctx.beginPath(); ctx.arc(0,0,7,0,6.3); ctx.fill(); outl(ctx,'#14170f',1.8);
    ctx.fillStyle='#2b322b';                                  // twin barrels
    rrect(ctx,4,-4.2,17,3,1.2); ctx.fill(); rrect(ctx,4,1.2,17,3,1.2); ctx.fill();
    outl(ctx,'#14170f',1.2);
    ctx.fillStyle='#59634a'; rrect(ctx,-8,-5,7,10,2); ctx.fill();
    ctx.fillStyle='#c0392b'; rrect(ctx,-3,-6.5,5,2.4,1); ctx.fill();
    if(AG2.burst>0){                                          // muzzle glow while firing
      ctx.fillStyle='rgba(255,210,120,'+(.4+Math.random()*.5)+')';
      ctx.beginPath(); ctx.ellipse(23,-2.6,5,2.4,0,0,6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(23,2.6,5,2.4,0,0,6.3); ctx.fill();
    }
    ctx.restore();
    if(AG2.hurt>0){ ctx.globalAlpha=Math.min(.6,AG2.hurt*5); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(AG2.x,AG2.y,14,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(AG2.hp<AG2.mx){
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(AG2.x-13,AG2.y-24,26,4);
      ctx.fillStyle='#d84a34'; ctx.fillRect(AG2.x-12,AG2.y-23.2,24*(AG2.hp/AG2.mx),2.4);
    }
    ctx.strokeStyle='rgba(216,74,52,.14)'; ctx.lineWidth=1;   // engagement envelope
    ctx.beginPath(); ctx.arc(AG2.x,AG2.y,420,0,6.3); ctx.stroke();
  }

  // the weapons depots
  for(var dw=0;dw<depots.length;dw++){
    var DW=depots[dw];
    if(DW.cx<cam.x-200||DW.cx>cam.x+VW+200||DW.cy<cam.y-200||DW.cy>cam.y+VH+200) continue;
    if(DW.blown){
      ctx.fillStyle='rgba(14,10,8,.45)';
      ctx.beginPath(); ctx.ellipse(DW.cx,DW.cy,120,84,0,0,6.3); ctx.fill();
      continue;
    }
    // Dense visible stockpiles make the target read as a working ammunition dump.
    for(var ap9=0;ap9<9;ap9++){
      var ac9=ap9%3, ar9=Math.floor(ap9/3), ax9=(DW.x0+1.05+ac9*1.38)*TILE, ay9=(DW.y0+1.05+ar9*.92)*TILE;
      ctx.fillStyle=shade('#77653b',.82+hs(ap9+DW.i*20)*.25); rrect(ctx,ax9,ay9,20,12,2); ctx.fill(); outl(ctx,'#2a2112',1.2);
      ctx.strokeStyle='#c6a548'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax9+3,ay9+6); ctx.lineTo(ax9+17,ay9+6); ctx.stroke();
    }
    for(var wp9=0;wp9<6;wp9++){
      var wx9=(DW.x0+1.12+(wp9%3)*1.38)*TILE, wy9=(DW.y0+1.42+Math.floor(wp9/3)*2.02)*TILE;
      ctx.save(); ctx.translate(wx9,wy9); ctx.rotate(-.22+(wp9%2)*.44); ctx.scale(.7,.7);
      drawGun(ctx,wp9%2?'rifle':'lmg',0,0); ctx.restore();
    }
    ctx.strokeStyle='rgba(226,118,44,.75)'; ctx.lineWidth=2.5; ctx.setLineDash([10,7]);
    rrect(ctx,DW.x0*TILE,DW.y0*TILE,(DW.x1-DW.x0+1)*TILE,(DW.y1-DW.y0+1)*TILE,6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.save(); ctx.translate(DW.cx,DW.y0*TILE-14);
    ctx.fillStyle='#e2762c';                                    // hazard triangle
    ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(11,8); ctx.lineTo(-11,8); ctx.closePath(); ctx.fill();
    outl(ctx,'#2a1405',2);
    ctx.fillStyle='#1a1208'; ctx.fillRect(-1.6,-5,3.2,8); ctx.fillRect(-1.6,4.5,3.2,2.4);
    ctx.restore();
    ctx.fillStyle='rgba(226,118,44,.9)'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
    ctx.fillText('WEAPONS DEPOT',DW.cx,DW.y0*TILE-22);
    ctx.font='bold 7px Arial'; ctx.fillStyle='rgba(226,118,44,.6)';
    var guns9=0;
    for(var gq9=0;gq9<aaGuns.length;gq9++) if(aaGuns[gq9].depot===DW.i) guns9++;
    ctx.fillText(guns9? guns9+' AA MOUNTS ACTIVE':'GUNS SILENCED — PUT ONE INSIDE',
                 DW.cx,(DW.y1+1)*TILE+11); ctx.textAlign='start';
  }

  // each base pole, its circle, and their colours burning beside it
  for(var fq4=0;fq4<flags.length;fq4++){
    var FL2=flags[fq4];
    if(FL2.x<cam.x-160||FL2.x>cam.x+VW+160||FL2.y<cam.y-200||FL2.y>cam.y+VH+160) continue;
    if(FL2.heap){
      var HP2=FL2.heap, bn=HP2.burn;
      ctx.save(); ctx.translate(HP2.x,HP2.y); ctx.rotate(HP2.rot); ctx.scale(1,.62);
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(1,3,21,13,0,0,6.3); ctx.fill();
      var bands=['#eceae6','#2f5aa8','#b8302a'];
      for(var bi3=0;bi3<3;bi3++){
        var f0=HP2.folds[bi3*2], f1=HP2.folds[bi3*2+1], y0=-13+bi3*9;
        ctx.fillStyle=shade(bands[bi3],1-bn*.72);
        ctx.beginPath();
        ctx.moveTo(-19+f0[0],y0+f0[1]);
        ctx.quadraticCurveTo(-6+f0[0],y0-6*f0[2],4+f1[0],y0+f1[1]);
        ctx.quadraticCurveTo(14+f1[0],y0+5*f1[2],20+f0[0],y0+3+f1[1]);
        ctx.lineTo(19+f1[0],y0+10+f0[1]);
        ctx.quadraticCurveTo(4+f0[0],y0+13*f1[2],-18+f1[0],y0+9+f0[1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(24,20,14,'+(.5+bn*.4)+')'; ctx.lineWidth=1.4; ctx.stroke();
      }
      if(bn>.04){
        for(var ch2=0;ch2<12;ch2++){
          if(hs(ch2*3.7)>bn) continue;
          ctx.fillStyle='rgba('+Math.round(22+hs(ch2)*16)+',18,14,'+(.55+bn*.4)+')';
          ctx.beginPath(); ctx.ellipse(-19+hs(ch2*2.3)*38,-13+hs(ch2*5.1)*27,
            2.5+hs(ch2*1.7)*7*bn,2+hs(ch2*4.3)*5*bn,hs(ch2)*3,0,6.3); ctx.fill();
        }
        if(bn<.96) for(var gl=0;gl<7;gl++){
          var ga=hs(gl*7.3)*6.28, gr=10+hs(gl*2.9)*11;
          ctx.fillStyle='rgba(255,'+Math.round(120+hs(gl+now)*110)+',48,'+(.5+Math.sin(now*9+gl)*.3)+')';
          ctx.beginPath(); ctx.ellipse(Math.cos(ga)*gr*1.5,Math.sin(ga)*gr,
            1.6+hs(gl*3.1)*2.4,1.2+hs(gl*5.7)*1.8,ga,0,6.3); ctx.fill();
        }
      }
      ctx.restore();
    }
    var fpx=FL2.x, fpy=FL2.y, H=68;
    drawPole(ctx,fpx,fpy,H,0,FL2.wave,null);
    var lower=Math.min(1,FL2.p), raise=Math.max(0,FL2.p-1);
    if(lower<1&&!FL2.heap) drawWindFlag(ctx,fpx+2,fpy-H+2+(H-26)*lower,32,21,RU,FL2.wave);
    if(raise>0) drawWindFlag(ctx,fpx+2,fpy-6-21-(H-27)*raise,32,21,UA,FL2.wave);
    if(FL2.state==='ready'||FL2.state==='lower'||FL2.state==='raise'){
      var held=(FL2.state!=='ready')&&Math.hypot(player.x-fpx,player.y-fpy)<42;
      ctx.globalAlpha=.14+Math.abs(Math.sin(FL2.wave*2.4))*.12;
      ctx.fillStyle=held?'#f2c744':'#c0562f';
      ctx.beginPath(); ctx.ellipse(fpx,fpy,42,26,0,0,6.3); ctx.fill();
      ctx.globalAlpha=.5+Math.abs(Math.sin(FL2.wave*3))*.4;
      ctx.strokeStyle=held?'#f2c744':'#c0562f'; ctx.lineWidth=3;
      ctx.setLineDash([9,7]); ctx.beginPath(); ctx.ellipse(fpx,fpy,42,26,0,0,6.3); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1;
      if(FL2.state!=='ready'&&!held){
        ctx.fillStyle='#c0562f'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
        ctx.fillText('GET BACK IN THE CIRCLE',fpx,fpy-84); ctx.textAlign='start';
      } else if(FL2.contest){
        ctx.fillStyle='#e07a2c'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
        ctx.fillText('CONTESTED — CLEAR THE CIRCLE',fpx,fpy-84); ctx.textAlign='start';
      }
    }
    if(FL2.state==='lower'||FL2.state==='raise'){
      ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,fpx-30,fpy+10,60,9,4); ctx.fill();
      ctx.fillStyle=FL2.state==='raise'?'#f2c744':'#c0562f';
      rrect(ctx,fpx-28.5,fpy+11.5,57*(FL2.p/2),6,3); ctx.fill();
    }
  }

  for(var bf=0;bf<baseFlags.length;bf++){
    var BF=baseFlags[bf];
    if(BF.x<cam.x-90||BF.x>cam.x+VW+90||BF.y<cam.y-140||BF.y>cam.y+VH+90) continue;
    if(BF.crest===2){
      drawPole(ctx,BF.x,BF.y,BF.h,0,now+bf*1.7,null);
      drawPrintFlag(ctx,BF.x+2,BF.y-BF.h+3,38,26,now+bf*1.7,DRONED,dronedOK,'#ece9df');
    } else if(BF.crest){
      drawPole(ctx,BF.x,BF.y,BF.h,0,now+bf*1.7,null);
      drawCrestFlag(ctx,BF.x+2,BF.y-BF.h+3,32,29,now+bf*1.7);
    } else {
      drawPole(ctx,BF.x,BF.y,BF.h,BF.y-BF.h+3,now+bf*1.7,UA);
    }
  }

  // the flagpole
  if(flag){
    var fpx=flag.x, fpy=flag.y, H=68;
    drawPole(ctx,fpx,fpy,H,0,flag.wave,null);
    var lower=Math.min(1,flag.p), raise=Math.max(0,flag.p-1);
    if(lower<1&&!flag.heap) drawWindFlag(ctx,fpx+2,fpy-H+2+(H-26)*lower,32,21,RU,flag.wave);
    if(raise>0) drawWindFlag(ctx,fpx+2,fpy-6-21-(H-27)*raise,32,21,UA,flag.wave);
    if(flag.state==='ready'||flag.state==='lower'||flag.state==='raise'){
      var held=(flag.state!=='ready')&&Math.hypot(player.x-fpx,player.y-fpy)<42;
      ctx.globalAlpha=.14+Math.abs(Math.sin(flag.wave*2.4))*.12;
      ctx.fillStyle=held?'#f2c744':'#c0562f';
      ctx.beginPath(); ctx.ellipse(fpx,fpy,42,26,0,0,6.3); ctx.fill();
      ctx.globalAlpha=.5+Math.abs(Math.sin(flag.wave*3))*.4;
      ctx.strokeStyle=held?'#f2c744':'#c0562f'; ctx.lineWidth=3;
      ctx.setLineDash([9,7]); ctx.beginPath(); ctx.ellipse(fpx,fpy,42,26,0,0,6.3); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1;
      if(flag.state!=='ready'&&!held){
        ctx.fillStyle='#c0562f'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
        ctx.fillText('GET BACK IN THE CIRCLE',fpx,fpy-84); ctx.textAlign='start';
      } else if(flag.contest){
        ctx.fillStyle='#e07a2c'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
        ctx.fillText('CONTESTED — CLEAR THE CIRCLE',fpx,fpy-84); ctx.textAlign='start';
      }
    }
    if(flag.state==='lower'||flag.state==='raise'){
      ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,fpx-30,fpy+10,60,9,4); ctx.fill();
      ctx.fillStyle=flag.state==='raise'?'#f2c744':'#c0562f';
      rrect(ctx,fpx-28.5,fpy+11.5,57*(flag.p/2),6,3); ctx.fill();
    }
  }

  // crates — drawn after flag zones so they're always visible on top
  for(var i=0;i<crates.length;i++) drawCrate(ctx,crates[i]);

  // bodies in the water
  for(var fo2=0;fo2<floaters.length;fo2++){
    var FO=floaters[fo2];
    if(FO.x<cam.x-60||FO.x>cam.x+VW+60||FO.y<cam.y-60||FO.y>cam.y+VH+60) continue;
    var lift=Math.sin(FO.bob)*1.6, fade=Math.min(1,(120-FO.t)/12);
    ctx.save(); ctx.translate(FO.x,FO.y+lift); ctx.rotate(FO.rot);
    ctx.globalAlpha=.9*fade;
    ctx.fillStyle='rgba(10,26,34,.45)';                       // the hull of the body under water
    ctx.beginPath(); ctx.ellipse(0,2,15,7,0,0,6.3); ctx.fill();
    ctx.fillStyle=shade(FO.col,.72);                          // legs trailing
    rrect(ctx,-13,-3.4,10,3.2,1.6); ctx.fill();
    rrect(ctx,-13,.4,10,3.2,1.6); ctx.fill();
    ctx.fillStyle=FO.col;                                     // torso, low in the water
    rrect(ctx,-5,-5,15,10,4); ctx.fill(); outl(ctx,'#15130e',1.5);
    ctx.fillStyle=shade(FO.col,.86); rrect(ctx,-2,-3.4,8,6.8,2.5); ctx.fill();
    ctx.fillStyle='#e2b13c'; rrect(ctx,-4.5,-4.6,3,9.2,1.4); ctx.fill();   // life vest strap
    if(FO.face){                                              // face down
      ctx.fillStyle=shade(FO.col,1.1); ctx.beginPath(); ctx.arc(11.5,0,4.6,0,6.3); ctx.fill();
      outl(ctx,'#15130e',1.4);
    } else {                                                  // face up
      ctx.fillStyle=SKIN; ctx.beginPath(); ctx.arc(11.5,0,4.4,0,6.3); ctx.fill(); outl(ctx,'#15130e',1.4);
      ctx.fillStyle='#15130e'; ctx.beginPath(); ctx.arc(12.6,-1.4,.9,0,6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(12.6,1.4,.9,0,6.3); ctx.fill();
    }
    ctx.fillStyle=shade(FO.col,.8); rrect(ctx,2,-8.5,7,3.4,1.6); ctx.fill();   // an arm out
    ctx.restore();
    ctx.globalAlpha=.22*fade;                                  // the slick around him
    ctx.fillStyle='#e8f2f6';
    ctx.beginPath(); ctx.ellipse(FO.x,FO.y+lift+1,19,9,FO.rot,0,6.3); ctx.stroke?0:0; ctx.fill();
    ctx.globalAlpha=1;
  }

  // Sea mines: dark floating spheres with warning horns and a red marker light.
  for(var smd=0;mapKind==='sea'&&smd<seaMines.length;smd++){
    var SM=seaMines[smd],mb=Math.sin(now*2.4+SM.bob)*2;
    if(SM.x<cam.x-50||SM.x>cam.x+VW+50||SM.y<cam.y-50||SM.y>cam.y+VH+50) continue;
    ctx.save(); ctx.translate(SM.x,SM.y+mb);
    ctx.fillStyle='rgba(4,14,20,.35)'; ctx.beginPath(); ctx.ellipse(2,7,16,7,0,0,6.3); ctx.fill();
    ctx.fillStyle='#252d31'; ctx.beginPath(); ctx.arc(0,0,12,0,6.3); ctx.fill(); outl(ctx,'#0b1012',2);
    ctx.strokeStyle='#59666b'; ctx.lineWidth=3;
    for(var mh0=0;mh0<8;mh0++){ var ma0=mh0/8*6.283; ctx.beginPath(); ctx.moveTo(Math.cos(ma0)*9,Math.sin(ma0)*9); ctx.lineTo(Math.cos(ma0)*17,Math.sin(ma0)*17); ctx.stroke(); }
    ctx.fillStyle='#cf342d'; ctx.beginPath(); ctx.arc(0,-2,2.5,0,6.3); ctx.fill();
    ctx.strokeStyle='rgba(220,235,240,.28)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(-3,-3,6,3.4,5.2); ctx.stroke();
    ctx.restore();
  }

  // the fleet
  for(var sq4=0;sq4<ships.length;sq4++){
    var SP2=ships[sq4];
    if(SP2.x<cam.x-260||SP2.x>cam.x+VW+260||SP2.y<cam.y-260||SP2.y>cam.y+VH+260) continue;
    var L2=SP2.len, W2=SP2.wid, sinkK=SP2.sink>0?(SP2.sink/4.5):1;
    ctx.save(); ctx.translate(SP2.x,SP2.y); ctx.rotate(SP2.ang);
    if(SP2.sink>0){ ctx.globalAlpha=Math.max(.15,sinkK); ctx.scale(.75+sinkK*.25,.75+sinkK*.25); }
    ctx.fillStyle='rgba(6,20,28,.5)';
    ctx.beginPath(); ctx.ellipse(4,6,L2*.55,W2*.62,0,0,6.3); ctx.fill();
    ctx.fillStyle='#5d6570';                                     // hull
    ctx.beginPath();
    ctx.moveTo(L2*.5,0); ctx.quadraticCurveTo(L2*.28,-W2*.5,-L2*.34,-W2*.5);
    ctx.lineTo(-L2*.5,-W2*.36); ctx.lineTo(-L2*.5,W2*.36);
    ctx.lineTo(-L2*.34,W2*.5); ctx.quadraticCurveTo(L2*.28,W2*.5,L2*.5,0);
    ctx.closePath(); ctx.fill(); outl(ctx,'#12181e',2.4);
    ctx.fillStyle='#4a515a'; ctx.beginPath();
    ctx.moveTo(L2*.42,0); ctx.lineTo(-L2*.42,-W2*.3); ctx.lineTo(-L2*.42,W2*.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#79828d'; rrect(ctx,-L2*.16,-W2*.32,L2*.36,W2*.64,4); ctx.fill(); outl(ctx,'#12181e',2);
    ctx.fillStyle='#98a2ad'; rrect(ctx,-L2*.05,-W2*.2,L2*.16,W2*.4,3); ctx.fill(); outl(ctx,'#12181e',1.6);
    ctx.fillStyle='#3c434b'; rrect(ctx,-L2*.3,-3,L2*.1,6,2); ctx.fill();
    ctx.fillStyle='#2f353c';                                     // mast and radar
    rrect(ctx,-L2*.02,-2.4,4,4.8,1.5); ctx.fill();
    ctx.strokeStyle='#d8dee4'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(0,0,9,now*2%6.283,now*2%6.283+2.2); ctx.stroke();
    ctx.fillStyle='#3c434b';                                     // turrets fore and aft
    ctx.beginPath(); ctx.arc(L2*.3,0,7,0,6.3); ctx.fill(); outl(ctx,'#12181e',1.8);
    ctx.fillStyle='#2a3038'; rrect(ctx,L2*.3,-2,14,4,1.6); ctx.fill();
    ctx.fillStyle='#3c434b'; ctx.beginPath(); ctx.arc(-L2*.36,0,6,0,6.3); ctx.fill(); outl(ctx,'#12181e',1.6);
    ctx.fillStyle='#c0392b'; rrect(ctx,-L2*.46,-2,6,4,1.4); ctx.fill();
    if(SP2.boss3&&SP2.sink<=0){
      var deckAim=(drone&&piloting)?Math.atan2(drone.y-SP2.y,drone.x-SP2.x)-SP2.ang:now*.55;
      var gunPos=[[L2*.18,-W2*.31],[L2*.18,W2*.31],[-L2*.25,-W2*.3],[-L2*.25,W2*.3]];
      for(var cg3=0;cg3<gunPos.length;cg3++){
        ctx.save(); ctx.translate(gunPos[cg3][0],gunPos[cg3][1]); ctx.rotate(deckAim);
        ctx.fillStyle='#343d45'; ctx.beginPath(); ctx.arc(0,0,5.5,0,6.3); ctx.fill(); outl(ctx,'#10161b',1.4);
        ctx.fillStyle='#202930'; rrect(ctx,2,-3.2,17,2.2,1); ctx.fill(); rrect(ctx,2,1,17,2.2,1); ctx.fill(); ctx.restore();
      }
      for(var side3=-1;side3<=1;side3+=2){
        ctx.save(); ctx.translate(-L2*.08,side3*W2*.34); ctx.rotate(side3*.12);
        ctx.fillStyle='#47535c'; rrect(ctx,-13,-7,28,14,3); ctx.fill(); outl(ctx,'#11181d',1.5);
        for(var tube3=0;tube3<4;tube3++){ ctx.fillStyle='#222c32'; ctx.beginPath(); ctx.arc(-8+tube3*6,0,2.2,0,6.3); ctx.fill(); }
        ctx.restore();
      }
      ctx.fillStyle='#d7dde0'; ctx.beginPath(); ctx.arc(-L2*.02,-W2*.02,7.5,Math.PI,6.283); ctx.fill(); outl(ctx,'#303a40',1.3);
      ctx.strokeStyle='#b8c6cc'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(-L2*.02,0); ctx.lineTo(-L2*.02,-25); ctx.moveTo(-L2*.02,-20); ctx.lineTo(-L2*.02+11,-12); ctx.stroke();
      ctx.strokeStyle='rgba(218,226,230,.72)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-L2*.43,-W2*.4); ctx.lineTo(L2*.38,-W2*.4); ctx.moveTo(-L2*.43,W2*.4); ctx.lineTo(L2*.38,W2*.4); ctx.stroke();
      for(var vent3=-2;vent3<=2;vent3++){ ctx.fillStyle='#303941'; rrect(ctx,-L2*.18+vent3*10,-3,6,6,1.5); ctx.fill(); }
      ctx.fillStyle='#e6c34c'; rrect(ctx,L2*.02,-W2*.08,20,W2*.16,2); ctx.fill();
      ctx.fillStyle='#2d353b'; rrect(ctx,L2*.02+3,-W2*.05,14,W2*.1,1); ctx.fill();
    }
    if(SP2.boss3&&SP2.sink<=0){
      // Admiral seated high on the command deck, facing the bow.
      ctx.save(); ctx.translate(-L2*.03,0); ctx.scale(1.55,1.55);
      ctx.fillStyle='#293038'; rrect(ctx,-10,-11,18,22,4); ctx.fill(); outl(ctx,'#11161b',1.8); // chair
      ctx.fillStyle='#f0f3f5'; rrect(ctx,-5,-9,13,18,5); ctx.fill(); outl(ctx,'#15212b',1.5);   // striped shirt
      ctx.fillStyle='#2e6fa3';
      for(var st3=-7;st3<=7;st3+=5){ rrect(ctx,-4,st3,11,2.2,1); ctx.fill(); }
      ctx.fillStyle='#d2a27f';
      ctx.beginPath(); ctx.arc(9,0,6.5,0,6.3); ctx.fill(); outl(ctx,'#15130e',1.5);             // head
      ctx.fillStyle='#5a4b3e'; ctx.beginPath(); ctx.arc(8,0,6.7,3.45,5.95); ctx.lineTo(8,0); ctx.fill();
      // Strong readable facial features at gameplay scale.
      ctx.fillStyle='#182027'; ctx.beginPath(); ctx.arc(11.5,-2.2,1.05,0,6.3); ctx.arc(11.5,2.2,1.05,0,6.3); ctx.fill();
      ctx.strokeStyle='#59402f'; ctx.lineWidth=1.1;
      ctx.beginPath(); ctx.moveTo(10,-3.7); ctx.lineTo(13,-3.2); ctx.moveTo(10,3.7); ctx.lineTo(13,3.2); ctx.stroke();
      ctx.strokeStyle='#7b493b'; ctx.beginPath(); ctx.moveTo(14,-2.2); ctx.lineTo(15,0); ctx.lineTo(14,2.2); ctx.stroke();
      ctx.strokeStyle='#542c29'; ctx.beginPath(); ctx.moveTo(11.8,-2.5); ctx.quadraticCurveTo(13.2,0,11.8,2.5); ctx.stroke();
      ctx.fillStyle='#d2a27f'; rrect(ctx,-1,-13,11,3.5,1.7); ctx.fill(); rrect(ctx,-1,9.5,11,3.5,1.7); ctx.fill();
      ctx.restore();
    }
    if(SP2.lander&&SP2.landed){
      ctx.fillStyle='#737b82'; rrect(ctx,L2*.38,-W2*.34,L2*.42,W2*.68,2); ctx.fill(); outl(ctx,'#12181e',1.8);
      ctx.strokeStyle='#343b42'; ctx.lineWidth=1.3;
      for(var rramp=0;rramp<4;rramp++){
        ctx.beginPath(); ctx.moveTo(L2*(.44+rramp*.09),-W2*.28); ctx.lineTo(L2*(.44+rramp*.09),W2*.28); ctx.stroke();
      }
    }
    if(SP2.hurt>0){ ctx.globalAlpha=Math.min(.6,SP2.hurt*3); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.ellipse(0,0,L2*.5,W2*.5,0,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    ctx.restore();
    if(SP2.sink<=0){
      ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,SP2.x-40,SP2.y-W2*.5-22,80,8,3); ctx.fill();
      ctx.fillStyle=SP2.hp>SP2.mx*.5?'#4fd08a':(SP2.hp>SP2.mx*.25?'#e2b13c':'#d84a34');
      rrect(ctx,SP2.x-38.5,SP2.y-W2*.5-20.5,77*(SP2.hp/SP2.mx),5,2); ctx.fill();
      ctx.fillStyle='#cfd8e0'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
      ctx.fillText(SP2.name,SP2.x,SP2.y-W2*.5-26); ctx.textAlign='start';
    }
  }
  // parked aircraft on the airfield
  for(var acd=0;acd<aircraft.length;acd++) drawAircraft(ctx,aircraft[acd]);

  // missiles running in
  for(var mq=0;mq<missiles.length;mq++){
    var MQ2=missiles[mq], mh=Math.sin(Math.min(1,MQ2.t/MQ2.dur)*Math.PI)*40;
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(MQ2.x,MQ2.y,6,3,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(MQ2.x,MQ2.y-mh); ctx.rotate(Math.atan2(MQ2.ty-MQ2.sy,MQ2.tx-MQ2.sx));
    ctx.fillStyle='#c9ccd2'; rrect(ctx,-9,-2.6,18,5.2,2.4); ctx.fill(); outl(ctx,'#15181c',1.5);
    ctx.fillStyle='#c0392b'; rrect(ctx,7,-2.2,4,4.4,1.6); ctx.fill();
    ctx.fillStyle='rgba(255,190,90,.9)'; ctx.beginPath(); ctx.ellipse(-11,0,4.5,2.6,0,0,6.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(226,90,50,.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(MQ2.tx,MQ2.ty,24,14,0,0,6.3); ctx.stroke();
  }

  // their drones
  for(var eq5=0;eq5<edrones.length;eq5++){
    var ED2=edrones[eq5], ealt=30+Math.sin(ED2.bob)*4;
    if(ED2.x<cam.x-90||ED2.x>cam.x+VW+90||ED2.y<cam.y-140||ED2.y>cam.y+VH+90) continue;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(ED2.x,ED2.y,9,4.5,0,0,6.3); ctx.fill();
    if(ED2.state==='hunt'){
      ctx.globalAlpha=.3+Math.abs(Math.sin(now*7))*.4;
      ctx.strokeStyle='#d84a34'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(ED2.x,ED2.y-ealt,16,0,6.3); ctx.stroke(); ctx.globalAlpha=1;
    }
    ctx.save(); ctx.translate(ED2.x,ED2.y-ealt); ctx.rotate(Math.atan2(ED2.vy,ED2.vx)+Math.PI/2);
    ctx.strokeStyle='#3b3229'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(8,8); ctx.moveTo(8,-8); ctx.lineTo(-8,8); ctx.stroke();
    var rp2=[[-8,-8],[8,-8],[-8,8],[8,8]];
    for(var rq2=0;rq2<4;rq2++){
      ctx.strokeStyle='rgba(190,170,150,'+(.25+Math.sin(ED2.rot*3+rq2)*.18)+')'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(rp2[rq2][0],rp2[rq2][1],5.6,0,6.3); ctx.stroke();
    }
    ctx.fillStyle='#57604a'; rrect(ctx,-5.5,-6.5,11,13,3); ctx.fill(); outl(ctx,'#15130e',1.8);
    ctx.fillStyle='#c0392b'; rrect(ctx,-3.5,-10,7,4.5,2); ctx.fill(); outl(ctx,'#15130e',1.5);
    ctx.fillStyle='#e2b13c'; ctx.beginPath(); ctx.arc(0,3.5,2.2,0,6.3); ctx.fill();
    ctx.restore();
    if(ED2.hurt>0){ ctx.globalAlpha=Math.min(.7,ED2.hurt*5); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(ED2.x,ED2.y-ealt,13,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(ED2.hp<ED2.mx){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(ED2.x-11,ED2.y-ealt-20,22,3.5);
      ctx.fillStyle='#d84a34'; ctx.fillRect(ED2.x-10,ED2.y-ealt-19.3,20*(ED2.hp/ED2.mx),2); }
  }
  // jammer pulse
  for(var ez=0;ez<emps.length;ez++){
    var EZ=emps[ez], ek=1-EZ.t/.75;
    ctx.strokeStyle='rgba(127,232,255,'+(ek*.85)+')'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(EZ.x,EZ.y-16,EZ.r,0,6.3); ctx.stroke();
    ctx.strokeStyle='rgba(210,250,255,'+(ek*.5)+')'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(EZ.x,EZ.y-16,EZ.r*.82,0,6.3); ctx.stroke();
    for(var ar=0;ar<9;ar++){
      var aa2=ar*.7+now*3, r1=EZ.r*.55, r2=EZ.r;
      ctx.strokeStyle='rgba(160,240,255,'+(ek*.55)+')'; ctx.lineWidth=1.8;
      ctx.beginPath();
      ctx.moveTo(EZ.x+Math.cos(aa2)*r1,EZ.y-16+Math.sin(aa2)*r1*.8);
      ctx.lineTo(EZ.x+Math.cos(aa2+.12)*(r1+r2)/2,EZ.y-16+Math.sin(aa2+.12)*((r1+r2)/2)*.8);
      ctx.lineTo(EZ.x+Math.cos(aa2-.06)*r2,EZ.y-16+Math.sin(aa2-.06)*r2*.8);
      ctx.stroke();
    }
  }

  // the gunboat
  if(gunboat){
    var G2=gunboat, gsp=Math.hypot(G2.vx,G2.vy);
    if(gsp>25){
      ctx.strokeStyle='rgba(232,244,250,'+(.12+Math.min(.28,gsp/500))+')'; ctx.lineWidth=3;
      for(var gv=-1;gv<=1;gv+=2){
        ctx.beginPath();
        ctx.moveTo(G2.x+Math.cos(G2.ang)*30,G2.y+Math.sin(G2.ang)*30);
        ctx.lineTo(G2.x+Math.cos(G2.ang+gv*.85)*(-34),G2.y+Math.sin(G2.ang+gv*.85)*(-34));
        ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(G2.x,G2.y); ctx.rotate(G2.ang);
    ctx.fillStyle='rgba(6,22,30,.45)';
    ctx.beginPath(); ctx.ellipse(-2,4,34,13,0,0,6.3); ctx.fill();
    ctx.fillStyle='#5a6470';                                    // hull
    ctx.beginPath();
    ctx.moveTo(34,0); ctx.quadraticCurveTo(20,-11,-8,-12);
    ctx.lineTo(-30,-10); ctx.quadraticCurveTo(-34,0,-30,10);
    ctx.lineTo(-8,12); ctx.quadraticCurveTo(20,11,34,0);
    ctx.closePath(); ctx.fill(); outl(ctx,'#0d161d',2.4);
    ctx.fillStyle='#404a55'; rrect(ctx,-24,-8,44,16,4); ctx.fill();
    ctx.fillStyle='#6f7b86'; rrect(ctx,-14,-8,20,16,4); ctx.fill(); outl(ctx,'#0d161d',1.8);  // cabin
    ctx.fillStyle='#2b333c'; rrect(ctx,-9,-5.5,9,11,2); ctx.fill();
    ctx.fillStyle='#2f363c'; rrect(ctx,-28,-3,6,6,2); ctx.fill();
    ctx.strokeStyle='#c9d2d8'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(-22,-12); ctx.stroke();                    // mast
    ctx.fillStyle='#2f7fd0'; rrect(ctx,-24,-15,9,5,1.4); ctx.fill();                          // colours
    ctx.fillStyle='#f2c744'; rrect(ctx,-24,-10.5,9,4.5,1.4); ctx.fill();
    ctx.restore();
    // bow gun, tracking independently
    ctx.save(); ctx.translate(G2.x+Math.cos(G2.ang)*18,G2.y+Math.sin(G2.ang)*18); ctx.rotate(G2.turret);
    ctx.fillStyle='#3d454e'; ctx.beginPath(); ctx.arc(0,0,8,0,6.3); ctx.fill(); outl(ctx,'#0d161d',2);
    ctx.fillStyle='#2a3138'; rrect(ctx,4,-2.6,20,5.2,2); ctx.fill(); outl(ctx,'#0d161d',1.6);
    ctx.fillStyle='#8fa2ae'; rrect(ctx,-6,-3,5,6,1.6); ctx.fill();
    ctx.restore();
    if(aboard){                                                   // the man at the helm
      ctx.save(); ctx.translate(G2.x-Math.cos(G2.ang)*6,G2.y-Math.sin(G2.ang)*6-4);
      ctx.scale(.82,.82);
      drawUnit(ctx,0,0,G2.turret,PK.col,PK.band,0,0,null,'pistol',false,false,false,3);
      ctx.restore();
    }
    if(G2.hurt>0){ ctx.globalAlpha=Math.min(.6,G2.hurt*4); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.ellipse(G2.x,G2.y,34,13,G2.ang,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(G2.hp<G2.mx){
      ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,G2.x-26,G2.y-30,52,6,3); ctx.fill();
      ctx.fillStyle=G2.hp>G2.mx*.5?'#4fd08a':(G2.hp>G2.mx*.25?'#e2b13c':'#d84a34');
      rrect(ctx,G2.x-24.5,G2.y-28.5,49*(G2.hp/G2.mx),3,2); ctx.fill();
    }
  }

  // the sea drone: a long low hull, sitting in the water
  if(drone&&drone.kind==='usv'){
    var U2=drone, spd2=Math.hypot(U2.vx,U2.vy), hd=Math.atan2(U2.vy,U2.vx);
    if(spd2<6) hd=U2.ang;
    var roll=Math.sin(now*4)*.035, L3=46, W4=13;
    // bow spray and propeller wash
    if(spd2>30){
      ctx.strokeStyle='rgba(232,244,250,'+(.12+Math.min(.3,spd2/700))+')'; ctx.lineWidth=2.6;
      for(var sv2=-1;sv2<=1;sv2+=2){
        ctx.beginPath();
        ctx.moveTo(U2.x+Math.cos(hd)*L3*.42,U2.y+Math.sin(hd)*L3*.42);
        ctx.lineTo(U2.x+Math.cos(hd+sv2*.9)*(-L3*.5),U2.y+Math.sin(hd+sv2*.9)*(-L3*.5));
        ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(U2.x,U2.y); ctx.rotate(hd); ctx.scale(1,.92+roll);
    ctx.fillStyle='rgba(6,22,30,.45)';
    ctx.beginPath(); ctx.ellipse(-2,4,L3*.52,W4*.62,0,0,6.3); ctx.fill();
    // hull
    ctx.fillStyle='#4a5560';
    ctx.beginPath();
    ctx.moveTo(L3*.52,0);
    ctx.quadraticCurveTo(L3*.30,-W4*.44,-L3*.10,-W4*.5);
    ctx.lineTo(-L3*.48,-W4*.42);
    ctx.quadraticCurveTo(-L3*.54,0,-L3*.48,W4*.42);
    ctx.lineTo(-L3*.10,W4*.5);
    ctx.quadraticCurveTo(L3*.30,W4*.44,L3*.52,0);
    ctx.closePath(); ctx.fill(); outl(ctx,'#0d161d',2.2);
    // deck, darker down the centreline
    ctx.fillStyle='#39434d';
    ctx.beginPath();
    ctx.moveTo(L3*.44,0);
    ctx.quadraticCurveTo(L3*.24,-W4*.26,-L3*.34,-W4*.28);
    ctx.lineTo(-L3*.40,0); ctx.lineTo(-L3*.34,W4*.28);
    ctx.quadraticCurveTo(L3*.24,W4*.26,L3*.44,0);
    ctx.closePath(); ctx.fill();
    // dazzle panels
    ctx.fillStyle='rgba(126,142,156,.5)';
    ctx.beginPath(); ctx.moveTo(L3*.10,-W4*.34); ctx.lineTo(L3*.26,-W4*.1);
    ctx.lineTo(-L3*.02,-W4*.12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-L3*.18,W4*.36); ctx.lineTo(-L3*.02,W4*.12);
    ctx.lineTo(-L3*.34,W4*.14); ctx.closePath(); ctx.fill();
    // warhead section in the bow
    ctx.fillStyle='#2a3138';
    ctx.beginPath(); ctx.moveTo(L3*.52,0); ctx.lineTo(L3*.26,-W4*.3);
    ctx.lineTo(L3*.26,W4*.3); ctx.closePath(); ctx.fill(); outl(ctx,'#0d161d',1.6);
    ctx.fillStyle='#c0392b'; rrect(ctx,L3*.30,-2,7,4,1.5); ctx.fill();
    // sensor mast with camera ball and whip aerial
    ctx.fillStyle='#5d6a74'; rrect(ctx,-L3*.04,-4.5,10,9,3); ctx.fill(); outl(ctx,'#0d161d',1.6);
    ctx.fillStyle='#8fa2ae'; ctx.beginPath(); ctx.arc(L3*.10,0,3.6,0,6.3); ctx.fill(); outl(ctx,'#0d161d',1.4);
    ctx.fillStyle='#7fe8ff'; ctx.beginPath(); ctx.arc(L3*.11,0,1.5,0,6.3); ctx.fill();
    ctx.strokeStyle='#3a444c'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(-L3*.02,0); ctx.lineTo(-L3*.16,-9); ctx.stroke();
    // stern jets
    ctx.fillStyle='#2a3138';
    rrect(ctx,-L3*.52,-W4*.3,6,5,2); ctx.fill(); rrect(ctx,-L3*.52,W4*.06,6,5,2); ctx.fill();
    if(spd2>30){
      ctx.fillStyle='rgba(226,242,248,'+(.2+Math.min(.35,spd2/600))+')';
      ctx.beginPath(); ctx.ellipse(-L3*.62,0,9,W4*.5,0,0,6.3); ctx.fill();
    }
    ctx.restore();
    if(U2.hp<U2.mx){
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(U2.x-20,U2.y-26,40,4.5);
      ctx.fillStyle=U2.hp>U2.mx*.5?'#7fe8ff':(U2.hp>U2.mx*.25?'#e2b13c':'#d84a34');
      ctx.fillRect(U2.x-19,U2.y-25.2,38*(U2.hp/U2.mx),3);
    }
  }
  for(var wd=0;wd<wingmen.length;wd++){
    var WD=wingmen[wd], walt=34;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(WD.x,WD.y,10,5,0,0,6.3); ctx.fill();
    ctx.save(); ctx.translate(WD.x,WD.y-walt);
    ctx.rotate(Math.atan2(WD.vy,WD.vx)+Math.PI/2); ctx.scale(1.35,1.35);
    ctx.strokeStyle='#3b4249'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(-9,-9); ctx.lineTo(9,9); ctx.moveTo(9,-9); ctx.lineTo(-9,9); ctx.stroke();
    var rpw=[[-9,-9],[9,-9],[-9,9],[9,9]];
    for(var rw=0;rw<4;rw++){
      ctx.strokeStyle='rgba(180,206,220,'+(.3+Math.sin(WD.rot*3+rw)*.18)+')'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(rpw[rw][0],rpw[rw][1],6.2,0,6.3); ctx.stroke();
    }
    ctx.fillStyle='#4f86b8'; rrect(ctx,-6,-7,12,14,3); ctx.fill(); outl(ctx,'#0d1418',2);
    ctx.fillStyle='#d8402c'; rrect(ctx,-4,-11,8,5,2); ctx.fill(); outl(ctx,'#0d1418',1.6);
    ctx.fillStyle='#8fd4f0'; ctx.beginPath(); ctx.arc(0,4,2.6,0,6.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(120,200,240,.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(WD.x,WD.y); ctx.lineTo(WD.x,WD.y-walt); ctx.stroke();
    if(WD.hurt>0){ ctx.globalAlpha=Math.min(.7,WD.hurt*5); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(WD.x,WD.y-walt,16,0,6.3); ctx.fill(); ctx.globalAlpha=1; }
    if(WD.hp<WD.mx){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(WD.x-13,WD.y-walt-22,26,3.5);
      ctx.fillStyle='#7fe8ff'; ctx.fillRect(WD.x-12,WD.y-walt-21.4,24*(WD.hp/WD.mx),2); }
  }
  if(drone&&piloting&&wingmen.length){                       // formation tie-lines
    ctx.strokeStyle='rgba(127,232,255,.22)'; ctx.lineWidth=1.4; ctx.setLineDash([5,6]);
    for(var wl=0;wl<wingmen.length;wl++){
      ctx.beginPath(); ctx.moveTo(drone.x,drone.y-34);
      ctx.lineTo(wingmen[wl].x,wingmen[wl].y-34); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // the air drone
  if(drone&&drone.kind!=='usv'){
    var alt=34;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(drone.x,drone.y,10,5,0,0,6.3); ctx.fill();
    var dsc=drone.kind==='droneL'?1.35:(drone.kind==='droneS'?.78:1);
    ctx.save(); ctx.translate(drone.x,drone.y-alt); ctx.rotate(drone.ang+Math.PI/2); ctx.scale(dsc,dsc);
    ctx.strokeStyle='#3b4249'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(-9,-9); ctx.lineTo(9,9); ctx.moveTo(9,-9); ctx.lineTo(-9,9); ctx.stroke();
    var rp=[[-9,-9],[9,-9],[-9,9],[9,9]];
    for(var rq=0;rq<4;rq++){
      ctx.strokeStyle='rgba(180,206,220,'+(.3+Math.sin(drone.rot*3+rq)*.18)+')'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(rp[rq][0],rp[rq][1],6.2,0,6.3); ctx.stroke();
      ctx.strokeStyle='rgba(220,235,245,.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(rp[rq][0]-5,rp[rq][1]); ctx.lineTo(rp[rq][0]+5,rp[rq][1]);
      ctx.stroke();
    }
    ctx.fillStyle='#586570'; rrect(ctx,-6,-7,12,14,3); ctx.fill(); outl(ctx,'#0d1418',2);
    ctx.fillStyle='#d8402c'; rrect(ctx,-4,-11,8,5,2); ctx.fill(); outl(ctx,'#0d1418',1.6);
    ctx.fillStyle='#8fd4f0'; ctx.beginPath(); ctx.arc(0,4,2.6,0,6.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(120,200,240,.35)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(drone.x,drone.y); ctx.lineTo(drone.x,drone.y-alt); ctx.stroke();
  }

  // flame
  for(var fq5=0;fq5<flames.length;fq5++){
    var FQ2=flames[fq5], fk2=FQ2.life/FQ2.max;
    if(fk2>.62){ ctx.fillStyle='rgba(255,'+Math.round(230*fk2+20)+',150,'+(fk2*.9)+')'; }
    else if(fk2>.3){ ctx.fillStyle='rgba(255,'+Math.round(120+140*fk2)+',40,'+(fk2*.85)+')'; }
    else { ctx.fillStyle='rgba('+Math.round(90+60*fk2)+','+Math.round(80+40*fk2)+',72,'+(fk2*.5)+')'; }
    ctx.beginPath(); ctx.arc(FQ2.x,FQ2.y-12,FQ2.s*(1.3-fk2*.4),0,6.3); ctx.fill();
  }
  // blood hanging in the air
  for(var mq=0;mq<mist.length;mq++){ var MQ2=mist[mq], mk=MQ2.life/MQ2.max;
    ctx.fillStyle='rgba('+Math.round(150-40*(1-mk))+',18,13,'+(mk*.75)+')';
    ctx.beginPath(); ctx.arc(MQ2.x,MQ2.y-14,MQ2.s*(.5+mk*.9),0,6.3); ctx.fill();
  }
  // embers
  for(var eq=0;eq<embers.length;eq++){ var E=embers[eq], ek=E.life/E.max;
    var fl2=.5+Math.sin(now*22+E.x)*.5;
    ctx.fillStyle='rgba(255,'+Math.round(140+80*fl2)+',60,'+(ek*.95)+')';
    ctx.beginPath(); ctx.arc(E.x,E.y,1.1+ek*1.5,0,6.3); ctx.fill();
  }
  // flares hanging over the fight
  for(var fq2=0;fq2<flares.length;fq2++){ var FQ=flares[fq2];
    ctx.fillStyle='rgba(255,246,214,.95)'; ctx.beginPath(); ctx.arc(FQ.x,FQ.y,3.2,0,6.3); ctx.fill();
  }
  // dust and ash caught in the air
  for(var mq=0;mq<motes.length;mq++){ var MQ=motes[mq];
    ctx.fillStyle='rgba(226,214,190,'+MQ.a+')';
    ctx.fillRect(MQ.x,MQ.y,MQ.s,MQ.s);
  }

  // hold bar above player (unified)
  if(mapKind==='sea'||mapKind==='oil'||mapKind==='redSquare'){
    var bw=Math.min(240,VW-120), bx4=VW/2-bw/2, by4=12, bh4=20;
    var frac=Math.max(0,baseHP/baseMX);
    var col4=frac>.5?'#4fd08a':(frac>.25?'#e2b13c':'#d84a34');
    var jolt=baseFlash>0?rr(-2,2):0;
    ctx.save(); ctx.translate(jolt,jolt*.5);
    ctx.fillStyle='rgba(6,10,12,.75)'; rrect(ctx,bx4-3,by4-3,bw+6,bh4+6,5); ctx.fill();
    ctx.strokeStyle=baseFlash>0?'#ff6a4a':'rgba(200,214,222,.35)'; ctx.lineWidth=2;
    rrect(ctx,bx4-3,by4-3,bw+6,bh4+6,5); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.06)'; rrect(ctx,bx4,by4,bw,bh4,3); ctx.fill();
    ctx.fillStyle=col4; rrect(ctx,bx4,by4,bw*frac,bh4,3); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.18)'; rrect(ctx,bx4,by4,bw*frac,bh4*.4,3); ctx.fill();
    ctx.strokeStyle='rgba(6,10,12,.55)'; ctx.lineWidth=1.4;                 // segment ticks
    for(var tk4=1;tk4<10;tk4++){
      ctx.beginPath(); ctx.moveTo(bx4+bw*tk4/10,by4); ctx.lineTo(bx4+bw*tk4/10,by4+bh4); ctx.stroke();
    }
    if(baseFlash>0){ ctx.fillStyle='rgba(255,90,60,'+(baseFlash*.5)+')'; rrect(ctx,bx4,by4,bw,bh4,3); ctx.fill(); }
    ctx.fillStyle='#f2ead2'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
    ctx.fillText('BASE INTEGRITY   '+Math.round(frac*100)+'%',VW/2,by4+14);
    if(frac<.3){
      ctx.fillStyle='rgba(216,74,52,'+(.5+Math.abs(Math.sin(now*5))*.5)+')'; ctx.font='bold 9px Arial';
      ctx.fillText('BASE CRITICAL',VW/2,by4+bh4+13);
    }
    ctx.textAlign='start'; ctx.restore();
  }
  // the squad, one pip per man
  var alive5=(player&&player.dead?0:1)+crew.length;
  var px5=VW/2-(5*13)/2;
  for(var sq6=0;sq6<5;sq6++){
    var on5=sq6<alive5, hy5=(mapKind==='sea')?42:14;
    ctx.fillStyle=on5?'#9db35a':'rgba(255,255,255,.14)';
    ctx.beginPath(); ctx.arc(px5+sq6*13+5,hy5,4.2,Math.PI,0); ctx.fill();
    ctx.fillRect(px5+sq6*13+.8,hy5,8.4,2.4);
    if(!on5){ ctx.strokeStyle='rgba(216,74,52,.55)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(px5+sq6*13,hy5+4); ctx.lineTo(px5+sq6*13+10,hy5-6); ctx.stroke(); }
  }
  if(player.bHold>0||player.oHold>0){
    var hb=player.bHold>0?player.bHold:player.oHold;
    var hbx=player.x-26, hby=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,hbx,hby,52,8,4); ctx.fill();
    ctx.fillStyle=player.bHold>0?'#8fe0d8':'#e2b13c';
    rrect(ctx,hbx+1.5,hby+1.5,49*Math.min(1,hb),5,3); ctx.fill();
  }
  if(player.sHold>0){
    var sbx2=player.x-26, sby2=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,sbx2,sby2,52,8,4); ctx.fill();
    ctx.fillStyle='#3fa8a0'; rrect(ctx,sbx2+1.5,sby2+1.5,49*Math.min(1,player.sHold),5,3); ctx.fill();
  }
  if(player.dHold>0){
    var dbx=player.x-26, dby=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,dbx,dby,52,8,4); ctx.fill();
    ctx.fillStyle='#6fb0d8'; rrect(ctx,dbx+1.5,dby+1.5,49*Math.min(1,player.dHold),5,3); ctx.fill();
  }
  if(player.shopHold>0){
    var sbx=player.x-26, sby=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,sbx,sby,52,8,4); ctx.fill();
    ctx.fillStyle='#e2b13c'; rrect(ctx,sbx+1.5,sby+1.5,49*Math.min(1,player.shopHold),5,3); ctx.fill();
  }
  if(player.open>0){
    var bx=player.x-26, by=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,bx,by,52,8,4); ctx.fill();
    ctx.fillStyle='#e2b13c'; rrect(ctx,bx+1.5,by+1.5,49*Math.min(1,player.open),5,3); ctx.fill();
  }
  if(player.reload>0){
    var W=WEAPONS[player.wep], full=W.mag>50?2.6:1.45, p2=1-player.reload/full;
    var rx=player.x-26, ry=player.y-54;
    ctx.fillStyle='rgba(0,0,0,.65)'; rrect(ctx,rx,ry,52,8,4); ctx.fill();
    ctx.fillStyle='#5fa8d3'; rrect(ctx,rx+1.5,ry+1.5,49*p2,5,3); ctx.fill();
  }

  ctx.restore();

  // Screen-space snowfall stays visible while the camera moves across the airfield.
  if(mapKind==='airfield'){
    var snowClock=Date.now()*.001;
    for(var sf=0;sf<110;sf++){
      var sfs=1+(sf%4)*.55;
      var sfxp=((sf*83.7+snowClock*(18+(sf%7)*4))%(VW+40))-20;
      var sfyp=((sf*47.3+snowClock*(42+(sf%5)*9))%(VH+50))-25;
      ctx.globalAlpha=.35+(sf%6)*.1; ctx.fillStyle='#f7fbff';
      ctx.beginPath(); ctx.arc(sfxp,sfyp,sfs,0,6.3); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  if(flag&&(flag.state==='ready'||flag.state==='lower'||flag.state==='raise')){
    var fsx=flag.x-cam.x, fsy=flag.y-cam.y;
    if(fsx<0||fsx>VW||fsy<0||fsy>VH){
      var ax2=Math.max(22,Math.min(VW-22,fsx)), ay2=Math.max(96,Math.min(VH-170,fsy));
      ctx.save(); ctx.translate(ax2,ay2); ctx.rotate(Math.atan2(fsy-ay2,fsx-ax2));
      ctx.fillStyle='#f2c744'; ctx.beginPath(); ctx.moveTo(11,0); ctx.lineTo(-7,-7); ctx.lineTo(-7,7); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  for(var bq=0;bq<flags.length;bq++){
    var BQ=flags[bq];
    if(BQ.state==='done') continue;
    var bsx=BQ.x-cam.x, bsy=BQ.y-cam.y;
    if(bsx>0&&bsx<VW&&bsy>0&&bsy<VH) continue;
    var bax=Math.max(20,Math.min(VW-20,bsx)), bay=Math.max(96,Math.min(VH-170,bsy));
    ctx.save(); ctx.translate(bax,bay); ctx.rotate(Math.atan2(bsy-bay,bsx-bax));
    ctx.fillStyle=BQ.state==='ready'?'rgba(242,199,68,.85)':'rgba(200,120,60,.8)';
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-7,-7); ctx.lineTo(-7,7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  for(var dm=0;dm<edrones.length;dm++){
    var DM=edrones[dm]; if(DM.state!=='hunt') continue;
    var dsx=DM.x-cam.x, dsy=DM.y-cam.y;
    if(dsx>0&&dsx<VW&&dsy>0&&dsy<VH) continue;
    var dax=Math.max(20,Math.min(VW-20,dsx)), day=Math.max(96,Math.min(VH-170,dsy));
    ctx.save(); ctx.translate(dax,day); ctx.rotate(Math.atan2(dsy-day,dsx-dax));
    ctx.fillStyle='rgba(216,74,52,.9)';
    ctx.beginPath(); ctx.moveTo(11,0); ctx.lineTo(-7,-6); ctx.lineTo(-3,0); ctx.lineTo(-7,6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // off-screen hostile markers
  for(var mI=0;mI<enemies.length;mI++){
    var mE=enemies[mI], sxp=mE.x-cam.x, syp=mE.y-cam.y;
    if(sxp>-20&&sxp<VW+20&&syp>-20&&syp<VH+20) continue;
    var ax=Math.max(18,Math.min(VW-18,sxp)), ay=Math.max(80,Math.min(VH-150,syp));
    var ang3=Math.atan2(syp-ay,sxp-ax);
    ctx.save(); ctx.translate(ax,ay); ctx.rotate(ang3); ctx.globalAlpha=.55;
    ctx.fillStyle='#d84a34'; ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(-5,-5); ctx.lineTo(-5,5); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.globalAlpha=1;
  }

  // vignette
  if(arty.flash>0){ ctx.fillStyle='rgba(255,222,168,'+(arty.flash*.5)+')'; ctx.fillRect(0,0,VW,VH); }
  var vg=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.62)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,VW,VH);
  if(smog>0){
    ctx.fillStyle='rgba(24,18,14,'+smog+')'; ctx.fillRect(0,0,VW,VH);
    var sg2=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.16,VW/2,VH/2,Math.max(VW,VH)*.62);
    sg2.addColorStop(0,'rgba(0,0,0,0)'); sg2.addColorStop(1,'rgba(10,8,6,'+(smog*.9)+')');
    ctx.fillStyle=sg2; ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='rgba(90,60,30,'+(smog*.14)+')'; ctx.fillRect(0,0,VW,VH);
  }
  var hz=ctx.createLinearGradient(0,0,0,VH);
  hz.addColorStop(0,'rgba(96,74,52,.16)'); hz.addColorStop(.5,'rgba(70,62,54,.06)'); hz.addColorStop(1,'rgba(40,36,32,.14)');
  ctx.fillStyle=hz; ctx.fillRect(0,0,VW,VH);

  if(droneCam){
    var dk=Math.min(1,droneCam.t/2.2);
    ctx.strokeStyle='rgba(255,150,90,'+(.2+dk*.35)+')'; ctx.lineWidth=2;
    var mg2=30, cl2=40;
    [[mg2,mg2,1,1],[VW-mg2,mg2,-1,1],[mg2,VH-mg2,1,-1],[VW-mg2,VH-mg2,-1,-1]].forEach(function(k3){
      ctx.beginPath(); ctx.moveTo(k3[0]+cl2*k3[2],k3[1]); ctx.lineTo(k3[0],k3[1]);
      ctx.lineTo(k3[0],k3[1]+cl2*k3[3]); ctx.stroke();
    });
    ctx.fillStyle='rgba(255,170,110,'+(.25+dk*.5)+')'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
    ctx.fillText('IMPACT  '+droneCam.t.toFixed(1)+'s',mg2+6,mg2+22); ctx.textAlign='start';
    ctx.fillStyle='rgba(255,120,60,'+(dk*.05)+')'; ctx.fillRect(0,0,VW,VH);
  }
  if(piloting){
    ctx.strokeStyle='rgba(120,220,255,.35)'; ctx.lineWidth=2;
    var mg=26, cl=34;
    [[mg,mg,1,1],[VW-mg,mg,-1,1],[mg,VH-mg,1,-1],[VW-mg,VH-mg,-1,-1]].forEach(function(k2){
      ctx.beginPath(); ctx.moveTo(k2[0]+cl*k2[2],k2[1]); ctx.lineTo(k2[0],k2[1]);
      ctx.lineTo(k2[0],k2[1]+cl*k2[3]); ctx.stroke();
    });
    ctx.fillStyle='rgba(80,200,255,.05)'; ctx.fillRect(0,0,VW,VH);
    ctx.strokeStyle='rgba(120,220,255,.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(VW/2,VH/2,26,0,6.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(VW/2-38,VH/2); ctx.lineTo(VW/2-14,VH/2);
    ctx.moveTo(VW/2+14,VH/2); ctx.lineTo(VW/2+38,VH/2);
    ctx.moveTo(VW/2,VH/2-38); ctx.lineTo(VW/2,VH/2-14);
    ctx.moveTo(VW/2,VH/2+14); ctx.lineTo(VW/2,VH/2+38); ctx.stroke();
    ctx.fillStyle='rgba(140,230,255,.85)'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
    ctx.fillText((drone&&drone.kind==='usv'?'USV  ':(wingmen.length?'FLIGHT x'+(wingmen.length+1)+'  ':'FPV  '))
                 +(drone?drone.t.toFixed(1):'0.0')+'s',mg+6,mg+22);
    if(drone&&drone.mx){
      ctx.fillStyle='rgba(0,0,0,.55)'; rrect(ctx,mg+6,mg+28,110,8,3); ctx.fill();
      ctx.fillStyle=drone.hp>drone.mx*.5?'#7fe8ff':(drone.hp>drone.mx*.25?'#e2b13c':'#d84a34');
      rrect(ctx,mg+7.5,mg+29.5,107*Math.max(0,drone.hp/drone.mx),5,2); ctx.fill();
    }
    ctx.textAlign='start';
  }
  drawMinimap();
  // drawObjectives(); — objectives shown in sidebar, not needed in-game HUD
  drawStick();
  drawBelt();
  drawGunRail();
  if(state==='card'&&cardData) drawCard();
  if(state==='shop') drawShop();
  for(var sq=0;sq<splat.length;sq++){
    var SQ=splat[sq], sk=Math.min(1,SQ.life/SQ.max*1.6);
    ctx.save(); ctx.translate(SQ.x,SQ.y); ctx.rotate(SQ.rot); ctx.globalAlpha=sk*.82;
    ctx.fillStyle='rgba(116,12,9,1)';
    ctx.beginPath(); ctx.ellipse(0,0,SQ.r,SQ.r*.72,0,0,6.3); ctx.fill();
    ctx.fillStyle='rgba(158,26,18,.7)';
    ctx.beginPath(); ctx.ellipse(-SQ.r*.2,-SQ.r*.15,SQ.r*.5,SQ.r*.34,0,0,6.3); ctx.fill();
    ctx.fillStyle='rgba(116,12,9,.9)';
    ctx.fillRect(-SQ.r*.16,0,SQ.r*.32,SQ.drip*(1-sk*.35));
    ctx.beginPath(); ctx.arc(0,SQ.drip*(1-sk*.35),SQ.r*.2,0,6.3); ctx.fill();
    for(var ss=0;ss<4;ss++){
      ctx.beginPath(); ctx.arc(rr(-SQ.r*2,SQ.r*2),rr(-SQ.r*1.6,SQ.r*1.6),rr(1,3.4),0,6.3); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha=1;
  }
}

function paintDamaged(c){
  for(var q=0;q<dmgList.length;q++){
    var D=dmgList[q], X=D.x*TILE, Y=D.y*TILE, mode=dmgMap[D.i], sd=D.i*7.3;
    if(X<cam.x-TILE||X>cam.x+VW||Y<cam.y-TILE||Y>cam.y+VH) continue;
    var inside=(T(D.x-1,D.y)===FLOOR||T(D.x+1,D.y)===FLOOR||T(D.x,D.y-1)===FLOOR||T(D.x,D.y+1)===FLOOR
                ||T(D.x,D.y)===FLOOR);
    // ground beneath what used to be there
    if(inside){
      c.fillStyle=shade('#7a5f3e',.82+hs(sd)*.22); c.fillRect(X,Y,TILE,TILE);
      c.strokeStyle='rgba(30,20,12,.32)'; c.lineWidth=1;
      for(var b=0;b<3;b++){ var yy=Y+b*(TILE/3)+.5; c.beginPath(); c.moveTo(X,yy); c.lineTo(X+TILE,yy); c.stroke(); }
    } else {
      c.fillStyle=shade('#5d5a44',.86+hs(sd)*.2); c.fillRect(X,Y,TILE,TILE);
      for(var g=0;g<4;g++){ c.fillStyle='rgba(40,44,26,'+(.1+hs(sd+g)*.2)+')';
        c.fillRect(X+hs(sd+g*2)*TILE,Y+hs(sd+g*3)*TILE,2+hs(sd+g)*5,1+hs(sd+g*5)*2); }
    }
    c.fillStyle='rgba(30,26,20,.28)'; c.fillRect(X,Y,TILE,TILE);
    if(mode===1){        // knocked down to a waist-high stub
      c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(X+2,Y+TILE-7,TILE-4,8);
      c.fillStyle=shade('#a79c8b',.85+hs(sd)*.2);
      c.beginPath(); c.moveTo(X,Y+TILE);
      for(var k=0;k<=5;k++) c.lineTo(X+k*TILE/5, Y+15+hs(sd+k*3.1)*9);
      c.lineTo(X+TILE,Y+TILE); c.closePath(); c.fill();
      c.strokeStyle='rgba(30,26,20,.85)'; c.lineWidth=2; c.stroke();
      for(var br=0;br<4;br++){ c.fillStyle='rgba(150,72,52,'+(.3+hs(sd+br*7)*.4)+')';
        c.fillRect(X+2+hs(sd+br)*22,Y+20+hs(sd+br*2)*9,6+hs(sd+br*4)*5,4); }
      for(var sp3=0;sp3<7;sp3++){ var ssz=3+hs(sd+sp3*4.3)*5;
        c.fillStyle=shade('#9a917f',.55+hs(sd+sp3*6.1)*.6);
        c.save(); c.translate(X+2+hs(sd+sp3)*(TILE-4),Y+18+hs(sd+sp3*2.7)*14);
        c.rotate(hs(sd+sp3*8)*3.14); c.fillRect(-ssz/2,-ssz/3,ssz,ssz*.66); c.restore(); }
    } else if(mode===2){ // collapsed to rubble you can walk over
      for(var r2=0;r2<11;r2++){
        var sz=3+hs(sd+r2*3.7)*6;
        c.fillStyle=shade('#9a917f',.55+hs(sd+r2*5.3)*.6);
        c.save(); c.translate(X+2+hs(sd+r2)*(TILE-5),Y+2+hs(sd+r2*2.2)*(TILE-5));
        c.rotate(hs(sd+r2*9)*3.14);
        c.fillRect(-sz/2,-sz/3,sz,sz*.66); c.restore();
      }
      for(var r3=0;r3<3;r3++){ c.fillStyle='rgba(150,72,52,'+(.35+hs(sd+r3*11)*.4)+')';
        c.fillRect(X+hs(sd+r3*4)*26,Y+hs(sd+r3*6)*26,7,4); }
    }
  }
}
function drawObjectives(){
  if(!player||state==='menu'||state==='shop'||state==='card') return;
  // Build objective list for current map
  var objs=[];
  if(mapKind==='trench'){
    var taken=0; for(var oq=0;oq<flags.length;oq++) if(flags[oq].state==='done') taken++;
    var safe=0;  for(var rg=0;rg<rescueGroups.length;rg++) if(rescueGroups[rg].state==='done') safe++;
    objs.push({t:'CAPTURE ENEMY HQ ('+taken+'/'+flags.length+')',   done:taken>=flags.length&&flags.length>0});
    objs.push({t:'RESCUE ALLIED SOLDIERS ('+safe+'/'+rescueGroups.length+')', done:safe>=rescueGroups.length&&rescueGroups.length>0});
    objs.push({t:'ELIMINATE GENERAL GRAKOV',                         done:!!levelTwoBossDefeated});
  } else if(mapKind==='airfield'){
    var planesUp=0; for(var aq=0;aq<aircraft.length;aq++) if(!aircraft[aq].dead) planesUp++;
    objs.push({t:'DESTROY CARGO PLANES ('+( aircraft.length-planesUp)+'/'+aircraft.length+')', done:planesUp===0&&aircraft.length>0});
    objs.push({t:'REPEL ASSAULT WAVES ('+airAssaultWave+'/2)',       done:airAssaultWave>=2});
    objs.push({t:'DEFEAT THE AIRFIELD COMMANDER',                    done:!!airfieldBossDefeated});
  } else if(mapKind==='oil'){
    var rl=0; for(var rq6=0;rq6<refineries.length;rq6++) if(!refineries[rq6].dead) rl++;
    objs.push({t:'DESTROY REFINERIES ('+( refineries.length-rl)+'/'+refineries.length+')', done:rl===0&&refineries.length>0});
    objs.push({t:'NEUTRALISE SAM SITES',                             done:sams.length===0});
    objs.push({t:'DEFEAT THE OIL BARON',                             done:!!oilBossDefeated});
  } else if(mapKind==='sea'){
    var afloat=0; for(var sq6=0;sq6<ships.length;sq6++) if(ships[sq6].hp>0) afloat++;
    objs.push({t:'SINK THE FLEET ('+( ships.length-afloat)+'/'+ships.length+')', done:afloat===0&&ships.length>0});
    objs.push({t:'ELIMINATE SHORE TROOPS',                           done:afloat===0&&enemies.length===0});
    objs.push({t:'DESTROY THE SEA BOSS',                             done:!!seaBossDefeated});
  } else if(mapKind==='redSquare'){
    var rbL=0; for(var rbq2=0;rbq2<refineries.length;rbq2++) if(!refineries[rbq2].dead) rbL++;
    var mcL=0; for(var mcq2=0;mcq2<motorcade.length;mcq2++) if(!motorcade[mcq2].dead) mcL++;
    objs.push({t:'DESTROY BUILDINGS ('+( refineries.length-rbL)+'/'+refineries.length+')', done:rbL===0&&refineries.length>0});
    objs.push({t:'DESTROY THE MOTORCADE ('+( motorcade.length-mcL)+'/'+motorcade.length+')', done:mcL===0&&motorcade.length>0});
    objs.push({t:'DEFEAT THE FINAL BOSS',                            done:!!redBossDefeated});
  } else {
    // compound / default
    var taken2=0; for(var dq4=0;dq4<flags.length;dq4++) if(flags[dq4].state==='done') taken2++;
    objs.push({t:'CAPTURE BASES ('+taken2+'/'+flags.length+')',      done:taken2>=flags.length&&flags.length>0});
    objs.push({t:'CLEAR ALL HOSTILES',                               done:enemies.length===0&&spawnQ===0});
    objs.push({t:'DEFEAT THE COMPOUND BOSS',                         done:!!compoundBossDefeated});
  }
  if(!objs.length) return;
  // Panel layout — left side, below gun rail
  var pw=182, lh=20, pad=10, cx=9, cy=344;
  var ph=pad+12+4+objs.length*lh+pad;
  ctx.save();
  // Drop shadow
  ctx.shadowColor='rgba(0,0,0,.6)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4;
  // Solid dark panel
  ctx.fillStyle='#0e1009'; rrect(ctx,cx,cy,pw,ph,6); ctx.fill();
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  // Gold header strip — clip to panel shape to avoid rounding artifacts
  ctx.save(); rrect(ctx,cx,cy,pw,ph,6); ctx.clip();
  ctx.fillStyle='rgba(180,140,30,.22)'; ctx.fillRect(cx,cy,pw,26);
  ctx.restore();
  // Gold border — drawn once, clean rounded rect
  ctx.strokeStyle='#c9a83c'; ctx.lineWidth=1.5; rrect(ctx,cx,cy,pw,ph,6); ctx.stroke();
  // Header divider line — straight horizontal, inset from corners
  ctx.strokeStyle='rgba(201,168,60,.5)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx+6,cy+26); ctx.lineTo(cx+pw-6,cy+26); ctx.stroke();
  // Header label
  ctx.fillStyle='#e8d882'; ctx.font='bold 9px Arial';
  ctx.textAlign='left'; ctx.fillText('MISSION OBJECTIVES', cx+pad, cy+18);
  // Objectives
  for(var oi=0;oi<objs.length;oi++){
    var O=objs[oi], oy=cy+28+oi*lh;
    if(O.done){
      // Filled green checkbox
      ctx.fillStyle='#6a8c30'; rrect(ctx,cx+pad,oy,12,12,3); ctx.fill();
      ctx.fillStyle='#c8e87a'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
      ctx.fillText('✓', cx+pad+6, oy+10);
    } else {
      // Hollow box
      ctx.strokeStyle='#5a6040'; ctx.lineWidth=1.5;
      rrect(ctx,cx+pad,oy,12,12,3); ctx.stroke();
    }
    // Row background on hover / active — subtle stripe on pending
    if(!O.done){
      ctx.fillStyle='rgba(255,255,255,.03)'; rrect(ctx,cx+pad+16,oy-1,pw-pad-24,13,2); ctx.fill();
    }
    // Label text
    ctx.textAlign='left'; ctx.font=(O.done?'9px':'bold 9px')+' Arial';
    ctx.fillStyle=O.done?'#6a8c30':'#e8e0c8';
    ctx.fillText(O.t, cx+pad+18, oy+10);
    // Strike-through
    if(O.done){
      ctx.strokeStyle='rgba(106,140,48,.6)'; ctx.lineWidth=1;
      var tw=ctx.measureText(O.t).width;
      ctx.beginPath(); ctx.moveTo(cx+pad+18,oy+5); ctx.lineTo(cx+pad+18+tw,oy+5); ctx.stroke();
    }
  }
  ctx.textAlign='start'; ctx.restore();
}

function drawStick(){
  var J=joyVis, R=66, act=J.on;
  ctx.save();
  // outer ring
  ctx.globalAlpha=act?.95:.7;
  ctx.fillStyle='rgba(8,8,6,.42)';
  ctx.beginPath(); ctx.arc(J.cx,J.cy,R,0,6.3); ctx.fill();
  ctx.strokeStyle='rgba(242,234,210,'+(act?.85:.6)+')'; ctx.lineWidth=3.5;
  ctx.beginPath(); ctx.arc(J.cx,J.cy,R,0,6.3); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.arc(J.cx,J.cy,R+2.2,0,6.3); ctx.stroke();
  // inner guide
  ctx.strokeStyle='rgba(242,234,210,.22)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(J.cx,J.cy,R*.56,0,6.3); ctx.stroke();
  // compass ticks
  ctx.fillStyle='rgba(242,234,210,'+(act?.8:.55)+')';
  for(var i=0;i<4;i++){
    var a=i*Math.PI/2;
    ctx.save(); ctx.translate(J.cx+Math.cos(a)*(R-13),J.cy+Math.sin(a)*(R-13)); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(-4,-4.5); ctx.lineTo(-4,4.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // stem from centre to knob
  if(act){
    ctx.strokeStyle='rgba(242,234,210,.3)'; ctx.lineWidth=10; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(J.cx,J.cy); ctx.lineTo(J.kx,J.ky); ctx.stroke();
  }
  // knob
  var g=ctx.createRadialGradient(J.kx-8,J.ky-10,3,J.kx,J.ky,30);
  g.addColorStop(0,'rgba(250,246,236,'+(act?.98:.85)+')');
  g.addColorStop(1,'rgba(150,146,132,'+(act?.9:.7)+')');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(J.kx,J.ky,29,0,6.3); ctx.fill();
  ctx.strokeStyle='rgba(20,18,14,.85)'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(J.kx,J.ky,29,0,6.3); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.arc(J.kx,J.ky,24,0,6.3); ctx.stroke();
  ctx.fillStyle='rgba(40,36,28,.5)';
  ctx.beginPath(); ctx.arc(J.kx,J.ky,5,0,6.3); ctx.fill();
  ctx.globalAlpha=1; ctx.restore();
}
function beltRect(i){ var w=46,h=46,g=6; return {x:VW-w-9,y:112+i*(h+g),w:w,h:h}; }
function gunRect(i){ var w=46,h=46,g=6; return {x:9,y:112+i*(h+g),w:w,h:h}; }
function gunHit(cx,cy){
  if(!player||!player.guns) return -1;
  for(var i=0;i<player.guns.length;i++){ var R=gunRect(i);
    if(cx>=R.x-6&&cx<=R.x+R.w+6&&cy>=R.y-3&&cy<=R.y+R.h+3) return i; }
  return -1;
}
function drawGunRail(){
  if(!player||!player.guns) return;
  for(var i=0;i<4;i++){
    var R=gunRect(i), g=player.guns[i];
    ctx.fillStyle='rgba(10,10,8,.5)'; rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.fill();
    if(g){
      var on=(i===player.gi);
      ctx.strokeStyle=on?'#e2b13c':'rgba(232,228,216,.35)'; ctx.lineWidth=on?2.6:1.6;
      rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.stroke();
      if(on){ ctx.globalAlpha=.14; ctx.fillStyle='#e2b13c'; rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(R.x+R.w/2-4,R.y+R.h/2-5); ctx.scale(.92,.92); drawGun(ctx,g.id,0,0); ctx.restore();
      var mg=on?player.mag:g.mag, rs=on?player.res:g.res;
      ctx.fillStyle=on?'#f2ead2':'rgba(232,228,216,.6)'; ctx.font='bold 9px Arial'; ctx.textAlign='center';
      ctx.fillText(mg+'/'+rs,R.x+R.w/2,R.y+R.h-6); ctx.textAlign='start';
    } else {
      ctx.strokeStyle='rgba(232,228,216,.14)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}
function drawCard(){
  var B=cardBox(), cd=cardData;
  ctx.fillStyle='rgba(4,4,3,.72)'; ctx.fillRect(0,0,VW,VH);
  ctx.fillStyle=cd.rar.c; rrect(ctx,B.x-2,B.y-2,B.w+4,B.h+4,10); ctx.fill();
  ctx.fillStyle='#1b1a16'; rrect(ctx,B.x,B.y,B.w,B.h,9); ctx.fill();
  ctx.save(); ctx.translate(B.x+B.w/2,B.y+64);
  if(cd.cd.k==='w'){ ctx.scale(2.1,2.1); drawGun(ctx,cd.cd.id,0,0); }
  else if(cd.cd.k==='t'){ toolIcon(ctx,cd.cd.id,74); }
  else { ctx.scale(1.5,1.5); toolCardArt(ctx,cd.cd); }
  ctx.restore();
  ctx.textAlign='center';
  ctx.fillStyle=cd.rar.c; ctx.font='bold 10px Arial';
  ctx.fillText(cd.rar.n,B.x+B.w/2,B.y+118);
  ctx.fillStyle='#f2ead2'; ctx.font='bold 18px Arial';
  ctx.fillText(cd.name,B.x+B.w/2,B.y+142);
  ctx.font='11px Arial'; ctx.textAlign='left';
  for(var i=0;i<cd.rows.length&&i<5;i++){
    var ry=B.y+168+i*19;
    ctx.strokeStyle='rgba(255,255,255,.07)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(B.x+14,ry+5); ctx.lineTo(B.x+B.w-14,ry+5); ctx.stroke();
    ctx.fillStyle='#a9a396'; ctx.fillText(cd.rows[i][0],B.x+16,ry);
    ctx.textAlign='right'; ctx.fillStyle='#e8e4d8'; ctx.fillText(cd.rows[i][1],B.x+B.w-16,ry);
    ctx.textAlign='left';
  }
  ctx.fillStyle='rgba(255,255,255,.08)'; rrect(ctx,B.leave.x,B.leave.y,B.leave.w,B.leave.h,4); ctx.fill();
  ctx.fillStyle='#c0562f'; rrect(ctx,B.take.x,B.take.y,B.take.w,B.take.h,4); ctx.fill();
  ctx.textAlign='center'; ctx.font='bold 13px Arial';
  ctx.fillStyle='#d6d0c2'; ctx.fillText('LEAVE',B.leave.x+B.leave.w/2,B.leave.y+28);
  ctx.fillStyle='#fff'; ctx.fillText(cd.take,B.take.x+B.take.w/2,B.take.y+28);
  ctx.fillStyle='#6e6a60'; ctx.font='9px Arial';
  ctx.fillText('tap anywhere outside to skip',B.x+B.w/2,B.y+B.h+18);
  ctx.textAlign='start';
}
function toolCardArt(c,cd){
  if(cd.k==='a'){
    c.fillStyle='#7d6238'; rrect(c,-28,-19,56,38,4); c.fill(); outl(c,'#1e1a14',2.4);
    c.fillStyle='#5d4726'; c.fillRect(-28,-4,56,8);
    for(var i=0;i<4;i++){ c.fillStyle='#c8a24a'; rrect(c,-23+i*13,-31,6,11,2); c.fill(); outl(c,'#1e1a14',1.6); }
  } else if(cd.k==='h'){
    c.fillStyle='#e8e4d8'; rrect(c,-24,-19,48,38,5); c.fill(); outl(c,'#1e1a14',2.4);
    c.fillStyle='#c0362f'; c.fillRect(-5,-12,10,24); c.fillRect(-16,-5,32,10);
  } else if(cd.k==='p'){
    c.fillStyle='#5d6b74'; c.beginPath(); c.moveTo(0,-22); c.lineTo(22,-11); c.lineTo(18,18); c.lineTo(0,23);
    c.lineTo(-18,18); c.lineTo(-22,-11); c.closePath(); c.fill(); outl(c,'#1e1a14',2.4);
  } else {
    c.fillStyle='#4d5a30'; c.beginPath(); c.ellipse(0,4,16,20,0,0,6.3); c.fill(); outl(c,'#1e1a14',2.4);
    c.strokeStyle='rgba(20,26,10,.6)'; c.lineWidth=1.6;
    for(var g=-2;g<=2;g++){ c.beginPath(); c.moveTo(-15,g*7.5); c.lineTo(15,g*7.5); c.stroke(); }
    c.fillStyle='#8a8f7a'; c.fillRect(-4,-22,8,7); outl(c,'#1e1a14',1.6);
  }
}
function beltHit(cx,cy){
  for(var i=0;i<6;i++){ var R=beltRect(i);
    if(cx>=R.x-6&&cx<=R.x+R.w+6&&cy>=R.y-3&&cy<=R.y+R.h+3) return i; }
  return -1;
}
function drawBelt(){
  for(var i=0;i<6;i++){
    var R=beltRect(i), k=belt[i];
    ctx.fillStyle='rgba(10,10,8,.5)'; rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.fill();
    if(k){
      var TC=TOOLS[k];
      ctx.strokeStyle=TC.c; ctx.lineWidth=2; rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.stroke();
      ctx.globalAlpha=.16; ctx.fillStyle=TC.c; rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.fill(); ctx.globalAlpha=1;
      ctx.save(); ctx.translate(R.x+R.w/2,R.y+R.h/2-2); toolIcon(ctx,k,25); ctx.restore();
      ctx.fillStyle='rgba(235,230,218,.8)'; ctx.font='bold 7px Arial'; ctx.textAlign='center';
      ctx.fillText(TOOLS[k].n.split(' ')[0],R.x+R.w/2,R.y+R.h-5); ctx.textAlign='start';
    } else {
      ctx.strokeStyle='rgba(232,228,216,.16)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      rrect(ctx,R.x,R.y,R.w,R.h,8); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // running effects
  var eff=[], i2;
  if(player.stim>0) eff.push(['STIM',player.stim/12,'#4fd08a']);
  if(player.flamer>0) eff.push(['FLAMER',player.flamer/15,'#f2762c']);
  for(i2=0;i2<sentries.length;i2++) eff.push(['SENTRY',sentries[i2].t/22,'#c8a24a']);
  for(i2=0;i2<smokes.length;i2++) eff.push(['SMOKE',smokes[i2].t/14,'#c9c9c2']);
  for(i2=0;i2<eff.length&&i2<4;i2++){
    var ey=112+i2*14, ex=VW/2-42;
    ctx.fillStyle='rgba(0,0,0,.5)'; rrect(ctx,ex,ey,84,10,3); ctx.fill();
    ctx.fillStyle=eff[i2][2]; rrect(ctx,ex+1.5,ey+1.5,81*Math.max(0,eff[i2][1]),7,2.5); ctx.fill();
    ctx.fillStyle='rgba(20,18,14,.9)'; ctx.font='bold 7px Arial';
    ctx.fillText(eff[i2][0],ex+5,ey+8);
  }
}
var UA=['#2f7fd0','#f2c744'], RU=['#f2f2f0','#2f5aa8','#c8332c'];
var CREST=(typeof Image!=='undefined')?new Image():null;
if(CREST) CREST.src='assets/images/emblems/ukraine-crest.png';
var crestOK=false; if(CREST) CREST.onload=function(){ crestOK=true; };
var DRONED=(typeof Image!=='undefined')?new Image():null;
if(DRONED) DRONED.src='assets/images/emblems/get-droned-flag.png';
var dronedOK=false; if(DRONED) DRONED.onload=function(){ dronedOK=true; };
/* white banner, black print, same ripple */
function drawPrintFlag(c,px,py,w,h,t,img,ok,cloth){
  var N=16, amp=2.4+Math.abs(wind)*.2;
  function wv(xx){ var k=xx/w;
    return (Math.sin(xx*.26-t*6.4)*amp + Math.sin(xx*.115-t*3.5)*amp*.62)*k*k; }
  for(var sN=0;sN<N;sN++){
    var x0=w*sN/N, x1=w*(sN+1)/N, o0=wv(x0), o1=wv(x1);
    var sf=1-Math.max(-.34,Math.min(.34,(o1-o0)*.55));
    c.fillStyle=shade(cloth,sf);
    c.beginPath();
    c.moveTo(px+x0,py+o0); c.lineTo(px+x1,py+o1);
    c.lineTo(px+x1,py+h+o1); c.lineTo(px+x0,py+h+o0);
    c.closePath(); c.fill();
    if(ok&&img){
      var sw=img.width/N;
      c.save();
      c.beginPath();
      c.moveTo(px+x0,py+o0); c.lineTo(px+x1+.6,py+o1);
      c.lineTo(px+x1+.6,py+h+o1); c.lineTo(px+x0,py+h+o0);
      c.closePath(); c.clip();
      c.globalAlpha=Math.min(1,.9*sf+.1);
      try{ c.drawImage(img, sN*sw,0,sw,img.height,
                       px+x0, py+o0+h*.30, (w/N)+.7, h*.66); }catch(e){}
      c.globalAlpha=1; c.restore();
    }
  }
  c.strokeStyle='rgba(20,18,14,.7)'; c.lineWidth=1.3;
  c.beginPath(); c.moveTo(px,py);
  for(var q=0;q<=N;q++){ var xa=w*q/N; c.lineTo(px+xa,py+wv(xa)); }
  for(var q2=N;q2>=0;q2--){ var xb=w*q2/N; c.lineTo(px+xb,py+h+wv(xb)); }
  c.closePath(); c.stroke();
}
/* the unit standard: dark field, gold crest, same ripple as the colours */
function drawCrestFlag(c,px,py,w,h,t){
  var N=16, amp=2.4+Math.abs(wind)*.2;
  function wv(xx){ var k=xx/w;
    return (Math.sin(xx*.26-t*6.4)*amp + Math.sin(xx*.115-t*3.5)*amp*.62)*k*k; }
  for(var sN=0;sN<N;sN++){
    var x0=w*sN/N, x1=w*(sN+1)/N, o0=wv(x0), o1=wv(x1);
    var sf=1-Math.max(-.34,Math.min(.34,(o1-o0)*.55));
    c.fillStyle=shade('#20241c',sf);
    c.beginPath();
    c.moveTo(px+x0,py+o0); c.lineTo(px+x1,py+o1);
    c.lineTo(px+x1,py+h+o1); c.lineTo(px+x0,py+h+o0);
    c.closePath(); c.fill();
    if(crestOK&&CREST){
      var sw=CREST.width/N;
      c.save();
      c.beginPath();
      c.moveTo(px+x0,py+o0); c.lineTo(px+x1+.6,py+o1);
      c.lineTo(px+x1+.6,py+h+o1); c.lineTo(px+x0,py+h+o0);
      c.closePath(); c.clip();
      c.globalAlpha=sf>1?1:.92*sf+.08;
      try{ c.drawImage(CREST, sN*sw,0,sw,CREST.height,
                       px+x0, py+o0+h*.06, (w/N)+.7, h*.88); }catch(e){}
      c.globalAlpha=1; c.restore();
    }
  }
  c.strokeStyle='rgba(226,177,60,.65)'; c.lineWidth=1.4;
  c.beginPath(); c.moveTo(px,py);
  for(var q=0;q<=N;q++){ var xa=w*q/N; c.lineTo(px+xa,py+wv(xa)); }
  for(var q2=N;q2>=0;q2--){ var xb=w*q2/N; c.lineTo(px+xb,py+h+wv(xb)); }
  c.closePath(); c.stroke();
}
function drawWindFlag(c,px,py,w,h,cols,t){
  var N=16, amp=2.4+Math.abs(wind)*.2;
  function wv(xx){ var k=xx/w;
    return (Math.sin(xx*.26-t*6.4)*amp + Math.sin(xx*.115-t*3.5)*amp*.62)*k*k; }
  for(var sN=0;sN<N;sN++){
    var x0=w*sN/N, x1=w*(sN+1)/N, o0=wv(x0), o1=wv(x1);
    var sf=1-Math.max(-.34,Math.min(.34,(o1-o0)*.55));
    for(var b=0;b<cols.length;b++){
      var t0=h*b/cols.length, t1=h*(b+1)/cols.length;
      c.fillStyle=shade(cols[b],sf);
      c.beginPath();
      c.moveTo(px+x0,py+t0+o0); c.lineTo(px+x1,py+t0+o1);
      c.lineTo(px+x1,py+t1+o1); c.lineTo(px+x0,py+t1+o0);
      c.closePath(); c.fill();
    }
  }
  c.strokeStyle='rgba(20,18,14,.75)'; c.lineWidth=1.3;
  c.beginPath(); c.moveTo(px,py);
  for(var q=0;q<=N;q++){ var xa=w*q/N; c.lineTo(px+xa,py+wv(xa)); }
  for(var q2=N;q2>=0;q2--){ var xb=w*q2/N; c.lineTo(px+xb,py+h+wv(xb)); }
  c.closePath(); c.stroke();
}
function drawPole(c,x,y,H,band,t,cols){
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x,y+2,11,5,0,0,6.3); c.fill();
  c.fillStyle='#5c5a52'; rrect(c,x-9,y-6,18,9,3); c.fill(); outl(c,'#15130e',1.8);
  c.fillStyle='#c9c6bc'; rrect(c,x-2,y-H,4,H,1.6); c.fill(); outl(c,'#15130e',1.5);
  c.fillStyle='#e2b13c'; c.beginPath(); c.arc(x,y-H-3,3.2,0,6.3); c.fill(); outl(c,'#15130e',1.2);
  if(cols) drawWindFlag(c,x+2,band,30,20,cols,t);
}
/* a hard-standing launch bay: painted box, hazard chevrons, corner brackets */
/* a small chart of the whole area of operations */
function drawMinimap(){
  var mw=Math.min(128,VW*.32), mh=mw*(WH/WW), mx=VW-mw-10, my=VH-mh-Math.max(150,VH*.2);
  var sea=(mapKind==='sea');
  var sx=mw/WW, sy=mh/WH;
  function px(x){ return mx+x*sx; }
  function py(y){ return my+y*sy; }
  ctx.save();
  ctx.fillStyle='rgba(6,16,22,.72)'; rrect(ctx,mx-4,my-4,mw+8,mh+8,5); ctx.fill();
  ctx.strokeStyle='rgba(140,200,220,.5)'; ctx.lineWidth=1.6; rrect(ctx,mx-4,my-4,mw+8,mh+8,5); ctx.stroke();
  ctx.beginPath(); rrect(ctx,mx,my,mw,mh,2); ctx.clip();
  // the ground
  ctx.fillStyle=sea?'rgba(20,42,56,.9)':'rgba(30,28,22,.9)'; ctx.fillRect(mx,my,mw,mh);
  for(var ly=0;ly<MH;ly++) for(var lx=0;lx<MW;lx++){
    var lt=grid[ly*MW+lx];
    if(sea){ if(lt===WATER) continue; ctx.fillStyle='rgba(92,104,74,.85)'; }
    else {
      if(lt===WALL||lt===PROP) ctx.fillStyle='rgba(150,142,126,.75)';
      else if(lt===FLOOR) ctx.fillStyle='rgba(96,78,52,.6)';
      else if(lt===RUBBLE||lt===CRUMBLE||lt===BROKEN) ctx.fillStyle='rgba(120,112,98,.45)';
      else continue;
    }
    ctx.fillRect(px(lx*TILE),py(ly*TILE),Math.max(1,TILE*sx),Math.max(1,TILE*sy));
  }
  // our base
  if(BASE){
    ctx.strokeStyle='rgba(120,220,255,.8)'; ctx.lineWidth=1.4;
    ctx.strokeRect(px(BASE.x0*TILE),py(BASE.y0*TILE),(BASE.x1-BASE.x0)*TILE*sx,(BASE.y1-BASE.y0)*TILE*sy);
  }
  // refineries and launchers on the plot
  for(var rp=0;rp<refineries.length;rp++){
    var RP=refineries[rp], mx9=px(RP.cx), my9=py(RP.cy);
    if(RP.dead){
      ctx.fillStyle='#e8e4d8';
      ctx.beginPath(); ctx.arc(mx9,my9-1,4,0,6.3); ctx.fill(); ctx.fillRect(mx9-2.6,my9+2,5.2,3);
      ctx.fillStyle='#15130e';
      ctx.beginPath(); ctx.arc(mx9-1.5,my9-1.4,1.1,0,6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(mx9+1.5,my9-1.4,1.1,0,6.3); ctx.fill();
    } else {
      ctx.fillStyle='#e2762c'; ctx.beginPath(); ctx.arc(mx9,my9,4,0,6.3); ctx.fill();
      ctx.strokeStyle='rgba(226,118,44,.8)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(mx9,my9,7+Math.abs(Math.sin(now*2))*2,0,6.3); ctx.stroke();
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(mx9-6,my9-9,12,2.4);
      ctx.fillStyle='#d84a34'; ctx.fillRect(mx9-5.5,my9-8.6,11*(RP.hp/RP.mx),1.6);
    }
  }
  for(var sp5=0;sp5<sams.length;sp5++){
    ctx.fillStyle='rgba(216,120,52,.8)';
    ctx.fillRect(px(sams[sp5].x)-1.4,py(sams[sp5].y)-1.4,2.8,2.8);
  }
  // depots on the plot
  for(var dp9=0;dp9<depots.length;dp9++){
    var DP9=depots[dp9], ex9=px(DP9.cx), ey9=py(DP9.cy);
    if(DP9.blown){
      ctx.fillStyle='#e8e4d8';
      ctx.beginPath(); ctx.arc(ex9,ey9-1,4,0,6.3); ctx.fill();
      ctx.fillRect(ex9-2.6,ey9+2,5.2,3);
      ctx.fillStyle='#15130e';
      ctx.beginPath(); ctx.arc(ex9-1.5,ey9-1.4,1.1,0,6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(ex9+1.5,ey9-1.4,1.1,0,6.3); ctx.fill();
      ctx.fillRect(ex9-1.6,ey9+2.2,.9,2.4); ctx.fillRect(ex9+.7,ey9+2.2,.9,2.4);
    } else {
      ctx.fillStyle='#e2762c';
      ctx.beginPath(); ctx.moveTo(ex9,ey9-5); ctx.lineTo(ex9+5,ey9+4); ctx.lineTo(ex9-5,ey9+4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(226,118,44,.8)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(ex9,ey9,7+Math.abs(Math.sin(now*2.2))*2,0,6.3); ctx.stroke();
    }
  }
  // enemy bases, and a skull once their colours are down
  for(var fb2=0;fb2<flags.length;fb2++){
    var FB=flags[fb2], fx8=px(FB.x), fy8=py(FB.y);
    if(FB.state==='done'){
      ctx.fillStyle='#e8e4d8';                                  // skull
      ctx.beginPath(); ctx.arc(fx8,fy8-1,4,0,6.3); ctx.fill();
      ctx.fillRect(fx8-2.6,fy8+2,5.2,3);
      ctx.fillStyle='#15130e';
      ctx.beginPath(); ctx.arc(fx8-1.5,fy8-1.4,1.1,0,6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(fx8+1.5,fy8-1.4,1.1,0,6.3); ctx.fill();
      ctx.fillRect(fx8-1.6,fy8+2.2,.9,2.4); ctx.fillRect(fx8+.7,fy8+2.2,.9,2.4);
    } else {
      var bcol=(FB.state==='ready')?'#f2c744':'#c0392b';
      ctx.fillStyle=bcol;
      ctx.beginPath(); ctx.arc(fx8,fy8,3.4,0,6.3); ctx.fill();
      ctx.strokeStyle=bcol; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(fx8,fy8,5.5+Math.abs(Math.sin(now*2.4))*2,0,6.3); ctx.stroke();
      if(FB.state==='lower'||FB.state==='raise'){              // haul in progress
        ctx.strokeStyle='#f2c744'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(fx8,fy8,7,-1.57,-1.57+6.283*(FB.p/2)); ctx.stroke();
      }
    }
  }
  // dug-in garrisons still holding
  for(var ge2=0;ge2<enemies.length;ge2++){
    var GE=enemies[ge2];
    if(!GE.home&&!GE.boss&&!GE.elite) continue;
    ctx.fillStyle=GE.boss?'rgba(226,177,60,.9)':'rgba(216,74,52,.7)';
    ctx.fillRect(px(GE.x)-1,py(GE.y)-1,2.4,2.4);
  }
  if(tank){
    ctx.save(); ctx.translate(px(tank.x),py(tank.y)); ctx.rotate(tank.ang);
    ctx.fillStyle='#c0392b';
    ctx.fillRect(-4,-2.6,8,5.2);
    ctx.fillRect(3,-1,5,2);
    ctx.restore();
  }
  for(var re2=0;re2<enemies.length;re2++){
    var RE=enemies[re2];
    if(RE.home||RE.boss||RE.elite) continue;
    ctx.fillStyle='rgba(216,74,52,.45)';
    ctx.fillRect(px(RE.x)-.8,py(RE.y)-.8,1.8,1.8);
  }
  // the fleet
  for(var mi=0;mi<ships.length;mi++){
    var MS=ships[mi];
    ctx.save(); ctx.translate(px(MS.x),py(MS.y)); ctx.rotate(MS.ang);
    ctx.fillStyle=MS.sink>0?'#8a8f95':(MS.hp>MS.mx*.5?'#d84a34':'#e2b13c');
    ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(-4,-3.2); ctx.lineTo(-4,3.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    if(MS.sink<=0){
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(px(MS.x)-6,py(MS.y)-8,12,2.4);
      ctx.fillStyle='#d84a34'; ctx.fillRect(px(MS.x)-5.5,py(MS.y)-7.6,11*(MS.hp/MS.mx),1.6);
    }
  }
  // their drones and inbound missiles
  for(var mq2=0;mq2<edrones.length;mq2++){
    ctx.fillStyle='rgba(216,74,52,.9)';
    ctx.beginPath(); ctx.arc(px(edrones[mq2].x),py(edrones[mq2].y),2,0,6.3); ctx.fill();
  }
  for(var mm=0;mm<missiles.length;mm++){
    ctx.fillStyle='#ffbe5a';
    ctx.beginPath(); ctx.arc(px(missiles[mm].x),py(missiles[mm].y),1.8,0,6.3); ctx.fill();
  }
  // what we have out there
  if(truck){
    ctx.save(); ctx.translate(px(truck.x),py(truck.y)); ctx.rotate(truck.ang);
    ctx.fillStyle=truck.down>0?'rgba(140,140,130,.6)':'#9db35a';
    ctx.fillRect(-4,-2.4,8,4.8);
    ctx.restore();
  }
  if(gunboat){
    ctx.fillStyle=aboard?'#7fe8ff':'rgba(127,232,255,.55)';
    ctx.save(); ctx.translate(px(gunboat.x),py(gunboat.y)); ctx.rotate(gunboat.ang);
    ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(-3.5,-2.8); ctx.lineTo(-3.5,2.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if(drone&&piloting){
    ctx.fillStyle='#8fe0d8';
    ctx.beginPath(); ctx.arc(px(drone.x),py(drone.y),2.4,0,6.3); ctx.fill();
    ctx.strokeStyle='rgba(143,224,216,.7)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(px(drone.x),py(drone.y),4.5+Math.sin(now*7)*1.4,0,6.3); ctx.stroke();
  }
  if(!aboard&&!player.dead){
    ctx.fillStyle='#9db35a';
    ctx.beginPath(); ctx.arc(px(player.x),py(player.y),2.6,0,6.3); ctx.fill();
    ctx.strokeStyle='rgba(157,179,90,.8)'; ctx.lineWidth=1; ctx.stroke();
  }
  // what the camera is looking at
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1;
  ctx.strokeRect(px(cam.x),py(cam.y),VW*sx,VH*sy);
  ctx.restore();
  var capt='';
  if(sea){ var afloat2=0; for(var af=0;af<ships.length;af++) if(ships[af].hp>0) afloat2++;
    capt=afloat2+' CONTACTS'; }
  else if(mapKind==='oil'){ var rd5=0; for(var rf5=0;rf5<refineries.length;rf5++) if(refineries[rf5].dead) rd5++;
    capt=rd5+'/'+refineries.length+' REFINERIES DOWN'; }
  else { var taken2=0; for(var tf=0;tf<flags.length;tf++) if(flags[tf].state==='done') taken2++;
    capt=taken2+'/'+flags.length+' BASES TAKEN'; }
  ctx.fillStyle='rgba(180,220,235,.8)'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText(capt,mx+mw/2,my-8); ctx.textAlign='start';
}
/* the marked square you stand in to trade, right in front of the counter */
function drawShopBay(){
  var w=52, h=40, x=shopPad.x-w/2, y=shopPad.y-h/2;
  var near=player&&Math.hypot(player.x-shopPad.x,player.y-shopPad.y)<30;
  var pulse=.5+Math.abs(Math.sin(now*2))*.5;
  ctx.fillStyle='rgba(20,16,8,.55)'; rrect(ctx,x,y,w,h,3); ctx.fill();
  ctx.save(); rrect(ctx,x,y,w,h,3); ctx.clip();
  ctx.globalAlpha=near?.34:.18;
  for(var cv8=-h;cv8<w+h;cv8+=13){
    ctx.fillStyle=(cv8/13)%2?'#e2b13c':'#241c0c';
    ctx.beginPath(); ctx.moveTo(x+cv8,y); ctx.lineTo(x+cv8+6,y);
    ctx.lineTo(x+cv8+6-h,y+h); ctx.lineTo(x+cv8-h,y+h); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();
  ctx.strokeStyle=near?'rgba(226,177,60,.95)':'rgba(226,177,60,.6)'; ctx.lineWidth=2.4;
  rrect(ctx,x,y,w,h,3); ctx.stroke();
  ctx.lineWidth=3; var br8=11;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(function(k8){
    ctx.beginPath(); ctx.moveTo(k8[0]+br8*k8[2],k8[1]); ctx.lineTo(k8[0],k8[1]);
    ctx.lineTo(k8[0],k8[1]+br8*k8[3]); ctx.stroke();
  });
  ctx.fillStyle='rgba(226,177,60,'+(near?.95:.55+pulse*.2)+')';
  ctx.font='bold 15px Arial'; ctx.textAlign='center';
  ctx.fillText('$',shopPad.x,shopPad.y+5);
  ctx.font='bold 7px Arial'; ctx.fillStyle='rgba(226,177,60,.7)';
  ctx.fillText('STAND HERE TO TRADE',shopPad.x,y+h+9); ctx.textAlign='start';
}
function drawDroneStand(P,col,cd){
  var live=cd<=0, pulse=.5+Math.abs(Math.sin(now*2.4))*.5;
  var sx=P.standX, sy=P.standY, sw=42;
  // Distinct Level 1 command desks surround the operator position without hiding the player.
  if(P.table){
    var glow=live?'rgba(92,210,235,'+(.58+pulse*.25)+')':'rgba(110,130,136,.35)';
    ctx.fillStyle='rgba(7,12,14,.34)';
    if(P.kind==='droneS'){
      // SCOUT: large L-shaped surveillance desk with one tall map display and a radar panel.
      rrect(ctx,sx-61,sy-29,27,60,4); ctx.fill(); rrect(ctx,sx-61,sy+25,78,22,4); ctx.fill();
      ctx.fillStyle='#465153'; rrect(ctx,sx-59,sy-31,25,58,4); ctx.fill(); outl(ctx,'#171c1e',1.5);
      rrect(ctx,sx-59,sy+24,76,21,4); ctx.fill(); outl(ctx,'#171c1e',1.5);
      ctx.fillStyle='#101b20'; rrect(ctx,sx-55,sy-26,17,31,2); ctx.fill();
      ctx.fillStyle=glow; rrect(ctx,sx-53,sy-24,13,27,1); ctx.fill();
      ctx.strokeStyle='rgba(230,248,250,.55)'; ctx.lineWidth=.8;
      ctx.beginPath(); ctx.arc(sx-46.5,sy-10.5,5,0,6.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx-46.5,sy-10.5); ctx.lineTo(sx-42,sy-14); ctx.stroke();
      ctx.fillStyle='#182326'; rrect(ctx,sx-29,sy+28,39,10,2); ctx.fill();
      ctx.fillStyle=live?col:'#69777a'; for(var sk=0;sk<8;sk++) ctx.fillRect(sx-25+sk*4,sy+31,2.5,2);
      ctx.fillStyle='rgba(12,18,20,.78)'; rrect(ctx,sx-31,sy-35,57,9,2); ctx.fill();
      ctx.fillStyle=live?col:'#83949b'; ctx.font='bold 6px Arial'; ctx.textAlign='center';
      ctx.fillText('SCOUT SURVEILLANCE',sx-2,sy-28.5);
    } else {
      // FPV: wide mission-control desk with twin displays, stick controls and a radio tower.
      rrect(ctx,sx-43,sy-47,87,24,4); ctx.fill(); rrect(ctx,sx+34,sy-24,28,52,4); ctx.fill();
      ctx.fillStyle='#3d474b'; rrect(ctx,sx-45,sy-49,89,24,4); ctx.fill(); outl(ctx,'#171c1e',1.5);
      rrect(ctx,sx+34,sy-24,27,50,4); ctx.fill(); outl(ctx,'#171c1e',1.5);
      [-22,7].forEach(function(mx){
        ctx.fillStyle='#101b20'; rrect(ctx,sx+mx-12,sy-46,24,14,2); ctx.fill();
        ctx.fillStyle=glow; rrect(ctx,sx+mx-10,sy-44,20,10,1); ctx.fill();
        ctx.strokeStyle='rgba(230,248,250,.5)'; ctx.lineWidth=.7;
        ctx.beginPath(); ctx.moveTo(sx+mx-7,sy-39); ctx.lineTo(sx+mx+7,sy-39); ctx.stroke();
      });
      ctx.fillStyle='#171f21'; rrect(ctx,sx+39,sy-19,17,15,2); ctx.fill();
      ctx.fillStyle=live?'#62d6a0':'#737b78'; ctx.beginPath(); ctx.arc(sx+44,sy-13,2,0,6.3); ctx.fill();
      ctx.fillStyle=live?'#e2b13c':'#737b78'; ctx.beginPath(); ctx.arc(sx+51,sy-13,2,0,6.3); ctx.fill();
      ctx.strokeStyle='#20282a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx+47,sy+1); ctx.lineTo(sx+47,sy+10); ctx.stroke();
      ctx.fillStyle='#2a3436'; ctx.beginPath(); ctx.arc(sx+47,sy,3.2,0,6.3); ctx.fill();
      ctx.fillStyle='rgba(12,18,20,.78)'; rrect(ctx,sx-28,sy-59,56,9,2); ctx.fill();
      ctx.fillStyle=live?col:'#83949b'; ctx.font='bold 6px Arial'; ctx.textAlign='center';
      ctx.fillText(P.kind==='droneL'?'HEAVY DRONE CONTROL':'FPV MISSION CONTROL',sx,sy-52.5);
    }
    ctx.textAlign='start';
  }
  // Ground-only layer: the player is drawn later and therefore stands over it.
  ctx.fillStyle=live?'rgba(28,46,50,.48)':'rgba(30,30,28,.4)';
  rrect(ctx,sx-sw/2,sy-sw/2,sw,sw,3); ctx.fill();
  ctx.strokeStyle=live?col:'rgba(150,160,166,.35)'; ctx.lineWidth=2;
  rrect(ctx,sx-sw/2,sy-sw/2,sw,sw,3); ctx.stroke();
  ctx.strokeStyle=live?'rgba(220,240,244,'+(.3+pulse*.35)+')':'rgba(150,160,166,.2)';
  ctx.lineWidth=1.2; ctx.setLineDash([5,4]);
  rrect(ctx,sx-sw/2+5,sy-sw/2+5,sw-10,sw-10,2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle=live?col:'#83949b'; ctx.font='bold 7px Arial'; ctx.textAlign='center';
  ctx.fillText(live?'STAND HERE':Math.ceil(cd)+'s',sx,sy+3);
  ctx.textAlign='start';
}

function drawDroneTable(P,col,label,cd,icon){
  var live=cd<=0;
  var sx=P.standX, sy=P.standY, sw=42;

  // Display table with the selected drone resting on top.
  var tw=58, th=38, tx=P.x-tw/2, ty=P.y-th/2;
  ctx.fillStyle='rgba(0,0,0,.3)'; rrect(ctx,tx+3,ty+5,tw,th,4); ctx.fill();
  ctx.fillStyle='#5e625b'; rrect(ctx,tx,ty,tw,th,4); ctx.fill(); outl(ctx,'#171a17',1.8);
  ctx.fillStyle='#7a8077'; rrect(ctx,tx+3,ty+3,tw-6,th-13,3); ctx.fill();
  ctx.strokeStyle='rgba(220,230,225,.2)'; ctx.lineWidth=1; ctx.strokeRect(tx+5,ty+5,tw-10,th-17);
  ctx.fillStyle='#30342f'; ctx.fillRect(tx+5,ty+th-8,7,12); ctx.fillRect(tx+tw-12,ty+th-8,7,12);
  ctx.save(); ctx.translate(P.x,P.y-5); ctx.globalAlpha=live?1:.3;
  toolIcon(ctx,icon,icon==='droneL'?40:34); ctx.restore();
  ctx.fillStyle=live?'rgba(8,12,14,.82)':'rgba(20,20,20,.68)';
  rrect(ctx,tx+3,ty-14,tw-6,12,2); ctx.fill();
  ctx.fillStyle=live?col:'#8fa0a6'; ctx.font='bold 8px Arial';
  ctx.fillText(live?label:label+' '+Math.ceil(cd)+'s',P.x,ty-5);
  // Direction marker visually connects the square to its table.
  ctx.strokeStyle=live?col:'rgba(150,160,166,.3)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(sx+sw/2,sy); ctx.lineTo(tx-4,P.y); ctx.stroke();
  ctx.textAlign='start';
}
function drawPadBay(P,col,label,cd,icon){
  var w=(icon==='droneL')?86:(icon==='usv'?76:72), h=(icon==='droneL')?62:54;
  var x=P.x-w/2, y=P.y-h/2, live=(cd<=0), pulse=.5+Math.abs(Math.sin(now*2))*.5;
  ctx.fillStyle=mapKind==='sea'?'rgba(26,34,40,.72)':'rgba(24,24,20,.6)';
  rrect(ctx,x,y,w,h,4); ctx.fill();
  ctx.save(); rrect(ctx,x,y,w,h,4); ctx.clip();                       // hazard chevrons
  ctx.globalAlpha=live?.3:.12;
  for(var cvz=-h;cvz<w+h;cvz+=14){
    ctx.fillStyle=(cvz/14)%2?col:'#0d1418';
    ctx.beginPath(); ctx.moveTo(x+cvz,y); ctx.lineTo(x+cvz+7,y);
    ctx.lineTo(x+cvz+7-h,y+h); ctx.lineTo(x+cvz-h,y+h); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();
  ctx.strokeStyle=live?col:'rgba(160,170,176,.35)'; ctx.lineWidth=2;
  rrect(ctx,x,y,w,h,4); ctx.stroke();
  ctx.lineWidth=3; ctx.strokeStyle=live?col:'rgba(160,170,176,.4)';   // corner brackets
  var br=13;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(function(k4){
    ctx.beginPath(); ctx.moveTo(k4[0]+br*k4[2],k4[1]); ctx.lineTo(k4[0],k4[1]);
    ctx.lineTo(k4[0],k4[1]+br*k4[3]); ctx.stroke();
  });
  if(live){                                                           // scanning sweep
    ctx.globalAlpha=.18+pulse*.22; ctx.fillStyle=col;
    var sy3=y+2+((now*36)%(h-4));
    ctx.fillRect(x+2,sy3,w-4,2.5);
    ctx.globalAlpha=1;
  }
  // the airframe waiting on the pad
  ctx.save(); ctx.translate(P.x,P.y-2); ctx.globalAlpha=live?1:.28;
  if(live){
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(2,8,(icon==='droneL')?17:13,(icon==='droneL')?7:5,0,0,6.3); ctx.fill();
  }
  toolIcon(ctx,icon,(icon==='droneL')?46:38);
  ctx.globalAlpha=1; ctx.restore();
  // pad number plate
  ctx.fillStyle=live?'rgba(0,0,0,.45)':'rgba(0,0,0,.3)';
  rrect(ctx,x+4,y+h-13,20,10,2); ctx.fill();
  ctx.fillStyle=live?col:'rgba(160,170,176,.5)'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText('0'+(padList.indexOf(P)+1),x+14,y+h-5); ctx.textAlign='start';
  ctx.fillStyle=live?col:'#8fa6b2'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText(live?label:Math.ceil(cd)+'s  RELOADING',P.x,y-6);
  ctx.font='bold 7px Arial'; ctx.fillStyle='rgba(200,214,222,.6)';
  ctx.fillText(live?'STAND IN THE BAY':'',P.x,y+h+10);
  ctx.textAlign='start';
}
function drawFire(c,f){
  var k=f.p, base=f.r;
  c.save(); c.translate(f.x,f.y);
  // charred debris at the base
  c.fillStyle='rgba(24,18,14,.85)'; c.beginPath(); c.ellipse(0,0,base*.9,base*.42,0,0,6.3); c.fill();
  var cols=['rgba(196,44,22,.80)','rgba(248,124,32,.88)','rgba(255,206,104,.95)','rgba(255,246,206,.9)'];
  for(var i=0;i<4;i++){
    var w=base*(.95-i*.19), h=base*(2.5-i*.48);
    var wob=Math.sin(k*(2.1+i*.5)+i*1.7)*base*.22, wob2=Math.sin(k*3.1+i)*base*.12;
    c.fillStyle=cols[i];
    c.beginPath(); c.moveTo(-w,0);
    c.quadraticCurveTo(-w*.85+wob2,-h*.5, wob,-h);
    c.quadraticCurveTo(w*.85+wob2,-h*.5, w,0);
    c.closePath(); c.fill();
  }
  // licks breaking off the top
  for(var j=0;j<2;j++){
    var ly=-base*(2.3+Math.abs(Math.sin(k*1.6+j*2.2))*.8), lw=base*.2;
    c.fillStyle='rgba(255,170,60,'+(.35+Math.sin(k*2+j)*.2)+')';
    c.beginPath(); c.ellipse(Math.sin(k*1.3+j)*base*.4,ly,lw,lw*1.9,0,0,6.3); c.fill();
  }
  c.restore();
}
function drawCrate(c,cr){
  c.save(); c.translate(cr.x,cr.y); c.rotate(cr.rot);
  c.fillStyle='rgba(0,0,0,.4)'; rrect(c,-14,-10,30,26,3); c.fill();
  if(!cr.open){
    c.fillStyle='#8a6b3f'; rrect(c,-15,-15,30,30,3); c.fill(); outl(c,'#2b1f10',2.4);
    c.strokeStyle='rgba(50,34,16,.75)'; c.lineWidth=2.4;
    c.beginPath(); c.moveTo(-13,-13); c.lineTo(13,13); c.moveTo(13,-13); c.lineTo(-13,13); c.stroke();
    c.fillStyle='#c2a15c'; c.fillRect(-15,-4,30,8); outl(c,'#2b1f10',1.6);
    c.fillStyle='#4d5a30'; c.fillRect(-6,-13,12,4);
    // pulse
    var pu=(Math.sin(Date.now()/260)+1)/2;
    c.globalAlpha=.18+pu*.22; c.strokeStyle='#e2b13c'; c.lineWidth=2;
    c.beginPath(); c.arc(0,0,20+pu*4,0,6.3); c.stroke(); c.globalAlpha=1;
  } else {
    c.fillStyle='#6a5230'; rrect(c,-15,-15,30,30,3); c.fill(); outl(c,'#2b1f10',2.4);
    c.fillStyle='rgba(0,0,0,.55)'; rrect(c,-11,-11,22,22,2); c.fill();
    c.save(); c.translate(-19,-2); c.rotate(-.5);
    c.fillStyle='#8a6b3f'; rrect(c,-14,-4,28,8,2); c.fill(); outl(c,'#2b1f10',2); c.restore();
  }
  c.restore();
}

/* =========================================================================
   LOOP
   ========================================================================= */
var last=0, cardT=0, cardData=null;
function frame(t){
  var raw=Math.min(.05,(t-last)/1000); last=t;
  var dt=raw;
  if(droneCam){
    droneCam.t-=raw;
    if(droneCam.t<=0) droneCam=null;
    else dt=raw*(1-.58*Math.min(1,droneCam.t/1.1));
  }
  if(state==='card'){ cardT+=dt; if(!pendingCard||!cardData) closeCard(); }
  if(state==='play') update(dt);
  if(player) draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(function(t){ last=t; requestAnimationFrame(frame); });

/* =========================================================================
   MENU WIRING
   ========================================================================= */
function buildKitPicker(){
  var host=document.getElementById('kits'); if(!host) return;
  var keep=PK;
  for(var i=0;i<PKITS.length;i++){
    (function(idx){
      var kit=PKITS[idx];
      var div=document.createElement('div'); div.className='kit'+(idx===kitIdx?' sel':'');
      var cv2=document.createElement('canvas'); cv2.width=50; cv2.height=70;
      var pc=cv2.getContext('2d');
      PK=kit;
      pc.save(); pc.translate(25,63); pc.scale(1.16,1.16);
      drawUnit(pc,0,0,.75,kit.col,kit.band,1.9,1,null,'rifle',false,false,false,idx*137+11);
      pc.restore();
      var lab=document.createElement('span'); lab.textContent=kit.n;
      div.appendChild(cv2); div.appendChild(lab); host.appendChild(div);
      bindTap(div,function(){
        kitIdx=idx; PK=PKITS[idx];
        var all=host.querySelectorAll('.kit');
        for(var q=0;q<all.length;q++) all[q].className='kit'+(q===idx?' sel':'');
      });
    })(i);
  }
  PK=keep;
}
buildKitPicker();

/* Menu previews for every named boss defeat card. */
var bossCardPreviewTimer=0;
function drawFinalBossCard(){
  var cv=document.getElementById('finalBossCardCv'); if(!cv) return;
  var cc=cv.getContext('2d'); cc.clearRect(0,0,cv.width,cv.height);
  var bg=cc.createLinearGradient(0,0,0,cv.height); bg.addColorStop(0,'#777f7d'); bg.addColorStop(.5,'#343a37'); bg.addColorStop(1,'#171916');
  cc.fillStyle=bg; cc.fillRect(0,0,cv.width,cv.height);
  cc.fillStyle='rgba(190,38,30,.2)'; cc.beginPath(); cc.arc(145,27,36,0,6.3); cc.fill();
  drawMountedBoss(cc,{x:84,y:122,ang:0,horsePhase:.7,bossScale:.88});
}
function closeBossCardPreview(){
  clearTimeout(bossCardPreviewTimer);
  var cards=document.querySelectorAll('#bossVictory,#levelTwoBossVictory,#seaBossVictory,#levelFourBossVictory,#airBossVictory,#finalBossVictory');
  for(var i=0;i<cards.length;i++) cards[i].classList.remove('show','preview');
}
function showBossCardPreview(id){
  closeBossCardPreview();
  if(id==='finalBossVictory') drawFinalBossCard();
  var card=document.getElementById(id); if(!card) return;
  card.classList.add('preview','show'); sfx('clear');
  bossCardPreviewTimer=setTimeout(closeBossCardPreview,5200);
}
Array.prototype.forEach.call(document.querySelectorAll('.deathCardLink'),function(link){
  bindTap(link,function(){ showBossCardPreview(link.getAttribute('data-card')); });
});
Array.prototype.forEach.call(document.querySelectorAll('#bossVictory,#levelTwoBossVictory,#seaBossVictory,#levelFourBossVictory,#airBossVictory,#finalBossVictory'),function(card){
  bindTap(card,function(){ if(card.classList.contains('preview')) closeBossCardPreview(); });
});

/* the title card, then the menu */
(function(){
  var sp=document.getElementById('splash');
  if(!sp) return;
  var done=false;
  function drop(){
    if(done) return; done=true;
    sp.classList.add('gone');
    setTimeout(function(){ if(sp&&sp.parentNode) sp.parentNode.removeChild(sp); },700);
  }
  bindTap(sp,drop);
  setTimeout(drop,5000);
})();
var levelIntroTimer=0,levelIntroActive=0;
var levelIntroIds={1:'levelOneIntro',2:'levelTwoIntro',3:'levelThreeIntro',4:'levelFourIntro',5:'levelFiveIntro',6:'levelSixIntro'};
function beginLevelFromIntro(level){
  level=parseInt(level,10);
  if(levelIntroActive!==level) return;
  levelIntroActive=0; clearTimeout(levelIntroTimer);
  var intro=document.getElementById(levelIntroIds[level]);
  if(intro){ intro.classList.remove('show'); intro.setAttribute('aria-hidden','true'); }
  totalKills=0; timeAlive=0; belt=level===1?[]:['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0;
  setTimeout(function(){ startSector(level); },390);
}
function showLevelIntro(level){
  var intro=document.getElementById(levelIntroIds[level]);
  if(!intro){ levelIntroActive=level; beginLevelFromIntro(level); return; }
  levelIntroActive=level; intro.setAttribute('aria-hidden','false'); intro.classList.add('show');
  var bar=intro.querySelector('.levelIntroBar i');
  if(bar){ bar.style.animation='none'; void bar.offsetWidth; bar.style.animation=''; }
  clearTimeout(levelIntroTimer); levelIntroTimer=setTimeout(function(){ beginLevelFromIntro(level); },6000);
}
Array.prototype.forEach.call(document.querySelectorAll('.levelIntroStart'),function(button){
  bindTap(button,function(){ beginLevelFromIntro(button.getAttribute('data-intro-level')); });
});
bindTap(document.getElementById('go'),function(){
  document.getElementById('start').classList.add('hide'); ac(); showLevelIntro(1);
});
Array.prototype.forEach.call(document.querySelectorAll('.lvl'),function(b){
  bindTap(b,function(){
    var level=parseInt(b.getAttribute('data-l'),10);
    document.getElementById('start').classList.add('hide'); ac(); showLevelIntro(level);
  });
});
bindTap(document.getElementById('bossTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(6);
  enemies.length=0; sams.length=0; samShots.length=0;
  for(var tc=0;tc<motorcade.length;tc++){ motorcade[tc].dead=1; motorcade[tc].hp=0; motorcade[tc].gunHits=3; }
  for(var tb=0;tb<refineries.length;tb++){ refineries[tb].dead=1; refineries[tb].hp=0; }
  player.x=49*TILE; player.y=33*TILE; player.face=-.75;
  cam.x=player.x-VW/2; cam.y=player.y-VH/2;
  intro=[]; introT=999; spawnRedBoss(); hud();
});
bindTap(document.getElementById('bossOneTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(1);
  enemies.length=0; queue.length=0; spawnQ=0; edrones.length=0; tank=null; tankSent=1;
  for(var bf1=0;bf1<flags.length;bf1++){ flags[bf1].state='done'; flags[bf1].p=2; flags[bf1].assault=0; }
  for(var bd1=0;bd1<depots.length;bd1++) depots[bd1].blown=1;
  intro=[]; introT=999; spawnCompoundBoss();
  var testBoss=enemies[enemies.length-1];
  player.face=Math.atan2(testBoss.y-player.y,testBoss.x-player.x);
  cam.x=player.x-VW/2; cam.y=player.y-VH/2; hud();
});
bindTap(document.getElementById('bossTwoTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(2);
  enemies.length=0; queue.length=0; spawnQ=0; edrones.length=0; tank=null; tankSent=1; aaGuns.length=0;
  for(var bf2=0;bf2<flags.length;bf2++){ flags[bf2].state='done'; flags[bf2].p=2; flags[bf2].assault=0; }
  for(var bd2=0;bd2<depots.length;bd2++) depots[bd2].blown=1;
  intro=[]; introT=999; spawnLevelTwoBoss(); hud();
});
bindTap(document.getElementById('bossThreeTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(3);
  ships.length=0; enemies.length=0; missiles.length=0; queue.length=0; spawnQ=0; edrones.length=0;
  intro=[]; introT=999; spawnSeaBoss();
  player.x=homeSpawn.x*TILE; player.y=homeSpawn.y*TILE; player.face=-.7;
  cam.x=player.x-VW/2; cam.y=player.y-VH/2; hud();
});
bindTap(document.getElementById('bossFourTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(4);
  enemies.length=0; queue.length=0; spawnQ=0; sams.length=0; samShots.length=0; missiles.length=0;
  for(var rf4=0;rf4<refineries.length;rf4++){ refineries[rf4].dead=1; refineries[rf4].hp=0; }
  intro=[]; introT=999; spawnOilBoss();
  var oilBoss=enemies[enemies.length-1],oilSpawn=freeSpot(38*TILE,29*TILE);
  player.x=oilSpawn.x; player.y=oilSpawn.y; player.face=Math.atan2(oilBoss.y-player.y,oilBoss.x-player.x);
  cam.x=player.x-VW/2; cam.y=player.y-VH/2; hud();
});
bindTap(document.getElementById('bossFiveTest'),function(){
  document.getElementById('start').classList.add('hide');
  totalKills=0; timeAlive=0; belt=['drone','med']; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; ac();
  startSector(5);
  enemies.length=0; queue.length=0; spawnQ=0; sams.length=0; samShots.length=0; airAssaultWave=2; airAssaultT=999;
  for(var pa5=0;pa5<aircraft.length;pa5++){ aircraft[pa5].dead=1; aircraft[pa5].hp=0; }
  intro=[]; introT=999; spawnAirfieldBoss();
  var airBoss=enemies[enemies.length-1],airSpawn=freeSpot(39*TILE,21*TILE);
  player.x=airSpawn.x; player.y=airSpawn.y; player.face=Math.atan2(airBoss.y-player.y,airBoss.x-player.x);
  cam.x=player.x-VW/2; cam.y=player.y-VH/2; hud();
});
bindTap(document.getElementById('retry'),function(){
  document.getElementById('over').classList.add('hide'); totalKills=0; timeAlive=0; belt=[]; money=0; bought={}; upgAP=60; upgHP=100; squadLost=0; startSector(1);
});
bindTap(document.getElementById('mute'),function(){
  var m=document.getElementById('mute');
  muted=!muted; m.textContent=muted?'✕':'♪'; m.style.opacity=muted?.5:1;
  if(muted) stopMusic(); else if(state==='play') startMusic(mapKind);
});

})();
