import * as THREE from 'three';
import {getCharacterDefinition} from './character-definitions.js';
import {buildRig,GEO} from './rig-types.js';
import {PALETTES} from '../pieces.js';

const {box,sphere,cyl,cone,mesh}=GEO;
const mat=(color,rough=.65,metal=.12,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity:intensity});

function materialsFor(definition,side){
 const p=PALETTES[definition.theme]||PALETTES.classic,dark=side==='b';
 return {
  primary:mat(dark?p.b:p.w,.72,definition.theme==='cosmic'?.35:.08),
  secondary:mat(dark?0x172536:0x4a3929,.82,.05),
  armor:mat(dark?0x7b98ab:p.trim,.42,.42),
  skin:mat(definition.theme==='monsters'?(dark?0x516753:0x859665):(dark?0x71808c:0xc3a184),.82,.04),
  glow:mat(p.glow,.25,.45,p.glow,.72),
  dark:mat(0x14202b,.78,.12)
 };
}

function addWeapon(rig,def,m){
 const w=rig.weapon,s=rig.scale;
 const id=def.weapon;
 if(/spear|lance/.test(id)){mesh(w,cyl(.025*s,.03*s,.62*s,7),m.secondary,0,-.30*s,.03*s);const tip=mesh(w,cone(.065*s,.23*s,6),m.armor,0,-.67*s,.03*s);tip.rotation.x=Math.PI;}
 else if(/greatsword|rapier|blade/.test(id)){mesh(w,box(.045*s,.58*s,.055*s),m.armor,0,-.35*s,.03*s);mesh(w,box(.26*s,.04*s,.08*s),m.secondary,0,-.08*s,.03*s);}
 else if(/hammer/.test(id)){mesh(w,cyl(.035*s,.04*s,.50*s,7),m.secondary,0,-.25*s,0);mesh(w,box(.34*s,.18*s,.20*s),m.armor,0,-.53*s,0);}
 else if(/staff|focus|wand/.test(id)){mesh(w,cyl(.028*s,.035*s,.64*s,8),m.secondary,0,-.31*s,0);mesh(w,new THREE.OctahedronGeometry(.12*s),m.glow,0,-.68*s,0);}
 else if(/rifle|cannon/.test(id)){mesh(w,box(.18*s,.22*s,.58*s),m.armor,0,-.22*s,.20*s);mesh(w,cyl(.055*s,.055*s,.42*s,8),m.glow,0,-.20*s,.52*s).rotation.x=Math.PI/2;}
 else if(/fists|claws|talons|fangs|horns/.test(id)){for(const x of[-.07,0,.07]){const claw=mesh(w,cone(.045*s,.28*s,5),m.armor,x*s,-.22*s,.04*s);claw.rotation.x=Math.PI;}}
 else if(/orb|core|plasma/.test(id)){mesh(w,new THREE.OctahedronGeometry(.15*s),m.glow,0,-.30*s,.08*s);}
 else mesh(w,box(.12*s,.38*s,.12*s),m.armor,0,-.26*s,0);
}

