/* ════════════════════════════════════════════════════════════
   BASE DE DONNÉES MUSCULAIRE
   - Liste des groupes musculaires (id, nom FR, vue front/back)
   - Mapping exercice → muscles primaires / secondaires
   - Pattern de mouvement pour l'animation
   ════════════════════════════════════════════════════════════ */

/* Tous les groupes musculaires adressables dans le SVG */
export const MUSCLES = {
  // ── Face avant ──
  chest:       { label: 'Pectoraux',          view: 'front' },
  front_delts: { label: 'Deltoïdes ant.',     view: 'front' },
  biceps:      { label: 'Biceps',             view: 'front' },
  forearms:    { label: 'Avant-bras',         view: 'both'  },
  abs:         { label: 'Abdominaux',         view: 'front' },
  obliques:    { label: 'Obliques',           view: 'front' },
  quads:       { label: 'Quadriceps',         view: 'front' },
  adductors:   { label: 'Adducteurs',         view: 'front' },
  neck:        { label: 'Cou',                view: 'both'  },
  // ── Face arrière ──
  traps:       { label: 'Trapèzes',           view: 'back'  },
  lats:        { label: 'Grand dorsal',       view: 'back'  },
  rear_delts:  { label: 'Deltoïdes post.',    view: 'back'  },
  triceps:     { label: 'Triceps',            view: 'back'  },
  lower_back:  { label: 'Lombaires',          view: 'back'  },
  glutes:      { label: 'Fessiers',           view: 'back'  },
  hamstrings:  { label: 'Ischio-jambiers',    view: 'back'  },
  calves:      { label: 'Mollets',            view: 'back'  },
}

/* Couleurs de surbrillance */
export const MUSCLE_COLORS = {
  primary:   '#e23b4e', // rouge vif — muscle principal
  secondary: '#f5a623', // orange — muscle secondaire
  idle:      'rgba(255,255,255,0.06)',
}

/* ════════════════════════════════════════════════════════════
   FICHES ANATOMIQUES — niveau universitaire (PCEM / STAPS / kiné)
   ════════════════════════════════════════════════════════════ */
