import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import webpush from 'web-push'
import cron from 'node-cron'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const app = express()
const PORT = 5001
const JWT_SECRET = 'ultra-secret-key-change-in-prod'

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://test-de-l-app-ultra.vercel.app'

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    /\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}))

// Raw body requis pour la vérification de signature Stripe webhook
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// In-memory DB (remplace par Firestore/Postgres en prod)
const db = {
  users: [],
  nutritionLogs:  {},  // { clientId: { 'YYYY-MM-DD': { meals:[], updatedAt } } }
  nutritionGoals: {},  // { clientId: { calories, protein, carbs, fat, setBy, updatedAt } }
  programs: [
    // ── Force (4)
    { id: 'prog-f1', source: 'admin', title: 'Force Absolue', description: 'Développe une force brute en 12 semaines. Squat, deadlift, bench — les 3 piliers de la puissance.', price: 49, duration: '12 semaines', category: 'Force', level: 'Intermédiaire', sessions: '4x/semaine', nutrition: false, enrollmentCount: 124, gradient: 'linear-gradient(135deg, #1a0a0d 0%, #7d2d38 60%, #a03848 100%)' },
    { id: 'prog-f2', title: 'Powerlifting 8 Semaines', description: 'Préparation compétition powerlifting. Peak de force sur squat, bench et deadlift avec périodisation conjuguée.', price: 69, duration: '8 semaines', category: 'Force', level: 'Avancé', sessions: '4x/semaine', nutrition: false, enrollmentCount: 58, gradient: 'linear-gradient(135deg, #0d0505 0%, #5c1a24 50%, #8b2635 100%)' },
    { id: 'prog-f3', title: 'Force Débutant', description: 'Programme Starting Strength adapté. Progressions linéaires sur les mouvements fondamentaux — idéal pour construire des bases solides.', price: 0, duration: '6 semaines', category: 'Force', level: 'Débutant', sessions: '3x/semaine', nutrition: false, enrollmentCount: 312, gradient: 'linear-gradient(135deg, #1a0f10 0%, #6b3040 60%, #9b4a5a 100%)' },
    { id: 'prog-f4', title: 'Upper/Lower Split', description: 'Programme 4 jours haut/bas du corps. Hypertrophie et force combinées pour un physique fonctionnel et esthétique.', price: 39, duration: '10 semaines', category: 'Force', level: 'Intermédiaire', sessions: '4x/semaine', nutrition: false, enrollmentCount: 89, gradient: 'linear-gradient(135deg, #150810 0%, #8b1a2e 50%, #c42840 100%)' },
    // ── Nutrition (4)
    { id: 'prog-n1', title: 'Nutrition Haute Performance', description: 'Plan alimentaire construit autour de ta pratique sportive. Macros optimisés, timing des repas, supplémentation.', price: 39, duration: '8 semaines', category: 'Nutrition', level: 'Tous niveaux', sessions: null, nutrition: true, enrollmentCount: 87, gradient: 'linear-gradient(135deg, #0d1f0f 0%, #1e6b2e 60%, #27ae60 100%)' },
    { id: 'prog-n2', title: 'Rééquilibrage Alimentaire', description: 'Apprends à manger sans frustration. Pas de régime drastique — une alimentation adaptée à ta vie et tes objectifs.', price: 29, duration: '6 semaines', category: 'Nutrition', level: 'Débutant', sessions: null, nutrition: true, enrollmentCount: 156, gradient: 'linear-gradient(135deg, #0a1a0c 0%, #1a5c25 50%, #2e8b42 100%)' },
    { id: 'prog-n3', title: 'Masse Musculaire — Nutrition', description: 'Protocole alimentaire pour la prise de masse. Surplus calorique contrôlé, répartition des macros, recettes hautes protéines.', price: 49, duration: '12 semaines', category: 'Nutrition', level: 'Intermédiaire', sessions: null, nutrition: true, enrollmentCount: 64, gradient: 'linear-gradient(135deg, #0f1f0a 0%, #3d7a1e 50%, #5aad2c 100%)' },
    { id: 'prog-n4', title: 'Sécher Proprement', description: 'Plan nutrition sèche intelligente. Maintien de la masse musculaire tout en réduisant les graisses — déficit contrôlé semaine par semaine.', price: 44, duration: '8 semaines', category: 'Nutrition', level: 'Intermédiaire', sessions: null, nutrition: true, enrollmentCount: 103, gradient: 'linear-gradient(135deg, #051a08 0%, #145c20 50%, #1e8b30 100%)' },
    // ── Combiné (4)
    { id: 'prog-c1', title: 'Perte de Poids Intensive', description: 'Cardio HIIT + nutrition déficitaire intelligente. Brûle les graisses sans perdre le muscle. Résultats dès la 3e semaine.', price: 79, duration: '8 semaines', category: 'Combiné', level: 'Tous niveaux', sessions: '5x/semaine', nutrition: true, enrollmentCount: 211, gradient: 'linear-gradient(135deg, #0a0d1f 0%, #2d3e7d 60%, #3a52a8 100%)' },
    { id: 'prog-c2', title: 'Prise de Masse Clean', description: 'Protocole de prise de masse avec suivi nutritionnel intégré. Gain musculaire sans excès de gras.', price: 89, duration: '16 semaines', category: 'Combiné', level: 'Intermédiaire', sessions: '5x/semaine', nutrition: true, enrollmentCount: 76, gradient: 'linear-gradient(135deg, #1a0f00 0%, #8b4a00 60%, #c96a00 100%)' },
    { id: 'prog-c3', title: 'Athlete Elite', description: 'Le programme ultime pour athlètes confirmés. Périodisation avancée, nutrition de compétition, gestion de la fatigue.', price: 129, duration: '24 semaines', category: 'Combiné', level: 'Avancé', sessions: '6x/semaine', nutrition: true, enrollmentCount: 38, gradient: 'linear-gradient(135deg, #1f0a0a 0%, #8b0000 40%, #a03848 70%, #d4af37 100%)' },
    { id: 'prog-c4', title: 'Transformation 90 Jours', description: 'Le programme tout-en-un pour changer de physique en 3 mois. Entraînement, nutrition et suivi hebdomadaire intégrés.', price: 99, duration: '12 semaines', category: 'Combiné', level: 'Tous niveaux', sessions: '5x/semaine', nutrition: true, enrollmentCount: 145, gradient: 'linear-gradient(135deg, #05051f 0%, #1e1e8b 50%, #2e2ec9 100%)' },
    // ── Cardio (4)
    { id: 'prog-ca1', title: 'Endurance Running', description: 'Prépare ton premier 10km, semi ou marathon. Plan progressif avec séances courtes et longues alternées.', price: 0, duration: '10 semaines', category: 'Cardio', level: 'Débutant', sessions: '3x/semaine', nutrition: false, enrollmentCount: 342, gradient: 'linear-gradient(135deg, #001a1a 0%, #006b6b 60%, #00a8a8 100%)' },
    { id: 'prog-ca2', title: 'HIIT Brûle-Graisses', description: 'Séances courtes et intenses pour maximiser la dépense calorique. 20 min suffisent — zéro équipement requis.', price: 19, duration: '6 semaines', category: 'Cardio', level: 'Tous niveaux', sessions: '4x/semaine', nutrition: false, enrollmentCount: 278, gradient: 'linear-gradient(135deg, #001515 0%, #005252 50%, #007a7a 100%)' },
    { id: 'prog-ca3', title: 'Bike & Swim Performance', description: 'Programme cardio croisé vélo et natation. Améliore ton VO2max et ta capacité aérobie sur deux disciplines complémentaires.', price: 34, duration: '8 semaines', category: 'Cardio', level: 'Intermédiaire', sessions: '4x/semaine', nutrition: false, enrollmentCount: 52, gradient: 'linear-gradient(135deg, #001020 0%, #003d6b 50%, #005a9e 100%)' },
    { id: 'prog-ca4', title: 'Triathlon Préparation', description: 'Plan complet natation-vélo-course pour finir ton premier triathlon. Périodisation sur 16 semaines avec semaines de récupération intégrées.', price: 79, duration: '16 semaines', category: 'Cardio', level: 'Intermédiaire', sessions: '5x/semaine', nutrition: false, enrollmentCount: 27, gradient: 'linear-gradient(135deg, #000d1a 0%, #00325c 50%, #004d8a 100%)' },
    // ── Mobilité (4)
    { id: 'prog-m1', title: 'Mobilité & Récupération', description: 'Protocole de mobilité articulaire et étirements actifs. Idéal en complément de tout programme intensif.', price: 0, duration: '4 semaines', category: 'Mobilité', level: 'Tous niveaux', sessions: '6x/semaine', nutrition: false, enrollmentCount: 198, gradient: 'linear-gradient(135deg, #100a1f 0%, #5a2d82 60%, #7b3fa8 100%)' },
    { id: 'prog-m2', title: 'Yoga Athlète', description: 'Yoga pensé pour les sportifs de force. Améliore ta flexibilité, réduis les douleurs chroniques, accélère la récupération musculaire.', price: 24, duration: '8 semaines', category: 'Mobilité', level: 'Tous niveaux', sessions: '4x/semaine', nutrition: false, enrollmentCount: 134, gradient: 'linear-gradient(135deg, #0d0820 0%, #442070 50%, #6030a0 100%)' },
    { id: 'prog-m3', title: 'Posture & Gainage', description: 'Renforce ta sangle abdominale et corrige ta posture. Prévention des blessures, dos solide, corps aligné — en 20 min par jour.', price: 19, duration: '6 semaines', category: 'Mobilité', level: 'Débutant', sessions: '5x/semaine', nutrition: false, enrollmentCount: 167, gradient: 'linear-gradient(135deg, #0f0a1a 0%, #4a2878 50%, #6a3da0 100%)' },
    { id: 'prog-m4', title: 'Deep Stretch Avancé', description: 'Programme de souplesse avancé avec postures longues et travail neuro-musculaire. Pour atteindre une vraie liberté de mouvement.', price: 34, duration: '10 semaines', category: 'Mobilité', level: 'Avancé', sessions: '4x/semaine', nutrition: false, enrollmentCount: 43, gradient: 'linear-gradient(135deg, #08051a 0%, #38186a 50%, #541e9e 100%)' },
  ],
  messages: [],
  healthConnections: {}, // { userId: { strava:{connected,token,lastSync}, garmin:{...}, ... } }
  consents: [],          // { id, clientId, clientName, proId, proName, coachId, coachName, createdAt }
  healthRecords: [],     // { id, proId, proName, proProfession, clientId, clientName, coachId, title, note, fileName, fileData, createdAt }
  pushSubscriptions: {}, // { userId: { subscription, prefs: { nutrition, programme, communaute } } }
  enrollments: [],       // { id, userId, programId, coachId, enrolledAt }
  streaks: {},           // { userId: { current, longest, lastDate, history: ['YYYY-MM-DD'] } }
  workoutLogs: [],       // { id, userId, programId, exerciseLogs, completedAt }
  posts: [],             // fil communauté
  postLikes: {},         // { postId: Set<userId> }
  postComments: {},      // { postId: [{id,userId,userName,userAvatar,userRole,text,createdAt}] }
  transactions: [
    { id: 't1', fromName: 'Alexandre M.', fromEmail: 'alexandre@mail.com', toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'Force Absolue',       amount: 49,  status: 'paid',     date: new Date(Date.now()-3600000*1).toISOString() },
    { id: 't2', fromName: 'Marie D.',     fromEmail: 'marie@mail.com',      toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'Transformation 90j', amount: 99,  status: 'paid',     date: new Date(Date.now()-3600000*4).toISOString() },
    { id: 't3', fromName: 'Lucas P.',     fromEmail: 'lucas@mail.com',      toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'Athlete Elite',       amount: 129, status: 'paid',     date: new Date(Date.now()-3600000*27).toISOString() },
    { id: 't4', fromName: 'Sophie M.',    fromEmail: 'sophie@mail.com',     toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'HIIT Brûle-Graisses', amount: 19,  status: 'paid',     date: new Date(Date.now()-3600000*30).toISOString() },
    { id: 't5', fromName: 'Thomas B.',    fromEmail: 'thomas@mail.com',     toName: 'nutri@ultra.com', toEmail: 'nutri@ultra.com', program: 'Nutrition HP', amount: 39,  status: 'paid',     date: new Date(Date.now()-3600000*48).toISOString() },
    { id: 't6', fromName: 'Camille R.',   fromEmail: 'camille@mail.com',    toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'Force Absolue',       amount: 49,  status: 'refunded', date: new Date(Date.now()-3600000*72).toISOString() },
    { id: 't7', fromName: 'Jordan K.',    fromEmail: 'jordan@mail.com',     toName: 'nutri@ultra.com', toEmail: 'nutri@ultra.com', program: 'Rééquilibrage', amount: 29,  status: 'paid',     date: new Date(Date.now()-3600000*96).toISOString() },
    { id: 't8', fromName: 'Emma L.',      fromEmail: 'emma@mail.com',       toName: 'Nate Coach', toEmail: 'coach@ultra.com', program: 'Transformation 90j', amount: 99,  status: 'paid',     date: new Date(Date.now()-3600000*120).toISOString() },
  ],
}

