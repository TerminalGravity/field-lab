import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonOutcome,LESSONS} from '../src/stem/lessons.js';
test('lesson catalog defines distinct models and learner challenges',()=>{
 assert.deepEqual(LESSONS.map(l=>l.id),['pendulum','waves','projectile']);
 for(const lesson of LESSONS){assert.ok(lesson.controls.length>=2);assert.ok(lesson.challenge);assert.ok(lesson.limitations)}
});
test('pendulum challenge succeeds at target period and updates with length',()=>{
 assert.equal(lessonOutcome('pendulum',{length:9.81*(2.5/(2*Math.PI))**2,amplitude:12}).success,true);
 assert.equal(lessonOutcome('pendulum',{length:1,amplitude:12}).success,false);
});
test('wave cancellation challenge uses measured center amplitude',()=>{
 assert.equal(lessonOutcome('waves',{frequency:1,spacing:2,phase:180}).success,true);
 assert.equal(lessonOutcome('waves',{frequency:1,spacing:2,phase:0}).success,false);
 assert.equal(lessonOutcome('waves',{frequency:1.2,spacing:2.5,phase:0}).success,false);
 assert.ok(Math.abs(lessonOutcome('waves',{frequency:1.2,spacing:2.5,phase:0}).value-1)<1e-9);
});
test('projectile challenge checks range against target',()=>{
 assert.equal(lessonOutcome('projectile',{speed:14,angle:45}).success,true);
 assert.equal(lessonOutcome('projectile',{speed:20,angle:45}).success,false);
});
