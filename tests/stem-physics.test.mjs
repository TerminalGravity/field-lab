import test from 'node:test';
import assert from 'node:assert/strict';
import {pendulumPeriod,pendulumAngle,projectileMetrics,projectilePosition,waveHeight} from '../src/stem/physics.js';
const near=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≠ ${expected}`);
test('pendulum period scales with square root of length in small-angle model',()=>{
 near(pendulumPeriod(1),2*Math.PI/Math.sqrt(9.81));
 near(pendulumPeriod(4)/pendulumPeriod(1),2);
 near(pendulumAngle(0,1,0.2),0.2);
 near(pendulumAngle(pendulumPeriod(1)/2,1,0.2),-0.2);
 assert.throws(()=>pendulumPeriod(0),/positive/);
});
test('projectile metrics agree with sampled launch, apex, and landing',()=>{
 const m=projectileMetrics(20,45);
 near(m.flightTime,2*20*Math.sin(Math.PI/4)/9.81);
 near(m.range,20*20/9.81);
 near(projectilePosition(0,20,45).y,0);
 near(projectilePosition(m.flightTime/2,20,45).y,m.maxHeight);
 near(projectilePosition(m.flightTime,20,45).x,m.range);
 near(projectilePosition(m.flightTime,20,45).y,0);
 assert.throws(()=>projectileMetrics(-1,45),/nonnegative/);
});
test('opposite-phase emitters cancel at their midpoint',()=>{
 near(waveHeight(0,0,0,{frequency:1,spacing:2,phase:Math.PI}),0);
 const aligned=waveHeight(0,0,0,{frequency:1,spacing:2,phase:0});
 assert.ok(Math.abs(aligned)>0.1);
 assert.throws(()=>waveHeight(0,0,0,{frequency:0,spacing:2,phase:0}),/positive/);
});
