// Original synthesized sounds, no external music or autoplay. Audio unlocks on user action.
const PITCH={p:320,n:240,b:540,r:110,q:420,k:165};
export function createChessAudio(){
 let ctx=null,enabled=true,mode='3d',timer=null,beat=0;
 function ensure(){try{ctx??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')void ctx.resume();return ctx}catch{return null}}
 function tone(freq,duration=.17,volume=.035,kind='triangle',when=0,slide=0){const ac=ctx;if(!ac||!enabled)return;const start=ac.currentTime+when,osc=ac.createOscillator(),gain=ac.createGain();osc.type=kind;osc.frequency.setValueAtTime(Math.max(35,freq),start);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.014);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain).connect(ac.destination);osc.start(start);osc.stop(start+duration+.02)}
 function music(){if(mode!=='2d'||!enabled||!ctx)return;const motif=[196,246.94,293.66,246.94,174.61,220,261.63,220],freq=motif[beat++%motif.length];tone(freq,.35,.012,'sine');if(beat%4===1)tone(freq/2,.80,.008,'triangle')}
 function sync(){if(timer){clearInterval(timer);timer=null}if(enabled&&mode==='2d'&&ctx){music();timer=setInterval(music,420)}}
 return {
  unlock(){ensure();sync()},setMode(next){mode=next;sync()},setEnabled(next){enabled=!!next;if(enabled)ensure();sync()},get enabled(){return enabled},
  footstep(role='p'){if(mode!=='3d'||!enabled||!ensure())return;tone((PITCH[role]||210)*.55,.075,.022,'triangle',0,-35)},
  attack(role='p',theme='classic'){if(mode!=='3d'||!enabled||!ensure())return;const f=PITCH[role]||260;if(role==='b'||theme==='arcane'){tone(f,.3,.03,'sine',0,340);tone(f*1.5,.25,.012,'triangle',.06,200)}else if(role==='r'){tone(95,.27,.055,'sawtooth',0,-55);tone(180,.16,.02,'triangle',.07,-90)}else if(role==='n'){tone(f*1.9,.14,.035,'sawtooth',0,-250);tone(f,.21,.03,'triangle',.11,-120)}else if(role==='q'){tone(f,.18,.027,'sine',0,280);tone(f*1.15,.19,.032,'sawtooth',.16,-220)}else if(role==='k'){tone(f,.34,.05,'sawtooth',0,-100)}else{tone(f,.13,.03,'triangle',0,-140)}},
  impact(role='p',theme='classic'){if(mode!=='3d'||!enabled||!ensure())return;const f=theme==='brick'?180:theme==='cosmic'?390:theme==='monsters'?105:PITCH[role]||230;tone(f,.20,.055,theme==='cosmic'?'sine':'triangle',0,-f*.65);if(['q','r','k'].includes(role))tone(f*.7,.26,.026,'sawtooth',.015,-f*.5)},
  selection(){if(mode==='3d'&&enabled&&ensure())tone(360,.045,.009,'sine')},dispose(){if(timer)clearInterval(timer);timer=null;void ctx?.close();ctx=null}
 };
}