// ─── SEED comptes par défaut ────────────────────────────
;(async () => {
  const seed = [
    { id: 'coach-nate', name: 'nate',             email: 'natecoaching97@gmail.com', password: 'ultra2024', role: 'coach', coachPlan: 'pro', coachPlanSince: new Date().toISOString() },
    { id: 'coach-1',    name: 'Nate Coach',       email: 'coach@ultra.com',          password: 'ultra2024', role: 'coach', coachPlan: 'free', coachPlanSince: null,
      bio: 'Coach certifié BPJEPS, spécialisé force et prise de masse. 8 ans d\'expérience, 200+ clients transformés.',
      specialties: ['Force','Prise de masse','Powerlifting'], price: 80, rating: 4.9, reviewCount: 142,
      location: { lat: 48.8748, lng: 2.3098, city: 'Paris 8e', address: '12 Rue du Faubourg Saint-Honoré' },
      available: true, online: true, inPerson: true, avatarColor: '#a03848', verified: true,
      instagram: 'nate.coaching', calendlyUrl: 'https://calendly.com/nate-coaching/seance-decouverte',
      certifications: ['BPJEPS AGFF', 'Certification Powerlifting IPF', 'Premiers secours PSC1'],
      shop: [
        { id: 's1', name: 'Programme Force 12 semaines', price: 49, badge: 'Best-seller', link: 'https://gumroad.com', available: true },
        { id: 's2', name: 'Ebook Nutrition Prise de Masse', price: 19, badge: '', link: 'https://gumroad.com', available: true },
      ],
    },
    { id: 'client-1',   name: 'Alex Client',      email: 'client@ultra.com',         password: 'ultra2024', role: 'client',
      onboardingDone: true, objective: 'Prise de masse', level: 'Intermédiaire',
    },
    { id: 'admin-1',    name: 'Admin Ultra',       email: 'admin@ultra.com',          password: 'ultra2024', role: 'admin'         },
    { id: 'nutri-1',    name: 'Sarah Dupont',      email: 'nutri@ultra.com',          password: 'ultra2024', role: 'nutritionist',
      bio: 'Diététicienne DE + nutritionniste du sport. Spécialiste rééquilibrage et nutrition de performance.',
      specialties: ['Rééquilibrage alimentaire','Nutrition sportive','Perte de poids'], price: 70, rating: 4.8, reviewCount: 98,
      location: { lat: 48.8589, lng: 2.3783, city: 'Paris 11e', address: '34 Rue de la Roquette' },
      available: true, online: true, inPerson: true, avatarColor: '#27ae60', verified: true,
      instagram: 'sarah.nutrition', calendlyUrl: 'https://calendly.com/sarah-nutrition/bilan',
      certifications: ['Diététicienne DE', 'DU Nutrition du sport'],
    },
    // ── Coaches supplémentaires ──
    { id: 'coach-2', name: 'Marc Lefevre',    email: 'marc@ultra.com',    password: 'ultra2024', role: 'coach',
      bio: 'Ex-athlète de haut niveau reconverti coach. Spécialiste HIIT et perte de poids rapide en circuit training.',
      specialties: ['HIIT','Perte de poids','Cardio'], price: 65, rating: 4.7, reviewCount: 87,
      location: { lat: 48.8392, lng: 2.2901, city: 'Paris 15e', address: '5 Rue de Vaugirard' },
      available: true, online: true, inPerson: true, avatarColor: '#2980b9', verified: true,
    },
    { id: 'coach-3', name: 'Emma Bernard',   email: 'emma@ultra.com',    password: 'ultra2024', role: 'coach',
      bio: 'Coach femme, spécialiste transformation féminine. Programmes doux mais efficaces, fitness et bien-être.',
      specialties: ['Fitness féminin','Tonification','Mobilité'], price: 55, rating: 4.9, reviewCount: 213,
      location: { lat: 48.8926, lng: 2.3444, city: 'Paris 18e', address: '8 Rue Lepic' },
      available: true, online: true, inPerson: false, avatarColor: '#8e44ad', verified: true,
      instagram: 'emma.fitness', calendlyUrl: 'https://calendly.com/emma-fitness/seance',
      certifications: ['Diplôme STAPS', 'Certification Pilates', 'Coach Pré/Post natal'],
      shop: [
        { id: 'e1', name: 'Programme Full Body Maison', price: 39, badge: 'Populaire', link: 'https://gumroad.com', available: true },
      ],
    },
    { id: 'coach-4', name: 'Karim Hadjali',  email: 'karim@ultra.com',   password: 'ultra2024', role: 'coach',
      bio: 'Ancien champion de boxe française. Coaching combat, condition physique générale et mental d\'acier.',
      specialties: ['Boxe','Arts martiaux','Condition physique'], price: 75, rating: 4.6, reviewCount: 61,
      location: { lat: 48.8356, lng: 2.2399, city: 'Boulogne-Billancourt', address: '22 Avenue du Général Leclerc' },
      available: false, online: true, inPerson: true, avatarColor: '#e67e22', verified: true,
    },
    { id: 'coach-5', name: 'Julie Moreau',   email: 'julie@ultra.com',   password: 'ultra2024', role: 'coach',
      bio: 'Diplômée STAPS, spécialiste yoga & mobilité. Transforme ton rapport au corps, réduis les douleurs chroniques.',
      specialties: ['Yoga','Mobilité','Récupération'], price: 50, rating: 4.8, reviewCount: 174,
      location: { lat: 48.8481, lng: 2.4393, city: 'Vincennes', address: '3 Rue de Fontenay' },
      available: true, online: true, inPerson: true, avatarColor: '#27ae60', verified: false,
    },
    { id: 'coach-6', name: 'Thomas Petit',   email: 'thomas@ultra.com',  password: 'ultra2024', role: 'coach',
      bio: 'Powerlifter compétiteur IPF. Je t\'accompagne du débutant au podium. Technique, force brute, mental.',
      specialties: ['Powerlifting','Force','Haltérophilie'], price: 90, rating: 4.9, reviewCount: 55,
      location: { lat: 48.8838, lng: 2.2692, city: 'Neuilly-sur-Seine', address: '15 Rue de Chartres' },
      available: true, online: false, inPerson: true, avatarColor: '#c0392b', verified: true,
      instagram: 'thomas.powerlifting', calendlyUrl: 'https://calendly.com/thomas-pl/coaching',
      certifications: ['Juge fédéral IPF', 'BPJEPS Haltérophilie-Musculation'],
    },
    { id: 'coach-7', name: 'Amina Touré',    email: 'amina@ultra.com',   password: 'ultra2024', role: 'coach',
      bio: 'Coach running et triathlon. 5 finishers Ironman parmi mes clients. Programme personnalisé pour chaque distance.',
      specialties: ['Running','Triathlon','Endurance'], price: 60, rating: 4.7, reviewCount: 92,
      location: { lat: 48.9362, lng: 2.3574, city: 'Saint-Denis', address: '7 Rue Gabriel Péri' },
      available: true, online: true, inPerson: true, avatarColor: '#16a085', verified: true,
    },
    // ── Nutritionnistes supplémentaires ──
    { id: 'nutri-2', name: 'Pierre Garnier',  email: 'pierre.nutri@ultra.com', password: 'ultra2024', role: 'nutritionist',
      bio: 'Nutritionniste sport & santé. 12 ans d\'expérience avec athlètes de haut niveau (équipes pro, Jeux olympiques).',
      specialties: ['Performance sportive','Prise de masse','Récupération'], price: 90, rating: 4.9, reviewCount: 67,
      location: { lat: 48.8631, lng: 2.3972, city: 'Paris 20e', address: '11 Rue de Bagnolet' },
      available: true, online: true, inPerson: true, avatarColor: '#2980b9', verified: true,
      instagram: 'pierre.nutrition.pro', calendlyUrl: 'https://calendly.com/pierre-nutrition/bilan-complet',
      certifications: ['Master Nutrition du Sport', 'Diététicien DE', 'Consultant équipes pro'],
      shop: [
        { id: 'p1', name: 'Plan nutrition prise de masse 8 sem.', price: 59, badge: 'Pro', link: 'https://gumroad.com', available: true },
        { id: 'p2', name: 'Guide compléments alimentaires', price: 25, badge: '', link: 'https://gumroad.com', available: true },
      ],
    },
    { id: 'nutri-3', name: 'Léa Rousseau',   email: 'lea.nutri@ultra.com',    password: 'ultra2024', role: 'nutritionist',
      bio: 'Diététicienne spécialisée troubles alimentaires, végétarisme et alimentation intuitive. Bienveillance avant tout.',
      specialties: ['Rééquilibrage','Végétarisme','Troubles alimentaires'], price: 60, rating: 4.8, reviewCount: 134,
      location: { lat: 48.8044, lng: 2.1204, city: 'Versailles', address: '4 Rue des Réservoirs' },
      available: true, online: true, inPerson: false, avatarColor: '#e8a020', verified: true,
    },
    // ── Professionnels de santé ──
    { id: 'pro-1', name: 'Dr. Julien Faure',  email: 'julien.kine@ultra.com', password: 'ultra2024', role: 'health_pro',
      profession: 'Kinésithérapeute', rpps: '10100456789',
      bio: 'Masseur-kinésithérapeute DE, spécialisé rééducation sportive et prévention des blessures. Travaille main dans la main avec ton coach.',
      specialties: ['Rééducation','Prévention blessures','Sport'], price: 55, rating: 4.9, reviewCount: 88,
      location: { lat: 48.8698, lng: 2.3078, city: 'Paris 8e', address: '24 Rue de Miromesnil' },
      available: true, online: false, inPerson: true, avatarColor: '#0ea5e9', verified: true,
      certifications: ['Diplôme d\'État de Masseur-Kinésithérapeute', 'DU Rééducation du sportif'],
      calendlyUrl: 'https://calendly.com/julien-kine/bilan',
    },
    { id: 'pro-2', name: 'Camille Roy',  email: 'camille.osteo@ultra.com', password: 'ultra2024', role: 'health_pro',
      profession: 'Ostéopathe', rpps: '10100987654',
      bio: 'Ostéopathe DO. Prise en charge des douleurs chroniques, mobilité articulaire et accompagnement de la performance sportive.',
      specialties: ['Ostéopathie','Mobilité','Douleurs chroniques'], price: 60, rating: 4.8, reviewCount: 121,
      location: { lat: 48.8530, lng: 2.3499, city: 'Paris 4e', address: '8 Rue de Rivoli' },
      available: true, online: false, inPerson: true, avatarColor: '#14b8a6', verified: true,
      certifications: ['Diplôme d\'Ostéopathie (DO)', '6 ans de formation'],
      calendlyUrl: 'https://calendly.com/camille-osteo/consultation',
    },
    { id: 'pro-3', name: 'Dr. Nadia Belkacem', email: 'nadia.medecin@ultra.com', password: 'ultra2024', role: 'health_pro',
      profession: 'Médecin du sport', rpps: '10100112233',
      bio: 'Médecin du sport. Bilans d\'aptitude, suivi cardiologique de l\'effort, certificats médicaux et prévention.',
      specialties: ['Bilan d\'aptitude','Cardiologie du sport','Certificat médical'], price: 80, rating: 5.0, reviewCount: 64,
      location: { lat: 48.8417, lng: 2.3222, city: 'Paris 14e', address: '3 Rue d\'Alésia' },
      available: true, online: true, inPerson: true, avatarColor: '#6366f1', verified: true,
      certifications: ['Docteur en Médecine', 'Capacité de Médecine du Sport'],
      calendlyUrl: 'https://calendly.com/dr-nadia/bilan-aptitude',
    },
  ]
  for (const u of seed) {
    if (!db.users.find(x => x.email === u.email)) {
      db.users.push({ ...u, password: await bcrypt.hash(u.password, 10), createdAt: new Date().toISOString() })
    }
  }
  console.log('✅ Seed prêts — coach@ultra.com / client@ultra.com / nutri@ultra.com (mdp: ultra2024)')
})()

