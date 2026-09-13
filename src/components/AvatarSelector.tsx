'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Kit definitions matching game.js PKITS + airfield (snow) overrides ─── */

const SKIN  = '#e8c99a'
const SKIN2 = '#d4b388'

interface Kit {
  id: string
  label: string
  col: string      // body / helmet colour
  band: string     // armband colour
  pal: string[]    // camo fleck palette
  mask?: boolean   // balaclava / full face-wrap
  gog?: boolean    // goggles bar
  scarf?: boolean  // neck scarf
  shades?: boolean // sunglasses
  bareHead?: boolean
  hair?: string
}

const BASE_KITS: Kit[] = [
  { id:'woodland', label:'WOODLAND', col:'#6e6a4b', band:'#2f6fd0',
    pal:['#8a7f57','#57603c','#9d8b62','#3c4230'], shades:true },
  { id:'urban',    label:'URBAN',    col:'#7b7f82', band:'#2f6fd0',
    pal:['#9aa0a3','#5e6468','#c2c6c8','#3a3f42'], mask:true, gog:true },
  { id:'ranger',   label:'RANGER',   col:'#4f5f45', band:'#2f6fd0',
    pal:['#4f5f45','#4f5f45','#57684c','#4a5941'], scarf:true },
  { id:'desert',   label:'DESERT',   col:'#9b8a63', band:'#2f6fd0',
    pal:['#b3a179','#8a7a55','#c6b389','#6e6247'], mask:true, scarf:true },
  { id:'night',    label:'NIGHT',    col:'#3a3d42', band:'#3f8fe0',
    pal:['#44484e','#2e3136','#53585f','#1f2226'], mask:true, gog:true },
]

export const ALL_KITS: Kit[] = BASE_KITS

/* ─── Portrait renderer ──────────────────────────────────────────────────── */

function hs(n: number) {
  const v = Math.sin(n * 127.1) * 43758.5453
  return v - Math.floor(v)
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.replace('#',''), 16)
  const r = Math.min(255, Math.round(((n>>16)&255)*f))
  const g = Math.min(255, Math.round(((n>>8)&255)*f))
  const b = Math.min(255, Math.round((n&255)*f))
  return `rgb(${r},${g},${b})`
}

function outl(c: CanvasRenderingContext2D, color: string, w: number) {
  c.strokeStyle = color; c.lineWidth = w; c.stroke()
}

function camoFleck(c: CanvasRenderingContext2D, seed: number, x0: number, y0: number, w: number, h: number, n: number, pal: string[]) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = pal[Math.floor(hs(seed + i * 11.3) * 4)]
    c.fillRect(x0 + hs(seed + i * 1.7) * w, y0 + hs(seed + i * 3.9) * h,
               1.4 + hs(seed + i * 5.1) * 2.8, 1.4 + hs(seed + i * 2.3) * 2.4)
  }
}

function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, r)
  } else {
    // Fallback for older browsers
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r)
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r)
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r)
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r)
    c.closePath()
  }
}

