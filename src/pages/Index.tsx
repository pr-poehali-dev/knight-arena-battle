import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'battle' | 'leaderboard' | 'shop';
type BattleMode = 'solo' | '2player' | '3player';
type Zone = 'head' | 'body' | 'legs';
type ZoneState = 'idle' | 'hit' | 'block';
type TurnPhase = 'choose' | 'result' | 'over';

// Damage by zone
const ZONE_DMG: Record<Zone, number> = { head: 14, body: 11, legs: 8 };
const ZONE_RU: Record<Zone, string> = { head: 'голова', body: 'живот', legs: 'ноги' };
const ZONES: Zone[] = ['head', 'body', 'legs'];
const MAX_ROUNDS = 15;
const MAX_HP = 80;
const TIMER_SECONDS = 10;

// ─── Rating → Tier ────────────────────────────────────────────────────────────
function getTier(rating: number) {
  if (rating >= 50000) return { label: 'Бог',     color: '#ff6b35' };
  if (rating >= 20000) return { label: 'Король',  color: '#f0b429' };
  if (rating >= 12000) return { label: 'Рыцарь',  color: '#c0c0c0' };
  if (rating >=  6000) return { label: 'Воин',    color: '#a0c4ff' };
  if (rating >=  3000) return { label: 'Житель',  color: '#a8d5a2' };
  return                      { label: 'Нищий',   color: '#b0956a' };
}

