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

// --- ТОЧНЫЕ ДАННЫЕ ПАЦИЕНТОВ ---
const PATIENT_DATA: Record<ScenarioType, any> = {
  OKS1: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Везикулярное дыхание, влажные хрипы в нижних отделах',
      trachea: 'Трахея в норме, вены шеи набухшие',
      pulse: '18 ударов за 10 секунд, слабого наполнения',
      bp: 'САД: 90, ДАД: 40',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа во всех местах холодная, влажная',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: подъем ST',
    }
  },
  OKS2: { /* ... */ },
  ANAPHYLAXIS: { /* ... */ },
  ZHKK: { /* ... */ },
  BOS: { /* ... */ },
  TELA: { /* ... */ },
  PNEUMOTHORAX: { /* ... */ },
  HYPOGLYCEMIA: { /* ... */ },
  HYPERGLYCEMIA: { /* ... */ },
  BLS: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: {} }
};

// ТЕКСТЫ ЧЛЕНА АПК
const APK_MESSAGES: Record<string, string> = {
  hands: 'Будем считать, что руки обработаны',
  sterility: 'Будем считать, что всё годно',
  venous: 'Венозный доступ уже установлен',
  pleural_puncture: 'Будем считать, что пункция грудной полости выполнена',
};

// --- ИНТЕРАКТИВНЫЙ СЦЕНАРИЙ РАЗГОВОРА С ДИСПЕТЧЕРОМ СМП ---
const SMP_SCRIPT = [
  {
    dispatcher: 'Скорая медицинская помощь слушает, что случилось?',
    options: [
      { text: '«Здравствуйте, я врач. У нас пострадавший мужчина 45 лет»', correct: true },
      { text: '«Человеку плохо, приезжайте»', correct: false },
      { text: '«Срочно нужна скорая!»', correct: false },
    ],
    wrongReply: 'Диспетчер: «Представьтесь, пожалуйста. Назовите возраст и пол пострадавшего».'
  },
  {
    dispatcher: 'Назовите местоположение (адрес).',
    options: [
      { text: '«Улица Ленина, дом 5, кабинет 12»', correct: true },
      { text: '«Мы на работе, в офисе»', correct: false },
    ],
    wrongReply: 'Диспетчер: «Назовите точный адрес и кабинет».'
  },
  {
    dispatcher: 'Назовите основные витальные функции: сознание, дыхание, пульс.',
    options: [
      { text: '«Без сознания, не дышит, пульса нет»', correct: true },
      { text: '«Он живой, но ему плохо»', correct: false },
    ],
    wrongReply: 'Диспетчер: «Уточните, в сознании ли он, дышит ли, есть ли пульс».'
  },
  {
    dispatcher: 'Назовите объем оказываемой помощи.',
    options: [
      { text: '«Начинаю сердечно-легочную реанимацию»', correct: true },
      { text: '«Жду вас, ничего не делаю»', correct: false },
    ],
    wrongReply: 'Диспетчер: «Назовите объём Вашего вмешательства. Какие лекарственные средства Вы ввели?»'
  }
];