// Middleware auth
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Token manquant' })
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    // Si l'ID du token ne correspond plus (ex: après redémarrage),
    // on cherche par email pour rester compatible avec les anciens tokens
    const userById = db.users.find(u => u.id === decoded.id)
    if (!userById && decoded.email) {
      const userByEmail = db.users.find(u => u.email === decoded.email)
      if (userByEmail) {
        req.user = { ...decoded, id: userByEmail.id }
        return next()
      }
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide' })
  }
}

// ─── AUTH ───────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, profession, rpps } = req.body
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Tous les champs sont requis' })
  }
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email déjà utilisé' })
  }
  const hash = await bcrypt.hash(password, 10)
  const user = {
    id: uuidv4(),
    email,
    password: hash,
    name,
    role: role || 'client',
    isPremium: false,
    premiumSince: null,
    coachPlan: role === 'coach' ? 'free' : null, // free | pro | elite
    coachPlanSince: null,
    // Champs professionnel de santé
    ...(role === 'health_pro' && { profession: profession || 'Professionnel de santé', rpps: rpps || '', verified: false }),
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  const { password: _, ...safeUser } = user
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ user: safeUser, token })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = db.users.find(u => u.email === email)
  if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
  const { password: _, ...safeUser } = user
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user: safeUser, token })
})

// Marquer tous les programmes sans source comme 'admin'
db.programs.forEach(p => { if (!p.source) p.source = 'admin' })

// ─── PROGRAMS ───────────────────────────────────────────

app.get('/api/programs', auth, (req, res) => {
  res.json(db.programs)
})

app.get('/api/programs/:id', auth, (req, res) => {
  const program = db.programs.find(p => p.id === req.params.id)
  if (!program) return res.status(404).json({ message: 'Programme introuvable' })
  res.json(program)
})

app.post('/api/programs', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  const source = req.user.role === 'admin' ? 'admin' : 'coach'
  const program = { id: uuidv4(), ...req.body, source, coachId: req.user.id, enrollmentCount: 0, sections: req.body.sections || [], createdAt: new Date().toISOString() }
  db.programs.push(program)
  res.status(201).json(program)
})

app.put('/api/programs/:id', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  const idx = db.programs.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Programme introuvable' })
  if (req.user.role !== 'admin' && db.programs[idx].coachId !== req.user.id) {
    return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres programmes' })
  }
  db.programs[idx] = { ...db.programs[idx], ...req.body, id: req.params.id, coachId: db.programs[idx].coachId, updatedAt: new Date().toISOString() }
  res.json(db.programs[idx])
})

app.delete('/api/programs/:id', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  const idx = db.programs.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Programme introuvable' })
  if (req.user.role !== 'admin' && db.programs[idx].coachId !== req.user.id) {
    return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres programmes' })
  }
  db.programs.splice(idx, 1)
  res.json({ message: 'Programme supprimé' })
})

// ─── PROFILS COACH ──────────────────────────────────────

// Liste publique des coachs (pour le catalogue)
// ─── Discover / Géolocalisation ────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

app.get('/api/discover', (req, res) => {
  const { lat, lng, radius = 30, role, specialty, maxPrice, online } = req.query
  const experts = db.users
    .filter(u => u.role === 'coach' || u.role === 'nutritionist' || u.role === 'health_pro')
    .filter(u => u.location)
    .map(({ password, ...u }) => {
      const dist = (lat && lng)
        ? haversine(parseFloat(lat), parseFloat(lng), u.location.lat, u.location.lng)
        : null
      return {
        id: u.id, name: u.name, role: u.role,
        profession: u.profession || null,
        bio: u.bio || '', specialties: u.specialties || [],
        price: u.price || 0, rating: u.rating || 4.5, reviewCount: u.reviewCount || 0,
        location: u.location, available: u.available !== false,
        online: u.online !== false, inPerson: u.inPerson !== false,
        avatarColor: u.avatarColor || '#a03848', verified: u.verified || false,
        avatar: u.avatar || null, distance: dist ? Math.round(dist * 10) / 10 : null,
      }
    })
    .filter(u => !radius || !u.distance || u.distance <= parseFloat(radius))
    .filter(u => !role || u.role === role)
    .filter(u => !specialty || u.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase())))
    .filter(u => !maxPrice || u.price <= parseFloat(maxPrice))
    .filter(u => online !== 'true' || u.online)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
  res.json(experts)
})

// ─── Profil public d'un expert (coach ou nutritionniste) ──
app.get('/api/discover/:id', (req, res) => {
  const u = db.users.find(x => x.id === req.params.id && (x.role === 'coach' || x.role === 'nutritionist' || x.role === 'health_pro'))
  if (!u) return res.status(404).json({ error: 'Expert introuvable' })
  const { password, email, ...rest } = u
  res.json({
    id: u.id, name: u.name, role: u.role,
    profession: u.profession || null, rpps: u.rpps || '',
    bio: u.bio || '', specialties: u.specialties || [],
    price: u.price || 0, rating: u.rating || 4.5, reviewCount: u.reviewCount || 0,
    location: u.location || null, available: u.available !== false,
    online: u.online !== false, inPerson: u.inPerson !== false,
    avatarColor: u.avatarColor || '#a03848', verified: u.verified || false,
    avatar: u.avatar || null, banner: u.banner || null,
    certifications: u.certifications || [], experience: u.experience || null,
    // Liens & contenus ajoutés par l'expert sur son interface
    calendlyUrl: u.calendlyUrl || '',
    instagram:   u.instagram   || '',
    linkedin:    u.linkedin     || '',
    photos:      u.photos       || [],
    videoUrl:    u.videoUrl     || '',
    videoData:   u.videoData    || null,
    shop:        u.shop         || [],
    programCount: db.programs.filter(p => p.coachId === u.id).length,
  })
})

// ─── Notifications (in-memory seed) ────────────────────
const NOTIF_SEED = {
  'coach@ultra.com': [
    { id: 'n1', type: 'message',    title: 'Nouveau message',       body: 'Alex Client t\'a envoyé un message', read: false, time: '2 min', link: '/chat' },
    { id: 'n2', type: 'nutrition',  title: 'Journal repas logué',   body: 'Alex a enregistré son déjeuner', read: false, time: '1h', link: '/coach/nutrition' },
    { id: 'n3', type: 'client',     title: 'Nouvel abonné',         body: 'Lucas H. vient de rejoindre ta liste', read: true, time: '3h', link: '/clients' },
    { id: 'n4', type: 'revenue',    title: 'Paiement reçu',         body: '80€ reçu pour le suivi mensuel', read: true, time: '1j', link: '/revenue' },
  ],
  'client@ultra.com': [
    { id: 'n1', type: 'program',    title: 'Programme mis à jour',  body: 'Nate Coach a modifié ton programme', read: false, time: '30 min', link: '/programs' },
    { id: 'n2', type: 'message',    title: 'Message de ton coach',  body: 'Nate Coach : "Bravo pour cette semaine 💪"', read: false, time: '2h', link: '/chat' },
    { id: 'n3', type: 'reminder',   title: 'Rappel séance',         body: 'Ta séance Push est prévue demain', read: true, time: '5h', link: '/dashboard' },
  ],
  'nutri@ultra.com': [
    { id: 'n1', type: 'client',     title: 'Compliance faible',     body: 'Marie D. n\'a pas loggé depuis 3 jours', read: false, time: '1h', link: '/nutri/clients' },
    { id: 'n2', type: 'message',    title: 'Question client',        body: 'Thomas R. a posé une question sur son plan', read: false, time: '4h', link: '/chat' },
    { id: 'n3', type: 'revenue',    title: 'Consultation confirmée', body: 'RDV confirmé avec Camille V. — demain 14h', read: true, time: '1j', link: '/calendar' },
  ],
}

