'use client';

import { useState, useEffect, useRef, PointerEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

type ScenarioType = 'OKS1' | 'OKS2' | 'ANAPHYLAXIS' | 'ZHKK' | 'BOS' | 'TELA' | 'PNEUMOTHORAX' | 'HYPOGLYCEMIA' | 'HYPERGLYCEMIA' | 'BLS' | 'BLS1' | 'BLS2' | 'BLS3' | 'BLS4';

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
  BLS1: 'Базовая СЛР — сценарий 1: инородное тело, разряд АНД',
  BLS2: 'Базовая СЛР — сценарий 2: инородное тело, без разряда АНД',
  BLS3: 'Базовая СЛР — сценарий 3: остановка сердца, разряд АНД',
  BLS4: 'Базовая СЛР — сценарий 4: остановка сердца, без разряда АНД',
};

// --- БАЗА ДАННЫХ ЭКГ ---
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
  },
  BLS1: { initial: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] }, arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] }, arrest65: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] } },
  BLS2: { initial: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }, arrest45: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }, arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] } },
  BLS3: { initial: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] }, arrest45: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] }, arrest65: { image: '/ecg_vf.jpg', correct: 'Фибрилляция желудочков.', wrong: ['Асистолия', 'Синусовый ритм', 'Электрическая активность без пульса'] } },
  BLS4: { initial: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }, arrest45: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }, arrest65: { image: '/ecg_asystole.jpg', correct: 'Асистолия.', wrong: ['Фибрилляция желудочков', 'Желудочковая тахикардия', 'Синусовый ритм'] }
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
  BLS1: 'Мужчина подавился пищей. Он в сознании, не может эффективно откашляться. Время пошло!',
  BLS2: 'Мужчина подавился пищей. Он в сознании, не может эффективно откашляться. Время пошло!',
  BLS3: 'Мужчина лежит на полу без сознания, нормального дыхания нет. Время пошло!',
  BLS4: 'Мужчина лежит на полу без сознания, нормального дыхания нет. Время пошло!',
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
  BLS: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: {} },
  BLS1: { initialVitals: { hr: 110, spo2: 94, bpSys: 120, bpDia: 80, rr: 0 }, responses: { danger: 'Опасности нет!', choking: 'Пострадавший не может говорить.', consciousness: 'Пациент не реагирует.', breathing: 'Дыхания нет!', pulse: 'Пульса нет!' } },
  BLS2: { initialVitals: { hr: 110, spo2: 94, bpSys: 120, bpDia: 80, rr: 0 }, responses: { danger: 'Опасности нет!', choking: 'Пострадавший не может говорить.', consciousness: 'Пациент не реагирует.', breathing: 'Дыхания нет!', pulse: 'Пульса нет!' } },
  BLS3: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: { danger: 'Опасности нет!', consciousness: 'Пациент не реагирует.', breathing: 'Дыхания нет!', pulse: 'Пульса нет!', reassess_consciousness: 'Пациент не реагирует.', reassess_breathing: 'Дыхание есть!', reassess_pulse: 'Пульс есть!' } },
  BLS4: { initialVitals: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 }, responses: { danger: 'Опасности нет!', consciousness: 'Пациент не реагирует.', breathing: 'Дыхания нет!', pulse: 'Пульса нет!', reassess_consciousness: 'Пациент не реагирует.', reassess_breathing: 'Дыхание есть!', reassess_pulse: 'Пульс есть!' } }
};

const APK_MESSAGES: Record<string, string> = {
  hands: 'Будем считать, что руки обработаны',
  sterility: 'Будем считать, что всё годно',
  venous: 'Венозный доступ уже установлен',
  pleural_puncture: 'Будем считать, что пункция грудной полости выполнена',
};

const SMP_SCRIPT = [{ dispatcher: 'Скорая помощь слушает, что случилось?' }];

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
  BLS: [],
  BLS1: [],
  BLS2: [],
  BLS3: [],
  BLS4: []
};

