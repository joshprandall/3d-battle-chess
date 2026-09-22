import * as THREE from 'three';
import {createPiece,PALETTES} from './pieces.js';

// Articulated, original low-poly character overlays. Base silhouettes remain readable as chess pieces.
const roles={p:'Scout',n:'Rider',b:'Mystic',r:'Guardian',q:'Champion',k:'Sovereign'};
const sphere=r=>new THREE.SphereGeometry(r,8,6);
const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const cone=(r,h,n=7)=>new THREE.ConeGeometry(r,h,n);
const cylinder=(a,b,h)=>new THREE.CylinderGeometry(a,b,h,8);

export function createCharacter(piece,x,y,theme='classic'){
 const root=createPiece(piece,x,y,theme),palette=PALETTES[theme];
 const dark=piece.c==='b',color=dark?palette.b:palette.w;
 const skin=new THREE.MeshStandardMaterial({color,roughness:.64,metalness:theme==='cosmic'?.55:.12});
 const armor=new THREE.MeshStandardMaterial({color:dark?0xaac7db:palette.trim,roughness:.43,metalness:.32});
 const face=new THREE.MeshStandardMaterial({color:dark?0xe3f7ff:0x253c54,emissive:theme==='monsters'?palette.glow:0x000000,emissiveIntensity:.17});
 const weaponMat=new THREE.MeshStandardMaterial({color:palette.glow,emissive:palette.glow,emissiveIntensity:theme==='cosmic'?.78:.2,metalness:.5,roughness:.28});
 const part=(parent,geometry,material,X=0,Y=0,Z=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(X,Y,Z);mesh.castShadow=true;parent.add(mesh);mesh.userData.root=root;return mesh};
 const rig=new THREE.Group();root.add(rig);
 // Distinct roles have distinct proportions; all parts pivot from the shoulder or neck.
 const height={p:.83,n:1.04,b:1.12,r:.98,q:1.22,k:1.30}[piece.t],wide=piece.t==='r'?.34:.24;
 const torso=new THREE.Group();torso.position.set(0,.46,.14);rig.add(torso);
 part(torso,theme==='brick'?box(wide*2,.40,.27):cylinder(wide*.77,wide,.43),skin,0,.12,0);
 part(torso,box(wide*1.75,.11,.34),armor,0,.31,0);
 const neck=new THREE.Group();neck.position.set(0,.44,0);torso.add(neck);
 part(neck,theme==='brick'?box(.32,.28,.28):sphere(piece.t==='r'?.21:.175),skin,0,.05,.015);
 // Eyes and a mouth make the defender's reaction visible at board and close-up scale.
 for(const side of [-1,1])part(neck,sphere(.033),face,side*.085,.092,.181);
 part(neck,box(.14,.019,.022),face,0,-.016,.173);
 if(theme==='monsters')for(const s of [-1,1]){const horn=part(neck,cone(.072,.20),armor,s*.13,.23,-.02);horn.rotation.z=-s*.31;}
 if(theme==='arcane')part(neck,cone(.24,.31),armor,0,.29,-.01);
 if(theme==='cosmic')part(neck,box(.34,.08,.28),armor,0,.20,0);
 if(theme==='brick')for(const s of [-1,1])part(neck,cylinder(.07,.07,.055),armor,s*.10,.225,0);
 // Shoulder joints rotate independently; wrists carry class-specific, themed equipment.
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(side*(wide+.075),.31,0);torso.add(shoulder);
  part(shoulder,theme==='brick'?box(.14,.30,.16):cylinder(.075,.09,.32),skin,side*.03,-.18,.01);
  part(shoulder,sphere(.105),armor,0,-.37,.035);
  arms.push(shoulder);
 }
 const [left,right]=arms;
 const equipment=new THREE.Group();equipment.position.set(.025,-.36,.055);right.add(equipment);
 const t=piece.t;
 if(theme==='monsters'){
  for(const s of [-1,0,1]){const claw=part(equipment,cone(.040,.30,5),weaponMat,s*.069,-.18,.02);claw.rotation.x=-.42;}
 }else if(theme==='cosmic'){
  part(equipment,box(.13,.17,.31),armor,.04,-.075,.18);
  part(equipment,cylinder(.045,.045,.25),weaponMat,.04,-.06,.37).rotation.x=Math.PI/2;
 }else if(theme==='brick'){
  part(equipment,box(.09,.36,.09),armor,0,-.15,.04);
  part(equipment,box(.32,.15,.19),weaponMat,0,-.36,.04);
 }else if(t==='b'||t==='q'||theme==='arcane'){
  part(equipment,cylinder(.023,.028,.50),armor,0,-.19,.05);
  part(equipment,new THREE.OctahedronGeometry(.11),weaponMat,0,-.47,.05);
 }else if(t==='r'){
  part(equipment,cylinder(.035,.04,.4),armor,0,-.18,.04);
  part(equipment,box(.32,.18,.16),weaponMat,0,-.41,.04);
 }else{
  part(equipment,cylinder(.018,.024,.44),weaponMat,0,-.22,.04);
  part(equipment,box(.18,.045,.08),armor,0,-.04,.04);
 }
 // Feet give locomotion a visible gait without compromising the original chess base.
 const legs=[];
 for(const side of [-1,1]){
  const hip=new THREE.Group();hip.position.set(side*.145,.48,.13);rig.add(hip);
  part(hip,box(.14,.24,.17),skin,0,-.115,0);
  part(hip,box(.18,.09,.24),armor,0,-.26,.065);
  legs.push(hip);
 }
 root.userData.rig={torso,neck,left,right,legs,equipment,height,role:roles[t]};
 return root;
}

export function poseCharacter(root,pose={}){
 const rig=root?.userData.rig;if(!rig)return;
 rig.torso.rotation.set(pose.lean||0,pose.turn||0,pose.roll||0);
 rig.neck.rotation.x=pose.head||0;
 rig.left.rotation.set(pose.guard||0,0,pose.left||0);
 rig.right.rotation.set(pose.swing||0,0,pose.right||0);
 rig.legs[0].rotation.x=pose.step||0;rig.legs[1].rotation.x=-(pose.step||0);
 rig.equipment.rotation.z=pose.weapon||0;
}
