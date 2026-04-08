import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'battle' | 'leaderboard' | 'shop';
type BattleMode = 'solo' | '2player' | '3player';
type Zone = 'head' | 'body' | 'legs';
type HitResult = { zone: Zone; dmg: number; blocked: boolean } | null;

interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  rating: number;
  isShaking: boolean;
  hitResult: HitResult;
  isDead: boolean;
}

interface FloatDmg {
  id: number;
  text: string;
  color: string;
  x: number;
}

// ─── Rating → Tier ────────────────────────────────────────────────────────────
function getTier(rating: number) {
  if (rating >= 50000) return { label: 'Бог',       weapon: 'огненный меч',  color: '#ff6b35' };
  if (rating >= 20000) return { label: 'Король',    weapon: 'скипетр',       color: '#f0b429' };
  if (rating >= 12000) return { label: 'Рыцарь',    weapon: 'меч',           color: '#c0c0c0' };
  if (rating >=  6000) return { label: 'Воин',      weapon: 'шпага',         color: '#a0c4ff' };
  if (rating >=  3000) return { label: 'Житель',    weapon: 'вилы',          color: '#a8d5a2' };
  return                      { label: 'Нищий',     weapon: 'палка',         color: '#b0956a' };
}

// ─── SVG Fighter ─────────────────────────────────────────────────────────────
type ZoneState = 'idle' | 'hit' | 'block';
interface FighterSVGProps {
  rating: number;
  flip?: boolean;
  headState?: ZoneState;
  bodyState?: ZoneState;
  legsState?: ZoneState;
  isDead?: boolean;
  isShaking?: boolean;
}

