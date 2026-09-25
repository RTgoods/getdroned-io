'use client'

import { useEffect, useRef, useState } from 'react'
import { drawPilotBody } from './pilot-portrait.generated'

/* ─── Kit definitions matching game.js PKITS + airfield (snow) overrides ─── */


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
  { id:'woodland', label:'ROOK', col:'#6e6a4b', band:'#2f6fd0',
    pal:['#8a7f57','#57603c','#9d8b62','#3c4230'], shades:true },
  { id:'urban',    label:'GHOST',    col:'#7b7f82', band:'#2f6fd0',
    pal:['#9aa0a3','#5e6468','#c2c6c8','#3a3f42'], mask:true, gog:true },
  { id:'ranger',   label:'TALON',   col:'#4f5f45', band:'#2f6fd0',
    pal:['#4f5f45','#4f5f45','#57684c','#4a5941'], scarf:true },
  { id:'desert',   label:'NOMAD',   col:'#9b8a63', band:'#2f6fd0',
    pal:['#b3a179','#8a7a55','#c6b389','#6e6247'], mask:true, scarf:true },
  { id:'night',    label:'WRAITH',    col:'#3a3d42', band:'#3f8fe0',
    pal:['#44484e','#2e3136','#53585f','#1f2226'], mask:true, gog:true },
]

export const ALL_KITS: Kit[] = [...BASE_KITS, { id: 'god', label: 'Nolan', col: '#b9b9a0', band: '#f2c744', pal: ['#dedbc5','#bfc4ad','#939c83','#c9c7b1'], bareHead: true, hair: '#d5b65f' }]

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
      if (canvas) drawPilotBody(canvas, kit)
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
        borderRadius: 8,
        border: selected
          ? `2.5px solid ${UA.yellow}`
          : `2px solid rgba(0,104,204,0.3)`,
        boxShadow: selected ? `0 0 8px rgba(255,215,0,0.45)` : 'none',
        transition: 'border-color .15s, box-shadow .15s',
        overflow: 'hidden',
        width: 96, height: 112,
        flexShrink: 0,
      }}>
        <canvas
          width={192}
          height={224}
          ref={el => { canvasRefs.current[kit.id] = el }}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
      <span style={{
        fontSize: 6, fontWeight: 900, letterSpacing: '1.2px',
        color: selected ? UA.yellow : UA.muted,
        textTransform: 'uppercase',
        textAlign: 'center',
        maxWidth: 96,
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
      // Crop the exact selection artwork: same pose and face, framed as a bust.
      const portrait = document.createElement('canvas')
      portrait.width = 192
      portrait.height = 224
      drawPilotBody(portrait, kit)
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.clearRect(0, 0, 192, 192)
        context.drawImage(portrait, 43, 58, 82, 82, 0, 0, 192, 192)
      }
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
      width={192}
      height={192}
      style={{ display: 'block', width: size, height: size, flexShrink: 0 }}
    />
  )
}
