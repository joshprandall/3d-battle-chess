import {animateDuel as runDuel} from './duels-v6.js';
// The duel owns the stage until it ends. Hide the new quick-action toolbar
// so it cannot cover or intercept the Skip battle button on small screens.
const WINDUP={p:.66,n:.72,b:.90,r:.86,q:1,k:.84};
export async function animateDuel(options){
 const {role='p',theme='classic',reducedMotion=false,onAttack,onFootstep}=options;
 const toolbar=document.querySelector('.chess-quick-actions');
 const visibility=toolbar?.style.visibility;
 if(toolbar)toolbar.style.visibility='hidden';
 let attackTimer=null,footTimer=null;
 if(!reducedMotion){attackTimer=setTimeout(()=>onAttack?.(),(WINDUP[role]||.66)*1000);if(role!=='b'&&theme!=='arcane'&&theme!=='cosmic')footTimer=setInterval(()=>onFootstep?.(),430)}
 try{return await runDuel(options)}finally{if(attackTimer!==null)clearTimeout(attackTimer);if(footTimer!==null)clearInterval(footTimer);if(toolbar)toolbar.style.visibility=visibility||''}
}
