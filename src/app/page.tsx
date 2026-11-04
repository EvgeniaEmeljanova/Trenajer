'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Helper from './Helper';

// В Next.js переменные окружения должны быть доступны во время сборки, 
// поэтому используем process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const [timeLeft, setTimeLeft] = useState(510); // 8.5 минут
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showHelper, setShowHelper] = useState(true);
  const [helperMessage, setHelperMessage] = useState('Привет! Я Аккредик. Твоя задача — пройти станцию за 8.5 минут. Не бойся, я с тобой!');

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      finishScenario();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished]);

  useEffect(() => {
    if (timeLeft === 60 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('У вас осталась одна минута');
      utterance.lang = 'ru-RU';
      window.speechSynthesis.speak(utterance);
    }
  }, [timeLeft]);

  const toggleAction = (id: string) => {
    setActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const finishScenario = async () => {
    setFinished(true);
    const completedCount = Object.values(actions).filter(Boolean).length;
    const totalActions = actionsList.length;
    const calculatedScore = Math.round((completedCount / totalActions) * 100);
    setScore(calculatedScore);

    try {
      await supabase.from('attempts').insert({
        scenario_id: 'OKS1',
        score: calculatedScore,
        actions: actions,
      });
    } catch (e) {
      console.error('Ошибка сохранения:', e);
    }
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Станция пройдена</h1>
        <p className="text-6xl font-bold text-blue-600 mb-8">{score}%</p>
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Твой чек-лист:</h2>
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto relative pb-24">
        
        <div className="bg-white p-4 rounded-lg shadow mb-4 flex justify-between items-center">
          <span className="text-lg font-mono">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <button onClick={finishScenario} className="bg-red-500 text-white px-4 py-1 rounded text-sm">
            Завершить
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <p className="text-gray-600 text-sm mb-2">Вы — врач. Перед вами пациент 45 лет. На этаже есть укладка и АНД.</p>
        </div>

        <div className="space-y-2">
          {actionsList.map((action) => (
            <button
              key={action.id}
              onClick={() => toggleAction(action.id)}
              className={`w-full text-left p-4 rounded-lg shadow transition ${
                actions[action.id] ? 'bg-green-100 border-2 border-green-500' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {action.label} {actions[action.id] && '✓'}
            </button>
          ))}
        </div>

        {/* Вызов Аккредика */}
        {showHelper && (
          <Helper 
            message={helperMessage} 
            onClose={() => setShowHelper(false)} 
          />
        )}

      </div>
    </div>
  );
}