const ALL_ACTIONS = [
  { id: 'danger', label: 'Убедиться в отсутствии опасности' }, { id: 'hands', label: 'Обработать руки' }, { id: 'choking', label: 'Спросить: «Вы подавились?»' },
  { id: 'back_blows', label: '5 ударов между лопатками' }, { id: 'heimlich', label: '5 надавливаний на живот (Геймлих)' }, { id: 'breathing', label: 'Оценить дыхание (10 сек)' },
  { id: 'recovery', label: 'Устойчивое боковое положение' }, { id: 'reassess_consciousness', label: 'Повторно оценить сознание' }, { id: 'reassess_breathing', label: 'Повторно оценить дыхание (10 сек)' }, { id: 'consciousness', label: 'Оценить сознание' }, { id: 'gloves', label: 'Надеть перчатки' },
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
  { id: 'verbalize', label: 'Комментировать действия вслух' }, { id: 'compressions', label: 'Компрессии (30 раз)' }, { id: 'breaths', label: 'ИВЛ (2 вдоха)' }, 
  { id: 'aed', label: 'Работа с АНД' }, 
  { id: 'compressions_repeat', label: 'Продолжить СЛР (компрессии)' },
  { id: 'reassess_pulse', label: 'Повторно оценить пульс (10 сек)' }
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
const CHECKLIST_BLS = [
  { id: 'danger', text: 'Первично убедился в отсутствии опасности' },
  { id: 'choking', text: 'Оценил признаки удушья' },
  { id: 'back_blows', text: 'Выполнил 5 ударов между лопатками' },
  { id: 'heimlich', text: 'Выполнил 5 абдоминальных толчков' },
  { id: 'consciousness', text: 'Оценил сознание' },
  { id: 'airway', text: 'Открыл дыхательные пути' },
  { id: 'breathing', text: 'Оценил дыхание' },
  { id: 'pulse', text: 'Оценил пульс' },
  { id: 'call', text: 'Вызов СМП' },
  { id: 'compressions', text: 'Компрессии (30 раз)' },
  { id: 'forehead_hand', text: 'Положил ладонь одной руки на лоб пострадавшего' },
  { id: 'forehead_hand', text: 'Положил ладонь одной руки на лоб пострадавшего' },
  { id: 'breaths', text: 'Сделал 2 вдоха' },
  { id: 'aed', text: 'Работа с АНД' },
  { id: 'compressions_repeat', text: 'Возобновил СЛР после АНД' },
  { id: 'recovery', text: 'Устойчивое боковое положение' }
];
const CHECKLIST_BLS_CHOKING = CHECKLIST_BLS.filter(item => item.id !== 'recovery');
const CHECKLIST_BLS_ARREST = [
  { id: 'danger', text: 'Убедился в отсутствии опасности' },
  { id: 'consciousness', text: 'Оценил сознание' },
  { id: 'airway', text: 'Открыл дыхательные пути' },
  { id: 'breathing', text: 'Оценил дыхание' },
  { id: 'pulse', text: 'Оценил пульс' },
  { id: 'call', text: 'Вызов СМП' },
  { id: 'compressions', text: 'Компрессии (30 раз)' },
  { id: 'breaths', text: 'Сделал 2 вдоха' },
  { id: 'aed', text: 'Работа с АНД' },
  { id: 'compressions_repeat', text: 'Возобновил СЛР после АНД' },
  { id: 'reassess_consciousness', text: 'Повторно оценил сознание' },
  { id: 'reassess_breathing', text: 'Повторно оценил дыхание' },
  { id: 'reassess_pulse', text: 'Повторно оценил пульс' },
  { id: 'recovery', text: 'Устойчивое боковое положение' }
];

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
  BLS1: { order: ['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions_repeat'], checklist: CHECKLIST_BLS_CHOKING },
  BLS2: { order: ['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions_repeat'], checklist: CHECKLIST_BLS_CHOKING },
  BLS3: { order: ['danger', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions_repeat', 'reassess_consciousness', 'reassess_breathing', 'recovery'], checklist: CHECKLIST_BLS_ARREST },
  BLS4: { order: ['danger', 'consciousness', 'airway', 'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions_repeat', 'reassess_consciousness', 'reassess_breathing', 'recovery'], checklist: CHECKLIST_BLS_ARREST },
};

const HOTSPOTS = [
  { id: 'patient', x: 41, y: 34, w: 18, h: 58, label: 'Пациент' },
  { id: 'crash_cart', x: 28, y: 25, w: 12, h: 20, label: 'Укладка' },
  { id: 'monitor', x: 60, y: 15, w: 10, h: 18, label: 'Монитор' },
  { id: 'phone', x: 75, y: 20, w: 8, h: 10, label: 'Телефон' },
  { id: 'aed', x: 72, y: 5, w: 8, h: 10, label: 'АНД' },
];

type Stage = 'menu' | 'station_select' | 'briefing' | 'intro' | 'playing' | 'finished';
type RunMode = 'training' | 'exam';

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [runMode, setRunMode] = useState<RunMode>('training');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioType>('OKS1');
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const actionsRef = useRef<Record<string, boolean>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(510);
  const [score, setScore] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [patientResponse, setPatientResponse] = useState<string | null>(null);
  const [akkredikHint, setAkkredikHint] = useState<string | null>(null);

  const [isArrest, setIsArrest] = useState(false);
  const [vitals, setVitals] = useState<{ hr: number; spo2: number; bpSys: number; bpDia: number; rr?: number }>({ hr: 110, spo2: 88, bpSys: 90, bpDia: 40 });

  const [challenge, setChallenge] = useState<string | null>(null);
  const [timerChallenge, setTimerChallenge] = useState(0);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const holdInterval = useRef<NodeJS.Timeout | null>(null);
  const [clothingAssessment, setClothingAssessment] = useState<{ actionId: string; opened: boolean; secondsLeft: number } | null>(null);
  const [foreheadHandOpen, setForeheadHandOpen] = useState(false);
  const [foreheadHandPosition, setForeheadHandPosition] = useState({ x: 72, y: 68 });
  const [foreheadHandDragging, setForeheadHandDragging] = useState(false);
  const foreheadSceneRef = useRef<HTMLDivElement | null>(null);

  const clothingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clothingStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clothingSecondsRef = useRef(10);
  
  const [cprCount, setCprCount] = useState(0);
  const cprCountRef = useRef(0);
  const [cprFeedback, setCprFeedback] = useState('');
  const lastCprTime = useRef<number>(0);
  const cprIntervals = useRef<number[]>([]);
  const cprFinished = useRef(false);
  
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'no_shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);
  const [aedPowered, setAedPowered] = useState(false);
  const [aedPadsPlaced, setAedPadsPlaced] = useState([false, false]);
  const [aedPadPositions, setAedPadPositions] = useState([{ x: 88, y: 76 }, { x: 88, y: 89 }]);
  const [aedDraggingPad, setAedDraggingPad] = useState<number | null>(null);
  const [aedAnalysisUntouched, setAedAnalysisUntouched] = useState(true);
  const [aedShockUntouched, setAedShockUntouched] = useState(true);
  const aedSceneRef = useRef<HTMLDivElement | null>(null);
  const [blsCompressionElapsed, setBlsCompressionElapsed] = useState(0);
  const [blsCompressionRunning, setBlsCompressionRunning] = useState(false);
  const [blsAedAvailable, setBlsAedAvailable] = useState(false);
  const [blsSecondCycle, setBlsSecondCycle] = useState(false);
  const [blsRosc, setBlsRosc] = useState(false);

  const [phoneModal, setPhoneModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<{sender: 'dispatcher' | 'doctor', text: string}[]>([]);
  const [smpInput, setSmpInput] = useState('');
  const [callSuccess, setCallSuccess] = useState(false);

  const [medicationModal, setMedicationModal] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [medFeedback, setMedFeedback] = useState('');

  const [ecgModalOpen, setEcgModalOpen] = useState(false);
  const [ecgFeedback, setEcgFeedback] = useState('');
  const [currentEcg, setCurrentEcg] = useState<any>(null);

  const hasSpokenMinuteWarning = useRef(false);
  const isFinishing = useRef(false);

  const isBlsScenario = scenario.startsWith('BLS');
  const isBlsShockable = scenario === 'BLS1' || scenario === 'BLS3';
  const needsRecoveryPosition = scenario === 'BLS3' || scenario === 'BLS4';
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
    
    if (timeLeft === 240 && !isArrest && !scenario.startsWith('BLS')) {
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
    if (timeLeft === 60 && !hasSpokenMinuteWarning.current && !scenario.startsWith('BLS')) {
      playAudio("У вас осталась одна минута.");
      hasSpokenMinuteWarning.current = true;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, stage, isArrest, scenario]);

  // ТАЙМЕР ДЛЯ АНД
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aedState === 'analyzing' && aedTimer > 0) {
      timer = setTimeout(() => {
        setAedTimer(prev => prev - 1);
      }, 1000);
    } else if (aedState === 'analyzing' && aedTimer === 0) {
      const result = isBlsScenario && !isBlsShockable ? 'no_shock' : 'shock';
      setAedState(result);
      setAedShockUntouched(true);
      if (result === 'shock') playAudio('Разряд показан. Не прикасайтесь к пострадавшему. Нажмите кнопку разряд.');
      else playAudio('Разряд не показан. Немедленно продолжайте СЛР.');
    }
    return () => clearTimeout(timer);
  }, [aedState, aedTimer, isBlsScenario, isBlsShockable]);

  useEffect(() => {
    if (scenario && PATIENT_DATA[scenario]) {
      setVitals(PATIENT_DATA[scenario].initialVitals);
    }
    const arrestAtStart = scenario === 'BLS3' || scenario === 'BLS4';
    setIsArrest(arrestAtStart);
    setBlsCompressionElapsed(0);
    setBlsCompressionRunning(false);
    setBlsAedAvailable(false);
    setBlsSecondCycle(false);
    setBlsRosc(false);
    setAedOpen(false);
    setAedState('idle');
    setAedTimer(0);
    setAedPowered(false);
    setAedPadsPlaced([false, false]);
    setAedPadPositions([{ x: 87, y: 76 }, { x: 87, y: 89 }]);
    setAedDraggingPad(null);
    setAedAnalysisUntouched(true);
    setAedShockUntouched(true);
  }, [scenario]);

  useEffect(() => {
    if (stage !== 'playing' || !scenario.startsWith('BLS') || !blsCompressionRunning || blsRosc) return;
    const timer = setInterval(() => setBlsCompressionElapsed(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [stage, scenario, blsCompressionRunning, blsRosc]);

  useEffect(() => {
    if (!scenario.startsWith('BLS')) return;
    if (!blsSecondCycle && blsCompressionElapsed >= 120 && !blsAedAvailable) {
      setBlsAedAvailable(true);
      const message = 'АНД доступен. Вы можете его использовать.';
      setPatientResponse(message);
      playAudio(message);
    }
    if (blsSecondCycle && blsCompressionElapsed >= 120 && !blsRosc) {
      setBlsRosc(true);
      setBlsCompressionRunning(false);
      setIsArrest(false);
      setVitals({ hr: 82, spo2: 96, bpSys: 110, bpDia: 70, rr: 16 });
      if (scenario === 'BLS1' || scenario === 'BLS2') {
        const message = 'Появились произвольные движения, кожные покровы розовеют. Испытание завершено. Ожидайте голосовой команды, чтобы покинуть станцию.';
        setPatientResponse(message);
        playAudio(message);
        setTimeout(() => finishScenario(), 3500);
      } else {
        const message = 'Появились произвольные движения, кожные покровы розовеют, оцените состояние пострадавшего. Дальнейшие навыки демонстрируйте на условном пострадавшем.';
        setPatientResponse(message);
        playAudio(message);
      }
    }
  }, [scenario, blsSecondCycle, blsCompressionElapsed, blsRosc, blsAedAvailable]);

  useEffect(() => {
    if (actions['oxygen'] && !isArrest) setVitals(prev => ({ ...prev, spo2: 98 }));
  }, [actions, isArrest]);

  const showAkkredikHint = () => {
    if (runMode !== 'training') return;
    if (!isBlsScenario) { setAkkredikHint('Подсказки для этой станции пока готовятся. Сейчас я могу помогать на станции базовой СЛР.'); return; }
    const nextAction = currentOrder.find(actionId => !actionsRef.current[actionId]);
    if (!nextAction) { setAkkredikHint('Основные этапы алгоритма выполнены. Проверь, не осталось ли незавершённых действий или повторной оценки состояния.'); return; }
    const hints: Record<string, string> = {
      danger: 'Начни с безопасности: оцени место происшествия и убедись, что тебе и пострадавшему ничего не угрожает.',
      choking: 'Оцени, может ли пострадавший говорить и эффективно откашливаться. Это помогает определить тяжесть нарушения проходимости дыхательных путей.',
      back_blows: 'При тяжёлой обструкции у взрослого предусмотрены пять ударов между лопатками. После каждого удара оцени, не устранена ли обструкция.',
      heimlich: 'Если пять ударов между лопатками не помогли, переходи к пяти абдоминальным толчкам. После каждого толчка оцени результат.',
      consciousness: 'Оцени сознание: обратись к пострадавшему и проверь реакцию.',
      airway: 'Для оценки дыхания обеспечь проходимость дыхательных путей: запрокинь голову и подними подбородок.',
      breathing: 'Оцени дыхание не более 10 секунд: смотри на движения грудной клетки, слушай и ощущай выдох.',
      call: 'Организуй вызов скорой помощи. Сообщи диспетчеру адрес, что произошло, состояние пострадавшего и что помощь уже оказывается.',
      compressions: 'Начни компрессии в центре грудной клетки. Следи за положением рук, глубиной, частотой и полным расправлением грудной клетки.',
      breaths: 'После 30 компрессий выполни два вдоха с защитной маской или плёнкой. Каждый вдох — до видимого подъёма грудной клетки.',
      aed: blsAedAvailable ? 'АНД доступен. Включи устройство и следуй его голосовым командам: размести электроды и дождись анализа.' : 'Продолжай СЛР. По условиям этого сценария АНД станет доступен после предусмотренного периода компрессий.',
      compressions_repeat: 'После завершения работы с АНД сразу возобнови компрессии и продолжай СЛР.',
      reassess_consciousness: 'После появления признаков восстановления повторно оцени сознание пострадавшего.',
      reassess_breathing: 'Повторно оцени дыхание в течение 10 секунд.',
      recovery: 'Если сознание отсутствует, но нормальное дыхание восстановилось, выполни действия для придания устойчивого бокового положения согласно алгоритму станции.'
    };
    const label = currentChecklist.find((item: any) => item.id === nextAction)?.text || nextAction;
    setAkkredikHint(hints[nextAction] || ('Сейчас этап «' + label + '». Вспомни последовательность и критерии выполнения этого действия, затем выполни его на тренажёре.'));
  };
  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialty(specId);
    setStage('station_select');
  };

  const handleSelectStation = (station: any) => {
    if (station.type === 'locked') return;
    
    if (station.type === 'single') {
      const selectedScenario = station.id === 'BLS'
        ? (['BLS1', 'BLS2', 'BLS3', 'BLS4'][Math.floor(Math.random() * 4)] as ScenarioType)
        : station.id as ScenarioType;
      setScenario(selectedScenario);
      actionsRef.current = {}; setActions({}); setSequence([]); setMistakes([]); setPatientResponse(null); setAkkredikHint(null);
      if (clothingTimerRef.current) clearInterval(clothingTimerRef.current);
      if (clothingStartTimeoutRef.current) clearTimeout(clothingStartTimeoutRef.current);
      setClothingAssessment(null);
      setTimeLeft(510); setScore(0); setIsArrest(false); setBlsCompressionElapsed(0);
      setBlsCompressionRunning(false); setBlsAedAvailable(false); setBlsSecondCycle(false); setBlsRosc(false);
      isFinishing.current = false; hasSpokenMinuteWarning.current = false;
      setStage('briefing');
    } else if (station.type === 'group') {
      const scenarios = station.scenarios;
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      setScenario(randomScenario);
      actionsRef.current = {}; setActions({}); setSequence([]); setMistakes([]); setPatientResponse(null); setAkkredikHint(null);
      if (clothingTimerRef.current) clearInterval(clothingTimerRef.current);
      if (clothingStartTimeoutRef.current) clearTimeout(clothingStartTimeoutRef.current);
      setClothingAssessment(null);
      setTimeLeft(510); setScore(0); setIsArrest(false);
      isFinishing.current = false; hasSpokenMinuteWarning.current = false;
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

    const completedItems = currentChecklist.filter((item: any) => actionsRef.current[item.id]).length;
    const totalItems = currentChecklist.length;
    // Не округляем результат вверх: отображаем целую часть фактического процента.
    let calculatedScore = totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0;
    
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
    if (!actionsRef.current[id]) {
      actionsRef.current = { ...actionsRef.current, [id]: true };
      setActions((prev) => ({ ...prev, [id]: true }));
      // В BLS в последовательность попадают только обязательные этапы сценария.
      // Дополнительные действия, например оценка пульса, не должны нарушать порядок.
      if (!isBlsScenario || currentOrder.includes(id)) {
        setSequence((prev) => prev.includes(id) ? prev : [...prev, id]);
      }
    }
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

  const startClothingAssessment = (actionId: string) => {
    if (clothingTimerRef.current) clearInterval(clothingTimerRef.current);
    if (clothingStartTimeoutRef.current) clearTimeout(clothingStartTimeoutRef.current);
    setActiveHotspot(null);
    clothingSecondsRef.current = 10;
    setClothingAssessment({ actionId, opened: false, secondsLeft: 10 });
  };

  const openClothingForAssessment = () => {
    if (!clothingAssessment || clothingAssessment.opened) return;
    const actionId = clothingAssessment.actionId;
    clothingSecondsRef.current = 10;
    setClothingAssessment({ actionId, opened: true, secondsLeft: 10 });

    // Даем изображению плавно раскрыться, затем отсчитываем 10 секунд наблюдения.
    clothingStartTimeoutRef.current = setTimeout(() => {
      clothingTimerRef.current = setInterval(() => {
        clothingSecondsRef.current -= 1;
        const secondsLeft = clothingSecondsRef.current;
        setClothingAssessment((current) => current ? { ...current, secondsLeft } : null);
        if (secondsLeft <= 0) {
          if (clothingTimerRef.current) clearInterval(clothingTimerRef.current);
          clothingTimerRef.current = null;
          setClothingAssessment(null);
          toggleAction(actionId);
        }
      }, 1000);
    }, 700);
  };

  const stopHoldChallenge = () => {
    if (holdInterval.current) clearInterval(holdInterval.current);
    if (!holdSuccess) setTimerChallenge(0);
  };

  useEffect(() => {
    return () => {
      if (clothingTimerRef.current) clearInterval(clothingTimerRef.current);
      if (clothingStartTimeoutRef.current) clearTimeout(clothingStartTimeoutRef.current);
    };
  }, []);

  const checkBlsActionOrder = (id: string) => {
    if (!isBlsScenario) return true;

    // Повторные циклы СЛР допускаются; порядок оценивается по фактически выполненным действиям.
    if (actionsRef.current[id] && ['compressions', 'compressions_repeat', 'breaths'].includes(id)) return true;

    // До истечения двух минут АНД недоступен — это единственное действие,
    // которое сценарий блокирует до наступления предусмотренного времени.
    if (id === 'aed') {
      if (!blsAedAvailable) {
        const message = 'АНД в данный момент Вам недоступен.';
        setPatientResponse(message);
        playAudio(message);
        setMistakes(prev => prev.includes('Преждевременная попытка использовать АНД') ? prev : [...prev, 'Преждевременная попытка использовать АНД']);
        return false;
      }
      return true;
    }

    const expectedAction = currentOrder.find(actionId => !actionsRef.current[actionId]);
    const repeatableCycleAction = ['compressions_repeat', 'breaths'].includes(id) && actionsRef.current.compressions && !blsRosc;
    if (id !== expectedAction && !repeatableCycleAction) {
      const actionLabel = currentChecklist.find((item: any) => item.id === id)?.text || id;
      const expectedLabel = expectedAction
        ? (currentChecklist.find((item: any) => item.id === expectedAction)?.text || expectedAction)
        : 'последовательность уже завершена';
      const detail = `Нарушена последовательность: «${actionLabel}» выполнено раньше обязательного этапа «${expectedLabel}».`;
      setMistakes(prev => prev.includes(detail) ? prev : [...prev, detail]);
    }
    // В экзамене система не подсказывает следующий шаг и не останавливает студента.
    return true;
  };

  const handleActionClick = (id: string) => {
    const repeatableBlsAction = isBlsScenario && ['compressions', 'compressions_repeat', 'breaths'].includes(id);
    if (actions[id] && !repeatableBlsAction) return;
    const optionalBlsAssessment = isBlsScenario && ['pulse', 'reassess_pulse'].includes(id);
    if (!optionalBlsAssessment && !checkBlsActionOrder(id)) return;

    if (APK_MESSAGES[id]) {
      setPatientResponse(APK_MESSAGES[id]);
    } else {
      const responseText = PATIENT_DATA[scenario]?.responses?.[id];
      if (responseText) {
        setPatientResponse(responseText);
        if (isBlsScenario) playAudio(responseText);
      }
    }

    if (id === 'ecg') {
      toggleAction('ecg');
      return;
    }

    if (id === 'ecg_interpret') {
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

    if (isBlsScenario && id === 'breaths') {
      setForeheadHandPosition({ x: 72, y: 68 });
      setForeheadHandOpen(true);
      return;
    }

    if (id === 'compressions' || id === 'compressions_repeat') {
      // После завершения АНД второй двухминутный таймер запускается
      // при возобновлении компрессий.
      setChallenge(id === 'compressions' ? 'cpr' : 'cpr_repeat');
      setCprCount(0); cprCountRef.current = 0; setCprFeedback(''); lastCprTime.current = 0; cprIntervals.current = []; cprFinished.current = false;
      return;
    }
    if (id === 'cap_refill') {
      startHoldChallenge('cap_refill', 5);
      return;
    }
    if (id === 'pulse') {
      startHoldChallenge(id, 10);
      return;
    }
    if (id === 'respiratory_rate' || id === 'breathing') {
      startClothingAssessment(id);
      return;
    }
    if (id === 'medication') {
      setMedicationModal(true); setSelectedMeds([]); setMedFeedback('');
      return;
    }
    if (id === 'aed') {
      if (isBlsScenario && !blsAedAvailable) {
        setPatientResponse('АНД в данный момент Вам недоступен. Продолжайте СЛР.');
        return;
      }
      setAedOpen(true); setActiveHotspot(null);
      setAedState('idle');
      setAedTimer(0);
      return;
    }
    if (isBlsScenario && id === 'choking') {
      setPatientResponse('Пострадавший не может говорить.');
      playAudio('Пострадавший не может говорить.');
      toggleAction(id);
      return;
    }
    if (isBlsScenario && id === 'back_blows') {
      setPatientResponse('Удалить инородное тело из дыхательных путей пострадавшего не удалось!');
      playAudio('Удалить инородное тело из дыхательных путей пострадавшего не удалось!');
      toggleAction(id);
      return;
    }
    if (isBlsScenario && id === 'heimlich') {
      setPatientResponse('Инородное тело удалено. Пациент находится на полу. Окажите ему помощь.');
      playAudio('Инородное тело удалено. Пациент находится на полу. Окажите ему помощь.');
      setIsArrest(true);
      setVitals({ hr: 0, spo2: 0, bpSys: 0, bpDia: 0, rr: 0 });
      toggleAction(id);
      return;
    }
    if (isBlsScenario && id === 'reassess_consciousness') {
      if (!needsRecoveryPosition || !blsRosc) return;
      setPatientResponse('Пациент не реагирует.');
      toggleAction(id);
      return;
    }
    if (isBlsScenario && id === 'reassess_breathing') {
      if (!needsRecoveryPosition || !blsRosc) return;
      startClothingAssessment(id);
      return;
    }
    if (isBlsScenario && id === 'reassess_pulse') {
      if (!needsRecoveryPosition || !blsRosc) return;
      startHoldChallenge(id, 10);
      return;
    }
    if (isBlsScenario && id === 'reassess_pulse') {
      if (!needsRecoveryPosition || !blsRosc) return;
      startHoldChallenge(id, 10);
      return;
    }
    if (isBlsScenario && id === 'recovery') {
      if (!needsRecoveryPosition || !blsRosc) return;
      if (!actionsRef.current.reassess_consciousness || !actionsRef.current.reassess_breathing || !actionsRef.current.reassess_pulse) {
        setPatientResponse('Сначала повторно оцените сознание и дыхание пострадавшего.');
        return;
      }
      setPatientResponse('Испытание завершено. Ожидайте голосовой команды, чтобы покинуть станцию.');
      playAudio('Испытание завершено. Ожидайте голосовой команды, чтобы покинуть станцию.');
      toggleAction(id);
      setTimeout(() => finishScenario(), 1800);
      return;
    }
    if (id === 'call') {
      setPhoneModal(true);
      setSmpInput('');
      setCallSuccess(false);
      setChatHistory([{ sender: 'dispatcher', text: SMP_SCRIPT[0].dispatcher }]);
      playAudio(SMP_SCRIPT[0].dispatcher);
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

  const recordAedCriterion = (id: string, value: boolean) => {
    actionsRef.current = { ...actionsRef.current, [id]: value };
    setActions(prev => ({ ...prev, [id]: value }));
  };

  const startAedPadDrag = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    if (!aedPowered || aedState !== 'idle' || aedPadsPlaced[index]) return;
    event.preventDefault();
    setAedDraggingPad(index);
    aedSceneRef.current?.setPointerCapture(event.pointerId);
  };

  const moveAedPad = (event: PointerEvent<HTMLDivElement>) => {
    if (aedDraggingPad === null || !aedSceneRef.current) return;
    const rect = aedSceneRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((event.clientY - rect.top) / rect.height) * 100));
    setAedPadPositions(prev => prev.map((position, index) => index === aedDraggingPad ? { x, y } : position));
  };

  const endAedPadDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (aedDraggingPad === null || !aedSceneRef.current) return;
    const index = aedDraggingPad;
    const rect = aedSceneRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const target = index === 0 ? { x: 46, y: 47 } : { x: 53, y: 56 };
    const correctlyPlaced = Math.abs(x - target.x) <= 5 && Math.abs(y - target.y) <= 6;
    if (correctlyPlaced) {
      setAedPadPositions(prev => prev.map((position, padIndex) => padIndex === index ? target : position));
      const nextPadsPlaced = aedPadsPlaced.map((placed, padIndex) => padIndex === index ? true : placed);
      setAedPadsPlaced(nextPadsPlaced);
      if (nextPadsPlaced.every(Boolean)) recordAedCriterion('aed_pads_correct', true);
    } else {
      const starts = [{ x: 88, y: 76 }, { x: 88, y: 89 }];
      setAedPadPositions(prev => prev.map((position, padIndex) => padIndex === index ? starts[index] : position));
    }
    setAedDraggingPad(null);
  };

  const handleAedPatientTouch = () => {
    if (aedState === 'analyzing') {
      setAedAnalysisUntouched(false);
      recordAedCriterion('aed_analysis_no_touch', false);
      setMistakes(prev => prev.includes('Прикасался к пострадавшему во время анализа АНД') ? prev : [...prev, 'Прикасался к пострадавшему во время анализа АНД']);
    }
    if (aedState === 'shock') {
      setAedShockUntouched(false);
      recordAedCriterion('aed_shock_no_touch', false);
      setMistakes(prev => prev.includes('Прикасался к пострадавшему в момент нанесения разряда') ? prev : [...prev, 'Прикасался к пострадавшему в момент нанесения разряда']);
    }
  };

  const completeAedUse = () => {
    setAedState('success');
    const aedProcedureWasSafe = aedAnalysisUntouched && (!isBlsShockable || aedShockUntouched);
    if (aedProcedureWasSafe) toggleAction('aed');
    else recordAedCriterion('aed', false);
    if (isBlsScenario) {
      setBlsSecondCycle(true);
      setBlsCompressionElapsed(0);
      setBlsCompressionRunning(false);
      setPatientResponse(isBlsShockable ? 'Разряд выполнен. Немедленно возобновите СЛР.' : 'Разряд не показан. Немедленно возобновите СЛР.');
    }
    setTimeout(() => setAedOpen(false), 1200);
  };

  const handleAedShock = () => {
    if (aedState === 'shock') {
      recordAedCriterion('aed_shock_pressed', true);
      completeAedUse();
    }
  };

  const handleAedNoShock = () => {
    if (aedState === 'no_shock') completeAedUse();
  };

  const handleSmpMessage = () => {
    const message = smpInput.trim();
    if (!message || callSuccess) return;

    const newHistory = [...chatHistory, { sender: 'doctor' as const, text: message }];
    const fullCallText = newHistory
      .filter(item => item.sender === 'doctor')
      .map(item => item.text)
      .join(' ')
      .toLowerCase();

    const missingDetails = [
      { key: 'address', prompt: 'Назовите точный адрес места происшествия.', pattern: /(?:улица|ул[.]?|проспект|пр-т|переулок|дом|д[.]?|корпус|квартира|кабинет|площадь|набережная|адрес[ :,-]+(?!неизвестен|не знаю|не помню|не указан)[а-яёa-z0-9])/i },
      { key: 'victims', prompt: 'Сколько пострадавших?', pattern: /(?:один|одна|1)[ ]*(?:пострадавш|человек|пациент)?/i },
      { key: 'ageSex', prompt: 'Уточните пол и возраст пострадавшего.', pattern: /(?:(?:мужчин|женщин|мальчик|девочк|подросток)[^.!?]{0,30}(?:[0-9]{1,2}[ ]*лет|[0-9]{1,2}[- ]летн|среднего возраста|средних лет)|(?:[0-9]{1,2}[ ]*лет|[0-9]{1,2}[- ]летн)[^.!?]{0,30}(?:мужчин|женщин|мальчик|девочк|подросток))/i },
      { key: 'event', prompt: 'Что произошло с пострадавшим?', pattern: /(?:подавил|инородн(?:ое тело|ым телом)|потерял сознани|без сознания|упал|обнаружил|лежит на полу)/i },
      { key: 'consciousness', prompt: 'Пострадавший находится без сознания?', pattern: /(?:без сознания|не реагирует|потерял сознание)/i },
      { key: 'breathing', prompt: 'Есть ли у пострадавшего дыхание?', pattern: /(?:не дышит|дыхания нет|нет дыхания|без дыхания|дыхание отсутствует)/i },
      // Распознаём сведения о помощи, даже если студент сообщает их в общей фразе.
      // СРЛ добавлено как частая перестановка букв в аббревиатуре СЛР.
      { key: 'help', prompt: 'Какую помощь Вы оказываете пострадавшему?', pattern: /(?:начинаю|начал|провожу|готов начать|оказываю)[^.!?]{0,60}(?:с[лр]р|сердечно-легоч|реанимац|компресс)|(?:с[лр]р|сердечно-легочн(?:ую|ая) реанимац)/i }
    ];
    const missing = missingDetails.find(detail => !detail.pattern.test(fullCallText));

    setSmpInput('');
    if (missing) {
      setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: missing.prompt }]);
      playAudio(missing.prompt);
      return;
    }

    setChatHistory([...newHistory, { sender: 'dispatcher' as const, text: 'Вызов принят!' }]);
    playAudio('Вызов принят!');
    setCallSuccess(true);
    setTimeout(() => {
      setPhoneModal(false);
      toggleAction('call');
    }, 2500);
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
    if (cprFinished.current) return;
    if (isBlsScenario && !blsCompressionRunning && !blsRosc) {
      setBlsCompressionRunning(true);
    }

    const now = Date.now();
    const interval = lastCprTime.current === 0 ? null : now - lastCprTime.current;
    let feedback = 'Начали: поддерживай равномерный темп.';

    if (interval !== null) {
      cprIntervals.current = [...cprIntervals.current, interval];
      if (interval < 500) {
        feedback = 'Слишком быстро — немного замедлись.';
      } else if (interval > 600) {
        feedback = 'Слишком медленно — немного ускорься.';
      } else {
        feedback = 'Ритм в норме — продолжай.';
      }
    }

    lastCprTime.current = now;
    setCprFeedback(feedback);

    // Счётчик в ref блокирует 31-е и последующие нажатия синхронно,
    // не дожидаясь асинхронного обновления React state.
    const next = cprCountRef.current + 1;
    if (next > 30 || cprFinished.current) return;
    cprCountRef.current = next;
    setCprCount(next);

    if (next === 30) {
      cprFinished.current = true;
      const intervals = cprIntervals.current;
      const goodIntervals = intervals.filter(value => value >= 500 && value <= 600).length;
      const allIntervalsCorrect = intervals.length === 29 && goodIntervals === 29;
      const rateSummary = allIntervalsCorrect
        ? 'Все 30 нажатий выполнены в правильном ритме 100–120 компрессий в минуту.'
        : `Ритм нарушен: правильных интервалов ${goodIntervals} из 29. Для зачёта все 29 интервалов должны соответствовать ритму 100–120 компрессий в минуту.`;
      setCprFeedback(rateSummary);
      if (!allIntervalsCorrect) {
        const detail = `Частота компрессий: правильных интервалов ${goodIntervals} из 29; требуется 29 из 29.`;
        setMistakes(current => current.includes(detail) ? current : [...current, detail]);
      }

      setTimeout(() => {
        setChallenge(null);
        // Критерий компрессий засчитывается только при правильном ритме
        // на всех 29 интервалах между 30 нажатиями.
        if (allIntervalsCorrect) {
          const completedId = challenge === 'cpr_repeat' ? 'compressions_repeat' : 'compressions';
          toggleAction(completedId);
        }
        if (isBlsScenario) {
          setBlsCompressionRunning(true);
        }
      }, 1500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((challenge === 'cpr' || challenge === 'cpr_repeat') && e.code === 'Space') { 
        e.preventDefault(); 
        handleCprClick(); 
      }
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
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-300 mb-2">Режим прохождения</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setRunMode('training'); setAkkredikHint(null); }} className={`rounded-xl border-2 px-4 py-3 font-bold transition ${runMode === 'training' ? 'border-blue-400 bg-blue-600 text-white' : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-blue-400'}`}>Обучение</button>
              <button onClick={() => { setRunMode('exam'); setAkkredikHint(null); }} className={`rounded-xl border-2 px-4 py-3 font-bold transition ${runMode === 'exam' ? 'border-amber-400 bg-amber-600 text-white' : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-amber-400'}`}>Экзамен</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">В обучении доступны подсказки и обратная связь по ритму компрессий. В экзамене они скрыты.</p>
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
    const requiredBlsOrder = currentOrder;
    const completedBlsOrder = sequence;
    const isBlsSequenceCorrect = !isBlsScenario ||
      (completedBlsOrder.length === requiredBlsOrder.length &&
       requiredBlsOrder.every((actionId, index) => completedBlsOrder[index] === actionId));
    const isPassed = score >= 70 && isBlsSequenceCorrect;
    
    return (
      <div className={`min-h-screen p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-6">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-700">ЧЕК-ЛИСТ</h1>
            <p className="text-gray-500">Ситуация: {SCENARIO_TITLES[scenario]}</p>
            <h2 className={`text-6xl font-bold mt-4 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</h2>
            <p className={`text-xl font-bold mt-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{isPassed ? 'ЭКЗАМЕН СДАН' : 'ЭКЗАМЕН НЕ СДАН'}</p>
            {isBlsScenario && !isBlsSequenceCorrect && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                <p className="text-sm font-bold text-red-800">Нарушения последовательности действий</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                  {mistakes.filter(message => message.startsWith('Нарушена последовательность:')).map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                  {currentOrder.filter(actionId => !sequence.includes(actionId)).map((actionId, index) => {
                    const label = currentChecklist.find((item: any) => item.id === actionId)?.text || actionId;
                    return <li key={`missing-${actionId}-${index}`}>Не выполнен обязательный этап: «{label}».</li>;
                  })}
                  {mistakes.some(message => message.includes('Преждевременная попытка использовать АНД')) && (
                    <li>АНД пытались использовать до того, как он стал доступен по сценарию.</li>
                  )}
                </ul>
                <p className="mt-3 text-xs text-red-700">Отметки «да/нет» в чек-листе показывают факт выполнения действия; нарушения порядка перечислены отдельно.</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {currentChecklist.map((item: any, index: number) => {
              const isDone = actions[item.id];
              return (
                <div key={item.id + index} className={`flex items-center justify-between p-3 rounded-lg border ${isDone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
      
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
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className={`text-2xl font-mono font-bold tracking-widest ${timeLeft < 60 && !isBlsScenario ? 'text-red-500' : 'text-green-400'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      <div className="absolute bottom-20 left-4 z-40 flex items-end">
        <img src="/helper.png" alt="Аккредик" className="w-24 h-24 drop-shadow-2xl" />
        <div className="ml-2 mb-4 flex flex-col gap-2 items-start max-w-sm">
          {patientResponse && (
            <div className="bg-teal-50 text-teal-900 p-4 rounded-2xl shadow-xl border-2 border-teal-500 w-full relative">
              <p className="font-bold text-xs text-teal-600 mb-1">Ответ пациента:</p>
              <p className="text-sm font-medium">{patientResponse}</p>
              <button onClick={() => setPatientResponse(null)} className="absolute top-1 right-2 text-teal-400 hover:text-teal-700 text-xs">✕</button>
            </div>
          )}
          {runMode === 'training' && akkredikHint && (
            <div className="bg-amber-50 text-amber-950 p-4 rounded-2xl shadow-xl border-2 border-amber-400 w-full relative">
              <p className="font-bold text-xs text-amber-700 mb-1">Подсказка Аккредика:</p>
              <p className="text-sm font-medium pr-4">{akkredikHint}</p>
              <button onClick={() => setAkkredikHint(null)} className="absolute top-1 right-2 text-amber-600 hover:text-amber-900 text-xs" aria-label="Закрыть подсказку">✕</button>
            </div>
          )}
          {runMode === 'training' && <button onClick={showAkkredikHint} className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg border border-blue-400 transition">Подсказка</button>}
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

      {challenge && challenge !== 'cpr' && challenge !== 'cpr_repeat' && (
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


      {foreheadHandOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/85 p-3">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 text-gray-800 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">Положите ладонь на лоб пострадавшего</h3>
              <button type="button" onClick={() => { setForeheadHandOpen(false); setForeheadHandDragging(false); }} className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100">Закрыть</button>
            </div>
            <div
              ref={foreheadSceneRef}
              className="relative mx-auto w-full max-w-2xl touch-none overflow-hidden rounded-xl bg-slate-100"
              onPointerMove={(event) => {
                if (!foreheadHandDragging || !foreheadSceneRef.current) return;
                const rect = foreheadSceneRef.current.getBoundingClientRect();
                setForeheadHandPosition({
                  x: Math.max(0, Math.min(88, ((event.clientX - rect.left) / rect.width) * 100 - 10)),
                  y: Math.max(0, Math.min(82, ((event.clientY - rect.top) / rect.height) * 100 - 9))
                });
              }}
              onPointerUp={(event) => {
                if (!foreheadHandDragging || !foreheadSceneRef.current) return;
                const rect = foreheadSceneRef.current.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setForeheadHandDragging(false);
                if (x >= 34 && x <= 67 && y >= 5 && y <= 39) {
                  setForeheadHandOpen(false);
                  toggleAction('forehead_hand');
                  setPatientResponse('Правильно: ладонь одной руки расположена на лбу пострадавшего.');
                } else {
                  setForeheadHandPosition({ x: 72, y: 68 });
                  setPatientResponse('Рука расположена неправильно. Попробуйте ещё раз.');
                }
              }}
              onPointerCancel={() => { setForeheadHandDragging(false); setForeheadHandPosition({ x: 72, y: 68 }); }}
            >
              <img src="/patient_face_closeup.png" alt="Лицо пострадавшего" draggable={false} className="block h-auto w-full select-none" />
              <img
                src="/airway_hand_forehead.png"
                alt="Перемещаемая рука"
                draggable={false}
                onPointerDown={(event) => { event.preventDefault(); setForeheadHandDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
                className="absolute z-10 w-[42%] cursor-grab touch-none select-none active:cursor-grabbing"
                style={{ left: `${foreheadHandPosition.x}%`, top: `${foreheadHandPosition.y}%` }}
              />
            </div>
            <p className="mt-3 text-center text-sm text-gray-600">Перетащите изображение руки на область лба пациента.</p>
          </div>
        </div>
      )}

      {clothingAssessment && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={openClothingForAssessment}
              aria-label="Область грудной клетки пациента"
              className="relative block w-full cursor-pointer overflow-hidden rounded-2xl focus:outline-none"
            >
              <img
                src="/patient_clothes_closed.png"
                alt="Пациент"
                draggable={false}
                className={`block w-full h-auto object-contain transition-opacity duration-700 ${clothingAssessment.opened ? 'opacity-0' : 'opacity-100'}`}
              />
              <img
                src="/patient_clothes_open.png"
                alt="Пациент с открытой грудной клеткой"
                draggable={false}
                className={`absolute inset-0 block w-full h-full object-contain transition-opacity duration-700 ${clothingAssessment.opened ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
            {runMode === 'training' && clothingAssessment.opened && (
              <div className="absolute top-3 right-3 rounded-full bg-black/75 px-4 py-2 text-xl font-bold text-white tabular-nums">
                {clothingAssessment.secondsLeft}
              </div>
            )}
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
                <div className="flex gap-2">
                  <input
                    value={smpInput}
                    onChange={(event) => setSmpInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleSmpMessage(); }}
                    placeholder="Сообщите диспетчеру, что произошло..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-3 text-sm text-white placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
                  />
                  <button onClick={handleSmpMessage} disabled={!smpInput.trim()} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Отправить</button>
                </div>
              ) : (
                <button onClick={() => setPhoneModal(false)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">Завершить звонок</button>
              )}
            </div>
          </div>
        </div>
      )}

      {(challenge === 'cpr' || challenge === 'cpr_repeat') && (
        <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50 p-4">
          <h2 className="text-3xl font-bold mb-2 text-white">Компрессии</h2>
          <div
            role="button"
            tabIndex={0}
            aria-label="Нажать на грудную клетку: выполнить компрессию"
            onClick={handleCprClick}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); handleCprClick(); } }}
            className="cursor-pointer select-none touch-manipulation active:scale-95 transition-transform flex flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-2xl"
          >
            <img src="/cpr-hands-elbows.png" alt="Руки для выполнения компрессий: пальцы сцеплены в замок, предплечья и локти видны" className="w-[min(82vw,560px)] h-auto max-h-[48vh] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]" draggable={false} />
          </div>
          {runMode === 'training' && <p className="mt-5 text-white text-xl font-semibold">Компрессий выполнено: {cprCount} / 30</p>}
          {runMode === 'training' && cprFeedback && <p aria-live="polite" className="mt-3 rounded-xl bg-slate-800 px-5 py-3 text-center text-lg font-bold text-sky-200">{cprFeedback}</p>}
        </div>
      )}

      {aedOpen && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-gray-800 border-2 border-gray-600 rounded-2xl p-4 md:p-6 w-full max-w-5xl flex flex-col items-center my-auto">
            <div className="w-full bg-black text-green-400 text-center p-4 rounded-lg mb-4 min-h-[76px] flex flex-col justify-center">
              {!aedPowered && <span className="text-xl font-bold">АНД ВЫКЛЮЧЕН</span>}
              {aedPowered && aedState === 'idle' && <span className="text-xl font-bold">ПОДГОТОВЬТЕ ЭЛЕКТРОДЫ</span>}
              {aedState === 'analyzing' && <span className="text-2xl animate-pulse">АНАЛИЗ РИТМА... {aedTimer}</span>}
              {aedState === 'shock' && <span className="text-2xl text-red-400 font-bold animate-pulse">РАЗРЯД ПОКАЗАН</span>}
              {aedState === 'no_shock' && <span className="text-xl text-yellow-300 font-bold">РАЗРЯД НЕ ПОКАЗАН</span>}
              {aedState === 'success' && <span className="text-2xl text-green-400 font-bold">ГОТОВО</span>}
            </div>

            <div
              ref={aedSceneRef}
              onPointerMove={moveAedPad}
              onPointerUp={endAedPadDrag}
              onPointerCancel={endAedPadDrag}
              className="relative w-full max-w-4xl select-none touch-none rounded-xl overflow-hidden border border-gray-600"
            >
              <img src="/room.jpg" alt="Манекен пациента для размещения электродов АНД" className="block w-full h-auto" draggable={false} />
              {aedPowered && aedState === 'idle' && (
                <>
                  <div className="absolute rounded-full border-2 border-dashed border-yellow-300/90 bg-yellow-300/10" style={{ left: '41%', top: '42%', width: '10%', height: '12%' }} />
                  <div className="absolute rounded-full border-2 border-dashed border-yellow-300/90 bg-yellow-300/10" style={{ left: '48%', top: '51%', width: '10%', height: '12%' }} />
                  {aedPadPositions.map((position, index) => !aedPadsPlaced[index] && (
                    <button
                      key={index}
                      type="button"
                      onPointerDown={(event) => startAedPadDrag(index, event)}
                      className="absolute z-20 w-[9%] min-w-12 aspect-[3/4] rounded-lg border-2 border-white bg-yellow-400 text-gray-900 text-[10px] md:text-xs font-black shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center"
                      style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
                      aria-label={`Переместить электрод ${index + 1}`}
                    >
                      ЭЛЕКТРОД {index + 1}
                    </button>
                  ))}
                  {aedPadsPlaced.map((placed, index) => placed && (
                    <div key={index} className="absolute z-10 w-[9%] min-w-12 aspect-[3/4] rounded-lg border-2 border-white bg-yellow-400 text-gray-900 text-[10px] md:text-xs font-black shadow-xl flex items-center justify-center" style={{ left: `${index === 0 ? 46 : 53}%`, top: `${index === 0 ? 47 : 56}%`, transform: 'translate(-50%, -50%)' }}>
                      ЭЛЕКТРОД {index + 1}
                    </div>
                  ))}
                </>
              )}
              {(aedState === 'analyzing' || aedState === 'shock') && (
                <button
                  type="button"
                  aria-label="Прикоснуться к пациенту"
                  onClick={handleAedPatientTouch}
                  className="absolute z-30 border-2 border-transparent hover:border-red-500/80"
                  style={{ left: '41%', top: '34%', width: '18%', height: '58%' }}
                />
              )}
            </div>

            {!aedPowered && (
              <button
                onClick={() => {
                  setAedPowered(true);
                  recordAedCriterion('aed_power_on', true);
                  playAudio('Подключите электроды к грудной клетке пострадавшего.');
                }}
                className="mt-4 w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
              >
                Включить АНД
              </button>
            )}

            {aedPowered && aedState === 'idle' && (
              <div className="w-full max-w-2xl mt-3 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-200 text-center">Перетащите оба электрода на отмеченные участки грудной клетки.</p>
                <p className="text-xs text-gray-400">Размещено электродов: {aedPadsPlaced.filter(Boolean).length} / 2</p>
                <button
                  onClick={() => {
                    if (aedPadsPlaced.every(Boolean)) {
                      setAedState('analyzing');
                      setAedTimer(3);
                      setAedAnalysisUntouched(true);
                      recordAedCriterion('aed_analysis_no_touch', true);
                      playAudio('Не прикасайтесь к пострадавшему. Идет анализ сердечного ритма.');
                    }
                  }}
                  disabled={!aedPadsPlaced.every(Boolean)}
                  className="w-full max-w-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl"
                >
                  Начать анализ
                </button>
              </div>
            )}

            {aedState === 'analyzing' && <p className="mt-3 text-yellow-200 text-center font-semibold">Не прикасайтесь к пострадавшему во время анализа.</p>}
            {aedState === 'shock' && (
              <div className="mt-3 w-full max-w-md flex flex-col gap-3">
                <p className="text-red-200 text-center font-semibold">Не прикасайтесь к пострадавшему. Выполните разряд по команде АНД.</p>
                <button onClick={handleAedShock} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl">Разряд</button>
              </div>
            )}
            {aedState === 'no_shock' && (
              <button onClick={handleAedNoShock} className="mt-3 w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl">Продолжить СЛР без разряда</button>
            )}
            {aedState === 'success' && <p className="mt-3 text-green-300 text-center font-semibold">Немедленно возобновите СЛР.</p>}
            {aedState === 'success' && <button onClick={() => setAedOpen(false)} className="mt-2 text-gray-300 underline">Закрыть</button>}
          </div>
        </div>
      )}


      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />

        {HOTSPOTS.map((spot) => (
          <button 
            key={spot.id} 
            onClick={() => {
              if (spot.id === 'aed') {
                if (isBlsScenario && !blsAedAvailable) {
                  const message = 'АНД в данный момент Вам недоступен.';
                  setPatientResponse(message);
                  playAudio(message);
                  setMistakes(prev => prev.includes('Преждевременная попытка использовать АНД') ? prev : [...prev, 'Преждевременная попытка использовать АНД']);
                  return;
                }
                if (isBlsScenario && !checkBlsActionOrder('aed')) return;
                setAedOpen(true);
                setAedState('idle');
                setAedTimer(0);
              } else {
                setActiveHotspot(spot.id);
              }
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
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {ALL_ACTIONS.map((action) => {
                  if (!isBlsScenario) {
                    if (activeHotspot === 'patient' && !['consciousness', 'airway', 'respiratory_rate', 'percussion', 'auscultation', 'trachea', 'pulse', 'bp', 'heart_ausc', 'cap_refill', 'skin', 'pupils', 'muscle_tone', 'abdomen', 'compressions', 'breaths', 'venous', 'danger', 'choking', 'back_blows', 'heimlich', 'breathing', 'recovery', 'medication', 'hands', 'pleural_puncture', 'raise_bed', 'infusion', 'additional_meds', 'priority_med', 'medication_correct', 'medication_dose', 'medication_route', 'infusion_dose', 'abcde_sequence', 'abcde_repeat', 'verbalize'].includes(action.id)) return null;
                    if (activeHotspot === 'crash_cart' && !['gloves', 'oxygen', 'adrenaline', 'hands'].includes(action.id)) return null;
                    if (activeHotspot === 'monitor' && !['ecg', 'ecg_interpret', 'spo2'].includes(action.id)) return null;
                    if (activeHotspot === 'phone' && action.id !== 'call') return null;
                  } else {
                    const chokingActions = ['choking', 'back_blows', 'heimlich'];
                    if (activeHotspot === 'patient' && !['danger', 'consciousness', 'airway', 'breathing', 'pulse', 'compressions', 'compressions_repeat', 'breaths', 'recovery', 'reassess_consciousness', 'reassess_breathing', 'reassess_pulse', ...((scenario === 'BLS1' || scenario === 'BLS2') ? [...chokingActions] : [])].includes(action.id)) return null;
                    if (activeHotspot === 'patient' && ['recovery', 'reassess_consciousness', 'reassess_breathing', 'reassess_pulse'].includes(action.id) && (!needsRecoveryPosition || !blsRosc)) return null;
                    if (activeHotspot === 'patient' && action.id === 'aed') return null;
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