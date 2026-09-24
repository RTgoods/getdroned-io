'use client'

import { useSiteLanguage } from '@/lib/use-site-language'

import { useState } from 'react'

const tools = [
  ['fullArmour', 'Full Body Armour', '$250 · Protection', 'Stored in your tool belt when purchased. Activate it to refill your armour to 100% of its current capacity, including the Heavy Plate upgrade. Kept if your armour is already full.'],
  ['reinforcements', 'Call the Reinforcements', '$350 · Squad support', 'Call five allied soldiers to nearby open ground for 15 seconds. They push toward enemies, fire rapid bursts and each carry two frags. They regroup loosely rather than following closely. Each has 80 health and can be killed. Buy it at the quartermaster, then activate it from your tool belt. Use multiple tools to deploy more squads at once; each squad has its own 15-second timer.'],
  ['droneS', 'Scout Drone', 'Recon', 'A compact camera drone for scouting ahead, with a small blast when detonated.'],
  ['drone', 'FPV Drone', 'Precision strike', 'Pilot a fast attack drone into position, then detonate it against your target.'],
  ['droneL', 'Heavy Drone', 'Heavy strike', 'A larger explosive payload for tougher enemies and clustered targets.'],
  ['usv', 'Sea Drone', 'Sector 3', 'Steer an explosive surface drone through the water to attack enemy ships.'],
  ['sentry', 'Sentry Gun', 'Defense', 'Deploy an automatic gun to cover your position while you move or fight.'],
  ['strike', 'Fire Mission', 'Area attack', 'Call in a series of delayed strikes around a target area.'],
  ['stim', 'Combat Stim', 'Boost', 'Temporarily increases movement speed and rate of fire, leaving a blue-and-yellow trail as you move.'],
  ['smoke', 'Smoke', 'Cover', 'Creates a cloud that blocks enemy sight, giving you room to reposition.'],
  ['incend', 'Incendiary', 'Area denial', 'An initial blast leaves burning patches that damage anyone standing in them.'],
  ['flamer', 'Flamethrower', 'Fire', 'Hold fire to project a long stream of flames and set enemies alight.'],
  ['emp', 'Drone Jammer', 'Anti-drone', 'Releases an electronic burst to take down nearby enemy drones.'],
  ['med', 'Field Kit', 'Recovery', 'Stored in your tool belt when purchased. Activate it when needed to restore 50 health.'],
  ['repair', 'Repair Kit', 'Fortifications', 'On every level, use anywhere inside your base to restore 25 percentage points of integrity and repair its appearance. Elsewhere, repairs a nearby damaged wall by one stage. Kept if no repair is needed.'],
  ['plate', 'Armour Plate', 'Protection', 'Replenishes armour to absorb more incoming damage.'],
]
const weapons = [
  ['pistol', 'M9 Pistol', 'Sidearm · 12 rounds', 'A controlled, steady-firing starting weapon with a compact magazine.'],
  ['smg', 'Vector-9', 'SMG · 32 rounds', 'Rapid automatic fire for close encounters. Lower damage per round, with a wider spread.'],
  ['rifle', 'AK-74', 'Assault rifle · 30 rounds', 'Balanced automatic fire, solid damage and tighter spread than the SMG.'],
  ['shotgun', 'Breacher 12', 'Shotgun · 6 rounds', 'Eight pellets per shot deliver a powerful spread up close. Allow time between shots.'],
  ['dmr', 'Marksman', 'DMR · 10 rounds', 'High damage, tight accuracy and penetrating rounds, balanced by a slower firing pace.'],
  ['lmg', 'Bulldog LMG', 'Machine gun · 100 rounds', 'A large magazine and rapid automatic fire for sustained pressure, with a broad spread.'],
  ['railgun', 'Railgun', 'Rail weapon · 3 shots', 'A piercing beam that cuts through terrain and kills every enemy in its path. Three shots, no reserve ammo.'],
]

