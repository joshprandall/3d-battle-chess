const P={
 p:{fallAxis:'z',fall:.62,twist:.20,stagger:1.10},
 n:{fallAxis:'x',fall:.48,twist:.42,stagger:.82},
 b:{fallAxis:'z',fall:.55,twist:.26,stagger:.92},
 r:{fallAxis:'x',fall:.34,twist:.15,stagger:.55},
 q:{fallAxis:'z',fall:.52,twist:.52,stagger:.88},
 k:{fallAxis:'x',fall:.40,twist:.24,stagger:.68}
};
const THEME={
 classic:{collapse:1,spin:.8},
 arcane:{collapse:.8,spin:1.25},
 monsters:{collapse:1.15,spin:1.0},
 brick:{collapse:.9,spin:1.5},
 cosmic:{collapse:.75,spin:.65}
};
export function defeatPose(definition,reaction,elapsed=0){
 if(!reaction)return {lean:0,turn:0,head:0,crouch:0,fall:0};
 const p=P[definition.role]||P.p,t=THEME[definition.theme]||THEME.classic;
 const s=Math.min(1,(reaction.stagger||0)*(.75+elapsed*.65));
 return {
  lean:p.fall*t.collapse*s,
  turn:p.twist*t.spin*s*(definition.role==='q'?-1:1),
  head:.28*s,
  crouch:(reaction.fall?.30:.12)*s,
  fall:reaction.fall?s:0,
  torsoRoll:p.fallAxis==='x'?p.fall*s:p.twist*s
 };
}
