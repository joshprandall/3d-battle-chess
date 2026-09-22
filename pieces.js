import * as THREE from 'three';

// Procedural, original silhouettes. Geometry is deliberately small for mobile GPUs.
export const PALETTES={
 classic:{light:0x9ca9a2,dark:0x617782,w:0xe4d2b5,b:0x314858,trim:0xb18b56,glow:0xcda569,back:0x182d3f},
 arcane:{light:0x859ba3,dark:0x4f617f,w:0xc8e3d8,b:0x3e365f,trim:0xae9a69,glow:0x69d8e5,back:0x1c2941},
 monsters:{light:0xa5ad88,dark:0x61745b,w:0xd1d5a7,b:0x493a4b,trim:0x9b7549,glow:0x9ce17d,back:0x1d332d},
 brick:{light:0xa4a6a1,dark:0x576e80,w:0xead49b,b:0x9f3444,trim:0xbfb6a4,glow:0xe5ae52,back:0x20394c},
 cosmic:{light:0x7c96a6,dark:0x41556c,w:0xbcd9d7,b:0x314b63,trim:0xcc81a8,glow:0x65daca,back:0x16263e}
};
const sphere=(r=.1)=>new THREE.SphereGeometry(r,12,8);
const cyl=(top,bottom,height,n=12)=>new THREE.CylinderGeometry(top,bottom,height,n);
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const cone=(r,h,n=12)=>new THREE.ConeGeometry(r,h,n);
const torus=(r,t=.025)=>new THREE.TorusGeometry(r,t,6,24);