function drawPortrait(canvas: HTMLCanvasElement, kit: Kit, seed = 31) {
  const SIZE = canvas.width  // square
  const c = canvas.getContext('2d')!
  c.clearRect(0, 0, SIZE, SIZE)

  // Background: circular clip
  c.save()
  c.beginPath()
  c.arc(SIZE/2, SIZE/2, SIZE/2 - 1, 0, Math.PI*2)
  c.clip()

  // BG fill
  c.fillStyle = '#0f1828'
  c.fillRect(0, 0, SIZE, SIZE)

  // ── draw in portrait space: face centre (y≈-30) maps to canvas centre ───
  // SC chosen so ~30 game units fill the circle radius
  const SC = SIZE / 38
  c.translate(SIZE * 0.50, SIZE / 2 + 30 * SC)
  c.scale(SC, SC)

  // ── Shoulders / torso (partial) ──────────────────────────────────────────
  const col = kit.col
  const PAL = kit.pal
  c.fillStyle = col
  rrect(c, -10, -15, 20, 10, 4); c.fill()
  c.save(); rrect(c, -10, -15, 20, 10, 4); c.clip()
  camoFleck(c, seed, -10, -15.5, 20, 10, 12, PAL)
  c.restore()
  rrect(c, -10, -15, 20, 10, 4); outl(c, '#15130e', 1.8)

  // ── Tactical rig (MOLLE) ─────────────────────────────────────────────────
  c.fillStyle = shade(col, 0.88)
  rrect(c, -7, -14, 14, 8, 2.5); c.fill(); outl(c, '#15130e', 1.4)
  c.fillStyle = shade(col, 0.74)
  rrect(c, -6, -13, 4.5, 5.5, 1.2); c.fill()
  rrect(c, -0.5, -13, 4.5, 5.5, 1.2); c.fill()

  // ── Armband (Ukraine blue) ───────────────────────────────────────────────
  c.fillStyle = kit.band
  rrect(c, -13, -13, 4.5, 6, 1.5); c.fill(); outl(c, '#15130e', 1)
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-13, -11.2, 4.5, 1.2)

  // ── Neck / scarf ─────────────────────────────────────────────────────────
  if (kit.scarf) {
    c.fillStyle = shade(col, 0.72)
    rrect(c, -5.5, -19, 11, 5, 1.5); c.fill(); outl(c, '#15130e', 1)
  } else {
    c.fillStyle = kit.mask ? shade(col, 0.85) : SKIN
    rrect(c, -4, -19.5, 8, 4, 1.2); c.fill()
  }

  // ── Face / head circle ───────────────────────────────────────────────────
  c.fillStyle = kit.mask ? shade(col, 0.82) : SKIN
  c.beginPath(); c.arc(0, -28, 8.5, 0, Math.PI*2); c.fill(); outl(c, '#15130e', 1.8)

  // ── Helmet ───────────────────────────────────────────────────────────────
  c.fillStyle = shade(col, 1.1)
  c.beginPath()
  c.arc(0, -29, 9.5, Math.PI, 0)
  c.lineTo(9.5, -27.5); c.lineTo(-9.5, -27.5); c.closePath()
  c.fill()
  c.save()
  c.beginPath()
  c.arc(0, -29, 9.5, Math.PI, 0)
  c.lineTo(9.5, -27.5); c.lineTo(-9.5, -27.5); c.closePath()
  c.clip()
  camoFleck(c, seed + 40, -9, -38, 18, 12, 10, PAL)
  c.restore()
  c.beginPath()
  c.arc(0, -29, 9.5, Math.PI, 0)
  c.lineTo(9.5, -27.5); c.lineTo(-9.5, -27.5); c.closePath()
  outl(c, '#15130e', 1.8)
  // Helmet brim
  c.fillStyle = shade(col, 0.88)
  rrect(c, 4, -28.8, 7.5, 3, 1.2); c.fill(); outl(c, '#15130e', 1.2)
  // Helmet inner curve shadow line
  c.strokeStyle = 'rgba(20,18,13,.65)'; c.lineWidth = 1
  c.beginPath(); c.arc(0, -28, 7, Math.PI * 0.1, Math.PI * 0.9); c.stroke()

  // ── Goggles bar ──────────────────────────────────────────────────────────
  if (kit.gog) {
    c.fillStyle = 'rgba(40,52,58,.75)'
    rrect(c, -7.5, -33, 12, 3.5, 1.2); c.fill(); outl(c, '#15130e', 1)
  }

  // ── Face gear: balaclava eye slit or shades or bare eyes ─────────────────
  if (kit.shades) {
    // Sunglasses
    c.fillStyle = '#15130e'
    rrect(c, -6.5, -29.5, 13, 4.5, 1.5); c.fill()
    c.fillStyle = 'rgba(126,196,224,.45)'
    rrect(c, -5.8, -29, 5.5, 3.2, 1); c.fill()
    rrect(c, 1.2, -29, 5.5, 3.2, 1); c.fill()
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.fillRect(-5, -28.8, 2, 1); c.fillRect(2, -28.8, 2, 1)
    c.strokeStyle = '#0c0a07'; c.lineWidth = 1.2
    rrect(c, -6.5, -29.5, 13, 4.5, 1.5); c.stroke()
  } else if (kit.mask) {
    // Balaclava eye slit
    c.fillStyle = SKIN
    rrect(c, -5, -29.2, 10, 3.5, 1.2); c.fill()
    // Eyes
    c.fillStyle = '#15130e'
    c.beginPath(); c.arc(-2, -27.8, 1.2, 0, Math.PI*2); c.fill()
    c.beginPath(); c.arc(3.5, -27.8, 1.2, 0, Math.PI*2); c.fill()
  } else {
    // Bare face eyes
    c.fillStyle = '#15130e'
    c.beginPath(); c.arc(-2, -27.5, 1.2, 0, Math.PI*2); c.fill()
    c.beginPath(); c.arc(3.5, -27.5, 1.2, 0, Math.PI*2); c.fill()
    // Nose shadow
    c.fillStyle = SKIN2
    c.beginPath(); c.arc(0.8, -25, 1, 0, Math.PI*2); c.fill()
  }

  // ── Chin strap ───────────────────────────────────────────────────────────
  c.strokeStyle = shade(col, 0.7); c.lineWidth = 1
  c.beginPath(); c.arc(0, -28, 9, Math.PI * 0.15, Math.PI * 0.85); c.stroke()

  c.restore()  // clip restore (portrait circle)
}

