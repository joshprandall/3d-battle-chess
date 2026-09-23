// Distinct bounded AI: Recruit varies legal moves, Warrior evaluates one ply,
// Champion examines opponent replies. Never leaves the board mutated.
const POINTS={p:100,n:320,b:335,r:510,q:900,k:20000};
const value=g=>{let score=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=g.piece(x,y);if(!p)continue;const center=3.5-(Math.abs(x-3.5)+Math.abs(y-3.5))/2,progress=p.t==='p'?(p.c==='b'?y:7-y)*3:0;score+=(p.c==='b'?1:-1)*(POINTS[p.t]+center*(p.t==='n'?12:p.t==='p'?5:3)+progress)}return score};
const captureBonus=(g,m)=>POINTS[g.piece(m.nx,m.ny)?.t]||0;
export function chooseComputerMoveV7(game,strength=2){
 const all=game.allLegal();if(!all.length)return null;
 const level=Math.max(1,Math.min(3,Number(strength)||2));
 if(level===1){const captures=all.filter(m=>captureBonus(game,m)>0),pool=captures.length&&Math.random()<.28?captures:all;return pool[Math.floor(Math.random()*pool.length)]||all[0]}
 const initial=game.snapshot();let nodes=0;
 const evaluateMove=m=>{const took=captureBonus(game,m);if(!game.move(m.x,m.y,m.nx,m.ny))return -Infinity;const st=game.status();const score=st.winner==='b'?100000:st.winner==='w'?-100000:value(game);game.undo();return score+took*.04};
 try{
  const scored=all.map(m=>({m,score:evaluateMove(m)})).sort((a,b)=>b.score-a.score);
  if(level===2){const pool=scored.slice(0,Math.min(5,scored.length));return pool[Math.floor(Math.random()*pool.length)].m}
  const candidates=scored.slice(0,Math.min(8,scored.length));let best=-Infinity,chosen=candidates[0].m;
  for(const item of candidates){if(nodes>210)break;const m=item.m;if(!game.move(m.x,m.y,m.nx,m.ny))continue;const st=game.status();let worst=st.winner==='b'?100000:st.winner==='w'?-100000:value(game);
   if(!st.over){worst=Infinity;let replies=game.allLegal();replies.sort((a,b)=>captureBonus(game,b)-captureBonus(game,a));for(const reply of replies){if(++nodes>210)break;if(!game.move(reply.x,reply.y,reply.nx,reply.ny))continue;const result=game.status(),v=result.winner==='w'?-100000:result.winner==='b'?100000:value(game);game.undo();worst=Math.min(worst,v);if(worst<best-100)break}}
   game.undo();if(worst>best){best=worst;chosen=m}
  }
  return chosen;
 }finally{const key=initial.board.map(r=>r.map(p=>p?p.c+p.t:'..').join('')).join('/')+' '+initial.turn+' '+JSON.stringify(initial.castling)+' '+(initial.ep?String.fromCharCode(97+initial.ep.x)+(8-initial.ep.y):'-');if(game.history.length!==initial.moves.length||game.positionKey()!==key)game.restore(initial)}
}