function FighterSVG({ rating, flip, headState = 'idle', bodyState = 'idle', legsState = 'idle', isDead, isShaking }: FighterSVGProps) {
  const tier = getTier(rating);
  const c = tier.color;
  const skin = '#e8c99a';
  const dark = '#1a1a2e';

  function zoneClass(s: ZoneState) {
    if (s === 'hit')   return 'zone-hit';
    if (s === 'block') return 'zone-block';
    return '';
  }

  // Weapon shapes by tier
  function Weapon() {
    if (rating >= 50000) return (
      <g>
        <rect x="52" y="62" width="5" height="30" rx="2" fill="#ff8c00" opacity="0.9"/>
        <ellipse cx="54" cy="60" rx="4" ry="7" fill="#ffcc00" opacity="0.9"/>
        <rect x="48" y="68" width="13" height="3" rx="1" fill="#ff6b35"/>
        <ellipse cx="54" cy="60" rx="3" ry="5" fill="white" opacity="0.4"/>
      </g>
    );
    if (rating >= 20000) return (
      <g>
        <rect x="52" y="58" width="4" height="24" rx="2" fill={c}/>
        <circle cx="54" cy="57" r="5" fill={c} opacity="0.8"/>
        <rect x="50" y="66" width="8" height="2" rx="1" fill={c}/>
      </g>
    );
    if (rating >= 12000) return (
      <g>
        <rect x="53" y="56" width="3" height="34" rx="1.5" fill="#c8c8c8"/>
        <polygon points="54,50 51,60 57,60" fill="#e8e8e8"/>
        <rect x="50" y="63" width="9" height="2" rx="1" fill="#888"/>
      </g>
    );
    if (rating >= 6000) return (
      <g>
        <rect x="53" y="60" width="2.5" height="30" rx="1" fill="#c8c8c8"/>
        <polygon points="54,54 52,62 56,62" fill="#e8e8e8"/>
      </g>
    );
    if (rating >= 3000) return (
      <g>
        <rect x="53" y="58" width="3" height="6" rx="1" fill="#8B6914"/>
        <rect x="52" y="64" width="2" height="26" rx="1" fill="#5a3e10"/>
        <rect x="54" y="64" width="2" height="26" rx="1" fill="#5a3e10"/>
        <rect x="50" y="68" width="8" height="2" rx="1" fill="#8B6914"/>
      </g>
    );
    return (
      <g>
        <rect x="53.5" y="57" width="2.5" height="34" rx="1.2" fill="#8B6914"/>
        <circle cx="54.7" cy="56" r="3" fill="#6b4f20"/>
      </g>
    );
  }

  // Armor / clothing by tier
  function Clothing() {
    if (rating >= 12000) return (
      <g>
        <rect x="42" y="80" width="26" height="28" rx="3" fill="#2a3a5a" stroke="#5a7abf" strokeWidth="1.2"/>
        <rect x="44" y="80" width="4" height="28" rx="1" fill="#3a4a7a" opacity="0.6"/>
        <rect x="62" y="80" width="4" height="28" rx="1" fill="#3a4a7a" opacity="0.6"/>
        <rect x="53" y="80" width="4" height="28" rx="1" fill="#3a4a7a" opacity="0.4"/>
      </g>
    );
    if (rating >= 6000) return (
      <rect x="43" y="80" width="24" height="28" rx="2" fill="#4a3828" stroke="#7a6040" strokeWidth="1"/>
    );
    if (rating >= 3000) return (
      <rect x="44" y="80" width="22" height="28" rx="2" fill="#5a4830" stroke="#7a6648" strokeWidth="0.8"/>
    );
    return (
      <rect x="44" y="80" width="22" height="28" rx="2" fill="#5c3d1e" stroke="#3e2810" strokeWidth="0.5" opacity="0.9"/>
    );
  }

  return (
    <svg
      viewBox="0 0 110 160"
      width="100%"
      height="100%"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, filter: isDead ? 'grayscale(1) brightness(0.4)' : undefined }}
    >
      {/* Zone overlays (clickable/highlight areas) */}
      {/* HEAD zone */}
      <rect
        x="38" y="32" width="34" height="36" rx="4"
        fill="rgba(255,255,255,0)" stroke="transparent"
        strokeWidth="2"
        className={zoneClass(headState)}
        style={{ transition: 'none' }}
      />
      {/* BODY zone */}
      <rect
        x="38" y="72" width="34" height="40" rx="3"
        fill="rgba(255,255,255,0)" stroke="transparent"
        strokeWidth="2"
        className={zoneClass(bodyState)}
        style={{ transition: 'none' }}
      />
      {/* LEGS zone */}
      <rect
        x="40" y="112" width="30" height="36" rx="3"
        fill="rgba(255,255,255,0)" stroke="transparent"
        strokeWidth="2"
        className={zoneClass(legsState)}
        style={{ transition: 'none' }}
      />

      {/* Head */}
      <ellipse cx="55" cy="48" rx="14" ry="16" fill={skin}/>
      {/* Eyes */}
      <circle cx="50" cy="46" r="2" fill={dark}/>
      <circle cx="60" cy="46" r="2" fill={dark}/>
      {/* Mouth - grim */}
      <path d="M51 53 Q55 51 59 53" stroke={dark} strokeWidth="1.2" fill="none"/>
      {/* Helmet / crown by tier */}
      {rating >= 50000 && (
        <g>
          <path d="M38 42 Q42 28 55 26 Q68 28 72 42" fill="#ff8c00" stroke="#ffcc00" strokeWidth="1.5"/>
          <polygon points="42,38 46,26 50,38" fill="#ffcc00"/>
          <polygon points="52,36 55,24 58,36" fill="#ffcc00"/>
          <polygon points="60,38 64,26 68,38" fill="#ffcc00"/>
        </g>
      )}
      {rating >= 20000 && rating < 50000 && (
        <g>
          <path d="M40 42 Q44 30 55 28 Q66 30 70 42" fill="#c8a000" stroke="#f0b429" strokeWidth="1.2"/>
          <rect x="40" y="38" width="30" height="5" rx="2" fill="#f0b429" opacity="0.6"/>
        </g>
      )}
      {rating >= 12000 && rating < 20000 && (
        <path d="M40 44 Q42 30 55 28 Q68 30 70 44 L68 46 Q55 34 42 46Z" fill="#5a7abf" stroke="#8aaae0" strokeWidth="1"/>
      )}
      {rating >= 3000 && rating < 6000 && (
        <ellipse cx="55" cy="36" rx="13" ry="5" fill="#6b4a20" opacity="0.8"/>
      )}
      {rating < 3000 && (
        <path d="M46 38 Q48 34 55 33 Q62 34 64 38" stroke="#7a5a30" strokeWidth="1.5" fill="none" strokeDasharray="2,2"/>
      )}

      {/* Neck */}
      <rect x="51" y="62" width="8" height="10" rx="2" fill={skin}/>

      {/* Clothing / body */}
      <Clothing />

      {/* Arms */}
      <rect x="30" y="82" width="12" height="6" rx="3" fill={skin} transform="rotate(-10 30 85)"/>
      <rect x="68" y="82" width="12" height="6" rx="3" fill={skin} transform="rotate(10 75 85)"/>

      {/* Legs */}
      {rating >= 12000 ? (
        <g>
          <rect x="44" y="106" width="10" height="34" rx="4" fill="#1e2a40" stroke="#3a4a7a" strokeWidth="0.8"/>
          <rect x="56" y="106" width="10" height="34" rx="4" fill="#1e2a40" stroke="#3a4a7a" strokeWidth="0.8"/>
          <rect x="43" y="135" width="12" height="7" rx="3" fill="#2a3540"/>
          <rect x="55" y="135" width="12" height="7" rx="3" fill="#2a3540"/>
        </g>
      ) : (
        <g>
          <rect x="44" y="106" width="10" height="32" rx="4" fill="#3e2810"/>
          <rect x="56" y="106" width="10" height="32" rx="4" fill="#3e2810"/>
          <rect x="43" y="133" width="12" height="7" rx="3" fill="#2a1c08"/>
          <rect x="55" y="133" width="12" height="7" rx="3" fill="#2a1c08"/>
        </g>
      )}

      {/* Weapon hand */}
      <circle cx="34" cy="84" r="4" fill={skin}/>
      <Weapon />

      {/* Shield for defenders (high tier) */}
      {rating >= 6000 && (
        <g>
          <rect x="72" y="78" width="11" height="16" rx="3" fill="#2a3a5a" stroke="#5a7abf" strokeWidth="1.2"/>
          <circle cx="77" cy="86" r="3" fill="#3a5080" stroke="#6a8abf" strokeWidth="0.8"/>
        </g>
      )}

      {/* Dead overlay */}
      {isDead && (
        <text x="55" y="90" textAnchor="middle" fontSize="40" opacity="0.6">💀</text>
      )}
    </svg>
  );
}

