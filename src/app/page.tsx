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

// --- МЕНЮ СПЕЦИАЛЬНОСТЕЙ ---
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
  TELA: 'Пациент 60 лет. Резкая боль в грудной клетке. Время пошло!',
  PNEUMOTHORAX: 'Пациент 40 лет. Травма грудной клетки, резкая боль. Время пошло!',
  HYPOGLYCEMIA: 'Пациент 50 лет. Состояние спутанное, кожа влажная. Время пошло!',
  HYPERGLYCEMIA: 'Пациент 35 лет. Сухость во рту, слабость. Время пошло!',
  BLS: 'Вы увидели, что человеку стало плохо. Он лежит на полу без сознания. Время пошло!',
};

// --- ДАННЫЕ ПАЦИЕНТОВ ---
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
      percussion: 'Слева и справа ясный легочный звук, выраженное притупление',
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
      skin: 'Кожа гиперемирована, теплая на ощупь, эритематозная сыпь',
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
      heart_ausc: 'Частые, приглушенные, акцент 2-го тона',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа холодная, влажная. Верхняя половина тела цианотичная',
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
      percussion: 'Слева ясный легочный звук, тимпанит над правым легким',
      auscultation: 'Везикулярное дыхание, резко ослабленное справа',
      trachea: 'Трахея в норме, вены шеи набухшие',
      pulse: '18 ударов за 10 секунд, слабого наполнения',
      bp: 'САД: 80, ДАД: 40',
      heart_ausc: 'Частые, приглушенные',
      cap_refill: 'Симптом белого пятна исчезает через 4 секунды',
      skin: 'Кожа холодная, выраженный цианоз',
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
      skin: 'Кожа влажная, липкая, ощущается дрожь',
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
      skin: 'Кожа бледная, сухая',
      pupils: 'Зрачки одинаковые, фотореакция сохранна',
      glucose: '24 ммоль/л',
      muscle_tone: 'Мышечный тонус нормальный',
      abdomen: 'Живот без особенностей',
      ecg_interpret: 'На ЭКГ: синусовая тахикардия',
    }
  },
  BLS: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: {} }
};

// --- ТЕКСТЫ АПК ---
const APK_MESSAGES: Record<string, string> = {
  hands: 'Будем считать, что руки обработаны',
  sterility: 'Будем считать, что всё годно',
  venous: 'Венозный доступ уже установлен',
  pleural_puncture: 'Будем считать, что пункция грудной полости выполнена',
};

// --- СКРИПТ ЗВОНКА СМП ---
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

// --- ЧЕК-ЛИСТЫ ---
const CHECKLIST_OKS1 = [
  { id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' },
  { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия по показаниям' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' },
  { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' },
  { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' },
  { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' },
  { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' },
  { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' },
  { id: 'call', text: 'Вызов СМП' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }
];

const CHECKLIST_OKS2 = [ /* ... */ ];
const CHECKLIST_ANAPHYLAXIS = [ /* ... */ ];
const CHECKLIST_ZHKK = [ /* ... */ ];
const CHECKLIST_BOS = [ /* ... */ ];
const CHECKLIST_TELA = [ /* ... */ ];
const CHECKLIST_PNEUMOTHORAX = [ /* ... */ ];
const CHECKLIST_HYPOGLYCEMIA = [ /* ... */ ];
const CHECKLIST_HYPERGLYCEMIA = [ /* ... */ ];
const CHECKLIST_BLS = [ /* ... */ ];

const SCENARIO_DATA: Record<ScenarioType, { order: string[], checklist: any[] }> = {
  OKS1: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'ecg', 'ecg_interpret', 'venous', 'pupils', 'muscle_tone', 'glucose', 'abdomen', 'medication', 'call', 'compressions', 'aed', 'breaths'], checklist: CHECKLIST_OKS1 },
  OKS2: { order: [/*...*/], checklist: CHECKLIST_OKS2 },
  ANAPHYLAXIS: { order: [/*...*/], checklist: CHECKLIST_ANAPHYLAXIS },
  ZHKK: { order: [/*...*/], checklist: CHECKLIST_ZHKK },
  BOS: { order: [/*...*/], checklist: CHECKLIST_BOS },
  TELA: { order: [/*...*/], checklist: CHECKLIST_TELA },
  PNEUMOTHORAX: { order: [/*...*/], checklist: CHECKLIST_PNEUMOTHORAX },
  HYPOGLYCEMIA: { order: [/*...*/], checklist: CHECKLIST_HYPOGLYCEMIA },
  HYPERGLYCEMIA: { order: [/*...*/], checklist: CHECKLIST_HYPERGLYCEMIA },
  BLS: { order: ['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions', 'recovery'], checklist: CHECKLIST_BLS },
};

// ... (Координаты HOTSPOTS_BED и HOTSPOTS_FLOOR)

type Stage = 'menu' | 'station_select' | 'briefing' | 'intro' | 'playing' | 'finished';

export default function Home() {
  // ... (ВСЕ СОСТОЯНИЯ)
  
  // ... (ВСЕ ФУНКЦИИ: playAudio, useEffect, handleEnterRoom, finishScenario, handleActionClick, handleSmpOptionClick)

  // --- ЭКРАНЫ ---
  if (stage === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-blue-400">Аккред и Ко</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {SPECIALTIES.map(spec => (
            <button key={spec.id} onClick={() => { setSelectedSpecialty(spec.id); setStage('station_select'); }} className="bg-gray-800 hover:bg-gray-700 p-8 rounded-2xl border-2 border-gray-700 hover:border-blue-500 text-left transition">
              <h2 className="text-2xl font-bold mb-2">{spec.title}</h2>
              <p className="text-gray-400 text-sm">{spec.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'station_select') {
    const spec = SPECIALTIES.find(s => s.id === selectedSpecialty);
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setStage('menu')} className="mb-6 text-gray-400 hover:text-white">← Назад</button>
          <h1 className="text-3xl font-bold mb-8">{spec?.title}</h1>
          <div className="space-y-4">
            {spec?.stations.map(st => (
              <button key={st.id} onClick={() => handleSelectStation(st)} disabled={st.type === 'locked'} className={`w-full p-6 rounded-xl border-2 text-left flex justify-between items-center ${st.type === 'locked' ? 'bg-gray-800/50 border-gray-800 text-gray-600' : 'bg-gray-800 border-gray-700 hover:border-blue-500'}`}>
                <span className="text-xl font-bold">{st.title}</span>
                {st.type === 'locked' ? <span className="text-xs bg-gray-700 px-2 py-1 rounded">В разработке</span> : <span className="text-blue-500 text-2xl">→</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ... (Экраны briefing, intro, playing, finished)
}
