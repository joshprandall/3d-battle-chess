import * as THREE from 'three';
import {PALETTES} from './pieces.js';

// Arena-only action figures. Chess-board silhouettes stay unchanged.
// Each limb has an independently driven upper/lower joint, a grounded foot,
// and a tracked weapon contact point. All meshes are original procedural art.
const BOX=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const BALL=r=>new THREE.IcosahedronGeometry(r,1);
const CONE=(r,h,n=7)=>new THREE.ConeGeometry(r,h,n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mat=(hex,roughness=.7,metalness=.12,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color:hex,roughness,metalness,emissive,emissiveIntensity:intensity});
function mesh(parent,geometry,material,xyz=[0,0,0]){
 const object=new THREE.Mesh(geometry,material);object.position.set(...xyz);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
function node(parent,x=0,y=0,z=0){const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);return group;}
function limb(parent,offset,upperLength,lowerLength,thickness,materials,arm=false){
 const upper=node(parent,...offset),sign=arm?-1:-1;
 mesh(upper,BOX(thickness,upperLength,thickness*.94),materials.cloth,[0,sign*upperLength*.48,0]);
 mesh(upper,BALL(thickness*.65),materials.armor,[0,0,0]);
 const hinge=node(upper,0,-upperLength,0);
 mesh(hinge,BALL(thickness*.62),materials.edge);
 mesh(hinge,BOX(thickness*.82,lowerLength,thickness*.8),materials.armor,[0,-lowerLength*.48,.01]);
 const end=node(hinge,0,-lowerLength,0);
 return {upper,hinge,end,upperLength,lowerLength};
}
export function createDuelFighter(piece,theme='classic'){
 const palette=PALETTES[theme]||PALETTES.classic,dark=piece.c==='b',role=piece.t;
 const root=node(new THREE.Group()); // root remains a movable independent physics body
 const colors={skin:dark?0x667786:0xbba082,eye:dark?0xb3edff:0x1b303b};
 const armorColor=dark?0x547085:theme==='monsters'?0x8d8566:palette.trim;
 const materials={cloth:mat(dark?palette.b:palette.w,.84,theme==='cosmic'?.28:.06),
  armor:mat(armorColor,.43,.42),edge:mat(dark?0x9cb9c9:0xe7d5ad,.4,.47),
  skin:mat(colors.skin,.86,.04),eye:mat(colors.eye,.35,.07,theme==='monsters'?0x4f1404:0x000000,.3),
  leather:mat(dark?0x1d2932:0x4c3828,.92,.02),glow:mat(palette.glow,.24,.5,palette.glow,theme==='cosmic'?.8:.3)};
 const proportions={p:[.22,.94],n:[.28,1.04],b:[.25,1.06],r:[.37,1.00],q:[.29,1.12],k:[.32,1.17]}[role]||[.25,1];
 const width=proportions[0],height=proportions[1],pelvis=node(root,0,.76,0);
 mesh(pelvis,BOX(width*1.65,.18,.28),materials.leather,[0,0,0]);
 const waist=node(pelvis,0,.10,0),torso=node(waist,0,.13,0);
 mesh(torso,BOX(width*2.22,.45,.31),materials.cloth,[0,.18,0]);
 mesh(torso,BOX(width*2.3,.18,.36),materials.armor,[0,.27,.025]);
 mesh(torso,BOX(.095,.26,.04),materials.edge,[0,.16,.185]);
 const neck=node(torso,0,.47,0),head=node(neck,0,.10,0);
 mesh(head,BALL(role==='r'?.16:.145),materials.skin,[0,.025,.017]);
 const visor=mesh(head,BOX(.255,.073,.038),materials.leather,[0,.05,.147]);
 for(const side of [-1,1])mesh(head,BALL(.021),materials.eye,[side*.068,.055,.18]);
 mesh(head,BOX(.085,.017,.025),materials.leather,[0,-.075,.145]);
 const left=limb(torso,[-width*1.27,.32,0],.31,.28,.15,materials,true);
 const right=limb(torso,[width*1.27,.32,0],.31,.28,.15,materials,true);
 for(const arm of [left,right]){
  mesh(arm.upper,BOX(.20,.13,.23),materials.armor,[0,-.055,0]);
  mesh(arm.end,BALL(.09),materials.skin,[0,0,0]);
 }
 const leftLeg=limb(pelvis,[-.145,-.10,0],.39,.37,.19,materials);
 const rightLeg=limb(pelvis,[.145,-.10,0],.39,.37,.19,materials);
 for(const leg of [leftLeg,rightLeg]){
  mesh(leg.hinge,BOX(.20,.28,.20),materials.armor,[0,-.14,.02]);
  mesh(leg.end,BOX(.23,.12,.37),materials.leather,[0,.035,.105]);
 }
 const weapon=node(right.end,0,-.04,.05),tip=node(weapon,0,-.62,.035);
 if(role==='b'||theme==='arcane'){
  mesh(weapon,BOX(.045,.61,.045),materials.leather,[0,-.3,.02]);
  mesh(weapon,new THREE.OctahedronGeometry(.125),materials.glow,[0,-.66,.025]);
 }else if(role==='r'){
  mesh(weapon,BOX(.12,.48,.12),materials.leather,[0,-.25,.015]);
  mesh(weapon,BOX(.33,.17,.17),materials.armor,[0,-.50,.015]);
  mesh(left.end,BOX(.43,.53,.095),materials.armor,[0,-.24,.24]);
  mesh(left.end,BOX(.22,.35,.035),materials.edge,[0,-.24,.3]);
 }else if(theme==='cosmic'){
  mesh(weapon,BOX(.12,.38,.15),materials.armor,[0,-.25,.065]);
  mesh(weapon,BOX(.13,.35,.07),materials.glow,[0,-.52,.07]);
 }else if(theme==='brick'){
  mesh(weapon,BOX(.1,.45,.1),materials.leather,[0,-.2,.0]);
  mesh(weapon,BOX(.31,.15,.18),materials.edge,[0,-.47,0]);
 }else if(theme==='monsters'){
  for(const offset of [-.07,0,.07])mesh(weapon,CONE(.05,.40,5),materials.edge,[offset,-.47,.04]).rotation.x=Math.PI;
 }else{
  mesh(weapon,BOX(.045,.42,.055),materials.edge,[0,-.36,.03]);
  mesh(weapon,CONE(.048,.26,5),materials.armor,[0,-.68,.03]).rotation.z=Math.PI;
  mesh(weapon,BOX(.28,.042,.075),materials.leather,[0,-.13,.03]);
 }
 if(role==='n'){
  mesh(head,BOX(.35,.2,.28),materials.armor,[0,.17,0]);
  mesh(head,BOX(.28,.055,.045),materials.glow,[0,.075,.19]);
 }else if(role==='b'){
  mesh(head,CONE(.27,.47,8),materials.cloth,[0,.24,0]);
  mesh(torso,CONE(.43,.62,10),materials.cloth,[0,-.13,0]).rotation.z=Math.PI;
 }else if(role==='q'||role==='k'){
  mesh(head,new THREE.CylinderGeometry(.19,.16,.09,9),materials.edge,[0,.21,0]);
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;mesh(head,CONE(.055,.17,5),materials.armor,[Math.sin(angle)*.145,.33,Math.cos(angle)*.145]);}
  mesh(torso,BOX(.58,.55,.035),materials.cloth,[0,-.09,-.22]);
 }else if(role==='p')mesh(torso,BOX(.42,.41,.035),materials.cloth,[0,-.06,-.205]);
 if(theme==='monsters'){
  for(const side of [-1,1])mesh(head,CONE(.084,.28,6),materials.edge,[side*.13,.26,-.04]).rotation.z=-side*.34;
 }else if(theme==='arcane')mesh(torso,new THREE.OctahedronGeometry(.11),materials.glow,[0,.20,.20]);
 else if(theme==='cosmic'){mesh(head,BOX(.36,.07,.045),materials.glow,[0,.06,.17]);mesh(torso,BOX(.15,.10,.045),materials.glow,[0,.15,.20]);}
 root.userData={duelFighter:true,role,rigV6:{pelvis,waist,torso,head,left,right,leftLeg,rightLeg,weapon,tip,visor,height}};
 return root;
}
// Pose quantities are radians and normalized gait/attack stages. Two-part limbs,
// planted soles and spine counter-rotation keep the action readable in profile.
export function poseCharacter(root,p={}){
 const r=root?.userData.rigV6;if(!r)return;
 const gait=clamp(p.gait??p.step??0,-1,1),attack=clamp(p.attack??0,0,1),coil=clamp(p.coil??0,0,1),fall=clamp(p.fall??0,0,1);
 r.pelvis.position.y=.76-(p.crouch||0)*.16+Math.abs(gait)*.022;
 r.pelvis.rotation.set((p.lean||0)*.28,0,-fall*.16);
 r.waist.rotation.set(p.lean||0,p.turn||0,(p.roll||0)*.32);
 r.torso.rotation.set(-(p.lean||0)*.22,0,(p.roll||0)*.12);
 r.head.rotation.set((p.head||0)-(p.lean||0)*.18,0,-fall*.1);
 // Attacker's right arm chambers, drives through contact and recoils.
 r.right.upper.rotation.set(-.32-.95*coil-.50*attack,0,-.22-.16*coil);
 r.right.hinge.rotation.x=-.35-.35*coil-.45*attack;
 r.left.upper.rotation.set(-.70+gait*.18+(p.guard||0)*.45+attack*.16,0,.30);
 r.left.hinge.rotation.x=-.68-.15*coil;
 for(const [leg,s] of [[r.leftLeg,1],[r.rightLeg,-1]]){
  const step=gait*s,brace=clamp(p.brace||0,0,1);
  leg.upper.rotation.x=step*.51+brace*(s===1?.17:-.27)+fall*.26;
  leg.hinge.rotation.x=Math.max(0,-step)*.72+brace*.21+fall*.31;
  leg.end.rotation.x=-leg.upper.rotation.x-leg.hinge.rotation.x*.72;
 }
 r.weapon.rotation.x=(p.weapon||0)-coil*.25+attack*.05;
}
export function weaponPoint(root,target=new THREE.Vector3()){
 const joint=root?.userData.rigV6?.tip;
 if(!joint)return target.copy(root.position);
 root.updateMatrixWorld(true);
 return joint.getWorldPosition(target);
}
export function fighterCenter(root,target=new THREE.Vector3()){
 const chest=root?.userData.rigV6?.torso;
 if(!chest)return target.copy(root.position);
 root.updateMatrixWorld(true);return chest.getWorldPosition(target);
}