// ─── Zone Buttons ─────────────────────────────────────────────────────────────
const ZONES: { key: Zone; label: string }[] = [
  { key: 'head', label: 'Голова' },
  { key: 'body', label: 'Грудь'  },
  { key: 'legs', label: 'Ноги'   },
];

function ZoneBtn({ zone, selected, type, onClick }: {
  zone: Zone; selected: boolean; type: 'atk' | 'def'; onClick: () => void;
}) {
  const isAtk = type === 'atk';
  const icon = isAtk ? '👊' : '🛡️';
  const labels = { head: 'Голова', body: 'Грудь', legs: 'Ноги' };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1
        text-xs font-cinzel font-bold transition-all duration-100
        ${isAtk
          ? `btn-red ${selected ? 'zone-selected-atk' : ''}`
          : `btn-blue ${selected ? 'zone-selected-def' : ''}`
        }
      `}
      style={{ minHeight: 52, flex: 1 }}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span style={{ fontSize: 10, letterSpacing: '0.04em', opacity: 0.9 }}>{labels[zone]}</span>
    </button>
  );
}

// ─── Fighter Frame ────────────────────────────────────────────────────────────
function FighterFrame({ fighter, side, headState, bodyState, legsState }: {
  fighter: Fighter;
  side: 'left' | 'right';
  headState: ZoneState;
  bodyState: ZoneState;
  legsState: ZoneState;
}) {
  const hpPct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  const isLow = hpPct < 30;
  const tier = getTier(fighter.rating);

  return (
    <div className={`flex flex-col items-center ${fighter.isShaking ? 'animate-shake' : ''}`} style={{ flex: 1 }}>
      {/* Name + tier */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-cinzel text-xs font-bold" style={{ color: tier.color }}>{tier.label}</span>
        <span className="text-yellow-700 text-xs">·</span>
        <span className="font-cinzel text-xs text-yellow-300 truncate max-w-[80px]">{fighter.name}</span>
      </div>

      {/* Fighter card frame */}
      <div
        className="cyber-panel rounded-xl overflow-hidden relative"
        style={{
          width: '100%',
          aspectRatio: '2/3',
          maxWidth: 140,
          border: `1px solid ${tier.color}44`,
          boxShadow: `0 0 18px ${tier.color}22, inset 0 0 18px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="absolute inset-0 scanner" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 p-1" style={{ zIndex: 2 }}>
          <FighterSVG
            rating={fighter.rating}
            flip={side === 'right'}
            headState={headState}
            bodyState={bodyState}
            legsState={legsState}
            isDead={fighter.isDead}
          />
        </div>
        {/* Corner deco */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l" style={{ borderColor: `${tier.color}66` }} />
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r" style={{ borderColor: `${tier.color}66` }} />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l" style={{ borderColor: `${tier.color}66` }} />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r" style={{ borderColor: `${tier.color}66` }} />
      </div>

      {/* HP bar */}
      <div className="w-full mt-2" style={{ maxWidth: 140 }}>
        <div className="flex justify-between text-xs mb-0.5 px-0.5">
          <span style={{ color: isLow ? '#e74c3c' : '#2ecc71', fontSize: 10 }}>HP</span>
          <span className="font-cinzel" style={{ color: isLow ? '#e74c3c' : '#2ecc71', fontSize: 10 }}>{fighter.hp}/{fighter.maxHp}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className={isLow ? 'hp-bar-low h-full rounded-full' : 'hp-bar h-full rounded-full'} style={{ width: `${hpPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Battle Logic ─────────────────────────────────────────────────────────────
function calcDamage(atk: Zone, def: Zone): { dmg: number; blocked: boolean } {
  const base = 12 + Math.floor(Math.random() * 14);
  const crit = Math.random() < 0.18;
  if (atk === def) return { dmg: Math.floor(base * 0.15), blocked: true };
  const dmg = crit ? Math.floor(base * 1.9) : base;
  return { dmg, blocked: false };
}

// ─── Battle Screen ────────────────────────────────────────────────────────────
interface BattleScreenProps { mode: BattleMode; playerRating: number; onBack: () => void; }

function BattleScreen({ mode, playerRating, onBack }: BattleScreenProps) {
  const isSolo = mode === 'solo';

  const initState = useCallback(() => ({
    fighters: [
      { name: 'Игрок 1', hp: 120, maxHp: 120, rating: playerRating, isShaking: false, hitResult: null, isDead: false },
      { name: isSolo ? 'Враг' : 'Игрок 2', hp: 120, maxHp: 120, rating: isSolo ? playerRating + Math.floor(Math.random()*500 - 250) : 1000, isShaking: false, hitResult: null, isDead: false },
    ] as Fighter[],
  }), [isSolo, playerRating]);

  const [fighters, setFighters] = useState(initState().fighters);
  const [atkZone, setAtkZone] = useState<Zone | null>(null);
  const [defZone, setDefZone] = useState<Zone | null>(null);
  const [p2AtkZone, setP2AtkZone] = useState<Zone | null>(null);
  const [p2DefZone, setP2DefZone] = useState<Zone | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase, setPhase] = useState<'choose' | 'result' | 'over'>('choose');
  const [roundNum, setRoundNum] = useState(1);
  const [battleLog, setBattleLog] = useState<string[]>(['⚔️ Бой начался!']);
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const [zoneStates, setZoneStates] = useState<{ p0: Record<Zone, ZoneState>; p1: Record<Zone, ZoneState> }>({
    p0: { head: 'idle', body: 'idle', legs: 'idle' },
    p1: { head: 'idle', body: 'idle', legs: 'idle' },
  });
  const floatId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI choice
  const aiChoose = useCallback((): { atk: Zone; def: Zone } => {
    const zones: Zone[] = ['head', 'body', 'legs'];
    return { atk: zones[Math.floor(Math.random() * 3)], def: zones[Math.floor(Math.random() * 3)] };
  }, []);

  const addLog = (msg: string) => setBattleLog(prev => [msg, ...prev].slice(0, 6));

  const addFloat = (text: string, color: string, x: number) => {
    const id = ++floatId.current;
    setFloats(prev => [...prev, { id, text, color, x }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1050);
  };

  // Timer
  useEffect(() => {
    if (phase !== 'choose') return;
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          resolveRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, roundNum]);

  const resolveRound = useCallback(() => {
    clearInterval(timerRef.current!);

    // Finalize zones (random if not chosen)
    const zones: Zone[] = ['head', 'body', 'legs'];
    const p0Atk: Zone = atkZone ?? zones[Math.floor(Math.random() * 3)];
    const p0Def: Zone = defZone ?? zones[Math.floor(Math.random() * 3)];
    const aiChoice = aiChoose();
    const p1Atk: Zone = isSolo ? aiChoice.atk : (p2AtkZone ?? zones[Math.floor(Math.random() * 3)]);
    const p1Def: Zone = isSolo ? aiChoice.def : (p2DefZone ?? zones[Math.floor(Math.random() * 3)]);

    // Calculate hits
    const hit01 = calcDamage(p0Atk, p1Def); // p0 attacks p1
    const hit10 = calcDamage(p1Atk, p0Def); // p1 attacks p0

    setFighters(prev => {
      const next = prev.map(f => ({ ...f }));
      next[1].hp = Math.max(0, next[1].hp - hit01.dmg);
      next[0].hp = Math.max(0, next[0].hp - hit10.dmg);
      next[1].isDead = next[1].hp <= 0;
      next[0].isDead = next[0].hp <= 0;
      if (!hit01.blocked) next[1].isShaking = true;
      if (!hit10.blocked) next[0].isShaking = true;
      return next;
    });

    // Zone highlights
    const newZoneStates = {
      p0: { head: 'idle' as ZoneState, body: 'idle' as ZoneState, legs: 'idle' as ZoneState },
      p1: { head: 'idle' as ZoneState, body: 'idle' as ZoneState, legs: 'idle' as ZoneState },
    };
    newZoneStates.p1[p0Atk] = hit01.blocked ? 'block' : 'hit';
    newZoneStates.p0[p1Atk] = hit10.blocked ? 'block' : 'hit';
    setZoneStates(newZoneStates);

    // Floats
    addFloat(
      hit01.blocked ? `🛡️ ${hit01.dmg}` : `-${hit01.dmg}`,
      hit01.blocked ? '#00c8ff' : '#e74c3c',
      70
    );
    addFloat(
      hit10.blocked ? `🛡️ ${hit10.dmg}` : `-${hit10.dmg}`,
      hit10.blocked ? '#00c8ff' : '#e74c3c',
      25
    );

    const zoneLabelRu: Record<Zone, string> = { head: 'голова', body: 'грудь', legs: 'ноги' };
    addLog(hit01.blocked
      ? `🛡️ ${fighters[1].name} заблокировал удар в ${zoneLabelRu[p0Atk]} (-${hit01.dmg})`
      : `⚔️ Удар в ${zoneLabelRu[p0Atk]} по ${fighters[1].name}: -${hit01.dmg}`);
    addLog(hit10.blocked
      ? `🛡️ ${fighters[0].name} заблокировал удар в ${zoneLabelRu[p1Atk]} (-${hit10.dmg})`
      : `⚔️ ${fighters[1].name} бьёт в ${zoneLabelRu[p1Atk]}: -${hit10.dmg}`);

    setPhase('result');

    // Clear shake after animation
    setTimeout(() => {
      setFighters(prev => prev.map(f => ({ ...f, isShaking: false })));
      setZoneStates({
        p0: { head: 'idle', body: 'idle', legs: 'idle' },
        p1: { head: 'idle', body: 'idle', legs: 'idle' },
      });
    }, 700);

    // Check over
    setTimeout(() => {
      setFighters(prev => {
        const anyDead = prev.some(f => f.hp <= 0);
        if (anyDead) {
          setPhase('over');
        } else {
          setRoundNum(r => r + 1);
          setAtkZone(null);
          setDefZone(null);
          setP2AtkZone(null);
          setP2DefZone(null);
          setPhase('choose');
        }
        return prev;
      });
    }, 1600);
  }, [atkZone, defZone, p2AtkZone, p2DefZone, isSolo, aiChoose, fighters]);

  const handleFight = () => {
    if (phase !== 'choose') return;
    resolveRound();
  };

  const restart = () => {
    const fresh = initState();
    setFighters(fresh.fighters);
    setAtkZone(null);
    setDefZone(null);
    setP2AtkZone(null);
    setP2DefZone(null);
    setTimeLeft(10);
    setPhase('choose');
    setRoundNum(1);
    setBattleLog(['⚔️ Новый бой начался!']);
    setFloats([]);
    setZoneStates({ p0: { head: 'idle', body: 'idle', legs: 'idle' }, p1: { head: 'idle', body: 'idle', legs: 'idle' } });
  };

  const winner = fighters[0].hp <= 0 && fighters[1].hp <= 0
    ? null
    : fighters[0].hp <= 0
      ? fighters[1]
      : fighters[1].hp <= 0
        ? fighters[0]
        : null;

  const canFight = phase === 'choose' && atkZone !== null && defZone !== null && (isSolo || (p2AtkZone !== null && p2DefZone !== null));

  return (
    <div className="flex-1 flex flex-col cyber-bg" style={{ minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 cyber-panel" style={{ zIndex: 10, borderBottom: '1px solid rgba(240,180,41,0.2)' }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Меню
        </button>
        <div className="text-center">
          <div className="font-cinzel text-xs font-bold text-yellow-400">
            {mode === 'solo' ? 'ОДИНОЧНЫЙ ПОХОД' : mode === '2player' ? 'ДУЭЛЬ' : 'ТРОЕ В БОЮ'}
          </div>
          <div className="font-cinzel text-xs text-yellow-700">Раунд {roundNum}</div>
        </div>
        {/* Timer */}
        <div className={`font-cinzel text-2xl font-bold w-12 text-center ${timeLeft <= 3 && phase === 'choose' ? 'timer-critical' : 'text-yellow-400'}`}>
          {phase === 'choose' ? timeLeft : '—'}
        </div>
      </div>

      {/* Fighters arena */}
      <div className="relative flex justify-center items-end gap-3 px-3 pt-3 pb-1" style={{ zIndex: 5 }}>
        {/* Floating dmg numbers */}
        {floats.map(f => (
          <div key={f.id} className="dmg-float font-bold" style={{ left: `${f.x}%`, top: '10%', fontSize: '1.5rem', color: f.color, position: 'absolute' }}>
            {f.text}
          </div>
        ))}

        <FighterFrame
          fighter={fighters[0]}
          side="left"
          headState={zoneStates.p0.head}
          bodyState={zoneStates.p0.body}
          legsState={zoneStates.p0.legs}
        />

        {/* VS */}
        <div className="flex flex-col items-center gap-1 pb-6">
          <div className="font-cinzel text-yellow-700 text-sm font-bold opacity-60">VS</div>
          <div className="w-px h-8 bg-yellow-900 opacity-40" />
          <div className="torch text-lg">🔥</div>
        </div>

        <FighterFrame
          fighter={fighters[1]}
          side="right"
          headState={zoneStates.p1.head}
          bodyState={zoneStates.p1.body}
          legsState={zoneStates.p1.legs}
        />
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col px-3 pb-3 gap-2" style={{ zIndex: 10 }}>
        {/* Player 1 controls */}
        <div className="cyber-panel rounded-xl p-2.5">
          <div className="font-cinzel text-xs text-yellow-600 mb-2 text-center" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            {isSolo || mode === '2player' ? '— ИГРОК 1 —' : '— ИГРОК 1 —'}
          </div>
          {/* Attack row */}
          <div className="mb-1.5">
            <div className="text-xs text-red-400 mb-1 font-cinzel" style={{ fontSize: 10 }}>УДАР</div>
            <div className="flex gap-1.5">
              {ZONES.map(z => (
                <ZoneBtn key={z.key} zone={z.key} type="atk" selected={atkZone === z.key} onClick={() => setAtkZone(z.key)} />
              ))}
            </div>
          </div>
          {/* Defense row */}
          <div>
            <div className="text-xs text-blue-400 mb-1 font-cinzel" style={{ fontSize: 10 }}>ЗАЩИТА</div>
            <div className="flex gap-1.5">
              {ZONES.map(z => (
                <ZoneBtn key={z.key} zone={z.key} type="def" selected={defZone === z.key} onClick={() => setDefZone(z.key)} />
              ))}
            </div>
          </div>
        </div>

        {/* Player 2 controls (pvp only) */}
        {!isSolo && (
          <div className="cyber-panel rounded-xl p-2.5" style={{ borderColor: 'rgba(0,200,255,0.25)' }}>
            <div className="font-cinzel text-xs text-blue-400 mb-2 text-center" style={{ fontSize: 10, letterSpacing: '0.1em' }}>— ИГРОК 2 —</div>
            <div className="mb-1.5">
              <div className="text-xs text-red-400 mb-1 font-cinzel" style={{ fontSize: 10 }}>УДАР</div>
              <div className="flex gap-1.5">
                {ZONES.map(z => (
                  <ZoneBtn key={z.key} zone={z.key} type="atk" selected={p2AtkZone === z.key} onClick={() => setP2AtkZone(z.key)} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-400 mb-1 font-cinzel" style={{ fontSize: 10 }}>ЗАЩИТА</div>
              <div className="flex gap-1.5">
                {ZONES.map(z => (
                  <ZoneBtn key={z.key} zone={z.key} type="def" selected={p2DefZone === z.key} onClick={() => setP2DefZone(z.key)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fight button */}
        <button
          onClick={handleFight}
          disabled={!canFight}
          className={`w-full rounded-xl py-3 font-cinzel font-bold text-base tracking-widest transition-all duration-150 ${canFight ? 'btn-gold' : 'btn-disabled'}`}
          style={{ letterSpacing: '0.2em' }}
        >
          ⚔ В БОЙ
        </button>

        {/* Battle log */}
        <div className="cyber-panel rounded-xl px-3 py-2">
          <div className="font-cinzel text-yellow-800 mb-1" style={{ fontSize: 9, letterSpacing: '0.15em' }}>ЛЕТОПИСЬ РАУНДА</div>
          {battleLog.slice(0, 4).map((l, i) => (
            <div key={i} className="text-xs leading-relaxed" style={{ color: i === 0 ? '#f0b429' : 'rgba(200,160,60,0.4)', fontFamily: 'Oswald, sans-serif' }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Battle Over overlay */}
      {phase === 'over' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="cyber-panel gold-glow rounded-2xl p-8 text-center mx-4 animate-scale-in" style={{ maxWidth: 320 }}>
            <div className="text-6xl mb-3 animate-float">{winner ? '🏆' : '💀'}</div>
            <h2 className="font-cinzel text-3xl font-bold title-glow mb-2" style={{ color: '#f0b429' }}>
              {winner ? 'ПОБЕДА' : 'НИЧЬЯ'}
            </h2>
            {winner && (
              <p className="font-cinzel text-lg text-yellow-300 mb-1">{winner.name}</p>
            )}
            <p className="text-yellow-700 text-xs mb-6 font-cinzel" style={{ letterSpacing: '0.1em' }}>
              {winner ? 'одержал победу в схватке' : 'оба воина пали на арене'}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={restart} className="btn-gold rounded-lg px-5 py-2.5 font-cinzel text-sm">⚔️ Снова</button>
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
          <span className="text-sm">⚡</span>
          <div className="flex items-center gap-1">
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.8)', border: '1px solid rgba(240,180,41,0.2)' }}>
              <div className="h-full rounded-full" style={{ width: '85%', background: 'linear-gradient(90deg, #c8860a, #f0b429)', boxShadow: '0 0 6px #f0b429' }} />
            </div>
            <span className="font-cinzel text-yellow-500" style={{ fontSize: 10 }}>85/100</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm">🪙</span>
          <span className="font-cinzel font-bold text-yellow-300" style={{ fontSize: 12 }}>1 240</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🏆</span>
        <span className="font-cinzel font-bold text-yellow-400" style={{ fontSize: 13 }}>{PLAYER_RATING}</span>
        <span className="font-cinzel text-yellow-800" style={{ fontSize: 10 }}>ЭЛО</span>
      </div>
    </div>
  );
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: 'Одиночный поход', icon: '🗡️', mode: 'solo' as BattleMode,     active: true,  desc: 'Сразись с воинами королевства' },
  { label: 'Бой · 2 игрока',  icon: '⚔️', mode: '2player' as BattleMode, active: true,  desc: 'Дуэль на одном устройстве' },
  { label: 'Бой · 3 игрока',  icon: '🛡️', mode: '3player' as BattleMode, active: true,  desc: 'Три воина — один победит' },
  { label: 'Странствие',      icon: '🗺️', mode: null,                     active: false, desc: 'Ближайшее обновление' },
  { label: 'Клан',            icon: '🏰', mode: null,                     active: false, desc: 'Ближайшее обновление' },
  { label: 'Обитель',         icon: '🏯', mode: null,                     active: false, desc: 'Ближайшее обновление' },
  { label: 'Магазин',         icon: '💎', mode: null,                     active: true,  screen: 'shop' as Screen,        desc: 'Снаряжение и артефакты' },
  { label: 'Рейтинг',         icon: '🏆', mode: null,                     active: true,  screen: 'leaderboard' as Screen, desc: 'Лучшие воины' },
];

function MainMenu({ onNavigate }: { onNavigate: (s: Screen, m?: BattleMode) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center cyber-bg px-4 pb-6 pt-4" style={{ overflowY: 'auto' }}>
      {/* Logo */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="font-cinzel font-bold title-glow" style={{ fontSize: '3rem', color: '#f0b429', letterSpacing: '0.25em', lineHeight: 1.1 }}>
          АРЕНА
        </div>
        <div className="font-cinzel font-bold" style={{ fontSize: '1rem', color: '#6b4f1a', letterSpacing: '0.5em' }}>
          ГЕРОЕВ
        </div>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-700" />
          <span className="text-yellow-700 text-xs">✦</span>
          <div className="font-cinzel text-yellow-800" style={{ fontSize: 9, letterSpacing: '0.3em' }}>СРЕДНЕВЕКОВАЯ АРЕНА</div>
          <span className="text-yellow-700 text-xs">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-700" />
        </div>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (!item.active) return;
              if (item.mode) onNavigate('battle', item.mode);
              else if (item.screen) onNavigate(item.screen);
            }}
            disabled={!item.active}
            className={`
              stagger-${i + 1} opacity-0 animate-fade-in
              relative p-3 rounded-xl text-left transition-all duration-150
              ${item.active ? 'btn-gold' : 'btn-disabled'}
              ${i === 0 ? 'col-span-2' : ''}
            `}
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: i === 0 ? '1.4rem' : '1.1rem' }}>{item.icon}</span>
              <span className="font-cinzel font-bold leading-tight" style={{ fontSize: i === 0 ? '0.85rem' : '0.72rem' }}>{item.label}</span>
            </div>
            <p className="font-oswald text-xs opacity-60 pl-0.5" style={{ fontSize: 10 }}>{item.desc}</p>
            {!item.active && (
              <span className="absolute top-2 right-2 text-yellow-900 font-cinzel px-1.5 py-0.5 rounded" style={{ fontSize: 9, background: 'rgba(15,18,30,0.9)', border: '1px solid rgba(240,180,41,0.15)' }}>
                Скоро
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 font-cinzel text-yellow-900 text-center" style={{ fontSize: 10, letterSpacing: '0.3em' }}>
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
    { rank: 9, name: 'ТвойПерсонаж',  elo: 1887,  wins: 98, isMe: true },
    { rank: 10, name: 'НовыйРекрут',  elo: 1200,  wins: 67 },
  ];

  return (
    <div className="flex-1 flex flex-col cyber-bg">
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)' }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <h2 className="font-cinzel text-lg font-bold text-yellow-400">РЕЙТИНГ</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {leaders.map((p, i) => {
          const tier = getTier(p.elo);
          return (
            <div
              key={p.rank}
              className={`cyber-panel rounded-xl px-3 py-2.5 flex items-center gap-3 animate-fade-in ${p.isMe ? 'gold-glow' : ''}`}
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <div className="font-cinzel font-bold text-base w-7 text-center" style={{ color: p.rank <= 3 ? '#f0b429' : '#4a3820' }}>
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
              </div>
              <div className="w-8 h-8 flex-shrink-0">
                <FighterSVG rating={p.elo} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-cinzel font-bold text-sm truncate" style={{ color: p.isMe ? '#f0b429' : '#d4c090' }}>
                  {p.name}{p.isMe && <span className="text-yellow-700 text-xs ml-1">(Вы)</span>}
                </div>
                <div className="text-xs" style={{ color: tier.color, fontSize: 10 }}>{tier.label} · {p.wins} побед</div>
              </div>
              <div className="text-right">
                <div className="font-cinzel font-bold" style={{ color: '#f0b429', fontSize: 15 }}>{p.elo.toLocaleString()}</div>
                <div className="font-cinzel text-yellow-900" style={{ fontSize: 9 }}>ЭЛО</div>
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
    { name: 'Меч Рассвета',  icon: '⚔️', price: 450, desc: '+15 к атаке'    },
    { name: 'Щит Предков',   icon: '🛡️', price: 380, desc: '+20 к защите'   },
    { name: 'Зелье Силы',    icon: '🧪', price: 120, desc: '+50 HP разово'   },
    { name: 'Амулет Мага',   icon: '💎', price: 600, desc: '+30 к мане'      },
    { name: 'Руна Удачи',    icon: '🔮', price: 200, desc: '+10% крит. шанс' },
    { name: 'Кольчуга',      icon: '🪖', price: 520, desc: '+25 к броне'     },
  ];

  return (
    <div className="flex-1 flex flex-col cyber-bg">
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)' }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <h2 className="font-cinzel text-lg font-bold text-yellow-400">МАГАЗИН</h2>
        <div className="ml-auto flex items-center gap-1">
          <span>🪙</span>
          <span className="font-cinzel font-bold text-yellow-300">1 240</span>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={i}
            className="cyber-panel rounded-xl p-3 flex flex-col gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'backwards' }}
          >
            <div className="text-3xl text-center">{item.icon}</div>
            <div className="font-cinzel font-bold text-xs text-yellow-300 text-center">{item.name}</div>
            <div className="font-cinzel text-yellow-700 text-center" style={{ fontSize: 10 }}>{item.desc}</div>
            <button className="btn-gold rounded-lg px-2 py-1.5 text-xs font-cinzel mt-auto flex items-center justify-center gap-1">
              🪙 {item.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [battleMode, setBattleMode] = useState<BattleMode>('solo');

  const navigate = (s: Screen, mode?: BattleMode) => {
    if (mode) setBattleMode(mode);
    setScreen(s);
  };

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#050810', position: 'relative', overflow: 'hidden' }}
    >
      {screen === 'menu' && <TopBar />}
      {screen === 'menu'        && <MainMenu onNavigate={navigate} />}
      {screen === 'battle'      && <BattleScreen mode={battleMode} playerRating={PLAYER_RATING} onBack={() => setScreen('menu')} />}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('menu')} />}
      {screen === 'shop'        && <Shop onBack={() => setScreen('menu')} />}
    </div>
  );
}
