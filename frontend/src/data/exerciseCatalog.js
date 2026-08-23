// Catalogue d'exercices pour l'autocomplete du builder.
// Chaque entrée : nom affiché, groupe musculaire, valeurs par défaut (séries / reps / repos / RPE).
// Les défauts suivent la logique : polyarticulaire lourd 4×6-8 repos long, isolation 3×10-15 repos court.

const EX = (name, cat, sets, reps, rest, rpe = '') => ({ name, cat, sets, reps, rest, rpe })

export const EXERCISE_CATALOG = [
  // ── Pectoraux ──
  EX('Développé couché barre', 'Pectoraux', '4', '6-8', '150s', '8'),
  EX('Développé couché haltères', 'Pectoraux', '4', '8-10', '120s', '8'),
  EX('Développé incliné barre', 'Pectoraux', '4', '6-8', '150s', '8'),
  EX('Développé incliné haltères', 'Pectoraux', '3', '8-12', '90s', '8'),
  EX('Développé décliné', 'Pectoraux', '3', '8-10', '120s', '8'),
  EX('Écarté couché haltères', 'Pectoraux', '3', '12-15', '60s', '7'),
  EX('Écarté incliné haltères', 'Pectoraux', '3', '12-15', '60s', '7'),
  EX('Pec deck (butterfly)', 'Pectoraux', '3', '12-15', '60s', '8'),
  EX('Écarté à la poulie (câble crossover)', 'Pectoraux', '3', '12-15', '60s', '8'),
  EX('Pompes', 'Pectoraux', '3', 'max', '90s', '9'),
  EX('Pompes lestées', 'Pectoraux', '4', '10-15', '90s', '8'),
  EX('Dips (pectoraux)', 'Pectoraux', '3', '8-12', '90s', '8'),

  // ── Dos ──
  EX('Tractions pronation', 'Dos', '4', '6-10', '120s', '9'),
  EX('Tractions supination', 'Dos', '4', '6-10', '120s', '9'),
  EX('Tractions lestées', 'Dos', '4', '5-8', '150s', '9'),
  EX('Tirage vertical poulie', 'Dos', '4', '8-12', '90s', '8'),
  EX('Tirage horizontal poulie', 'Dos', '3', '10-12', '90s', '8'),
  EX('Rowing barre', 'Dos', '4', '6-10', '120s', '8'),
  EX('Rowing haltère unilatéral', 'Dos', '3', '8-12', '90s', '8'),
  EX('Rowing T-bar', 'Dos', '4', '8-10', '120s', '8'),
  EX('Soulevé de terre', 'Dos', '4', '4-6', '180s', '9'),
  EX('Soulevé de terre roumain', 'Dos', '4', '8-10', '120s', '8'),
  EX('Pull-over poulie haute', 'Dos', '3', '12-15', '60s', '7'),
  EX('Shrugs haltères', 'Dos', '3', '12-15', '60s', '8'),
  EX('Hyperextensions (banc à lombaires)', 'Dos', '3', '12-15', '60s', '7'),

  // ── Épaules ──
  EX('Développé militaire barre', 'Épaules', '4', '6-8', '150s', '8'),
  EX('Développé épaules haltères', 'Épaules', '4', '8-10', '120s', '8'),
  EX('Développé Arnold', 'Épaules', '3', '10-12', '90s', '8'),
  EX('Élévations latérales haltères', 'Épaules', '4', '12-15', '60s', '8'),
  EX('Élévations latérales poulie', 'Épaules', '3', '12-15', '60s', '8'),
  EX('Élévations frontales', 'Épaules', '3', '12-15', '60s', '7'),
  EX('Oiseau (élévations buste penché)', 'Épaules', '3', '12-15', '60s', '7'),
  EX('Face pull', 'Épaules', '3', '15-20', '60s', '7'),
  EX('Rowing menton', 'Épaules', '3', '10-12', '90s', '8'),

  // ── Biceps ──
  EX('Curl barre EZ', 'Biceps', '3', '8-12', '90s', '8'),
  EX('Curl haltères alterné', 'Biceps', '3', '10-12', '60s', '8'),
  EX('Curl marteau', 'Biceps', '3', '10-12', '60s', '8'),
  EX('Curl incliné haltères', 'Biceps', '3', '10-12', '60s', '8'),
  EX('Curl pupitre (Larry Scott)', 'Biceps', '3', '10-12', '60s', '8'),
  EX('Curl à la poulie', 'Biceps', '3', '12-15', '60s', '8'),

  // ── Triceps ──
  EX('Dips (triceps)', 'Triceps', '3', '8-12', '90s', '8'),
  EX('Développé couché prise serrée', 'Triceps', '4', '8-10', '120s', '8'),
  EX('Extension triceps poulie (pushdown)', 'Triceps', '3', '12-15', '60s', '8'),
  EX('Extension triceps corde', 'Triceps', '3', '12-15', '60s', '8'),
  EX('Barre au front', 'Triceps', '3', '10-12', '90s', '8'),
  EX('Extension nuque haltère', 'Triceps', '3', '10-12', '60s', '7'),
  EX('Kickback triceps', 'Triceps', '3', '12-15', '45s', '7'),

  // ── Quadriceps ──
  EX('Squat barre', 'Jambes', '4', '5-8', '180s', '9'),
  EX('Squat gobelet', 'Jambes', '3', '10-12', '90s', '8'),
  EX('Front squat', 'Jambes', '4', '6-8', '150s', '8'),
  EX('Presse à cuisses', 'Jambes', '4', '10-12', '120s', '8'),
  EX('Fentes marchées', 'Jambes', '3', '10-12 /jambe', '90s', '8'),
  EX('Fentes bulgares', 'Jambes', '3', '8-12 /jambe', '90s', '8'),
  EX('Leg extension', 'Jambes', '3', '12-15', '60s', '8'),
  EX('Hack squat', 'Jambes', '4', '8-12', '120s', '8'),

  // ── Ischios / Fessiers ──
  EX('Hip thrust barre', 'Fessiers', '4', '8-12', '120s', '8'),
  EX('Leg curl allongé', 'Ischios', '3', '10-15', '60s', '8'),
  EX('Leg curl assis', 'Ischios', '3', '10-15', '60s', '8'),
  EX('Good morning', 'Ischios', '3', '10-12', '90s', '7'),
  EX('Soulevé de terre jambes tendues', 'Ischios', '4', '8-10', '120s', '8'),
  EX('Pont fessier', 'Fessiers', '3', '15-20', '60s', '7'),
  EX('Abduction hanche poulie/machine', 'Fessiers', '3', '15-20', '45s', '7'),

  // ── Mollets ──
  EX('Mollets debout', 'Mollets', '4', '12-15', '60s', '8'),
  EX('Mollets assis', 'Mollets', '4', '15-20', '45s', '8'),
  EX('Mollets à la presse', 'Mollets', '4', '12-15', '60s', '8'),

  // ── Abdos / Core ──
  EX('Crunch', 'Abdos', '3', '15-20', '45s', '8'),
  EX('Crunch à la poulie', 'Abdos', '3', '12-15', '60s', '8'),
  EX('Relevé de jambes suspendu', 'Abdos', '3', '10-15', '60s', '8'),
  EX('Gainage planche', 'Abdos', '3', '45-60s', '45s', ''),
  EX('Gainage latéral', 'Abdos', '3', '30-45s /côté', '45s', ''),
  EX('Roulette abdos (ab wheel)', 'Abdos', '3', '8-12', '60s', '8'),
  EX('Russian twist', 'Abdos', '3', '20 /côté', '45s', '7'),
  EX('Mountain climbers', 'Abdos', '3', '30s', '30s', ''),
  EX('Dead bug', 'Abdos', '3', '10 /côté', '45s', ''),

  // ── Cardio / Full body ──
  EX('Burpees', 'Cardio', '4', '12-15', '60s', '9'),
  EX('Kettlebell swing', 'Full body', '4', '15-20', '60s', '8'),
  EX('Thruster', 'Full body', '4', '10-12', '90s', '8'),
  EX('Clean & press', 'Full body', '4', '6-8', '120s', '8'),
  EX('Rameur', 'Cardio', '1', '10-20 min', '—', ''),
  EX('Assault bike', 'Cardio', '1', '10-15 min', '—', ''),
  EX('Corde à sauter', 'Cardio', '4', '60s', '30s', ''),
  EX('Sprint sur tapis', 'Cardio', '6', '30s', '90s', '9'),
  EX('Marche inclinée tapis', 'Cardio', '1', '20-30 min', '—', ''),
  EX('Farmer walk', 'Full body', '3', '30-40m', '90s', '8'),
  EX('Box jump', 'Jambes', '4', '8-10', '90s', '8'),
  EX('Wall ball', 'Full body', '4', '15-20', '60s', '8'),
]