app.get('/api/notifications', auth, (req, res) => {
  const seed = NOTIF_SEED[req.user.email] || []
  const dynamic = (db.notifs && db.notifs[req.user.id]) || []
  res.json([...dynamic, ...seed])
})

app.put('/api/notifications/:id/read', auth, (req, res) => {
  const dynamic = (db.notifs && db.notifs[req.user.id]) || []
  const list = [...dynamic, ...(NOTIF_SEED[req.user.email] || [])]
  const n = list.find(x => x.id === req.params.id)
  if (n) n.read = true
  res.json({ success: true })
})

app.put('/api/notifications/read-all', auth, (req, res) => {
  const dynamic = (db.notifs && db.notifs[req.user.id]) || []
  const list = [...dynamic, ...(NOTIF_SEED[req.user.email] || [])]
  list.forEach(n => n.read = true)
  res.json({ success: true })
})

app.get('/api/coaches', auth, (req, res) => {
  const coaches = db.users
    .filter(u => u.role === 'coach')
    .map(({ password, ...u }) => ({
      id: u.id, name: u.name, email: u.email,
      bio: u.bio || '', specialties: u.specialties || [],
      calendlyUrl: u.calendlyUrl || '', avatar: u.avatar || null,
      instagram: u.instagram || '', photos: u.photos || [],
      videoUrl: u.videoUrl || '', videoData: u.videoData || null,
      programCount: db.programs.filter(p => p.coachId === u.id).length,
    }))
  res.json(coaches)
})

// ════════════════════════════════════════════════════════════
//  DOSSIERS PARTAGÉS — consentement client + bilans pro→coach
// ════════════════════════════════════════════════════════════

if (!db.notifs) db.notifs = {}  // { userId: [{ id,type,title,body,read,time,link,createdAt }] }
function pushNotif(userId, notif) {
  if (!db.notifs[userId]) db.notifs[userId] = []
  db.notifs[userId].unshift({ id: uuidv4(), read: false, createdAt: new Date().toISOString(), ...notif })
}
function userPublic(id) {
  const u = db.users.find(x => x.id === id)
  if (!u) return null
  const { password, ...rest } = u
  return rest
}

// ── Consentements ──
// Le client autorise un pro de santé à partager des bilans avec un coach
app.post('/api/consents', auth, (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Réservé aux clients' })
  const { proId, coachId } = req.body
  const pro   = db.users.find(u => u.id === proId && u.role === 'health_pro')
  const coach = db.users.find(u => u.id === coachId && u.role === 'coach')
  if (!pro || !coach) return res.status(400).json({ message: 'Professionnel ou coach introuvable' })
  if (db.consents.find(c => c.clientId === req.user.id && c.proId === proId && c.coachId === coachId))
    return res.status(400).json({ message: 'Autorisation déjà accordée' })
  const me = userPublic(req.user.id)
  const consent = {
    id: uuidv4(), clientId: req.user.id, clientName: me?.name || '',
    proId, proName: pro.name, proProfession: pro.profession || '',
    coachId, coachName: coach.name, createdAt: new Date().toISOString(),
  }
  db.consents.push(consent)
  // Notifie le pro et le coach
  pushNotif(proId,   { type: 'client', title: 'Nouvelle autorisation', body: `${consent.clientName} t'autorise à partager ses bilans`, time: 'à l\'instant', link: '/pro/patients' })
  pushNotif(coachId, { type: 'client', title: 'Suivi santé activé',     body: `${consent.clientName} a connecté ${pro.name} (${pro.profession})`, time: 'à l\'instant', link: '/coach/sante' })
  res.status(201).json(consent)
})

app.get('/api/consents', auth, (req, res) => {
  const { id, role } = req.user
  let list = []
  if (role === 'client')      list = db.consents.filter(c => c.clientId === id)
  else if (role === 'health_pro') list = db.consents.filter(c => c.proId === id)
  else if (role === 'coach')  list = db.consents.filter(c => c.coachId === id)
  res.json(list)
})

app.delete('/api/consents/:id', auth, (req, res) => {
  const c = db.consents.find(x => x.id === req.params.id)
  if (!c) return res.status(404).json({ message: 'Introuvable' })
  if (c.clientId !== req.user.id) return res.status(403).json({ message: 'Non autorisé' })
  db.consents = db.consents.filter(x => x.id !== req.params.id)
  res.json({ success: true })
})

// ── Bilans (dossiers) ──
// Le pro de santé dépose un bilan pour un patient → partagé au coach lié
app.post('/api/records', auth, (req, res) => {
  if (req.user.role !== 'health_pro') return res.status(403).json({ message: 'Réservé aux professionnels de santé' })
  const { consentId, title, note, fileName, fileData } = req.body
  const consent = db.consents.find(c => c.id === consentId && c.proId === req.user.id)
  if (!consent) return res.status(400).json({ message: 'Autorisation patient introuvable' })
  if (!title || !note) return res.status(400).json({ message: 'Titre et note requis' })
  const me = db.users.find(u => u.id === req.user.id)
  const record = {
    id: uuidv4(), proId: req.user.id, proName: me?.name || '', proProfession: me?.profession || '',
    clientId: consent.clientId, clientName: consent.clientName,
    coachId: consent.coachId, title, note,
    fileName: fileName || null, fileData: fileData || null,
    createdAt: new Date().toISOString(),
  }
  db.healthRecords.push(record)
  // Notifie le coach + le client
  pushNotif(consent.coachId,  { type: 'reminder', title: 'Nouveau bilan santé', body: `${me?.name} a partagé un bilan pour ${consent.clientName} : "${title}"`, time: 'à l\'instant', link: '/coach/sante' })
  pushNotif(consent.clientId, { type: 'reminder', title: 'Bilan ajouté à ton dossier', body: `${me?.name} a déposé "${title}" et l'a partagé à ton coach`, time: 'à l\'instant', link: '/dashboard' })
  const { fileData: _, ...safe } = record
  res.status(201).json(safe)
})

app.get('/api/records', auth, (req, res) => {
  const { id, role } = req.user
  let list = []
  if (role === 'health_pro') list = db.healthRecords.filter(r => r.proId === id)
  else if (role === 'coach') list = db.healthRecords.filter(r => r.coachId === id)
  else if (role === 'client') list = db.healthRecords.filter(r => r.clientId === id)
  // on n'envoie pas le fichier base64 dans la liste
  res.json(list.map(({ fileData, ...r }) => ({ ...r, hasFile: !!fileData })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)))
})

// Télécharger le fichier d'un bilan (accès réservé aux parties concernées)
app.get('/api/records/:id/file', auth, (req, res) => {
  const r = db.healthRecords.find(x => x.id === req.params.id)
  if (!r || !r.fileData) return res.status(404).json({ message: 'Aucun fichier' })
  if (![r.proId, r.coachId, r.clientId].includes(req.user.id)) return res.status(403).json({ message: 'Non autorisé' })
  res.json({ fileName: r.fileName, fileData: r.fileData })
})

// Mettre à jour son profil coach
app.put('/api/profile', auth, (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.user.id)
  if (idx === -1) return res.status(404).json({ message: 'Utilisateur introuvable' })
  const { name, bio, specialties, calendlyUrl, avatar, banner, instagram, photos, videoUrl, videoData, shop,
          certifications, tarifConsultation, tarifSuivi, linkedin,
          profession, rpps, location, price } = req.body
  db.users[idx] = {
    ...db.users[idx],
    name:               name               ? name.trim() : db.users[idx].name,
    bio:                bio                ?? db.users[idx].bio,
    specialties:        specialties        ?? db.users[idx].specialties,
    calendlyUrl:        calendlyUrl        ?? db.users[idx].calendlyUrl,
    avatar:             avatar             ?? db.users[idx].avatar,
    banner:             'banner' in req.body ? (banner || null) : (db.users[idx].banner ?? null),
    instagram:          instagram          ?? db.users[idx].instagram,
    photos:             photos             ?? db.users[idx].photos,
    videoUrl:           videoUrl           ?? db.users[idx].videoUrl,
    videoData:          videoData          ?? db.users[idx].videoData,
    shop:               shop               ?? db.users[idx].shop ?? [],
    certifications:     certifications     ?? db.users[idx].certifications ?? [],
    tarifConsultation:  tarifConsultation  ?? db.users[idx].tarifConsultation ?? '',
    tarifSuivi:         tarifSuivi         ?? db.users[idx].tarifSuivi ?? '',
    linkedin:           linkedin           ?? db.users[idx].linkedin ?? '',
    profession:         profession         ?? db.users[idx].profession,
    rpps:               rpps               ?? db.users[idx].rpps,
    location:           location           ?? db.users[idx].location,
    price:              price              ?? db.users[idx].price,
    updatedAt: new Date().toISOString(),
  }
  const { password, ...safe } = db.users[idx]
  res.json(safe)
})

// Lire son propre profil
app.get('/api/profile', auth, (req, res) => {
  const u = db.users.find(u => u.id === req.user.id)
  if (!u) return res.status(404).json({ message: 'Introuvable' })
  const { password, ...safe } = u
  res.json(safe)
})

// Coach: récupérer ses propres programmes
app.get('/api/coach/programs', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  const mine = db.programs.filter(p => p.coachId === req.user.id)
  res.json(mine)
})

// ─── NUTRITION — CLIENT ─────────────────────────────────

// Lire le log d'une journée
app.get('/api/nutrition/log', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const log  = db.nutritionLogs[req.user.id]?.[date] || { meals: [] }
  const goals = db.nutritionGoals[req.user.id] || null
  res.json({ date, meals: log.meals, updatedAt: log.updatedAt, goals })
})

// Sauvegarder le log
app.put('/api/nutrition/log', auth, (req, res) => {
  const { date, meals } = req.body
  if (!date) return res.status(400).json({ message: 'date requis' })
  if (!db.nutritionLogs[req.user.id]) db.nutritionLogs[req.user.id] = {}
  db.nutritionLogs[req.user.id][date] = { meals: meals || [], updatedAt: new Date().toISOString() }
  res.json({ success: true, updatedAt: db.nutritionLogs[req.user.id][date].updatedAt })
})

// Lire ses objectifs macros
app.get('/api/nutrition/goals', auth, (req, res) => {
  res.json(db.nutritionGoals[req.user.id] || { calories: 2000, protein: 150, carbs: 220, fat: 70 })
})

// ─── NUTRITION — COACH ──────────────────────────────────

