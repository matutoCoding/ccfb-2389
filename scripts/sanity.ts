// 展开数学冒烟验证: node scripts/sanity.ts
import { computeLayout, bendAllowance, neutralRadius } from '../src/lib/bend_math.ts'
import { segIntersect, holeAabb, aabbIntersect } from '../src/lib/geometry.ts'

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
  console.log('ok:', msg)
}

// 内置双折弯槽件参数: T=2 K=0.44 R=2 90°
const nr = neutralRadius(2, 0.44, 2)
assert(Math.abs(nr - 2.88) < 1e-9, `中性层半径 R+KT = ${nr}`)

const ba = bendAllowance(90, 2, 0.44, 2)
assert(Math.abs(ba - Math.PI / 2 * 2.88) < 1e-9, `90° 中性层弧长 = ${ba.toFixed(4)}`)

const layout = computeLayout({
  thickness: 2,
  kFactor: 0.44,
  segments: [{ length: 40 }, { length: 30 }, { length: 40 }],
  bends: [
    { angle: 90, radius: 2 },
    { angle: 90, radius: 2 },
  ],
})
const expectTotal = 110 + 2 * ba
assert(Math.abs(layout.total - expectTotal) < 1e-9, `展开总长 = ${layout.total.toFixed(4)} (直段110 + 弧长${(2 * ba).toFixed(4)})`)
assert(Math.abs(layout.straightSum - 110) < 1e-9, '直段合计 110')
assert(layout.bendX[0].x0 === 40 && Math.abs(layout.bendX[0].x1 - 44.5239) < 1e-3, `弯1 区间 [40, ${layout.bendX[0].x1.toFixed(4)}]`)

// 跨弯孔判定用包围盒: x=42.3 d=3 应落在弯1区间 [40, 44.52] 内
const box = holeAabb({ type: 'circle', x: 42.3, y: 30, d: 3 })
const cross = box.x0 < layout.bendX[0].x1 && box.x1 > layout.bendX[0].x0
assert(cross, `跨弯孔 [${box.x0}, ${box.x1}] 与弯区相交`)

// 线段求交
const hit = segIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 }, { x: 5, y: 5 })
assert(hit && Math.abs(hit.x - 5) < 1e-9 && Math.abs(hit.y) < 1e-9, '线段求交 (5,0)')
assert(segIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }) === null, '平行线不相交')

// 重叠判定
assert(aabbIntersect(holeAabb({ type: 'circle', x: 10, y: 10, d: 8 }), holeAabb({ type: 'slot', x: 14, y: 10, len: 6, wid: 4 })), '孔重叠可检出')

console.log('\n全部通过')
