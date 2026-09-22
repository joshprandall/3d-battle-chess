import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ChessGame,chooseComputerMove} from './engine.js';
import {PALETTES} from './pieces.js';
import {createCharacter} from './characters.js';
import {animateDuel} from './duels.js';
import {castleAttempt,castleNotation} from './castle-controls.js';
import {ATTACK_NAMES} from './attacks.js';
const $=s=>document.querySelector(s),sceneEl=$('#scene'),logEl=$('#log'),turnEl=$('#turn'),stateEl=$('#state'),game=new ChessGame();
const themes=PALETTES;
let theme='classic',selected=null,legal=[],busy=false,soundOn=true,aiTimer=null,generation=0,toastTimer=null,scene,camera,renderer,orbit,boardGroup,pieceGroup,fxGroup;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function material(color,glow=0){return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:theme==='cosmic'?.65:.16,emissive:glow,emissiveIntensity:.35})}
function clearGroup(group){while(group.children.length){const item=group.children[0];group.remove(item);item.traverse(node=>{node.geometry?.dispose();if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(m=>m.dispose())})}}
function createBoard(){
 clearGroup(boardGroup);
 const p=themes[theme];
 sceneEl.style.background=`radial-gradient(ellipse at 50% 27%, ${new THREE.Color(p.back).offsetHSL(0,0,.055).getStyle()} 0%, ${new THREE.Color(p.back).getStyle()} 55%, #0a1521 100%)`;
 scene.fog.color.setHex(p.back);
 const ground=new THREE.Mesh(new THREE.CircleGeometry(7.2,64),new THREE.MeshStandardMaterial({color:p.back,roughness:.96,metalness:.08}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.48;ground.receiveShadow=true;boardGroup.add(ground);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(5.08,.035,8,72),material(p.glow,p.glow));halo.position.y=-.4;halo.rotation.x=Math.PI/2;boardGroup.add(halo);
 const base=new THREE.Mesh(new THREE.BoxGeometry(9,.36,9),material(0x1a2837));base.position.y=-.25;base.receiveShadow=true;boardGroup.add(base);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const sq=new THREE.Mesh(new THREE.BoxGeometry(.98,.12,.98),material((x+y)%2?p.dark:p.light));
  sq.position.set(x-3.5,0,y-3.5);sq.userData={square:true,x,y};sq.receiveShadow=true;boardGroup.add(sq)
 }
}
function drawPieces(){clearGroup(pieceGroup);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(game.piece(x,y))pieceGroup.add(createCharacter(game.piece(x,y),x,y,theme));highlight()}
function highlight(){for(const o of boardGroup.children)if(o.userData.square){o.material.emissive.setHex(0);o.material.emissiveIntensity=.52;if(selected&&o.userData.x===selected.x&&o.userData.y===selected.y)o.material.emissive.setHex(0xfbbf24);const m=legal.find(m=>m.nx===o.userData.x&&m.ny===o.userData.y);if(m)o.material.emissive.setHex(game.piece(m.nx,m.ny)||game.ep?.x===m.nx&&game.ep?.y===m.ny?0xfb7185:0x2dd4bf);if(selected&&castleAttempt(game,selected,o.userData.x,o.userData.y)?.move)o.material.emissive.setHex(0x2dd4bf)}}
function renderStatus(){const st=game.status();turnEl.textContent=(game.turn==='w'?'White':'Black')+' to move';stateEl.textContent=st.over?(st.winner?(st.winner==='w'?'White':'Black')+' wins · checkmate':'Draw · '+st.kind):(st.check?'CHECK':'Battle in progress');logEl.replaceChildren(...game.moves.map((move,i)=>{const li=document.createElement('li');li.textContent=(i%2===0?'White · ':'Black · ')+move.notation;return li}));logEl.scrollTop=logEl.scrollHeight;$('#difficulty').disabled=$('#mode').value!=='ai';if(st.over)clearTimeout(aiTimer)}
function notice(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2500)}
function sound(frequency=230){if(!soundOn)return;try{const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain();osc.type=theme==='cosmic'?'sine':'triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.12);osc.onended=()=>audio.close()}catch{soundOn=false}}
function promotionChoice(){return new Promise(resolve=>{const modal=$('#promotion'),choices=$('#promotionChoices');choices.replaceChildren();const titles={q:'Queen',r:'Rook',b:'Bishop',n:'Knight'};for(const p of['q','r','b','n']){const b=document.createElement('button');b.textContent=titles[p];b.onclick=()=>{modal.classList.add('hidden');resolve(p)};choices.appendChild(b)}modal.classList.remove('hidden');choices.firstElementChild.focus()})}
async function applyMove(m,computer=false,promotion=null){
 if(busy||game.status().over)return false;
 const p=game.piece(m.x,m.y),target=game.piece(m.nx,m.ny),enPassant=p?.t==='p'&&game.ep?.x===m.nx&&game.ep?.y===m.ny&&!target;
 const captured=!!(target||enPassant);
 if(!p||p.c!==game.turn||!game.legalMoves(m.x,m.y).some(c=>c.nx===m.nx&&c.ny===m.ny))return false;
 busy=true;
 if(p.t==='p'&&(m.ny===0||m.ny===7)&&!promotion)promotion=computer?'q':await promotionChoice();
 if(captured){
  const attacker=pieceGroup.children.find(o=>o.userData.x===m.x&&o.userData.y===m.y);
  const defender=pieceGroup.children.find(o=>o.userData.x===m.nx&&o.userData.y===(enPassant?m.y:m.ny));
  const who={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King'}[p.t];
  stateEl.textContent=who+' '+ATTACK_NAMES[theme][p.t]+'!';
  await animateDuel({source:attacker,victim:defender,x:m.nx,y:m.ny,theme,role:p.t,fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion,onImpact:()=>sound(theme==='cosmic'?430:theme==='monsters'?125:240)});
 }
 const move=game.move(m.x,m.y,m.nx,m.ny,promotion||'q');
 if(!move){busy=false;renderStatus();return false}
 selected=null;legal=[];drawPieces();renderStatus();if(!captured)sound(290);busy=false;
 if(!computer&&$('#mode').value==='ai'&&game.turn==='b'&&!game.status().over)queueComputer();
 return true
}
function queueComputer(){clearTimeout(aiTimer);const ticket=++generation;aiTimer=setTimeout(async()=>{if(ticket!==generation||busy||game.turn!=='b'||$('#mode').value!=='ai'||game.status().over)return;const strength=Number($('#difficulty').value);stateEl.textContent='Computer thinking…';await new Promise(resolve=>requestAnimationFrame(resolve));if(ticket!==generation)return;const m=chooseComputerMove(game,strength===3?3:strength===2?2:1);if(ticket===generation&&m)await applyMove(m,true)},350)}
function chooseSquare(x,y){if(busy||game.status().over||($('#mode').value==='ai'&&game.turn==='b'))return;if(selected){const castle=castleAttempt(game,selected,x,y);if(castle){if(castle.move)void applyMove(castle.move);else notice('Cannot castle: clear the path, keep king and rook unmoved, and avoid check.');return}const m=legal.find(m=>m.nx===x&&m.ny===y);if(m){void applyMove(m);return}}if(game.piece(x,y)?.c===game.turn){selected={x,y};legal=game.legalMoves(x,y);highlight();return}selected=null;legal=[];highlight()}
function connectPointers(){const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>9){down=null;return}down=null;const rect=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...pieceGroup.children,...boardGroup.children],true);if(!hits.length)return;const obj=hits[0].object,root=obj.userData.root||obj,d=root.userData;if(d.piece||d.square)chooseSquare(d.x,d.y)});const form=$('#moveForm');if(form)form.addEventListener('submit',e=>{e.preventDefault();const text=$('#moveInput').value.trim().toLowerCase(),castle=castleNotation(game,text);if(castle){if(!castle.move){notice('Cannot castle: clear the path and avoid check.');return}void applyMove(castle.move).then(ok=>{if(ok)$('#moveInput').value=''});return}const match=/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/.exec(text);if(!match){notice('Enter e2e4 or e7e8q.');return}const x=match[1].charCodeAt(0)-97,y=8-Number(match[2]),nx=match[3].charCodeAt(0)-97,ny=8-Number(match[4]);if($('#mode').value==='ai'&&game.turn==='b'){notice('Computer is playing Black.');return}const rookCastle=castleAttempt(game,{x,y},nx,ny);const actual=rookCastle?.move||{x,y,nx,ny};if(rookCastle&&!rookCastle.move){notice('Cannot castle: clear the path and avoid check.');return}if(!game.legalMoves(actual.x,actual.y).some(m=>m.nx===actual.nx&&m.ny===actual.ny)){notice('That move is not legal.');return}void applyMove(actual,false,match[5]||null).then(ok=>{if(ok)$('#moveInput').value=''})})}
function newGame(){if(busy){notice('Wait for the attack to finish.');return}generation++;clearTimeout(aiTimer);busy=false;game.reset();selected=null;legal=[];drawPieces();renderStatus()}
function connectButtons(){$('#newGame').onclick=newGame;$('#undo').onclick=()=>{if(busy)return;generation++;clearTimeout(aiTimer);if(!game.undo()){notice('No move to undo.');return}if($('#mode').value==='ai'&&game.turn==='b')game.undo();selected=null;legal=[];drawPieces();renderStatus()};$('#flip').onclick=()=>{camera.position.x*=-1;camera.position.z*=-1;orbit.update()};$('#sound').onclick=e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'Sound on':'Sound off';e.currentTarget.setAttribute('aria-pressed',String(soundOn))};$('#theme').onchange=e=>{if(busy){e.target.value=theme;return}theme=e.target.value;createBoard();drawPieces()};$('#mode').onchange=newGame;$('#menuBtn').onclick=e=>{const c=$('#controls'),open=c.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))}}
function init(){try{scene=new THREE.Scene();scene.fog=new THREE.Fog(themes[theme].back,15,35);camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(8.5,10,9.5);renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;sceneEl.appendChild(renderer.domElement)}catch(error){stateEl.textContent='3D graphics unavailable';sceneEl.textContent='This browser could not start WebGL. '+error.message;return}orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,.25,0);orbit.minDistance=7;orbit.maxDistance=22;orbit.maxPolarAngle=1.47;orbit.update();scene.add(new THREE.HemisphereLight(0xdcecf8,0x718397,1.15));const light=new THREE.DirectionalLight(0xffedd3,2.0);light.position.set(6,12,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00012;light.shadow.normalBias=.018;light.shadow.radius=2.4;scene.add(light);const rim=new THREE.DirectionalLight(0xb2ecff,1.15);rim.position.set(-5,8,-7);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,.40);fill.position.set(-6,4,6);scene.add(fill);boardGroup=new THREE.Group();pieceGroup=new THREE.Group();fxGroup=new THREE.Group();scene.add(boardGroup,pieceGroup,fxGroup);createBoard();drawPieces();renderStatus();connectPointers();connectButtons();const resize=()=>{const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.85?62:43;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(sceneEl);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)})}
init();