// ─── Fighter SVG ──────────────────────────────────────────────────────────────
function FighterSVG({ rating, flip, headState = 'idle', bodyState = 'idle', legsState = 'idle', isDead }: {
  rating: number; flip?: boolean;
  headState?: ZoneState; bodyState?: ZoneState; legsState?: ZoneState;
  isDead?: boolean;
}) {
  const skin = '#e8c99a';
  const dark = '#1a1a2e';

  function zoneClass(s: ZoneState) {
    if (s === 'hit') return 'zone-hit';
    if (s === 'block') return 'zone-block';
    return '';
  }

  function Weapon() {
    if (rating >= 50000) return (
      <g>
        <rect x="22" y="66" width="4" height="30" rx="2" fill="#ff8c00"/>
        <ellipse cx="24" cy="64" rx="3.5" ry="6" fill="#ffcc00"/>
        <rect x="18" y="72" width="12" height="3" rx="1" fill="#ff6b35"/>
        <ellipse cx="24" cy="64" rx="2" ry="4" fill="white" opacity="0.4"/>
      </g>
    );
    if (rating >= 20000) return (
      <g>
        <rect x="22" y="62" width="4" height="24" rx="2" fill="#f0b429"/>
        <circle cx="24" cy="60" r="5" fill="#f0b429" opacity="0.8"/>
        <rect x="19" y="70" width="10" height="2.5" rx="1" fill="#c8860a"/>
      </g>
    );
    if (rating >= 12000) return (
      <g>
        <rect x="23" y="58" width="3" height="34" rx="1.5" fill="#d0d0d0"/>
        <polygon points="24,52 21,63 27,63" fill="#eee"/>
        <rect x="19" y="66" width="10" height="2.5" rx="1" fill="#888"/>
      </g>
    );
    if (rating >= 6000) return (
      <g>
        <rect x="23" y="62" width="2.5" height="28" rx="1" fill="#c0c0c0"/>
        <polygon points="24,56 22,64 26,64" fill="#e8e8e8"/>
      </g>
    );
    if (rating >= 3000) return (
      <g>
        <rect x="22" y="62" width="3" height="5" rx="1" fill="#8B6914"/>
        <rect x="21" y="67" width="2" height="22" rx="1" fill="#5a3e10"/>
        <rect x="23" y="67" width="2" height="22" rx="1" fill="#5a3e10"/>
        <rect x="19" y="71" width="8" height="2" rx="1" fill="#8B6914"/>
      </g>
    );
    return (
      <g>
        <rect x="23" y="60" width="2.5" height="30" rx="1.2" fill="#8B6914"/>
        <circle cx="24" cy="58" r="3" fill="#6b4f20"/>
      </g>
    );
  }

  function Clothing() {
    if (rating >= 12000) return (
      <g>
        <rect x="34" y="82" width="28" height="30" rx="3" fill="#2a3a5a" stroke="#5a7abf" strokeWidth="1.2"/>
        <rect x="36" y="82" width="4" height="30" rx="1" fill="#3a4a7a" opacity="0.5"/>
        <rect x="55" y="82" width="4" height="30" rx="1" fill="#3a4a7a" opacity="0.5"/>
      </g>
    );
    if (rating >= 6000) return <rect x="35" y="82" width="26" height="30" rx="2" fill="#4a3828" stroke="#7a6040" strokeWidth="1"/>;
    if (rating >= 3000) return <rect x="36" y="82" width="24" height="30" rx="2" fill="#5a4830" stroke="#7a6648" strokeWidth="0.8"/>;
    return <rect x="36" y="82" width="24" height="30" rx="2" fill="#5c3d1e" stroke="#3e2810" strokeWidth="0.5" opacity="0.9"/>;
  }

  return (
    <svg viewBox="0 0 96 160" width="100%" height="100%"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, filter: isDead ? 'grayscale(1) brightness(0.35)' : undefined }}>

      {/* Zone highlights */}
      <rect x="30" y="34" width="36" height="36" rx="4" fill="rgba(0,0,0,0)" stroke="transparent" strokeWidth="3" className={zoneClass(headState)}/>
      <rect x="30" y="74" width="36" height="44" rx="3" fill="rgba(0,0,0,0)" stroke="transparent" strokeWidth="3" className={zoneClass(bodyState)}/>
      <rect x="32" y="114" width="32" height="38" rx="3" fill="rgba(0,0,0,0)" stroke="transparent" strokeWidth="3" className={zoneClass(legsState)}/>

      {/* Head */}
      <ellipse cx="48" cy="50" rx="14" ry="16" fill={skin}/>
      <circle cx="43" cy="48" r="2" fill={dark}/>
      <circle cx="53" cy="48" r="2" fill={dark}/>
      <path d="M44 55 Q48 53 52 55" stroke={dark} strokeWidth="1.2" fill="none"/>

      {/* Helmet/crown */}
      {rating >= 50000 && (
        <g>
          <path d="M31 44 Q35 30 48 28 Q61 30 65 44" fill="#ff8c00" stroke="#ffcc00" strokeWidth="1.5"/>
          <polygon points="35,40 39,28 43,40" fill="#ffcc00"/>
          <polygon points="46,38 48,26 50,38" fill="#ffcc00"/>
          <polygon points="53,40 57,28 61,40" fill="#ffcc00"/>
        </g>
      )}
      {rating >= 20000 && rating < 50000 && (
        <g>
          <path d="M33 44 Q37 31 48 29 Q59 31 63 44" fill="#c8a000" stroke="#f0b429" strokeWidth="1.2"/>
          <rect x="33" y="40" width="30" height="5" rx="2" fill="#f0b429" opacity="0.55"/>
        </g>
      )}
      {rating >= 12000 && rating < 20000 && (
        <path d="M33 46 Q35 32 48 30 Q61 32 63 46 L61 48 Q48 36 35 48Z" fill="#5a7abf" stroke="#8aaae0" strokeWidth="1"/>
      )}
      {rating >= 3000 && rating < 6000 && (
        <ellipse cx="48" cy="37" rx="13" ry="5" fill="#6b4a20" opacity="0.8"/>
      )}
      {rating < 3000 && (
        <path d="M38 40 Q41 36 48 35 Q55 36 58 40" stroke="#7a5a30" strokeWidth="1.5" fill="none" strokeDasharray="2,2"/>
      )}

      {/* Neck */}
      <rect x="44" y="64" width="8" height="10" rx="2" fill={skin}/>

      <Clothing />

      {/* Arms */}
      <rect x="18" y="84" width="16" height="7" rx="3.5" fill={skin} transform="rotate(-8 18 88)"/>
      <rect x="62" y="84" width="16" height="7" rx="3.5" fill={skin} transform="rotate(8 74 88)"/>

      {/* Legs */}
      {rating >= 12000 ? (
        <g>
          <rect x="36" y="110" width="10" height="36" rx="4" fill="#1e2a40" stroke="#3a4a7a" strokeWidth="0.8"/>
          <rect x="50" y="110" width="10" height="36" rx="4" fill="#1e2a40" stroke="#3a4a7a" strokeWidth="0.8"/>
          <rect x="35" y="139" width="12" height="8" rx="3" fill="#2a3540"/>
          <rect x="49" y="139" width="12" height="8" rx="3" fill="#2a3540"/>
        </g>
      ) : (
        <g>
          <rect x="36" y="110" width="10" height="34" rx="4" fill="#3e2810"/>
          <rect x="50" y="110" width="10" height="34" rx="4" fill="#3e2810"/>
          <rect x="35" y="137" width="12" height="7" rx="3" fill="#2a1c08"/>
          <rect x="49" y="137" width="12" height="7" rx="3" fill="#2a1c08"/>
        </g>
      )}

      {/* Weapon hand */}
      <circle cx="22" cy="86" r="4" fill={skin}/>
      <Weapon />

      {/* Shield (high tier) */}
      {rating >= 6000 && (
        <g>
          <rect x="65" y="80" width="11" height="17" rx="3" fill="#2a3a5a" stroke="#5a7abf" strokeWidth="1.2"/>
          <circle cx="70" cy="88" r="3" fill="#3a5080" stroke="#6a8abf" strokeWidth="0.8"/>
        </g>
      )}

      {isDead && <text x="48" y="100" textAnchor="middle" fontSize="38" opacity="0.7">💀</text>}
    </svg>
  );
}