// Liste des clients (pour le coach)
app.get('/api/coach/clients', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé' })
  const clients = db.users.filter(u => u.role === 'client').map(({ password, ...u }) => u)
  res.json(clients)
})

// Voir le log nutrition d'un client
app.get('/api/coach/clients/:clientId/nutrition', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé' })
  const date  = req.query.date || new Date().toISOString().slice(0, 10)
  const log   = db.nutritionLogs[req.params.clientId]?.[date] || { meals: [] }
  const goals = db.nutritionGoals[req.params.clientId] || { calories: 2000, protein: 150, carbs: 220, fat: 70 }
  const client = db.users.find(u => u.id === req.params.clientId)
  res.json({ date, meals: log.meals, updatedAt: log.updatedAt, goals, client: client ? { id:client.id, name:client.name, email:client.email } : null })
})

// Définir les objectifs macro d'un client (coach → client)
app.put('/api/coach/clients/:clientId/nutrition/goals', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé' })
  const { calories, protein, carbs, fat } = req.body
  db.nutritionGoals[req.params.clientId] = { calories, protein, carbs, fat, setBy: req.user.id, updatedAt: new Date().toISOString() }
  res.json({ success: true })
})

// SSE — stream live du log d'un client (coach)
app.get('/api/coach/clients/:clientId/nutrition/stream', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé' })
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const clientId = req.params.clientId
  const date     = req.query.date || new Date().toISOString().slice(0, 10)

  const send = () => {
    const log   = db.nutritionLogs[clientId]?.[date] || { meals: [] }
    const goals = db.nutritionGoals[clientId] || { calories: 2000, protein: 150, carbs: 220, fat: 70 }
    const data  = JSON.stringify({ meals: log.meals, updatedAt: log.updatedAt, goals })
    res.write(`data: ${data}\n\n`)
  }

  send() // envoi immédiat
  const interval = setInterval(send, 5000) // toutes les 5s
  req.on('close', () => clearInterval(interval))
})

// ─── MESSAGES ───────────────────────────────────────────

app.get('/api/messages/:recipientId', auth, (req, res) => {
  const msgs = db.messages.filter(
    m => (m.senderId === req.user.id && m.recipientId === req.params.recipientId) ||
         (m.senderId === req.params.recipientId && m.recipientId === req.user.id)
  )
  res.json(msgs)
})

app.post('/api/messages', auth, (req, res) => {
  const { recipientId, message } = req.body
  const msg = {
    id: uuidv4(),
    senderId: req.user.id,
    recipientId,
    message,
    createdAt: new Date().toISOString(),
  }
  db.messages.push(msg)
  res.status(201).json(msg)
})

// ─── ADMIN ──────────────────────────────────────────────

app.get('/api/admin/dashboard', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  res.json({
    totalUsers: db.users.length,
    totalPrograms: db.programs.length,
    totalEnrollments: db.programs.reduce((sum, p) => sum + p.enrollmentCount, 0),
    totalRevenue: db.programs.reduce((sum, p) => sum + p.price * p.enrollmentCount, 0),
  })
})

app.get('/api/admin/users', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  res.json(db.users.map(({ password, ...u }) => u))
})

// Admin — stats enrichies
app.get('/api/admin/stats', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const coaches = db.users.filter(u => u.role === 'coach').length
  const clients = db.users.filter(u => u.role === 'client').length
  const nutritionists = db.users.filter(u => u.role === 'nutritionist').length
  const totalRevenue = db.programs.reduce((s, p) => s + p.price * p.enrollmentCount, 0)
  const totalEnrollments = db.programs.reduce((s, p) => s + p.enrollmentCount, 0)
  const freePrograms = db.programs.filter(p => p.price === 0).length
  const bannedUsers = db.users.filter(u => u.banned).length
  res.json({
    totalUsers: db.users.length, coaches, clients, nutritionists,
    totalPrograms: db.programs.length, freePrograms,
    totalEnrollments, totalRevenue, bannedUsers,
  })
})

// Admin — tous les programmes
app.get('/api/admin/programs', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const programs = db.programs.map(p => {
    const coach = db.users.find(u => u.id === p.coachId)
    return { ...p, coachName: coach?.name || 'Inconnu', coachEmail: coach?.email || '' }
  })
  res.json(programs)
})

// Admin — supprimer un utilisateur
app.delete('/api/admin/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  if (req.params.id === req.user.id) return res.status(400).json({ message: 'Impossible de se supprimer soi-même' })
  const idx = db.users.findIndex(u => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Utilisateur introuvable' })
  db.users.splice(idx, 1)
  res.json({ success: true })
})

// Admin — modifier rôle ou ban
app.put('/api/admin/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const idx = db.users.findIndex(u => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Utilisateur introuvable' })
  const { role, banned } = req.body
  if (role) db.users[idx].role = role
  if (banned !== undefined) db.users[idx].banned = banned
  const { password, ...safe } = db.users[idx]
  res.json(safe)
})

// Admin — supprimer un programme
app.delete('/api/admin/programs/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const idx = db.programs.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Programme introuvable' })
  db.programs.splice(idx, 1)
  res.json({ success: true })
})

// Admin — créer un programme générique (accessible à tous)
app.post('/api/admin/programs', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const { title, description, price, duration, category, level, sessions, nutrition } = req.body
  if (!title) return res.status(400).json({ message: 'Titre requis' })
  const prog = {
    id: `admin-prog-${uuidv4()}`,
    coachId: req.user.id, coachName: 'ULTRA', coachEmail: req.user.email,
    title, description: description || '', price: price ?? 0,
    duration: duration || '', category: category || 'Général', level: level || 'Tous niveaux',
    sessions: sessions || null, nutrition: nutrition || false,
    enrollmentCount: 0, isGeneric: true,
    gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3d 60%, #2a2a6b 100%)',
    createdAt: new Date().toISOString(),
  }
  db.programs.push(prog)
  res.status(201).json(prog)
})

// Admin — toutes les transactions
app.get('/api/admin/transactions', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  res.json([...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)))
})

// Admin — rembourser une transaction
app.post('/api/admin/transactions/:id/refund', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const t = db.transactions.find(t => t.id === req.params.id)
  if (!t) return res.status(404).json({ message: 'Transaction introuvable' })
  if (t.status === 'refunded') return res.status(400).json({ message: 'Déjà remboursé' })
  t.status = 'refunded'
  t.refundedAt = new Date().toISOString()
  res.json(t)
})

// Admin — lire toutes les conversations
app.get('/api/admin/messages', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  // Group messages by conversation pair
  const convMap = {}
  db.messages.forEach(m => {
    const key = [m.senderId, m.recipientId].sort().join('|')
    if (!convMap[key]) {
      const sender    = db.users.find(u => u.id === m.senderId)
      const recipient = db.users.find(u => u.id === m.recipientId)
      convMap[key] = { key, sender: sender?.name || '?', senderRole: sender?.role, recipient: recipient?.name || '?', recipientRole: recipient?.role, messages: [], lastAt: m.createdAt }
    }
    convMap[key].messages.push(m)
    if (m.createdAt > convMap[key].lastAt) convMap[key].lastAt = m.createdAt
  })
  res.json(Object.values(convMap).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)))
})

// Admin — lire une conversation spécifique
app.get('/api/admin/messages/:userId1/:userId2', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
  const { userId1, userId2 } = req.params
  const msgs = db.messages.filter(m =>
    (m.senderId === userId1 && m.recipientId === userId2) ||
    (m.senderId === userId2 && m.recipientId === userId1)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  res.json(msgs)
})

// ─── IA — Anthropic Claude ──────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

const ULTRA_SYSTEM = `Tu es ULTRA AI, un coach sportif et nutritionniste expert intégré à la plateforme ULTRA.
Tu parles français, tu es direct, motivant, précis et bienveillant.
Tu adaptes tes réponses au profil de l'utilisateur (coach ou athlète).
Tu donnes des conseils concrets, basés sur des données scientifiques récentes.
Tu ne donnes jamais de conseils médicaux — tu recommandes de consulter un professionnel pour les blessures graves.
Tes réponses sont concises mais complètes. Tu utilises des emojis avec parcimonie.
Format: utilise du markdown (gras, listes) pour structurer tes réponses quand c'est utile.`

function buildCoachContext(user) {
  const enrollments = db.enrollments.filter(e => e.userId === user.id)
  const streak = db.streaks[user.id] || { current: 0, longest: 0 }
  const recentLogs = db.workoutLogs.filter(l => l.userId === user.id).slice(-5)
  const programs = enrollments.map(e => db.programs.find(p => p.id === e.programId)).filter(Boolean)

  return `
PROFIL ATHLÈTE:
- Nom: ${user.name}
- Objectif: ${user.objective || 'non renseigné'}
- Niveau: ${user.level || 'non renseigné'}
- Streak actuel: ${streak.current} jour(s) consécutifs (record: ${streak.longest})
- Programmes en cours: ${programs.map(p => p.title).join(', ') || 'aucun'}
- Dernières séances: ${recentLogs.length} séance(s) récente(s)
- Premium: ${user.isPremium ? 'oui' : 'non'}
`.trim()
}

// Chat IA — streaming SSE (générique)
app.post('/api/ai/chat', auth, async (req, res) => {
  const { messages, context } = req.body
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ message: 'Clé API Anthropic non configurée. Ajoute ANTHROPIC_API_KEY dans les variables d\'environnement.' })
  }
  const user = db.users.find(u => u.id === req.user.id)
  const userCtx = `Utilisateur: ${user?.name}, Rôle: ${user?.role}. ${context || ''}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: ULTRA_SYSTEM + '\n\nContexte: ' + userCtx,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    stream.on('text', text => res.write(`data: ${JSON.stringify({ text })}\n\n`))
    stream.on('finalMessage', () => { res.write('data: [DONE]\n\n'); res.end() })
    stream.on('error', err => { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end() })
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// Chat AI Coach — streaming SSE avec contexte athlète complet
app.post('/api/ai/coach-chat', auth, async (req, res) => {
  const { messages } = req.body
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ message: 'Clé API Anthropic non configurée.' })
  }
  const user = db.users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const systemPrompt = ULTRA_SYSTEM + '\n\n' + buildCoachContext(user)

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    stream.on('text', text => res.write(`data: ${JSON.stringify({ text })}\n\n`))
    stream.on('finalMessage', () => { res.write('data: [DONE]\n\n'); res.end() })
    stream.on('error', err => { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end() })
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// Générer un programme complet avec IA
app.post('/api/ai/generate-program', auth, async (req, res) => {
  const { goal, level, daysPerWeek, equipment, duration, focusAreas, includeNutrition } = req.body
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: 'Clé API Anthropic non configurée.' })
  try {
    const prompt = `Génère un programme d'entraînement structuré avec ces paramètres:
- Objectif: ${goal}
- Niveau: ${level}
- Jours/semaine: ${daysPerWeek}
- Équipement: ${equipment}
- Durée totale: ${duration} semaines
- Focus: ${focusAreas?.join(', ') || 'général'}
- Inclure nutrition: ${includeNutrition ? 'oui' : 'non'}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "title": "Nom du programme",
  "description": "Description courte",
  "weeks": [
    {
      "id": "w1", "title": "Semaine 1 — Fondations",
      "days": [
        {
          "id": "d1", "label": "Lundi — Push",
          "blocks": [
            { "id": "b1", "type": "exercise", "title": "Développé couché", "sets": 4, "reps": "8-10", "rest": "90s", "notes": "Contrôle excentrique 3s" }
          ]
        }
      ]
    }
  ]
}`
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    const program = JSON.parse(raw)
    res.json({ success: true, program })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Analyser un aliment par description (texte → macros)
app.post('/api/ai/food-analyze', auth, async (req, res) => {
  const { description, grams } = req.body
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: 'Clé API Anthropic non configurée.' })
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Pour "${description}"${grams ? ` (${grams}g)` : ''}, donne les macronutriments.
Réponds UNIQUEMENT en JSON: {"name":"...", "calories_per_100g":X, "protein_per_100g":X, "carbs_per_100g":X, "fat_per_100g":X, "confidence":"high|medium|low"}`
      }],
    })
    const raw = msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    res.json({ success: true, food: JSON.parse(raw) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Insights IA pour le dashboard coach
app.post('/api/ai/insights', auth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: 'Clé API Anthropic non configurée.' })
  const user = db.users.find(u => u.id === req.user.id)
  const clientCount = db.users.filter(u => u.role === 'client').length
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Coach: ${user?.name}, ${clientCount} clients sur la plateforme ULTRA.
Génère 3 insights actionnables courts (1-2 phrases max chacun) pour optimiser son activité de coaching aujourd'hui.
Réponds en JSON: {"insights": [{"icon":"emoji","title":"titre court","text":"conseil concret","type":"growth|retention|nutrition|performance"}]}`
      }],
    })
    const raw = msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    res.json({ success: true, ...JSON.parse(raw) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Analyse du plan nutrition d'un client
app.post('/api/ai/nutrition-review', auth, async (req, res) => {
  const { meals, goals } = req.body
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: 'Clé API Anthropic non configurée.' })
  try {
    const totalCals = meals?.reduce((s, m) => s + (m.items?.reduce((ss, i) => ss + (i.calories || 0), 0) || 0), 0) || 0
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Analyse ce journal alimentaire: ${totalCals} kcal consommées. Objectifs: ${JSON.stringify(goals)}.
Donne une analyse en JSON: {"score":X,"scoreLabel":"Excellent|Bien|À améliorer","summary":"1 phrase","tips":["conseil 1","conseil 2","conseil 3"],"macroBalance":"observation sur les macros"}`
      }],
    })
    const raw = msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    res.json({ success: true, ...JSON.parse(raw) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────
//  INTÉGRATIONS SANTÉ
// ─────────────────────────────────────────────────────────

const PLATFORM_AUTH_URLS = {
  strava:  { authUrl: `https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent('http://localhost:5001/api/health/callback/strava')}&approval_prompt=force&scope=read,activity:read_all` },
  garmin:  { authUrl: `https://connect.garmin.com/oauthConfirm` },
  oura:    { authUrl: `https://cloud.ouraring.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent('http://localhost:5001/api/health/callback/oura')}&scope=daily+sleep+readiness+personal` },
  polar:   { authUrl: `https://flow.polar.com/oauth2/authorization?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent('http://localhost:5001/api/health/callback/polar')}&scope=accesslink.read_all` },
}

// Données mock réalistes par plateforme
const MOCK_DATA = {
  strava: {
    weekActivity: [2400, 5800, 8700, 3200, 11400, 6800, 9200],
    metrics: { activities: 12, distance_week: '87.4 km', elevation: '1 240 m', pace: "4'32\"/km" }
  },
  garmin: {
    weekActivity: [320, 480, 610, 290, 720, 540, 480],
    metrics: { vo2max: 52, training_load: 342, body_battery: '78 %', sleep_score: '82/100' }
  },
  oura: {
    sleepScores: [72, 85, 68, 90, 88, 76, 86],
    metrics: { sleep_score: '86/100', hrv: '54 ms', readiness: '91/100', rhr: '52 bpm' }
  },
  polar: {
    weekActivity: [280, 410, 560, 310, 640, 490, 420],
    metrics: { cardio_load: 280, hr_zones: 'Zone 2 dominant', nightly_recharge: 'Good', orthostatic: 'Normal' }
  },
  apple: {
    weekActivity: [6400, 8200, 11000, 7800, 12400, 9600, 10200],
    metrics: { steps: '9 847', heart_rate: '68 bpm', sleep: '7h 12m', weight: '78.2 kg' }
  },
}

// GET  /api/health/connections — récupère les connexions de l'utilisateur
app.get('/api/health/connections', auth, (req, res) => {
  const userConns = db.healthConnections[req.user.id] || {}
  res.json(userConns)
})

// GET  /api/health/connect/:platform — génère l'URL OAuth
app.get('/api/health/connect/:platform', auth, (req, res) => {
  const { platform } = req.params
  const cfg = PLATFORM_AUTH_URLS[platform]
  if (!cfg) return res.status(400).json({ message: 'Plateforme inconnue' })
  res.json({ authUrl: cfg.authUrl, platform })
})

// POST /api/health/mock-connect/:platform — simule une connexion OAuth (démo)
app.post('/api/health/mock-connect/:platform', auth, (req, res) => {
  const { platform } = req.params
  const valid = ['strava','garmin','oura','polar','apple']
  if (!valid.includes(platform)) return res.status(400).json({ message: 'Plateforme inconnue' })

  if (!db.healthConnections[req.user.id]) db.healthConnections[req.user.id] = {}
  db.healthConnections[req.user.id][platform] = {
    connected: true,
    lastSync: new Date().toISOString(),
    token: `mock_token_${platform}_${Date.now()}`,
    ...MOCK_DATA[platform],
  }
  res.json({ success: true, platform, data: db.healthConnections[req.user.id][platform] })
})

// GET  /api/health/callback/:platform — callback OAuth (à connecter à chaque SDK)
app.get('/api/health/callback/:platform', (req, res) => {
  const { platform } = req.params
  const { code, state } = req.query
  // En prod : échanger le code contre un token via l'API de chaque plateforme
  // Ici on renvoie juste un HTML qui ferme le popup et notifie la fenêtre parente
  res.send(`
    <html><body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
      <div style="text-align:center">
        <p style="font-size:48px">✓</p>
        <p style="font-size:20px;font-weight:bold">${platform.charAt(0).toUpperCase()+platform.slice(1)} connecté !</p>
        <p style="opacity:0.5;font-size:14px">Cette fenêtre va se fermer…</p>
      </div>
      <script>
        window.opener?.postMessage({ type:'oauth_success', platform:'${platform}' }, '*')
        setTimeout(() => window.close(), 1500)
      </script>
    </body></html>
  `)
})

// POST /api/health/sync/:platform — déclenche une synchronisation
app.post('/api/health/sync/:platform', auth, (req, res) => {
  const { platform } = req.params
  const conn = db.healthConnections[req.user.id]?.[platform]
  if (!conn?.connected) return res.status(400).json({ message: 'Plateforme non connectée' })

  // En prod : appel API Strava/Garmin/etc avec le token stocké
  db.healthConnections[req.user.id][platform] = {
    ...conn,
    lastSync: new Date().toISOString(),
    ...MOCK_DATA[platform],
  }
  res.json({ success: true, lastSync: db.healthConnections[req.user.id][platform].lastSync })
})

// DELETE /api/health/disconnect/:platform — déconnecte une plateforme
app.delete('/api/health/disconnect/:platform', auth, (req, res) => {
  const { platform } = req.params
  if (db.healthConnections[req.user.id]) {
    delete db.healthConnections[req.user.id][platform]
  }
  res.json({ success: true })
})

// ─────────────────────────────────────────────────────────
//  COMMUNAUTÉ
// ─────────────────────────────────────────────────────────

// Seed posts de démo
;(() => {
  const now = Date.now()
  const seedPosts = [
    { id: 'post-1', userId:'coach-1', userName:'Nate Coach', userRole:'coach', userAvatar:null, userColor:'#a03848',
      text:'Séance de force du matin ✅ Squat 160kg x5, Bench 110kg x5, Deadlift 190kg x3. La progression continue semaine après semaine — la constance bat toujours le talent. 💪',
      type:'workout', healthData:{ platform:'garmin', icon:'⌚', label:'Garmin Connect', stats:[{k:'Durée',v:'1h 12m'},{k:'FC moy.',v:'142 bpm'},{k:'Calories',v:'620 kcal'},{k:'Charge',v:'340'}] },
      image:null, likes:18, comments:4, createdAt: new Date(now - 3600000*2).toISOString() },
    { id: 'post-2', userId:'client-1', userName:'Alex Client', userRole:'client', userAvatar:null, userColor:'#3b82f6',
      text:'Première semaine complète sur le programme Force Absolue 🔥 Jamais pensé que je saurais faire du squat correctement un jour. Merci @NateCoach pour les corrections de forme !',
      type:'milestone', healthData:null, image:null, likes:11, comments:2, createdAt: new Date(now - 3600000*5).toISOString() },
    { id: 'post-3', userId:'nutri-1', userName:'Sarah Dupont', userRole:'nutritionist', userAvatar:null, userColor:'#27ae60',
      text:'Rappel nutrition de la semaine 🥗 Le timing protéines post-entraînement n\'est pas aussi critique qu\'on le croit — l\'apport total sur la journée prime. Par contre, bien dormir ? Ça, ça change vraiment les adaptations musculaires.',
      type:'tip', healthData:null, image:null, likes:24, comments:7, createdAt: new Date(now - 3600000*8).toISOString() },
    { id: 'post-4', userId:'coach-1', userName:'Nate Coach', userRole:'coach', userAvatar:null, userColor:'#a03848',
      text:'Run de récup ce matin — 8km en zone 2, 5h30 du mat. Le soleil qui se lève sur Paris, c\'est une autre vie. 🌅',
      type:'workout', healthData:{ platform:'strava', icon:'🚴', label:'Strava', stats:[{k:'Distance',v:'8.2 km'},{k:'Allure',v:"5'48\"/km"},{k:'Dénivelé',v:'64 m'},{k:'Calories',v:'390 kcal'}] },
      image:null, likes:31, comments:5, createdAt: new Date(now - 3600000*26).toISOString() },
    { id: 'post-5', userId:'nutri-1', userName:'Sarah Dupont', userRole:'nutritionist', userAvatar:null, userColor:'#27ae60',
      text:'Score de sommeil de cette nuit : 91/100 🛌 HRV à 62ms, FC repos 49bpm. Quand le corps récupère bien, tout s\'améliore — énergie, humeur, performance. Prenez soin de votre sommeil autant que de votre entraînement.',
      type:'recovery', healthData:{ platform:'oura', icon:'💍', label:'Oura Ring', stats:[{k:'Score sommeil',v:'91/100'},{k:'HRV',v:'62 ms'},{k:'FC repos',v:'49 bpm'},{k:'Readiness',v:'94/100'}] },
      image:null, likes:19, comments:3, createdAt: new Date(now - 3600000*30).toISOString() },
  ]
  db.posts = seedPosts
  seedPosts.forEach(p => {
    db.postLikes[p.id] = new Set()
    db.postComments[p.id] = []
  })
})()

// GET /api/community/posts?page=0&filter=all
app.get('/api/community/posts', auth, (req, res) => {
  const page = parseInt(req.query.page) || 0
  const filter = req.query.filter || 'all'
  const PAGE_SIZE = 10

  let posts = [...db.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (filter !== 'all') posts = posts.filter(p => p.type === filter)

  const slice = posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const result = slice.map(p => ({
    ...p,
    likes: db.postLikes[p.id]?.size ?? p.likes,
    likedByMe: db.postLikes[p.id]?.has(req.user.id) ?? false,
    commentCount: db.postComments[p.id]?.length ?? p.comments,
  }))
  res.json({ posts: result, hasMore: posts.length > (page + 1) * PAGE_SIZE })
})

// POST /api/community/posts
app.post('/api/community/posts', auth, (req, res) => {
  const { text, type, healthData, image } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Texte requis' })
  const user = db.users.find(u => u.id === req.user.id)
  const post = {
    id: `post-${uuidv4()}`,
    userId: req.user.id,
    userName: user?.name || 'Utilisateur',
    userRole: user?.role || 'client',
    userAvatar: user?.avatar || null,
    userColor: user?.avatarColor || '#6b7280',
    text: text.trim(),
    type: type || 'general',
    healthData: healthData || null,
    image: image || null,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  }
  db.posts.unshift(post)
  db.postLikes[post.id] = new Set()
  db.postComments[post.id] = []
  res.status(201).json(post)
})

// POST /api/community/posts/:id/like
app.post('/api/community/posts/:id/like', auth, (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id)
  if (!post) return res.status(404).json({ message: 'Post introuvable' })
  if (!db.postLikes[post.id]) db.postLikes[post.id] = new Set()
  const liked = db.postLikes[post.id].has(req.user.id)
  if (liked) db.postLikes[post.id].delete(req.user.id)
  else       db.postLikes[post.id].add(req.user.id)
  res.json({ likes: db.postLikes[post.id].size, likedByMe: !liked })
})

// GET /api/community/posts/:id/comments
app.get('/api/community/posts/:id/comments', auth, (req, res) => {
  const comments = db.postComments[req.params.id] || []
  res.json(comments)
})

// POST /api/community/posts/:id/comments
app.post('/api/community/posts/:id/comments', auth, (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Texte requis' })
  const post = db.posts.find(p => p.id === req.params.id)
  if (!post) return res.status(404).json({ message: 'Post introuvable' })
  const user = db.users.find(u => u.id === req.user.id)
  const comment = {
    id: `c-${uuidv4()}`,
    userId: req.user.id,
    userName: user?.name || 'Utilisateur',
    userRole: user?.role || 'client',
    userAvatar: user?.avatar || null,
    userColor: user?.avatarColor || '#6b7280',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
  if (!db.postComments[req.params.id]) db.postComments[req.params.id] = []
  db.postComments[req.params.id].push(comment)
  res.status(201).json(comment)
})

// DELETE /api/community/posts/:id
app.delete('/api/community/posts/:id', auth, (req, res) => {
  const idx = db.posts.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Post introuvable' })
  const post = db.posts[idx]
  if (post.userId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Interdit' })
  db.posts.splice(idx, 1)
  delete db.postLikes[req.params.id]
  delete db.postComments[req.params.id]
  res.json({ success: true })
})

// ─── ENROLLMENTS & PREMIUM ──────────────────────────────

// S'inscrire à un programme (coach ou admin)
app.post('/api/programs/:id/enroll', auth, (req, res) => {
  const program = db.programs.find(p => p.id === req.params.id)
  if (!program) return res.status(404).json({ error: 'Programme introuvable' })

  // Règles d'accès
  if (program.source === 'admin' && program.price > 0) {
    const user = db.users.find(u => u.id === req.user.id)
    if (!user?.isPremium) return res.status(403).json({ error: 'premium_required' })
  }
  // Programmes coach : accès libre (gratuit ou payant simulé)

  const already = db.enrollments.find(e => e.userId === req.user.id && e.programId === program.id)
  if (already) return res.json({ success: true, enrollment: already })

  const enrollment = {
    id: uuidv4(),
    userId: req.user.id,
    programId: program.id,
    coachId: program.coachId || null,
    source: program.source,
    enrolledAt: new Date().toISOString(),
  }
  db.enrollments.push(enrollment)
  program.enrollmentCount = (program.enrollmentCount || 0) + 1
  res.json({ success: true, enrollment })
})

// Mes inscriptions
app.get('/api/my/enrollments', auth, (req, res) => {
  const userEnrollments = db.enrollments.filter(e => e.userId === req.user.id)
  const programs = userEnrollments.map(e => {
    const prog = db.programs.find(p => p.id === e.programId)
    return prog ? { ...prog, enrolledAt: e.enrolledAt } : null
  }).filter(Boolean)
  res.json(programs)
})

// Clients inscrits aux programmes d'un coach
app.get('/api/coach/enrollments', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' })
  const coachPrograms = db.programs.filter(p => p.coachId === req.user.id).map(p => p.id)
  const enrollments = db.enrollments
    .filter(e => coachPrograms.includes(e.programId))
    .map(e => {
      const user = db.users.find(u => u.id === e.userId)
      const prog = db.programs.find(p => p.id === e.programId)
      return user ? { ...e, clientName: user.name, clientEmail: user.email, programTitle: prog?.title } : null
    }).filter(Boolean)
  res.json(enrollments)
})

// Profil public d'un coach (avec ses programmes)
app.get('/api/coach/:coachId/public', (req, res) => {
  const coach = db.users.find(u => u.id === req.params.coachId && u.role === 'coach')
  if (!coach) return res.status(404).json({ error: 'Coach introuvable' })
  const { password: _, ...safeCoach } = coach
  const programs = db.programs.filter(p => p.coachId === coach.id && p.source === 'coach')
  res.json({ coach: safeCoach, programs })
})

// Activer Premium (simulation — à remplacer par Stripe en prod)
app.post('/api/premium/activate', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  user.isPremium = true
  user.premiumSince = new Date().toISOString()
  const { password: _, ...safeUser } = user
  res.json({ success: true, user: safeUser })
})

// Statut premium
app.get('/api/premium/status', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id)
  res.json({ isPremium: user?.isPremium || false, premiumSince: user?.premiumSince || null })
})

