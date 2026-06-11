import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { MUSCLE_COLORS } from '../data/muscles'

/* ════════════════════════════════════════════════════════════
   CORPS HUMAIN 3D — segmenté par groupe musculaire
   Chaque mesh porte un `muscle` (id) → surbrillance + clic.
   Rotation 360° (OrbitControls), pseudo-anatomie médicale.
   ════════════════════════════════════════════════════════════ */

const SKIN = '#c08c74'
const BONE = '#e8ddd2'

/* Un muscle = un mesh paramétrable et cliquable */
function Muscle({ muscle, geometry, position, rotation = [0, 0, 0], scale = 1,
                  highlights, selected, onSelect, base = false }) {
  const ref = useRef()
  const level = highlights[muscle]
  const isSel = selected === muscle

  const color = level === 'primary' ? MUSCLE_COLORS.primary
              : level === 'secondary' ? MUSCLE_COLORS.secondary
              : base ? BONE : SKIN
  const emissive = level === 'primary' ? MUSCLE_COLORS.primary
                 : level === 'secondary' ? MUSCLE_COLORS.secondary
                 : isSel ? '#3b82f6' : '#000000'

  // Pulsation douce sur muscle actif
  useFrame(({ clock }) => {
    if (!ref.current) return
    const active = level === 'primary' || level === 'secondary'
    const target = active ? 0.45 + Math.sin(clock.elapsedTime * 3) * 0.18
                  : isSel ? 0.4 : 0
    ref.current.material.emissiveIntensity +=
      (target - ref.current.material.emissiveIntensity) * 0.15
  })

  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={scale}
      geometry={geometry}
      onPointerDown={(e) => { if (!base && muscle) { e.stopPropagation(); onSelect(muscle) } }}
      onPointerOver={(e) => { if (!base) { e.stopPropagation(); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <meshStandardMaterial color={color} emissive={emissive}
        emissiveIntensity={0} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

/* Construit l'ensemble du corps */
function BodyRig({ highlights, selected, onSelect, autoRotate }) {
  const group = useRef()

  // Géométries réutilisables
  const geo = useMemo(() => ({
    capsule: new THREE.CapsuleGeometry(1, 1, 6, 16),
    sphere:  new THREE.SphereGeometry(1, 24, 20),
    box:     new THREE.BoxGeometry(1, 1, 1),
  }), [])

  useFrame((_, dt) => {
    if (autoRotate && group.current) group.current.rotation.y += dt * 0.35
  })

  // Helper raccourci
  const M = (props) => <Muscle highlights={highlights} selected={selected} onSelect={onSelect} {...props} />

  return (
    <group ref={group} position={[0, -0.95, 0]}>

      {/* ── Tête / cou (base) ── */}
      <M base muscle="head" geometry={geo.sphere} position={[0, 1.74, 0]} scale={[0.15, 0.18, 0.16]} />
      <M muscle="neck" geometry={geo.capsule} position={[0, 1.56, 0]} scale={[0.06, 0.05, 0.06]} />

      {/* ── Tronc base (cage) ── */}
      <M base muscle="core" geometry={geo.capsule} position={[0, 1.20, 0]} scale={[0.18, 0.16, 0.12]} />
      <M base muscle="pelvis" geometry={geo.sphere} position={[0, 0.95, 0]} scale={[0.17, 0.13, 0.13]} />

      {/* ── FACE AVANT ── */}
      {/* Pectoraux */}
      <M muscle="chest" geometry={geo.sphere} position={[-0.09, 1.34, 0.09]} scale={[0.10, 0.08, 0.07]} />
      <M muscle="chest" geometry={geo.sphere} position={[ 0.09, 1.34, 0.09]} scale={[0.10, 0.08, 0.07]} />
      {/* Abdominaux (3 étages) */}
      {[1.20, 1.10, 1.00].map((y, i) => (
        <M key={i} muscle="abs" geometry={geo.box} position={[0, y, 0.13]} scale={[0.14, 0.07, 0.04]} />
      ))}
      {/* Obliques */}
      <M muscle="obliques" geometry={geo.capsule} position={[-0.14, 1.08, 0.07]} scale={[0.035, 0.10, 0.05]} />
      <M muscle="obliques" geometry={geo.capsule} position={[ 0.14, 1.08, 0.07]} scale={[0.035, 0.10, 0.05]} />

      {/* Deltoïdes antérieurs */}
      <M muscle="front_delts" geometry={geo.sphere} position={[-0.25, 1.44, 0.04]} scale={0.085} />
      <M muscle="front_delts" geometry={geo.sphere} position={[ 0.25, 1.44, 0.04]} scale={0.085} />

      {/* Biceps */}
      <M muscle="biceps" geometry={geo.capsule} position={[-0.29, 1.24, 0.04]} rotation={[0, 0, 0.12]} scale={[0.05, 0.09, 0.05]} />
      <M muscle="biceps" geometry={geo.capsule} position={[ 0.29, 1.24, 0.04]} rotation={[0, 0, -0.12]} scale={[0.05, 0.09, 0.05]} />

      {/* ── FACE ARRIÈRE ── */}
      {/* Trapèzes */}
      <M muscle="traps" geometry={geo.sphere} position={[0, 1.42, -0.09]} scale={[0.16, 0.10, 0.06]} />
      {/* Grand dorsal */}
      <M muscle="lats" geometry={geo.capsule} position={[-0.13, 1.18, -0.09]} rotation={[0, 0, 0.3]} scale={[0.06, 0.12, 0.05]} />
      <M muscle="lats" geometry={geo.capsule} position={[ 0.13, 1.18, -0.09]} rotation={[0, 0, -0.3]} scale={[0.06, 0.12, 0.05]} />
      {/* Lombaires */}
      <M muscle="lower_back" geometry={geo.box} position={[0, 1.02, -0.11]} scale={[0.12, 0.12, 0.05]} />
      {/* Deltoïdes postérieurs */}
      <M muscle="rear_delts" geometry={geo.sphere} position={[-0.25, 1.44, -0.05]} scale={0.07} />
      <M muscle="rear_delts" geometry={geo.sphere} position={[ 0.25, 1.44, -0.05]} scale={0.07} />
      {/* Triceps */}
      <M muscle="triceps" geometry={geo.capsule} position={[-0.29, 1.24, -0.04]} rotation={[0, 0, 0.12]} scale={[0.05, 0.09, 0.05]} />
      <M muscle="triceps" geometry={geo.capsule} position={[ 0.29, 1.24, -0.04]} rotation={[0, 0, -0.12]} scale={[0.05, 0.09, 0.05]} />

      {/* ── AVANT-BRAS (les deux faces) ── */}
      <M muscle="forearms" geometry={geo.capsule} position={[-0.33, 1.00, 0.02]} rotation={[0, 0, 0.1]} scale={[0.045, 0.10, 0.045]} />
      <M muscle="forearms" geometry={geo.capsule} position={[ 0.33, 1.00, 0.02]} rotation={[0, 0, -0.1]} scale={[0.045, 0.10, 0.045]} />
      {/* Mains (base) */}
      <M base muscle="handL" geometry={geo.sphere} position={[-0.35, 0.84, 0.02]} scale={0.05} />
      <M base muscle="handR" geometry={geo.sphere} position={[ 0.35, 0.84, 0.02]} scale={0.05} />

      {/* ── FESSIERS ── */}
      <M muscle="glutes" geometry={geo.sphere} position={[-0.10, 0.88, -0.10]} scale={[0.10, 0.10, 0.09]} />
      <M muscle="glutes" geometry={geo.sphere} position={[ 0.10, 0.88, -0.10]} scale={[0.10, 0.10, 0.09]} />

      {/* ── CUISSES ── */}
      {/* Quadriceps (avant) */}
      <M muscle="quads" geometry={geo.capsule} position={[-0.10, 0.66, 0.05]} scale={[0.075, 0.17, 0.07]} />
      <M muscle="quads" geometry={geo.capsule} position={[ 0.10, 0.66, 0.05]} scale={[0.075, 0.17, 0.07]} />
      {/* Ischio-jambiers (arrière) */}
      <M muscle="hamstrings" geometry={geo.capsule} position={[-0.10, 0.66, -0.05]} scale={[0.065, 0.16, 0.06]} />
      <M muscle="hamstrings" geometry={geo.capsule} position={[ 0.10, 0.66, -0.05]} scale={[0.065, 0.16, 0.06]} />
      {/* Adducteurs (intérieur) */}
      <M muscle="adductors" geometry={geo.capsule} position={[-0.04, 0.70, 0.0]} scale={[0.035, 0.13, 0.05]} />
      <M muscle="adductors" geometry={geo.capsule} position={[ 0.04, 0.70, 0.0]} scale={[0.035, 0.13, 0.05]} />

      {/* Genoux (base) */}
      <M base muscle="kneeL" geometry={geo.sphere} position={[-0.10, 0.46, 0.02]} scale={0.06} />
      <M base muscle="kneeR" geometry={geo.sphere} position={[ 0.10, 0.46, 0.02]} scale={0.06} />

      {/* ── MOLLETS ── */}
      <M muscle="calves" geometry={geo.capsule} position={[-0.10, 0.27, -0.02]} scale={[0.06, 0.14, 0.06]} />
      <M muscle="calves" geometry={geo.capsule} position={[ 0.10, 0.27, -0.02]} scale={[0.06, 0.14, 0.06]} />
      {/* Tibias avant (base) */}
      <M base muscle="shinL" geometry={geo.capsule} position={[-0.10, 0.27, 0.04]} scale={[0.04, 0.13, 0.035]} />
      <M base muscle="shinR" geometry={geo.capsule} position={[ 0.10, 0.27, 0.04]} scale={[0.04, 0.13, 0.035]} />
      {/* Pieds (base) */}
      <M base muscle="footL" geometry={geo.box} position={[-0.10, 0.04, 0.06]} scale={[0.07, 0.04, 0.16]} />
      <M base muscle="footR" geometry={geo.box} position={[ 0.10, 0.04, 0.06]} scale={[0.07, 0.04, 0.16]} />
    </group>
  )
}

/* Indicateur de chargement / fallback WebGL */
function Loader() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
      Chargement du modèle 3D…
    </div>
  )
}

export default function Body3D({ highlights = {}, selected, onSelect = () => {}, autoRotate = true }) {
  const [ok, setOk] = useState(true)
  if (!ok) return <Loader />

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 3.0], fov: 42 }}
      onCreated={({ gl }) => { gl.setClearColor('#000000', 0) }}
      onError={() => setOk(false)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
      resize={{ scroll: false, debounce: 0 }}>

      {/* Éclairage type studio médical */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 1, -2]} intensity={0.5} color="#88aaff" />
      <pointLight position={[0, 1, 3]} intensity={0.4} />

      <BodyRig highlights={highlights} selected={selected} onSelect={onSelect} autoRotate={autoRotate} />

      <ContactShadows position={[0, -0.96, 0]} opacity={0.35} scale={3} blur={2.5} far={1.5} />

      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={4.5}
        target={[0, -0.05, 0]}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85} />
    </Canvas>
  )
}
