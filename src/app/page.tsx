'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
<<<<<<< HEAD
import Helper from './Helper';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

=======

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

>>>>>>> bfbf9310a1f024e62c76795ab6c15863997b3f78
const ROOM_OBJECTS = [
  { id: 'patient', x: 43, y: 40, label: 'Пациент (Осмотр)' },
  { id: 'crash_cart', x: 30, y: 35, label: 'Укладка (Лекарства)' },
  { id: 'monitor', x: 63, y: 20, label: 'Монитор (ЭКГ)' },
  { id: 'phone', x: 78, y: 25, label: 'Телефон (Вызов СМП)' },
  { id: 'aed', x: 74, y: 12, label: 'АНД (Дефибриллятор)' },
];

const actionsList = [
  { id: 'consciousness', label: 'Оценить сознание' },
  { id: 'gloves', label: 'Надеть перчатки' },
  { id: 'oxygen', label: 'Кислородотерапия' },
  { id: 'pulse', label: 'Пульсоксиметрия' },
  { id: 'ecg', label: 'Снять ЭКГ' },
  { id: 'call', label: 'Вызвать СМП' },
];

export default function Home() {
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(510);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [activeObject, setActiveObject] = useState<string | null>(null);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) { finishScenario(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished]);

  const toggleAction = (id: string) => {
    setActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const finishScenario = async () => {
    setFinished(true);
    const completedCount = Object.values(actions).filter(Boolean).length;
    const calculatedScore = Math.round((completedCount / actionsList.length) * 100);
    setScore(calculatedScore);

    if (supabase) {
      try {
        await supabase.from('attempts').insert({
          scenario_id: 'OKS1', score: calculatedScore, actions: actions,
        });
      } catch (e) { console.error(e); }
    }
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Станция пройдена</h1>
        <p className="text-6xl font-bold text-blue-600 mb-8">{score}%</p>
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Чек-лист:</h2>
          {actionsList.map((a) => (
            <div key={a.id} className={`flex justify-between p-2 ${actions[a.id] ? 'text-green-600' : 'text-red-500'}`}>
              <span>{a.label}</span>
              <span>{actions[a.id] ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">
          Пройти заново
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-50 flex items-center gap-6 shadow-lg">
        <span className="text-2xl font-mono text-green-400 font-bold tracking-widest">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">
          Завершить
        </button>
      </div>

      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />

        {ROOM_OBJECTS.map((obj) => (
          <button
            key={obj.id}
            onClick={() => setActiveObject(obj.id)}
            className="absolute w-[10%] h-[15%] border-2 border-transparent hover:border-blue-400/50 hover:bg-blue-400/20 rounded-xl transition-all cursor-pointer group"
            style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
          >
            <span className="hidden group-hover:block absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {obj.label}
            </span>
          </button>
        ))}
      </div>

      {activeObject && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setActiveObject(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4 border-b pb-2">
              {ROOM_OBJECTS.find(o => o.id === activeObject)?.label}
            </h3>
            
            <div className="space-y-3">
              {actionsList.map((action) => {
                if (activeObject === 'patient' && !['consciousness', 'pulse', 'oxygen'].includes(action.id)) return null;
                if (activeObject === 'crash_cart' && action.id !== 'gloves') return null;
                if (activeObject === 'monitor' && action.id !== 'ecg') return null;
                if (activeObject === 'phone' && action.id !== 'call') return null;
                if (activeObject === 'aed') return <p key="aed" className="text-gray-500">Интерфейс АНД (в разработке)</p>;

                return (
                  <button
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      actions[action.id] ? 'bg-green-50 border-green-500 text-green-700 font-medium' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {action.label} {actions[action.id] && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
      {/* Вызов Аккредика */}
<Helper 
  message="Привет! Я Аккредик. Твоя задача — пройти станцию за 8.5 минут. Не бойся, я с тобой!" 
  onClose={() => {}} 
/>
=======
>>>>>>> bfbf9310a1f024e62c76795ab6c15863997b3f78
    </div>
  );
}
