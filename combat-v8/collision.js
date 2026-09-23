export function segmentPointDistanceSquared(a,b,p){
 const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
 const len=dx*dx+dy*dy+dz*dz;
 const t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/len)):0;
 const x=a.x+dx*t-p.x,y=a.y+dy*t-p.y,z=a.z+dz*t-p.z;
 return x*x+y*y+z*z;
}

export function sweptSphereHit(previous,current,target,radius){
 return segmentPointDistanceSquared(previous,current,target)<=radius*radius;
}

export function hitAgainstVolumes(previous,current,volumes,weaponRadius=.12){
 let best=null;
 for(const volume of volumes||[]){
  const r=(volume.radius||.2)+weaponRadius;
  const d2=segmentPointDistanceSquared(previous,current,volume.center);
  if(d2<=r*r&&(!best||d2<best.distanceSquared))best={volume,distanceSquared:d2};
 }
 return best;
}

export function impulseFromStrike({previous,current,mass=1,multiplier=1,lift=.12}){
 const dx=current.x-previous.x,dy=current.y-previous.y,dz=current.z-previous.z;
 const speed=Math.hypot(dx,dy,dz)||.0001;
 const scale=mass*multiplier/speed;
 return {x:dx*scale,y:dy*scale+lift*mass*multiplier,z:dz*scale};
}
