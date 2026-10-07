import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
function loadApplyHardLapse(){
  const source=readFileSync(new URL('../js/app/main.js',import.meta.url),'utf8');
  const start=source.indexOf('function preLapseIntervalDays(progress)');
  const end=source.indexOf('function applyUncertainLapse',start);
  assert.ok(start>=0&&end>start,'expected hard-lapse source block');
  const snippet=source.slice(start,end);
  const context={
    clamp:(v,min,max)=>Math.min(max,Math.max(min,v)),
    getLastEasyIntervalDays:p=>Math.max(0,Number(p.lastEasyIntervalDays)||0),
    getSrsStage:p=>Math.max(0,Math.floor(Number(p.srsStage)||0)),
    getSrsEase:p=>{const e=Math.min(3,Math.max(1.3,Number(p.ease)||2.3));p.ease=e;return e;},
    setProgressDelay:(p,d,now)=>{p.intervalDays=d>0?d/(22*60*60*1000):0;p.dueAt=now+d;},
    SRS_HARD_RELEARN_STEPS:2,LEECH_LAPSE_THRESHOLD:4,LEECH_DRILL_DAYS:1
  };
  vm.createContext(context);vm.runInContext(`${snippet}\nthis.__applyHardLapse=applyHardLapse;`,context);return context.__applyHardLapse;
}
const relaxed={leechEnabled:true,lapseResumeCapDays:14};
test('fresh-card Hard retries never become lapses or leeches',()=>{const f=loadApplyHardLapse();const p={streak:0,easyStreak:0,srsStage:0,ease:2.3,intervalDays:0,lastEasyIntervalDays:0,inRelearn:false,relearnLeft:0,lapseCount:0,leechDrill:false};for(let n=0;n<6;n++){const now=1800000000000+n*1000;assert.equal(f(p,relaxed,now),true);assert.equal(p.dueAt,now);}assert.equal(p.lapseCount,0);assert.equal(p.leechDrill,false);assert.equal(p.ease,2.3);});
test('one established relearn episode counts one lapse',()=>{const f=loadApplyHardLapse();const p={streak:5,easyStreak:5,srsStage:4,ease:2.3,intervalDays:14,lastEasyIntervalDays:14,inRelearn:false,relearnLeft:0,lapseCount:0,leechDrill:false};f(p,relaxed,1800000000000);for(let n=1;n<=4;n++)f(p,relaxed,1800000000000+n*1000);assert.equal(p.lapseCount,1);assert.equal(p.srsStage,3);assert.ok(Math.abs(p.ease-2.1)<1e-9);assert.equal(p.leechDrill,false);});
test('fourth genuine lapse becomes leech but remains in-session',()=>{const f=loadApplyHardLapse();const now=1800000000000;const p={streak:5,easyStreak:5,srsStage:4,ease:2.3,intervalDays:14,lastEasyIntervalDays:14,inRelearn:false,relearnLeft:0,lapseCount:3,leechDrill:false,leechStreak:2};assert.equal(f(p,relaxed,now),true);assert.equal(p.lapseCount,4);assert.equal(p.leechDrill,true);assert.equal(p.dueAt,now);assert.equal(f(p,relaxed,now+1000),true);assert.equal(p.lapseCount,4);assert.equal(p.dueAt,now+1000);});