// Recherche insensible aux accents/majuscules
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Catalogue complet : les vidéos de Nate d'abord (elles ont un `url`), puis le générique
// (en retirant les doublons exacts du générique).
import { NATE_EXERCISES } from './nateExercises'
const nateNames = new Set(NATE_EXERCISES.map(e => norm(e.name)))
export const FULL_CATALOG = [
  ...NATE_EXERCISES,
  ...EXERCISE_CATALOG.filter(e => !nateNames.has(norm(e.name))),
]

// Bibliothèque admin (serveur) : injectée par le builder au chargement, prioritaire sur le statique
let LIBRARY = []
const CAT_DEFAULTS = {
  Force:       { sets: '3', reps: '8-12',  rest: '90s', rpe: '8' },
  Cardio:      { sets: '4', reps: '30-45s', rest: '45s', rpe: '8' },
  Core:        { sets: '3', reps: '12-15', rest: '45s', rpe: '8' },
  Mobilité:    { sets: '2', reps: '45s',   rest: '30s', rpe: '' },
  Fonctionnel: { sets: '3', reps: '10-12', rest: '60s', rpe: '8' },
}
export function setLibraryExercises(list) {
  LIBRARY = (Array.isArray(list) ? list : []).filter(e => e?.name).map(e => ({
    name: e.name, cat: (e.muscles && e.muscles[0]) || e.category || 'Force',
    ...(CAT_DEFAULTS[e.category] || CAT_DEFAULTS.Force),
    url: e.videoId ? `https://youtu.be/${e.videoId}` : '',
    fromLibrary: true,
  }))
}

export function searchExercises(query, limit = 7) {
  const q = norm(query).trim()
  if (q.length < 2) return []
  const starts = [], contains = []
  const libNames = new Set(LIBRARY.map(e => norm(e.name)))
  const source = [...LIBRARY, ...FULL_CATALOG.filter(e => !libNames.has(norm(e.name)))]
  for (const ex of source) {
    const n = norm(ex.name)
    if (n.startsWith(q)) starts.push(ex)
    else if (n.includes(q) || norm(ex.cat).includes(q)) contains.push(ex)
  }
  // Priorité : commence par la saisie, puis avec vidéo avant sans vidéo
  const rank = (a, b) => (b.url ? 1 : 0) - (a.url ? 1 : 0)
  return [...starts.sort(rank), ...contains.sort(rank)].slice(0, limit)
}
