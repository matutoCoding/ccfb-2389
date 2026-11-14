<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { store, outline } from '../store'

const el = ref<HTMLDivElement>()

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let mesh: THREE.Mesh | null = null
let raf = 0
let ro: ResizeObserver

// 截面轮廓沿板宽拉伸成实体
const rebuild = () => {
  const pts = outline.value
  if (pts.length < 3) return
  const shape = new THREE.Shape(pts.map((pt) => new THREE.Vector2(pt.x, pt.y)))
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: store.project.width,
    bevelEnabled: false,
  })
  geo.translate(0, 0, -store.project.width / 2)
  geo.computeBoundingSphere()
  if (mesh) {
    mesh.geometry.dispose()
    mesh.geometry = geo
  } else {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8fa3bd,
      metalness: 0.55,
      roughness: 0.4,
      side: THREE.DoubleSide,
    })
    mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)
  }
  fitCamera(geo.boundingSphere!)
}

const fitCamera = (bs: THREE.Sphere) => {
  const r = Math.max(bs.radius, 1)
  camera.position.set(bs.center.x + r * 1.6, bs.center.y + r * 1.2, bs.center.z + r * 1.6)
  camera.near = r / 100
  camera.far = r * 20
  camera.updateProjectionMatrix()
  controls.target.copy(bs.center)
  controls.update()
}

const tick = () => {
  raf = requestAnimationFrame(tick)
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  const box = el.value!
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  box.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.1))
  const dir = new THREE.DirectionalLight(0xffffff, 1.4)
  dir.position.set(120, 180, 90)
  scene.add(dir)

  const grid = new THREE.GridHelper(400, 40, 0xcbd5e1, 0xe2e8f0)
  grid.position.y = -60
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const resize = () => {
    const w = box.clientWidth
    const h = box.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  ro = new ResizeObserver(resize)
  ro.observe(box)
  resize()

  rebuild()
  tick()
})

watch(outline, rebuild)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro.disconnect()
  controls.dispose()
  mesh?.geometry.dispose()
  ;(mesh?.material as THREE.Material | undefined)?.dispose()
  renderer.dispose()
  renderer.domElement.remove()
})
</script>

<template>
  <div ref="el" class="three-view" />
</template>

<style scoped>
.three-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius);
}
.three-view :deep(canvas) {
  display: block;
}
</style>
