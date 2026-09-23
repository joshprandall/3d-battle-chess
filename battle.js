import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ChessGame,chooseComputerMove,computerProfile} from './engine.js';
import {PALETTES} from './pieces.js';
import {createCharacter} from './characters.js';
import {animateDuel} from './duels.js';
import {castleAttempt,castleNotation} from './castle-controls.js';
import {ATTACK_NAMES} from './attacks.js';
import {GameAudio} from './audio.js';

const $=s=>document.querySelector(s);
const sceneEl=$('#scene'),board2d=$('#board2d'),logEl=$('#log'),turnEl=$('#turn'),stateEl=$('#state'),gameShell=$('#gameShell'),game=new ChessGame(),audio=new GameAudio();
const themes=PALETTES;
let theme='classic',selected=null,legal=[],busy=false,soundOn=true,aiTimer=null,generation=0,toastTimer=null,scene,camera,renderer,orbit,boardGroup,pieceGroup,fxGroup;
let viewMode='3d',flipped=false,handCursor={x:4,y:6},keyboardCursor=false,fullscreenStarted=false,webglReady=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const query=new URLSearchParams(location.search);
const handheldDevice=()=>{
 const ua=navigator.userAgent||'';
 const explicit=/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
 const ipadDesktopUA=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const coarseTouch=navigator.maxTouchPoints>0&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1024;
 return explicit||ipadDesktopUA||coarseTouch;
};
const glyphs={w:{p:'♙',n:'♘',b:'♗',r:'♖',q:'♕',k:'♔'},b:{p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'}};
const roleNames={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King'};
const coord=(x,y)=>String.fromCharCode(97+x)+(8-y);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const handheldActive=()=>handheldDevice();
const cursorVisible=()=>keyboardCursor;
const nativeFullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
const fullscreenActive=()=>!!nativeFullscreenElement()||gameShell.classList.contains('immersive-fullscreen');

function material(color,glow=0){return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:theme==='cosmic'?.65:.16,emissive:glow,emissiveIntensity:.35})}
function clearGroup(group){if(!group)return;while(group.children.length){const item=group.children[0];group.remove(item);item.traverse(node=>{node.geometry?.dispose();if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(m=>m.dispose())})}}
function createBoard(){
 if(!boardGroup)return;
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
  sq.position.set(x-3.5,0,y-3.5);sq.userData={square:true,x,y};sq.receiveShadow=true;boardGroup.add(sq);
 }
}
function render2D(){
 if(!board2d)return;
 const rows=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7],cols=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
 const frag=document.createDocumentFragment();
 for(const y of rows)for(const x of cols){
  const p=game.piece(x,y),b=document.createElement('button'),m=legal.find(v=>v.nx===x&&v.ny===y);
  b.type='button';b.className='square2d '+((x+y)%2?'dark':'light');
  if(p)b.classList.add(p.c==='w'?'white-piece':'black-piece');
  if(selected&&selected.x===x&&selected.y===y)b.classList.add('selected');
  if(m)b.classList.add(game.piece(x,y)||game.ep?.x===x&&game.ep?.y===y?'capture':'legal');
  if(cursorVisible()&&handCursor.x===x&&handCursor.y===y)b.classList.add('cursor');
  b.dataset.x=x;b.dataset.y=y;b.setAttribute('role','gridcell');
  b.setAttribute('aria-label',p?`${p.c==='w'?'White':'Black'} ${roleNames[p.t]} on ${coord(x,y)}`:coord(x,y));
  b.textContent=p?glyphs[p.c][p.t]:'';
  b.onclick=()=>{void audio.ensure();beginPlayFullscreen();handCursor={x,y};chooseSquare(x,y)};
  frag.appendChild(b);
 }
 board2d.replaceChildren(frag);
 updateHandheldStatus();
}
function drawPieces(){
 if(pieceGroup){clearGroup(pieceGroup);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(game.piece(x,y))pieceGroup.add(createCharacter(game.piece(x,y),x,y,theme))}
 highlight();
}
function highlight(){
 if(boardGroup)for(const o of boardGroup.children)if(o.userData.square){
  o.material.emissive.setHex(0);o.material.emissiveIntensity=.52;
  if(cursorVisible()&&o.userData.x===handCursor.x&&o.userData.y===handCursor.y)o.material.emissive.setHex(0x38bdf8);
  if(selected&&o.userData.x===selected.x&&o.userData.y===selected.y)o.material.emissive.setHex(0xfbbf24);
  const m=legal.find(m=>m.nx===o.userData.x&&m.ny===o.userData.y);
  if(m)o.material.emissive.setHex(game.piece(m.nx,m.ny)||game.ep?.x===m.nx&&game.ep?.y===m.ny?0xfb7185:0x2dd4bf);
  if(selected&&castleAttempt(game,selected,o.userData.x,o.userData.y)?.move)o.material.emissive.setHex(0x2dd4bf);
 }
 render2D();
}
function renderStatus(){
 const st=game.status();
 turnEl.textContent=(game.turn==='w'?'White':'Black')+' to move';
 stateEl.textContent=st.over?(st.winner?(st.winner==='w'?'White':'Black')+' wins · checkmate':'Draw · '+st.kind):(st.check?'CHECK':'Battle in progress');
 logEl.replaceChildren(...game.moves.map((move,i)=>{const li=document.createElement('li');li.textContent=(i%2===0?'White · ':'Black · ')+move.notation;return li}));
 logEl.scrollTop=logEl.scrollHeight;
 $('#difficulty').disabled=$('#mode').value!=='ai';
 if(st.over)clearTimeout(aiTimer);
 updateHandheldStatus();
}
function notice(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2500)}
function promotionChoice(){return new Promise(resolve=>{const modal=$('#promotion'),choices=$('#promotionChoices');choices.replaceChildren();const titles={q:'Queen',r:'Rook',b:'Bishop',n:'Knight'};for(const p of['q','r','b','n']){const b=document.createElement('button');b.textContent=titles[p];b.onclick=()=>{modal.classList.add('hidden');resolve(p)};choices.appendChild(b)}modal.classList.remove('hidden');choices.firstElementChild.focus()})}
async function applyMove(m,computer=false,promotion=null){
 if(busy||game.status().over)return false;
 const p=game.piece(m.x,m.y),target=game.piece(m.nx,m.ny),enPassant=p?.t==='p'&&game.ep?.x===m.nx&&game.ep?.y===m.ny&&!target;
 const captured=!!(target||enPassant);
 if(!p||p.c!==game.turn||!game.legalMoves(m.x,m.y).some(c=>c.nx===m.nx&&c.ny===m.ny))return false;
 busy=true;
 if(p.t==='p'&&(m.ny===0||m.ny===7)&&!promotion)promotion=computer?'q':await promotionChoice();
 if(captured&&viewMode==='3d'&&webglReady){
  const attacker=pieceGroup.children.find(o=>o.userData.x===m.x&&o.userData.y===m.y);
  const defender=pieceGroup.children.find(o=>o.userData.x===m.nx&&o.userData.y===(enPassant?m.y:m.ny));
  stateEl.textContent=roleNames[p.t]+' '+ATTACK_NAMES[theme][p.t]+'!';
  void audio.move(p.t);
  await animateDuel({source:attacker,victim:defender,x:m.nx,y:m.ny,theme,role:p.t,fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion,onImpact:()=>{void audio.attack(theme,p.t)}});
 }
 const move=game.move(m.x,m.y,m.nx,m.ny,promotion||'q');
 if(!move){busy=false;renderStatus();return false}
 selected=null;legal=[];handCursor={x:m.nx,y:m.ny};drawPieces();renderStatus();
 if(!captured)void audio.move(p.t);
 busy=false;
 if(!computer&&$('#mode').value==='ai'&&game.turn==='b'&&!game.status().over)queueComputer();
 return true;
}
function queueComputer(){
 clearTimeout(aiTimer);const ticket=++generation;
 aiTimer=setTimeout(async()=>{
  if(ticket!==generation||busy||game.turn!=='b'||$('#mode').value!=='ai'||game.status().over)return;
  const strength=Number($('#difficulty').value),profile=computerProfile(strength);
  stateEl.textContent=`Computer thinking · ${profile.name}…`;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(ticket!==generation)return;
  const m=chooseComputerMove(game,strength);
  if(ticket===generation&&m)await applyMove(m,true);
 },350);
}
function syncFullscreenUI(){
 const active=fullscreenActive();
 document.body.classList.toggle('immersive-lock',active);
 $('#fullscreenBtn').textContent=active?'Exit full screen':'Full screen';
 $('#handFullscreen').textContent=active?'Exit Full':'Full Screen';
 if(active)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
async function enterFullscreen(){
 if(fullscreenActive())return true;
 const request=gameShell?.requestFullscreen||gameShell?.webkitRequestFullscreen;
 if(request){
  try{await request.call(gameShell);syncFullscreenUI();return true}catch{}
 }
 // Fallback for browsers that do not expose element fullscreen: remove all page chrome
 // and fit the game to the visual viewport. Native browser chrome may still be controlled
 // by the browser/OS, but the game itself is borderless and resolution-responsive.
 gameShell.classList.add('immersive-fullscreen');syncFullscreenUI();return true;
}
async function exitFullscreen(){
 if(nativeFullscreenElement()){
  const exit=document.exitFullscreen||document.webkitExitFullscreen;
  if(exit){try{await exit.call(document)}catch{}}
 }
 gameShell.classList.remove('immersive-fullscreen');syncFullscreenUI();
}
async function toggleFullscreen(){
 fullscreenStarted=true;
 if(fullscreenActive())await exitFullscreen();else await enterFullscreen();
}
function beginPlayFullscreen(){
 if(fullscreenStarted||fullscreenActive())return;
 fullscreenStarted=true;void enterFullscreen();
}
function chooseSquare(x,y){
 if(busy||game.status().over||($('#mode').value==='ai'&&game.turn==='b'))return;
 handCursor={x,y};beginPlayFullscreen();void audio.ensure();
 if(selected){
  const castle=castleAttempt(game,selected,x,y);
  if(castle){if(castle.move)void applyMove(castle.move);else notice('Cannot castle: clear the path, keep king and rook unmoved, and avoid check.');return}
  const m=legal.find(m=>m.nx===x&&m.ny===y);if(m){void applyMove(m);return}
 }
 if(game.piece(x,y)?.c===game.turn){selected={x,y};legal=game.legalMoves(x,y);highlight();return}
 selected=null;legal=[];highlight();
}
function connectPointers(){
 if(!renderer)return;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};void audio.ensure()});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>9){down=null;return}
  down=null;beginPlayFullscreen();
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;
  raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...pieceGroup.children,...boardGroup.children],true);if(!hits.length)return;
  const obj=hits[0].object,root=obj.userData.root||obj,d=root.userData;if(d.piece||d.square)chooseSquare(d.x,d.y);
 });
 const form=$('#moveForm');if(form)form.noValidate=true;
 if(form)form.addEventListener('submit',e=>{
  e.preventDefault();beginPlayFullscreen();void audio.ensure();
  const text=$('#moveInput').value.trim().toLowerCase(),castle=castleNotation(game,text);
  if(castle){if(!castle.move){notice('Cannot castle: clear the path and avoid check.');return}void applyMove(castle.move).then(ok=>{if(ok)$('#moveInput').value=''});return}
  const match=/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/.exec(text);if(!match){notice('Enter e2e4 or e7e8q.');return}
  const x=match[1].charCodeAt(0)-97,y=8-Number(match[2]),nx=match[3].charCodeAt(0)-97,ny=8-Number(match[4]);
  if($('#mode').value==='ai'&&game.turn==='b'){notice('Computer is playing Black.');return}
  const rookCastle=castleAttempt(game,{x,y},nx,ny),actual=rookCastle?.move||{x,y,nx,ny};
  if(rookCastle&&!rookCastle.move){notice('Cannot castle: clear the path and avoid check.');return}
  if(!game.legalMoves(actual.x,actual.y).some(m=>m.nx===actual.nx&&m.ny===actual.ny)){notice('That move is not legal.');return}
  void applyMove(actual,false,match[5]||null).then(ok=>{if(ok)$('#moveInput').value=''});
 });
}
function newGame(){
 if(busy){notice('Wait for the attack to finish.');return}
 generation++;clearTimeout(aiTimer);busy=false;game.reset();selected=null;legal=[];handCursor={x:4,y:6};drawPieces();renderStatus();
}
function undoMove(){
 if(busy)return;generation++;clearTimeout(aiTimer);
 if(!game.undo()){notice('No move to undo.');return}
 if($('#mode').value==='ai'&&game.turn==='b')game.undo();
 selected=null;legal=[];drawPieces();renderStatus();
}
function flipBoard(){
 flipped=!flipped;
 if(camera&&orbit){camera.position.x*=-1;camera.position.z*=-1;orbit.update()}
 render2D();highlight();
}
async function toggleSound(){
 soundOn=!soundOn;await audio.setEnabled(soundOn);
 $('#sound').textContent=soundOn?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(soundOn));
 $('#handSound').textContent=soundOn?'Sound on':'Sound off';
}
function setView(mode,announce=true){
 const wanted=mode==='2d'?'2d':'3d';
 if(wanted==='3d'&&!webglReady){notice('3D graphics are unavailable; staying in 2D.');viewMode='2d'}else viewMode=wanted;
 audio.setMode(viewMode);
 sceneEl.hidden=viewMode!=='3d';board2d.classList.toggle('hidden',viewMode!=='2d');
 $('#viewToggle').textContent=viewMode==='3d'?'Use 2D board':'Use 3D board';$('#viewToggle').setAttribute('aria-pressed',String(viewMode==='2d'));
 $('#handView').textContent=viewMode==='3d'?'Use 2D':'Use 3D';
 render2D();
 if(viewMode==='3d'&&renderer){const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false)}
 if(announce)notice(viewMode==='2d'?'2D board · background music only':'3D board · character and attack sound enabled');
}
function updateHandheldStatus(){
 const el=$('#handheldStatus');if(!el)return;
 el.textContent=selected?`Selected ${coord(selected.x,selected.y)} · tap a highlighted square`:'Tap the board to play';
}
function nudgeCursor(dx,dy){
 if(flipped){dx*=-1;dy*=-1}
 handCursor={x:clamp(handCursor.x+dx,0,7),y:clamp(handCursor.y+dy,0,7)};highlight();
}
function boardKeyboard(e){
 const tag=e.target?.tagName?.toLowerCase();
 if(tag==='input'||tag==='select'||tag==='textarea'||e.target?.isContentEditable)return;
 const key=e.key.toLowerCase();
 const moveKeys={
  arrowup:[0,-1],w:[0,-1],
  arrowdown:[0,1],s:[0,1],
  arrowleft:[-1,0],a:[-1,0],
  arrowright:[1,0],d:[1,0]
 };
 if(moveKeys[key]){
  e.preventDefault();keyboardCursor=true;beginPlayFullscreen();void audio.ensure();
  nudgeCursor(...moveKeys[key]);return;
 }
 if(key==='enter'||key===' '){
  e.preventDefault();keyboardCursor=true;beginPlayFullscreen();void audio.ensure();chooseSquare(handCursor.x,handCursor.y);return;
 }
 if(key==='v'){e.preventDefault();beginPlayFullscreen();void audio.ensure();setView(viewMode==='3d'?'2d':'3d');return}
 if(key==='f'){e.preventDefault();beginPlayFullscreen();flipBoard();return}
 if(key==='u'){e.preventDefault();undoMove();return}
 if(key==='m'){e.preventDefault();void toggleSound();return}
 if(key==='n'){e.preventDefault();newGame();return}
 if(key==='escape'&&gameShell.classList.contains('immersive-fullscreen')){e.preventDefault();void exitFullscreen();return}
}
function connectButtons(){
 $('#newGame').onclick=newGame;$('#undo').onclick=undoMove;$('#flip').onclick=flipBoard;
 $('#viewToggle').onclick=()=>{void audio.ensure();setView(viewMode==='3d'?'2d':'3d')};
 $('#sound').onclick=()=>{void toggleSound()};$('#fullscreenBtn').onclick=()=>{void toggleFullscreen()};
 $('#theme').onchange=e=>{if(busy){e.target.value=theme;return}theme=e.target.value;audio.setTheme(theme);createBoard();drawPieces()};
 $('#mode').onchange=newGame;
 $('#difficulty').onchange=e=>{const p=computerProfile(Number(e.target.value));notice(`Computer strength: ${p.name} · search depth ${p.depth}`);if($('#mode').value==='ai'&&game.turn==='b'&&!busy)queueComputer()};
 $('#menuBtn').onclick=e=>{const c=$('#controls'),open=c.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))};
 $('#handUndo').onclick=undoMove;$('#handFlip').onclick=flipBoard;$('#handView').onclick=()=>{void audio.ensure();setView(viewMode==='3d'?'2d':'3d')};
 $('#handSound').onclick=()=>{void toggleSound()};$('#handNew').onclick=newGame;$('#handFullscreen').onclick=()=>{void toggleFullscreen()};
 document.addEventListener('fullscreenchange',syncFullscreenUI);
 document.addEventListener('webkitfullscreenchange',syncFullscreenUI);
 document.addEventListener('keydown',e=>{
  boardKeyboard(e);
  if(e.key==='Escape'&&!fullscreenActive()){
   $('#controls').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
  }
 });
}
function init3D(){
 try{
  scene=new THREE.Scene();scene.fog=new THREE.Fog(themes[theme].back,15,35);camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(8.5,10,9.5);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;sceneEl.appendChild(renderer.domElement);
 }catch(error){sceneEl.textContent='This browser could not start WebGL. '+error.message;return false}
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,.25,0);orbit.minDistance=7;orbit.maxDistance=22;orbit.maxPolarAngle=1.47;orbit.update();
 scene.add(new THREE.HemisphereLight(0xdcecf8,0x718397,1.15));
 const light=new THREE.DirectionalLight(0xffedd3,2.0);light.position.set(6,12,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00012;light.shadow.normalBias=.018;light.shadow.radius=2.4;scene.add(light);
 const rim=new THREE.DirectionalLight(0xb2ecff,1.15);rim.position.set(-5,8,-7);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,.40);fill.position.set(-6,4,6);scene.add(fill);
 boardGroup=new THREE.Group();pieceGroup=new THREE.Group();fxGroup=new THREE.Group();scene.add(boardGroup,pieceGroup,fxGroup);webglReady=true;
 createBoard();connectPointers();
 const resize=()=>{if(viewMode!=='3d')return;const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.85?62:43;camera.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(sceneEl);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
 return true;
}
function init(){
 document.body.classList.toggle('handheld-active',handheldActive());
 window.addEventListener('resize',()=>{document.body.classList.toggle('handheld-active',handheldActive());render2D()});
 audio.setTheme(theme);audio.setMode(viewMode);connectButtons();
 const ok=init3D();drawPieces();renderStatus();
 if(!ok)setView('2d',false);else if(query.get('view')==='2d')setView('2d',false);else setView('3d',false);
}
init();
