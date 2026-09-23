import * as THREE from 'three';
import {getCharacterDefinition} from './character-definitions.js';
import {buildRig,GEO} from './rig-types.js';
import {PALETTES} from '../pieces.js';
import {sculptCharacter} from './character-visuals.js';

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

export function createV8Character(piece,theme='classic'){
 const def=getCharacterDefinition(theme,piece.t),root=new THREE.Group(),materials=materialsFor(def,piece.c);
 const rig=buildRig(root,materials,def);root.userData={v8:true,definition:def,role:piece.t,side:piece.c,rigV8:rig};
 addWeapon(rig,def,materials);sculptCharacter(root,rig,def,materials);
 root.rotation.y=piece.c==='w'?0:Math.PI;
 root.traverse(o=>{o.userData.root=root});
 return root;
}
