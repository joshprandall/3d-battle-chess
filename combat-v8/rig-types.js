import * as THREE from 'three';

const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const sphere=r=>new THREE.IcosahedronGeometry(r,1);
const cyl=(r1,r2,h,n=10)=>new THREE.CylinderGeometry(r1,r2,h,n);
const cone=(r,h,n=8)=>new THREE.ConeGeometry(r,h,n);

function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

function biped(root,materials,profile){
 const scale=profile.scale||1,width=profile.width||.28,heavy=profile.heavy||false,blocky=profile.blocky||false;
 const pelvis=group(root,0,.72*scale,0);
 mesh(pelvis,box(width*1.7,.18*scale,.30*scale),materials.secondary,0,0,0);
 const waist=group(pelvis,0,.11*scale,0);
 const torso=group(waist,0,.16*scale,0);
 mesh(torso,blocky?box(width*2.25,.48*scale,.34*scale):cyl(width*.86,width*1.08,.48*scale,heavy?8:12),materials.primary,0,.18*scale,0);
 mesh(torso,box(width*2.15,.11*scale,.37*scale),materials.armor,0,.31*scale,.02);
 const neck=group(torso,0,.48*scale,0),head=group(neck,0,.11*scale,0);
 mesh(head,blocky?box(.29*scale,.28*scale,.27*scale):sphere(.16*scale),materials.skin,0,.02*scale,.01);
 const makeArm=(side)=>{
  const upper=group(torso,side*(width*1.23),.32*scale,0);
  mesh(upper,blocky?box(.14*scale,.30*scale,.15*scale):cyl(.07*scale,.09*scale,.31*scale,8),materials.primary,0,-.15*scale,0);
  const elbow=group(upper,0,-.31*scale,0);
  mesh(elbow,sphere(.075*scale),materials.armor);
  mesh(elbow,blocky?box(.13*scale,.27*scale,.14*scale):cyl(.06*scale,.075*scale,.28*scale,8),materials.armor,0,-.14*scale,0);
  const hand=group(elbow,0,-.28*scale,0);mesh(hand,sphere(.075*scale),materials.skin);
  return {upper,elbow,hand};
 };
 const left=makeArm(-1),right=makeArm(1);
 const makeLeg=(side)=>{
  const upper=group(pelvis,side*.14*scale,-.09*scale,0);
  mesh(upper,blocky?box(.16*scale,.37*scale,.18*scale):cyl(.075*scale,.095*scale,.38*scale,8),materials.primary,0,-.19*scale,0);
  const knee=group(upper,0,-.38*scale,0);mesh(knee,sphere(.08*scale),materials.armor);
  mesh(knee,blocky?box(.15*scale,.34*scale,.17*scale):cyl(.068*scale,.08*scale,.35*scale,8),materials.armor,0,-.17*scale,0);
  const foot=group(knee,0,-.35*scale,.07*scale);mesh(foot,box(.20*scale,.10*scale,.34*scale),materials.secondary,0,.02*scale,.08*scale);
  return {upper,knee,foot};
 };
 const leftLeg=makeLeg(-1),rightLeg=makeLeg(1);
 const weapon=group(right.hand,0,-.03*scale,.06*scale),tip=group(weapon,0,-.62*scale,.06*scale);
 return {type:'biped',pelvis,waist,torso,neck,head,left,right,leftLeg,rightLeg,weapon,tip,scale};
}

function creature(root,materials,profile){
 const scale=profile.scale||1;
 const pelvis=group(root,0,.67*scale,0),torso=group(pelvis,0,.12*scale,0);
 mesh(torso,new THREE.CapsuleGeometry(.28*scale,.48*scale,5,10),materials.primary,0,.20*scale,0);
 torso.rotation.x=Math.PI/2*.18;
 const neck=group(torso,0,.24*scale,.24*scale),head=group(neck,0,.05*scale,.16*scale);
 mesh(head,sphere(.20*scale),materials.skin);
 const legs=[];
 const legCount=profile.legs===4?4:2;
 for(let i=0;i<legCount;i++){
  const side=i%2?-1:1,front=i<2?1:-1;
  const upper=group(pelvis,side*.22*scale,front*.16*scale,front*.15*scale);
  mesh(upper,cyl(.08*scale,.10*scale,.32*scale,7),materials.primary,0,-.15*scale,0);
  const knee=group(upper,0,-.31*scale,front*.05*scale);mesh(knee,cyl(.065*scale,.08*scale,.29*scale,7),materials.armor,0,-.14*scale,0);
  const foot=group(knee,0,-.29*scale,.09*scale);mesh(foot,box(.17*scale,.08*scale,.29*scale),materials.secondary,0,0,.08*scale);
  legs.push({upper,knee,foot});
 }
 const left=group(torso,-.31*scale,.18*scale,0),right=group(torso,.31*scale,.18*scale,0);
 mesh(left,cyl(.06*scale,.08*scale,.34*scale,7),materials.primary,0,-.17*scale,0);
 mesh(right,cyl(.06*scale,.08*scale,.34*scale,7),materials.primary,0,-.17*scale,0);
 const leftHand=group(left,0,-.34*scale,0),rightHand=group(right,0,-.34*scale,0);
 mesh(leftHand,sphere(.085*scale),materials.skin);mesh(rightHand,sphere(.085*scale),materials.skin);
 const weapon=group(rightHand,0,-.02*scale,.08*scale),tip=group(weapon,0,-.48*scale,.08*scale);
 return {type:'creature',pelvis,waist:pelvis,torso,neck,head,left:{upper:left,elbow:left,leftHand,hand:leftHand},right:{upper:right,elbow:right,rightHand,hand:rightHand},leftLeg:legs[0],rightLeg:legs[1]||legs[0],extraLegs:legs.slice(2),weapon,tip,scale};
}

