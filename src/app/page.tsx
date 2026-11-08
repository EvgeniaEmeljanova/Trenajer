'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- ТИПЫ СЦЕНАРИЕВ ---
type ScenarioType = 'OKS1' | 'OKS2' | 'ANAPHYLAXIS' | 'ZHKK' | 'BOS' | 'TELA' | 'PNEUMOTHORAX' | 'HYPOGLYCEMIA' | 'HYPERGLYCEMIA';

const SCENARIO_TITLES = {
  OKS1: 'ОКС 1 (Инфаркт миокарда)',
  OKS2: 'ОКС 2 (Инфаркт миокарда с осложнениями)',
  ANAPHYLAXIS: 'Анафилактический шок (АШ)',
  ZHKK: 'Желудочно-кишечное кровотечение (ЖКК)',
  BOS: 'Бронхообструктивный синдром (БОС)',
  TELA: 'Тромбоэмболия легочной артерии (ТЭЛА)',
  PNEUMOTHORAX: 'Пневмоторакс',
  HYPOGLYCEMIA: 'Гипогликемия',
  HYPERGLYCEMIA: 'Гипергликемия',
};

// --- ДЕЙСТВИЯ И ПОСЛЕДОВАТЕЛЬНОСТЬ ---
const SCENARIO_DATA: Record<ScenarioType, { actions: { id: string, label: string }[], order: string[] }> = {
  OKS1: {
    actions: [
      { id: 'consciousness', label: 'Оценить сознание' },
      { id: 'gloves', label: 'Надеть перчатки' },
      { id: 'airway', label: 'Оценить проходимость дыхательных путей' },
      { id: 'spo2', label: 'Пульсоксиметрия' },
      { id: 'oxygen', label: 'Кислородотерапия' },
      { id: 'ecg', label: 'Снять ЭКГ' },
      { id: 'call', label: 'Вызвать СМП' },
    ],
    order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'ecg', 'call']
  },
  ANAPHYLAXIS: {
    actions: [
      { id: 'consciousness', label: 'Оценить сознание' },
      { id: 'gloves', label: 'Надеть перчатки' },
      { id: 'airway', label: 'Оценить проходимость дыхательных путей' },
      { id: 'adrenaline', label: 'Ввести адреналин' },
      { id: 'oxygen', label: 'Кислородотерапия' },
      { id: 'call', label: 'Вызвать СМП' },
    ],
    order: ['consciousness', 'gloves', 'airway', 'adrenaline', 'oxygen', 'call']
  },
  OKS2: { actions: [], order: [] },
  ZHKK: { actions: [], order: [] },
  BOS: { actions: [], order: [] },
  TELA: { actions: [], order: [] },
  PNEUMOTHORAX: { actions: [], order: [] },
  HYPOGLYCEMIA: { actions: [], order: [] },
  HYPERGLYCEMIA: { actions: [], order: [] },
};

const getActions = (scenario: ScenarioType) => {
  const data = SCENARIO_DATA[scenario];
  return data.actions.length > 0 ? data.actions : SCENARIO_DATA.OKS1.actions;
};

const getOrder = (scenario: ScenarioType) => {
  const data = SCENARIO_DATA[scenario];
  return data.order.length > 0 ? data.order : SCENARIO_DATA.OKS1.order;
};

const VITALS: Record<string, Record<string, string>> = {
  OKS1: {
    consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
    airway: 'Дыхательные пути визуально проходимы',
    spo2: 'Сатурация 88-89%',
    oxygen: 'Кислород подключен',
    ecg: 'На ЭКГ подъем ST',
  },
  ANAPHYLAXIS: {
    consciousness: 'Отвечает стоном',
    airway: 'Отек языка и губ',
    adrenaline: 'Адреналин введен. Давление начинает расти',
    oxygen: 'Кислород подключен',
  }
};

