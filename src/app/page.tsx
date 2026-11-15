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

// --- ТОЧНЫЕ ДАННЫЕ ПАЦИЕНТОВ ИЗ ПРИЛОЖЕНИЯ 1 ---
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
  OKS2: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 130, bpDia: 70, rr: 24 },
    responses: {
      consciousness: 'Открывает глаза, отставание правой половины грудной клетки',
      airway: 'Губы и язык отечные',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева и справа ясный легочный звук, выраженное притупление в нижне-базальных отделах',
      auscultation: 'Жесткое дыхание, единичные сухие хрипы',
      trachea: 'Трахея в норме, вены шеи спавшиеся',
      pulse: '18 ударов за 10 секунд',
      bp: 'САД: 130, ДАД: 70',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа во всех местах теплая, выраженный цианоз',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: подъем ST',
    }
  },
  ANAPHYLAXIS: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 },
    responses: {
      consciousness: 'Отвечает на любые вопросы стоном',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Жесткое дыхание, сухие хрипы по всей поверхности',
      trachea: 'Трахея в норме, вены шеи набухшие',
      pulse: '18 ударов за 10 секунд, слабого наполнения',
      bp: 'САД: 90, ДАД: 40',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа гиперемирована, теплая на ощупь, эритематозная сыпь на передней поверхности грудной клетки',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  ZHKK: {
    initialVitals: { hr: 110, spo2: 95, bpSys: 90, bpDia: 50, rr: 18 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 95-98%',
      respiratory_rate: '3 движения за 10 секунд (ЧДД 18)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Везикулярное дыхание, 2 зоны',
      trachea: 'Трахея в норме, вены шеи спавшиеся',
      pulse: '18 ударов за 10 секунд',
      bp: 'САД: 90, ДАД: 50',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа во всех местах бледная, холодная на ощупь',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Стон при осмотре верхней части живота. Доскообразный живот',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  BOS: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 130, bpDia: 80, rr: 24 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Жесткое дыхание, сухие хрипы по всей поверхности',
      trachea: 'Трахея в норме, вены шеи набухшие',
      pulse: '18 ударов за 10 секунд, слабого наполнения',
      bp: 'САД: 130, ДАД: 80',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 2 секунды',
      skin: 'Кожа во всех местах теплая, выраженный цианоз',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  TELA: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Везикулярное дыхание, 2 зоны',
      trachea: 'Трахея в норме, вены шеи в норме',
      pulse: '18 ударов за 10 секунд',
      bp: 'САД: 90, ДАД: 40',
      heart_ausc: 'Тоны сердца частые, приглушенные, акцент 2-го тона на легочной артерии',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа во всех местах холодная, влажная. Кожные покровы верхней половины тела цианотичные',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: S1, Q3, T3',
    }
  },
  PNEUMOTHORAX: {
    initialVitals: { hr: 110, spo2: 88, bpSys: 80, bpDia: 40, rr: 24 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 88-89%',
      respiratory_rate: '4 движения за 10 секунд (ЧДД 24)',
      percussion: 'Слева ясный легочный звук, тимпанит над всей поверхностью правого легкого',
      auscultation: 'Везикулярное дыхание, резко ослабленное справа',
      trachea: 'Трахея в норме, вены шеи набухшие',
      pulse: '18 ударов за 10 секунд, слабого наполнения',
      bp: 'САД: 80, ДАД: 40',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа во всех местах холодная, выраженный цианоз',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '6,3 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  HYPOGLYCEMIA: {
    initialVitals: { hr: 110, spo2: 95, bpSys: 120, bpDia: 70, rr: 18 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 95-98%',
      respiratory_rate: '3 движения за 10 секунд (ЧДД 18)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Везикулярное дыхание, 2 зоны',
      trachea: 'Трахея в норме, вены шеи в норме',
      pulse: '18 ударов за 10 секунд',
      bp: 'САД: 120, ДАД: 70',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 2 секунды',
      skin: 'Кожа во всех местах влажная, липкая, ощущается дрожь',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '2,0 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  HYPERGLYCEMIA: {
    initialVitals: { hr: 110, spo2: 95, bpSys: 120, bpDia: 70, rr: 18 },
    responses: {
      consciousness: 'Открывает глаза, есть экскурсия грудной клетки',
      airway: 'Дыхательные пути визуально проходимы',
      spo2: 'Сатурация 95-98%',
      respiratory_rate: '3 движения за 10 секунд (ЧДД 18)',
      percussion: 'Слева и справа ясный легочный звук',
      auscultation: 'Везикулярное дыхание, 2 зоны',
      trachea: 'Трахея в норме, вены шеи в норме',
      pulse: '18 ударов за 10 секунд',
      bp: 'САД: 120, ДАД: 70',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 2 секунды',
      skin: 'Кожа во всех местах бледная, сухая',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '24 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  BLS: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: {} }
};

// (Списки CHECKLIST_... остаются прежними, я не буду их дублировать, чтобы не раздувать код, но в твоем файле они должны быть!)

const ALL_ACTIONS = [
  { id: 'danger', label: 'Убедиться в отсутствии опасности' },
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

  // Динамика
  const [isArrest, setIsArrest] = useState(false);
  const [vitals, setVitals] = useState({ hr: 110, spo2: 88, bpSys: 90, bpDia: 40 });

  const [challenge, setChallenge] = useState<string | null>(null);
  const [timerChallenge, setTimerChallenge] = useState(0);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const holdInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [cprCount, setCprCount] = useState(0);
  const [cprFeedback, setCprFeedback] = useState('');
  const lastCprTime = useRef<number>(0);
  
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);

  const [phoneModal, setPhoneModal] = useState(false);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [callFeedback, setCallFeedback] = useState('');
  const [callSuccess, setCallSuccess] = useState(false);

  const [medicationModal, setMedicationModal] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [medFeedback, setMedFeedback] = useState('');

  const hasSpokenMinuteWarning = useRef(false);
  const isFinishing = useRef(false);

  const currentOrder = SCENARIO_DATA[scenario].order;
  const currentChecklist = SCENARIO_DATA[scenario].checklist;
  const isFloorScenario = scenario === 'BLS';
  const roomImage = isFloorScenario ? '/room_360_floor.jpg' : '/room_360_bed.jpg';
  const currentHotspots = isFloorScenario ? HOTSPOTS_FLOOR : HOTSPOTS_BED;

  const playAudio = (text: string, onEnd?: () => void) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang.includes('ru') && v.name.includes('Google')) 
                     || voices.find(v => v.lang.includes('ru') && v.name.includes('Microsoft'))
                     || voices.find(v => v.lang.includes('ru'));
      if (bestVoice) utterance.voice = bestVoice;
      if (onEnd) utterance.onend = onEnd;
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  };

  useEffect(() => {
    if (stage !== 'playing') return;
    
    // Событие на 4:30 (255 секунд)
    if (timeLeft === 255 && !isArrest) {
      setIsArrest(true);
      playAudio("Внимание! У пациента прекратилась экскурсия грудной клетки. Артериальное давление не определяется. На ЭКГ асистолия. Начните реанимацию!");
      setVitals({ hr: 0, spo2: 0, bpSys: 0, bpDia: 0 });
      setPatientResponse(null); // Сбрасываем предыдущий ответ
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

  // Установка начальных показателей при старте
  useEffect(() => {
    if (scenario && PATIENT_DATA[scenario]) {
      setVitals(PATIENT_DATA[scenario].initialVitals);
    }
  }, [scenario]);

  useEffect(() => {
    if (actions['oxygen'] && !isArrest) setVitals(prev => ({ ...prev, spo2: 98 }));
  }, [actions, isArrest]);

  // ... (Функции handleEnterRoom, finishScenario остаются прежними)

  const handleActionClick = (id: string) => {
    if (actions[id]) {
      setAccredicMessage('Вы уже выполнили это действие!');
      setTimeout(() => setAccredicMessage(null), 2000);
      return;
    }

    const expectedId = currentOrder[sequence.length];
    const expectedAction = ALL_ACTIONS.find(a => a.id === expectedId);

    if (expectedId && id !== expectedId) {
      setAccredicMessage(`Подсказка: обычно следующим шагом идет «${expectedAction?.label}».`);
      setTimeout(() => setAccredicMessage(null), 3000);
      setMistakes(prev => [...prev, `Нарушен порядок: «${ALL_ACTIONS.find(a => a.id === id)?.label}» вместо «${expectedAction?.label}»`]);
    } else if (expectedId && id === expectedId) {
      setAccredicMessage('Верно!');
      setTimeout(() => setAccredicMessage(null), 2000);
    }

    // Если это остановка сердца, пациент не реагирует на обычные проверки
    if (isArrest && !['compressions', 'aed', 'breaths'].includes(id)) {
      setPatientResponse('Пациент не реагирует. Асистолия.');
      return;
    }

    // Показ клинического ответа пациента
    const responseText = PATIENT_DATA[scenario]?.responses?.[id];
    if (responseText) {
      setPatientResponse(responseText);
    }

    // ... (Остальная логика handleActionClick)
  };

  // ... (Остальной код интерфейса)

  // Обновленный HUD (Монитор)
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

      {/* ... (Остальной интерфейс: комната, кнопки, модалки) */}
    </div>
  );
}
