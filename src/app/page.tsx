'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

type ScenarioType = 'OKS1' | 'ANAPHYLAXIS' | 'ZHKK' | 'BOS';

const SCENARIO_TITLES = {
  OKS1: 'ОКС 1 (Инфаркт миокарда)',
  ANAPHYLAXIS: 'Анафилактический шок (АШ)',
  ZHKK: 'Желудочно-кишечное кровотечение (ЖКК)',
  BOS: 'Бронхообструктивный синдром (БОС)',
};

// Упрощенные действия для теста
const SCENARIO_DATA = {
  OKS1: {
    actions: [
      { id: 'consciousness', label: 'Оценить сознание' },
      { id: 'gloves', label: 'Надеть перчатки' },
      { id: 'call', label: 'Вызвать СМП' },
      { id: 'aed', label: 'Работа с АНД' }, // <-- Добавили АНД
    ],
    order: ['consciousness', 'gloves', 'call', 'aed']
  },
  ANAPHYLAXIS: { actions: [{ id: 'consciousness', label: 'Оценить сознание' }], order: ['consciousness'] },
  ZHKK: { actions: [{ id: 'consciousness', label: 'Оценить сознание' }], order: ['consciousness'] },
  BOS: { actions: [{ id: 'consciousness', label: 'Оценить сознание' }], order: ['consciousness'] },
};

const HOTSPOTS = [
  { id: 'patient', x: 42, y: 25, w: 16, h: 30, label: 'Пациент' },
  { id: 'aed', x: 72, y: 5, w: 8, h: 10, label: 'АНД' },
];

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioType>('OKS1');
  const [gameStarted, setGameStarted] = useState(false);
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(510);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Состояния для мини-игры АНД
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);

  const currentActions = SCENARIO_DATA[scenario].actions;
  const currentOrder = SCENARIO_DATA[scenario].order;

  useEffect(() => {
    if (!gameStarted || finished) return;
    if (timeLeft <= 0) { finishScenario(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished, gameStarted]);

  // Логика таймера АНД
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aedState === 'analyzing' && aedTimer > 0) {
      timer = setTimeout(() => setAedTimer((t) => t - 1), 1000);
    } else if (aedState === 'analyzing' && aedTimer === 0) {
      setAedState('shock'); // Анализ завершен, требуется разряд
    }
    return () => clearTimeout(timer);
  }, [aedState, aedTimer]);

  const handleActionClick = (id: string) => {
    if (id === 'aed') {
      setAedOpen(true);
      return;
    }
    setActions((prev) => ({ ...prev, [id]: true }));
    setActiveHotspot(null);
  };

  const finishScenario = async () => {
    setFinished(true);
    setScore(100); // Упрощенно для теста
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
    return (
      <div className="min-h-screen bg-green-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Станция пройдена</h1>
        <p className="text-6xl font-bold text-green-600 mb-8">{score}%</p>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">Пройти заново</button>
      </div>
    );
  }

  // --- ИНТЕРФЕЙС КОМНАТЫ ---
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      
      {/* Таймер */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className="text-2xl font-mono text-green-400 font-bold tracking-widest">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />
        
        {/* Кликабельные зоны */}
        {HOTSPOTS.map((spot) => (
          <button key={spot.id} onClick={() => setActiveHotspot(spot.id)} className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl transition-all cursor-pointer group z-10" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}>
            <span className="hidden group-hover:block absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{spot.label}</span>
          </button>
        ))}

        {/* Меню действий при клике на объект */}
        {activeHotspot && !aedOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4 backdrop-blur-sm">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setActiveHotspot(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
              <h3 className="text-xl font-bold mb-4 border-b pb-2">Действия</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {currentActions.map((action) => {
                  if (activeHotspot === 'patient' && action.id === 'aed') return null;
                  if (activeHotspot === 'aed' && action.id !== 'aed') return null;

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

        {/* --- МИНИ-ИГРА АНД (ДЕФИБРИЛЛЯТОР) --- */}
        {aedOpen && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-4 border-gray-600 rounded-3xl p-8 w-full max-w-md shadow-2xl relative flex flex-col items-center">
              
              {/* Экран дефибриллятора */}
              <div className="w-full bg-black text-green-400 font-mono text-center p-6 rounded-lg mb-6 border-2 border-gray-700 min-h-[120px] flex flex-col justify-center">
                {aedState === 'idle' && <span className="text-xl">АНД ГОТОВ К РАБОТЕ</span>}
                {aedState === 'analyzing' && <span className="text-2xl animate-pulse">АНАЛИЗ РИТМА... {aedTimer}</span>}
                {aedState === 'shock' && <span className="text-2xl text-red-500 font-bold animate-pulse">РАЗРЯД ТРЕБУЕТСЯ!<br/>НАЖМИТЕ КНОПКУ</span>}
                {aedState === 'success' && <span className="text-2xl text-green-500">РАЗРЯД НАНЕСЕН<br/>ПРОДОЛЖАЙТЕ СЛР</span>}
              </div>

              {/* Кнопки управления */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => { if (aedState === 'idle') { setAedState('analyzing'); setAedTimer(3); } }}
                  disabled={aedState !== 'idle'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition"
                >
                  Анализ ритма
                </button>
                <button 
                  onClick={() => { if (aedState === 'shock') { setAedState('success'); setActions(p => ({...p, aed: true})); } }}
                  disabled={aedState !== 'shock'}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition"
                >
                  РАЗРЯД
                </button>
              </div>

              {/* Кнопка выхода */}
              <button onClick={() => setAedOpen(false)} className="mt-6 text-gray-400 hover:text-white underline">
                Закрыть АНД
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
