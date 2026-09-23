import * as THREE from 'three';
import {GEO} from './rig-types.js';
const {box,sphere,cyl,cone,mesh,group}=GEO;

const torus=(r,t=.035,n=24)=>new THREE.TorusGeometry(r,t,6,n);
const oct=r=>new THREE.OctahedronGeometry(r);
const tetra=r=>new THREE.TetrahedronGeometry(r);
const capsule=(r,l)=>new THREE.CapsuleGeometry(r,l,4,8);

function shoulderPads(rig,m,size=.22){
 const s=rig.scale;
 for(const arm of [rig.left,rig.right])mesh(arm.upper,box(size*s,.13*s,.26*s),m.armor,0,-.04*s,.01*s);
}
function cape(rig,m,w=.48,h=.55){
 const s=rig.scale,c=mesh(rig.torso,box(w*s,h*s,.035*s),m.secondary,0,-.02*s,-.24*s);c.rotation.x=.08;return c;
}
function crown(rig,m,wide=.16){
 const s=rig.scale;
 mesh(rig.head,cyl(.20*s,.17*s,.075*s,9),m.armor,0,.20*s,0);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(rig.head,cone(.05*s,.17*s,5),m.glow,Math.sin(a)*wide*s,.31*s,Math.cos(a)*wide*s);}
}
function visor(rig,m,w=.31){
 const s=rig.scale;mesh(rig.head,box(w*s,.075*s,.045*s),m.dark,0,.06*s,.17*s);
}
function horns(rig,m,span=.15,height=.28){
 const s=rig.scale;
 for(const side of[-1,1]){const h=mesh(rig.head,cone(.08*s,height*s,6),m.armor,side*span*s,.23*s,-.02*s);h.rotation.z=-side*.38;}
}
function ears(rig,m){
 const s=rig.scale;
 for(const side of[-1,1]){const e=mesh(rig.head,cone(.075*s,.23*s,5),m.skin,side*.20*s,.04*s,0);e.rotation.z=-side*1.15;}
}
function wings(rig,m,span=.42,h=.58){
 const s=rig.scale;
 for(const side of[-1,1]){const pivot=group(rig.torso,side*.23*s,.28*s,-.18*s);const w=mesh(pivot,box(.10*s,h*s,span*s),m.armor,side*.17*s,-.06*s,-.12*s);w.rotation.z=-side*.52;pivot.userData.v8Wing=true;}
}
function backpackJets(rig,m){
 const s=rig.scale;
 for(const side of[-1,1]){const j=mesh(rig.torso,cyl(.07*s,.10*s,.33*s,8),m.armor,side*.20*s,.08*s,-.28*s);j.rotation.x=Math.PI/2;mesh(rig.torso,cone(.07*s,.20*s,8),m.glow,side*.20*s,-.10*s,-.42*s).rotation.x=-Math.PI/2;}
}
function studs(parent,m,s,positions){
 for(const [x,y,z] of positions)mesh(parent,cyl(.055*s,.055*s,.055*s,8),m.armor,x*s,y*s,z*s);
}
function eyes(rig,m,count=2){
 const s=rig.scale;
 if(count===1)mesh(rig.head,sphere(.035*s),m.glow,0,.07*s,.18*s);
 else for(const side of[-1,1])mesh(rig.head,sphere(.028*s),m.glow,side*.065*s,.07*s,.18*s);
}
function clawHands(rig,m,n=3){
 const s=rig.scale;
 for(const hand of [rig.left.hand,rig.right.hand])for(let i=0;i<n;i++){const c=mesh(hand,cone(.035*s,.20*s,5),m.armor,(i-(n-1)/2)*.055*s,-.12*s,.06*s);c.rotation.x=Math.PI;}
}
function towerShoulders(rig,m){
 const s=rig.scale;for(const arm of [rig.left,rig.right]){mesh(arm.upper,box(.32*s,.24*s,.34*s),m.armor,0,-.08*s,0);for(const z of[-1,1])mesh(arm.upper,box(.10*s,.17*s,.10*s),m.armor,0,.08*s,z*.12*s);}}
