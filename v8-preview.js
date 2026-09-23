import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CombatDirectorV8} from './combat-v8/combat-director.js';
import {getCharacterDefinition,ROLE_ORDER} from './combat-v8/character-definitions.js';

const $=s=>document.querySelector(s),sceneEl=$('#scene');
const roles={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King'};
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x102536,8,18);
const camera=new THREE.PerspectiveCamera(43,1,.1,50);camera.position.set(0,2.8,6.2);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;sceneEl.appendChild(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,1,0);orbit.minDistance=4;orbit.maxDistance=10;orbit.update();
scene.add(new THREE.HemisphereLight(0xcfeaff,0x314358,1.4));
const key=new THREE.DirectionalLight(0xffe2c0,2.4);key.position.set(4,8,5);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x8de8ff,1.5);rim.position.set(-5,5,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.45,.18,48),new THREE.MeshStandardMaterial({color:0x1b3040,roughness:.78,metalness:.16}));floor.position.y=-.12;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.55,.025,6,72),new THREE.MeshStandardMaterial({color:0x67e8f9,emissive:0x67e8f9,emissiveIntensity:.55}));ring.rotation.x=Math.PI/2;ring.position.y=-.02;scene.add(ring);

let director=null,playing=false,last=0,match=0;
function disposeRoot(root){if(!root)return;scene.remove(root);root.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});}
function describe(def){return `${def.rig} · ${def.locomotion} · ${def.weapon} · signature: ${def.attack}`;}
function updateCards(){
 const theme=$('#set').value,a=getCharacterDefinition(theme,$('#attacker').value),d=getCharacterDefinition(theme,$('#defender').value);
 $('#attackerName').textContent=a.name;$('#attackerInfo').textContent=describe(a);
 $('#defenderName').textContent=d.name;$('#defenderInfo').textContent=`${d.rig} · ${d.locomotion} · defeat: ${d.defeat}`;
 $('#title').textContent=`${a.setLabel}: ${a.name} vs ${d.name}`;
}
function resetBattle(){
 if(director){disposeRoot(director.attacker);disposeRoot(director.defender);}
 const theme=$('#set').value,at=$('#attacker').value,dt=$('#defender').value;
 director=new CombatDirectorV8({attacker:{t:at,c:'w'},defender:{t:dt,c:'b'},theme,onContact:event=>{
  const r=event.reaction;$('#telemetry').textContent=`Impact ${event.hit?.volume?.name||'body'} · severity ${r.severity.toFixed(2)} · stagger ${r.stagger.toFixed(2)} · ${r.fall?'defeat fall':'resisted'}`;
 }});
 scene.add(director.attacker,director.defender);playing=false;last=0;$('#phase').textContent='Ready';$('#telemetry').textContent='No impact yet.';updateCards();
}
function play(){resetBattle();playing=true;$('#phase').textContent='Engage';}
function next(){
 match=(match+1)%(5*6*6);const themes=['classic','arcane','monsters','brick','cosmic'];
 const themeIndex=Math.floor(match/36)%5,aIndex=Math.floor(match/6)%6,dIndex=match%6;
 $('#set').value=themes[themeIndex];$('#attacker').value=ROLE_ORDER[aIndex];$('#defender').value=ROLE_ORDER[dIndex];play();
}
$('#play').onclick=play;$('#next').onclick=next;
for(const id of['set','attacker','defender'])$('#'+id).onchange=resetBattle;

new ResizeObserver(()=>{const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}).observe(sceneEl);

renderer.setAnimationLoop(now=>{
 orbit.update();
 if(playing&&director){
  if(!last)last=now;const dt=Math.min(.04,(now-last)/1000);last=now;
  const state=director.update(dt);$('#phase').textContent=state.pose.state.replace('-', ' ');
  if(state.complete){playing=false;$('#phase').textContent=state.contact?'Battle complete':'Complete — no contact';}
 }
 renderer.render(scene,camera);
});
resetBattle();
window.__v8Preview={play,next,get director(){return director},roles};
