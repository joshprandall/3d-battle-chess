// Accessible board modes and handheld controller. Does not replace the existing OSU index.
const SYMBOL={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};
const NAME={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
const sq=(x,y)=>String.fromCharCode(97+x)+(8-y);
export function createExperience({game,sceneEl,pick,cancel,undo,flip,audio,getSelection,getLegal,onCursor,castleAttempt}){
 const link=document.createElement('link');link.rel='stylesheet';link.href='experience-v7.css';document.head.append(link);
 const stage=document.querySelector('.stage'),handheld=/handheld\.html$/i.test(location.pathname)||new URLSearchParams(location.search).has('handheld');
 let is2D=false,can3D=true,fullscreenDismissed=false,immersive=false,cursor={x:4,y:6};
 const actions=document.createElement('div');actions.className='chess-quick-actions';
 const make=(text,cls,click)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.addEventListener('click',click);return b};
 const switchBtn=make('Use 2D board','switch-board',()=>{audio.unlock();set2D(!is2D)});
 const screenBtn=make('⛶ Full screen','screen-toggle',()=>toggleFullscreen());
 const handheldLink=document.createElement('a');handheldLink.className='chess-handheld-link';handheldLink.href=handheld?'index.html':'handheld.html';handheldLink.textContent=handheld?'Desktop view ↗':'Play handheld ↗';actions.append(switchBtn,screenBtn,handheldLink);stage.prepend(actions);
 const board=document.createElement('div');board.id='board2d';board.className='board2d';board.setAttribute('role','grid');board.setAttribute('aria-label','Two-dimensional chessboard. Select a piece and a destination.');board.hidden=true;
 const squares=[];
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const b=make('',`chess-square ${(x+y)%2?'dark':'light'}`,()=>{audio.unlock();autoFullscreen();cursor={x,y};pick(x,y)});b.dataset.square=sq(x,y);b.setAttribute('role','gridcell');b.setAttribute('aria-label',sq(x,y));b.tabIndex=-1;
  b.addEventListener('keydown',e=>{const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(d){e.preventDefault();const xx=Math.max(0,Math.min(7,x+d[0])),yy=Math.max(0,Math.min(7,y+d[1]));squares[yy*8+xx].focus();cursor={x:xx,y:yy};onCursor();update()}});board.append(b);squares.push(b)
 }sceneEl.append(board);
 const consoleEl=document.createElement('div');consoleEl.className='chess-handheld-console';consoleEl.setAttribute('aria-label','Handheld chess controller');
 const dpad=document.createElement('div');dpad.className='chess-dpad';const position=document.createElement('output');position.className='chess-cursor-label';position.setAttribute('aria-live','polite');
 const moveCursor=(dx,dy)=>{cursor={x:Math.min(7,Math.max(0,cursor.x+dx)),y:Math.min(7,Math.max(0,cursor.y+dy))};onCursor();update()};
 for(const [direction,dx,dy] of [['up',0,-1],['left',-1,0],['right',1,0],['down',0,1]]){const b=make({up:'▲',left:'◀',right:'▶',down:'▼'}[direction],`dpad-${direction}`,()=>moveCursor(dx,dy));b.setAttribute('aria-label',`Move cursor ${direction}`);dpad.append(b)}
 const handActions=document.createElement('div');handActions.className='chess-hand-actions';
 const select=make('A · Select','hand-primary',()=>{audio.unlock();pick(cursor.x,cursor.y)}),back=make('B · Cancel','',()=>cancel());
 handActions.append(select,back,make('Undo','',undo),make('Flip','',flip),make('2D / 3D','',()=>{audio.unlock();set2D(!is2D)}),make('Sound','',()=>{audio.setEnabled(!audio.enabled);updateSound()}));consoleEl.append(position,dpad,handActions);stage.after(consoleEl);
 const soundBtn=document.querySelector('#sound');
 function updateSound(){if(soundBtn){soundBtn.textContent=audio.enabled?'Sound on':'Sound off';soundBtn.setAttribute('aria-pressed',String(audio.enabled))}const b=handActions.lastElementChild;b.textContent=audio.enabled?'Sound on':'Sound off';b.setAttribute('aria-pressed',String(audio.enabled))}
 function set2D(next){if(!next&&!can3D)return;is2D=!!next;sceneEl.classList.toggle('is-2d',is2D);board.hidden=!is2D;switchBtn.textContent=is2D?'Use 3D board':'Use 2D board';switchBtn.setAttribute('aria-pressed',String(is2D));audio.setMode(is2D?'2d':'3d');if(is2D)update()}
 function update(){if(!is2D&&!handheld)return;const sel=getSelection(),legal=getLegal();position.textContent=`Cursor: ${sq(cursor.x,cursor.y)}${sel?` · Selected: ${sq(sel.x,sel.y)}`:''}`;
  if(is2D)for(let y=0;y<8;y++)for(let x=0;x<8;x++){const cell=squares[y*8+x],piece=game.piece(x,y);cell.textContent=piece?SYMBOL[piece.c][piece.t]:'';cell.classList.toggle('white-piece',piece?.c==='w');cell.classList.toggle('black-piece',piece?.c==='b');cell.classList.toggle('selected',!!sel&&sel.x===x&&sel.y===y);cell.classList.toggle('cursor',handheld&&cursor.x===x&&cursor.y===y);const move=legal.some(m=>m.nx===x&&m.ny===y)||!!(sel&&castleAttempt(game,sel,x,y)?.move);cell.classList.toggle('legal',move);cell.classList.toggle('capture',move&&piece?.c!==game.turn&&!!piece);cell.setAttribute('aria-label',`${sq(x,y)}${piece?' '+(piece.c==='w'?'white ':'black ')+NAME[piece.t]:''}${move?' legal destination':''}`)}
 }
 function supportedFullscreen(){return !!(document.fullscreenEnabled&&document.documentElement.requestFullscreen)}
 async function enterFullscreen(){if(supportedFullscreen()){try{await document.documentElement.requestFullscreen();return}catch{/* Browser can deny fullscreen. */}}document.body.classList.add('chess-immersive');immersive=true;screenBtn.textContent='Exit full screen'}
 async function toggleFullscreen(){audio.unlock();if(document.fullscreenElement){await document.exitFullscreen();fullscreenDismissed=true;return}if(immersive){exitImmersive();fullscreenDismissed=true;return}fullscreenDismissed=false;await enterFullscreen()}
 function autoFullscreen(){if(handheld||fullscreenDismissed||document.fullscreenElement||immersive||document.activeElement?.closest('#moveForm'))return;if(matchMedia('(pointer:fine) and (min-width:851px)').matches)void enterFullscreen()}
 function exitImmersive(){immersive=false;document.body.classList.remove('chess-immersive');screenBtn.textContent='⛶ Full screen'}
 document.addEventListener('fullscreenchange',()=>{screenBtn.textContent=document.fullscreenElement?'Exit full screen':'⛶ Full screen';if(!document.fullscreenElement)fullscreenDismissed=true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&immersive){exitImmersive();fullscreenDismissed=true}if(handheld&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const dir={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];moveCursor(...dir)}if(handheld&&e.key===' '&&!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();pick(cursor.x,cursor.y)}});
 document.body.classList.toggle('chess-handheld',handheld);if(handheld)set2D(false);updateSound();
 return {get is2D(){return is2D},get cursor(){return cursor},set2D,update,updateSound,autoFullscreen,setAvailable(value){can3D=!!value;if(!can3D){set2D(true);switchBtn.disabled=true;switchBtn.title='3D graphics unavailable on this device'}},enterFullscreen};
}
