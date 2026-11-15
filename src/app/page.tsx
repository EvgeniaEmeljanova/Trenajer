'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

type ScenarioType = 'OKS1' | 'OKS2' | 'ANAPHYLAXIS' | 'ZHKK' | 'BOS' | 'TELA' | 'PNEUMOTHORAX' | 'HYPOGLYCEMIA' | 'HYPERGLYCEMIA' | 'BLS';

const SCENARIO_TITLES: Record<ScenarioType, string> = {
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

// --- БАЗА ДАННЫХ ЭКГ (СОГЛАСНО ПАСПОРТУ) ---
const ECG_DATA: Record<ScenarioType, any> = {
  OKS1: {
    initial: { image: '/ecg_oks1.jpg', correct: 'Синусовый ритм. Подъем сегмента ST I, V2-V5.', wrong: ['Фибрилляция предсердий', 'Асистолия', 'Синусовая тахикардия'] },
    arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Желудочковая тахикардия', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  OKS2: {
    initial: { image: '/ecg_oks2.jpg', correct: 'Синусовая тахикардия. Депрессия сегмента ST I, II, aVL, V1-V5.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vt.jpg', correct: 'Желудочковая тахикардия.', wrong: ['Фибрилляция желудочков', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  TELA: {
    initial: { image: '/ecg_tela.jpg', correct: 'Синусовая тахикардия. Изменения сегментов S1, Q3, T3.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Желудочковая тахикардия', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  ANAPHYLAXIS: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vt.jpg', correct: 'Желудочковая тахикардия.', wrong: ['Фибрилляция желудочков', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  ZHKK: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Желудочковая тахикардия', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  BOS: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Желудочковая тахикардия', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  PNEUMOTHORAX: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vt.jpg', correct: 'Желудочковая тахикардия.', wrong: ['Фибрилляция желудочков', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  HYPOGLYCEMIA: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Желудочковая тахикардия', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  HYPERGLYCEMIA: {
    initial: { image: '/ecg_tachycardia.jpg', correct: 'Синусовая тахикардия, ЧСС 110 уд/мин.', wrong: ['Подъем ST', 'Фибрилляция предсердий', 'Асистолия'] },
    arrest45: { image: '/ecg_vt.jpg', correct: 'Желудочковая тахикардия.', wrong: ['Фибрилляция желудочков', 'Асистолия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  },
  BLS: {
    initial: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] },
    arrest45: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] },
    arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
  }
};

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

const PATIENT_DATA: Record<ScenarioType, any> = {
  OKS1: { initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 }, responses: { consciousness: 'Открывает глаза, есть экскурсия грудной клетки', airway: 'Дыхательные пути визуально проходимы', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Слева и справа ясный легочный звук', auscultation: 'Везикулярное дыхание, влажные хрипы', trachea: 'Трахея в норме, вены шеи набухшие', pulse: '18 ударов за 10 секунд, слабого наполнения', bp: 'САД: 90, ДАД: 40', heart_ausc: 'Частые, приглушенные', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа холодная, влажная', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: подъем ST' } },
  OKS2: { initialVitals: { hr: 110, spo2: 88, bpSys: 130, bpDia: 70, rr: 24 }, responses: { consciousness: 'Открывает глаза, отставание правой половины', airway: 'Губы и язык отечные', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Слева и справа ясный, притупление', auscultation: 'Жесткое дыхание, хрипы', trachea: 'Трахея в норме, вены спавшиеся', pulse: '18 ударов за 10 секунд', bp: 'САД: 130, ДАД: 70', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа теплая, цианоз', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: подъем ST' } },
  ANAPHYLAXIS: { initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 }, responses: { consciousness: 'Отвечает стоном', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Жесткое дыхание, сухие хрипы', trachea: 'Вены шеи набухшие', pulse: '18 ударов за 10 секунд', bp: 'САД: 90, ДАД: 40', heart_ausc: 'Частые, приглушенные', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа гиперемирована, сыпь', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  ZHKK: { initialVitals: { hr: 110, spo2: 95, bpSys: 90, bpDia: 50, rr: 18 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 95-98%', respiratory_rate: '3 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Везикулярное дыхание', trachea: 'Вены шеи спавшиеся', pulse: '18 ударов за 10 секунд', bp: 'САД: 90, ДАД: 50', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа бледная, холодная', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Стон, доскообразный живот', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  BOS: { initialVitals: { hr: 110, spo2: 88, bpSys: 130, bpDia: 80, rr: 24 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Жесткое дыхание, сухие хрипы', trachea: 'Вены шеи набухшие', pulse: '18 ударов за 10 секунд', bp: 'САД: 130, ДАД: 80', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 2 секунды', skin: 'Кожа теплая, цианоз', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  TELA: { initialVitals: { hr: 110, spo2: 88, bpSys: 90, bpDia: 40, rr: 24 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Везикулярное дыхание', trachea: 'Вены в норме', pulse: '18 ударов за 10 секунд', bp: 'САД: 90, ДАД: 40', heart_ausc: 'Акцент 2-го тона', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа холодная, цианоз верхней половины', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: S1, Q3, T3' } },
  PNEUMOTHORAX: { initialVitals: { hr: 110, spo2: 88, bpSys: 80, bpDia: 40, rr: 24 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 88-89%', respiratory_rate: '4 движения за 10 секунд', percussion: 'Тимпанит справа', auscultation: 'Ослабленное дыхание справа', trachea: 'Вены шеи набухшие', pulse: '18 ударов за 10 секунд', bp: 'САД: 80, ДАД: 40', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 4 секунды', skin: 'Кожа холодная, цианоз', pupils: 'Зрачки одинаковые', glucose: '6,3 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  HYPOGLYCEMIA: { initialVitals: { hr: 110, spo2: 95, bpSys: 120, bpDia: 70, rr: 18 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 95-98%', respiratory_rate: '3 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Везикулярное дыхание', trachea: 'Вены в норме', pulse: '18 ударов за 10 секунд', bp: 'САД: 120, ДАД: 70', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 2 секунды', skin: 'Кожа влажная, липкая', pupils: 'Зрачки одинаковые', glucose: '2,0 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  HYPERGLYCEMIA: { initialVitals: { hr: 110, spo2: 95, bpSys: 120, bpDia: 70, rr: 18 }, responses: { consciousness: 'Открывает глаза', airway: 'Дыхательные пути проходимы', spo2: 'Сатурация 95-98%', respiratory_rate: '3 движения за 10 секунд', percussion: 'Слева и справа ясный', auscultation: 'Везикулярное дыхание', trachea: 'Вены в норме', pulse: '18 ударов за 10 секунд', bp: 'САД: 120, ДАД: 70', heart_ausc: 'Частые', cap_refill: 'Симптом исчезает через 2 секунды', skin: 'Кожа бледная, сухая', pupils: 'Зрачки одинаковые', glucose: '24 ммоль/л', muscle_tone: 'Тонус нормальный', abdomen: 'Живот без особенностей', ecg_interpret: 'На ЭКГ: синусовая тахикардия' } },
  BLS: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: {} }
};

const APK_MESSAGES: Record<string, string> = {
  hands: 'Будем считать, что руки обработаны',
  sterility: 'Будем считать, что всё годно',
  venous: 'Венозный доступ уже установлен',
  pleural_puncture: 'Будем считать, что пункция грудной полости выполнена',
};

const SMP_SCRIPT = [
  { dispatcher: 'Скорая медицинская помощь слушает, что случилось?', options: [{ text: '«Здравствуйте, я врач. У нас пострадавший мужчина 45 лет»', correct: true }, { text: '«Человеку плохо, приезжайте»', correct: false }, { text: '«Срочно нужна скорая!»', correct: false }], wrongReply: 'Диспетчер: «Представьтесь, пожалуйста. Назовите возраст и пол пострадавшего».' },
  { dispatcher: 'Назовите местоположение (адрес).', options: [{ text: '«Улица Ленина, дом 5, кабинет 12»', correct: true }, { text: '«Мы на работе, в офисе»', correct: false }], wrongReply: 'Диспетчер: «Назовите точный адрес и кабинет».' },
  { dispatcher: 'Назовите основные витальные функции: сознание, дыхание, пульс.', options: [{ text: '«Без сознания, не дышит, пульса нет»', correct: true }, { text: '«Он живой, но ему плохо»', correct: false }], wrongReply: 'Диспетчер: «Уточните, в сознании ли он, дышит ли, есть ли пульс».' },
  { dispatcher: 'Назовите объем оказываемой помощи.', options: [{ text: '«Начинаю сердечно-легочную реанимацию»', correct: true }, { text: '«Жду вас, ничего не делаю»', correct: false }], wrongReply: 'Диспетчер: «Назовите объём Вашего вмешательства. Какие лекарственные средства Вы ввели?»' }
];

const MEDICATIONS: Record<ScenarioType, { name: string, correct: boolean }[]> = {
  OKS1: [{ name: 'Ацетилсалициловая кислота', correct: true }, { name: 'Гепарин', correct: true }, { name: 'Морфин', correct: true }, { name: 'Адреналин', correct: false }],
  OKS2: [{ name: 'Ацетилсалициловая кислота', correct: true }, { name: 'Нитроглицерин', correct: true }, { name: 'Фуросемид', correct: true }, { name: 'Сальбутамол', correct: false }],
  ANAPHYLAXIS: [{ name: 'Эпинефрин', correct: true }, { name: 'Инфузия NaCl', correct: true }, { name: 'Гидрокортизон', correct: true }, { name: 'Аспирин', correct: false }],
  ZHKK: [{ name: 'Омепразол', correct: true }, { name: 'Инфузия NaCl', correct: true }, { name: 'Адреналин', correct: false }],
  BOS: [{ name: 'Сальбутамол', correct: true }, { name: 'Ипратропий', correct: true }, { name: 'Преднизолон', correct: true }, { name: 'Аспирин', correct: false }],
  TELA: [{ name: 'Гепарин', correct: true }, { name: 'Тромболитики', correct: true }, { name: 'Аспирин', correct: false }],
  PNEUMOTHORAX: [{ name: 'Пункция', correct: true }, { name: 'Морфин', correct: false }],
  HYPOGLYCEMIA: [{ name: 'Глюкоза 40%', correct: true }, { name: 'Глюкоза 5%', correct: true }, { name: 'Адреналин', correct: false }],
  HYPERGLYCEMIA: [{ name: 'Инфузия NaCl', correct: true }, { name: 'Инсулин', correct: true }, { name: 'Глюкоза', correct: false }],
  BLS: []
};

const ALL_ACTIONS = [
  { id: 'danger', label: 'Убедиться в отсутствии опасности' }, { id: 'hands', label: 'Обработать руки' }, { id: 'choking', label: 'Спросить: «Вы подавились?»' },
  { id: 'back_blows', label: '5 ударов между лопатками' }, { id: 'heimlich', label: '5 надавливаний на живот (Геймлих)' }, { id: 'breathing', label: 'Оценить дыхание (10 сек)' },
  { id: 'recovery', label: 'Устойчивое боковое положение' }, { id: 'consciousness', label: 'Оценить сознание' }, { id: 'gloves', label: 'Надеть перчатки' },
  { id: 'airway', label: 'Осмотреть полость рта' }, { id: 'spo2', label: 'Пульсоксиметрия' }, { id: 'oxygen', label: 'Кислородотерапия' },
  { id: 'oxygen_wrong', label: 'Кислород (при отсутствии показаний)' }, { id: 'respiratory_rate', label: 'Подсчет ЧДД (10 сек)' }, { id: 'percussion', label: 'Перкуссия легких' },
  { id: 'auscultation', label: 'Аускультация легких' }, { id: 'trachea', label: 'Осмотр трахеи и вен шеи' }, { id: 'pulse', label: 'Пульс на лучевой и сонной артериях' },
  { id: 'bp', label: 'Измерить АД' }, { id: 'heart_ausc', label: 'Аускультация сердца' }, { id: 'cap_refill', label: 'Симптом белого пятна' },
  { id: 'skin', label: 'Оценить кожные покровы' }, { id: 'ecg', label: 'Снять ЭКГ' }, { id: 'ecg_interpret', label: 'Интерпретировать ЭКГ' },
  { id: 'venous', label: 'Венозный доступ' }, { id: 'pupils', label: 'Фотореакция зрачков' }, { id: 'muscle_tone', label: 'Тонус мышц' },
  { id: 'glucose', label: 'Уровень глюкозы' }, { id: 'abdomen', label: 'Пальпация живота' }, { id: 'call', label: 'Вызвать СМП' },
  { id: 'medication', label: 'Назначить лечение' }, { id: 'medication_correct', label: 'Ввести верный препарат' }, { id: 'medication_dose', label: 'Ввести верную дозировку' },
  { id: 'medication_route', label: 'Выбрать способ введения' }, { id: 'additional_meds', label: 'Дополнительные препараты' }, { id: 'infusion', label: 'Инфузионная терапия' },
  { id: 'infusion_dose', label: 'Расчет объема инфузии' }, { id: 'priority_med', label: 'Приоритет ЛС (Адреналин)' }, { id: 'raise_bed', label: 'Придать возвышенное положение голове' },
  { id: 'pleural_puncture', label: 'Пункция плевральной полости' }, { id: 'abcde_sequence', label: 'Проверить последовательность ABCDE' }, { id: 'abcde_repeat', label: 'Повторный осмотр ABCDE' },
  { id: 'verbalize', label: 'Комментировать действия вслух' }, { id: 'compressions', label: 'Компрессии (30 раз)' }, { id: 'aed', label: 'Работа с АНД' }, { id: 'breaths', label: 'ИВЛ (2 вдоха)' },
];

const CHECKLIST_OKS1 = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия по показаниям' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'call', text: 'Вызов СМП' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_OKS2 = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия по показаниям' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'raise_bed', text: 'Придал возвышенное положение' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_ANAPHYLAXIS = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'priority_med', text: 'Приоритет ЛС (Адреналин)' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_ZHKK = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'medication_correct', text: 'Верный препарат' }, { id: 'medication_dose', text: 'Верная дозировка' }, { id: 'medication_route', text: 'Способ введения' }, { id: 'infusion', text: 'Инфузионная терапия' }, { id: 'infusion_dose', text: 'Объем инфузии' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_BOS = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'call', text: 'Вызов СМП' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_TELA = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'medication_correct', text: 'Верный препарат' }, { id: 'medication_dose', text: 'Верная дозировка' }, { id: 'medication_route', text: 'Способ введения' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_PNEUMOTHORAX = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'oxygen', text: 'Кислородотерапия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'pleural_puncture', text: 'Пункция плевральной полости' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_HYPOGLYCEMIA = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'medication_correct', text: 'Верный препарат' }, { id: 'medication_dose', text: 'Верная дозировка' }, { id: 'medication_route', text: 'Способ введения' }, { id: 'additional_meds', text: 'Дополнительные препараты' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_HYPERGLYCEMIA = [{ id: 'consciousness', text: 'Оценил сознание' }, { id: 'gloves', text: 'Надел перчатки' }, { id: 'airway', text: 'Оценил проходимость дых. путей' }, { id: 'spo2', text: 'Пульсоксиметрия' }, { id: 'respiratory_rate', text: 'Подсчет ЧДД' }, { id: 'percussion', text: 'Перкуссия легких' }, { id: 'auscultation', text: 'Аускультация легких' }, { id: 'trachea', text: 'Осмотр трахеи и вен' }, { id: 'pulse', text: 'Пальпация пульса' }, { id: 'bp', text: 'Измерил АД' }, { id: 'heart_ausc', text: 'Аускультация сердца' }, { id: 'cap_refill', text: 'Симптом капиллярного пятна' }, { id: 'ecg', text: 'Снял ЭКГ' }, { id: 'ecg_interpret', text: 'Интерпретировал ЭКГ' }, { id: 'venous', text: 'Венозный доступ' }, { id: 'pupils', text: 'Фотореакция зрачков' }, { id: 'muscle_tone', text: 'Тонус мышц' }, { id: 'glucose', text: 'Уровень глюкозы' }, { id: 'abdomen', text: 'Пальпация живота' }, { id: 'medication', text: 'Диагноз и лечение' }, { id: 'infusion', text: 'Инфузионная терапия' }, { id: 'infusion_dose', text: 'Объем инфузии' }, { id: 'call', text: 'Вызов СМП' }, { id: 'abcde_sequence', text: 'Соблюдал ABCDE' }, { id: 'abcde_repeat', text: 'Повторный ABCDE' }, { id: 'verbalize', text: 'Комментировал действия' }, { id: 'compressions', text: 'Компрессии' }, { id: 'aed', text: 'АНД' }, { id: 'breaths', text: 'ИВЛ' }];
const CHECKLIST_BLS = [{ id: 'danger', text: 'Убедиться в отсутствии опасности' }, { id: 'choking', text: 'Спросить: «Вы подавились?»' }, { id: 'back_blows', text: '5 ударов между лопатками' }, { id: 'heimlich', text: '5 надавливаний на живот' }, { id: 'consciousness', text: 'Оценил сознание' }, { id: 'airway', text: 'Открыл дыхательные пути' }, { id: 'breathing', text: 'Оценил дыхание' }, { id: 'call', text: 'Вызов СМП' }, { id: 'compressions', text: 'Компрессии (30 раз)' }, { id: 'breaths', text: 'Сделать 2 вдоха' }, { id: 'aed', text: 'Работа с АНД' }, { id: 'compressions_repeat', text: 'Продолжить СЛР' }, { id: 'recovery', text: 'Устойчивое боковое положение' }];

const SCENARIO_DATA: Record<ScenarioType, { order: string[], checklist: any[] }> = {
  OKS1: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'ecg', 'ecg_interpret', 'venous', 'pupils', 'muscle_tone', 'glucose', 'abdomen', 'medication', 'call', 'compressions', 'aed', 'breaths'], checklist: CHECKLIST_OKS1 },
  OKS2: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'ecg', 'ecg_interpret', 'venous', 'pupils', 'muscle_tone', 'glucose', 'abdomen', 'raise_bed', 'medication', 'call', 'abcde_sequence', 'abcde_repeat', 'verbalize', 'compressions', 'aed', 'breaths'], checklist: CHECKLIST_OKS2 },
  ANAPHYLAXIS: { order: ['consciousness', 'gloves', 'airway', 'medication', 'priority_med', 'oxygen', 'call', 'abcde_sequence', 'abcde_repeat', 'verbalize', 'compressions', 'aed', 'breaths'], checklist: CHECKLIST_ANAPHYLAXIS },
  ZHKK: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'ecg', 'ecg_interpret', 'venous', 'pupils', 'muscle_tone', 'glucose', 'abdomen', 'medication', 'medication_correct', 'medication_dose', 'medication_route', 'infusion', 'infusion_dose', 'call', 'abcde_sequence', 'abcde_repeat', 'verbalize', 'compressions', 'aed', 'breaths'], checklist: CHECKLIST_ZHKK },
  BOS: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'respiratory_rate', 'auscultation', 'pulse', 'bp', 'medication', 'call'], checklist: CHECKLIST_BOS },
  TELA: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'auscultation', 'pulse', 'bp', 'ecg', 'venous', 'medication', 'call'], checklist: CHECKLIST_TELA },
  PNEUMOTHORAX: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'pleural_puncture', 'medication', 'call'], checklist: CHECKLIST_PNEUMOTHORAX },
  HYPOGLYCEMIA: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'glucose', 'venous', 'medication', 'call'], checklist: CHECKLIST_HYPOGLYCEMIA },
  HYPERGLYCEMIA: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'glucose', 'venous', 'infusion', 'call'], checklist: CHECKLIST_HYPERGLYCEMIA },
  BLS: { order: ['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions_repeat', 'recovery'], checklist: CHECKLIST_BLS },
};