function stoneChunks(rig,m){
 const s=rig.scale;
 const nodes=[rig.torso,rig.left.upper,rig.right.upper,rig.leftLeg.upper,rig.rightLeg.upper];
 nodes.forEach((n,i)=>{const b=mesh(n,new THREE.DodecahedronGeometry((i? .13:.22)*s,0),i%2?m.armor:m.primary,0,i?-.12*s:.16*s,(i%3-.8)*.05*s);b.rotation.set(i*.4,i*.7,i*.2);});
}
function brickJoints(rig,m){
 const s=rig.scale;const nodes=[rig.left.elbow,rig.right.elbow,rig.leftLeg.knee,rig.rightLeg.knee];
 for(const n of nodes)studs(n,m,s,[[-.05,0,.05],[.05,0,.05]]);
}
function mechArmor(rig,m){
 const s=rig.scale;shoulderPads(rig,m,.34);mesh(rig.torso,box(.67*s,.32*s,.48*s),m.armor,0,.17*s,-.02*s);visor(rig,m,.37);
 for(const leg of [rig.leftLeg,rig.rightLeg])mesh(leg.upper,box(.22*s,.30*s,.24*s),m.armor,0,-.15*s,.01*s);
}
function floatingOrbs(rig,m,count=3,radius=.34){
 const s=rig.scale;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;const o=mesh(rig.torso,sphere(.065*s),m.glow,Math.cos(a)*radius*s,.18*s,Math.sin(a)*radius*s);o.userData.v8Orb=i;}
}