const ALL_ACTIONS = [
  { id: 'danger', label: 'Убедиться в отсутствии опасности' },
  { id: 'hands', label: 'Обработать руки' },
  { id: 'choking', label: 'Спросить: «Вы подавились?»' },
  { id: 'back_blows', label: '5 ударов между лопатками' },
  { id: 'heimlich', label: '5 надавливаний на живот (Геймлих)' },
  { id: 'breathing', label: 'Оценить дыхание (10 сек)' },
  { id: 'recovery', label: 'Устойчивое боковое положение' },
  { id: 'consciousness', label: 'Оценить сознание' },
  { id: 'gloves', label: 'Надеть перчатки' },
  { id: 'airway', label: 'Осмотреть полость рта' },
  { id: 'spo2', label: 'Пульсоксиметрия' },
  { id: 'oxygen', label: 'Кислородотерапия' },
  { id: 'oxygen_wrong', label: 'Кислород (при отсутствии показаний)' },
  { id: 'respiratory_rate', label: 'Подсчет ЧДД (10 сек)' },
  { id: 'percussion', label: 'Перкуссия легких' },
  { id: 'auscultation', label: 'Аускультация легких' },
  { id: 'trachea', label: 'Осмотр трахеи и вен шеи' },
  { id: 'pulse', label: 'Пульс на лучевой и сонной артериях (10 сек)' },
  { id: 'bp', label: 'Измерить АД' },
  { id: 'heart_ausc', label: 'Аускультация сердца' },
  { id: 'cap_refill', label: 'Симптом белого пятна (5 сек)' },
  { id: 'skin', label: 'Оценить кожные покровы' },
  { id: 'ecg', label: 'Снять ЭКГ' },
  { id: 'ecg_interpret', label: 'Интерпретировать ЭКГ' },
  { id: 'venous', label: 'Венозный доступ' },
  { id: 'pupils', label: 'Фотореакция зрачков' },
  { id: 'muscle_tone', label: 'Тонус мышц' },
  { id: 'glucose', label: 'Уровень глюкозы' },
  { id: 'abdomen', label: 'Пальпация живота' },
  { id: 'call', label: 'Вызвать СМП' },
  { id: 'medication', label: 'Назначить лечение' },
  { id: 'medication_correct', label: 'Ввести верный препарат' },
  { id: 'medication_dose', label: 'Ввести верную дозировку' },
  { id: 'medication_route', label: 'Выбрать способ введения' },
  { id: 'additional_meds', label: 'Дополнительные препараты' },
  { id: 'infusion', label: 'Инфузионная терапия' },
  { id: 'infusion_dose', label: 'Расчет объема инфузии' },
  { id: 'priority_med', label: 'Приоритет ЛС (Адреналин)' },
  { id: 'raise_bed', label: 'Придать возвышенное положение голове' },
  { id: 'pleural_puncture', label: 'Пункция плевральной полости' },
  { id: 'abcde_sequence', label: 'Проверить последовательность ABCDE' },
  { id: 'abcde_repeat', label: 'Повторный осмотр ABCDE' },
  { id: 'verbalize', label: 'Комментировать действия вслух' },
  { id: 'compressions', label: 'Компрессии (30 раз)' },
  { id: 'aed', label: 'Работа с АНД' },
  { id: 'breaths', label: 'ИВЛ (2 вдоха)' },
];

// ... (ВСТАВЬ СЮДА СВОИ МАССИВЫ SCENARIO_DATA И CHECKLIST_... КАК В ПРЕДЫДУЩЕМ КОДЕ)
const SCENARIO_DATA: any = { /* Твои чек-листы */ };

type Stage = 'briefing' | 'intro' | 'playing' | 'finished';