// ─── PUSH NOTIFICATIONS ─────────────────────────────────

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BINEkEZkg3_KRlLa2clPDQLCBqqHvdMOrXZac4F0aho1cuEG_YKkcholxO3YsMQAX1QrAAgUId05uWTQfFAIbNs'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '7hp05q9glG1X1l5zeQCJRqqmZdipo2qWR1Mw1NZcSsM'

webpush.setVapidDetails('mailto:contact@ultra-app.com', VAPID_PUBLIC, VAPID_PRIVATE)

const NOTIF_MESSAGES = {
  nutrition: [
    { title: '🥗 C\'est l\'heure de logger !', body: 'Tu n\'as pas encore enregistré ton repas. 2 min suffisent.' },
    { title: '💧 Hydratation check', body: 'Tu as bu suffisamment aujourd\'hui ? L\'eau c\'est la base de la performance.' },
    { title: '🎯 Objectif calories', body: 'Vérifie où tu en es sur tes macros du jour. Chaque repas compte.' },
    { title: '🥩 Protéines du jour', body: 'Assure-toi d\'atteindre ton apport protéique aujourd\'hui pour la récupération.' },
    { title: '🍎 Anti-gaspi calorie', body: 'Ton coach a ajusté ton plan nutrition. Jette un œil aux nouvelles recommandations.' },
    { title: '⚡ Énergie en berne ?', body: 'Pense à manger avant ta prochaine séance. Les glucides sont tes alliés.' },
    { title: '📊 Bilan nutrition', body: 'Comment s\'est passée ton alimentation cette semaine ? Regarde tes stats.' },
    { title: '🌙 Dîner ce soir', body: 'N\'oublie pas de logger ton dîner pour clôturer ta journée nutritionnelle.' },
    { title: '🔥 Reste dans le plan', body: 'Tu es à 80% de tes objectifs aujourd\'hui. Un dernier effort !' },
    { title: '🍽️ Repas post-séance', body: 'La fenêtre anabolique est courte — pense à manger dans l\'heure qui suit.' },
  ],
  programme: [
    { title: '💪 Séance du jour', body: 'Ta séance t\'attend. Même 20 min c\'est mieux que zéro.' },
    { title: '🏋️ C\'est jour d\'entraînement !', body: 'Ton programme est prêt. Lance-toi, tu le regretteras jamais.' },
    { title: '🔥 Streak en jeu !', body: 'Ne casse pas ta série. Une séance aujourd\'hui et tu restes dans la course.' },
    { title: '📈 Progression cette semaine', body: 'Regarde combien tu as progressé depuis le début. Motivant, non ?' },
    { title: '⏱️ Récup\' active', body: 'Jour de repos ? Profites-en pour 10 min de mobilité ou une marche.' },
    { title: '🎯 Prochaine étape', body: 'Tu es à mi-chemin de ton programme. Continue comme ça !' },
    { title: '🧠 Mental > physique', body: 'Les jours où t\'as pas envie, c\'est là que ça se passe. Enfile tes shoes.' },
    { title: '💥 Nouveau record ?', body: 'La semaine passée tu t\'es dépassé. Aujourd\'hui tu peux faire encore mieux.' },
    { title: '🌅 Routine matinale', body: 'Une séance le matin booste ton énergie pour toute la journée. Go !' },
    { title: '📋 Ton coach a mis à jour', body: 'Regarde les ajustements de programme de cette semaine avant de t\'entraîner.' },
  ],
  communaute: [
    { title: '🌍 La communauté t\'attend', body: 'Partage ta séance du jour — tu vas motiver quelqu\'un sans le savoir.' },
    { title: '💬 Nouveau dans la communauté', body: 'Des athlètes ont posté des résultats incroyables. Va jeter un œil !' },
    { title: '🏆 Partage ta victoire', body: 'Une petite victoire aujourd\'hui ? Poste-la, elles comptent toutes.' },
    { title: '🤝 Soutiens un athlète', body: 'Quelqu\'un dans la communauté a besoin d\'encouragements. Un like peut tout changer.' },
    { title: '📸 Story de la semaine', body: 'Partage une photo de ta progression. La communauté adore voir l\'évolution.' },
    { title: '💡 Tip du jour', body: 'Tu as une astuce qui t\'a aidé ? Partage-la avec la communauté ULTRA.' },
    { title: '🔥 Challenge en cours', body: 'Un challenge communautaire est actif cette semaine. Tu es de la partie ?' },
    { title: '🎙️ Ta voix compte', body: 'Donne un avis sur un programme ou une recette. Aide les autres à choisir.' },
    { title: '🌟 Inspire les nouveaux', body: 'Les nouveaux membres ont besoin de modèles. Montre-leur comment c\'est fait.' },
    { title: '📣 Rappel communauté', body: 'Tu n\'as pas posté depuis un moment. La communauté attend de tes nouvelles.' },
  ],
}

