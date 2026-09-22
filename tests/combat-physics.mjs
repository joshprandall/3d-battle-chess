import assert from 'node:assert/strict';
import {STEP,body,step,drive,jump,impulse,sweptHit,projectile,advanceProjectile,fragments,fightMass} from '../combat-physics.js';
const falling=body({y:1});for(let i=0;i<450;i++)step(falling,STEP);assert.equal(falling.y,0);assert.equal(falling.vy,0);
const runner=body({x:-1.18});for(let i=0;i<75;i++){drive(runner,2.4,0,STEP,12);step(runner,STEP)}assert(runner.x>-.1 && runner.x<.75);
const leaper=body();jump(leaper,3);for(let i=0;i<20;i++)step(leaper,STEP);assert(leaper.y>.2);for(let i=0;i<300;i++)step(leaper,STEP);assert.equal(leaper.y,0);
const guard=body({x:1.18,mass:2.2});impulse(guard,{x:2.2,y:2,torque:-.9});for(let i=0;i<20;i++)step(guard,STEP);assert(guard.x>1.18&&Math.abs(guard.roll)>.05);
assert(sweptHit({x:-1,y:1,z:0},{x:2,y:1,z:0},{x:1.18,y:1,z:0},.2));assert(!sweptHit({x:-1,y:1,z:3},{x:2,y:1,z:3},{x:1.18,y:1,z:0},.2));
const shot=projectile({x:-1.2,y:1,z:0,vx:36});let hits=0;for(let i=0;i<20;i++)if(advanceProjectile(shot,STEP,{x:1.18,y:1,z:0},.5))hits++;assert.equal(hits,1);
for(const f of fragments(16,{x:0,y:.5,z:0})){for(let i=0;i<300;i++)step(f,STEP);assert(f.y>=0)}
assert(fightMass('r')>fightMass('p'));assert.throws(()=>body({mass:0}));
console.log('PASS physics: gravity, grounded jump, impulse and fall, swept collision, projectile, debris and mass');
