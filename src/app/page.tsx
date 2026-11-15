'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function Room360({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  return (
    <>
      <Sphere args={[10, 60, 60]} scale={[-1, 1, 1]}>
        <meshBasicMaterial map={texture} />
      </Sphere>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.4} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} />
    </>
  );
}

type ScenarioType = 'OKS1' | 'OKS2' | 'ANAPHYLAXIS' | 'ZHKK' | 'BOS' | 'TELA' | 'PNEUMOTHORAX' | 'HYPOGLYCEMIA' | 'HYPERGLYCEMIA' | 'BLS';

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
  BLS: 'Базовая СЛР (BLS)',
};

// --- СТРУКТУРА СТАНЦИЙ ПО СПЕЦИАЛЬНОСТЯМ (КАК В ПЕРЕЧНЕ) ---
const SPECIALTIES = [
  {
    id: 'general_medicine',
    title: 'Лечебное дело',
    description: 'Первичная аккредитация (Специалитет)',
    stations: [
      { id: 'BLS', title: 'Станция 1: Базовая СЛР', type: 'single' },
      { 
        id: 'emergency_help', 
        title: 'Станция 2: Экстренная медицинская помощь', 
        type: 'group',
        scenarios: ['OKS1', 'OKS2', 'ANAPHYLAXIS', 'ZHKK', 'BOS', 'TELA', 'PNEUMOTHORAX', 'HYPOGLYCEMIA', 'HYPERGLYCEMIA']
      },
      { id: 'iv_injection', title: 'Станция 3: Внутривенная инъекция', type: 'locked' },
      { id: 'anamnesis', title: 'Станция 4: Сбор жалоб и анамнеза', type: 'locked' },
      { id: 'physical_exam', title: 'Станция 5: Физикальное обследование', type: 'locked' },
    ]
  },
  {
    id: 'pediatrics',
    title: 'Педиатрия',
    description: 'Первичная аккредитация (Специалитет)',
    stations: [
      { id: 'ped_bls', title: 'Станция 1: СЛР у детей', type: 'locked' },
      { id: 'ped_emergency', title: 'Станция 2: Экстренная помощь ребенку', type: 'locked' },
    ]
  }
];

const VOICE_INTROS: Record<ScenarioType, string> = {
  OKS1: 'Пациент 45 лет. Жалуется на сильные загрудинные боли. Время пошло!',
  OKS2: 'Пациент 50 лет. Одышка, цианоз. Время пошло!',
  ANAPHYLAXIS: 'Пациент 30 лет. После укуса пчелы появилась резкая слабость. Время пошло!',
  ZHKK: 'Пациент 55 лет. Рвота кофейной гущей. Время пошло!',
  BOS: 'Пациент 25 лет. Затрудненное дыхание. Время пошло!',
  TELA: 'Пациент 60 лет. Резкая боль в грудной клетке, одышка. Время пошло!',
  PNEUMOTHORAX: 'Пациент 40 лет. Травма грудной клетки, резкая боль, одышка. Время пошло!',
  HYPOGLYCEMIA: 'Пациент 50 лет. Состояние спутанное, кожа влажная. Время пошло!',
  HYPERGLYCEMIA: 'Пациент 35 лет. Сухость во рту, слабость. Время пошло!',
  BLS: 'Вы увидели, что человеку стало плохо. Он лежит на полу без сознания. Время пошло!',
};

// ... (ОСТАЛЬНЫЕ МАССИВЫ: PATIENT_DATA, APK_MESSAGES, SMP_SCRIPT, ALL_ACTIONS, SCENARIO_DATA, CHECKLISTS, HOTSPOTS) 
// ВСТАВЬ ИХ СЮДА ИЗ ПРЕДЫДУЩЕГО КОДА
const PATIENT_DATA: any = { /* ... */ };
const APK_MESSAGES: any = { /* ... */ };
const SMP_SCRIPT: any = [ /* ... */ ];
const ALL_ACTIONS: any = [ /* ... */ ];
const SCENARIO_DATA: any = { /* ... */ };
const HOTSPOTS_BED = [ /* ... */ ];
const HOTSPOTS_FLOOR = [ /* ... */ ];

type Stage = 'menu' | 'station_select' | 'briefing' | 'intro' | 'playing' | 'finished';

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [scenario, setScenario] = useState<ScenarioType>('OKS1');
  
  // ... (ОСТАЛЬНЫЕ СОСТОЯНИЯ: actions, timeLeft, score, vitals и т.д.)

  // Выбор специальности
  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialty(specId);
    setStage('station_select');
  };

  // Выбор станции
  const handleSelectStation = (station: any) => {
    if (station.type === 'locked') return; // Заглушка для нереализованных станций
    
    if (station.type === 'single') {
      setScenario(station.id as ScenarioType);
      setStage('briefing');
    } else if (station.type === 'group') {
      // Для экстренной помощи случайно выбираем один из 9 сценариев
      const scenarios = station.scenarios;
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      setScenario(randomScenario);
      setStage('briefing');
    }
  };

  // --- 1. ЭКРАН ВЫБОРА СПЕЦИАЛЬНОСТИ ---
  if (stage === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <header className="text-center mb-12 mt-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Аккред и Ко
            </h1>
            <p className="text-gray-400 text-lg">Выберите специальность для прохождения ОСКЭ</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                onClick={() => handleSelectSpecialty(spec.id)}
                className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-8 text-left transition-all transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 mb-2">{spec.title}</h2>
                <p className="text-gray-400 text-sm mb-6">{spec.description}</p>
                <div className="flex justify-between items-center text-blue-500 font-bold">
                  <span>Перейти к станциям</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ЭКРАН ВЫБОРА СТАНЦИИ ВНУТРИ СПЕЦИАЛЬНОСТИ ---
  if (stage === 'station_select') {
    const specialty = SPECIALTIES.find(s => s.id === selectedSpecialty);
    
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <button onClick={() => setStage('menu')} className="mb-6 text-gray-400 hover:text-white transition flex items-center gap-2">
            ← Назад к специальностям
          </button>
          
          <h1 className="text-3xl font-bold mb-8">{specialty?.title}</h1>

          <div className="space-y-4">
            {specialty?.stations.map((station) => (
              <button
                key={station.id}
                onClick={() => handleSelectStation(station)}
                disabled={station.type === 'locked'}
                className={`w-full text-left p-6 rounded-xl border-2 transition flex justify-between items-center ${
                  station.type === 'locked' 
                    ? 'bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed' 
                    : 'bg-gray-800 border-gray-700 hover:border-blue-500 text-white'
                }`}
              >
                <div>
                  <h3 className="text-xl font-bold">{station.title}</h3>
                  {station.type === 'group' && <p className="text-sm text-gray-400 mt-1">Случайный выбор одного из 9 сценариев</p>}
                </div>
                <div>
                  {station.type === 'locked' ? (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">В разработке</span>
                  ) : (
                    <span className="text-blue-500 text-2xl">→</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ... (Остальные экраны: briefing, intro, playing, finished)
}
