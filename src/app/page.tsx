'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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

// Действия и последовательности для всех сценариев
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
      { id: 'aed', label: 'Работа с АНД' },
    ],
    order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'ecg', 'call', 'aed']
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
  // Для остальных сценариев используем копию ОКС (потом допишем свои действия)
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

// Кликабельные зоны на картинке
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
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);

  // Челленджи
  const [challenge, setChallenge] = useState<string | null>(null);
  const [capRefillTimer, setCapRefillTimer] = useState(0);
  const [capRefillSuccess, setCapRefillSuccess] = useState(false);
  const capRefillInterval = useRef<NodeJS.Timeout | null>(null);

  // АНД
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);

  const currentActions = getActions(scenario);
  const currentOrder = getOrder(scenario);

  useEffect(() => {
    if (!gameStarted || finished) return;
    if (timeLeft <= 0) { finishScenario(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished, gameStarted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aedState === 'analyzing' && aedTimer > 0) {
      timer = setTimeout(() => setAedTimer((t) => t - 1), 1000);
    } else if (aedState === 'analyzing' && aedTimer === 0) {
      setAedState('shock');
    }
    return () => clearTimeout(timer);
  }, [aedState, aedTimer]);

  const startCapRefill = () => {
    setCapRefillSuccess(false);
    setCapRefillTimer(5);
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
    setChallenge(null);
  };

  const handleActionClick = (id: string) => {
    if (id === 'pulse') { setChallenge('pulse'); return; }
    if (id === 'cap_refill') { setChallenge('cap_refill'); return; }
    if (id === 'consciousness') { setChallenge('consciousness'); return; }
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

  // --- ЭКРАН ВЫБОРА СЦЕНАРИЯ ---
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

  // --- ЭКРАН РЕЗУЛЬТАТА ---
  if (finished) {
    const isPassed = score === 100;
    return (
      <div className={`min-h-screen p-8 flex flex-col items-center justify-center ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
        <h1 className="text-4xl font-bold mb-4">{isPassed ? 'Экзамен сдан! 🎉' : 'Экзамен не сдан 😔'}</h1>
        <p className={`text-6xl font-bold mb-8 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md max-h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Разбор действий:</h2>
          {!isPassed && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm"><strong>Ошибка!</strong> Вы нарушили последовательность.</div>}
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
              </div>
            );
          })}
        </div>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">Пройти заново</button>
      </div>
    );
  }

  // --- ИНТЕРФЕЙС ---
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className="text-2xl font-mono text-green-400 font-bold tracking-widest">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      {/* Челленджи */}
      {challenge === 'pulse' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Проверка пульса</h3>
            <div className="space-y-2">
              <button onClick={() => { setHelperMessage('Ошибка: нужно с 2-х сторон!'); setChallenge(null); }} className="w-full p-3 border rounded text-left">На одной руке</button>
              <button onClick={() => { toggleAction('pulse'); setHelperMessage('Верно!'); }} className="w-full p-3 border rounded text-left bg-green-50">На двух руках</button>
            </div>
          </div>
        </div>
      )}

      {challenge === 'cap_refill' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">Симптом белого пятна</h3>
            <button onMouseDown={startCapRefill} onMouseUp={stopCapRefill} onMouseLeave={stopCapRefill} onTouchStart={startCapRefill} onTouchEnd={stopCapRefill} className={`w-full py-4 rounded-xl font-bold ${capRefillSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
              {capRefillSuccess ? 'Выполнено!' : capRefillTimer > 0 ? `Удерживайте: ${capRefillTimer}...` : 'Удерживайте 5 секунд'}
            </button>
            {capRefillSuccess && <button onClick={() => { toggleAction('cap_refill'); }} className="mt-4 text-blue-600">Продолжить</button>}
          </div>
        </div>
      )}

      {challenge === 'consciousness' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Оценка сознания</h3>
            <button onClick={() => { setHelperMessage('Ошибка: нужно встряхнуть и спросить!'); setChallenge(null); }} className="w-full p-3 border rounded text-left mb-2">Просто окрикнуть</button>
            <button onClick={() => { toggleAction('consciousness'); setHelperMessage('Верно!'); }} className="w-full p-3 border rounded text-left bg-green-50">Встряхнуть + спросить</button>
          </div>
        </div>
      )}

      {/* Всплывающие сообщения */}
      {helperMessage && (
        <div className="absolute top-20 left-4 z-50 max-w-sm">
          <div className="bg-white text-gray-800 p-4 rounded-xl shadow-2xl border-l-4 border-blue-500">
            <p className="font-medium">{helperMessage}</p>
            <button onClick={() => setHelperMessage(null)} className="mt-2 text-blue-600 text-sm">Закрыть</button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />
        
        {/* Зоны */}
        {HOTSPOTS.map((spot) => (
          <button key={spot.id} onClick={() => setActiveHotspot(spot.id)} className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl z-10" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }} />
        ))}

        {/* Окно действий */}
        {activeHotspot && !aedOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <button onClick={() => setActiveHotspot(null)} className="float-right font-bold">✕</button>
              <h3 className="text-xl font-bold mb-4">Действия</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {currentActions.map((action) => {
                  if (activeHotspot === 'patient' && !['consciousness', 'airway', 'pulse', 'cap_refill'].includes(action.id)) return null;
                  if (activeHotspot === 'crash_cart' && !['gloves', 'oxygen', 'adrenaline'].includes(action.id)) return null;
                  if (activeHotspot === 'monitor' && !['ecg', 'spo2'].includes(action.id)) return null;
                  if (activeHotspot === 'phone' && action.id !== 'call') return null;
                  if (activeHotspot === 'aed') return (
                    <button key="aed-btn" onClick={() => { setAedOpen(true); setActiveHotspot(null); }} className="w-full text-left p-3 rounded border-2 border-gray-200 hover:border-blue-300">
                      Открыть АНД
                    </button>
                  );

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

        {/* АНД */}
        {aedOpen && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-4 border-gray-600 rounded-3xl p-8 w-full max-w-md flex flex-col items-center">
              <div className="w-full bg-black text-green-400 text-center p-6 rounded-lg mb-6 min-h-[120px] flex flex-col justify-center">
                {aedState === 'idle' && <span className="text-xl">АНД ГОТОВ</span>}
                {aedState === 'analyzing' && <span className="text-2xl animate-pulse">АНАЛИЗ... {aedTimer}</span>}
                {aedState === 'shock' && <span className="text-2xl text-red-500 font-bold animate-pulse">РАЗРЯД!</span>}
                {aedState === 'success' && <span className="text-2xl text-green-500">ГОТОВО</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => { if (aedState === 'idle') { setAedState('analyzing'); setAedTimer(3); } }} disabled={aedState !== 'idle'} className="bg-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl">Анализ</button>
                <button onClick={() => { if (aedState === 'shock') { setAedState('success'); setActions({...actions, aed: true}); } }} disabled={aedState !== 'shock'} className="bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl">Разряд</button>
              </div>
              <button onClick={() => setAedOpen(false)} className="mt-6 text-gray-400 underline">Закрыть</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
