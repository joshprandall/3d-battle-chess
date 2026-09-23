const clamp=x=>Math.max(0,Math.min(1,x));
const pulse=(t,a=1)=>Math.sin(clamp(t)*Math.PI)*a;
const snap=t=>{t=clamp(t);return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;};
const base=(o={})=>({lean:0,turn:0,head:0,guard:.25,weapon:0,torsoRoll:0,rightX:0,rightZ:0,leftX:0,leftZ:0,stepBias:0,rootSway:0,...o});

const C={
 'classic-p-shield-thrust':(p)=>base({lean:p.attack*.24-p.windup*.12,guard:.75,weapon:-p.windup*.32+p.attack*.18,rightX:-p.windup*.60+p.attack*1.25,leftX:-.35,stepBias:p.attack*.55}),
 'classic-n-cavalier-charge':(p)=>base({lean:.18+p.attack*.22,guard:.42,weapon:-.18,rightX:-.40+p.attack*.90,rightZ:-.28,stepBias:.85,head:-.08}),
 'classic-b-cleric-sweep':(p)=>base({turn:-p.windup*.55+p.attack*.95,lean:.06,weapon:p.windup*.28-p.attack*.62,rightZ:-p.windup*.65+p.attack*1.15,leftX:-.35,torsoRoll:p.attack*.18}),
 'classic-r-hammer-bash':(p)=>base({lean:-p.windup*.16+p.attack*.34,guard:.72,weapon:-p.windup*.85+p.attack*.34,rightX:-p.windup*1.05+p.attack*1.15,stepBias:.35,head:-.12}),
 'classic-q-feint-riposte':(p)=>base({turn:Math.sin(p.t*Math.PI*2)*.28*(p.windup+p.attack),lean:p.attack*.18,guard:.60,weapon:-.22,rightX:-.48+p.attack*1.35,rightZ:.28-p.attack*.55,stepBias:.48}),
 'classic-k-royal-cleave':(p)=>base({lean:-p.windup*.20+p.attack*.30,turn:p.attack*.16,guard:.55,weapon:-p.windup*1.10+p.attack*.48,rightX:-p.windup*1.18+p.attack*1.12,leftX:-.48,stepBias:.28}),

 'arcane-p-rune-dart':(p)=>base({lean:-.04,turn:p.windup*.12,guard:.45,rightX:-.28+p.attack*.52,rightZ:.30,weapon:pulse(p.windup,.25),rootSway:pulse(p.t,.05)}),
 'arcane-n-blink-strike':(p)=>base({lean:.24,turn:-.45+p.attack*.85,guard:.52,rightX:-.70+p.attack*1.35,rightZ:-.40+p.attack*.70,stepBias:.9,torsoRoll:-.16}),
 'arcane-b-spell-beam':(p)=>base({lean:-.06,turn:.08,guard:.68,rightX:-.20,leftX:-.20,rightZ:.22,leftZ:-.22,weapon:p.windup*.45,rootSway:pulse(p.t,.08)}),
 'arcane-r-golem-slam':(p)=>base({lean:-p.windup*.24+p.attack*.40,guard:.25,rightX:-p.windup*1.28+p.attack*1.20,leftX:-p.windup*.82+p.attack*.70,stepBias:.22,head:.08}),
 'arcane-q-void-vortex':(p)=>base({turn:p.t*Math.PI*.35,lean:-.04,guard:.80,rightX:-.42+p.attack*.42,leftX:-.42+p.attack*.42,rightZ:.35,leftZ:-.35,rootSway:pulse(p.t,.12)}),
 'arcane-k-archmage-shockwave':(p)=>base({lean:-.08+p.attack*.10,guard:.90,rightX:-.55+p.attack*.38,leftX:-.55+p.attack*.38,rightZ:.48,leftZ:-.48,weapon:p.windup*.35,head:-.08}),

 'monsters-p-goblin-rush':(p)=>base({lean:.30+p.attack*.18,guard:.15,rightX:-.35+p.attack*1.15,leftX:-.20+p.attack*.65,rightZ:.35,leftZ:-.20,stepBias:1.0,head:.18}),
 'monsters-n-dire-pounce':(p)=>base({lean:.42,guard:.05,rightX:-.65+p.attack*1.0,leftX:-.65+p.attack*1.0,rightZ:.35,leftZ:-.35,stepBias:1.0,head:-.20}),
 'monsters-b-shaman-curse':(p)=>base({turn:Math.sin(p.t*Math.PI)*.22,lean:-.08,guard:.75,rightX:-.38,leftX:-.24,weapon:p.windup*.58,head:.10,rootSway:pulse(p.t,.07)}),
 'monsters-r-ogre-body-slam':(p)=>base({lean:.38+p.attack*.28,guard:.05,rightX:-.15,leftX:-.15,stepBias:.72,head:-.18,torsoRoll:Math.sin(p.t*Math.PI)*.12}),
 'monsters-q-demon-rake':(p)=>base({lean:.18,turn:p.attack*.52,guard:.12,rightX:-.65+p.attack*1.10,leftX:-.58+p.attack*.95,rightZ:.52,leftZ:-.42,stepBias:.70,torsoRoll:-.28}),
 'monsters-k-tyrant-gore':(p)=>base({lean:.44+p.attack*.20,guard:.08,rightX:-.20,leftX:-.20,stepBias:.80,head:-.38+p.attack*.52}),

 'brick-p-block-jab':(p)=>base({lean:p.attack*.16,guard:.46,rightX:-.30+p.attack*.95,leftX:-.35,stepBias:.42}),
 'brick-n-spring-vault':(p)=>base({lean:.16,turn:p.attack*.35,guard:.32,rightX:-.44+p.attack*.72,stepBias:.78,torsoRoll:pulse(p.t,.18)}),
 'brick-b-gear-bolt':(p)=>base({turn:p.t*Math.PI*.20,guard:.54,rightX:-.24+p.attack*.42,leftX:-.30,weapon:p.windup*.34,rootSway:pulse(p.t,.035)}),
 'brick-r-block-topple':(p)=>base({lean:.30+p.attack*.32,guard:.06,rightX:-.18,leftX:-.18,stepBias:.58,torsoRoll:p.attack*.20}),
 'brick-q-spinner-combo':(p)=>base({turn:p.attack*Math.PI*2.6,lean:.10,guard:.28,rightX:-.55+p.attack*.88,leftX:-.55+p.attack*.88,stepBias:.52}),
 'brick-k-builder-hammer':(p)=>base({lean:-p.windup*.16+p.attack*.28,guard:.45,weapon:-p.windup*.92+p.attack*.38,rightX:-p.windup*.92+p.attack*1.02,leftX:-.30,stepBias:.22}),

 'cosmic-p-pulse-shot':(p)=>base({lean:-.06,guard:.62,rightX:-.22+p.attack*.35,leftX:-.28,rightZ:.25,leftZ:-.18,head:-.05}),
 'cosmic-n-jet-lance':(p)=>base({lean:.34,guard:.34,rightX:-.52+p.attack*.95,rightZ:-.20,stepBias:.88,head:-.10,torsoRoll:-.08}),
 'cosmic-b-psionic-lance':(p)=>base({lean:-.05,guard:.84,rightX:-.20,leftX:-.20,rightZ:.30,leftZ:-.30,head:-.10,rootSway:pulse(p.t,.06)}),
 'cosmic-r-siege-cannon':(p)=>base({lean:-p.windup*.06-p.recoil*.22,guard:.18,rightX:-.12,leftX:-.12,head:-.05,stepBias:.05}),
 'cosmic-q-plasma-orbit':(p)=>base({turn:p.t*Math.PI*.55,lean:-.03,guard:.72,rightX:-.38+p.attack*.35,leftX:-.38+p.attack*.35,rightZ:.40,leftZ:-.40,rootSway:pulse(p.t,.10)}),
 'cosmic-k-gravity-wave':(p)=>base({lean:-.10,guard:.88,rightX:-.48+p.attack*.28,leftX:-.48+p.attack*.28,rightZ:.48,leftZ:-.48,head:-.12,rootSway:pulse(p.t,.08)})
};

export function choreographyPose(attackId,pose){
 const fn=C[attackId];return fn?fn(pose):base();
}
export function choreographyIds(){return Object.keys(C);}
export function choreographyFingerprint(attackId){
 const samples=[.2,.5,.8].map(t=>choreographyPose(attackId,{state:'commit',t,windup:1-t,attack:t,follow:0,recover:0,recoil:.2,rootDrive:.4}));
 return JSON.stringify(samples.map(p=>[p.lean,p.turn,p.head,p.guard,p.weapon,p.torsoRoll,p.rightX,p.rightZ,p.leftX,p.leftZ,p.stepBias,p.rootSway].map(v=>Number((v||0).toFixed(3)))));
}