export const ANATOMY = {
  chest: {
    latin: 'M. pectoralis major',
    region: 'Thorax antérieur',
    origin: 'Clavicule (1/2 médiale), sternum, cartilages costaux 2-6',
    insertion: 'Crête du tubercule majeur de l\'humérus',
    function: 'Adduction, rotation interne et antépulsion du bras',
    innervation: 'Nerfs pectoraux médial et latéral (C5-T1)',
  },
  front_delts: {
    latin: 'M. deltoideus (faisceau antérieur)',
    region: 'Épaule',
    origin: 'Tiers latéral de la clavicule',
    insertion: 'Tubérosité deltoïdienne de l\'humérus',
    function: 'Flexion et rotation interne de l\'épaule',
    innervation: 'Nerf axillaire (C5-C6)',
  },
  rear_delts: {
    latin: 'M. deltoideus (faisceau postérieur)',
    region: 'Épaule',
    origin: 'Épine de la scapula',
    insertion: 'Tubérosité deltoïdienne de l\'humérus',
    function: 'Extension et rotation externe de l\'épaule',
    innervation: 'Nerf axillaire (C5-C6)',
  },
  biceps: {
    latin: 'M. biceps brachii',
    region: 'Bras (loge antérieure)',
    origin: 'Tubercule supra-glénoïdal (longue portion), processus coracoïde (courte portion)',
    insertion: 'Tubérosité radiale',
    function: 'Flexion du coude, supination de l\'avant-bras',
    innervation: 'Nerf musculo-cutané (C5-C6)',
  },
  triceps: {
    latin: 'M. triceps brachii',
    region: 'Bras (loge postérieure)',
    origin: 'Tubercule infra-glénoïdal + face postérieure de l\'humérus',
    insertion: 'Olécrane (ulna)',
    function: 'Extension du coude',
    innervation: 'Nerf radial (C6-C8)',
  },
  forearms: {
    latin: 'Mm. de l\'avant-bras',
    region: 'Avant-bras',
    origin: 'Épicondyles médial et latéral de l\'humérus',
    insertion: 'Métacarpiens et phalanges',
    function: 'Flexion / extension du poignet et des doigts, préhension',
    innervation: 'Nerfs médian, ulnaire et radial',
  },
  abs: {
    latin: 'M. rectus abdominis',
    region: 'Paroi abdominale antérieure',
    origin: 'Crête pubienne et symphyse pubienne',
    insertion: 'Cartilages costaux 5-7 et processus xiphoïde',
    function: 'Flexion du tronc, expiration forcée, gainage',
    innervation: 'Nerfs intercostaux (T7-T12)',
  },
  obliques: {
    latin: 'Mm. obliquus externus / internus',
    region: 'Paroi abdominale latérale',
    origin: 'Côtes 5-12 / fascia thoraco-lombaire',
    insertion: 'Ligne blanche, crête iliaque, pubis',
    function: 'Rotation et inclinaison latérale du tronc',
    innervation: 'Nerfs intercostaux et ilio-hypogastrique (T8-L1)',
  },
  traps: {
    latin: 'M. trapezius',
    region: 'Dos (nuque et haut du dos)',
    origin: 'Os occipital, ligament nucal, processus épineux C7-T12',
    insertion: 'Clavicule, acromion, épine de la scapula',
    function: 'Élévation, rétraction et sonnette latérale de la scapula',
    innervation: 'Nerf accessoire (XI) + plexus cervical',
  },
  lats: {
    latin: 'M. latissimus dorsi',
    region: 'Dos (région lombaire et thoracique)',
    origin: 'Processus épineux T7-L5, crête iliaque, côtes 9-12',
    insertion: 'Sillon intertuberculaire de l\'humérus',
    function: 'Adduction, extension et rotation interne du bras',
    innervation: 'Nerf thoraco-dorsal (C6-C8)',
  },
  lower_back: {
    latin: 'M. erector spinae',
    region: 'Région lombaire',
    origin: 'Sacrum, crête iliaque, processus épineux lombaires',
    insertion: 'Côtes, processus transverses et épineux étagés',
    function: 'Extension et stabilisation du rachis',
    innervation: 'Rameaux dorsaux des nerfs spinaux',
  },
  glutes: {
    latin: 'M. gluteus maximus',
    region: 'Région fessière',
    origin: 'Aile iliaque postérieure, sacrum, coccyx',
    insertion: 'Tractus ilio-tibial et tubérosité glutéale du fémur',
    function: 'Extension et rotation externe de la hanche',
    innervation: 'Nerf glutéal inférieur (L5-S2)',
  },
  quads: {
    latin: 'M. quadriceps femoris',
    region: 'Cuisse (loge antérieure)',
    origin: 'Épine iliaque antéro-inf. (droit fémoral) + fémur (vastes)',
    insertion: 'Patella puis tubérosité tibiale (tendon rotulien)',
    function: 'Extension du genou, flexion de hanche (droit fémoral)',
    innervation: 'Nerf fémoral (L2-L4)',
  },
  hamstrings: {
    latin: 'Mm. ischio-jambiers',
    region: 'Cuisse (loge postérieure)',
    origin: 'Tubérosité ischiatique',
    insertion: 'Tibia et fibula (sous le genou)',
    function: 'Flexion du genou, extension de la hanche',
    innervation: 'Nerf sciatique (L5-S2)',
  },
  adductors: {
    latin: 'Mm. adducteurs',
    region: 'Cuisse (loge médiale)',
    origin: 'Branches ischio-pubiennes',
    insertion: 'Ligne âpre du fémur',
    function: 'Adduction de la hanche',
    innervation: 'Nerf obturateur (L2-L4)',
  },
  calves: {
    latin: 'M. triceps surae (gastrocnémien + soléaire)',
    region: 'Jambe (loge postérieure)',
    origin: 'Condyles fémoraux + tibia/fibula',
    insertion: 'Calcanéus via le tendon calcanéen (d\'Achille)',
    function: 'Flexion plantaire de la cheville, propulsion',
    innervation: 'Nerf tibial (S1-S2)',
  },
  neck: {
    latin: 'M. sternocleidomastoideus',
    region: 'Cou',
    origin: 'Manubrium sternal et clavicule',
    insertion: 'Processus mastoïde de l\'os temporal',
    function: 'Flexion et rotation controlatérale de la tête',
    innervation: 'Nerf accessoire (XI)',
  },
}

