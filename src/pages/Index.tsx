import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'battle' | 'leaderboard' | 'shop' | 'wandering' | 'clan';
type BattleMode = 'solo' | '2player' | '3player';
type Zone = 'head' | 'body' | 'legs';
type ZoneState = 'idle' | 'hit' | 'block' | 'dodge';
type TurnPhase = 'choose' | 'result' | 'over';
type FighterClassId = 'standard' | 'tank' | 'crit' | 'dodge';

// ─── Fighter classes ──────────────────────────────────────────────────────────
interface FighterClass {
  id: FighterClassId;
  name: string;
  icon: string;
  maxHp: number;
  dmgMult: number;
  price: number;
  color: string;
  desc: string;
  ability: string;
  unlocked: boolean;
}

const FIGHTER_CLASSES: FighterClass[] = [
  {
    id: 'standard', name: 'Стандарт', icon: '⚔️',
    maxHp: 80, dmgMult: 1.0, price: 0, color: '#b0956a',
    desc: 'Сбалансированный боец. 80 HP, стандартный урон.',
    ability: '—', unlocked: true,
  },
  {
    id: 'tank', name: 'Дубовый щит', icon: '🛡️',
    maxHp: 100, dmgMult: 0.82, price: 2500, color: '#6b8c42',
    desc: '100 HP, но наносит на 18% меньше урона.',
    ability: '+20 HP, урон ×0.82', unlocked: false,
  },
  {
    id: 'crit', name: 'Крито', icon: '💥',
    maxHp: 78, dmgMult: 0.90, price: 3000, color: '#e06030',
    desc: '78 HP. С 5-го раунда каждый удар имеет 50% шанс крита (+30% урона). При двойном ударе каждый проверяется отдельно.',
    ability: '50% крит с р.5 (+30% урона)', unlocked: false,
  },
  {
    id: 'dodge', name: 'Уклонист', icon: '💨',
    maxHp: 78, dmgMult: 0.90, price: 3000, color: '#40a0d0',
    desc: '78 HP. С 5-го раунда: 30% шанс уклонения от первого удара. При двойном блоке — 17%. Уклон только от первого удара.',
    ability: '30% уклон с р.5 (17% при дбл-блоке)', unlocked: false,
  },
];

const LOCKED_SLOTS = 5;

// ─── Game state (coins, owned fighters) ──────────────────────────────────────
interface GameState {
  coins: number;
  energy: number;
  ownedClasses: FighterClassId[];
  selectedClass: FighterClassId;
}

const MAX_ENERGY = 100;
const ENERGY_COST_PER_COIN = 10; // 1 energy = 10 coins

const INITIAL_GAME: GameState = {
  coins: 1240,
  energy: 85,
  ownedClasses: ['standard'],
  selectedClass: 'standard',
};

// ─── Damage constants ─────────────────────────────────────────────────────────
const ZONE_DMG: Record<Zone, number> = { head: 14, body: 11, legs: 8 };
const ZONE_RU: Record<Zone, string>  = { head: 'голова', body: 'живот', legs: 'ноги' };
const ZONES: Zone[] = ['head', 'body', 'legs'];
const MAX_ROUNDS = 15;
const TIMER_SECONDS = 10;

// ─── Rating → Tier ────────────────────────────────────────────────────────────
function getTier(rating: number) {
  if (rating >= 50000) return { label: 'Бог',    color: '#ff6b35' };
  if (rating >= 20000) return { label: 'Король', color: '#f0b429' };
  if (rating >= 12000) return { label: 'Рыцарь', color: '#c0c0c0' };
  if (rating >=  6000) return { label: 'Воин',   color: '#a0c4ff' };
  if (rating >=  3000) return { label: 'Житель', color: '#a8d5a2' };
  return                      { label: 'Нищий',  color: '#b0956a' };
}

