// Small deterministic 2.5-D rigid-body combat model. All lengths are arena units,
// seconds are SI-style; the board's chess rules are deliberately independent.
export const STEP = 1 / 90;
export const GRAVITY = 9.8;
const bound = (value, low, high) => Math.max(low, Math.min(high, value));
export const ease = (value) => { const x = bound(value, 0, 1); return x*x*(3-2*x); };
export function body({x=0, y=0, z=0, mass=1, radius=.46, drag=4.2, bounce=.15}={}) {
  if (!(mass > 0) || !(radius > 0)) throw new RangeError('Body mass and radius must be positive');
  return {x,y,z,vx:0,vy:0,vz:0,roll:0,rollSpeed:0,mass,radius,drag,bounce,grounded:y===0};
}
export function drive(b, vx, vz, dt, response=10, maxSpeed=3.5) {
  const factor = 1 - Math.exp(-response*dt);
  b.vx += (bound(vx,-maxSpeed,maxSpeed)-b.vx)*factor;
  b.vz += (bound(vz,-maxSpeed,maxSpeed)-b.vz)*factor;
}
export function jump(b, speed) { if (b.grounded) {b.vy=Math.max(0,speed);b.grounded=false;} }
export function impulse(b, {x=0,y=0,z=0,torque=0}={}) {
  b.vx+=x/b.mass;b.vy+=y/b.mass;b.vz+=z/b.mass;
  b.rollSpeed+=torque/(b.mass*Math.max(.16,b.radius*b.radius));
  if (y>0) b.grounded=false;
}
export function step(b, dt=STEP, ground=0) {
  if (!(dt>0 && dt<=.12)) throw new RangeError('Physics step must be between 0 and 120 ms');
  if (!b.grounded) b.vy-=GRAVITY*dt;
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  if (b.y<=ground) {b.y=ground;if(b.vy<-.45)b.vy=-b.vy*b.bounce;else b.vy=0;b.grounded=b.vy===0;}
  const friction=Math.exp(-(b.grounded?b.drag:b.drag*.2)*dt);
  b.vx*=friction;b.vz*=friction;
  b.roll+=b.rollSpeed*dt;
  b.rollSpeed*=Math.exp(-(b.grounded?2.4:.7)*dt);
  b.roll=bound(b.roll,-1.52,1.52);
  return b;
}
// Swept sphere against a stationary sphere prevents fast attacks from tunnelling.
export function sweptHit(a,b,target,radius) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  const len=dx*dx+dy*dy+dz*dz;
  const t=len?bound(((target.x-a.x)*dx+(target.y-a.y)*dy+(target.z-a.z)*dz)/len,0,1):0;
  const x=a.x+dx*t-target.x,y=a.y+dy*t-target.y,z=a.z+dz*t-target.z;
  return x*x+y*y+z*z <= radius*radius;
}
export function projectile({x,y,z,vx,vy=0,vz=0,gravity=0,radius=.18}) {
  return {x,y,z,vx,vy,vz,gravity,radius,active:true,previous:{x,y,z}};
}
export function advanceProjectile(p, dt, target, targetRadius=.46) {
  if(!p.active)return false;
  const previous={x:p.x,y:p.y,z:p.z};
  p.vy-=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
  p.previous=previous;
  if(sweptHit(previous,p,target,p.radius+targetRadius)){p.active=false;return true;}
  if(p.y<-.3||Math.abs(p.x)>4||Math.abs(p.z)>4)p.active=false;
  return false;
}
export function fragments(count, impact, seed=91) {
  let s=seed>>>0;const random=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
  return Array.from({length:count},(_,i)=>{
    const a=i*2.39996,energy=.7+random()*1.25;
    const b=body({x:impact.x,y:impact.y,z:impact.z,mass:.2+random()*.4,radius:.045,drag:1.35,bounce:.35});
    impulse(b,{x:Math.cos(a)*energy*b.mass,y:(1.6+random()*2.1)*b.mass,z:Math.sin(a)*energy*b.mass,torque:(random()-.5)*b.mass});
    return b;
  });
}
export function fightMass(role){return ({p:.8,n:1.15,b:.95,r:2.25,q:1.3,k:1.5})[role]||1;}
