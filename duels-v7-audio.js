import {animateDuel as runDuel} from './duels-v6.js';
// Underlying physics reports actual contact through onImpact. Sound cues play
// during the approach and strike window, and stop when the duel completes.
const WINDUP={p:.66,n:.72,b:.90,r:.86,q:1,k:.84};
export async function animateDuel(options){
 const {role='p',theme='classic',reducedMotion=false,onAttack,onFootstep}=options;
 let attackTimer=null,footTimer=null;
 if(!reducedMotion){attackTimer=setTimeout(()=>onAttack?.(),(WINDUP[role]||.66)*1000);if(role!=='b'&&theme!=='arcane'&&theme!=='cosmic')footTimer=setInterval(()=>onFootstep?.(),430)}
 try{return await runDuel(options)}finally{if(attackTimer!==null)clearTimeout(attackTimer);if(footTimer!==null)clearInterval(footTimer)}
}