const HOTSPOTS = [
  { id: 'patient', x: 42, y: 25, w: 16, h: 30, label: 'Пациент' },
  { id: 'crash_cart', x: 28, y: 25, w: 12, h: 20, label: 'Укладка' },
  { id: 'monitor', x: 60, y: 15, w: 10, h: 18, label: 'Монитор' },
  { id: 'phone', x: 75, y: 20, w: 8, h: 10, label: 'Телефон' },
  { id: 'aed', x: 72, y: 5, w: 8, h: 10, label: 'АНД' },
];

type Stage = 'menu' | 'station_select' | 'briefing' | 'intro' | 'playing' | 'finished';

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
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
  const [chatHistory, setChatHistory] = useState<{sender: 'dispatcher' | 'doctor', text: string}[]>([]);
  const [smpStep, setSmpStep] = useState(0);
  const [callSuccess, setCallSuccess] = useState(false);

  const [medicationModal, setMedicationModal] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [medFeedback, setMedFeedback] = useState('');

  const [ecgModalOpen, setEcgModalOpen] = useState(false);
  const [ecgFeedback, setEcgFeedback] = useState('');
  const [currentEcg, setCurrentEcg] = useState<any>(null);

  const hasSpokenMinuteWarning = useRef(false);
  const isFinishing = useRef(false);

  const currentOrder = SCENARIO_DATA[scenario]?.order || [];
  const currentChecklist = SCENARIO_DATA[scenario]?.checklist || [];

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

  useEffect(() => {
    if (scenario && PATIENT_DATA[scenario]) {
      setVitals(PATIENT_DATA[scenario].initialVitals);
    }
  }, [scenario]);

  useEffect(() => {
    if (actions['oxygen'] && !isArrest) setVitals(prev => ({ ...prev, spo2: 98 }));
  }, [actions, isArrest]);

  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialty(specId);
    setStage('station_select');
  };

  const handleSelectStation = (station: any) => {
    if (station.type === 'locked') return;
    
    if (station.type === 'single') {
      setScenario(station.id as ScenarioType);
      setStage('briefing');
    } else if (station.type === 'group') {
      const scenarios = station.scenarios;
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      setScenario(randomScenario);
      setStage('briefing');
    }
  };

  const handleEnterRoom = () => {
    setStage('intro');
    playAudio(VOICE_INTROS[scenario], () => setStage('playing'));
    setTimeout(() => { if (stage === 'intro') setStage('playing'); }, 15000);
  };

  const finishScenario = async () => {
    if (isFinishing.current) return;
    isFinishing.current = true;
    
    setStage('finished');
    
    let penalty = 0;
    if (scenario === 'ZHKK' && actions['oxygen_wrong']) penalty += 10;
    if (scenario === 'HYPOGLYCEMIA' && actions['oxygen_wrong']) penalty += 10;
    if (scenario === 'HYPERGLYCEMIA' && actions['oxygen_wrong']) penalty += 10;

    const completedItems = currentChecklist.filter((item: any) => actions[item.id]).length;
    const totalItems = currentChecklist.length;
    let calculatedScore = Math.round((completedItems / totalItems) * 100);
    
    calculatedScore = Math.max(0, calculatedScore - penalty);
    
    setScore(calculatedScore);

    if (supabase && scenario) {
      try {
        await supabase.from('attempts').insert({ 
          scenario_id: scenario, 
          score: calculatedScore, 
          actions: { fullSequence: sequence, mistakes, completedItems } 
        });
      } catch (e) { console.error(e); }
    }
  };

  const toggleAction = (id: string) => {
    if (actions[id]) return;
    setActions((prev) => ({ ...prev, [id]: true }));
    setSequence((prev) => [...prev, id]);
    setChallenge(null);
  };

  const startHoldChallenge = (id: string, seconds: number) => {
    setChallenge(id);
    setHoldSuccess(false);
    setTimerChallenge(seconds);
    
    if (holdInterval.current) clearInterval(holdInterval.current);
    holdInterval.current = setInterval(() => {
      setTimerChallenge((prev) => {
        if (prev <= 1) {
          clearInterval(holdInterval.current!);
          setHoldSuccess(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopHoldChallenge = () => {
    if (holdInterval.current) clearInterval(holdInterval.current);
    if (!holdSuccess) setTimerChallenge(0);
  };

  const handleActionClick = (id: string) => {
    if (actions[id]) return;

    if (APK_MESSAGES[id]) {
      setPatientResponse(APK_MESSAGES[id]);
    } else {
      const responseText = PATIENT_DATA[scenario]?.responses?.[id];
      if (responseText) setPatientResponse(responseText);
    }

    if (id === 'ecg') {
      toggleAction('ecg');
      setAccredicMessage('ЭКГ снята. Пленка готова к интерпретации.');
      setTimeout(() => setAccredicMessage(null), 2000);
      return;
    }

    if (id === 'ecg_interpret') {
      // ВЫБИРАЕМ ЭКГ ПО ТАЙМЕРУ
      let ecgToShow;
      if (timeLeft > 240) {
        ecgToShow = ECG_DATA[scenario].initial;
      } else if (timeLeft > 120) {
        ecgToShow = ECG_DATA[scenario].arrest45;
      } else {
        ecgToShow = ECG_DATA[scenario].arrest65;
      }
      setCurrentEcg(ecgToShow);
      setEcgModalOpen(true);
      setEcgFeedback('');
      return;
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

  const handleEcgAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setEcgFeedback(`Верно! ${currentEcg.correct}`);
      setTimeout(() => {
        setEcgModalOpen(false);
        toggleAction('ecg_interpret');
      }, 2500);
    } else {
      setEcgFeedback('Ошибка! Посмотрите внимательно на ЭКГ.');
      setMistakes(prev => [...prev, 'Неверная интерпретация ЭКГ']);
    }
  };

  const handleAedShock = () => {
    if (aedState === 'shock') {
      setAedState('success'); 
      toggleAction('aed');
      setTimeout(() => setAedOpen(false), 1500);
    }
  };

  const handleSmpOptionClick = (option: any) => {
    const newHistory = [...chatHistory, { sender: 'doctor' as const, text: option.text }];
    
    if (option.correct) {
      if (smpStep < SMP_SCRIPT.length - 1) {
        const nextStep = smpStep + 1;
        setSmpStep(nextStep);
        setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: SMP_SCRIPT[nextStep].dispatcher }]);
      } else {
        setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: 'Вызов принят! Ждите.' }]);
        setCallSuccess(true);
        setTimeout(() => { 
          setPhoneModal(false); 
          toggleAction('call'); 
        }, 3000);
      }
    } else {
      setMistakes(prev => [...prev, 'Ошибка при вызове СМП (неверная информация)']);
      setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: SMP_SCRIPT[smpStep].wrongReply }]);
    }
  };

  const handleMedicationSubmit = () => {
    const correctMeds = MEDICATIONS[scenario]?.filter(m => m.correct).map(m => m.name) || [];
    const incorrectMeds = MEDICATIONS[scenario]?.filter(m => !m.correct).map(m => m.name) || [];

    const selectedIncorrect = selectedMeds.filter(m => incorrectMeds.includes(m));
    const selectedCorrect = selectedMeds.filter(m => correctMeds.includes(m));

    if (selectedIncorrect.length > 0) {
      setMedFeedback('Ошибка! Вы назначили противопоказанный препарат.');
      setMistakes(prev => [...prev, 'Назначены неверные препараты']);
      return;
    }
    if (selectedCorrect.length < correctMeds.length) {
      setMedFeedback('Не все необходимые препараты назначены!');
      return;
    }

    setMedFeedback('Лечение назначено верно!');
    setTimeout(() => {
      setMedicationModal(false);
      toggleAction('medication');
    }, 2000);
  };

  const toggleMeds = (medName: string) => {
    setSelectedMeds(prev => prev.includes(medName) ? prev.filter(m => m !== medName) : [...prev, medName]);
    setMedFeedback('');
  };

  const handleCprClick = () => {
    const now = Date.now();
    let feedback = '';
    if (lastCprTime.current !== 0) {
      const interval = now - lastCprTime.current;
      if (interval < 400) {
        feedback = 'Слишком быстро!';
        if (!mistakes.includes('Неправильный ритм компрессий (слишком быстро)')) {
          setMistakes(prev => [...prev, 'Неправильный ритм компрессий (слишком быстро)']);
        }
      } else if (interval > 750) {
        feedback = 'Слишком медленно!';
        if (!mistakes.includes('Неправильный ритм компрессий (слишком медленно)')) {
          setMistakes(prev => [...prev, 'Неправильный ритм компрессий (слишком медленно)']);
        }
      } else {
        feedback = 'Отличный ритм!';
      }
    } else {
      feedback = 'Начали!';
    }
    lastCprTime.current = now;
    setCprFeedback(feedback);
    setCprCount(prev => {
      const next = prev + 1;
      if (next >= 30) setTimeout(() => { setChallenge(null); toggleAction('compressions'); }, 500);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (challenge === 'cpr' && e.code === 'Space') { e.preventDefault(); handleCprClick(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [challenge]);

  if (stage === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Аккред и Ко</h1>
        <h2 className="text-2xl text-red-500 font-bold mb-4">ВЫБОР СПЕЦИАЛЬНОСТИ</h2>
        <p className="text-gray-400 mb-8 text-lg">Выберите специальность для прохождения ОСКЭ</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {SPECIALTIES.map(spec => (
            <button key={spec.id} onClick={() => handleSelectSpecialty(spec.id)} className="bg-gray-800 hover:bg-gray-700 p-8 rounded-2xl border-2 border-gray-700 hover:border-blue-500 text-left transition transform hover:-translate-y-1 hover:shadow-xl">
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
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <button onClick={() => setStage('menu')} className="mb-6 text-gray-400 hover:text-white transition flex items-center gap-2">← Назад к специальностям</button>
          <h1 className="text-3xl font-bold mb-8">{spec?.title}</h1>
          <div className="space-y-4">
            {spec?.stations.map(st => (
              <button key={st.id} onClick={() => handleSelectStation(st)} disabled={st.type === 'locked'} className={`w-full text-left p-6 rounded-xl border-2 transition flex justify-between items-center ${st.type === 'locked' ? 'bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-800 border-gray-700 hover:border-blue-500 text-white'}`}>
                <div>
                  <h3 className="text-xl font-bold">{st.title}</h3>
                  {st.type === 'group' && <p className="text-sm text-gray-400 mt-1">Случайный выбор одного из 9 сценариев</p>}
                </div>
                <div>
                  {st.type === 'locked' ? <span className="text-xs bg-gray-700 px-2 py-1 rounded">В разработке</span> : <span className="text-blue-500 text-2xl">→</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'briefing') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Брифинг: {SCENARIO_TITLES[scenario]}</h1>
          <div className="space-y-4 text-lg text-gray-200 leading-relaxed">
            <p>Вы — врач своей специальности. Медицинский брат/сестра вызвал/а Вас на помощь.</p>
            <p>Перед Вами пациент <strong>45 лет</strong>.</p>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={() => setStage('station_select')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl shadow-lg transition">Назад</button>
            <button onClick={handleEnterRoom} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition">Войти на станцию</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-bold mb-4">Слушайте вводную информацию...</h1>
      </div>
    );
  }

  if (stage === 'finished') {
    const isPassed = score >= 70;
    
    return (
      <div className={`min-h-screen p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-6">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-700">ЧЕК-ЛИСТ</h1>
            <p className="text-gray-500">Ситуация: {SCENARIO_TITLES[scenario]}</p>
            <h2 className={`text-6xl font-bold mt-4 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</h2>
            <p className={`text-xl font-bold mt-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{isPassed ? 'ЭКЗАМЕН СДАН' : 'ЭКЗАМЕН НЕ СДАН'}</p>
          </div>
          <div className="space-y-2">
            {currentChecklist.map((item: any, index: number) => {
              const isDone = actions[item.id];
              return (
                <div key={item.id + index} className={`flex items-center justify-between p-3 rounded-lg border ${isDone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-mono w-6">{index + 1}.</span>
                    <span className={`text-sm ${isDone ? 'text-gray-800 font-medium' : 'text-red-700'}`}>{item.text}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold min-w-[80px] justify-end">
                    <span className={isDone ? 'text-green-600' : 'text-gray-300'}>☑ да</span>
                    <span className={!isDone ? 'text-red-600' : 'text-gray-300'}>☐ нет</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 pt-6 border-t flex justify-center gap-4">
            <button onClick={() => window.location.reload()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition">В главное меню</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white overflow-hidden relative ${timeLeft < 60 || isArrest ? 'animate-pulse ring-8 ring-red-600 ring-inset' : ''}`}>
      
      <div className="absolute top-4 right-4 bg-black/80 border border-gray-600 p-3 rounded-xl z-40 font-mono text-sm shadow-xl w-48">
        <div className="flex items-center gap-2 mb-1"><span className={isArrest ? 'text-gray-500' : 'text-red-500 animate-pulse'}>❤️</span><span>ЧСС: {vitals.hr} {isArrest ? '' : 'уд/мин'}</span></div>
        <div className="flex items-center gap-2 mb-1"><span className={isArrest ? 'text-gray-500' : 'text-blue-400'}>🫁</span><span>SpO2: {vitals.spo2}%</span></div>
        <div className="flex items-center gap-2"><span className={isArrest ? 'text-gray-500' : 'text-green-400'}>🩸</span><span>АД: {vitals.bpSys}/{vitals.bpDia}</span></div>
        {isArrest && <div className="text-red-500 font-bold text-center mt-2 animate-pulse text-xs">АСИСТОЛИЯ</div>}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className={`text-2xl font-mono font-bold tracking-widest ${timeLeft < 60 ? 'text-red-500' : 'text-green-400'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      <div className="absolute bottom-20 left-4 z-40 flex items-end pointer-events-none">
        <img src="/helper.png" alt="Аккредик" className="w-24 h-24 drop-shadow-2xl" />
        <div className="ml-2 mb-4 flex flex-col gap-2 items-start">
          {accredicMessage && (
            <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-bl-none shadow-xl border-2 border-blue-500 max-w-xs relative">
              <div className="absolute -left-2 bottom-2 w-4 h-4 bg-white border-b-2 border-l-2 border-blue-500 transform rotate-45"></div>
              <p className="font-medium text-sm">{accredicMessage}</p>
            </div>
          )}
          {patientResponse && (
            <div className="bg-teal-50 text-teal-900 p-4 rounded-2xl shadow-xl border-2 border-teal-500 max-w-sm relative">
              <p className="font-bold text-xs text-teal-600 mb-1">Ответ пациента:</p>
              <p className="text-sm font-medium">{patientResponse}</p>
              <button onClick={() => setPatientResponse(null)} className="absolute top-1 right-2 text-teal-400 hover:text-teal-700 text-xs">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛКА ЭКГ */}
      {ecgModalOpen && currentEcg && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-6 w-full max-w-3xl shadow-2xl flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-center text-blue-400">Интерпретация ЭКГ</h3>
            
            <div className="bg-white p-2 rounded-lg mb-4 flex justify-center">
              <img src={currentEcg.image} alt="ЭКГ" className="max-h-[40vh] object-contain" />
            </div>

            <p className="text-center mb-4 text-white font-medium">Что вы видите на данной ЭКГ?</p>

            {ecgFeedback && (
              <div className={`p-3 rounded-lg mb-4 text-center font-bold ${ecgFeedback.includes('Верно') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {ecgFeedback}
              </div>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => handleEcgAnswer(true)} 
                className="w-full p-3 bg-gray-700 hover:bg-green-600 text-white rounded-lg text-left transition border border-gray-600"
              >
                {currentEcg.correct}
              </button>
              
              {currentEcg.wrong.map((wrong: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => handleEcgAnswer(false)} 
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-left transition border border-gray-600"
                >
                  {wrong}
                </button>
              ))}
            </div>
            
            {!ecgFeedback.includes('Верно') && (
              <button onClick={() => setEcgModalOpen(false)} className="mt-4 text-gray-400 underline self-center">Закрыть</button>
            )}
          </div>
        </div>
      )}

      {challenge && challenge !== 'cpr' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">{challenge === 'cap_refill' ? 'Симптом белого пятна' : challenge === 'pulse' ? 'Оценка пульса' : 'Оценка дыхания'}</h3>
            <p className="mb-4 text-sm text-gray-600">{challenge === 'cap_refill' ? 'Нажмите и удерживайте 5 секунд.' : 'Нажмите и удерживайте 10 секунд.'}</p>
            <button 
              onMouseDown={() => !holdSuccess && startHoldChallenge(challenge, timerChallenge || 10)}
              onMouseUp={stopHoldChallenge}
              onMouseLeave={stopHoldChallenge}
              onTouchStart={() => !holdSuccess && startHoldChallenge(challenge, timerChallenge || 10)}
              onTouchEnd={stopHoldChallenge}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${holdSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              {holdSuccess ? 'Выполнено!' : timerChallenge > 0 ? `Удерживайте: ${timerChallenge}...` : 'Удерживайте'}
            </button>
            {holdSuccess && <button onClick={() => { toggleAction(challenge); setChallenge(null); }} className="mt-4 text-blue-600 font-bold">Продолжить</button>}
          </div>
        </div>
      )}

      {phoneModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[70vh]">
            <div className="p-4 bg-gray-900 rounded-t-2xl border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-400">📞 Диспетчер СМП</h3>
              {callSuccess && <span className="text-green-500 text-sm font-bold">Вызов принят</span>}
            </div>
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
            <div className="p-4 bg-gray-900 rounded-b-2xl border-t border-gray-700">
              {!callSuccess ? (
                <div className="space-y-2">
                  {SMP_SCRIPT[smpStep].options.map((option, index) => (
                    <button key={index} onClick={() => handleSmpOptionClick(option)} className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition border border-gray-600">{option.text}</button>
                  ))}
                </div>
              ) : (
                <button onClick={() => setPhoneModal(false)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">Завершить звонок</button>
              )}
            </div>
          </div>
        </div>
      )}

      {challenge === 'cpr' && (
        <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50 p-4">
          <h2 className="text-3xl font-bold mb-2 text-white">Компрессии</h2>
          <p className="text-gray-400 mb-8">Нажимайте в ритме 100-120 в минуту</p>
          <div className={`mb-6 text-2xl font-bold ${cprFeedback === 'Отличный ритм!' ? 'text-green-400' : cprFeedback.includes('Слишком') ? 'text-red-500' : 'text-white'}`}>{cprFeedback}</div>
          <button onClick={handleCprClick} className="w-64 h-64 bg-red-600 rounded-full text-white text-7xl font-bold shadow-[0_0_80px_rgba(220,38,38,0.6)] active:scale-95 transition-transform flex items-center justify-center select-none">{cprCount}</button>
          <p className="mt-8 text-white text-xl">Осталось: {30 - cprCount}</p>
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
              <button onClick={handleAedShock} disabled={aedState !== 'shock'} className="bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl">Разряд</button>
            </div>
            <button onClick={() => setAedOpen(false)} className="mt-6 text-gray-400 underline">Закрыть</button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />

        {HOTSPOTS.map((spot) => (
          <button 
            key={spot.id} 
            onClick={() => {
              if (spot.id === 'aed') setAedOpen(true);
              else setActiveHotspot(spot.id);
            }} 
            className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl z-10 transition-all cursor-pointer" 
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }} 
            title={spot.label}
          >
            <span className="opacity-0 hover:opacity-100 bg-black/80 text-white text-xs p-1 rounded transition-opacity">{spot.label}</span>
          </button>
        ))}

        {activeHotspot && !aedOpen && !challenge && !phoneModal && !medicationModal && !ecgModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <button onClick={() => setActiveHotspot(null)} className="float-right font-bold">✕</button>
              <h3 className="text-xl font-bold mb-2">Действия</h3>
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm font-medium">
                💡 Подсказка: {currentOrder[sequence.length] ? ALL_ACTIONS.find(a => a.id === currentOrder[sequence.length])?.label : 'Все шаги выполнены!'}
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {ALL_ACTIONS.map((action) => {
                  if (scenario !== 'BLS') {
                    if (activeHotspot === 'patient' && !['consciousness', 'airway', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'pupils', 'muscle_tone', 'abdomen', 'compressions', 'breaths', 'venous', 'danger', 'choking', 'back_blows', 'heimlich', 'breathing', 'recovery', 'medication', 'hands', 'pleural_puncture', 'raise_bed', 'infusion', 'additional_meds', 'priority_med', 'medication_correct', 'medication_dose', 'medication_route', 'infusion_dose', 'abcde_sequence', 'abcde_repeat', 'verbalize'].includes(action.id)) return null;
                    if (activeHotspot === 'crash_cart' && !['gloves', 'oxygen', 'adrenaline', 'hands'].includes(action.id)) return null;
                    if (activeHotspot === 'monitor' && !['ecg', 'ecg_interpret', 'spo2'].includes(action.id)) return null;
                    if (activeHotspot === 'phone' && action.id !== 'call') return null;
                  } else {
                    if (activeHotspot === 'patient' && !['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'compressions', 'breaths', 'recovery'].includes(action.id)) return null;
                    if (activeHotspot === 'phone' && action.id !== 'call') return null;
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
      </div>
    </div>
  );
}
