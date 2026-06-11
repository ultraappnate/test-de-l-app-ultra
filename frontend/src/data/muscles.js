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