export function createPiece(piece,x,y,theme='classic'){
 const p=PALETTES[theme],root=new THREE.Group(),dark=piece.c==='b';
 // Dark pieces are intentionally lighter than their board squares, with a pale edge band.
 const shell=new THREE.MeshStandardMaterial({color:dark?p.b:p.w,metalness:theme==='cosmic'?.55:.23,roughness:.37,emissive:dark?0x172536:0x080e10,emissiveIntensity:dark?.42:.12});
 const edge=new THREE.MeshStandardMaterial({color:dark?0x94afc0:p.trim,metalness:.45,roughness:.29,emissive:dark?0x253b4f:p.glow,emissiveIntensity:dark?.12:.08});
 const glow=new THREE.MeshStandardMaterial({color:p.glow,emissive:p.glow,emissiveIntensity:.58,roughness:.32});
 const ink=new THREE.MeshStandardMaterial({color:dark?0x132234:0x354352,roughness:.5});
 const other=new THREE.MeshStandardMaterial({color:dark?0x91a8b6:0x987549,metalness:.35,roughness:.42});
 const add=(geo,X,Y,Z,m=shell,group=root)=>{const mesh=new THREE.Mesh(geo,m);mesh.position.set(X,Y,Z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 const a=(geo,Y,m=shell)=>add(geo,0,Y,0,m);
 const horn=(X,Y,Z,r=.09,h=.32,m=edge)=>{const z=add(cone(r,h,8),X,Y,Z,m);z.rotation.z=-X*.9;return z};
 const ring=(Y,r=.31,m=glow)=>{const t=a(torus(r),Y,m);t.rotation.x=Math.PI/2;return t};
 const wing=(side,Y,m=edge)=>{const w=add(box(.13,.43,.4),side*.34,Y,0,m);w.rotation.z=-side*.5;return w};
 const head=(Y=.98,r=.22,m=shell)=>a(sphere(r),Y,m);
 const eye=(X,Y,Z=.19)=>add(sphere(.046),X,Y,Z,glow);
 // Common base is recognizable at chessboard scale even with radically different figures.
 a(cyl(.34,.43,.15,theme==='brick'?8:20),.13,shell);a(cyl(.32,.35,.045,20),.235,edge);
 const standardBody=(h=.65)=>a(cyl(.15,.27,h,theme==='brick'?8:16),.30+h/2,shell);
 const crown=()=>{for(let i=0;i<5;i++){const t=i*Math.PI*2/5;add(cone(.085,.23,6),Math.cos(t)*.24,1.43,Math.sin(t)*.24,edge)}};
 const t=piece.t;
 if(theme==='classic'){
  standardBody(t==='p'?.4:t==='k'?.93:.65);
  if(t==='p')head(.78,.20,edge);
  if(t==='n'){const neck=add(cone(.28,.69,5),0,1.01,.04);neck.rotation.z=.30;add(box(.16,.20,.38),0,1.26,.12,edge);eye(-.12,1.15,.17);eye(.12,1.15,.17)}
  if(t==='b'){head(1.04,.21);const mitre=a(cone(.17,.46,16),1.37,edge);mitre.rotation.z=.15;ring(.95,.23,edge)}
  if(t==='r'){a(cyl(.31,.24,.30,8),1.02);for(let i=0;i<4;i++){const angle=i*Math.PI/2;add(box(.15,.18,.15),Math.sin(angle)*.24,1.25,Math.cos(angle)*.24,edge)}}
  if(t==='q'){head(1.15,.23);crown();a(sphere(.115),1.58,glow)}
  if(t==='k'){head(1.35,.25);add(box(.12,.40,.11),0,1.69,0,edge);add(box(.36,.10,.11),0,1.74,0,edge)}
 }
 if(theme==='arcane'){
  if(t==='p'){a(cyl(.09,.23,.37,8),.49);a(sphere(.21),.85,glow);ring(.84,.24,edge)}
  if(t==='n'){standardBody(.57);head(1.05,.22);for(const s of[-1,1]){horn(s*.20,1.25,.03,.08,.43,glow);wing(s,.89)}eye(-.085,1.08);eye(.085,1.08)}
  if(t==='b'){standardBody(.75);a(cone(.29,.6,8),1.32);add(cyl(.035,.045,.85,8),.32,1.12,0,edge);add(sphere(.13),.32,1.59,0,glow)}
  if(t==='r'){a(cyl(.24,.31,.78,6),.72);for(const s of[-1,1])add(cone(.12,.39,6),s*.20,1.25,0,edge);ring(.78,.32);a(sphere(.17),1.20,glow)}
  if(t==='q'){standardBody(.76);a(new THREE.OctahedronGeometry(.28),1.23,glow);crown();ring(1.22,.36)}
  if(t==='k'){standardBody(.91);a(cone(.28,.46,6),1.34,edge);add(cyl(.04,.04,.95,8),.36,1.25,.01,edge);add(new THREE.OctahedronGeometry(.14),.36,1.76,.01,glow);ring(1.10,.34)}
 }
 if(theme==='monsters'){
  if(t==='p'){a(sphere(.31),.59);head(.94,.21);eye(-.11,.99,.16);eye(.11,.99,.16);horn(-.15,1.16,0,.09,.24);horn(.15,1.16,0,.09,.24)}
  if(t==='n'){standardBody(.62);add(box(.45,.25,.49),0,1.12,.1);add(box(.32,.17,.30),0,1.06,.36,other);for(const s of[-1,1]){horn(s*.23,1.32,.06,.12,.40);eye(s*.12,1.21,.36)}}
  if(t==='b'){standardBody(.65);head(1.17,.25);for(const s of[-1,1]){horn(s*.24,1.40,0,.1,.48,edge);add(cone(.08,.21,7),s*.16,1.05,.21,edge)}eye(0,1.16,.24)}
  if(t==='r'){a(box(.57,.90,.52),.74);for(const s of[-1,1]){add(box(.18,.56,.18),s*.34,.72,0,other);horn(s*.27,1.31,0,.12,.32)}eye(-.14,1.00,.27);eye(.14,1.00,.27)}
  if(t==='q'){standardBody(.77);head(1.19,.25);for(const s of[-1,1]){wing(s,.98);horn(s*.21,1.47,0,.11,.41,edge);eye(s*.12,1.22,.22)}a(sphere(.12),1.54,glow)}
  if(t==='k'){a(cyl(.27,.40,.98,7),.79);head(1.42,.30);horn(-.28,1.68,0,.14,.54,edge);horn(.28,1.68,0,.14,.54,edge);eye(-.12,1.46,.28);eye(.12,1.46,.28)}
 }
 if(theme==='brick'){
  const studs=(Y,w=.43)=>forStuds(Y,w);function forStuds(Y,w){for(const s of[-1,1])for(const d of[-1,1])add(cyl(.067,.067,.055,8),s*w/2,Y,d*w/2,edge)}
  if(t==='p'){a(box(.33,.39,.27),.49);head(.87,.19);add(box(.27,.07,.09),0,.96,.16,ink)}
  if(t==='n'){a(box(.38,.48,.33),.58);add(box(.40,.32,.43),0,1.01,.08);add(box(.21,.17,.30),0,.95,.34,other);studs(1.20,.27)}
  if(t==='b'){a(box(.36,.56,.34),.61);a(cone(.27,.47,4),1.12,edge);studs(.91,.25)}
  if(t==='r'){a(box(.51,.73,.50),.67);studs(1.09,.34);add(box(.46,.10,.46),0,1.11,0,edge)}
  if(t==='q'){a(box(.36,.66,.33),.66);head(1.11,.22);for(const s of[-1,1])add(box(.16,.30,.17),s*.20,1.39,0,edge);add(new THREE.OctahedronGeometry(.14),0,1.52,0,glow)}
  if(t==='k'){a(box(.46,.85,.43),.72);head(1.30,.22);add(box(.14,.39,.15),0,1.62,0,edge);add(box(.42,.11,.15),0,1.65,0,edge)}
 }
 if(theme==='cosmic'){
  if(t==='p'){a(cyl(.28,.20,.22,8),.48);a(sphere(.21),.85,glow);for(const s of[-1,1])wing(s,.81)}
  if(t==='n'){a(cone(.38,.85,3),.75);add(cone(.23,.6,3),0,1.08,.19,edge);for(const s of[-1,1])add(box(.17,.07,.52),s*.35,.84,.02,edge);a(sphere(.09),1.20,glow)}
  if(t==='b'){a(cyl(.17,.30,.75,8),.74);add(cyl(.035,.035,.55,8),0,1.34,0,edge);a(sphere(.18),1.52,glow);ring(1.12,.32,edge)}
  if(t==='r'){a(cyl(.24,.35,.74,8),.72);for(const s of[-1,1])add(cyl(.08,.08,.62,8),s*.21,1.11,0,edge);a(sphere(.18),1.18,glow)}
  if(t==='q'){a(cyl(.15,.31,.56,10),.61);a(sphere(.32),1.15,edge);ring(1.16,.49,glow);a(sphere(.14),1.39,glow)}
  if(t==='k'){a(cyl(.25,.35,1.0,8),.79);a(new THREE.OctahedronGeometry(.29),1.37,edge);add(cyl(.037,.037,.42,8),0,1.69,0,glow);a(sphere(.11),1.89,glow)}
 }
 // High-contrast trim at the base and glowing role badge point toward the opponent.
 const band=a(torus(.34,.025),.22,edge);band.rotation.x=Math.PI/2;
 root.rotation.y=piece.c==='w'?0:Math.PI;
 root.position.set(x-3.5,.08,y-3.5);
 root.userData={piece:true,x,y,role:t,side:piece.c};root.traverse(n=>{n.userData.root=root});
 return root;
}
