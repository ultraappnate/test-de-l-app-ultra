import { useRef, useState, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import { MUSCLE_COLORS } from '../data/muscles'

/* ════════════════════════════════════════════════════════════
   ANATOMY MODEL — charge un vrai modèle musculaire .glb et le pilote
   (surbrillance par maille/muscle, clic → sélection, rotation 360°).

   Config :
     VITE_ANATOMY_MODEL_URL = URL/chemin du .glb (ex: /models/anatomy.glb)

   Props :
     highlights : { '<patternNom>': 'primary'|'secondary' }
                  → toute maille dont le nom contient le pattern est colorée
     selected   : nom de maille sélectionnée (clic)
     onSelect   : (meshName) => void
     autoRotate : bool
   ════════════════════════════════════════════════════════════ */

const COL = {
  primary:   new THREE.Color(MUSCLE_COLORS.primary),
  secondary: new THREE.Color(MUSCLE_COLORS.secondary),
  skin:      new THREE.Color('#b8806a'),
  selected:  new THREE.Color('#3b82f6'),
}

function norm(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/* Niveau de surbrillance d'une maille selon son nom */
function levelFor(meshName, highlights) {
  const n = norm(meshName)
  for (const [pattern, level] of Object.entries(highlights)) {
    if (n.includes(norm(pattern))) return level
  }
  return null
}

function Model({ url, highlights, selected, onSelect }) {
  const { scene } = useGLTF(url)
  const group = useRef()

  // Clone pour pouvoir modifier les matériaux sans toucher au cache
  const cloned = useMemo(() => scene.clone(true), [scene])

  // Prépare chaque maille : matériau propre + référence
  const meshes = useMemo(() => {
    const list = []
    cloned.traverse(o => {
      if (o.isMesh) {
        o.material = o.material.clone()
        o.material.transparent = true
        o.castShadow = true
        o.userData.baseColor = o.material.color ? o.material.color.clone() : COL.skin.clone()
        list.push(o)
      }
    })
    return list
  }, [cloned])

  // Applique les couleurs selon highlights / selected
  useEffect(() => {
    meshes.forEach(o => {
      const lvl = levelFor(o.name, highlights)
      const isSel = selected && norm(o.name).includes(norm(selected))
      const mat = o.material
      if (lvl === 'primary')      { mat.color.copy(COL.primary);   mat.emissive = COL.primary.clone();   mat.emissiveIntensity = 0.5; mat.opacity = 1 }
      else if (lvl === 'secondary'){ mat.color.copy(COL.secondary); mat.emissive = COL.secondary.clone(); mat.emissiveIntensity = 0.4; mat.opacity = 1 }
      else if (isSel)             { mat.emissive = COL.selected.clone(); mat.emissiveIntensity = 0.4; mat.opacity = 1 }
      else                        { mat.color.copy(o.userData.baseColor); if (mat.emissive) mat.emissiveIntensity = 0; mat.opacity = 0.97 }
      mat.needsUpdate = true
    })
  }, [meshes, highlights, selected])

  // Pulsation des muscles actifs
  useFrame(({ clock }) => {
    meshes.forEach(o => {
      const lvl = levelFor(o.name, highlights)
      if (lvl) o.material.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.18
    })
  })

  return (
    <group ref={group}
      onPointerDown={(e) => { e.stopPropagation(); if (e.object?.name) onSelect(e.object.name) }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <primitive object={cloned} />
    </group>
  )
}

function Rig({ autoRotate, children }) {
  const ref = useRef()
  useFrame((_, dt) => { if (autoRotate && ref.current) ref.current.rotation.y += dt * 0.3 })
  return <group ref={ref}>{children}</group>
}

export default function AnatomyModel({ url, highlights = {}, selected, onSelect = () => {}, autoRotate = true }) {
  return (
    <Canvas
      shadows dpr={[1, 2]}
      camera={{ position: [0, 0.2, 3], fov: 42 }}
      onCreated={({ gl }) => gl.setClearColor('#000000', 0)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
      resize={{ scroll: false }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 1, -2]} intensity={0.5} color="#88aaff" />
      <pointLight position={[0, 1, 3]} intensity={0.4} />

      <Suspense fallback={null}>
        <Rig autoRotate={autoRotate}>
          <Bounds fit clip observe margin={1.1}>
            <Center>
              <Model url={url} highlights={highlights} selected={selected} onSelect={onSelect} />
            </Center>
          </Bounds>
        </Rig>
        <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={4} blur={2.5} far={2} />
      </Suspense>

      <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6}
        minPolarAngle={Math.PI * 0.1} maxPolarAngle={Math.PI * 0.9} />
    </Canvas>
  )
}
