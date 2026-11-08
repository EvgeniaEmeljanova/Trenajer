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

const ALL_ACTIONS = [
  { id: 'consciousness', label: 'Оценить сознание (встряхнуть, спросить)' },
  { id: 'gloves', label: 'Надеть перчатки' },
  { id: 'airway', label: 'Оценить проходимость дыхательных путей' },
  { id: 'spo2', label: 'Пульсоксиметрия' },
  { id: 'oxygen', label: 'Кислородотерапия по показаниям' },
  { id: 'respiratory_rate', label: 'Подсчет ЧДД (10 сек)' },
  { id: 'percussion', label: 'Сравнительная перкуссия легких' },
  { id: 'auscultation', label: 'Аускультация легких' },
  { id: 'trachea', label: 'Осмотр трахеи и вен шеи' },
  { id: 'pulse', label: 'Пульс на лучевой и сонной артериях (10 сек, с 2-х сторон)' },
  { id: 'bp', label: 'Измерить АД' },
  { id: 'heart_ausc', label: 'Аускультация сердца' },
  { id: 'cap_refill', label: 'Симптом белого пятна (5 сек)' },
  { id: 'skin', label: 'Оценить цвет и влажность кожи' },
  { id: 'ecg', label: 'Снять ЭКГ в 12 отведениях' },
  { id: 'ecg_interpret', label: 'Интерпретировать ЭКГ' },
  { id: 'venous', label: 'Венозный доступ и забор анализов' },
  { id: 'pupils', label: 'Оценить фотореакцию зрачков' },
  { id: 'muscle_tone', label: 'Оценить тонус мышц' },
  { id: 'glucose', label: 'Уровень глюкозы' },
  { id: 'abdomen', label: 'Пальпация живота' },
  { id: 'call', label: 'Вызвать СМП/ОРИТ' },
  { id: 'adrenaline', label: 'Ввести адреналин' },
  { id: 'aed', label: 'Работа с АНД' },
];

const SCENARIO_DATA: Record<ScenarioType, { order: string[] }> = {
  OKS1: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'ecg', 'ecg_interpret', 'venous', 'pupils', 'muscle_tone', 'glucose', 'abdomen', 'call', 'aed'] },
  ANAPHYLAXIS: { order: ['consciousness', 'gloves', 'airway', 'adrenaline', 'oxygen', 'call'] },
  OKS2: { order: [] }, ZHKK: { order: [] }, BOS: { order: [] }, TELA: { order: [] }, PNEUMOTHORAX: { order: [] }, HYPOGLYCEMIA: { order: [] }, HYPERGLYCEMIA: { order: [] },
};

