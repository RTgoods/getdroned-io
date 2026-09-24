const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('public/get-droned/assets/js/game.js','utf8'),ast=ts.createSourceFile('game.js',source,99,true),f={};
function walk(n){if(ts.isFunctionDeclaration(n)&&n.name)f[n.name.text]=n.getText(ast);ts.forEachChild(n,walk);}walk(ast);
test('refinery spawn positions respect body clearance and exclude home base',()=>{
 const c={Math,TILE:34,MW:12,MH:12,inBase:(x,y)=>x<60,hitBox:(x,y,r)=>Math.abs(x-119)<r+15&&Math.abs(y-119)<r+15};vm.createContext(c);vm.runInContext(f.refineryGuardSpots,c);
 const spots=c.refineryGuardSpots({x0:1,y0:1,x1:7,y1:7},12);assert(spots.length);assert(spots.every(p=>!c.inBase(p.x,p.y)&&!c.hitBox(p.x,p.y,12)));
});
test('blocked refinery routes stop animation and are discarded for replanning',()=>{
 const c={Math,TILE:34,player:{x:400,y:400},refineryGuardSpots:()=>[{x:51,y:51}],hitBox:()=>false,moveEnt(){}};
 vm.createContext(c);vm.runInContext(f.moveRefineryGuard,c);
 const en={x:51,y:51,r:12,home:{},d:{spd:60,range:300},refPath:[{x:51,y:51},{x:119,y:51}],refPi:1,refRouteT:10,refJam:0,amt:1,walk:0};
 for(let i=0;i<6;i++)c.moveRefineryGuard(en,.1,false);
 assert.equal(en.refPath,null);assert.equal(en.amt,0);assert.equal(en.walk,0);assert.equal(en.x,51);
});
