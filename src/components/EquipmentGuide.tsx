'use client'

import { useState } from 'react'

const tools = [
  ['droneS', 'Scout Drone', 'Recon', 'A compact camera drone for scouting ahead, with a small blast when detonated.'],
  ['drone', 'FPV Drone', 'Precision strike', 'Pilot a fast attack drone into position, then detonate it against your target.'],
  ['droneL', 'Heavy Drone', 'Heavy strike', 'A larger explosive payload for tougher enemies and clustered targets.'],
  ['usv', 'Sea Drone', 'Sector 3', 'Steer an explosive surface drone through the water to attack enemy ships.'],
  ['sentry', 'Sentry Gun', 'Defense', 'Deploy an automatic gun to cover your position while you move or fight.'],
  ['strike', 'Fire Mission', 'Area attack', 'Call in a series of delayed strikes around a target area.'],
  ['stim', 'Combat Stim', 'Boost', 'Temporarily increases movement speed and rate of fire.'],
  ['smoke', 'Smoke', 'Cover', 'Creates a cloud that blocks enemy sight, giving you room to reposition.'],
  ['incend', 'Incendiary', 'Area denial', 'An initial blast leaves burning patches that damage anyone standing in them.'],
  ['flamer', 'Flamethrower', 'Fire', 'Hold fire to project a long stream of flames and set enemies alight.'],
  ['emp', 'Drone Jammer', 'Anti-drone', 'Releases an electronic burst to take down nearby enemy drones.'],
  ['med', 'Field Kit', 'Recovery', 'Restores health when you need to get back into the fight.'],
  ['plate', 'Armour Plate', 'Protection', 'Replenishes armour to absorb more incoming damage.'],
]
const weapons = [
  ['pistol', 'M9 Pistol', 'Sidearm · 12 rounds', 'A controlled, steady-firing starting weapon with a compact magazine.'],
  ['smg', 'Vector-9', 'SMG · 32 rounds', 'Rapid automatic fire for close encounters. Lower damage per round, with a wider spread.'],
  ['rifle', 'AK-74', 'Assault rifle · 30 rounds', 'Balanced automatic fire, solid damage and tighter spread than the SMG.'],
  ['shotgun', 'Breacher 12', 'Shotgun · 6 rounds', 'Eight pellets per shot deliver a powerful spread up close. Allow time between shots.'],
  ['dmr', 'Marksman', 'DMR · 10 rounds', 'High damage, tight accuracy and penetrating rounds, balanced by a slower firing pace.'],
  ['lmg', 'Bulldog LMG', 'Machine gun · 100 rounds', 'A large magazine and rapid automatic fire for sustained pressure, with a broad spread.'],
  ['railgun', 'Railgun', 'Rail weapon · 3 shots', 'A high-damage energy beam that cuts through terrain and multiple targets in a straight line. Three shots, no reserve ammo.'],
]

export function EquipmentGuide() {
  const [view, setView] = useState<'tools' | 'weapons'>('tools')
  const entries = view === 'tools' ? tools : weapons
  return <section className="py-7 sm:py-10 border-b border-white/10" aria-labelledby="equipment-title">
    <div className="flex items-center gap-3 mb-3"><span className="h-px w-8 bg-[#0057b7]" /><p className="text-[9px] font-black tracking-[3px] uppercase text-[#ffd700]">Field guide</p></div>
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
      <div><h2 id="equipment-title" className="text-2xl sm:text-3xl font-black text-[#f2ead2]">Know your equipment.</h2><p className="text-sm text-[#a9b4b9] mt-2 max-w-md leading-relaxed">Choose the right tool for the job. Get to know your drones, support gear and seven gun types before you deploy.</p></div>
      <div className="flex gap-2 shrink-0" aria-label="Equipment category">
        {(['tools', 'weapons'] as const).map(tab => <button key={tab} type="button" aria-pressed={view === tab} onClick={() => setView(tab)} className="rounded px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-colors" style={{ color: view === tab ? '#ffd700' : '#b2c2cc', background: view === tab ? '#0057b7' : '#101c26', borderColor: view === tab ? '#287ac9' : '#283b49' }}>{tab} · {tab === 'tools' ? tools.length : weapons.length}</button>)}
      </div>
    </div>
    <div className="mt-5 mb-4 flex items-center justify-between gap-3 text-[10px] text-[#93a7b5] uppercase tracking-wider"><span>{view === 'tools' ? '13 tools · Six belt slots' : 'Seven gun types · Different strengths'}</span><span className="text-[#ffd700]">Equipment briefing</span></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {entries.map(([id, name, role, description], index) => <article key={id} className="overflow-hidden rounded-lg border border-[#263746] bg-[#0d1720]">
        <div className="relative h-32 flex items-center justify-center border-b border-[#263746]" style={{ background: 'radial-gradient(ellipse at center, #20384b 0%, #101e2a 70%)' }}>
          <span className="absolute top-3 left-3 text-[9px] tracking-widest text-[#728b9d]">{String(index + 1).padStart(2, '0')}</span>
          {/* The adjacent title identifies the illustration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/equipment/${id}.png${id === 'railgun' || id === 'drone' ? '?v=2' : ''}`} alt="" loading="lazy" width={400} height={240} className="w-full h-full object-contain px-6 py-2" />
          <span className="absolute bottom-3 right-3 w-5 h-0.5 bg-[#ffd700]" />
        </div>
        <div className="p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-[#79b9f1] mb-2">{role}</p><h3 className="font-black text-base text-[#f2ead2]">{name}</h3><p className="mt-2 text-xs leading-relaxed text-[#b0bdc6]">{description}</p></div>
      </article>)}
    </div>
  </section>
}
