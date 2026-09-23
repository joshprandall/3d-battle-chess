export const REACTIONS={
 p:{name:'light',stability:.65,stagger:1.25,knockback:1.25,fallThreshold:.72},
 n:{name:'agile',stability:.92,stagger:.90,knockback:.88,fallThreshold:.98,evasion:.18},
 b:{name:'guarded',stability:.84,stagger:1.0,knockback:1.0,fallThreshold:.92},
 r:{name:'fortified',stability:1.65,stagger:.58,knockback:.48,fallThreshold:1.65},
 q:{name:'agile-dramatic',stability:1.00,stagger:.92,knockback:.82,fallThreshold:1.08,evasion:.16},
 k:{name:'royal-heavy',stability:1.35,stagger:.72,knockback:.62,fallThreshold:1.38}
};

const THEME_MODIFIERS={
 classic:{stability:1,knockback:1},
 arcane:{stability:.92,knockback:1.02},
 monsters:{stability:1.06,knockback:1.04},
 brick:{stability:1.12,knockback:.90},
 cosmic:{stability:1.08,knockback:.94}
};

export function reactionProfile(role,theme='classic',mass=1){
 const base=REACTIONS[role]||REACTIONS.p,mod=THEME_MODIFIERS[theme]||THEME_MODIFIERS.classic;
 return {...base,stability:base.stability*mod.stability*Math.sqrt(Math.max(.25,mass)),knockback:base.knockback*mod.knockback/Math.sqrt(Math.max(.25,mass))};
}

export function impactResponse({role,theme,mass,impulse={x:0,y:0,z:0}}){
 const p=reactionProfile(role,theme,mass),magnitude=Math.hypot(impulse.x,impulse.y,impulse.z);
 const severity=magnitude/Math.max(.01,p.stability);
 return {profile:p,severity,fall:severity>=p.fallThreshold,stagger:Math.min(1.5,severity*p.stagger),velocity:{x:impulse.x*p.knockback,y:impulse.y*p.knockback,z:impulse.z*p.knockback}};
}