/* ─── Selector component ─────────────────────────────────────────────────── */

const UA = {
  bg:      '#09101f',
  surface: '#0f1828',
  border:  'rgba(0,104,204,0.16)',
  borderFaint: 'rgba(0,104,204,0.08)',
  yellow:  '#ffd700',
  blue:    '#0068cc',
  blueMid: '#4a9eff',
  text:    '#d8e8ff',
  muted:   '#4a6080',
  dim:     '#243040',
}

interface Props {
  current: string | null
  onSave: (kitId: string) => void
  saving?: boolean
}

export function AvatarSelector({ current, onSave, saving }: Props) {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    ALL_KITS.forEach((kit, i) => {
      const canvas = canvasRefs.current[kit.id]
      if (canvas) drawPortrait(canvas, kit, 31 + i * 17)
    })
  }, [])

  function handleSelect(kitId: string) {
    if (saving) return
    setPending(kitId)
    onSave(kitId)
  }

  const selected = saving && pending ? pending : (current ?? null)

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {ALL_KITS.map((kit, i) => (
        <AvatarThumb
          key={kit.id}
          kit={kit}
          idx={i}
          selected={selected === kit.id}
          canvasRefs={canvasRefs}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}

function AvatarThumb({
  kit, idx, selected, canvasRefs, onSelect,
}: {
  kit: Kit; idx: number; selected: boolean
  canvasRefs: React.MutableRefObject<Record<string, HTMLCanvasElement | null>>
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(kit.id)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        outline: 'none',
      }}
    >
      <div style={{
        borderRadius: '50%',
        border: selected
          ? `2.5px solid ${UA.yellow}`
          : `2px solid rgba(0,104,204,0.3)`,
        boxShadow: selected ? `0 0 8px rgba(255,215,0,0.45)` : 'none',
        transition: 'border-color .15s, box-shadow .15s',
        overflow: 'hidden',
        width: 64, height: 64,
        flexShrink: 0,
      }}>
        <canvas
          width={64}
          height={64}
          ref={el => { canvasRefs.current[kit.id] = el }}
          style={{ display: 'block' }}
        />
      </div>
      <span style={{
        fontSize: 6, fontWeight: 900, letterSpacing: '1.2px',
        color: selected ? UA.yellow : UA.muted,
        textTransform: 'uppercase',
        textAlign: 'center',
        maxWidth: 64,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {kit.label.replace(' SNOW', '')}
      </span>
    </button>
  )
}

/* ─── Small avatar display (for sidebar / header) ────────────────────────── */

export function AvatarBadge({ kitId, size = 40 }: { kitId: string | null; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const kit = ALL_KITS.find(k => k.id === kitId)

  useEffect(() => {
    if (!canvasRef.current) return
    if (kit) {
      drawPortrait(canvasRef.current, kit, 31)
    } else {
      // Default: initials placeholder — draw empty (caller renders initials on top)
      const c = canvasRef.current.getContext('2d')!
      c.clearRect(0, 0, size, size)
    }
  }, [kit, size])

  if (!kit) return null

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: '50%' }}
    />
  )
}