// Quartermaster prices from game.js SHOP. Unpriced equipment is found, not sold.
const equipmentCost: Record<string, number> = {
  pistol: 0, med: 90, plate: 120, repair: 130, stim: 150, droneS: 160,
  emp: 190, fullArmour: 250, drone: 250, sentry: 260, flamer: 280,
  strike: 320, reinforcements: 350, usv: 360, droneL: 420, railgun: 600,
}

export function EquipmentGuide() {
  const { t } = useSiteLanguage()
  const [view, setView] = useState<'tools' | 'weapons'>('tools')
  const entries = (view === 'tools' ? tools : weapons).slice()
    .sort((a, b) => (equipmentCost[a[0]] ?? 0) - (equipmentCost[b[0]] ?? 0))
    .map(([id,name,role,description]) => [id,t(name),t(role),t(description)])
  return <section className="py-7 sm:py-10 border-b border-white/10" aria-labelledby="equipment-title">
    <div className="flex items-center gap-3 mb-3"><span className="h-px w-8 bg-[#0057b7]" /><p className="text-[9px] font-black tracking-[3px] uppercase text-[#ffd700]">{t("Field guide")}</p></div>
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
      <div><h2 id="equipment-title" className="text-2xl sm:text-3xl font-black text-[#f2ead2]">{t("Know your equipment.")}</h2><p className="text-sm text-[#a9b4b9] mt-2 max-w-md leading-relaxed">{t("Choose the right tool for the job. Get to know your drones, support gear and seven gun types before you deploy.")}</p></div>
      <div className="flex gap-2 shrink-0" aria-label="Equipment category">
        {(['tools', 'weapons'] as const).map(tab => <button key={tab} type="button" aria-pressed={view === tab} onClick={() => setView(tab)} className="rounded px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-colors" style={{ color: view === tab ? '#ffd700' : '#b2c2cc', background: view === tab ? '#0057b7' : '#101c26', borderColor: view === tab ? '#287ac9' : '#283b49' }}>{t(tab)} · {tab === 'tools' ? tools.length : weapons.length}</button>)}
      </div>
    </div>
    <div className="mt-5 mb-4 flex items-center justify-between gap-3 text-[10px] text-[#93a7b5] uppercase tracking-wider"><span>{view === 'tools' ? `${tools.length} ${t('tools · Six belt slots')}` : t('Seven gun types · Different strengths')}</span><span className="text-[#ffd700]">{t("Equipment briefing")}</span></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {entries.map(([id, name, role, description], index) => <article key={id} className="overflow-hidden rounded-lg border border-[#263746] bg-[#0d1720]">
        <div className="relative h-32 flex items-center justify-center border-b border-[#263746]" style={{ background: 'radial-gradient(ellipse at center, #20384b 0%, #101e2a 70%)' }}>
          <span className="absolute top-3 left-3 text-[9px] tracking-widest text-[#728b9d]">{String(index + 1).padStart(2, '0')}</span>
          {/* The adjacent title identifies the illustration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={id === 'fullArmour' ? '/equipment/fullArmour.svg' : id === 'reinforcements' ? '/equipment/reinforcements.png?v=1' : `/equipment/${id}.png?v=4`} alt="" loading="lazy" width={400} height={240} className="w-full h-full object-contain px-6 py-2" />
          <span className="absolute bottom-2 right-3 rounded bg-[#09101f] px-2 py-1 text-[11px] font-bold text-[#ffd700]">
            {id === 'pistol' ? t('Starting weapon') : equipmentCost[id] === undefined ? t('Pickup only') : `$${equipmentCost[id]}`}
          </span>
        </div>
        <div className="p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-[#79b9f1] mb-2">{role}</p><h3 className="font-black text-base text-[#f2ead2]">{name}</h3><p className="mt-2 text-sm leading-relaxed text-[#b0bdc6]">{description.split('. ')[0]}{description.includes('. ') ? '.' : ''}</p>
          {description.includes('. ') && <details className="mt-3 text-sm text-[#b0bdc6]"><summary className="cursor-pointer py-2 text-[#ffd700]">{t("How to use")}</summary><p className="mt-2 leading-relaxed">{description.split('. ').slice(1).join('. ')}</p></details>}</div>
      </article>)}
    </div>
  </section>
}
