const a=(id,name,kind,phases,contact,style={})=>({id,name,kind,phases,contact,style});

const phases=(engage,approach,anticipate,commit,follow,recover)=>({engage,approach,anticipate,commit,follow,recover});

export const ATTACKS={
 'classic-p-shield-thrust':a('classic-p-shield-thrust','Shield Spear Thrust','melee',phases(.20,.38,.32,.22,.22,.28),{shape:'capsule',radius:.16}, {drive:1.05,weaponArc:'thrust',shieldLead:true}),
 'classic-n-cavalier-charge':a('classic-n-cavalier-charge','Cavalier Charge','melee',phases(.18,.46,.26,.28,.30,.34),{shape:'capsule',radius:.19}, {drive:1.35,weaponArc:'lance',hop:.22}),
 'classic-b-cleric-sweep':a('classic-b-cleric-sweep','Cleric Staff Sweep','melee',phases(.28,.26,.42,.34,.28,.32),{shape:'capsule',radius:.20}, {drive:.55,weaponArc:'wide-sweep'}),
 'classic-r-hammer-bash':a('classic-r-hammer-bash','Guardian Hammer Bash','melee',phases(.30,.42,.52,.30,.40,.46),{shape:'sphere',radius:.31}, {drive:.90,weaponArc:'overhand',heavy:true}),
 'classic-q-feint-riposte':a('classic-q-feint-riposte','Royal Feint and Riposte','melee',phases(.18,.28,.44,.20,.26,.30),{shape:'capsule',radius:.14}, {drive:.95,weaponArc:'riposte',feint:true}),
 'classic-k-royal-cleave':a('classic-k-royal-cleave','Royal Greatsword Cleave','melee',phases(.34,.32,.62,.34,.44,.50),{shape:'capsule',radius:.24}, {drive:.72,weaponArc:'great-cleave',heavy:true}),

 'arcane-p-rune-dart':a('arcane-p-rune-dart','Rune Dart','projectile',phases(.22,.10,.46,.12,.24,.28),{shape:'sphere',radius:.17},{projectileSpeed:6.2,spell:'rune'}),
 'arcane-n-blink-strike':a('arcane-n-blink-strike','Blink Strike','teleport-melee',phases(.16,.18,.34,.18,.20,.26),{shape:'capsule',radius:.17},{blink:true,weaponArc:'cross-cut'}),
 'arcane-b-spell-beam':a('arcane-b-spell-beam','Focused Spell Beam','beam',phases(.30,.08,.60,.20,.34,.36),{shape:'ray',radius:.20},{spell:'beam',channel:true}),
 'arcane-r-golem-slam':a('arcane-r-golem-slam','Golem Fist Slam','melee',phases(.38,.48,.58,.30,.46,.52),{shape:'sphere',radius:.40},{heavy:true,weaponArc:'fist-slam'}),
 'arcane-q-void-vortex':a('arcane-q-void-vortex','Void Vortex','area',phases(.24,.12,.64,.24,.38,.36),{shape:'sphere',radius:.56},{spell:'vortex',orbit:true}),
 'arcane-k-archmage-shockwave':a('arcane-k-archmage-shockwave','Archmage Shockwave','area',phases(.34,.08,.72,.18,.42,.44),{shape:'ring',radius:.72},{spell:'shockwave',heavy:true}),

 'monsters-p-goblin-rush':a('monsters-p-goblin-rush','Goblin Rush','melee',phases(.14,.34,.20,.18,.28,.20),{shape:'capsule',radius:.20},{drive:1.30,weaponArc:'claw-jab'}),
 'monsters-n-dire-pounce':a('monsters-n-dire-pounce','Dire Pounce','body',phases(.18,.30,.36,.22,.34,.30),{shape:'sphere',radius:.42},{leap:1.0,bite:true}),
 'monsters-b-shaman-curse':a('monsters-b-shaman-curse','Shaman Curse','projectile',phases(.30,.08,.58,.20,.30,.34),{shape:'sphere',radius:.22},{spell:'curse',projectileSpeed:4.8}),
 'monsters-r-ogre-body-slam':a('monsters-r-ogre-body-slam','Ogre Body Slam','body',phases(.24,.48,.42,.28,.46,.48),{shape:'sphere',radius:.50},{drive:1.10,heavy:true}),
 'monsters-q-demon-rake':a('monsters-q-demon-rake','Demon Aerial Rake','melee',phases(.16,.32,.34,.22,.28,.32),{shape:'capsule',radius:.25},{leap:.65,weaponArc:'talon-rake',aerial:true}),
 'monsters-k-tyrant-gore':a('monsters-k-tyrant-gore','Tyrant Gore','body',phases(.28,.42,.50,.26,.40,.46),{shape:'capsule',radius:.34},{drive:1.05,heavy:true,horns:true}),

 'brick-p-block-jab':a('brick-p-block-jab','Block Spear Jab','melee',phases(.16,.30,.24,.16,.18,.20),{shape:'capsule',radius:.17},{drive:1.0,weaponArc:'jab',brick:true}),
 'brick-n-spring-vault':a('brick-n-spring-vault','Spring Vault','body',phases(.16,.24,.32,.20,.24,.24),{shape:'sphere',radius:.31},{leap:.85,spring:true,brick:true}),
 'brick-b-gear-bolt':a('brick-b-gear-bolt','Gear Bolt','projectile',phases(.24,.08,.42,.14,.22,.24),{shape:'box',radius:.19},{projectileSpeed:5.4,gear:true,brick:true}),
 'brick-r-block-topple':a('brick-r-block-topple','Block Golem Topple','body',phases(.28,.42,.44,.24,.40,.38),{shape:'box',radius:.48},{drive:.92,heavy:true,brick:true}),
 'brick-q-spinner-combo':a('brick-q-spinner-combo','Spinner Combo','melee',phases(.14,.24,.30,.26,.28,.28),{shape:'capsule',radius:.22},{spin:true,multiHit:3,brick:true}),
 'brick-k-builder-hammer':a('brick-k-builder-hammer','Builder Hammer','melee',phases(.30,.30,.52,.28,.38,.44),{shape:'sphere',radius:.34},{heavy:true,weaponArc:'hammer',brick:true}),

 'cosmic-p-pulse-shot':a('cosmic-p-pulse-shot','Pulse Shot','projectile',phases(.18,.08,.28,.12,.20,.22),{shape:'sphere',radius:.16},{projectileSpeed:8.0,energy:true}),
 'cosmic-n-jet-lance':a('cosmic-n-jet-lance','Jump-Jet Lance','melee',phases(.16,.30,.30,.20,.28,.30),{shape:'capsule',radius:.20},{jets:true,leap:.55,weaponArc:'lance'}),
 'cosmic-b-psionic-lance':a('cosmic-b-psionic-lance','Psionic Lance','beam',phases(.24,.06,.52,.16,.28,.30),{shape:'ray',radius:.17},{energy:true,channel:true}),
 'cosmic-r-siege-cannon':a('cosmic-r-siege-cannon','Siege Cannon','projectile',phases(.34,.04,.54,.12,.36,.44),{shape:'sphere',radius:.34},{projectileSpeed:7.0,heavy:true,recoil:.8}),
 'cosmic-q-plasma-orbit':a('cosmic-q-plasma-orbit','Orbiting Plasma Barrage','projectile',phases(.18,.10,.44,.24,.32,.28),{shape:'sphere',radius:.18},{projectileSpeed:7.4,orbit:true,multiHit:3}),
 'cosmic-k-gravity-wave':a('cosmic-k-gravity-wave','Gravity Wave','area',phases(.30,.06,.68,.18,.42,.42),{shape:'ring',radius:.78},{gravity:true,heavy:true})
};

export function getAttack(id){return ATTACKS[id]||ATTACKS['classic-p-shield-thrust'];}
export function allAttacks(){return Object.values(ATTACKS);}