export default function Home() {
  const [stage, setStage] = useState<Stage>('briefing');
  const [scenario, setScenario] = useState<ScenarioType>('OKS1');
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(510);
  const [score, setScore] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [accredicMessage, setAccredicMessage] = useState<string | null>(null);
  const [patientResponse, setPatientResponse] = useState<string | null>(null);

  const [isArrest, setIsArrest] = useState(false);
  const [vitals, setVitals] = useState({ hr: 110, spo2: 88, bpSys: 90, bpDia: 40 });

  // ... (ОСТАЛЬНЫЕ СОСТОЯНИЯ: challenge, aedOpen, medicationModal)
  
  // СОСТОЯНИЯ ДЛЯ ЧАТА СМП
  const [phoneModal, setPhoneModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<{sender: 'dispatcher' | 'doctor', text: string}[]>([]);
  const [smpStep, setSmpStep] = useState(0);
  const [callSuccess, setCallSuccess] = useState(false);

  const currentOrder = SCENARIO_DATA[scenario]?.order || [];
  const currentChecklist = SCENARIO_DATA[scenario]?.checklist || [];
  const isFloorScenario = scenario === 'BLS';
  const roomImage = isFloorScenario ? '/room_360_floor.jpg' : '/room_360_bed.jpg';
  const currentHotspots = isFloorScenario ? HOTSPOTS_FLOOR : HOTSPOTS_BED;

  // ... (playAudio, handleEnterRoom)

  useEffect(() => {
    if (stage !== 'playing') return;
    
    // ПУНКТ 13: Через 4.5 минуты (осталось 240 секунд)
    if (timeLeft === 240 && !isArrest) {
      setIsArrest(true);
      playAudio("Экскурсии грудной клетки прекратились.");
      setPatientResponse("Экскурсии грудной клетки прекратились.");
      setVitals({ hr: 0, spo2: 0, bpSys: 0, bpDia: 0 });
    }

    if (timeLeft <= 0) { 
      playAudio("Время вышло. Перейдите на следующую станцию.");
      finishScenario(); 
      return; 
    }
    if (timeLeft === 60 && !hasSpokenMinuteWarning.current) {
      playAudio("У вас осталась одна минута.");
      hasSpokenMinuteWarning.current = true;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, stage, isArrest]);

  // Установка начальных показателей
  useEffect(() => {
    if (scenario && PATIENT_DATA[scenario]) {
      setVitals(PATIENT_DATA[scenario].initialVitals);
    }
  }, [scenario]);

  useEffect(() => {
    if (actions['oxygen'] && !isArrest) setVitals(prev => ({ ...prev, spo2: 98 }));
  }, [actions, isArrest]);

  const handleActionClick = (id: string) => {
    if (actions[id]) return;

    // Вывод ответов АПК
    if (APK_MESSAGES[id]) {
      setPatientResponse(APK_MESSAGES[id]);
    } else {
      const responseText = PATIENT_DATA[scenario]?.responses?.[id];
      if (responseText) setPatientResponse(responseText);
    }

    if (id === 'compressions') {
      setChallenge('cpr'); setCprCount(0); setCprFeedback(''); lastCprTime.current = 0;
      return;
    }
    if (id === 'cap_refill') {
      startHoldChallenge('cap_refill', 5);
      return;
    }
    if (id === 'pulse' || id === 'respiratory_rate' || id === 'breathing') {
      startHoldChallenge(id, 10);
      return;
    }
    if (id === 'medication') {
      setMedicationModal(true); setSelectedMeds([]); setMedFeedback('');
      return;
    }
    if (id === 'aed') {
      setAedOpen(true); setActiveHotspot(null);
      return;
    }
    
    // ИНИЦИАЛИЗАЦИЯ ИНТЕРАКТИВНОГО ЗВОНКА
    if (id === 'call') {
      setPhoneModal(true);
      setSmpStep(0);
      setCallSuccess(false);
      setChatHistory([{ sender: 'dispatcher', text: SMP_SCRIPT[0].dispatcher }]);
      return;
    }
    
    toggleAction(id);
    setActiveHotspot(null);
  };

  // --- ЛОГИКА ИНТЕРАКТИВНОГО ЗВОНКА ---
  const handleSmpOptionClick = (option: any) => {
    const newHistory = [...chatHistory, { sender: 'doctor' as const, text: option.text }];
    
    if (option.correct) {
      if (smpStep < SMP_SCRIPT.length - 1) {
        const nextStep = smpStep + 1;
        setSmpStep(nextStep);
        setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: SMP_SCRIPT[nextStep].dispatcher }]);
      } else {
        // Звонок завершен
        setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: 'Вызов принят! Ждите.' }]);
        setCallSuccess(true);
        setTimeout(() => { 
          setPhoneModal(false); 
          toggleAction('call'); 
        }, 3000);
      }
    } else {
      // Ошибка
      setMistakes(prev => [...prev, 'Ошибка при вызове СМП (неверная информация)']);
      setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: SMP_SCRIPT[smpStep].wrongReply }]);
    }
  };

  // ... (finishScenario, остальной интерфейс)

  return (
    <div className={`min-h-screen bg-gray-900 text-white overflow-hidden relative ${timeLeft < 60 || isArrest ? 'animate-pulse ring-8 ring-red-600 ring-inset' : ''}`}>
      
      {/* Монитор с точными данными */}
      <div className="absolute top-4 right-4 bg-black/80 border border-gray-600 p-3 rounded-xl z-40 font-mono text-sm shadow-xl w-48">
        <div className="flex items-center gap-2 mb-1">
          <span className={isArrest ? 'text-gray-500' : 'text-red-500 animate-pulse'}>❤️</span>
          <span>ЧСС: {vitals.hr} {isArrest ? '' : 'уд/мин'}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className={isArrest ? 'text-gray-500' : 'text-blue-400'}>🫁</span>
          <span>SpO2: {vitals.spo2}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={isArrest ? 'text-gray-500' : 'text-green-400'}>🩸</span>
          <span>АД: {vitals.bpSys}/{vitals.bpDia}</span>
        </div>
        {isArrest && <div className="text-red-500 font-bold text-center mt-2 animate-pulse text-xs">АСИСТОЛИЯ</div>}
      </div>

      {/* ИНТЕРАКТИВНЫЙ ЧАТ С ДИСПЕТЧЕРОМ СМП */}
      {phoneModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[70vh]">
            <div className="p-4 bg-gray-900 rounded-t-2xl border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-400">📞 Диспетчер СМП</h3>
              {callSuccess && <span className="text-green-500 text-sm font-bold">Вызов принят</span>}
            </div>

            {/* История чата */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'doctor' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                    {msg.sender === 'dispatcher' && <span className="block text-xs text-gray-400 mb-1">Диспетчер:</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Варианты ответов */}
            <div className="p-4 bg-gray-900 rounded-b-2xl border-t border-gray-700">
              {!callSuccess ? (
                <div className="space-y-2">
                  {SMP_SCRIPT[smpStep].options.map((option, index) => (
                    <button 
                      key={index}
                      onClick={() => handleSmpOptionClick(option)}
                      className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition border border-gray-600"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => setPhoneModal(false)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">
                  Завершить звонок
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ... (Остальной интерфейс: комната, кнопки действий, модалки АНД и лечения) */}
    </div>
  );
}