const SCULPTS={
 'classic-p':(r,m)=>{shoulderPads(r,m,.20);mesh(r.left.hand,box(.40*r.scale,.50*r.scale,.075*r.scale),m.armor,0,-.20*r.scale,.25*r.scale);visor(r,m,.28);},
 'classic-n':(r,m)=>{shoulderPads(r,m,.25);visor(r,m,.30);const s=r.scale;mesh(r.head,box(.07*s,.34*s,.15*s),m.glow,0,.28*s,-.04*s);cape(r,m,.38,.42);},
 'classic-b':(r,m)=>{const s=r.scale;mesh(r.head,cone(.23*s,.48*s,8),m.armor,0,.28*s,0);cape(r,m,.50,.62);mesh(r.torso,torus(.23*s,.025*s),m.glow,0,.17*s,.20*s);},
 'classic-r':(r,m)=>{towerShoulders(r,m);mesh(r.left.hand,box(.48*r.scale,.62*r.scale,.10*r.scale),m.armor,0,-.25*r.scale,.28*r.scale);visor(r,m,.35);},
 'classic-q':(r,m)=>{crown(r,m,.15);cape(r,m,.52,.66);shoulderPads(r,m,.18);mesh(r.torso,oct(.095*r.scale),m.glow,0,.19*r.scale,.20*r.scale);},
 'classic-k':(r,m)=>{crown(r,m,.17);cape(r,m,.60,.72);shoulderPads(r,m,.29);mesh(r.torso,box(.12*r.scale,.34*r.scale,.045*r.scale),m.glow,0,.16*r.scale,.21*r.scale);},

 'arcane-p':(r,m)=>{const s=r.scale;mesh(r.head,cone(.27*s,.38*s,8),m.primary,0,.24*s,-.03*s);mesh(r.torso,torus(.22*s,.03*s),m.glow,0,.16*s,.20*s);floatingOrbs(r,m,2,.26);},
 'arcane-n':(r,m)=>{visor(r,m,.30);cape(r,m,.38,.42);shoulderPads(r,m,.16);const s=r.scale;for(const side of[-1,1])mesh(r.head,cone(.055*s,.24*s,6),m.glow,side*.13*s,.22*s,-.02*s).rotation.z=-side*.45;},
 'arcane-b':(r,m)=>{const s=r.scale;mesh(r.head,cone(.30*s,.52*s,9),m.primary,0,.31*s,0);cape(r,m,.56,.72);floatingOrbs(r,m,3,.31);mesh(r.torso,oct(.13*s),m.glow,0,.18*s,.22*s);},
 'arcane-r':(r,m)=>{stoneChunks(r,m);towerShoulders(r,m);const s=r.scale;mesh(r.head,new THREE.DodecahedronGeometry(.23*s,0),m.armor);eyes(r,m,1);},
 'arcane-q':(r,m)=>{const s=r.scale;cape(r,m,.62,.72);floatingOrbs(r,m,5,.40);mesh(r.head,torus(.23*s,.03*s),m.glow,0,.23*s,0).rotation.x=Math.PI/2;mesh(r.torso,oct(.15*s),m.glow,0,.18*s,.21*s);},
 'arcane-k':(r,m)=>{crown(r,m,.18);cape(r,m,.66,.78);floatingOrbs(r,m,4,.37);const s=r.scale;mesh(r.head,cone(.30*s,.42*s,8),m.primary,0,.30*s,-.03*s);},

 'monsters-p':(r,m)=>{ears(r,m);horns(r,m,.10,.18);clawHands(r,m);eyes(r,m,2);r.torso.scale.set(1.0,.85,1.08);},
 'monsters-n':(r,m)=>{const s=r.scale;horns(r,m,.17,.30);eyes(r,m,2);mesh(r.head,box(.38*s,.20*s,.38*s),m.primary,0,-.02*s,.17*s);for(const leg of r.extraLegs||[])mesh(leg.foot,cone(.055*s,.18*s,5),m.armor,0,0,.19*s).rotation.x=Math.PI/2;},
 'monsters-b':(r,m)=>{const s=r.scale;horns(r,m,.19,.42);cape(r,m,.54,.60);mesh(r.head,cone(.28*s,.44*s,7),m.secondary,0,.30*s,-.03*s);floatingOrbs(r,m,3,.30);},
 'monsters-r':(r,m)=>{const s=r.scale;shoulderPads(r,m,.38);horns(r,m,.18,.34);clawHands(r,m,4);mesh(r.torso,box(.76*s,.32*s,.45*s),m.primary,0,.16*s,0);eyes(r,m,2);},
 'monsters-q':(r,m)=>{wings(r,m,.52,.72);horns(r,m,.15,.30);clawHands(r,m,4);eyes(r,m,2);const s=r.scale;mesh(r.torso,torus(.24*s,.04*s),m.glow,0,.14*s,.18*s);},
 'monsters-k':(r,m)=>{horns(r,m,.24,.54);shoulderPads(r,m,.36);clawHands(r,m,4);cape(r,m,.58,.70);eyes(r,m,2);},

 'brick-p':(r,m)=>{brickJoints(r,m);const s=r.scale;studs(r.torso,m,s,[[-.14,.31,.14],[.14,.31,.14]]);visor(r,m,.26);},
 'brick-n':(r,m)=>{brickJoints(r,m);const s=r.scale;mesh(r.torso,torus(.23*s,.055*s,16),m.glow,0,.12*s,.17*s);studs(r.head,m,s,[[-.08,.18,.06],[.08,.18,.06]]);},
 'brick-b':(r,m)=>{brickJoints(r,m);const s=r.scale;mesh(r.torso,torus(.21*s,.055*s,12),m.armor,0,.13*s,.18*s);mesh(r.head,cone(.24*s,.36*s,4),m.armor,0,.24*s,0);},
 'brick-r':(r,m)=>{brickJoints(r,m);towerShoulders(r,m);const s=r.scale;studs(r.torso,m,s,[[-.18,.34,.15],[0,.34,.15],[.18,.34,.15]]);mesh(r.head,box(.34*s,.28*s,.32*s),m.primary);},
 'brick-q':(r,m)=>{brickJoints(r,m);const s=r.scale;mesh(r.torso,torus(.34*s,.045*s,24),m.glow,0,.14*s,0).rotation.x=Math.PI/2;crown(r,m,.14);},
 'brick-k':(r,m)=>{brickJoints(r,m);crown(r,m,.16);cape(r,m,.54,.58);const s=r.scale;studs(r.torso,m,s,[[-.16,.32,.16],[0,.32,.16],[.16,.32,.16]]);},

 'cosmic-p':(r,m)=>{mechArmor(r,m);backpackJets(r,m);const s=r.scale;mesh(r.torso,box(.16*s,.09*s,.04*s),m.glow,0,.16*s,.25*s);},
 'cosmic-n':(r,m)=>{shoulderPads(r,m,.24);backpackJets(r,m);visor(r,m,.33);const s=r.scale;mesh(r.head,cone(.07*s,.30*s,6),m.glow,0,.30*s,-.04*s);},
 'cosmic-b':(r,m)=>{const s=r.scale;cape(r,m,.46,.58);floatingOrbs(r,m,3,.34);visor(r,m,.34);mesh(r.head,torus(.22*s,.025*s),m.glow,0,.22*s,0).rotation.x=Math.PI/2;},
 'cosmic-r':(r,m)=>{mechArmor(r,m);const s=r.scale;for(const side of[-1,1]){const c=mesh(r.torso,box(.17*s,.22*s,.62*s),m.armor,side*.28*s,.22*s,-.11*s);c.rotation.x=-.05;}mesh(r.torso,torus(.26*s,.04*s),m.glow,0,.17*s,.24*s);},
 'cosmic-q':(r,m)=>{shoulderPads(r,m,.23);floatingOrbs(r,m,4,.40);cape(r,m,.52,.60);visor(r,m,.31);const s=r.scale;mesh(r.torso,oct(.12*s),m.glow,0,.16*s,.23*s);},
 'cosmic-k':(r,m)=>{mechArmor(r,m);crown(r,m,.17);floatingOrbs(r,m,3,.44);const s=r.scale;mesh(r.torso,torus(.31*s,.055*s),m.glow,0,.16*s,.05*s).rotation.x=Math.PI/2;}
};

export function sculptCharacter(root,rig,definition,materials){
 const fn=SCULPTS[definition.id];if(fn)fn(rig,materials);
 root.userData.visualSignature=definition.id;
 return root;
}

export function visualRecipeIds(){return Object.keys(SCULPTS);}