/*
  Mapping exercice → muscles.
  Les clés sont normalisées (minuscule, sans accent). On matche par inclusion.
  pattern : utilisé pour l'animation du mouvement.
*/
export const EXERCISE_DB = [
  // ── PECTORAUX / PUSH ──
  { match: ['developpe couche', 'bench', 'developpe', 'pompe', 'push up', 'pushup', 'dips'],
    primary: ['chest'], secondary: ['front_delts', 'triceps'], pattern: 'push' },
  { match: ['ecarte', 'pec deck', 'butterfly', 'fly'],
    primary: ['chest'], secondary: ['front_delts'], pattern: 'fly' },

  // ── DOS / PULL ──
  { match: ['traction', 'pull up', 'pullup', 'tirage', 'pull down', 'lat pull'],
    primary: ['lats'], secondary: ['biceps', 'rear_delts'], pattern: 'pull_down' },
  { match: ['rowing', 'row', 'tirage horizontal'],
    primary: ['lats', 'traps'], secondary: ['biceps', 'rear_delts'], pattern: 'row' },
  { match: ['souleve de terre', 'deadlift', 'souleve'],
    primary: ['lower_back', 'glutes', 'hamstrings'], secondary: ['traps', 'quads'], pattern: 'hinge' },
  { match: ['shrug', 'haussement'],
    primary: ['traps'], secondary: [], pattern: 'shrug' },

  // ── ÉPAULES ──
  { match: ['developpe militaire', 'overhead', 'military', 'developpe epaule', 'shoulder press'],
    primary: ['front_delts'], secondary: ['triceps', 'traps'], pattern: 'overhead' },
  { match: ['elevation laterale', 'lateral raise', 'elevation'],
    primary: ['front_delts'], secondary: ['traps'], pattern: 'lateral' },
  { match: ['oiseau', 'rear delt', 'face pull'],
    primary: ['rear_delts'], secondary: ['traps'], pattern: 'lateral' },

  // ── BRAS ──
  { match: ['curl biceps', 'curl', 'biceps'],
    primary: ['biceps'], secondary: ['forearms'], pattern: 'curl' },
  { match: ['extension triceps', 'triceps', 'barre au front', 'skull', 'pushdown'],
    primary: ['triceps'], secondary: [], pattern: 'pushdown' },

  // ── JAMBES ──
  { match: ['squat', 'flexion'],
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors', 'lower_back'], pattern: 'squat' },
  { match: ['fente', 'lunge', 'split squat'],
    primary: ['quads', 'glutes'], secondary: ['hamstrings'], pattern: 'lunge' },
  { match: ['presse', 'leg press'],
    primary: ['quads', 'glutes'], secondary: ['hamstrings'], pattern: 'squat' },
  { match: ['leg curl', 'ischio', 'hamstring curl'],
    primary: ['hamstrings'], secondary: ['calves'], pattern: 'leg_curl' },
  { match: ['leg extension', 'extension jambe'],
    primary: ['quads'], secondary: [], pattern: 'leg_ext' },
  { match: ['mollet', 'calf', 'calves'],
    primary: ['calves'], secondary: [], pattern: 'calf' },
  { match: ['hip thrust', 'pont', 'fessier'],
    primary: ['glutes'], secondary: ['hamstrings'], pattern: 'hinge' },

  // ── ABDOS / GAINAGE ──
  { match: ['crunch', 'abdo', 'sit up', 'situp', 'releve de jambe', 'leg raise'],
    primary: ['abs'], secondary: ['obliques'], pattern: 'crunch' },
  { match: ['gainage', 'plank', 'planche'],
    primary: ['abs'], secondary: ['obliques', 'lower_back'], pattern: 'plank' },
  { match: ['russian twist', 'oblique', 'rotation'],
    primary: ['obliques'], secondary: ['abs'], pattern: 'twist' },
]

/* Normalise une chaîne : minuscule + suppression accents */
function normalize(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/* Retourne { primary:[], secondary:[], pattern } pour un nom d'exercice */
export function getMusclesForExercise(name) {
  const n = normalize(name)
  for (const entry of EXERCISE_DB) {
    if (entry.match.some(m => n.includes(normalize(m)))) {
      return { primary: entry.primary, secondary: entry.secondary, pattern: entry.pattern }
    }
  }
  return { primary: [], secondary: [], pattern: 'idle', unknown: true }
}

/* Liste d'exercices populaires pour l'explorateur */
export const POPULAR_EXERCISES = [
  { name: 'Squat',                 emoji: '🦵' },
  { name: 'Développé couché',      emoji: '💪' },
  { name: 'Soulevé de terre',      emoji: '🏋️' },
  { name: 'Traction',              emoji: '🧗' },
  { name: 'Développé militaire',   emoji: '🤸' },
  { name: 'Curl biceps',           emoji: '💪' },
  { name: 'Extension triceps',     emoji: '🔱' },
  { name: 'Fente',                 emoji: '🚶' },
  { name: 'Rowing',                emoji: '🚣' },
  { name: 'Élévation latérale',    emoji: '🦅' },
  { name: 'Crunch',                emoji: '🔥' },
  { name: 'Mollet debout',         emoji: '🦿' },
  { name: 'Hip thrust',            emoji: '🍑' },
  { name: 'Leg curl',              emoji: '🦵' },
  { name: 'Gainage',               emoji: '🧘' },
]