const HOTSPOTS = [
  { id: 'patient', x: 42, y: 25, w: 16, h: 30, label: 'Пациент' },
  { id: 'crash_cart', x: 28, y: 25, w: 12, h: 20, label: 'Укладка' },
  { id: 'monitor', x: 60, y: 15, w: 10, h: 18, label: 'Монитор' },
  { id: 'phone', x: 75, y: 20, w: 8, h: 10, label: 'Телефон' },
  { id: 'aed', x: 72, y: 5, w: 8, h: 10, label: 'АНД' },
];

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioType>('OKS1');
  const [gameStarted, setGameStarted] = useState(false);
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(510);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Состояния для интерактивных челленджей
  const [challenge, setChallenge] = useState<string | null>(null); // Какой челлендж открыт
  const [capRefillTimer, setCapRefillTimer] = useState(0);
  const [capRefillSuccess, setCapRefillSuccess] = useState(false);
  const capRefillInterval = useRef<NodeJS.Timeout | null>(null);

  const currentActions = getActions(scenario);
  const currentOrder = getOrder(scenario);

  useEffect(() => {
    if (!gameStarted || finished) return;
    if (timeLeft <= 0) { finishScenario(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished, gameStarted]);

  // Логика для удержания кнопки "Симптом белого пятна"
  const startCapRefill = () => {
    setCapRefillSuccess(false);
    setCapRefillTimer(5); // 5 секунд
    if (capRefillInterval.current) clearInterval(capRefillInterval.current);
    capRefillInterval.current = setInterval(() => {
      setCapRefillTimer((prev) => {
        if (prev <= 1) {
          clearInterval(capRefillInterval.current!);
          setCapRefillSuccess(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCapRefill = () => {
    if (capRefillInterval.current) clearInterval(capRefillInterval.current);
    if (!capRefillSuccess) setCapRefillTimer(0);
  };

  const toggleAction = (id: string) => {
    if (actions[id]) return;
    setActions((prev) => ({ ...prev, [id]: true }));
    setSequence((prev) => [...prev, id]);
    const vitals = VITALS[scenario];
    if (vitals && vitals[id]) setHelperMessage(vitals[id]);
    setChallenge(null);
  };

  // Запуск челленджей
  const handleActionClick = (id: string) => {
    if (actions[id]) return; // Уже сделано

    // Если это пульс - спрашиваем, как проверяли
    if (id === 'pulse') {
      setChallenge('pulse');
      return;
    }
    // Если это симптом белого пятна - засекаем 5 секунд
    if (id === 'cap_refill') {
      setChallenge('cap_refill');
      return;
    }
    // Если это сознание - уточняем детали
    if (id === 'consciousness') {
      setChallenge('consciousness');
      return;
    }

    // Остальные действия просто выполняются
    toggleAction(id);
  };

  const finishScenario = async () => {
    setFinished(true);
    let calculatedScore = 0;
    let isOrderCorrect = true;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] !== currentOrder[i]) { isOrderCorrect = false; break; }
    }

    if (sequence.length === currentOrder.length && isOrderCorrect) calculatedScore = 100;
    else calculatedScore = 0;
    setScore(calculatedScore);

    if (supabase) {
      try {
        await supabase.from('attempts').insert({ scenario_id: scenario, score: calculatedScore, actions: actions });
      } catch (e) { console.error(e); }
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-500">ВЫБЕРИТЕ СЦЕНАРИЙ</h1>
        <div className="space-y-4 w-full max-w-md">
          {(Object.keys(SCENARIO_TITLES) as ScenarioType[]).map((key) => (
            <button key={key} onClick={() => { setScenario(key); setGameStarted(true); }} className="w-full p-6 rounded-xl border-2 text-left transition border-gray-700 bg-gray-800 hover:border-gray-500">
              <h2 className="text-xl font-bold">{SCENARIO_TITLES[key]}</h2>
              <p className="text-sm text-gray-400 mt-2">Нажмите, чтобы начать</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    const isPassed = score === 100;
    return (
      <div className={`min-h-screen p-8 flex flex-col items-center justify-center ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
        <h1 className="text-4xl font-bold mb-4">{isPassed ? 'Экзамен сдан! 🎉' : 'Экзамен не сдан 😔'}</h1>
        <p className={`text-6xl font-bold mb-8 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md max-h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Разбор действий:</h2>
          {!isPassed && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm"><strong>Ошибка!</strong> Вы нарушили последовательность или пропустили шаги.</div>}
          {currentOrder.map((correctId, index) => {
            const actionLabel = currentActions.find(a => a.id === correctId)?.label;
            const userActionId = sequence[index];
            const isCorrectStep = userActionId === correctId;
            return (
              <div key={index} className="flex flex-col p-2 border-b last:border-0">
                <span className="text-sm text-gray-500 mb-1">Шаг {index + 1}:</span>
                <div className={`flex justify-between font-medium ${isCorrectStep ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{actionLabel}</span>
                  <span>{isCorrectStep ? '✓' : '✗'}</span>
                </div>
                {!isCorrectStep && userActionId && <span className="text-xs text-red-400 mt-1">(Вы сделали: {currentActions.find(a => a.id === userActionId)?.label})</span>}
              </div>
            );
          })}
        </div>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">Пройти заново</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Таймер и кнопка Завершить */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-50 flex items-center gap-6 shadow-lg">
        <span className="text-2xl font-mono text-green-400 font-bold tracking-widest">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      {/* Всплывающие окна для челленджей */}
      {challenge === 'pulse' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4">Проверка пульса</h3>
            <p className="mb-4 text-sm">Как вы будете оценивать пульс?</p>
            <div className="space-y-2">
              <button onClick={() => { setHelperMessage('Ошибка: Пульс нужно проверять с 2-х сторон!'); setChallenge(null); }} className="w-full p-3 rounded border text-left hover:bg-gray-100">На одной руке</button>
              <button onClick={() => toggleAction('pulse')} className="w-full p-3 rounded border text-left hover:bg-green-50 hover:border-green-500">На двух руках одновременно</button>
              <button onClick={() => { setHelperMessage('Ошибка: Пульс нужно проверять с 2-х сторон!'); setChallenge(null); }} className="w-full p-3 rounded border text-left hover:bg-gray-100">Только на сонной артерии</button>
            </div>
          </div>
        </div>
      )}

      {challenge === 'cap_refill' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative text-center">
            <h3 className="text-xl font-bold mb-4">Симптом белого пятна</h3>
            <p className="mb-4 text-sm">Зажмите и удерживайте кнопку 5 секунд.</p>
            <button
              onMouseDown={startCapRefill}
              onMouseUp={stopCapRefill}
              onMouseLeave={stopCapRefill}
              onTouchStart={startCapRefill}
              onTouchEnd={stopCapRefill}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${capRefillSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              {capRefillSuccess ? 'Выполнено!' : capRefillTimer > 0 ? `Удерживайте: ${capRefillTimer}...` : 'Удерживайте 5 секунд'}
            </button>
            {capRefillSuccess && <button onClick={() => toggleAction('cap_refill')} className="mt-4 text-blue-600 hover:underline">Продолжить</button>}
          </div>
        </div>
      )}

      {challenge === 'consciousness' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4">Оценка сознания</h3>
            <div className="space-y-2">
              <button onClick={() => setHelperMessage('Ошибка: Нужно встряхнуть за плечи и громко спросить!')} className="w-full p-3 rounded border text-left hover:bg-gray-100">Просто окрикнуть</button>
              <button onClick={() => toggleAction('consciousness')} className="w-full p-3 rounded border text-left hover:bg-green-50 hover:border-green-500">Встряхнуть за плечи + громко спросить</button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl border-2 border-red-400 text-center animate-pulse">
            <p className="font-bold text-lg">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="mt-2 bg-white text-red-600 px-4 py-1 rounded font-bold text-sm">Понятно</button>
          </div>
        </div>
      )}

      {helperMessage && (
        <div className="absolute top-20 left-4 z-50 max-w-sm">
          <div className="bg-white text-gray-800 p-4 rounded-xl shadow-2xl border-l-4 border-blue-500">
            <p className="font-medium">{helperMessage}</p>
            <button onClick={() => setHelperMessage(null)} className="mt-2 text-blue-600 text-sm hover:underline">Закрыть</button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />
        
        {HOTSPOTS.map((spot) => (
          <button key={spot.id} onClick={() => setActiveHotspot(spot.id)} className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl transition-all cursor-pointer group z-10" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}>
            <span className="hidden group-hover:block absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{spot.label}</span>
          </button>
        ))}

        {activeHotspot && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setActiveHotspot(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
              <h3 className="text-xl font-bold mb-4 border-b pb-2">Действия для: {HOTSPOTS.find(h => h.id === activeHotspot)?.label}</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {currentActions.map((action) => {
                  if (activeHotspot === 'patient' && !['consciousness', 'airway', 'adrenaline', 'pulse', 'cap_refill'].includes(action.id)) return null;
                  if (activeHotspot === 'crash_cart' && !['gloves', 'oxygen'].includes(action.id)) return null;
                  if (activeHotspot === 'monitor' && !['ecg', 'spo2'].includes(action.id)) return null;
                  if (activeHotspot === 'phone' && action.id !== 'call') return null;
                  if (activeHotspot === 'aed') return <p key="aed" className="text-gray-500 italic">АНД (В разработке)</p>;

                  return (
                    <button key={action.id} onClick={() => handleActionClick(action.id)} className={`w-full text-left p-3 rounded-lg border-2 transition ${actions[action.id] ? 'bg-green-50 border-green-500 text-green-700 font-medium' : 'border-gray-200 hover:border-blue-300'}`}>
                      {action.label} {actions[action.id] && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
