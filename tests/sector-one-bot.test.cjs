const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8');
const ast=ts.createSourceFile('game.js',source,99,true),functions={};
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name)functions[n.name.text]=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
function setup(){
 const c={Math,adminToolAllowed:true,level:1,state:'play',TILE:34,MW:12,MH:12,
 player:{x:51,y:51,hp:100,ap:60,mag:12,res:72,reload:0,guns:[]},bot:{on:true,phase:'',elapsed:0,pathT:0,stuck:0},
 mv:{x:0,y:0,m:0},mouseAim:{active:false},keys:{},enemies:[],flags:[],drops:[],crates:[],eb:[],belt:[],money:0,baseHP:100,baseMX:100,
 compoundDroneHub:null,compoundBossSpawned:false,cam:{x:0,y:0},shopPad:{x:60,y:60},
 nearestTarget:()=>null,inBase:()=>false,solidAt:()=>false,los:()=>true,
 pfMark:0,pfSeen:new Int32Array(144),pfPrev:new Int32Array(144),pfQ:new Int32Array(144),
 PFD:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
 blocksMove:t=>t===1,T:(x,y)=>x<0||y<0||x>=12||y>=12?1:0};
 vm.createContext(c);for(const name of ['findPath','botRelease','botStop','botNavigate','botAim','botStep'])vm.runInContext(functions[name],c);return c;
}
test('bot routes around a wall through its opening without crossing blocked tiles',()=>{
 const c=setup();c.T=(x,y)=>x<0||y<0||x>=12||y>=12||x===5&&y!==9?1:0;
 const goal={x:9.5*34,y:1.5*34};let arrived=false;
 for(let i=0;i<3000;i++){
  if(c.botNavigate(goal,18,.05)){arrived=true;break;}
  c.player.x+=c.mv.x*c.mv.m*6;c.player.y+=c.mv.y*c.mv.m*6;
  assert.equal(c.T(Math.floor(c.player.x/34),Math.floor(c.player.y/34)),0);
 }
 assert(arrived);
});
test('bot attacks hub, then holds a cleared flag, and seeks hidden garrison defenders',()=>{
 const c=setup();c.compoundDroneHub={x:170,y:51,hp:700,dead:false};c.botStep(.05);
 assert(c.firing);assert(c.mouseAim.active);assert.equal(c.bot.phase,'Destroying enemy drone hub');
 c.compoundDroneHub.dead=true;c.flags=[{x:51,y:51,state:'lower'}];c.botStep(.05);assert.equal(c.mv.m,0);assert.match(c.bot.phase,/Capturing/);
 c.flags[0].state='idle';c.enemies=[{x:280,y:150,home:{i:0}}];c.botStep(.05);assert(c.mv.m>0);
});
test('bot does not grant free ammo and does not reset an ongoing reload',()=>{
 const c=setup();c.player.mag=0;c.player.res=20;c.player.reload=.8;
 c.startReload=()=>{throw Error('reload restarted');};c.botStep(.05);assert.equal(c.player.reload,.8);
 c.player.res=0;c.player.guns=[];c.botStep(.05);assert.equal(c.player.mag,0);assert.equal(c.money,0);
});
test('only approaching bullets cause a dodge; non-admin and other sectors stop',()=>{
 const c=setup();c.eb=[{x:100,y:51,vx:100,vy:0}];c.botStep(.05);assert.equal(c.mv.m,0);
 c.eb[0].vx=-100;c.botStep(.05);assert.equal(c.mv.m,1);
 c.level=2;c.botStep(.05);assert.equal(c.bot.on,false);assert.equal(c.mv.m,0);
 c.level=1;c.bot.on=true;c.adminToolAllowed=false;c.botStep(.05);assert.equal(c.bot.on,false);
});
test('Sector 1 bot result holds solved screen instead of advancing and finishes recording',()=>{
 const c=setup(),callbacks=[];const el={classList:{add(){}},parentElement:{style:{}}};
 Object.assign(c,{document:{getElementById:()=>el},clearTimeout(){},setTimeout(fn){callbacks.push(fn);},SOLVED_IMGS:['one.png'],solvedAdvanceTimer:null,launchSolvedFireworks(){},continueSector(){throw Error('advanced to Sector 2');},REC:{stopManual(){c.saved=true;}},adminBotStatus(){}});
 c.bot.session=true;vm.runInContext(functions.showLevelSolvedScreen,c);c.showLevelSolvedScreen();assert.equal(c.bot.on,false);assert.equal(c.bot.phase,'Sector 1 complete');callbacks.forEach(fn=>fn());assert(c.saved);
});
test('recorder saves captured chunks and releases tracks; non-admin cannot start it',()=>{
 const c=setup();let stopped=0,saved=0;
 const recorder={state:'recording',mimeType:'video/webm',start(){},stop(){this.state='inactive';this.ondataavailable({data:{size:10}});this.onstop();}};
 Object.assign(c,{window:{_recEnabled:true},vc:{captureStream(){return {getTracks:()=>[{stop(){stopped++;}}]};}},MediaRecorder:function(){return recorder;},bestMime:()=> 'video/webm',manMR:null,manChunks:[],_manActive:false,notice(){},Blob:function(chunks){assert(chunks.length);},saveBlob(){saved++;}});
 vm.runInContext(functions.startManual+'\n'+functions.stopManual,c);
 c.startManual();assert(c._manActive);c.stopManual();assert.equal(stopped,1);assert.equal(saved,1);assert(!c._manActive);
 c.adminToolAllowed=false;c.startManual();assert(!c._manActive);
});
test('recorder failure reports error and releases stream rather than interrupting game',()=>{
 const c=setup();let stopped=0;
 Object.assign(c,{window:{_recEnabled:true},vc:{captureStream(){return {getTracks:()=>[{stop(){stopped++;}}]};}},MediaRecorder:function(){throw Error('Unsupported codec');},bestMime:()=>'',_manActive:false,manMR:null,manChunks:[]});
 vm.runInContext(functions.startManual,c);c.startManual();assert.equal(c.bot.error,'Unsupported codec');assert.equal(stopped,1);assert(!c._manActive);
});