const HOTSPOTS = [
  { id: 'patient', x: 42, y: 25, w: 16, h: 30, label: 'Пациент' },
  { id: 'crash_cart', x: 28, y: 25, w: 12, h: 20, label: 'Укладка' },
  { id: 'monitor', x: 60, y: 15, w: 10, h: 18, label: 'Монитор' },
  { id: 'phone', x: 75, y: 20, w: 8, h: 10, label: 'Телефон' },
  { id: 'aed', x: 72, y: 5, w: 8, h: 10, label: 'АНД' },
];

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioType | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(510);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [capRefillTimer, setCapRefillTimer] = useState(0);
  const [capRefillSuccess, setCapRefillSuccess] = useState(false);
  const capRefillInterval = useRef<NodeJS.Timeout | null>(null);
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);

  const currentOrder = scenario ? (SCENARIO_DATA[scenario].order.length > 0 ? SCENARIO_DATA[scenario].order : SCENARIO_DATA.OKS1.order) : [];

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

  const startExam = () => {
    const keys = Object.keys(SCENARIO_TITLES) as ScenarioType[];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setScenario(randomKey);
    setGameStarted(true);
  };

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

    if (supabase && scenario) {
      try {
        await supabase.from('attempts').insert({ scenario_id: scenario, score: calculatedScore, actions: actions });
      } catch (e) { console.error(e); }
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Брифинг аккредитуемого</h1>
          <div className="space-y-4 text-lg text-gray-200 leading-relaxed">
            <p>Вы — врач своей специальности. Медицинский брат/сестра вызвал/а Вас на помощь.</p>
            <p>Перед Вами пациент <strong>45 лет</strong> (приблизительный вес 60 кг, рост 165 см) с установленным периферическим венозным катетером.</p>
            <p>На этаже есть укладка экстренной медицинской помощи и автоматический наружный дефибриллятор (АНД).</p>
            <p>Медицинский брат/сестра — Ваш помощник, недавно приступил/а к работе, информации о причинах резкого ухудшения состояния пациента не имеет. Он/а будет выполнять по Вашему назначению манипуляции, входящие в его/ее компетенцию.</p>
          </div>
          <button onClick={startExam} className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl transition shadow-lg">
            Приступить к осмотру (Случайный сценарий)
          </button>
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
          <h2 className="text-xl font-semibold mb-2">Сценарий: {scenario ? SCENARIO_TITLES[scenario] : ''}</h2>
          <h3 className="text-lg font-semibold mb-2 mt-4">Разбор действий:</h3>
          {!isPassed && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm"><strong>Ошибка!</strong> Вы нарушили последовательность.</div>}
          {currentOrder.map((correctId, index) => {
            const action = ALL_ACTIONS.find(a => a.id === correctId);
            const userActionId = sequence[index];
            const isCorrectStep = userActionId === correctId;
            return (
              <div key={index} className="flex flex-col p-2 border-b last:border-0">
                <span className="text-sm text-gray-500 mb-1">Шаг {index + 1}:</span>
                <div className={`flex justify-between font-medium ${isCorrectStep ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{action?.label}</span>
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

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      <div className="absolute bottom-4 sm:top-4 sm:bottom-auto left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className="text-2xl font-mono text-green-400 font-bold tracking-widest">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      {challenge === 'pulse' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Проверка пульса</h3>
            <div className="space-y-2">
              <button onClick={() => { setHelperMessage('Ошибка: нужно с 2-х сторон!'); setChallenge(null); }} className="w-full p-3 border rounded text-left">На одной руке</button>
              <button onClick={() => { toggleAction('pulse'); setHelperMessage('Верно!'); }} className="w-full p-3 border rounded text-left bg-green-50">На двух руках (лучевая и сонная)</button>
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
            <button onClick={() => { toggleAction('consciousness'); setHelperMessage('Верно!'); }} className="w-full p-3 border rounded text-left bg-green-50">Встряхнуть за плечи + громко спросить</button>
          </div>
        </div>
      )}

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
        
        {HOTSPOTS.map((spot) => (
          <button key={spot.id} onClick={() => setActiveHotspot(spot.id)} className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl z-10" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }} />
        ))}

        {activeHotspot && !aedOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <button onClick={() => setActiveHotspot(null)} className="float-right font-bold">✕</button>
              <h3 className="text-xl font-bold mb-4">Действия</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {ALL_ACTIONS.map((action) => {
                  if (activeHotspot === 'patient' && !['consciousness', 'airway', 'respiratory_rate', 'percussion', 'auscultation', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'pupils', 'muscle_tone', 'abdomen'].includes(action.id)) return null;
                  if (activeHotspot === 'crash_cart' && !['gloves', 'oxygen', 'adrenaline'].includes(action.id)) return null;
                  if (activeHotspot === 'monitor' && !['ecg', 'ecg_interpret', 'spo2'].includes(action.id)) return null;
                  if (activeHotspot === 'phone' && action.id !== 'call') return null;
                  if (activeHotspot === 'aed') {
                    return <button key="aed-btn" onClick={() => { setAedOpen(true); setActiveHotspot(null); }} className="w-full text-left p-3 rounded border-2 border-gray-200 hover:border-blue-300 mb-2">Открыть АНД</button>;
                  }

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