// ─── SVG Fighter ─────────────────────────────────────────────────────────────
function FighterSVG({ rating, flip, headState = 'idle', bodyState = 'idle', legsState = 'idle', isDead, classId = 'standard' }: {
  rating: number; flip?: boolean;
  headState?: ZoneState; bodyState?: ZoneState; legsState?: ZoneState;
  isDead?: boolean; classId?: FighterClassId;
}) {
  const skin = '#e8c99a';
  const dark = '#1a1a2e';

  function zoneClass(s: ZoneState) {
    if (s === 'hit')   return 'zone-hit';
    if (s === 'block') return 'zone-block';
    if (s === 'dodge') return 'zone-dodge';
    return '';
  }

  // Class-specific body colour
  const bodyColor = classId === 'tank'   ? '#3a6030'
                  : classId === 'crit'   ? '#6a2010'
                  : classId === 'dodge'  ? '#103050'
                  : undefined;

  function Weapon() {
    if (classId === 'tank') return (
      <g>
        <rect x="65" y="76" width="14" height="20" rx="3" fill="#3a6030" stroke="#6baa50" strokeWidth="1.5"/>
        <circle cx="72" cy="86" r="4" fill="#2a5020" stroke="#80c060" strokeWidth="1"/>
        <rect x="20" y="62" width="3" height="22" rx="1.5" fill="#8B6914"/>
      </g>
    );
    if (classId === 'crit') return (
      <g>
        <rect x="23" y="54" width="3" height="38" rx="1.5" fill="#c03020"/>
        <polygon points="24,48 21,58 27,58" fill="#e04030"/>
        <rect x="19" y="65" width="10" height="2.5" rx="1" fill="#801a10"/>
        <ellipse cx="24" cy="48" rx="3" ry="4" fill="#ff8060" opacity="0.8"/>
      </g>
    );
    if (classId === 'dodge') return (
      <g>
        <rect x="24" y="58" width="2" height="28" rx="1" fill="#40a0d0"/>
        <polygon points="25,52 22,60 28,60" fill="#60c0f0"/>
        <rect x="24" y="58" width="2" height="28" rx="1" fill="#40a0d0" opacity="0.5" transform="translate(4 4) rotate(15 25 72)"/>
      </g>
    );
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
    const base = bodyColor ?? (rating >= 12000 ? '#2a3a5a' : rating >= 6000 ? '#4a3828' : rating >= 3000 ? '#5a4830' : '#5c3d1e');
    const stroke = bodyColor ? undefined : rating >= 12000 ? '#5a7abf' : rating >= 6000 ? '#7a6040' : rating >= 3000 ? '#7a6648' : '#3e2810';
    if (rating >= 12000 && !bodyColor) return (
      <g>
        <rect x="34" y="82" width="28" height="30" rx="3" fill={base} stroke={stroke} strokeWidth="1.2"/>
        <rect x="36" y="82" width="4" height="30" rx="1" fill="#3a4a7a" opacity="0.5"/>
        <rect x="55" y="82" width="4" height="30" rx="1" fill="#3a4a7a" opacity="0.5"/>
      </g>
    );
    return <rect x="35" y="82" width="26" height="30" rx="2" fill={base} stroke={stroke} strokeWidth={stroke ? 1 : 0}/>;
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

      {/* Class badge on head */}
      {classId === 'crit'  && <ellipse cx="48" cy="33" rx="6" ry="3" fill="#c03020" opacity="0.8"/>}
      {classId === 'dodge' && <ellipse cx="48" cy="33" rx="6" ry="3" fill="#1060a0" opacity="0.8"/>}
      {classId === 'tank'  && <rect x="36" y="30" width="24" height="8" rx="4" fill="#3a6030" stroke="#6baa50" strokeWidth="1"/>}

      {/* Rating helmet */}
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
      {rating < 3000 && classId === 'standard' && (
        <path d="M38 40 Q41 36 48 35 Q55 36 58 40" stroke="#7a5a30" strokeWidth="1.5" fill="none" strokeDasharray="2,2"/>
      )}

      {/* Neck */}
      <rect x="44" y="64" width="8" height="10" rx="2" fill={skin}/>
      <Clothing />

      {/* Arms */}
      <rect x="18" y="84" width="16" height="7" rx="3.5" fill={skin} transform="rotate(-8 18 88)"/>
      <rect x="62" y="84" width="16" height="7" rx="3.5" fill={skin} transform="rotate(8 74 88)"/>

      {/* Legs */}
      <rect x="36" y="110" width="10" height="34" rx="4" fill={bodyColor ?? '#3e2810'}/>
      <rect x="50" y="110" width="10" height="34" rx="4" fill={bodyColor ?? '#3e2810'}/>
      <rect x="35" y="137" width="12" height="7" rx="3" fill={bodyColor ? bodyColor + 'cc' : '#2a1c08'}/>
      <rect x="49" y="137" width="12" height="7" rx="3" fill={bodyColor ? bodyColor + 'cc' : '#2a1c08'}/>

      {/* Weapon hand */}
      <circle cx="22" cy="86" r="4" fill={skin}/>
      <Weapon />

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
    <button onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center justify-center rounded-lg py-2 px-1 relative
        transition-all duration-100 font-cinzel font-bold
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        ${isAtk ? `btn-red ${selected ? 'zone-selected-atk' : ''}` : `btn-blue ${selected ? 'zone-selected-def' : ''}`}`}
      style={{ flex: 1, minHeight: 54, fontSize: 10 }}>
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
function FighterPanel({ name, hp, maxHp, rating, classId, side, shake, headState, bodyState, legsState, isDead, tag }: {
  name: string; hp: number; maxHp: number; rating: number; classId: FighterClassId; side: 'left' | 'right';
  shake: boolean; headState: ZoneState; bodyState: ZoneState; legsState: ZoneState; isDead: boolean; tag?: string;
}) {
  const tier = getTier(rating);
  const fc = FIGHTER_CLASSES.find(f => f.id === classId)!;
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const isLow = hpPct < 30;

  return (
    <div className={`flex flex-col items-center ${shake ? 'animate-shake' : ''}`} style={{ flex: 1, maxWidth: 160 }}>
      <div className="flex items-center gap-1 mb-1">
        <span style={{ fontSize: '0.85rem' }}>{fc.icon}</span>
        <span className="font-cinzel font-bold truncate" style={{ color: fc.color, fontSize: 10, maxWidth: 80 }}>{name}</span>
      </div>
      {tag && <div className="font-cinzel mb-0.5" style={{ fontSize: 8, color: fc.color, opacity: 0.7, letterSpacing: '0.05em' }}>{tag}</div>}

      <div className="cyber-panel rounded-xl overflow-hidden relative w-full" style={{
        aspectRatio: '7/10',
        border: `1px solid ${fc.color}44`,
        boxShadow: `0 0 16px ${fc.color}18, inset 0 0 16px rgba(0,0,0,0.5)`,
      }}>
        <div className="absolute inset-0 scanner" style={{ zIndex: 1 }}/>
        <div className="absolute inset-0 p-1" style={{ zIndex: 2 }}>
          <FighterSVG rating={rating} flip={side === 'right'}
            headState={headState} bodyState={bodyState} legsState={legsState}
            isDead={isDead} classId={classId}/>
        </div>
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l" style={{ borderColor: `${fc.color}55` }}/>
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r" style={{ borderColor: `${fc.color}55` }}/>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l" style={{ borderColor: `${fc.color}55` }}/>
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r" style={{ borderColor: `${fc.color}55` }}/>
      </div>

      <div className="w-full mt-1.5">
        <div className="flex justify-between px-0.5 mb-0.5">
          <span style={{ fontSize: 9, color: isLow ? '#e74c3c' : '#2ecc71', fontFamily: 'Cinzel, serif' }}>HP</span>
          <span style={{ fontSize: 9, color: isLow ? '#e74c3c' : '#2ecc71', fontFamily: 'Cinzel, serif' }}>{hp}/{maxHp}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className={isLow ? 'hp-bar-low h-full rounded-full' : 'hp-bar h-full rounded-full'} style={{ width: `${hpPct}%` }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Battle logic ─────────────────────────────────────────────────────────────
// Rules:
//  normal:   1 atk + 1 def
//  dbl-def:  0 atk + 2 def  (no extra strike allowed)
//  dbl-atk:  2 atk + 1 def  (only when doubleStrike available; dbl-def then forbidden)
interface PlayerChoice {
  atkZones: Zone[];   // up to 2 when dbl-atk, else 1
  defZones: Zone[];   // up to 2 when dbl-def, else 1
  mode: 'normal' | 'dbl-atk' | 'dbl-def';
}

const emptyChoice = (): PlayerChoice => ({ atkZones: [], defZones: [], mode: 'normal' });

interface HitEvent {
  zone: Zone;
  dmg: number;
  blocked: boolean;
  crit: boolean;
  dodged: boolean;
}

function resolveHits(
  attacker: PlayerChoice,
  defender: PlayerChoice,
  attackerClass: FighterClassId,
  defenderClass: FighterClassId,
  round: number,
  isOvertime: boolean,
): { hits: HitEvent[]; totalDmg: number } {
  if (attacker.mode === 'dbl-def') return { hits: [], totalDmg: 0 };

  const hits: HitEvent[] = [];
  let totalDmg = 0;
  let firstHit = true;

  // Dodge probability (Уклонист)
  const isDodger = defenderClass === 'dodge';
  const dodgeChance = isDodger && round >= 5
    ? (defender.mode === 'dbl-def' ? 0.17 : 0.30)
    : 0;

  for (const z of attacker.atkZones) {
    const blocked = defender.defZones.includes(z);

    // Dodge only on first hit
    const dodged = !blocked && isDodger && firstHit && Math.random() < dodgeChance;

    let baseDmg = ZONE_DMG[z];
    if (isOvertime) baseDmg = Math.round(baseDmg * (1 + (round - MAX_ROUNDS) * 0.3));

    // Crit (Крито) — from round 5
    const isCrit = attackerClass === 'crit' && round >= 5 && Math.random() < 0.5;

    let dmg = 0;
    if (!blocked && !dodged) {
      const fc = FIGHTER_CLASSES.find(f => f.id === attackerClass)!;
      dmg = Math.round(baseDmg * fc.dmgMult * (isCrit ? 1.3 : 1));
      totalDmg += dmg;
    }

    hits.push({ zone: z, dmg, blocked, crit: isCrit && !blocked && !dodged, dodged });
    firstHit = false;
  }

  return { hits, totalDmg };
}

// ─── Battle Screen ────────────────────────────────────────────────────────────
interface BattleState {
  hp: [number, number];
  maxHp: [number, number];
  round: number;
  phase: TurnPhase;
  isOvertime: boolean;
  doubleStrike: [boolean, boolean];
  log: string[];
}

function BattleScreen({ mode, playerRating, playerClass, onBack }: {
  mode: BattleMode; playerRating: number; playerClass: FighterClassId; onBack: () => void;
}) {
  const isSolo = mode === 'solo';
  const fc0 = FIGHTER_CLASSES.find(f => f.id === playerClass)!;
  const aiClass: FighterClassId = isSolo ? (['standard', 'tank', 'crit', 'dodge'] as FighterClassId[])[Math.floor(Math.random() * 4)] : 'standard';
  const fc1 = FIGHTER_CLASSES.find(f => f.id === aiClass)!;
  const names = ['Игрок 1', isSolo ? 'Враг' : 'Игрок 2'];
  const classes: [FighterClassId, FighterClassId] = [playerClass, aiClass];
  const ratings = [playerRating, isSolo ? Math.max(500, playerRating + Math.floor(Math.random() * 600 - 300)) : 1200];

  const freshBattle = (): BattleState => ({
    hp: [fc0.maxHp, fc1.maxHp],
    maxHp: [fc0.maxHp, fc1.maxHp],
    round: 1,
    phase: 'choose',
    isOvertime: false,
    doubleStrike: [false, false],
    log: ['⚔️ Бой начался!'],
  });

  const [battle, setBattle] = useState<BattleState>(freshBattle);
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

  useEffect(() => {
    if (battle.phase !== 'choose') return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [battle.phase, battle.round]);

  useEffect(() => {
    if (timeLeft === 0 && battle.phase === 'choose') submitRound();
  }, [timeLeft]);

  const aiChoose = useCallback((hasDbl: boolean, classId: FighterClassId): PlayerChoice => {
    const r = Math.random();
    if (hasDbl && r < 0.45) {
      const z1 = ZONES[Math.floor(Math.random() * 3)];
      const z2 = ZONES[Math.floor(Math.random() * 3)];
      return { atkZones: [z1, z2], defZones: [ZONES[Math.floor(Math.random() * 3)]], mode: 'dbl-atk' };
    }
    if (r < 0.2) {
      const z1 = ZONES[Math.floor(Math.random() * 3)];
      const z2 = ZONES.filter(z => z !== z1)[Math.floor(Math.random() * 2)];
      return { atkZones: [], defZones: [z1, z2], mode: 'dbl-def' };
    }
    // Dodge bot: prefer dbl-def occasionally
    if (classId === 'dodge' && r < 0.35) {
      const z1 = ZONES[Math.floor(Math.random() * 3)];
      const z2 = ZONES.filter(z => z !== z1)[Math.floor(Math.random() * 2)];
      return { atkZones: [], defZones: [z1, z2], mode: 'dbl-def' };
    }
    return { atkZones: [ZONES[Math.floor(Math.random() * 3)]], defZones: [ZONES[Math.floor(Math.random() * 3)]], mode: 'normal' };
  }, []);

  function addFloat(text: string, color: string, left: string) {
    const id = ++floatId.current;
    setFloats(prev => [...prev, { id, text, color, left }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1050);
  }

  const submitRound = useCallback(() => {
    clearInterval(timerRef.current!);
    setBattle(prev => {
      const c0 = choices[0];
      const c1raw = isSolo ? aiChoose(prev.doubleStrike[1], classes[1]) : choices[1];

      const fin0: PlayerChoice = {
        atkZones: c0.atkZones.length ? c0.atkZones : (c0.mode === 'dbl-def' ? [] : [ZONES[Math.floor(Math.random() * 3)]]),
        defZones: c0.defZones.length ? c0.defZones : [ZONES[Math.floor(Math.random() * 3)]],
        mode: c0.mode,
      };
      const fin1: PlayerChoice = {
        atkZones: c1raw.atkZones.length ? c1raw.atkZones : (c1raw.mode === 'dbl-def' ? [] : [ZONES[Math.floor(Math.random() * 3)]]),
        defZones: c1raw.defZones.length ? c1raw.defZones : [ZONES[Math.floor(Math.random() * 3)]],
        mode: c1raw.mode,
      };

      const res01 = resolveHits(fin0, fin1, classes[0], classes[1], prev.round, prev.isOvertime);
      const res10 = resolveHits(fin1, fin0, classes[1], classes[0], prev.round, prev.isOvertime);

      const newHp: [number, number] = [
        Math.max(0, prev.hp[0] - res10.totalDmg),
        Math.max(0, prev.hp[1] - res01.totalDmg),
      ];

      // Zone states for SVG highlight
      const zs0: Record<Zone, ZoneState> = { head: 'idle', body: 'idle', legs: 'idle' };
      const zs1: Record<Zone, ZoneState> = { head: 'idle', body: 'idle', legs: 'idle' };
      for (const h of res01.hits) { zs1[h.zone] = h.dodged ? 'dodge' : h.blocked ? 'block' : 'hit'; }
      for (const h of res10.hits) { zs0[h.zone] = h.dodged ? 'dodge' : h.blocked ? 'block' : 'hit'; }
      setZoneStates([zs0, zs1]);

      // Floats
      setTimeout(() => {
        if (res01.totalDmg > 0) {
          const hasCrit = res01.hits.some(h => h.crit);
          addFloat(hasCrit ? `💥 КРИТ -${res01.totalDmg}` : `-${res01.totalDmg}`, hasCrit ? '#ff8060' : '#e74c3c', '63%');
        } else if (fin0.mode !== 'dbl-def') {
          const hasDodge = res01.hits.some(h => h.dodged);
          addFloat(hasDodge ? '💨 Уклон!' : '🛡️', hasDodge ? '#40a0d0' : '#00c8ff', '63%');
        }
        if (res10.totalDmg > 0) {
          const hasCrit = res10.hits.some(h => h.crit);
          addFloat(hasCrit ? `💥 КРИТ -${res10.totalDmg}` : `-${res10.totalDmg}`, hasCrit ? '#ff8060' : '#e74c3c', '22%');
        } else if (fin1.mode !== 'dbl-def') {
          const hasDodge = res10.hits.some(h => h.dodged);
          addFloat(hasDodge ? '💨 Уклон!' : '🛡️', hasDodge ? '#40a0d0' : '#00c8ff', '22%');
        }
      }, 50);

      setTimeout(() => {
        setShake([res10.totalDmg > 0, res01.totalDmg > 0]);
        setTimeout(() => setShake([false, false]), 450);
      }, 80);

      // Log
      const newLog = [...prev.log];
      const buildDesc = (hits: HitEvent[]) =>
        hits.map(h => h.dodged ? `[${ZONE_RU[h.zone]}: 💨]` : h.blocked ? `[${ZONE_RU[h.zone]}: 🛡️]` : `[${ZONE_RU[h.zone]}: -${h.dmg}${h.crit ? '💥' : ''}]`).join(' ');
      if (fin0.mode === 'dbl-def') newLog.unshift(`🛡️ ${names[0]}: двойной блок`);
      else newLog.unshift(`⚔️ ${names[0]} → ${names[1]}: ${buildDesc(res01.hits)}`);
      if (fin1.mode === 'dbl-def') newLog.unshift(`🛡️ ${names[1]}: двойной блок`);
      else newLog.unshift(`⚔️ ${names[1]} → ${names[0]}: ${buildDesc(res10.hits)}`);

      // Double strike: earned on rounds 5, 10, 15 (every 5th), burns old
      const earnDbl: [boolean, boolean] = [
        prev.round % 5 === 0 ? true : prev.doubleStrike[0],
        prev.round % 5 === 0 ? true : prev.doubleStrike[1],
      ];

      const ko = newHp[0] <= 0 || newHp[1] <= 0;
      const normalEnd = prev.round >= MAX_ROUNDS && !prev.isOvertime;
      let isOver = false;
      if (ko) { isOver = true; newLog.unshift(`🔴 НОКАУТ! ${newHp[0] <= 0 && newHp[1] <= 0 ? 'Ничья' : newHp[1] <= 0 ? names[0] : names[1]} победил!`); }
      else if (normalEnd) {
        if (newHp[0] !== newHp[1]) { isOver = true; newLog.unshift(`🏆 15 раундов! ${newHp[0] > newHp[1] ? names[0] : names[1]} победил!`); }
        else newLog.unshift('⚡ ОВЕРТАЙМ! Урон растёт каждый раунд!');
      }

      setTimeout(() => setZoneStates([{ head: 'idle', body: 'idle', legs: 'idle' }, { head: 'idle', body: 'idle', legs: 'idle' }]), 750);

      return {
        hp: newHp,
        maxHp: prev.maxHp,
        round: isOver ? prev.round : prev.round + 1,
        phase: isOver ? 'over' : 'result',
        isOvertime: normalEnd && !ko && newHp[0] === newHp[1],
        doubleStrike: isOver ? earnDbl : earnDbl,
        log: newLog.slice(0, 8),
      };
    });

    setTimeout(() => {
      setBattle(b => { if (b.phase === 'over') return b; return { ...b, phase: 'choose' }; });
      setChoices([emptyChoice(), emptyChoice()]);
    }, 1600);
  }, [choices, isSolo, aiChoose]);

  // ── Choice helpers with strict rules ──────────────────────────────────────
  function selectAtk(pi: 0 | 1, z: Zone) {
    setChoices(prev => {
      const c = { ...prev[pi], atkZones: [...prev[pi].atkZones] };
      if (c.mode === 'dbl-def') return prev; // dbl-def = no attack allowed

      if (c.mode === 'dbl-atk') {
        // Toggle: if already has 2, replace last; allow same zone twice
        if (c.atkZones.length >= 2) {
          c.atkZones = [c.atkZones[0], z]; // replace second
        } else {
          c.atkZones = [...c.atkZones, z];
        }
      } else {
        // normal: exactly 1 atk
        c.atkZones = [z];
      }
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = c; return next;
    });
  }

  function selectDef(pi: 0 | 1, z: Zone) {
    setChoices(prev => {
      const c = { ...prev[pi], defZones: [...prev[pi].defZones] };
      if (c.mode === 'dbl-def') {
        // toggle second zone
        if (c.defZones.includes(z)) {
          c.defZones = c.defZones.filter(x => x !== z);
        } else if (c.defZones.length < 2) {
          c.defZones = [...c.defZones, z];
        } else {
          c.defZones = [c.defZones[0], z]; // replace second
        }
      } else {
        // normal / dbl-atk: exactly 1 def
        c.defZones = [z];
      }
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = c; return next;
    });
  }

  function activateDblDef(pi: 0 | 1) {
    // Switch to dbl-def: clear atk, reset def
    setChoices(prev => {
      const c = prev[pi];
      const newMode: PlayerChoice['mode'] = c.mode === 'dbl-def' ? 'normal' : 'dbl-def';
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = { atkZones: [], defZones: newMode === 'dbl-def' ? c.defZones.slice(0, 1) : [], mode: newMode };
      return next;
    });
  }

  function activateDblAtk(pi: 0 | 1) {
    // Switch to dbl-atk: can only have 1 def, can't do dbl-def
    setChoices(prev => {
      const c = prev[pi];
      const newMode: PlayerChoice['mode'] = c.mode === 'dbl-atk' ? 'normal' : 'dbl-atk';
      const next: [PlayerChoice, PlayerChoice] = [...prev] as [PlayerChoice, PlayerChoice];
      next[pi] = {
        atkZones: newMode === 'dbl-atk' ? c.atkZones.slice(0, 1) : c.atkZones.slice(0, 1),
        defZones: c.defZones.slice(0, 1), // keep max 1 def when dbl-atk
        mode: newMode,
      };
      return next;
    });
  }

  function canFight(pi: 0 | 1) {
    const c = choices[pi];
    if (c.mode === 'dbl-def') return c.defZones.length === 2;
    return c.atkZones.length >= 1 && c.defZones.length >= 1;
  }
  const readyToFight = isSolo ? canFight(0) : (canFight(0) && canFight(1));

  function PlayerControls({ pi }: { pi: 0 | 1 }) {
    const c = choices[pi];
    const hasDblStrike = battle.doubleStrike[pi];
    const isP2 = pi === 1;
    const accentColor = isP2 ? '#00c8ff' : '#f0b429';

    return (
      <div className="cyber-panel rounded-xl p-2.5" style={isP2 ? { borderColor: 'rgba(0,200,255,0.22)' } : {}}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-cinzel font-bold" style={{ fontSize: 10, color: accentColor, letterSpacing: '0.1em' }}>
            — ИГРОК {pi + 1} —
          </span>
          <div className="flex items-center gap-1.5">
            {/* Double defend toggle — always available */}
            <button
              onClick={() => activateDblDef(pi)}
              disabled={battle.phase !== 'choose' || c.mode === 'dbl-atk'}
              title="Двойной блок (без атаки)"
              className={`font-cinzel rounded px-2 py-0.5 transition-all ${c.mode === 'dbl-def' ? 'btn-blue' : 'btn-ghost'} ${c.mode === 'dbl-atk' ? 'opacity-30' : ''}`}
              style={{ fontSize: 9 }}>
              🛡️×2
            </button>
            {/* Double strike — only when earned */}
            {hasDblStrike && (
              <button
                onClick={() => activateDblAtk(pi)}
                disabled={battle.phase !== 'choose' || c.mode === 'dbl-def'}
                title="Доп. удар (нельзя при двойном блоке)"
                className={`font-cinzel rounded px-2 py-0.5 transition-all ${c.mode === 'dbl-atk' ? 'btn-red' : 'btn-ghost'} ${c.mode === 'dbl-def' ? 'opacity-30' : ''}`}
                style={{ fontSize: 9 }}>
                ⚔️+1 ⚡
              </button>
            )}
          </div>
        </div>

        {/* Attack row — hidden in dbl-def */}
        {c.mode !== 'dbl-def' && (
          <div className="mb-2">
            <div className="font-cinzel mb-1 flex items-center gap-1" style={{ fontSize: 9, color: '#c0392b' }}>
              УДАР
              {c.mode === 'dbl-atk' && (
                <span style={{ color: '#e74c3c', fontSize: 8 }}>(+1 доп. удар — выбери 2)</span>
              )}
            </div>
            <div className="flex gap-1.5">
              {ZONES.map(z => {
                const hitCount = c.atkZones.filter(x => x === z).length;
                const isSelected = hitCount > 0;
                return (
                  <ZoneBtn key={z} zone={z} type="atk"
                    selected={isSelected}
                    count={hitCount}
                    onClick={() => selectAtk(pi, z)}
                    disabled={battle.phase !== 'choose'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Defense row */}
        <div>
          <div className="font-cinzel mb-1 flex items-center gap-1" style={{ fontSize: 9, color: '#00c8ff' }}>
            БЛОК
            {c.mode === 'dbl-def' && <span style={{ color: '#00c8ff', fontSize: 8 }}>(двойной — выбери 2 зоны)</span>}
            {c.mode === 'dbl-atk' && <span style={{ color: '#8888aa', fontSize: 8 }}>(только 1 при доп. ударе)</span>}
          </div>
          <div className="flex gap-1.5">
            {ZONES.map(z => (
              <ZoneBtn key={z} zone={z} type="def"
                selected={c.defZones.includes(z)}
                onClick={() => selectDef(pi, z)}
                disabled={battle.phase !== 'choose'}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const winner = battle.phase === 'over'
    ? (battle.hp[0] > battle.hp[1] ? 0 : battle.hp[1] > battle.hp[0] ? 1 : -1) : null;

  return (
    <div className="flex-1 flex flex-col cyber-bg" style={{ minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-3 py-2 cyber-panel" style={{ borderBottom: '1px solid rgba(240,180,41,0.18)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14}/> Меню
        </button>
        <div className="text-center">
          <div className="font-cinzel font-bold" style={{ fontSize: 11, color: '#f0b429', letterSpacing: '0.1em' }}>
            {mode === 'solo' ? 'ОДИНОЧНЫЙ ПОХОД' : 'ДУЭЛЬ'}
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

      {/* Fighters */}
      <div className="relative flex justify-center items-end gap-2 px-3 pt-3 pb-1" style={{ flexShrink: 0 }}>
        {floats.map(f => (
          <div key={f.id} className="dmg-float font-bold" style={{ left: f.left, top: '8%', fontSize: '1.4rem', color: f.color, position: 'absolute' }}>
            {f.text}
          </div>
        ))}
        <FighterPanel name={names[0]} hp={battle.hp[0]} maxHp={battle.maxHp[0]} rating={ratings[0]} classId={classes[0]}
          side="left" shake={shake[0]} headState={zoneStates[0].head} bodyState={zoneStates[0].body} legsState={zoneStates[0].legs} isDead={battle.hp[0] <= 0}/>
        <div className="flex flex-col items-center gap-1 pb-6 flex-shrink-0">
          <div className="font-cinzel font-bold opacity-40" style={{ fontSize: 14, color: '#f0b429' }}>VS</div>
          <div className="w-px h-6 opacity-30" style={{ background: '#f0b429' }}/>
          <div className="torch text-base">🔥</div>
        </div>
        <FighterPanel name={names[1]} hp={battle.hp[1]} maxHp={battle.maxHp[1]} rating={ratings[1]} classId={classes[1]}
          side="right" shake={shake[1]} headState={zoneStates[1].head} bodyState={zoneStates[1].body} legsState={zoneStates[1].legs} isDead={battle.hp[1] <= 0}/>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col px-3 pb-3 gap-2 overflow-y-auto">
        <PlayerControls pi={0}/>
        {!isSolo && <PlayerControls pi={1}/>}
        <button onClick={submitRound} disabled={!readyToFight || battle.phase !== 'choose'}
          className={`w-full rounded-xl py-3 font-cinzel font-bold tracking-widest transition-all duration-150 ${readyToFight && battle.phase === 'choose' ? 'btn-gold' : 'btn-disabled'}`}
          style={{ fontSize: '0.9rem', letterSpacing: '0.22em', flexShrink: 0 }}>
          ⚔ В БОЙ
        </button>
        <div className="cyber-panel rounded-xl px-3 py-2" style={{ flexShrink: 0 }}>
          <div className="font-cinzel mb-1" style={{ fontSize: 8, color: '#4a3820', letterSpacing: '0.15em' }}>ЛЕТОПИСЬ</div>
          {battle.log.slice(0, 5).map((l, i) => (
            <div key={i} style={{ fontSize: 10, color: i === 0 ? '#f0b429' : 'rgba(200,160,60,0.35)', fontFamily: 'Oswald, sans-serif', lineHeight: 1.6 }}>{l}</div>
          ))}
        </div>
      </div>

      {battle.phase === 'over' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(5px)' }}>
          <div className="cyber-panel gold-glow rounded-2xl p-8 text-center mx-4 animate-scale-in" style={{ maxWidth: 310 }}>
            <div className="text-6xl mb-3 animate-float">{winner === -1 ? '🤝' : '🏆'}</div>
            <h2 className="font-cinzel font-bold title-glow mb-2" style={{ fontSize: '2rem', color: '#f0b429' }}>
              {winner === -1 ? 'НИЧЬЯ' : 'ПОБЕДА'}
            </h2>
            {winner !== -1 && <p className="font-cinzel mb-1" style={{ fontSize: '1.1rem', color: '#e0c080' }}>{names[winner!]}</p>}
            <div className="flex gap-2 justify-center mt-2 mb-5">
              {[0, 1].map(i => (
                <div key={i} className="cyber-panel rounded-lg px-3 py-1.5 text-center">
                  <div className="font-cinzel font-bold" style={{ color: battle.hp[i] > battle.hp[1-i] ? '#2ecc71' : '#e74c3c', fontSize: 10 }}>{names[i]}</div>
                  <div className="font-cinzel" style={{ color: '#f0b429', fontSize: 14 }}>{battle.hp[i]} HP</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setBattle(freshBattle()); setChoices([emptyChoice(), emptyChoice()]); }} className="btn-gold rounded-lg px-5 py-2.5 font-cinzel text-sm">⚔️ Снова</button>
              <button onClick={onBack} className="btn-red rounded-lg px-5 py-2.5 font-cinzel text-sm">🏠 Меню</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
type ShopTab = 'fighters' | 'energy' | 'clan' | 'wandering';

function Shop({ onBack, gameState, setGameState }: {
  onBack: () => void;
  gameState: GameState;
  setGameState: (g: GameState) => void;
}) {
  const [tab, setTab] = useState<ShopTab>('fighters');
  const [bought, setBought] = useState<FighterClassId | null>(null);
  const [energyAmt, setEnergyAmt] = useState(10);

  function buyFighter(fc: FighterClass) {
    if (gameState.coins < fc.price || gameState.ownedClasses.includes(fc.id)) return;
    setGameState({ ...gameState, coins: gameState.coins - fc.price, ownedClasses: [...gameState.ownedClasses, fc.id] });
    setBought(fc.id);
    setTimeout(() => setBought(null), 1500);
  }

  function buyEnergy(amount: number) {
    const cost = amount * ENERGY_COST_PER_COIN;
    if (gameState.coins < cost) return;
    const newEnergy = Math.min(MAX_ENERGY, gameState.energy + amount);
    setGameState({ ...gameState, coins: gameState.coins - cost, energy: newEnergy });
  }

  const TABS: { id: ShopTab; label: string; icon: string }[] = [
    { id: 'fighters', label: 'Бойцы', icon: '⚔️' },
    { id: 'energy',   label: 'Энергия', icon: '⚡' },
    { id: 'clan',     label: 'Клан', icon: '🏰' },
    { id: 'wandering',label: 'Странствие', icon: '🗺️' },
  ];

  return (
    <div className="flex-1 flex flex-col cyber-bg">
      {/* Header */}
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1">
          <Icon name="ChevronLeft" size={14}/> Назад
        </button>
        <h2 className="font-cinzel text-lg font-bold" style={{ color: '#f0b429' }}>МАГАЗИН</h2>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1"><span>⚡</span><span className="font-cinzel font-bold" style={{ color: '#c8860a', fontSize: 12 }}>{gameState.energy}</span></div>
          <div className="flex items-center gap-1"><span>🪙</span><span className="font-cinzel font-bold" style={{ color: '#f0d080', fontSize: 14 }}>{gameState.coins.toLocaleString()}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'rgba(240,180,41,0.12)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 font-cinzel transition-all duration-150 flex flex-col items-center gap-0.5"
            style={{
              fontSize: 9, letterSpacing: '0.05em',
              color: tab === t.id ? '#f0b429' : '#4a3820',
              borderBottom: tab === t.id ? '2px solid #f0b429' : '2px solid transparent',
              background: tab === t.id ? 'rgba(240,180,41,0.06)' : 'transparent',
            }}>
            <span style={{ fontSize: '1rem' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">

        {/* ── Fighters tab ── */}
        {tab === 'fighters' && (
          <div className="space-y-2.5">
            {FIGHTER_CLASSES.map((fc, i) => {
              const owned = gameState.ownedClasses.includes(fc.id);
              const canBuy = !owned && gameState.coins >= fc.price;
              const isSelected = gameState.selectedClass === fc.id;
              return (
                <div key={fc.id}
                  className={`cyber-panel rounded-xl p-3 animate-fade-in transition-all duration-150 ${isSelected ? 'gold-glow' : ''}`}
                  style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'backwards', borderColor: `${fc.color}33` }}>
                  <div className="flex items-start gap-3">
                    <div style={{ width: 52, height: 72, flexShrink: 0 }}>
                      <FighterSVG rating={1000} classId={fc.id}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontSize: '1.05rem' }}>{fc.icon}</span>
                        <span className="font-cinzel font-bold" style={{ color: fc.color, fontSize: 13 }}>{fc.name}</span>
                        {owned && <span className="font-cinzel rounded px-1.5 py-0.5" style={{ fontSize: 8, background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ecc71' }}>В КОЛЛЕКЦИИ</span>}
                        {isSelected && <span className="font-cinzel rounded px-1.5 py-0.5" style={{ fontSize: 8, background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)', color: '#f0b429' }}>ВЫБРАН</span>}
                      </div>
                      <div className="flex gap-2 mb-1.5 flex-wrap">
                        <span className="font-cinzel rounded px-1.5 py-0.5" style={{ fontSize: 8, background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.2)', color: '#e74c3c' }}>HP: {fc.maxHp}</span>
                        <span className="font-cinzel rounded px-1.5 py-0.5" style={{ fontSize: 8, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: '#f0b429' }}>Урон ×{fc.dmgMult.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(200,168,106,0.65)', fontFamily: 'Oswald', lineHeight: 1.4, marginBottom: 4 }}>{fc.desc}</div>
                      {fc.ability !== '—' && (
                        <div className="rounded px-2 py-1" style={{ fontSize: 9, background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.13)', color: '#c8a060', fontFamily: 'Cinzel' }}>✨ {fc.ability}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5">
                    {owned ? (
                      <button onClick={() => setGameState({ ...gameState, selectedClass: fc.id })}
                        className={`w-full rounded-lg py-2 font-cinzel text-xs ${isSelected ? 'btn-disabled' : 'btn-gold'}`} disabled={isSelected}>
                        {isSelected ? '✔ Выбран' : '⚔️ Выбрать бойца'}
                      </button>
                    ) : (
                      <button onClick={() => buyFighter(fc)} disabled={!canBuy}
                        className={`w-full rounded-lg py-2 font-cinzel text-xs flex items-center justify-center gap-1.5 ${canBuy ? 'btn-gold' : 'btn-disabled'}`}>
                        {bought === fc.id ? '✔ Куплено!' : (<>🪙 {fc.price.toLocaleString()}</>)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Locked */}
            <div className="font-cinzel mt-1 mb-1" style={{ fontSize: 9, color: '#3a2a10', letterSpacing: '0.15em' }}>— СКОРО —</div>
            {Array.from({ length: LOCKED_SLOTS }).map((_, i) => (
              <div key={i} className="cyber-panel rounded-xl p-3 flex items-center gap-3 opacity-35" style={{ border: '1px solid rgba(240,180,41,0.07)' }}>
                <div className="w-12 h-16 rounded-lg flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.8)' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔒</span>
                </div>
                <div>
                  <div className="font-cinzel font-bold" style={{ color: '#3a2a10', fontSize: 11 }}>??? Боец {i + 5}</div>
                  <div style={{ fontSize: 9, color: '#2a1a08', fontFamily: 'Cinzel', marginTop: 2 }}>Ближайшее обновление</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Energy tab ── */}
        {tab === 'energy' && (
          <div className="space-y-3">
            <div className="cyber-panel rounded-xl p-4 text-center" style={{ borderColor: 'rgba(200,134,10,0.3)' }}>
              <div style={{ fontSize: '2.5rem' }}>⚡</div>
              <div className="font-cinzel font-bold mt-1" style={{ color: '#f0b429', fontSize: 16 }}>{gameState.energy} / {MAX_ENERGY}</div>
              <div style={{ fontSize: 10, color: '#6b4f1a', fontFamily: 'Cinzel', marginTop: 4 }}>текущая энергия</div>
              <div className="w-full h-3 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(240,180,41,0.2)' }}>
                <div className="hp-bar h-full rounded-full" style={{ width: `${(gameState.energy / MAX_ENERGY) * 100}%`, background: 'linear-gradient(90deg, #c8860a, #f0b429)' }}/>
              </div>
            </div>

            <div className="font-cinzel" style={{ fontSize: 9, color: '#4a3820', letterSpacing: '0.15em' }}>— КУПИТЬ ЭНЕРГИЮ —</div>
            <div className="cyber-panel rounded-xl p-3" style={{ borderColor: 'rgba(200,134,10,0.2)' }}>
              <div className="font-cinzel mb-1" style={{ fontSize: 10, color: '#c8a060' }}>Курс: 1 ⚡ = 10 🪙</div>
              <div style={{ fontSize: 9, color: '#4a3820', fontFamily: 'Oswald', marginBottom: 12 }}>Максимум {MAX_ENERGY} единиц. Можно добрать до максимума.</div>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-2">
                {[10, 20, 50, MAX_ENERGY - gameState.energy].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amt => {
                  const cost = amt * ENERGY_COST_PER_COIN;
                  const canAfford = gameState.coins >= cost;
                  const wouldOverflow = gameState.energy + amt > MAX_ENERGY;
                  const actualAmt = Math.min(amt, MAX_ENERGY - gameState.energy);
                  if (actualAmt <= 0) return null;
                  return (
                    <button key={amt} onClick={() => buyEnergy(actualAmt)} disabled={!canAfford}
                      className={`rounded-lg py-2.5 font-cinzel flex flex-col items-center gap-0.5 ${canAfford ? 'btn-gold' : 'btn-disabled'}`}
                      style={{ fontSize: 10 }}>
                      <span style={{ fontSize: '1.1rem' }}>⚡ +{actualAmt}</span>
                      <span style={{ fontSize: 9 }}>🪙 {(actualAmt * ENERGY_COST_PER_COIN).toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Clan tab ── */}
        {tab === 'clan' && (
          <div className="space-y-3">
            <div className="cyber-panel rounded-xl p-5 text-center" style={{ borderColor: 'rgba(240,180,41,0.15)' }}>
              <div style={{ fontSize: '3rem' }}>🏰</div>
              <div className="font-cinzel font-bold mt-2" style={{ color: '#f0b429', fontSize: 18, letterSpacing: '0.1em' }}>КЛАНОВЫЕ ВОЙНЫ</div>
              <div className="font-cinzel mt-2" style={{ color: '#4a3820', fontSize: 11, letterSpacing: '0.08em' }}>Ближайшее обновление</div>
            </div>
            <div className="font-cinzel" style={{ fontSize: 9, color: '#3a2a10', letterSpacing: '0.12em' }}>— ЧТО БУДЕТ ДОСТУПНО —</div>
            {['Создай или вступи в клан', 'Клановые сражения 5×5', 'Клановый рейтинг и трофеи', 'Общая казна клана', 'Уникальное клановое снаряжение'].map((f, i) => (
              <div key={i} className="cyber-panel rounded-xl px-4 py-3 flex items-center gap-3 opacity-50" style={{ border: '1px solid rgba(240,180,41,0.08)' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <span style={{ fontSize: 11, color: '#4a3820', fontFamily: 'Oswald' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Wandering tab ── */}
        {tab === 'wandering' && (
          <div className="space-y-3">
            <div className="cyber-panel rounded-xl p-5 text-center" style={{ borderColor: 'rgba(240,180,41,0.15)' }}>
              <div style={{ fontSize: '3rem' }}>🗺️</div>
              <div className="font-cinzel font-bold mt-2" style={{ color: '#f0b429', fontSize: 18, letterSpacing: '0.1em' }}>СТРАНСТВИЕ</div>
              <div className="font-cinzel mt-2" style={{ color: '#4a3820', fontSize: 11, letterSpacing: '0.08em' }}>Ближайшее обновление</div>
            </div>
            <div className="font-cinzel" style={{ fontSize: 9, color: '#3a2a10', letterSpacing: '0.12em' }}>— ЧТО БУДЕТ ДОСТУПНО —</div>
            {['Одиночные кампании с сюжетом', 'Уникальные враги и боссы', 'Награды за прохождение', 'Карта мира с регионами', 'Случайные события в пути'].map((f, i) => (
              <div key={i} className="cyber-panel rounded-xl px-4 py-3 flex items-center gap-3 opacity-50" style={{ border: '1px solid rgba(240,180,41,0.08)' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <span style={{ fontSize: 11, color: '#4a3820', fontFamily: 'Oswald' }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
const PLAYER_RATING = 1887;

function TopBar({ coins, energy }: { coins: number; energy: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 cyber-panel" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '0.85rem' }}>⚡</span>
          <div className="flex items-center gap-1">
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(5,8,16,0.8)', border: '1px solid rgba(240,180,41,0.2)' }}>
              <div className="h-full rounded-full" style={{ width: `${(energy / MAX_ENERGY) * 100}%`, background: 'linear-gradient(90deg, #c8860a, #f0b429)', boxShadow: '0 0 6px #f0b429' }}/>
            </div>
            <span className="font-cinzel" style={{ fontSize: 9, color: '#c8860a' }}>{energy}/{MAX_ENERGY}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '0.85rem' }}>🪙</span>
          <span className="font-cinzel font-bold" style={{ fontSize: 11, color: '#f0d080' }}>{coins.toLocaleString()}</span>
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
  { label: 'Странствие',      icon: '🗺️', mode: null, active: false, desc: 'Ближайшее обновление' },
  { label: 'Клан',            icon: '🏰', mode: null, active: false, desc: 'Ближайшее обновление' },
  { label: 'Обитель',         icon: '🏯', mode: null, active: false, desc: 'Ближайшее обновление' },
  { label: 'Магазин',         icon: '💎', mode: null, active: true, screen: 'shop' as Screen, desc: 'Снаряжение и бойцы' },
  { label: 'Рейтинг',         icon: '🏆', mode: null, active: true, screen: 'leaderboard' as Screen, desc: 'Лучшие воины' },
];

function MainMenu({ onNavigate, selectedClass }: { onNavigate: (s: Screen, m?: BattleMode) => void; selectedClass: FighterClassId }) {
  const fc = FIGHTER_CLASSES.find(f => f.id === selectedClass)!;
  return (
    <div className="flex-1 flex flex-col items-center cyber-bg px-4 pb-6 pt-4" style={{ overflowY: 'auto' }}>
      <div className="text-center mb-4 animate-fade-in">
        <div className="font-cinzel font-bold title-glow" style={{ fontSize: '2.8rem', color: '#f0b429', letterSpacing: '0.25em', lineHeight: 1.1 }}>АРЕНА</div>
        <div className="font-cinzel font-bold" style={{ fontSize: '0.85rem', color: '#4a3820', letterSpacing: '0.5em' }}>ГЕРОЕВ</div>
        <div className="flex items-center gap-2 mt-1 justify-center">
          <div className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, #4a3820)' }}/>
          <span className="font-cinzel" style={{ fontSize: 8, color: '#3a2a10', letterSpacing: '0.25em' }}>СРЕДНЕВЕКОВАЯ АРЕНА</span>
          <div className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, #4a3820)' }}/>
        </div>
      </div>

      {/* Selected fighter preview */}
      <div className="cyber-panel rounded-xl p-2.5 mb-3 flex items-center gap-3 w-full max-w-sm animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'backwards', borderColor: `${fc.color}44` }}>
        <div style={{ width: 44, height: 60, flexShrink: 0 }}>
          <FighterSVG rating={PLAYER_RATING} classId={selectedClass}/>
        </div>
        <div className="flex-1">
          <div className="font-cinzel font-bold" style={{ color: fc.color, fontSize: 12 }}>{fc.icon} {fc.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(200,168,106,0.6)', fontFamily: 'Oswald' }}>HP: {fc.maxHp} · Урон ×{fc.dmgMult.toFixed(2)}</div>
          {fc.ability !== '—' && <div style={{ fontSize: 8, color: 'rgba(240,180,41,0.5)', fontFamily: 'Cinzel' }}>✨ {fc.ability}</div>}
        </div>
        <span className="font-cinzel" style={{ fontSize: 8, color: '#4a3820' }}>БОЕЦ</span>
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
            <p className="opacity-60" style={{ fontSize: 9, fontFamily: 'Oswald' }}>{item.desc}</p>
            {!item.active && <span className="absolute top-2 right-2 font-cinzel px-1.5 py-0.5 rounded" style={{ fontSize: 8, background: 'rgba(15,18,30,0.9)', border: '1px solid rgba(240,180,41,0.12)', color: '#4a3820' }}>Скоро</span>}
          </button>
        ))}
      </div>
      <div className="mt-4 font-cinzel text-center" style={{ fontSize: 9, color: '#2a1e0a', letterSpacing: '0.3em' }}>ᚱᚢᚾᛖᛋ ✦ ᚢᚠ ✦ ᛗᛁᚷᚺᛏ</div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ onBack }: { onBack: () => void }) {
  const leaders = [
    { rank: 1, name: 'ТёмныйРыцарь', elo: 52400, wins: 342, classId: 'crit' as FighterClassId },
    { rank: 2, name: 'МагОгня',       elo: 22800, wins: 289, classId: 'dodge' as FighterClassId },
    { rank: 3, name: 'КровавыйВепрь', elo: 18650, wins: 274, classId: 'tank' as FighterClassId },
    { rank: 4, name: 'СтражКоролевы', elo: 12480, wins: 201, classId: 'standard' as FighterClassId },
    { rank: 5, name: 'ЯдоваяСтрела',  elo: 7301,  wins: 189, classId: 'dodge' as FighterClassId },
    { rank: 6, name: 'СэрКалибур',    elo: 5190,  wins: 176, classId: 'crit' as FighterClassId },
    { rank: 7, name: 'ЧёрнаяВдова',   elo: 3087,  wins: 154, classId: 'standard' as FighterClassId },
    { rank: 8, name: 'Громовержец',    elo: 2990,  wins: 143, classId: 'tank' as FighterClassId },
    { rank: 9, name: 'ТвойПерсонаж',  elo: PLAYER_RATING, wins: 98, classId: 'standard' as FighterClassId, isMe: true },
    { rank: 10, name: 'НовыйРекрут',  elo: 1200,  wins: 67,  classId: 'standard' as FighterClassId },
  ];
  return (
    <div className="flex-1 flex flex-col cyber-bg">
      <div className="cyber-panel flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(240,180,41,0.15)', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost rounded px-3 py-1.5 text-xs flex items-center gap-1"><Icon name="ChevronLeft" size={14}/> Назад</button>
        <h2 className="font-cinzel text-lg font-bold" style={{ color: '#f0b429' }}>РЕЙТИНГ</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {leaders.map((p, i) => {
          const tier = getTier(p.elo);
          const fc = FIGHTER_CLASSES.find(f => f.id === p.classId)!;
          return (
            <div key={p.rank} className={`cyber-panel rounded-xl px-3 py-2.5 flex items-center gap-3 animate-fade-in ${p.isMe ? 'gold-glow' : ''}`}
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
              <div className="font-cinzel font-bold text-base w-7 text-center" style={{ color: p.rank <= 3 ? '#f0b429' : '#3a2a10' }}>
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
              </div>
              <div style={{ width: 32, height: 44, flexShrink: 0 }}>
                <FighterSVG rating={p.elo} classId={p.classId}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: '0.85rem' }}>{fc.icon}</span>
                  <div className="font-cinzel font-bold text-sm truncate" style={{ color: p.isMe ? '#f0b429' : '#c8a870' }}>
                    {p.name}{p.isMe && <span className="ml-1" style={{ color: '#4a3820', fontSize: 9 }}>(Вы)</span>}
                  </div>
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

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen]       = useState<Screen>('menu');
  const [battleMode, setBattleMode] = useState<BattleMode>('solo');
  const [gameState, setGameState]  = useState<GameState>(INITIAL_GAME);

  const navigate = (s: Screen, mode?: BattleMode) => {
    if (mode) setBattleMode(mode);
    setScreen(s);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#050810', overflow: 'hidden' }}>
      {screen === 'menu' && <TopBar coins={gameState.coins} energy={gameState.energy}/>}
      {screen === 'menu'        && <MainMenu onNavigate={navigate} selectedClass={gameState.selectedClass}/>}
      {screen === 'battle'      && <BattleScreen mode={battleMode} playerRating={PLAYER_RATING} playerClass={gameState.selectedClass} onBack={() => setScreen('menu')}/>}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('menu')}/>}
      {screen === 'shop'        && <Shop onBack={() => setScreen('menu')} gameState={gameState} setGameState={setGameState}/>}
    </div>
  );
}