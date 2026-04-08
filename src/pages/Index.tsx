import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type Screen = 'menu' | 'battle' | 'leaderboard' | 'shop';
type BattleMode = 'solo' | '2player' | '3player';

interface Fighter {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  emoji: string;
  color: string;
  isAttacking: boolean;
  isBlocking: boolean;
  isHit: boolean;
  isDead: boolean;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'block' | 'heal' | 'miss';
}

const ARENA_BG = 'https://cdn.poehali.dev/projects/adaf91d4-263f-4153-9849-4c7760bf7af5/files/cfc5795d-72d5-4c31-bb66-b7d1a2538378.jpg';

const FIGHTERS_TEMPLATES = [
  { name: 'Сэр Железный', emoji: '⚔️', color: '#f0b429' },
  { name: 'Тёмный Маг', emoji: '🧙', color: '#9b59b6' },
  { name: 'Берсерк', emoji: '🪓', color: '#e74c3c' },
];

function createFighter(id: number, template: typeof FIGHTERS_TEMPLATES[0]): Fighter {
  return {
    id,
    name: template.name,
    hp: 100,
    maxHp: 100,
    mana: 60,
    maxMana: 60,
    emoji: template.emoji,
    color: template.color,
    isAttacking: false,
    isBlocking: false,
    isHit: false,
    isDead: false,
  };
}

// ─── Top Bar ────────────────────────────────────────────────────────────────
function TopBar() {
  const [energy, setEnergy] = useState(85);
  const [coins, setCoins] = useState(1240);
  const [rating, setRating] = useState(1887);

  return (
    <div className="flex items-center justify-between px-4 py-2 stone-panel" style={{ borderBottom: '2px solid #6b4f1a' }}>
      <div className="flex items-center gap-4">
        {/* Energy */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⚡</span>
          <div className="flex items-center gap-1">
            <div className="w-24 h-2 rounded-full bg-stone-800 overflow-hidden border border-stone-600">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: `${energy}%`, boxShadow: '0 0 6px #f0b429' }} />
            </div>
            <span className="text-xs text-yellow-400 font-cinzel">{energy}/100</span>
          </div>
        </div>
        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-sm text-yellow-300 font-cinzel font-semibold">{coins.toLocaleString()}</span>
        </div>
      </div>
      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">🏆</span>
        <span className="text-sm font-cinzel font-bold text-yellow-400">{rating}</span>
        <span className="text-xs text-yellow-700 font-cinzel">ЭЛО</span>
      </div>
    </div>
  );
}

// ─── Main Menu ───────────────────────────────────────────────────────────────
interface MainMenuProps {
  onNavigate: (screen: Screen, mode?: BattleMode) => void;
}

const MENU_ITEMS = [
  { label: 'Одиночный поход', icon: '🗡️', mode: 'solo' as BattleMode, active: true, desc: 'Сразись с врагами королевства' },
  { label: 'Бой 2 игрока', icon: '⚔️', mode: '2player' as BattleMode, active: true, desc: 'Дуэль на одном устройстве' },
  { label: 'Бой 3 игрока', icon: '🛡️', mode: '3player' as BattleMode, active: true, desc: 'Три воина — один победит' },
  { label: 'Странствие', icon: '🗺️', mode: null, active: false, desc: 'Выйдет в ближайшем обновлении' },
  { label: 'Клан', icon: '🏰', mode: null, active: false, desc: 'Выйдет в ближайшем обновлении' },
  { label: 'Обитель', icon: '🏯', mode: null, active: false, desc: 'Выйдет в ближайшем обновлении' },
  { label: 'Магазин', icon: '💎', mode: null, active: true, screen: 'shop' as Screen, desc: 'Снаряжение и артефакты' },
  { label: 'Рейтинговая таблица', icon: '🏆', mode: null, active: true, screen: 'leaderboard' as Screen, desc: 'Лучшие воины королевства' },
];

