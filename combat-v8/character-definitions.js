export const ROLE_ORDER=['p','n','b','r','q','k'];

export const RIG_TYPES={
  AGILE:'agile-biped',
  STANDARD:'standard-biped',
  HEAVY:'heavy-biped',
  CASTER:'caster-biped',
  CREATURE:'creature',
  MECH:'mech'
};

const c=(name,rig,attack,mass,locomotion,silhouette,weapon,defeat,extra={})=>({
  name,rig,attack,mass,locomotion,silhouette,weapon,defeat,...extra
});

export const CHARACTER_SETS={
 classic:{
  label:'Classic',
  p:c('Shield Footman',RIG_TYPES.STANDARD,'classic-p-shield-thrust',0.90,'disciplined','shield-spear','spear','armored-collapse',{stance:'guarded'}),
  n:c('Armored Cavalier',RIG_TYPES.AGILE,'classic-n-cavalier-charge',1.18,'charging','crested-cavalier','lance','kneeling-fall',{stance:'forward'}),
  b:c('War Cleric',RIG_TYPES.CASTER,'classic-b-cleric-sweep',1.02,'measured','mitre-robes','war-staff','staff-collapse',{stance:'ritual'}),
  r:c('Tower Guardian',RIG_TYPES.HEAVY,'classic-r-hammer-bash',2.25,'planted','tower-shield','war-hammer','heavy-topple',{stance:'fortress'}),
  q:c('Royal Duelist',RIG_TYPES.AGILE,'classic-q-feint-riposte',1.22,'fencing','royal-duelist','rapier','dramatic-fall',{stance:'fencer'}),
  k:c('Greatsword Monarch',RIG_TYPES.HEAVY,'classic-k-royal-cleave',1.62,'deliberate','crowned-heavy','greatsword','royal-kneel',{stance:'command'})
 },
 arcane:{
  label:'Arcane',
  p:c('Rune Acolyte',RIG_TYPES.CASTER,'arcane-p-rune-dart',0.78,'floating-step','hooded-rune','rune-focus','rune-dissolve',{stance:'channel'}),
  n:c('Blink Assassin',RIG_TYPES.AGILE,'arcane-n-blink-strike',0.94,'stalking','masked-blades','twin-blade','blink-collapse',{stance:'low'}),
  b:c('Spellweaver',RIG_TYPES.CASTER,'arcane-b-spell-beam',0.92,'gliding','tall-staff','focus-staff','ward-shatter',{stance:'channel'}),
  r:c('Stone Golem',RIG_TYPES.HEAVY,'arcane-r-golem-slam',2.80,'ponderous','stone-golem','stone-fists','stone-break',{stance:'massive'}),
  q:c('Void Sorceress',RIG_TYPES.CASTER,'arcane-q-void-vortex',1.10,'floating','void-crown','orb-focus','void-collapse',{stance:'levitating'}),
  k:c('Archmage',RIG_TYPES.CASTER,'arcane-k-archmage-shockwave',1.34,'commanding','archmage-staff','archstaff','arcane-kneel',{stance:'ritual'})
 },
 monsters:{
  label:'Monsters',
  p:c('Goblin Raider',RIG_TYPES.CREATURE,'monsters-p-goblin-rush',0.72,'skittering','goblin','claws','ragdoll-tumble',{stance:'hunched'}),
  n:c('Dire Beast',RIG_TYPES.CREATURE,'monsters-n-dire-pounce',1.24,'quadruped','dire-beast','fangs','beast-roll',{stance:'predator',legs:4}),
  b:c('Bog Shaman',RIG_TYPES.CASTER,'monsters-b-shaman-curse',0.90,'shambling','shaman-antlers','totem-staff','curse-collapse',{stance:'ritual'}),
  r:c('Ogre Brute',RIG_TYPES.HEAVY,'monsters-r-ogre-body-slam',2.65,'lumbering','ogre','fists','heavy-sprawl',{stance:'brawler'}),
  q:c('Winged Demon',RIG_TYPES.CREATURE,'monsters-q-demon-rake',1.18,'aerial','winged-demon','talons','wing-crash',{stance:'predator',wings:true}),
  k:c('Horned Tyrant',RIG_TYPES.HEAVY,'monsters-k-tyrant-gore',2.05,'stomping','horned-tyrant','horns','tyrant-fall',{stance:'dominant'})
 },
 brick:{
  label:'Brick Battle',
  p:c('Block Trooper',RIG_TYPES.STANDARD,'brick-p-block-jab',0.86,'toy-step','block-trooper','block-spear','brick-burst',{stance:'square'}),
  n:c('Spring Rider',RIG_TYPES.AGILE,'brick-n-spring-vault',1.00,'springy','spring-rider','spring-lance','brick-burst',{stance:'coiled'}),
  b:c('Gear Caster',RIG_TYPES.CASTER,'brick-b-gear-bolt',0.96,'clockwork','gear-caster','gear-wand','brick-burst',{stance:'mechanical'}),
  r:c('Block Golem',RIG_TYPES.MECH,'brick-r-block-topple',2.55,'stomping','block-golem','block-fists','brick-collapse',{stance:'massive'}),
  q:c('Spinner Champion',RIG_TYPES.AGILE,'brick-q-spinner-combo',1.12,'spinning','spinner-champion','dual-block-blades','brick-burst',{stance:'dynamic'}),
  k:c('Builder King',RIG_TYPES.HEAVY,'brick-k-builder-hammer',1.72,'deliberate','builder-king','builder-hammer','brick-collapse',{stance:'command'})
 },
 cosmic:{
  label:'Cosmic War',
  p:c('Pulse Trooper',RIG_TYPES.STANDARD,'cosmic-p-pulse-shot',0.88,'tactical','pulse-trooper','pulse-rifle','systems-fail',{stance:'ready'}),
  n:c('Jump-Jet Lancer',RIG_TYPES.AGILE,'cosmic-n-jet-lance',1.06,'jet-assisted','jet-lancer','energy-lance','jet-crash',{stance:'forward',jets:true}),
  b:c('Psionic Seer',RIG_TYPES.CASTER,'cosmic-b-psionic-lance',0.94,'hovering','psionic-seer','psi-focus','energy-collapse',{stance:'focus'}),
  r:c('Siege Mech',RIG_TYPES.MECH,'cosmic-r-siege-cannon',3.10,'tracked-heavy','siege-mech','siege-cannon','mech-collapse',{stance:'weapons-platform'}),
  q:c('Plasma Commander',RIG_TYPES.AGILE,'cosmic-q-plasma-orbit',1.26,'zero-g-fluid','plasma-commander','orbiting-plasma','energy-collapse',{stance:'command'}),
  k:c('Star Sovereign',RIG_TYPES.MECH,'cosmic-k-gravity-wave',1.90,'regal-hover','star-sovereign','gravity-core','core-shutdown',{stance:'regal'})
 }
};

export function getCharacterDefinition(theme,role){
 const set=CHARACTER_SETS[theme]||CHARACTER_SETS.classic;
 const def=set[role]||set.p;
 return {...def,theme:CHARACTER_SETS[theme]?theme:'classic',role,setLabel:set.label,id:`${CHARACTER_SETS[theme]?theme:'classic'}-${role}`};
}

export function allCharacterDefinitions(){
 const out=[];
 for(const theme of Object.keys(CHARACTER_SETS))for(const role of ROLE_ORDER)out.push(getCharacterDefinition(theme,role));
 return out;
}
