// 3D body for "My body": the human model converted from BASEmodel.blend (public/models/human.glb).
// Each zone (head, neck, torso, arms, legs) is a separate mesh, painted with the state the Ixchel
// engine reports. Drag to rotate, scroll to zoom, click a zone to open its panel.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { StatusKind } from './ixchel'

export type Zone = 'head' | 'neck' | 'torso' | 'arms' | 'legs'
const ZONES: Zone[] = ['head', 'neck', 'torso', 'arms', 'legs']

// Same palette as the ARMOR status marks (index.css): moss = normal, alert = attention, red = critical.
const KIND_COLOR: Record<StatusKind, string> = {
  normal: '#889063',
  attention: '#f2c94c',
  critical: '#b42318',
  model: '#c8b46a',
  empty: '#c9bfae',
  protocol: '#889063',
}

const MODEL_URL = `${import.meta.env.BASE_URL}models/human.glb`

export function Body3D({ zones, selected, onSelect }: { zones: Record<Zone, StatusKind>; selected: Zone | null; onSelect: (zone: Zone) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const materials = useRef<Partial<Record<Zone, THREE.MeshStandardMaterial>>>({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  // scene, camera, controls and model: created once
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x4c3d19, 1.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.8)
    key.position.set(3, 6, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xe5d7c4, 0.8)
    rim.position.set(-4, 3, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minPolarAngle = Math.PI * 0.2
    controls.maxPolarAngle = Math.PI * 0.8
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !reduceMotion
    controls.autoRotateSpeed = 0.9
    controls.addEventListener('start', () => { controls.autoRotate = false })

    const meshes: THREE.Mesh[] = []
    let disposed = false
    new GLTFLoader().load(
      MODEL_URL,
      gltf => {
        if (disposed) return
        gltf.scene.traverse(obj => {
          const mesh = obj as THREE.Mesh
          if (!mesh.isMesh) return
          const zone = (ZONES as string[]).includes(mesh.name) ? (mesh.name as Zone) : (ZONES as string[]).includes(mesh.parent?.name ?? '') ? (mesh.parent!.name as Zone) : null
          if (!zone) return
          const material = new THREE.MeshStandardMaterial({ color: KIND_COLOR.normal, roughness: 0.75, metalness: 0 })
          mesh.material = material
          mesh.userData.zone = zone
          materials.current[zone] = material
          meshes.push(mesh)
        })
        scene.add(gltf.scene)
        // frame the whole body
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        controls.target.copy(center)
        const dist = (size.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.15
        camera.position.set(center.x, center.y + size.y * 0.05, center.z + dist)
        controls.minDistance = dist * 0.45
        controls.maxDistance = dist * 1.6
        controls.update()
        setState('ready')
      },
      undefined,
      () => { if (!disposed) setState('error') },
    )

    // click (not drag) on a zone selects it
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const zoneAt = (event: PointerEvent): Zone | null => {
      const r = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(pointer, camera)
      const hit = ray.intersectObjects(meshes, false)[0]
      return (hit?.object.userData.zone as Zone | undefined) ?? null
    }
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) {
        const zone = zoneAt(e)
        if (zone) onSelectRef.current(zone)
      }
      down = null
    }
    const onMove = (e: PointerEvent) => { if (!down) renderer.domElement.style.cursor = zoneAt(e) ? 'pointer' : 'grab' }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointermove', onMove)

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      controls.update()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointermove', onMove)
      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry.dispose()
          ;(mesh.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
      materials.current = {}
    }
  }, [])

  // paint each zone with its state; the selected zone glows a little
  useEffect(() => {
    for (const zone of ZONES) {
      const material = materials.current[zone]
      if (!material) continue
      const color = new THREE.Color(KIND_COLOR[zones[zone]])
      material.color.copy(color)
      material.emissive.copy(color)
      material.emissiveIntensity = zone === selected ? 0.45 : 0
    }
  }, [zones, selected, state])

  return (
    <div className="body3d" ref={hostRef} aria-hidden="true">
      {state === 'loading' && <p className="body3d-note">Loading 3D model…</p>}
      {state === 'error' && <p className="body3d-note">The 3D model could not be loaded ({MODEL_URL}).</p>}
    </div>
  )
}