function pickMessage(category) {
  const msgs = NOTIF_MESSAGES[category]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

async function sendPushToUser(userId, category) {
  const entry = db.pushSubscriptions[userId]
  if (!entry) return
  if (!entry.prefs[category]) return  // catégorie en sourdine
  const { title, body } = pickMessage(category)
  try {
    await webpush.sendNotification(entry.subscription, JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      category,
    }))
  } catch (err) {
    if (err.statusCode === 410) delete db.pushSubscriptions[userId]  // subscription expirée
  }
}

// Clé publique VAPID (pour le frontend)
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC })
})

// Enregistrer/mettre à jour la subscription push
app.post('/api/push/subscribe', auth, (req, res) => {
  const { subscription } = req.body
  if (!subscription) return res.status(400).json({ error: 'subscription manquante' })
  const existing = db.pushSubscriptions[req.user.id]
  db.pushSubscriptions[req.user.id] = {
    subscription,
    prefs: existing?.prefs ?? { nutrition: true, programme: true, communaute: true },
  }
  res.json({ success: true })
})

// Lire les préférences notif
app.get('/api/push/prefs', auth, (req, res) => {
  const entry = db.pushSubscriptions[req.user.id]
  res.json(entry?.prefs ?? { nutrition: true, programme: true, communaute: true })
})

// Mettre à jour les préférences notif
app.put('/api/push/prefs', auth, (req, res) => {
  const { nutrition, programme, communaute } = req.body
  if (!db.pushSubscriptions[req.user.id]) {
    db.pushSubscriptions[req.user.id] = { subscription: null, prefs: { nutrition: true, programme: true, communaute: true } }
  }
  db.pushSubscriptions[req.user.id].prefs = { nutrition: !!nutrition, programme: !!programme, communaute: !!communaute }
  res.json({ success: true })
})

// Cron jobs — tous les jours
// 07h00 → programme
cron.schedule('0 7 * * *', () => {
  Object.keys(db.pushSubscriptions).forEach(userId => sendPushToUser(userId, 'programme'))
}, { timezone: 'Europe/Paris' })

// 12h00 → nutrition
cron.schedule('0 12 * * *', () => {
  Object.keys(db.pushSubscriptions).forEach(userId => sendPushToUser(userId, 'nutrition'))
}, { timezone: 'Europe/Paris' })

// 18h00 → communauté
cron.schedule('0 18 * * *', () => {
  Object.keys(db.pushSubscriptions).forEach(userId => sendPushToUser(userId, 'communaute'))
}, { timezone: 'Europe/Paris' })

// ─── STREAK ─────────────────────────────────────────────

app.get('/api/streak', auth, (req, res) => {
  const s = db.streaks[req.user.id] || { current: 0, longest: 0, lastDate: null, history: [] }
  res.json(s)
})

app.post('/api/streak/log', auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  let s = db.streaks[req.user.id]
  if (!s) s = db.streaks[req.user.id] = { current: 0, longest: 0, lastDate: null, history: [] }

  if (s.lastDate === today) return res.json({ ...s, alreadyLogged: true })

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  s.current = s.lastDate === yesterday ? s.current + 1 : 1
  s.longest = Math.max(s.longest, s.current)
  s.lastDate = today
  if (!s.history.includes(today)) s.history.push(today)
  // Garde les 90 derniers jours
  if (s.history.length > 90) s.history = s.history.slice(-90)

  res.json(s)
})

// Log de séance complète
app.post('/api/workout/log', auth, (req, res) => {
  const { programId, exerciseLogs } = req.body
  const log = { id: uuidv4(), userId: req.user.id, programId, exerciseLogs: exerciseLogs || [], completedAt: new Date().toISOString() }
  db.workoutLogs.push(log)

  // Auto-log streak
  const today = new Date().toISOString().slice(0, 10)
  let s = db.streaks[req.user.id]
  if (!s) s = db.streaks[req.user.id] = { current: 0, longest: 0, lastDate: null, history: [] }
  if (s.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    s.current = s.lastDate === yesterday ? s.current + 1 : 1
    s.longest = Math.max(s.longest, s.current)
    s.lastDate = today
    if (!s.history.includes(today)) s.history.push(today)
    if (s.history.length > 90) s.history = s.history.slice(-90)
  }

  res.json({ success: true, log, streak: s })
})

app.get('/api/workout/logs', auth, (req, res) => {
  const logs = db.workoutLogs.filter(l => l.userId === req.user.id)
  res.json(logs)
})

// Progression par exercice (pour les graphiques)
app.get('/api/workout/exercise-progress/:exerciseName', auth, (req, res) => {
  const name = decodeURIComponent(req.params.exerciseName)
  const logs = db.workoutLogs.filter(l => l.userId === req.user.id)
  const points = []
  for (const log of logs) {
    const ex = (log.exerciseLogs || []).find(e => e.name === name)
    if (ex) {
      const bestSet = (ex.sets || []).reduce((best, s) => {
        const w = parseFloat(s.weight) || 0
        return w > (parseFloat(best?.weight) || 0) ? s : best
      }, null)
      if (bestSet) points.push({ date: log.completedAt.slice(0, 10), weight: parseFloat(bestSet.weight), reps: parseInt(bestSet.reps) || 0 })
    }
  }
  res.json(points)
})

// ─── COACH PLANS ────────────────────────────────────────

const COACH_LIMITS = { free: 3, pro: 50, elite: Infinity }

app.get('/api/coach/plan', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id)
  if (!user || user.role !== 'coach') return res.status(403).json({ error: 'Non autorisé' })
  const clientCount = db.users.filter(u => u.coachId === req.user.id).length
  const plan = user.coachPlan || 'free'
  res.json({ plan, clientCount, limit: COACH_LIMITS[plan], planSince: user.coachPlanSince })
})

// Checkout Stripe pour plan coach Pro (49€/mois)
app.post('/api/stripe/checkout-coach-pro', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
  const user = db.users.find(u => u.id === req.user.id)
  if (!user || user.role !== 'coach') return res.status(403).json({ error: 'Non autorisé' })
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          product_data: { name: '🏋️ ULTRA Coach Pro', description: 'Jusqu\'à 50 clients · Analytics avancés · Badge vérifié' },
          unit_amount: 4900,
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: { userId: user.id, type: 'coach_pro' },
      success_url: `${FRONTEND_URL}/payment/success?type=coach_pro&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/coach/upgrade`,
      locale: 'fr',
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Activer plan coach (simulation sans Stripe)
app.post('/api/coach/plan/activate', auth, (req, res) => {
  const { plan } = req.body
  const user = db.users.find(u => u.id === req.user.id)
  if (!user || user.role !== 'coach') return res.status(403).json({ error: 'Non autorisé' })
  user.coachPlan = plan || 'pro'
  user.coachPlanSince = new Date().toISOString()
  const { password: _, ...safeUser } = user
  res.json({ success: true, user: safeUser })
})

// ─── STRIPE ─────────────────────────────────────────────

// Config publique (publishable key)
app.get('/api/stripe/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null })
})

// Checkout Premium — abonnement mensuel 9,99€
app.post('/api/stripe/checkout-premium', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
  const user = db.users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_options: {
        card: { request_three_d_secure: 'automatic' },
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          product_data: {
            name: '★ ULTRA Premium',
            description: 'Accès illimité à tous les programmes, Atlas 3D, analytics, communauté',
            images: [],
          },
          unit_amount: 999, // 9,99€ en centimes
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: { userId: user.id, type: 'premium' },
      success_url: `${FRONTEND_URL}/payment/success?type=premium&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      locale: 'fr',
      allow_promotion_codes: true,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Checkout Programme — paiement unique
app.post('/api/stripe/checkout-program/:programId', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
  const user = db.users.find(u => u.id === req.user.id)
  const program = db.programs.find(p => p.id === req.params.programId)
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  if (!program) return res.status(404).json({ error: 'Programme introuvable' })
  if (program.price === 0) return res.status(400).json({ error: 'Programme gratuit' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: program.title,
            description: program.description?.slice(0, 255) || '',
          },
          unit_amount: Math.round(program.price * 100),
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: { userId: user.id, programId: program.id, type: 'program' },
      success_url: `${FRONTEND_URL}/payment/success?type=program&programId=${program.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      locale: 'fr',
      allow_promotion_codes: true,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Webhook Stripe — confirmation paiement
app.post('/api/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return res.json({ received: true })

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, type, programId } = session.metadata || {}

    if (type === 'premium' && userId) {
      const user = db.users.find(u => u.id === userId)
      if (user) {
        user.isPremium = true
        user.premiumSince = new Date().toISOString()
        user.stripeCustomerId = session.customer
        user.stripeSubscriptionId = session.subscription
        console.log(`Premium activé pour ${user.email}`)
      }
    }

    if (type === 'coach_pro' && userId) {
      const user = db.users.find(u => u.id === userId)
      if (user) {
        user.coachPlan = 'pro'
        user.coachPlanSince = new Date().toISOString()
        user.stripeCoachSubId = session.subscription
        console.log(`Coach Pro activé pour ${user.email}`)
      }
    }

    if (type === 'program' && userId && programId) {
      const already = db.enrollments.find(e => e.userId === userId && e.programId === programId)
      if (!already) {
        const program = db.programs.find(p => p.id === programId)
        db.enrollments.push({
          id: uuidv4(),
          userId,
          programId,
          paidViaStripe: true,
          stripeSessionId: session.id,
          enrolledAt: new Date().toISOString(),
        })
        if (program) program.enrollmentCount = (program.enrollmentCount || 0) + 1
        console.log(`Inscription programme ${programId} pour user ${userId}`)
      }
    }
  }

  res.json({ received: true })
})

// Vérifier le statut d'une session Stripe (après redirect success)
app.get('/api/stripe/session/:sessionId', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
    res.json({ status: session.payment_status, metadata: session.metadata })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── START ──────────────────────────────────────────────

app.listen(PORT, () => console.log(`Backend ULTRA running on http://localhost:${PORT}`))