// ─── Zone Button ──────────────────────────────────────────────────────────────
function ZoneBtn({ zone, selected, type, count, onClick, disabled }: {
  zone: Zone; selected: boolean; type: 'atk' | 'def';
  count?: number; onClick: () => void; disabled?: boolean;
}) {
  const isAtk = type === 'atk';
  const label = { head: 'Голова', body: 'Живот', legs: 'Ноги' }[zone];
  const icon  = isAtk ? '👊' : '🛡️';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center rounded-lg py-2 px-1 relative
        transition-all duration-100 font-cinzel font-bold
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        ${isAtk
          ? `btn-red ${selected ? 'zone-selected-atk' : ''}`
          : `btn-blue ${selected ? 'zone-selected-def' : ''}`
        }
      `}
      style={{ flex: 1, minHeight: 54, fontSize: 10 }}
    >
      <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, letterSpacing: '0.03em', marginTop: 2 }}>{label}</span>
      {count && count > 1 && (
        <span className="absolute -top-1.5 -right-1.5 rounded-full text-white font-bold flex items-center justify-center"
          style={{ background: '#e74c3c', width: 16, height: 16, fontSize: 9, boxShadow: '0 0 6px #e74c3c' }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Fighter Panel ────────────────────────────────────────────────────────────
function FighterPanel({ name, hp, rating, side, shake, headState, bodyState, legsState, isDead }: {
  name: string; hp: number; rating: number; side: 'left' | 'right';
  shake: boolean; headState: ZoneState; bodyState: ZoneState; legsState: ZoneState; isDead: boolean;
}) {
  const tier = getTier(rating);
  const hpPct = Math.max(0, (hp / MAX_HP) * 100);
  const isLow = hpPct < 30;

  return (
    <div className={`flex flex-col items-center ${shake ? 'animate-shake' : ''}`} style={{ flex: 1, maxWidth: 160 }}>
      <div className="flex items-center gap-1 mb-1">
        <span className="font-cinzel font-bold" style={{ color: tier.color, fontSize: 10 }}>{tier.label}</span>
        <span style={{ color: '#4a3820', fontSize: 9 }}>·</span>
        <span className="font-cinzel truncate" style={{ color: '#c8a86a', fontSize: 10, maxWidth: 70 }}>{name}</span>
      </div>

      {/* Frame */}
      <div className="cyber-panel rounded-xl overflow-hidden relative w-full" style={{
        aspectRatio: '7/10',
        border: `1px solid ${tier.color}44`,
        boxShadow: `0 0 16px ${tier.color}18, inset 0 0 16px rgba(0,0,0,0.5)`,
      }}>
        <div className="absolute inset-0 scanner" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 p-1" style={{ zIndex: 2 }}>
          <FighterSVG rating={rating} flip={side === 'right'}
            headState={headState} bodyState={bodyState} legsState={legsState} isDead={isDead}/>
        </div>
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l" style={{ borderColor: `${tier.color}55` }}/>
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r" style={{ borderColor: `${tier.color}55` }}/>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l" style={{ borderColor: `${tier.color}55` }}/>
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r" style={{ borderColor: `${tier.color}55` }}/>
      </div>

      {/* HP bar */}
      <div className="w-full mt-1.5">
        <div className="flex justify-between px-0.5 mb-0.5">
          <span style={{ fontSize: 9, color: isLow ? '#e74c3c' : '#2ecc71', fontFamily: 'Cinzel, serif' }}>HP</span>
          <span style={{ fontSize: 9, color: isLow ? '#e74c3c' : '#2ecc71', fontFamily: 'Cinzel, serif' }}>{hp}/{MAX_HP}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className={isLow ? 'hp-bar-low h-full rounded-full' : 'hp-bar h-full rounded-full'} style={{ width: `${hpPct}%` }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Battle Screen ────────────────────────────────────────────────────────────
interface BattleState {
  hp: [number, number];
  round: number;
  phase: TurnPhase;
  isOvertime: boolean;
  doubleStrike: [boolean, boolean]; // available for each player
  log: string[];
}

interface PlayerChoice {
  atkZones: Zone[];   // 1 or 2 zones to attack (empty = double block mode)
  defZones: Zone[];   // 1 or 2 zones to defend
  mode: 'normal' | 'dbl-atk' | 'dbl-def'; // normal, double-attack, double-defend
}

const emptyChoice = (): PlayerChoice => ({ atkZones: [], defZones: [], mode: 'normal' });

function resolveHits(
  attacker: PlayerChoice, defender: PlayerChoice, round: number, isOvertime: boolean
): { hits: Array<{ zone: Zone; dmg: number; blocked: boolean }>, totalDmg: number } {
  const hits: Array<{ zone: Zone; dmg: number; blocked: boolean }> = [];
  let totalDmg = 0;

  if (attacker.mode === 'dbl-def') {
    return { hits: [], totalDmg: 0 };
  }

  for (const z of attacker.atkZones) {
    const blocked = defender.defZones.includes(z);
    let dmg = ZONE_DMG[z];
    if (isOvertime) dmg = Math.round(dmg * (1 + (round - MAX_ROUNDS) * 0.3));
    if (blocked) dmg = 0;
    hits.push({ zone: z, dmg, blocked });
    totalDmg += dmg;
  }

  return { hits, totalDmg };
}

function BattleScreen({ mode, playerRating, onBack }: { mode: BattleMode; playerRating: number; onBack: () => void }) {
  const isSolo = mode === 'solo';
  const names = ['Игрок 1', isSolo ? 'Враг' : 'Игрок 2'];
  const ratings = [playerRating, isSolo ? Math.max(500, playerRating + Math.floor(Math.random() * 600 - 300)) : 1200];

  const freshState = (): BattleState => ({
    hp: [MAX_HP, MAX_HP],
    round: 1,
    phase: 'choose',
    isOvertime: false,
    doubleStrike: [false, false],
    log: ['⚔️ Бой начался!'],
  });

  const [battle, setBattle] = useState<BattleState>(freshState);
  const [choices, setChoices] = useState<[PlayerChoice, PlayerChoice]>([emptyChoice(), emptyChoice()]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [shake, setShake] = useState<[boolean, boolean]>([false, false]);
  const [zoneStates, setZoneStates] = useState<[Record<Zone, ZoneState>, Record<Zone, ZoneState>]>([
    { head: 'idle', body: 'idle', legs: 'idle' },
    { head: 'idle', body: 'idle', legs: 'idle' },
  ]);
  const [floats, setFloats] = useState<Array<{ id: number; text: string; color: string; left: string }>>([]);
  const floatId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─ timer
  useEffect(() => {
    if (battle.phase !== 'choose') return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [battle.phase, battle.round]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && battle.phase === 'choose') {
      submitRound();
    }
  }, [timeLeft]);

  // ─ AI choice
  const aiChoose = useCallback((hasDblStrike: boolean): PlayerChoice => {
    const r = Math.random();
    if (hasDblStrike && r < 0.5) {
      // double attack
      const z1 = ZONES[Math.floor(Math.random() * 3)];
      const z2 = ZONES[Math.floor(Math.random() * 3)];
      const def = ZONES[Math.floor(Math.random() * 3)];
      return { atkZones: [z1, z2], defZones: [def], mode: 'dbl-atk' };
    }
    if (r < 0.25) {
      // double defend
      const z1 = ZONES[Math.floor(Math.random() * 3)];
      const z2 = ZONES.filter(z => z !== z1)[Math.floor(Math.random() * 2)];
      return { atkZones: [], defZones: [z1, z2], mode: 'dbl-def' };
    }
    return {
      atkZones: [ZONES[Math.floor(Math.random() * 3)]],
      defZones: [ZONES[Math.floor(Math.random() * 3)]],
      mode: 'normal',
    };
  }, []);

  function addFloat(text: string, color: string, left: string) {
    const id = ++floatId.current;
    setFloats(prev => [...prev, { id, text, color, left }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1050);
  }

  // ─ Submit round
  const submitRound = useCallback(() => {
    clearInterval(timerRef.current!);

    setBattle(prev => {
      const c0 = choices[0];
      const c1ai = isSolo ? aiChoose(prev.doubleStrike[1]) : choices[1];
      const c1 = c1ai;

      // Finalize missing selections
      const fin0: PlayerChoice = {
        atkZones: c0.atkZones.length ? c0.atkZones : (c0.mode === 'dbl-def' ? [] : [ZONES[Math.floor(Math.random() * 3)]]),
        defZones: c0.defZones.length ? c0.defZones : [ZONES[Math.floor(Math.random() * 3)]],
        mode: c0.mode,
      };
      const fin1: PlayerChoice = {
        atkZones: c1.atkZones.length ? c1.atkZones : (c1.mode === 'dbl-def' ? [] : [ZONES[Math.floor(Math.random() * 3)]]),
        defZones: c1.defZones.length ? c1.defZones : [ZONES[Math.floor(Math.random() * 3)]],
        mode: c1.mode,
      };

      const res01 = resolveHits(fin0, fin1, prev.round, prev.isOvertime);
      const res10 = resolveHits(fin1, fin0, prev.round, prev.isOvertime);

      const newHp: [number, number] = [
        Math.max(0, prev.hp[0] - res10.totalDmg),
        Math.max(0, prev.hp[1] - res01.totalDmg),
      ];

      // Zone states
      const zs0: Record<Zone, ZoneState> = { head: 'idle', body: 'idle', legs: 'idle' };
      const zs1: Record<Zone, ZoneState> = { head: 'idle', body: 'idle', legs: 'idle' };
      for (const h of res01.hits) { zs1[h.zone] = h.blocked ? 'block' : 'hit'; }
      for (const h of res10.hits) { zs0[h.zone] = h.blocked ? 'block' : 'hit'; }
      setZoneStates([zs0, zs1]);

      // Floats
      setTimeout(() => {
        if (res01.totalDmg > 0) addFloat(`-${res01.totalDmg}`, '#e74c3c', '65%');
        else if (fin0.mode !== 'dbl-def') addFloat('🛡️', '#00c8ff', '65%');
        if (res10.totalDmg > 0) addFloat(`-${res10.totalDmg}`, '#e74c3c', '25%');
        else if (fin1.mode !== 'dbl-def') addFloat('🛡️', '#00c8ff', '25%');
      }, 50);

      // Shake
      setTimeout(() => {
        setShake([res10.totalDmg > 0, res01.totalDmg > 0]);
        setTimeout(() => setShake([false, false]), 450);
      }, 80);

      // Log
      const newLog = [...prev.log];
      if (fin0.mode === 'dbl-def') newLog.unshift(`🛡️ ${names[0]}: двойной блок`);
      else {
        const hitDesc = res01.hits.map(h => h.blocked ? `[${ZONE_RU[h.zone]}: блок]` : `[${ZONE_RU[h.zone]}: -${h.dmg}]`).join(' ');
        newLog.unshift(`⚔️ ${names[0]} → ${names[1]}: ${hitDesc}`);
      }
      if (fin1.mode === 'dbl-def') newLog.unshift(`🛡️ ${names[1]}: двойной блок`);
      else {
        const hitDesc = res10.hits.map(h => h.blocked ? `[${ZONE_RU[h.zone]}: блок]` : `[${ZONE_RU[h.zone]}: -${h.dmg}]`).join(' ');
        newLog.unshift(`⚔️ ${names[1]} → ${names[0]}: ${hitDesc}`);
      }

      // Double strike availability
      const nextRound = prev.round + 1;
      const dbl: [boolean, boolean] = [
        nextRound % 5 === 1 ? true : (prev.doubleStrike[0] && nextRound % 5 !== 1 ? prev.doubleStrike[0] : false),
        nextRound % 5 === 1 ? true : (prev.doubleStrike[1] && nextRound % 5 !== 1 ? prev.doubleStrike[1] : false),
      ];
      // Rounds 6, 11, 16 → new double strike (burn old if unused)
      const earnDbl: [boolean, boolean] = [
        prev.round % 5 === 0 ? true : prev.doubleStrike[0],
        prev.round % 5 === 0 ? true : prev.doubleStrike[1],
      ];

      // Check KO or end
      const ko = newHp[0] <= 0 || newHp[1] <= 0;
      const normalEnd = prev.round >= MAX_ROUNDS && !prev.isOvertime;
      const overtimeDraw = prev.isOvertime && newHp[0] === newHp[1] && !ko;

      let nextPhase: TurnPhase = 'result';
      let isOver = false;
      if (ko) { isOver = true; newLog.unshift(newHp[0] <= 0 ? `🔴 НОКАУТ! ${names[1]} победил!` : `🔴 НОКАУТ! ${names[0]} победил!`); }
      else if (normalEnd) {
        if (newHp[0] !== newHp[1]) { isOver = true; newLog.unshift(`🏆 15 раундов! ${newHp[0] > newHp[1] ? names[0] : names[1]} победил!`); }
        else { newLog.unshift('⚡ ОВЕРТАЙМ! Урон ×1.3 каждый раунд!'); }
      }
      if (isOver) nextPhase = 'over';

      // Clear zone states after delay
      setTimeout(() => setZoneStates([
        { head: 'idle', body: 'idle', legs: 'idle' },
        { head: 'idle', body: 'idle', legs: 'idle' },
      ]), 750);

      return {
        hp: newHp,
        round: isOver ? prev.round : nextRound,
        phase: nextPhase,
        isOvertime: normalEnd && !ko && newHp[0] === newHp[1],
        doubleStrike: earnDbl,
        log: newLog.slice(0, 8),
      };
    });

    // After result, go back to choose
    setTimeout(() => {
      setBattle(b => {
        if (b.phase === 'over') return b;
        return { ...b, phase: 'choose' };
      });
      setChoices([emptyChoice(), emptyChoice()]);
    }, 1600);
  }, [choices, isSolo, aiChoose]);

  // ─ Choice helpers
  function toggleAtk(pi: 0 | 1, z: Zone) {
    setChoices(prev => {
      const c = { ...prev[pi] };
      if (c.mode === 'dbl-def') return prev;
      if (c.atkZones.includes(z)) {
        c.atkZones = c.atkZones.filter(x => x !== z);
      } else {
        const max = c.mode === 'dbl-atk' ? 2 : 1;
        c.atkZones = [...c.atkZones.slice(-(max - 1)), z];
      }
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = c;
      return next;
    });
  }

  function toggleDef(pi: 0 | 1, z: Zone) {
    setChoices(prev => {
      const c = { ...prev[pi] };
      if (c.defZones.includes(z)) {
        c.defZones = c.defZones.filter(x => x !== z);
      } else {
        const max = c.mode === 'dbl-def' ? 2 : 1;
        c.defZones = [...c.defZones.slice(-(max - 1)), z];
      }
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = c;
      return next;
    });
  }

  function setMode(pi: 0 | 1, m: PlayerChoice['mode']) {
    setChoices(prev => {
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = { ...emptyChoice(), mode: m };
      return next;
    });
  }

  function canFight(pi: 0 | 1): boolean {
    const c = choices[pi];
    if (c.mode === 'dbl-def') return c.defZones.length === 2;
    return c.atkZones.length >= 1 && c.defZones.length >= 1;
  }

  const readyToFight = isSolo ? canFight(0) : (canFight(0) && canFight(1));

  function PlayerControls({ pi }: { pi: 0 | 1 }) {
    const c = choices[pi];
    const hasDbl = battle.doubleStrike[pi];
    const isP2 = pi === 1;

    return (
      <div className="cyber-panel rounded-xl p-2.5" style={ isP2 ? { borderColor: 'rgba(0,200,255,0.22)' } : {}}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-cinzel font-bold" style={{ fontSize: 10, color: isP2 ? '#00c8ff' : '#f0b429', letterSpacing: '0.1em' }}>
            {isP2 ? '— ИГРОК 2 —' : '— ИГРОК 1 —'}
          </span>
          {hasDbl && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode(pi, c.mode === 'dbl-atk' ? 'normal' : 'dbl-atk')}
                className={`font-cinzel rounded px-2 py-0.5 transition-all ${c.mode === 'dbl-atk' ? 'btn-red' : 'btn-ghost'}`}
                style={{ fontSize: 9 }}>
                ⚔️×2
              </button>
              <button
                onClick={() => setMode(pi, c.mode === 'dbl-def' ? 'normal' : 'dbl-def')}
                className={`font-cinzel rounded px-2 py-0.5 transition-all ${c.mode === 'dbl-def' ? 'btn-blue' : 'btn-ghost'}`}
                style={{ fontSize: 9 }}>
                🛡️×2
              </button>
            </div>
          )}
        </div>

        {/* Attack row */}
        {c.mode !== 'dbl-def' && (
          <div className="mb-1.5">
            <div className="font-cinzel mb-1" style={{ fontSize: 9, color: '#c0392b', letterSpacing: '0.08em' }}>
              УДАР {c.mode === 'dbl-atk' ? <span style={{ color: '#e74c3c' }}>(×2)</span> : ''}
            </div>
            <div className="flex gap-1.5">
              {ZONES.map(z => (
                <ZoneBtn key={z} zone={z} type="atk"
                  selected={c.atkZones.includes(z)}
                  count={c.atkZones.filter(x => x === z).length}
                  onClick={() => toggleAtk(pi, z)}
                  disabled={battle.phase !== 'choose'}
                />
              ))}
            </div>
          </div>
        )}

        {/* Defense row */}
        <div>
          <div className="font-cinzel mb-1" style={{ fontSize: 9, color: '#00c8ff', letterSpacing: '0.08em' }}>
            БЛОК {c.mode === 'dbl-def' ? <span style={{ color: '#00c8ff' }}>(×2)</span> : ''}
          </div>
          <div className="flex gap-1.5">
            {ZONES.map(z => (
              <ZoneBtn key={z} zone={z} type="def"
                selected={c.defZones.includes(z)}
                onClick={() => toggleDef(pi, z)}
                disabled={battle.phase !== 'choose'}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const winner = battle.phase === 'over'
    ? (battle.hp[0] > battle.hp[1] ? 0 : battle.hp[1] > battle.hp[0] ? 1 : -1)
    : null;

  return (
    <div className="flex-1 flex flex-col cyber-bg" style={{ minHeight: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 cyber-panel" style={{ borderBottom: '1px solid rgba(240,180,41,0.18)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14}/> Меню
        </button>
        <div className="text-center">
          <div className="font-cinzel font-bold" style={{ fontSize: 11, color: '#f0b429', letterSpacing: '0.1em' }}>
            {mode === 'solo' ? 'ОДИНОЧНЫЙ ПОХОД' : mode === '2player' ? 'ДУЭЛЬ' : 'ТРОЕ В БОЮ'}
          </div>
          <div className="font-cinzel" style={{ fontSize: 9, color: '#4a3820' }}>
            {battle.isOvertime ? '⚡ ОВЕРТАЙМ' : `РАУНД ${battle.round} / ${MAX_ROUNDS}`}
          </div>
        </div>
        <div className={`font-cinzel font-bold text-center ${timeLeft <= 3 && battle.phase === 'choose' ? 'timer-critical' : ''}`}
          style={{ fontSize: '1.6rem', color: '#f0b429', width: 48 }}>
          {battle.phase === 'choose' ? timeLeft : '—'}
        </div>
      </div>

      {/* ── Fighters ── */}
      <div className="relative flex justify-center items-end gap-2 px-3 pt-3 pb-1" style={{ flexShrink: 0 }}>
        {/* Floating numbers */}
        {floats.map(f => (
          <div key={f.id} className="dmg-float font-bold" style={{ left: f.left, top: '8%', fontSize: '1.5rem', color: f.color, position: 'absolute' }}>
            {f.text}
          </div>
        ))}

        <FighterPanel name={names[0]} hp={battle.hp[0]} rating={ratings[0]} side="left"
          shake={shake[0]} headState={zoneStates[0].head} bodyState={zoneStates[0].body} legsState={zoneStates[0].legs}
          isDead={battle.hp[0] <= 0}/>

        <div className="flex flex-col items-center gap-1 pb-6 flex-shrink-0">
          <div className="font-cinzel font-bold opacity-40" style={{ fontSize: 14, color: '#f0b429' }}>VS</div>
          <div className="w-px h-6 opacity-30" style={{ background: '#f0b429' }}/>
          <div className="torch text-base">🔥</div>
          {battle.doubleStrike[0] && (
            <div className="font-cinzel text-center" style={{ fontSize: 8, color: '#e74c3c' }}>⚡×2</div>
          )}
        </div>

        <FighterPanel name={names[1]} hp={battle.hp[1]} rating={ratings[1]} side="right"
          shake={shake[1]} headState={zoneStates[1].head} bodyState={zoneStates[1].body} legsState={zoneStates[1].legs}
          isDead={battle.hp[1] <= 0}/>
      </div>

      {/* ── Controls ── */}
      <div className="flex-1 flex flex-col px-3 pb-3 gap-2 overflow-y-auto">
        <PlayerControls pi={0}/>
        {!isSolo && <PlayerControls pi={1}/>}

        {/* FIGHT button */}
        <button
          onClick={submitRound}
          disabled={!readyToFight || battle.phase !== 'choose'}
          className={`w-full rounded-xl py-3 font-cinzel font-bold tracking-widest transition-all duration-150 ${readyToFight && battle.phase === 'choose' ? 'btn-gold' : 'btn-disabled'}`}
          style={{ fontSize: '0.9rem', letterSpacing: '0.22em', flexShrink: 0 }}>
          ⚔ В БОЙ
        </button>

        {/* Log */}
        <div className="cyber-panel rounded-xl px-3 py-2" style={{ flexShrink: 0 }}>
          <div className="font-cinzel mb-1" style={{ fontSize: 8, color: '#4a3820', letterSpacing: '0.15em' }}>ЛЕТОПИСЬ РАУНДА</div>
          {battle.log.slice(0, 5).map((l, i) => (
            <div key={i} className="leading-relaxed" style={{ fontSize: 10, color: i === 0 ? '#f0b429' : 'rgba(200,160,60,0.35)', fontFamily: 'Oswald, sans-serif' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* ── Victory overlay ── */}
      {battle.phase === 'over' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(5px)' }}>
          <div className="cyber-panel gold-glow rounded-2xl p-8 text-center mx-4 animate-scale-in" style={{ maxWidth: 310 }}>
            <div className="text-6xl mb-3 animate-float">{winner === -1 ? '🤝' : '🏆'}</div>
            <h2 className="font-cinzel font-bold title-glow mb-2" style={{ fontSize: '2rem', color: '#f0b429' }}>
              {winner === -1 ? 'НИЧЬЯ' : 'ПОБЕДА'}
            </h2>
            {winner !== -1 && (
              <p className="font-cinzel mb-1" style={{ fontSize: '1.1rem', color: '#e0c080' }}>{names[winner!]}</p>
            )}
            <div className="flex gap-2 justify-center mt-2 mb-5">
              {[0, 1].map(i => (
                <div key={i} className="cyber-panel rounded-lg px-3 py-1.5 text-center" style={{ fontSize: 10 }}>
                  <div className="font-cinzel font-bold" style={{ color: battle.hp[i] > battle.hp[1 - i] ? '#2ecc71' : '#e74c3c' }}>{names[i]}</div>
                  <div className="font-cinzel" style={{ color: '#f0b429', fontSize: 14 }}>{battle.hp[i]} HP</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setBattle(freshState()); setChoices([emptyChoice(), emptyChoice()]); }} className="btn-gold rounded-lg px-5 py-2.5 font-cinzel text-sm">⚔️ Снова</button>
              <button onClick={onBack} className="btn-red rounded-lg px-5 py-2.5 font-cinzel text-sm">🏠 Меню</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
const PLAYER_RATING = 1887;

function TopBar() {
  return (
    <div className="flex items-center justify-between px-4 py-2 cyber-panel" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '0.85rem' }}>⚡</span>
          <div className="flex items-center gap-1">
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.8)', border: '1px solid rgba(240,180,41,0.2)' }}>
              <div className="h-full rounded-full" style={{ width: '85%', background: 'linear-gradient(90deg, #c8860a, #f0b429)', boxShadow: '0 0 6px #f0b429' }}/>
            </div>
            <span className="font-cinzel" style={{ fontSize: 9, color: '#c8860a' }}>85/100</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '0.85rem' }}>🪙</span>
          <span className="font-cinzel font-bold" style={{ fontSize: 11, color: '#f0d080' }}>1 240</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: '0.85rem' }}>🏆</span>
        <span className="font-cinzel font-bold" style={{ fontSize: 12, color: '#f0b429' }}>{PLAYER_RATING}</span>
        <span className="font-cinzel" style={{ fontSize: 9, color: '#4a3820' }}>ЭЛО</span>
      </div>
    </div>
  );
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: 'Одиночный поход', icon: '🗡️', mode: 'solo'     as BattleMode, active: true,  desc: 'Сразись с врагами королевства' },
  { label: 'Бой · 2 игрока',  icon: '⚔️', mode: '2player'  as BattleMode, active: true,  desc: 'Дуэль на одном устройстве' },
  { label: 'Бой · 3 игрока',  icon: '🛡️', mode: '3player'  as BattleMode, active: true,  desc: 'Три воина — один победит' },
  { label: 'Странствие',      icon: '🗺️', mode: null,                      active: false, desc: 'Ближайшее обновление' },
  { label: 'Клан',            icon: '🏰', mode: null,                      active: false, desc: 'Ближайшее обновление' },
  { label: 'Обитель',         icon: '🏯', mode: null,                      active: false, desc: 'Ближайшее обновление' },
  { label: 'Магазин',         icon: '💎', mode: null,                      active: true,  screen: 'shop'        as Screen, desc: 'Снаряжение и артефакты' },
  { label: 'Рейтинг',         icon: '🏆', mode: null,                      active: true,  screen: 'leaderboard' as Screen, desc: 'Лучшие воины' },
];

function MainMenu({ onNavigate }: { onNavigate: (s: Screen, m?: BattleMode) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center cyber-bg px-4 pb-6 pt-4" style={{ overflowY: 'auto' }}>
      <div className="text-center mb-5 animate-fade-in">
        <div className="font-cinzel font-bold title-glow" style={{ fontSize: '2.8rem', color: '#f0b429', letterSpacing: '0.25em', lineHeight: 1.1 }}>АРЕНА</div>
        <div className="font-cinzel font-bold" style={{ fontSize: '0.85rem', color: '#4a3820', letterSpacing: '0.5em' }}>ГЕРОЕВ</div>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <div className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, #4a3820)' }}/>
          <span className="font-cinzel" style={{ fontSize: 8, color: '#4a3820', letterSpacing: '0.25em' }}>СРЕДНЕВЕКОВАЯ АРЕНА</span>
          <div className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, #4a3820)' }}/>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {MENU_ITEMS.map((item, i) => (
          <button key={i}
            onClick={() => { if (!item.active) return; if (item.mode) onNavigate('battle', item.mode); else if (item.screen) onNavigate(item.screen); }}
            disabled={!item.active}
            className={`stagger-${i + 1} opacity-0 animate-fade-in relative p-3 rounded-xl text-left transition-all duration-150 ${item.active ? 'btn-gold' : 'btn-disabled'} ${i === 0 ? 'col-span-2' : ''}`}
            style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: i === 0 ? '1.3rem' : '1.05rem' }}>{item.icon}</span>
              <span className="font-cinzel font-bold" style={{ fontSize: i === 0 ? '0.82rem' : '0.7rem' }}>{item.label}</span>
            </div>
            <p className="font-oswald opacity-60" style={{ fontSize: 9 }}>{item.desc}</p>
            {!item.active && (
              <span className="absolute top-2 right-2 font-cinzel px-1.5 py-0.5 rounded" style={{ fontSize: 8, background: 'rgba(15,18,30,0.9)', border: '1px solid rgba(240,180,41,0.12)', color: '#4a3820' }}>Скоро</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 font-cinzel text-center" style={{ fontSize: 9, color: '#2a1e0a', letterSpacing: '0.3em' }}>
        ᚱᚢᚾᛖᛋ ✦ ᚢᚠ ✦ ᛗᛁᚷᚺᛏ
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ onBack }: { onBack: () => void }) {
  const leaders = [
    { rank: 1, name: 'ТёмныйРыцарь', elo: 52400, wins: 342 },
    { rank: 2, name: 'МагОгня',       elo: 22800, wins: 289 },
    { rank: 3, name: 'КровавыйВепрь', elo: 18650, wins: 274 },
    { rank: 4, name: 'СтражКоролевы', elo: 12480, wins: 201 },
    { rank: 5, name: 'ЯдоваяСтрела',  elo: 7301,  wins: 189 },
    { rank: 6, name: 'СэрКалибур',    elo: 5190,  wins: 176 },
    { rank: 7, name: 'ЧёрнаяВдова',   elo: 3087,  wins: 154 },
    { rank: 8, name: 'Громовержец',    elo: 2990,  wins: 143 },
    { rank: 9, name: 'ТвойПерсонаж',  elo: PLAYER_RATING, wins: 98, isMe: true },
    { rank: 10, name: 'НовыйРекрут',  elo: 1200,  wins: 67 },
  ];
  return (
    <div className="flex-1 flex flex-col cyber-bg">
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14}/> Назад
        </button>
        <h2 className="font-cinzel text-lg font-bold" style={{ color: '#f0b429' }}>РЕЙТИНГ</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {leaders.map((p, i) => {
          const tier = getTier(p.elo);
          return (
            <div key={p.rank} className={`cyber-panel rounded-xl px-3 py-2.5 flex items-center gap-3 animate-fade-in ${p.isMe ? 'gold-glow' : ''}`}
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
              <div className="font-cinzel font-bold text-base w-7 text-center" style={{ color: p.rank <= 3 ? '#f0b429' : '#3a2a10' }}>
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
              </div>
              <div style={{ width: 32, height: 32, flexShrink: 0 }}><FighterSVG rating={p.elo}/></div>
              <div className="flex-1 min-w-0">
                <div className="font-cinzel font-bold text-sm truncate" style={{ color: p.isMe ? '#f0b429' : '#c8a870' }}>
                  {p.name}{p.isMe && <span className="ml-1" style={{ color: '#4a3820', fontSize: 9 }}>(Вы)</span>}
                </div>
                <div style={{ fontSize: 10, color: tier.color }}>{tier.label} · {p.wins} побед</div>
              </div>
              <div className="text-right">
                <div className="font-cinzel font-bold" style={{ color: '#f0b429', fontSize: 14 }}>{p.elo.toLocaleString()}</div>
                <div className="font-cinzel" style={{ fontSize: 8, color: '#4a3820' }}>ЭЛО</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
function Shop({ onBack }: { onBack: () => void }) {
  const items = [
    { name: 'Меч Рассвета', icon: '⚔️', price: 450, desc: '+15 к атаке'    },
    { name: 'Щит Предков',  icon: '🛡️', price: 380, desc: '+20 к защите'   },
    { name: 'Зелье Силы',   icon: '🧪', price: 120, desc: '+50 HP разово'   },
    { name: 'Амулет Мага',  icon: '💎', price: 600, desc: '+30 к мане'      },
    { name: 'Руна Удачи',   icon: '🔮', price: 200, desc: '+10% крит. шанс' },
    { name: 'Кольчуга',     icon: '🪖', price: 520, desc: '+25 к броне'     },
  ];
  return (
    <div className="flex-1 flex flex-col cyber-bg">
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14}/> Назад
        </button>
        <h2 className="font-cinzel text-lg font-bold" style={{ color: '#f0b429' }}>МАГАЗИН</h2>
        <div className="ml-auto flex items-center gap-1">
          <span>🪙</span>
          <span className="font-cinzel font-bold" style={{ color: '#f0d080', fontSize: 13 }}>1 240</span>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="cyber-panel rounded-xl p-3 flex flex-col gap-2 animate-fade-in" style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'backwards' }}>
            <div className="text-3xl text-center">{item.icon}</div>
            <div className="font-cinzel font-bold text-xs text-center" style={{ color: '#e0c080' }}>{item.name}</div>
            <div className="font-cinzel text-center" style={{ fontSize: 9, color: '#4a3820' }}>{item.desc}</div>
            <button className="btn-gold rounded-lg px-2 py-1.5 font-cinzel text-xs mt-auto flex items-center justify-center gap-1">🪙 {item.price}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen]     = useState<Screen>('menu');
  const [battleMode, setBattleMode] = useState<BattleMode>('solo');

  const navigate = (s: Screen, mode?: BattleMode) => {
    if (mode) setBattleMode(mode);
    setScreen(s);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#050810', overflow: 'hidden' }}>
      {screen === 'menu' && <TopBar/>}
      {screen === 'menu'        && <MainMenu onNavigate={navigate}/>}
      {screen === 'battle'      && <BattleScreen mode={battleMode} playerRating={PLAYER_RATING} onBack={() => setScreen('menu')}/>}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('menu')}/>}
      {screen === 'shop'        && <Shop onBack={() => setScreen('menu')}/>}
    </div>
  );
}