function decorate(root,rig,def,m){
 const s=rig.scale,h=rig.head,t=rig.torso;
 const sil=def.silhouette;
 // Set-defining body language and geometry.
 if(def.theme==='classic'){mesh(t,box(.52*s,.08*s,.35*s),m.armor,0,.25*s,.01*s);}
 if(def.theme==='arcane'){mesh(t,new THREE.OctahedronGeometry(.09*s),m.glow,0,.18*s,.21*s);}
 if(def.theme==='monsters'){for(const side of[-1,1]){const horn=mesh(h,cone(.075*s,.25*s,6),m.armor,side*.13*s,.24*s,-.02*s);horn.rotation.z=-side*.35;}}
 if(def.theme==='brick'){for(const side of[-1,1])mesh(h,cyl(.055*s,.055*s,.05*s,8),m.armor,side*.09*s,.18*s,0);}
 if(def.theme==='cosmic'){mesh(h,box(.31*s,.06*s,.04*s),m.glow,0,.06*s,.16*s);mesh(t,box(.13*s,.08*s,.04*s),m.glow,0,.16*s,.20*s);}

 if(/shield|tower-shield/.test(sil)){mesh(rig.left.hand,box(.42*s,.50*s,.08*s),m.armor,0,-.20*s,.25*s);}
 if(/crested-cavalier/.test(sil)){mesh(h,box(.08*s,.30*s,.14*s),m.glow,0,.28*s,-.04*s);}
 if(/mitre|cleric/.test(sil)){mesh(h,cone(.22*s,.42*s,8),m.armor,0,.25*s,0);}
 if(/crowned|royal|king|monarch|sovereign|tyrant|archmage/.test(sil)){mesh(h,cyl(.19*s,.16*s,.08*s,9),m.armor,0,.20*s,0);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(h,cone(.045*s,.15*s,5),m.glow,Math.sin(a)*.14*s,.30*s,Math.cos(a)*.14*s);}}
 if(/hooded|assassin|shaman|seer/.test(sil)){mesh(h,cone(.24*s,.34*s,8),m.primary,0,.22*s,-.02*s);}
 if(/golem|ogre|brute|mech/.test(sil)){mesh(t,box(.68*s,.18*s,.40*s),m.armor,0,.20*s,0);}
 if(/winged|demon/.test(sil)||def.wings){for(const side of[-1,1]){const wing=mesh(t,box(.12*s,.55*s,.46*s),m.armor,side*.36*s,.15*s,-.18*s);wing.rotation.z=-side*.48;}}
 if(/goblin/.test(sil)){mesh(h,cone(.09*s,.20*s,6),m.skin,-.18*s,.05*s,0).rotation.z=.9;mesh(h,cone(.09*s,.20*s,6),m.skin,.18*s,.05*s,0).rotation.z=-.9;}
 if(/dire-beast/.test(sil)){mesh(h,box(.35*s,.18*s,.32*s),m.primary,0,-.02*s,.18*s);}
 if(/spring-rider/.test(sil)){mesh(t,new THREE.TorusGeometry(.22*s,.045*s,6,20),m.glow,0,.05*s,.15*s);}
 if(/gear-caster/.test(sil)){mesh(t,new THREE.TorusGeometry(.18*s,.05*s,6,12),m.armor,0,.10*s,.19*s);}
 if(/spinner/.test(sil)){mesh(t,new THREE.TorusGeometry(.31*s,.04*s,6,24),m.glow,0,.12*s,0).rotation.x=Math.PI/2;}
 if(/jet-lancer/.test(sil)||def.jets){for(const side of[-1,1])mesh(t,cyl(.06*s,.09*s,.30*s,8),m.glow,side*.22*s,.08*s,-.25*s).rotation.x=Math.PI/2;}
 if(/siege-mech/.test(sil)){mesh(t,box(.55*s,.22*s,.55*s),m.armor,0,.22*s,-.12*s);}
 if(/plasma-commander/.test(sil)){for(let i=0;i<3;i++){const a=i*Math.PI*2/3;mesh(t,sphere(.07*s),m.glow,Math.cos(a)*.34*s,.17*s,Math.sin(a)*.34*s);}}
 if(/star-sovereign/.test(sil)){mesh(t,new THREE.TorusGeometry(.28*s,.045*s,8,28),m.glow,0,.18*s,.05*s).rotation.x=Math.PI/2;}
}

export function createV8Character(piece,theme='classic'){
 const def=getCharacterDefinition(theme,piece.t),root=new THREE.Group(),materials=materialsFor(def,piece.c);
 const rig=buildRig(root,materials,def);root.userData={v8:true,definition:def,role:piece.t,side:piece.c,rigV8:rig};
 addWeapon(rig,def,materials);decorate(root,rig,def,materials);
 root.rotation.y=piece.c==='w'?0:Math.PI;
 root.traverse(o=>{o.userData.root=root});
 return root;
}