export function buildRig(root,materials,definition){
 const type=definition.rig;
 if(type==='creature')return creature(root,materials,{scale:.95,legs:definition.legs||2});
 if(type==='heavy-biped')return biped(root,materials,{scale:1.06,width:.35,heavy:true});
 if(type==='caster-biped')return biped(root,materials,{scale:1.02,width:.25});
 if(type==='agile-biped')return biped(root,materials,{scale:.97,width:.24});
 if(type==='mech')return biped(root,materials,{scale:1.08,width:.36,heavy:true,blocky:true});
 return biped(root,materials,{scale:1,width:.28,blocky:definition.theme==='brick'});
}

export function poseRig(root,pose={}){
 const r=root?.userData?.rigV8;if(!r)return;
 const gait=(pose.gait||0)+(pose.stepBias||0)*.22,wind=pose.windup||0,attack=pose.attack||0,follow=pose.follow||0,recover=pose.recover||0,crouch=pose.crouch||0;
 const sway=pose.rootSway||0;
 r.pelvis.position.y=(r.type==='creature' ? .67 : .72)*r.scale-crouch*.14;
 r.pelvis.position.z=sway;
 r.pelvis.rotation.z=(pose.pelvisRoll||0)+(pose.fall||0)*.28;
 r.waist.rotation.y=(pose.turn||0)+(pose.spin||0);
 r.waist.rotation.z=pose.torsoRoll||0;
 r.torso.rotation.x=(pose.lean||0)-follow*.12+recover*.05;
 r.torso.rotation.z=(pose.torsoRoll||0)*.45;
 r.head.rotation.x=(pose.head||0)+follow*.10;
 r.head.rotation.y=-(pose.turn||0)*.18;
 if(r.right?.upper){
  r.right.upper.rotation.x=-.35-wind*1.05+attack*.82-follow*.22+recover*.28+(pose.rightX||0);
  r.right.upper.rotation.z=-.22-(pose.weaponArc==='wide-sweep' ? .55 : 0)+(pose.rightZ||0);
 }
 if(r.right?.elbow)r.right.elbow.rotation.x=-.35-wind*.45+attack*.28+(pose.rightElbow||0);
 if(r.left?.upper){
  r.left.upper.rotation.x=-.58+(pose.guard||0)*.55+attack*.14+(pose.leftX||0);
  r.left.upper.rotation.z=(pose.leftZ||0);
 }
 if(r.left?.elbow)r.left.elbow.rotation.x=-.42+(pose.leftElbow||0);
 if(r.leftLeg?.upper)r.leftLeg.upper.rotation.x=gait*.48+(pose.brace||0)*.16+(pose.leftLegX||0);
 if(r.rightLeg?.upper)r.rightLeg.upper.rotation.x=-gait*.48-(pose.brace||0)*.20+(pose.rightLegX||0);
 if(r.leftLeg?.knee)r.leftLeg.knee.rotation.x=Math.max(0,-gait)*.62+(pose.leftKnee||0);
 if(r.rightLeg?.knee)r.rightLeg.knee.rotation.x=Math.max(0,gait)*.62+(pose.rightKnee||0);
 if(r.weapon){r.weapon.rotation.x=(pose.weapon||0)-wind*.28+attack*.14;r.weapon.rotation.z=pose.weaponRoll||0;}
 if(r.extraLegs?.length)for(let i=0;i<r.extraLegs.length;i++){
  const leg=r.extraLegs[i];if(leg?.upper)leg.upper.rotation.x=(i%2?1:-1)*gait*.35+(pose.extraLegX||0);
  if(leg?.knee)leg.knee.rotation.x=Math.max(0,(i%2?gait:-gait))*.45;
 }
 root.traverse(o=>{
  if(o.userData?.v8Wing)o.rotation.x=(pose.wingBeat||0);
  if(Number.isInteger(o.userData?.v8Orb)){const a=(o.userData.v8Orb*2.1)+(pose.orbitAngle||0);o.position.y+=Math.sin(a)*.001;}
 });
}

export function weaponWorldPoint(root,target=new THREE.Vector3()){
 const r=root?.userData?.rigV8;if(!r?.tip)return target.set(0,0,0);
 root.updateMatrixWorld(true);return r.tip.getWorldPosition(target);
}

export function hitVolumes(root){
 const r=root?.userData?.rigV8;if(!r)return[];
 root.updateMatrixWorld(true);
 const volumes=[];
 const add=(name,node,radius)=>{const center=new THREE.Vector3();node.getWorldPosition(center);volumes.push({name,center,radius})};
 add('torso',r.torso,.34*r.scale);add('head',r.head,.20*r.scale);add('pelvis',r.pelvis,.28*r.scale);
 if(r.leftLeg?.knee)add('left-leg',r.leftLeg.knee,.18*r.scale);
 if(r.rightLeg?.knee)add('right-leg',r.rightLeg.knee,.18*r.scale);
 return volumes;
}

export const GEO={box,sphere,cyl,cone,mesh,group};
