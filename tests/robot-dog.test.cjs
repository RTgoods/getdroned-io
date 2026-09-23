const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',source,99,true),functions={};
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name)functions[n.name.text]=n.getText(ast);ts.forEachChild(n,visit)}visit(ast);
function setup(){const c={Math,autoAimEnabled:false,touchControls:{matches:true},mouseAim:{active:false},enemies:[],los:()=>true,smokeBlocked:()=>false,keyVec:()=>null,mv:{x:0,y:0,m:0},WW:1000,WH:1000,hitBox:()=>false,sfx(){},cam:{x:0,y:0}};vm.createContext(c);for(const n of ['dogAim','dogJumpHeading','dogLandingPoint','dogJump'])vm.runInContext(functions[n],c);return c;}
test('mobile assist stays inside forward cone without rotating chassis',()=>{const c=setup(),D={x:100,y:100,ang:0};c.enemies=[{x:300,y:120,hp:100}];c.dogAim(D);assert.equal(D.ang,0);assert(D.gunAngle>0);c.enemies=[{x:300,y:140,hp:100}];c.dogAim(D);assert.equal(D.gunAngle,0);c.enemies=[{x:300,y:100,hp:100}];c.los=()=>false;c.dogAim(D);assert(!D.aimAssisted);});
test('desktop mouse aims gun independently of body',()=>{const c=setup(),D={x:100,y:100,ang:0};c.touchControls.matches=false;c.mouseAim={active:true,x:100,y:200};c.dogAim(D);assert.equal(D.gunAngle,Math.PI/2);assert.equal(D.ang,0);});
test('jump follows movement and marker stops before obstacle',()=>{const c=setup();c.drone={kind:'dog',x:100,y:100,ang:0,gunAngle:Math.PI};c.mv={x:0,y:1,m:1};c.dogJump();assert.equal(c.drone.jumpAngle,Math.PI/2);assert.equal(c.drone.jumpCD,3);c.hitBox=(x,y)=>y>=160;const p=c.dogLandingPoint(c.drone,Math.PI/2);assert(p.y<160&&p.y>=148);const before=c.drone.jumpAngle;c.mv={x:-1,y:0,m:1};c.dogJump();assert.equal(c.drone.jumpAngle,before);});
test('fresh dog launch stays finite through idle, movement and firing',()=>{
 const c=setup();Object.assign(c,{player:{x:50,y:50},level:5,DRONE_HANDLING:{dog:{speed:230,response:.08,brake:.04}},firing:false,bullets:[],fx:[],rr:(a,b)=>(a+b)/2});
 for(const name of ['steerDrone','moveEnt','updateRobotDog'])vm.runInContext(functions[name],c);
 c.drone={x:400,y:400,vx:0,vy:0,ang:0,t:90,rot:0,kind:'dog',hp:175,mx:175};
 c.updateRobotDog(1/60);assert.equal(c.drone.x,400);assert.equal(c.drone.y,400);
 c.mv={x:1,y:0,m:1};c.firing=true;
 for(let i=0;i<60;i++){c.updateRobotDog(1/60);assert(Number.isFinite(c.drone.x)&&Number.isFinite(c.drone.y));}
 assert(c.drone.x>400);assert(c.bullets.length>0);assert(c.bullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy)));
});
