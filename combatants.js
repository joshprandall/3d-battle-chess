import * as THREE from 'three';
import {createCharacter,poseCharacter} from './characters.js';
import {PALETTES} from './pieces.js';

// Arena-only fighters: preserve the chess silhouettes on the board, but reveal
// humanoid rigs with role- and theme-specific kit for close-up encounters.
export {poseCharacter};
export function createDuelFighter(piece,theme='classic'){
 const root=createCharacter(piece,0,0,theme),rig=root.userData.rig,palette=PALETTES[theme]||PALETTES.classic;
 // Root chess body is not a second body underneath the arena character.
 // The rig is the last direct child of the root; keep it and hide the statue.
 const skeleton=rig.torso.parent;
 for(const child of root.children)child.visible=child===skeleton;
 skeleton.position.y=-.24;
 const dark=piece.c==='b',armor=new THREE.MeshStandardMaterial({color:dark?0x7c9caf:palette.trim,roughness:.43,metalness:theme==='cosmic'?.68:.37});
 const cloth=new THREE.MeshStandardMaterial({color:dark?palette.b:palette.w,roughness:theme==='brick'?.44:.92,side:THREE.DoubleSide});
 const inlay=new THREE.MeshStandardMaterial({color:palette.glow,metalness:.36,roughness:.26,emissive:palette.glow,emissiveIntensity:theme==='cosmic'?.52:.19});
 const leather=new THREE.MeshStandardMaterial({color:dark?0x28313e:0x594936,roughness:.81});
 const eye=new THREE.MeshStandardMaterial({color:theme==='monsters'?0xffa368:0xcbeeff,emissive:theme==='monsters'?0xd76519:0x5fd8e3,emissiveIntensity:.65});
 const part=(parent,geometry,material,x=0,y=0,z=0)=>{const obj=new THREE.Mesh(geometry,material);obj.position.set(x,y,z);obj.castShadow=true;parent.add(obj);obj.userData.root=root;return obj;};
 const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cone=(r,h,n=8)=>new THREE.ConeGeometry(r,h,n),sphere=r=>new THREE.SphereGeometry(r,9,7);
 const {torso,neck,left,right,legs}=rig,t=piece.t;
 // Solid upper chest, jointed greaves, and a large shoulder silhouette.
 part(torso,box(.48,.37,.26),armor,0,.12,.025);
 part(torso,box(.31,.09,.29),inlay,0,.30,.055);
 for(const [i,arm] of [[-1,left],[1,right]]){
  const pad=part(arm,box(.23,.17,.25),armor,0,-.06,.01);pad.rotation.z=i*.18;
  part(arm,box(.17,.12,.19),leather,0,-.31,.03);
 }
 for(const leg of legs){part(leg,box(.20,.19,.27),armor,0,-.20,.085);part(leg,box(.21,.09,.31),leather,0,-.285,.10);}
 // Distinct attack silhouettes: scout cloak, armored rider, mage robes,
 // guardian shield, champion mantle and the sovereign's long cloak.
 if(t==='p'||t==='q'||t==='k'){
  const cape=part(torso,box(t==='p'?.43:.67,t==='p'?.49:.77,.037),cloth,0,-.18,-.225);
  cape.rotation.x=-.09;
 }
 if(t==='b'||t==='q'){
  part(torso,cone(t==='q'?.43:.34,t==='q'?.59:.55,10),cloth,0,-.23,0).rotation.z=Math.PI;
  part(neck,cone(.26,.29),armor,0,.29,-.02);
  part(right,sphere(.1),inlay,.03,-.54,.15);
 }
 if(t==='n'||t==='r'){
  part(neck,box(t==='r'?.42:.36,.22,.32),armor,0,.20,0);
  const visor=part(neck,box(.32,.065,.065),leather,0,.15,.175);visor.rotation.x=-.08;
  if(t==='n')part(right,box(.07,.76,.075),inlay,.025,-.38,.045);
  if(t==='r'){
   const shield=part(left,box(.40,.55,.085),armor,-.07,-.39,.25);shield.rotation.z=-.15;
   part(left,box(.27,.40,.035),inlay,-.07,-.38,.305);
  }
 }
 if(t==='q'||t==='k'){
  part(neck,new THREE.CylinderGeometry(.20,.18,.10,8),inlay,0,.29,-.005);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(neck,cone(.055,.17,5),armor,Math.cos(a)*.15,.39,Math.sin(a)*.15);}
  if(t==='k')part(torso,box(.22,.31,.11),inlay,0,.24,.20);
 }
 if(theme==='monsters'){
  for(const s of [-1,1]){
   const horn=part(neck,cone(.10,.36,6),armor,s*.19,.35,-.02);horn.rotation.z=-s*.3;
   const spike=part(torso,cone(.09,.31,5),inlay,s*.23,.30,-.16);spike.rotation.z=-s*.48;
  }
  part(neck,sphere(.06),eye,-.095,.095,.18);part(neck,sphere(.06),eye,.095,.095,.18);
 }else if(theme==='arcane'){
  for(const s of [-1,1]){const rune=part(torso,box(.065,.23,.025),inlay,s*.17,.10,.17);rune.rotation.z=s*.35;}
  part(neck,new THREE.OctahedronGeometry(.16),inlay,0,.40,-.01);
 }else if(theme==='cosmic'){
  part(neck,box(.40,.14,.075),inlay,0,.14,.17);
  for(const s of [-1,1]){part(torso,box(.19,.36,.12),armor,s*.20,.06,-.20);part(torso,sphere(.07),inlay,s*.20,-.10,-.28);}
 }else if(theme==='brick'){
  for(const s of [-1,1])part(torso,new THREE.CylinderGeometry(.055,.055,.05,8),inlay,s*.15,.33,.13);
 }
 root.userData.duelFighter=true;
 return root;
}