function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center parchment-bg p-4" style={{ minHeight: '100%' }}>
      {/* Logo */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-6xl mb-2 animate-float">⚔️</div>
        <h1 className="font-cinzel text-5xl font-bold text-yellow-400 title-glow tracking-widest mb-1">
          АРЕНА
        </h1>
        <h2 className="font-cinzel text-2xl font-bold text-yellow-600 tracking-[0.4em] mb-1">
          ГЕРОЕВ
        </h2>
        <div className="rune-decoration ornament text-xs tracking-[0.5em] mt-2">Слава победителю</div>
      </div>

      {/* Decorative line */}
      <div className="flex items-center gap-3 mb-6 w-full max-w-md">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700 to-yellow-500" />
        <span className="text-yellow-500 text-sm">✦✦✦</span>
        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500 via-yellow-700 to-transparent" />
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
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
              menu-card-stagger opacity-0 animate-menu-enter
              relative p-4 rounded-lg text-left transition-all duration-200
              ${item.active ? 'btn-medieval' : 'btn-disabled'}
              ${i === 0 ? 'col-span-2' : ''}
            `}
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-cinzel text-sm font-bold leading-tight">{item.label}</span>
            </div>
            <p className="text-xs opacity-70 pl-1" style={{ fontFamily: 'Oswald, sans-serif', color: item.active ? '#d4b896' : '#6b4f1a' }}>
              {item.desc}
            </p>
            {!item.active && (
              <span className="absolute top-2 right-2 text-xs bg-stone-800 text-yellow-800 px-1.5 py-0.5 rounded font-cinzel border border-yellow-900">
                Скоро
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 rune-decoration text-center opacity-60 text-xs">
        ᚱᚢᚾᛖᛋ ✦ ᚢᚠ ✦ ᛗᛁᚷᚺᛏ
      </div>
    </div>
  );
}

// ─── Battle Screen ────────────────────────────────────────────────────────────
interface BattleScreenProps {
  mode: BattleMode;
  onBack: () => void;
}

function FighterCard({ fighter, side, onAttack, onBlock, onHeal, isMyTurn }: {
  fighter: Fighter;
  side: 'left' | 'right' | 'center';
  onAttack: () => void;
  onBlock: () => void;
  onHeal: () => void;
  isMyTurn: boolean;
}) {
  const hpPercent = (fighter.hp / fighter.maxHp) * 100;
  const manaPercent = (fighter.mana / fighter.maxMana) * 100;
  const isLowHp = hpPercent < 30;

  return (
    <div className={`
      stone-panel rounded-xl p-3 flex flex-col gap-2 relative
      ${fighter.isHit ? 'animate-shake' : ''}
      ${fighter.isDead ? 'opacity-40 grayscale' : ''}
      ${isMyTurn && !fighter.isDead ? 'gold-border' : ''}
      transition-all duration-200
    `} style={{ minWidth: 140 }}>
      {/* Fighter emoji / avatar */}
      <div className={`
        text-6xl text-center select-none
        ${fighter.isAttacking ? (side === 'left' ? 'animate-bounce-attack' : 'animate-bounce-attack-left') : ''}
        ${fighter.isBlocking ? 'scale-95' : ''}
        ${fighter.isDead ? 'rotate-90' : ''}
        transition-all duration-200
      `}>
        {fighter.isDead ? '💀' : fighter.emoji}
      </div>

      {/* Name */}
      <div className="text-center font-cinzel text-xs font-bold truncate" style={{ color: fighter.color }}>
        {fighter.name}
      </div>

      {/* HP */}
      <div>
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-red-400">❤️</span>
          <span className="font-cinzel text-xs text-red-400">{fighter.hp}/{fighter.maxHp}</span>
        </div>
        <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div className={isLowHp ? 'hp-bar-low h-full rounded-full' : 'hp-bar h-full rounded-full'} style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      {/* Mana */}
      <div>
        <div className="flex justify-between text-xs mb-0.5">
          <span>💧</span>
          <span className="font-cinzel text-xs text-blue-400">{fighter.mana}/{fighter.maxMana}</span>
        </div>
        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div className="mana-bar h-full rounded-full" style={{ width: `${manaPercent}%` }} />
        </div>
      </div>

      {/* Actions */}
      {isMyTurn && !fighter.isDead && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          <button onClick={onAttack} className="btn-medieval-red rounded px-1 py-1.5 text-xs font-cinzel text-center" title="Атака">
            ⚔️
          </button>
          <button onClick={onBlock} className="btn-medieval rounded px-1 py-1.5 text-xs font-cinzel text-center" title="Блок">
            🛡️
          </button>
          <button onClick={onHeal} disabled={fighter.mana < 15} className={fighter.mana >= 15 ? "btn-medieval rounded px-1 py-1.5 text-xs font-cinzel text-center" : "btn-disabled rounded px-1 py-1.5 text-xs"} title="Лечение">
            💚
          </button>
        </div>
      )}

      {/* Blocking indicator */}
      {fighter.isBlocking && (
        <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm border-2 border-blue-300 animate-pulse-glow">
          🛡️
        </div>
      )}
    </div>
  );
}

function BattleScreen({ mode, onBack }: BattleScreenProps) {
  const fighterCount = mode === '3player' ? 3 : 2;

  const initFighters = (): Fighter[] =>
    Array.from({ length: fighterCount }, (_, i) => createFighter(i, FIGHTERS_TEMPLATES[i % FIGHTERS_TEMPLATES.length]));

  const [fighters, setFighters] = useState<Fighter[]>(initFighters);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>(['⚔️ Битва началась!']);
  const [battleOver, setBattleOver] = useState(false);
  const [winner, setWinner] = useState<Fighter | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const floatId = useRef(0);

  const addFloat = useCallback((text: string, x: number, y: number, type: FloatingText['type']) => {
    const id = ++floatId.current;
    setFloatingTexts(prev => [...prev, { id, text, x, y, type }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);

  const addLog = useCallback((msg: string) => {
    setBattleLog(prev => [msg, ...prev].slice(0, 8));
  }, []);

  const nextTurn = useCallback((fs: Fighter[]) => {
    const aliveFighters = fs.filter(f => !f.isDead);
    if (aliveFighters.length <= 1) {
      setBattleOver(true);
      setWinner(aliveFighters[0] || null);
      return;
    }
    setCurrentTurn(prev => {
      let next = (prev + 1) % fs.length;
      while (fs[next]?.isDead) {
        next = (next + 1) % fs.length;
      }
      if (next === 0 || (prev >= next && !fs[0].isDead)) {
        setRoundNum(r => r + 1);
      }
      return next;
    });
  }, []);

  const handleAttack = useCallback(() => {
    setFighters(prev => {
      const fs = [...prev];
      const attacker = fs[currentTurn];
      if (attacker.isDead) return fs;

      const targets = fs.filter(f => f.id !== attacker.id && !f.isDead);
      if (!targets.length) return fs;

      const targetIdx = fs.indexOf(targets[Math.floor(Math.random() * targets.length)]);
      const baseDmg = 12 + Math.floor(Math.random() * 15);

      // Mark attacker as attacking
      fs[currentTurn] = { ...attacker, isAttacking: true };
      setTimeout(() => setFighters(p => p.map(f => f.id === attacker.id ? { ...f, isAttacking: false } : f)), 350);

      if (fs[targetIdx].isBlocking) {
        const blocked = Math.floor(baseDmg * 0.7);
        const dmg = baseDmg - blocked;
        fs[targetIdx] = { ...fs[targetIdx], hp: Math.max(0, fs[targetIdx].hp - dmg), isHit: true, isBlocking: false };
        addFloat(`-${dmg} 🛡️`, 50 + targetIdx * 30, 30, 'block');
        addLog(`🛡️ ${fs[targetIdx].name} заблокировал ${blocked} урона! Получил ${dmg}`);
      } else {
        const isCrit = Math.random() < 0.2;
        const dmg = isCrit ? Math.floor(baseDmg * 1.8) : baseDmg;
        const newHp = Math.max(0, fs[targetIdx].hp - dmg);
        fs[targetIdx] = { ...fs[targetIdx], hp: newHp, isHit: true, isDead: newHp <= 0 };
        addFloat(isCrit ? `💥 КРИТ! -${dmg}` : `-${dmg}`, 50 + targetIdx * 30, 30, 'damage');
        addLog(isCrit
          ? `💥 КРИТИЧЕСКИЙ УДАР! ${attacker.name} наносит ${dmg} урона!`
          : `⚔️ ${attacker.name} атакует ${fs[targetIdx].name}: -${dmg} HP`);
      }

      setTimeout(() => setFighters(p => p.map(f => f.id === fs[targetIdx].id ? { ...f, isHit: false } : f)), 400);
      setTimeout(() => nextTurn(fs), 300);
      return fs;
    });
  }, [currentTurn, addFloat, addLog, nextTurn]);

  const handleBlock = useCallback(() => {
    setFighters(prev => {
      const fs = prev.map((f, i) => i === currentTurn ? { ...f, isBlocking: true } : f);
      addLog(`🛡️ ${fs[currentTurn].name} принимает защитную стойку`);
      setTimeout(() => nextTurn(fs), 200);
      return fs;
    });
  }, [currentTurn, addLog, nextTurn]);

  const handleHeal = useCallback(() => {
    setFighters(prev => {
      const fs = [...prev];
      const f = fs[currentTurn];
      if (f.mana < 15) return fs;
      const healed = 20 + Math.floor(Math.random() * 10);
      fs[currentTurn] = { ...f, hp: Math.min(f.maxHp, f.hp + healed), mana: f.mana - 15 };
      addFloat(`+${healed} 💚`, 50 + currentTurn * 30, 30, 'heal');
      addLog(`💚 ${f.name} восстанавливает ${healed} HP`);
      setTimeout(() => nextTurn(fs), 200);
      return fs;
    });
  }, [currentTurn, addLog, addFloat, nextTurn]);

  const restartBattle = () => {
    setFighters(initFighters());
    setCurrentTurn(0);
    setBattleOver(false);
    setWinner(null);
    setBattleLog(['⚔️ Новая битва началась!']);
    setRoundNum(1);
    setFloatingTexts([]);
  };

  return (
    <div className="flex-1 flex flex-col relative" style={{ minHeight: '100%' }}>
      {/* Arena background */}
      <div className="absolute inset-0 z-0">
        <img src={ARENA_BG} alt="arena" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 arena-ground" />
      </div>

      {/* Header */}
      <div className="relative z-10 stone-panel flex items-center justify-between px-4 py-2">
        <button onClick={onBack} className="btn-medieval rounded px-3 py-1.5 text-xs font-cinzel flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Меню
        </button>
        <div className="text-center">
          <div className="font-cinzel text-sm text-yellow-400 font-bold">
            {mode === 'solo' ? '🗡️ Одиночный поход' : mode === '2player' ? '⚔️ Дуэль' : '🛡️ Трёхсторонняя битва'}
          </div>
          <div className="font-cinzel text-xs text-yellow-700">Раунд {roundNum}</div>
        </div>
        <div className="font-cinzel text-xs text-yellow-600 text-right">
          Ход:<br/>
          <span className="text-yellow-400 font-bold">{fighters[currentTurn]?.name}</span>
        </div>
      </div>

      {/* Floating damage texts */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className={`damage-number ${ft.type === 'block' ? 'block-number' : ft.type === 'heal' ? 'heal-number' : ''}`}
            style={{ left: `${20 + ft.id % 60}%`, top: '35%' }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Battle Over overlay */}
      {battleOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="stone-panel gold-border rounded-2xl p-8 text-center max-w-sm mx-4 animate-scale-in">
            <div className="text-7xl mb-4 animate-float">🏆</div>
            <h2 className="font-cinzel text-3xl font-bold text-yellow-400 title-glow mb-2">Победа!</h2>
            <p className="font-cinzel text-xl text-yellow-300 mb-2">{winner?.name || 'Ничья'}</p>
            <p className="text-yellow-700 text-sm mb-6 ornament">одержал победу в этой битве</p>
            <div className="flex gap-3 justify-center">
              <button onClick={restartBattle} className="btn-medieval rounded-lg px-5 py-2.5 font-cinzel text-sm">
                ⚔️ Снова
              </button>
              <button onClick={onBack} className="btn-medieval-red rounded-lg px-5 py-2.5 font-cinzel text-sm">
                🏠 Меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fighters area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-4 gap-4">
        {/* Fighters row */}
        <div className={`flex gap-3 justify-center items-start ${fighterCount === 3 ? 'flex-wrap' : ''}`}>
          {fighters.map((fighter, i) => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              side={i === 0 ? 'left' : i === fighterCount - 1 ? 'right' : 'center'}
              onAttack={handleAttack}
              onBlock={handleBlock}
              onHeal={handleHeal}
              isMyTurn={currentTurn === i && !battleOver}
            />
          ))}
        </div>

        {/* VS decoration */}
        <div className="text-center">
          <span className="font-cinzel text-2xl font-bold text-yellow-700 opacity-60">— VS —</span>
        </div>

        {/* Battle log */}
        <div className="stone-panel rounded-xl p-3 max-h-32 overflow-y-auto">
          <div className="rune-decoration text-center mb-2">Летопись битвы</div>
          {battleLog.map((log, i) => (
            <div key={i} className={`text-xs py-0.5 ${i === 0 ? 'text-yellow-300' : 'text-yellow-800'} font-oswald transition-all`}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Torch decorations */}
      <div className="absolute top-16 left-3 text-2xl torch animate-torch-flicker z-10 pointer-events-none">🔥</div>
      <div className="absolute top-16 right-3 text-2xl torch animate-torch-flicker z-10 pointer-events-none" style={{ animationDelay: '0.4s' }}>🔥</div>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ onBack }: { onBack: () => void }) {
  const leaders = [
    { rank: 1, name: 'ТёмныйРыцарь', elo: 2840, wins: 342, emoji: '🗡️' },
    { rank: 2, name: 'МагОгня', elo: 2711, wins: 289, emoji: '🔥' },
    { rank: 3, name: 'КровавыйВепрь', elo: 2650, wins: 274, emoji: '🪓' },
    { rank: 4, name: 'СтражКоролевы', elo: 2480, wins: 201, emoji: '⚜️' },
    { rank: 5, name: 'ЯдоваяСтрела', elo: 2301, wins: 189, emoji: '🏹' },
    { rank: 6, name: 'Сэр_Калибур', elo: 2190, wins: 176, emoji: '⚔️' },
    { rank: 7, name: 'ЧёрнаяВдова', elo: 2087, wins: 154, emoji: '🕷️' },
    { rank: 8, name: 'Громовержец', elo: 1990, wins: 143, emoji: '⚡' },
    { rank: 9, name: 'ТвойПерсонаж', elo: 1887, wins: 98, emoji: '🛡️', isMe: true },
    { rank: 10, name: 'НовыйРекрут', elo: 1700, wins: 67, emoji: '🗡️' },
  ];

  return (
    <div className="flex-1 flex flex-col parchment-bg">
      <div className="stone-panel flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className="btn-medieval rounded px-3 py-1.5 text-xs font-cinzel flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <h2 className="font-cinzel text-xl font-bold text-yellow-400">🏆 Рейтинговая таблица</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {leaders.map((p, i) => (
          <div
            key={p.rank}
            className={`stone-panel rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in ${p.isMe ? 'gold-border' : ''}`}
            style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'backwards' }}
          >
            <div className={`font-cinzel font-bold text-lg w-8 text-center ${p.rank <= 3 ? 'text-yellow-400' : 'text-yellow-800'}`}>
              {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
            </div>
            <span className="text-2xl">{p.emoji}</span>
            <div className="flex-1">
              <div className={`font-cinzel font-bold text-sm ${p.isMe ? 'text-yellow-400' : 'text-yellow-200'}`}>
                {p.name} {p.isMe && <span className="text-xs text-yellow-600">(Вы)</span>}
              </div>
              <div className="text-xs text-yellow-800">{p.wins} побед</div>
            </div>
            <div className="text-right">
              <div className="font-cinzel font-bold text-yellow-400">{p.elo}</div>
              <div className="text-xs text-yellow-700">ЭЛО</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
function Shop({ onBack }: { onBack: () => void }) {
  const items = [
    { name: 'Меч Рассвета', icon: '⚔️', price: 450, desc: '+15 к атаке', type: 'weapon' },
    { name: 'Щит Предков', icon: '🛡️', price: 380, desc: '+20 к защите', type: 'armor' },
    { name: 'Зелье Силы', icon: '🧪', price: 120, desc: '+50 HP разово', type: 'potion' },
    { name: 'Амулет Мага', icon: '💎', price: 600, desc: '+30 к мане', type: 'magic' },
    { name: 'Руна Удачи', icon: '🔮', price: 200, desc: '+10% крит. шанс', type: 'rune' },
    { name: 'Кольчуга', icon: '🪖', price: 520, desc: '+25 к броне', type: 'armor' },
  ];

  return (
    <div className="flex-1 flex flex-col parchment-bg">
      <div className="stone-panel flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className="btn-medieval rounded px-3 py-1.5 text-xs font-cinzel flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <h2 className="font-cinzel text-xl font-bold text-yellow-400">💎 Магазин</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <span>🪙</span>
          <span className="font-cinzel text-yellow-300 font-bold">1240</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="stone-panel rounded-xl p-4 flex flex-col gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards' }}
          >
            <div className="text-4xl text-center">{item.icon}</div>
            <div className="font-cinzel font-bold text-sm text-yellow-300 text-center">{item.name}</div>
            <div className="text-xs text-yellow-700 text-center">{item.desc}</div>
            <button className="btn-medieval rounded-lg px-3 py-2 text-xs font-cinzel mt-auto flex items-center justify-center gap-1">
              🪙 {item.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [battleMode, setBattleMode] = useState<BattleMode>('solo');

  const navigate = (s: Screen, mode?: BattleMode) => {
    if (mode) setBattleMode(mode);
    setScreen(s);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-900" style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {screen === 'menu' && <TopBar />}
      {screen === 'menu' && <MainMenu onNavigate={navigate} />}
      {screen === 'battle' && <BattleScreen mode={battleMode} onBack={() => setScreen('menu')} />}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('menu')} />}
      {screen === 'shop' && <Shop onBack={() => setScreen('menu')} />}
    </div>
  );
}
