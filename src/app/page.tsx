'use client';

import { useState, useEffect, useRef, PointerEvent, type ReactNode } from 'react';
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
      { id: 'BLS', title: 'Станция 1: Базовая сердечно-лёгочная реанимация взрослых и поддержание проходимости дыхательных путей', type: 'single', required: true },
      {
        id: 'emergency_help',
        title: 'Станция 2: Экстренная медицинская помощь',
        type: 'group',
        required: true,
        scenarios: ['OKS1', 'OKS2', 'ANAPHYLAXIS', 'ZHKK', 'BOS', 'TELA', 'PNEUMOTHORAX', 'HYPOGLYCEMIA', 'HYPERGLYCEMIA']
      },
      { id: 'iv_injection', title: 'Станция 3: Внутривенная инъекция', type: 'iv', required: true },
      {
        id: 'random_history',
        title: 'Станция 4: Рандомный выбор — 1 из 2',
        type: 'locked',
        required: false,
        choices: ['Диспансеризация', 'Сбор жалоб и анамнеза']
      },
      {
        id: 'random_exam',
        title: 'Станция 5: Рандомный выбор — 1 из 3',
        type: 'locked',
        required: false,
        choices: [
          'Физикальное обследование пациента: сердечно-сосудистая система',
          'Физикальное обследование пациента: дыхательная система',
          'Физикальное обследование пациента: желудочно-кишечный тракт'
        ]
      }
    ]
  },
];

const IV_SCENARIOS = [
  { id: 'ascorbic', title: 'Аскорбиновая кислота', prescription: 'Раствор 5% — 1 мл', ampoule: 'Аскорбиновая кислота 1 мл, раствор для в/в и в/м введения 5%', expiry: 'до 09.20ХХ', ampouleVolume: '1 мл', dose: '1 мл' },
  { id: 'furosemide', title: 'Фуросемид', prescription: 'Раствор 1% — 2 мл', ampoule: 'Фуросемид 2 мл, раствор для в/в и в/м введения 1%', expiry: 'до 09.20ХХ', ampouleVolume: '2 мл', dose: '2 мл' },
  { id: 'tranexamic', title: 'Транексамовая кислота', prescription: 'Раствор 5% — 2 мл', ampoule: 'Транексамовая кислота 5 мл, раствор для в/в введения 5%', expiry: 'до 06.20ХХ', ampouleVolume: '5 мл', dose: '2 мл' },
] as const;

const IV_CRITERIA = [
  { id: 'iv_01', title: 'Установил контакт с пациентом', detail: 'Поздоровайтесь, представьтесь и обозначьте свою роль.' },
  { id: 'iv_02', title: 'Идентифицировал пациента', detail: 'Попросите пациента назвать ФИО и возраст, сверьте сведения с медицинской документацией.' },
  { id: 'iv_03', title: 'Осведомился о самочувствии пациента', detail: 'Обратитесь к пациенту по имени и отчеству. Ответ пациента: «Нормально».' },
  { id: 'iv_04', title: 'Уточнил аллергологический анамнез', detail: 'Спросите об аллергических реакциях в анамнезе и на назначенное лекарственное средство. Ответ: «Нет».' },
  { id: 'iv_05', title: 'Убедился в наличии информированного добровольного согласия', detail: 'Проверьте наличие подписанного согласия в медицинской документации.' },
  { id: 'iv_06', title: 'Обработал руки гигиеническим способом', detail: 'Выполните гигиеническую обработку рук до начала манипуляции.' },
  { id: 'iv_07', title: 'Проверил медицинское оборудование и расходные материалы', detail: 'Проверьте наличие и пригодность оборудования, стерильность упаковок, сроки годности, размеры шприца и игл, целостность упаковок и комплектность.' },
  { id: 'iv_08', title: 'Проверил лекарственное средство', detail: 'Сверьте название, концентрацию, объём, срок годности, целостность ампулы и однородность раствора с назначением.' },
  { id: 'iv_09', title: 'Набрал лекарственное средство в шприц в нужной дозировке', detail: 'Подготовьте лоток и шприц, обработайте ампулу, вскройте её безопасным способом и наберите назначенный объём препарата.' },
  { id: 'iv_10', title: 'Произвёл смену иглы', detail: 'Снимите использованную для набора иглу и установите дополнительную стерильную иглу, не нарушая асептику.' },
  { id: 'iv_11', title: 'Наложил венозный жгут правильно', detail: 'Наложите жгут на среднюю треть плеча через ткань, салфетку или бинт; проверьте пульс на лучевой артерии.' },
  { id: 'iv_12', title: 'Дважды обработал место инъекции', detail: 'Обработайте поле от центра к периферии, затем непосредственно место пункции отдельным ватным шариком.' },
  { id: 'iv_13', title: 'Снял жгут после первого доказательства нахождения иглы в вене', detail: 'После появления крови в шприце ослабьте и снимите жгут.' },
  { id: 'iv_14', title: 'Получил доказательство нахождения иглы в вене после снятия жгута', detail: 'После снятия жгута выполните повторную тракцию поршня и убедитесь в появлении новой порции крови.' },
  { id: 'iv_15', title: 'Ввёл необходимый объём лекарственного средства', detail: 'Медленно введите назначенную дозу. Для транексамовой кислоты по этому заданию набирается 2 мл из ампулы объёмом 5 мл.' },
  { id: 'iv_16', title: 'Оценивал состояние пациента во время введения препарата', detail: 'Периодически интересуйтесь самочувствием пациента. Ответ: «Чувствую себя как обычно».' },
  { id: 'iv_17', title: 'Верно утилизировал шприц', detail: 'Безопасно отсоедините иглу с помощью предусмотренного устройства и утилизируйте острые отходы в непрокалываемый контейнер класса Б.' },
  { id: 'iv_18', title: 'Наложил давящую повязку', detail: 'Прижмите ватный шарик к месту инъекции, убедитесь в отсутствии кровотечения и наложите давящую повязку.' },
  { id: 'iv_19', title: 'Оценил состояние пациента после введения препарата', detail: 'Уточните самочувствие после процедуры. Ответ: «Всё хорошо, спасибо, доктор».' },
  { id: 'iv_20', title: 'Сдал лоток на дезинфекцию и последующую стерилизацию', detail: 'Передайте лоток на дезинфекцию и последующую стерилизацию.' },
  { id: 'iv_21', title: 'Сообщил о необходимости снятия давящей повязки', detail: 'Скажите пациенту, что повязку необходимо снять через 15–20 минут.' },
  { id: 'iv_22', title: 'Выбросил смотровые перчатки', detail: 'Снимите перчатки, не касаясь голыми руками их внешней поверхности, и утилизируйте в пакет класса Б.' },
  { id: 'iv_23', title: 'Обработал руки после манипуляции', detail: 'Выполните гигиеническую обработку рук.' },
  { id: 'iv_24', title: 'Сделал отметку о выполненной манипуляции', detail: 'Внесите отметку о выполнении назначения в медицинскую документацию.' },
] as const;

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

const SMP_SCRIPT = [{ dispatcher: 'Скорая помощь. Слушаю!' }];

type SmpOption = { id: string; text: string; correct: boolean };

const getTrainingSmpOptions = (scenario: ScenarioType): SmpOption[] => {
  // Конкретные учебные реплики. Адрес условный; для каждого сценария состояние и помощь свои.
  const patientInfo: Record<ScenarioType, { age: string; condition: string; help: string }> = {
    OKS1: { age: 'Мужчина, 45 лет.', condition: 'В сознании, сильная боль за грудиной.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    OKS2: { age: 'Мужчина, 50 лет.', condition: 'В сознании, выраженная одышка и цианоз.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    ANAPHYLAXIS: { age: 'Мужчина, 30 лет.', condition: 'После укуса пчелы резко ухудшилось состояние, выраженная слабость.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    ZHKK: { age: 'Мужчина, 55 лет.', condition: 'В тяжёлом состоянии, рвота содержимым типа кофейной гущи.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    BOS: { age: 'Мужчина, 25 лет.', condition: 'В сознании, выраженное затруднение дыхания.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    TELA: { age: 'Мужчина, 60 лет.', condition: 'Внезапная боль в грудной клетке, выраженная одышка.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    PNEUMOTHORAX: { age: 'Мужчина, 40 лет.', condition: 'После травмы грудной клетки возникли боль и одышка.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    HYPOGLYCEMIA: { age: 'Мужчина, 50 лет.', condition: 'Сознание спутанное, кожа влажная.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    HYPERGLYCEMIA: { age: 'Мужчина, 35 лет.', condition: 'Выраженная слабость и сухость во рту.', help: 'Начинаю оказывать экстренную медицинскую помощь.' },
    BLS: { age: 'Мужчина, 45 лет.', condition: 'Без сознания, нормального дыхания нет.', help: 'Начинаю сердечно-лёгочную реанимацию (СЛР).' },
    BLS1: { age: 'Мужчина, 45 лет.', condition: 'В сознании, подавился пищей, не может эффективно откашляться.', help: 'Начинаю помощь при тяжёлой обструкции дыхательных путей: 5 ударов между лопатками.' },
    BLS2: { age: 'Мужчина, 45 лет.', condition: 'В сознании, подавился пищей, не может эффективно откашляться.', help: 'Начинаю помощь при тяжёлой обструкции дыхательных путей: 5 ударов между лопатками.' },
    BLS3: { age: 'Мужчина, 45 лет.', condition: 'Без сознания, нормального дыхания нет.', help: 'Начинаю сердечно-лёгочную реанимацию (СЛР).' },
    BLS4: { age: 'Мужчина, 45 лет.', condition: 'Без сознания, нормального дыхания нет.', help: 'Начинаю сердечно-лёгочную реанимацию (СЛР).' }
  };
  const info = patientInfo[scenario];
  return [
    { id: 'victims', text: 'У нас один пострадавший.', correct: true },
    { id: 'address', text: 'Адрес: улица Ленина, дом 5.', correct: true },
    { id: 'sex', text: 'Пострадавший — мужчина.', correct: true },
    { id: 'age', text: info.age.replace(/^Мужчина,\\s*/i, '').replace(/^Женщина,\\s*/i, ''), correct: true },
    { id: 'condition', text: info.condition, correct: true },
    { id: 'help', text: info.help, correct: true },
    { id: 'wrongPulse', text: 'Пульса нет.', correct: false },
    { id: 'wrongAge', text: 'Он не разговаривает, возраст я не знаю.', correct: false },
    { id: 'wrongPlace', text: 'Мы где-то в институте, адрес и этаж не помню.', correct: false },
    { id: 'wrongVictims', text: 'Пострадавших трое.', correct: false },
    { id: 'wrongAddress', text: 'С ним что-то случилось. Что мне делать?', correct: false },
    { id: 'wrongHelp', text: 'Я Вас жду, не трогаю пострадавшего, чтобы не навредить.', correct: false }
  ];
};

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
  { id: 'chin_lift', text: 'Приподнял подбородок двумя пальцами' },
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
  { id: 'forehead_hand', text: 'Положил ладонь одной руки на лоб пострадавшего' },
  { id: 'chin_lift', text: 'Приподнял подбородок двумя пальцами' },
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

type Stage = 'menu' | 'station_select' | 'briefing' | 'intro' | 'playing' | 'finished' | 'iv_briefing' | 'iv_contact' | 'iv_prep' | 'iv_arm' | 'iv_playing' | 'iv_finished';
type RunMode = 'training' | 'exam';


type IVRoomHotspot = { id: string; label: string; x: number; y: number; w?: number; h?: number; done?: boolean };

function IVRoomScene({
  phase,
  hotspots = [],
  onHotspotClick,
  patientSpeech,
  overlay,
  imageSrc = "/iv-procedure-room.png",
  imageAlt = "Процедурный кабинет для станции «Внутривенная инъекция»",
}: {
  phase: string;
  hotspots?: IVRoomHotspot[];
  onHotspotClick?: (id: string) => void;
  patientSpeech?: string;
  overlay?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-lg">
      {phase && <div className="absolute left-4 top-4 z-20 rounded-lg border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Процедурный кабинет</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{phase}</p>
      </div>}
      <div className="relative w-full overflow-hidden bg-[#e9f1f1]">
        <img
          src={imageSrc}
          alt={imageAlt}
          draggable={false}
          className="block h-auto w-full object-contain"
        />
        {patientSpeech && (
          <div className="pointer-events-none absolute left-[38%] top-[5%] z-30 w-[min(42%,320px)] -translate-x-1/2 rounded-2xl border border-sky-200 bg-white/95 px-4 py-3 text-sm font-medium leading-relaxed text-slate-800 shadow-xl backdrop-blur-sm">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-sky-700">Пациент говорит</span>
            {patientSpeech}
            <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-sky-200 bg-white" />
          </div>
        )}
        {hotspots.length > 0 && (
          <div className="absolute inset-0">
            {hotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => onHotspotClick?.(spot.id)}
                aria-label={spot.label}
                className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${spot.w && spot.h ? '' : 'h-10 w-10'}`}
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, ...(spot.w && spot.h ? { width: `${spot.w}%`, height: `${spot.h}%` } : {}) }}
              >
                <span className={`h-5 w-5 rounded-full border-[3px] border-white shadow-lg transition group-hover:scale-125 group-hover:ring-4 group-hover:ring-sky-300/40 ${spot.done ? 'bg-emerald-500' : 'bg-sky-600'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
      {overlay && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 sm:p-4"><div className="pointer-events-auto mx-auto max-w-2xl">{overlay}</div></div>}
    </section>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [runMode, setRunMode] = useState<RunMode>('training');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [ivScenarioIndex, setIvScenarioIndex] = useState(0);
  const [ivAnswers, setIvAnswers] = useState<Record<string, boolean>>({});
  const [ivPatientChatOpen, setIvPatientChatOpen] = useState(false);
  const [ivPatientChatMessages, setIvPatientChatMessages] = useState<{ sender: 'patient' | 'student'; text: string }[]>([]);
  const [ivPatientChatInput, setIvPatientChatInput] = useState('');
  const [ivGreetingSent, setIvGreetingSent] = useState(false);
  const [ivIdentityResponseReceived, setIvIdentityResponseReceived] = useState(false);
  const [ivPatientBubble, setIvPatientBubble] = useState('');
  const [ivAkkredikHint, setIvAkkredikHint] = useState(false);
  const [ivCurrentCriterion, setIvCurrentCriterion] = useState(0);
  const [ivPrepEquipment, setIvPrepEquipment] = useState<string[]>([]);
  const [ivPrepAmpouleChecked, setIvPrepAmpouleChecked] = useState(false);
  const [ivPrepAmpouleOpened, setIvPrepAmpouleOpened] = useState(false);
  const [ivPrepSelectedVolume, setIvPrepSelectedVolume] = useState('');
  const [ivPrepSyringeFilled, setIvPrepSyringeFilled] = useState(false);
  const [ivPrepNeedleChanged, setIvPrepNeedleChanged] = useState(false);
  const [ivPrepFeedback, setIvPrepFeedback] = useState('');
  const [ivPrepActiveObject, setIvPrepActiveObject] = useState<string | null>(null);
  const [ivPrescriptionOpen, setIvPrescriptionOpen] = useState(false);
  const [ivArmTourniquetPosition, setIvArmTourniquetPosition] = useState('');
  const [ivArmPulseChecked, setIvArmPulseChecked] = useState(false);
  const [ivArmFirstSkinPrep, setIvArmFirstSkinPrep] = useState(false);
  const [ivArmSecondSkinPrep, setIvArmSecondSkinPrep] = useState(false);
  const [ivArmPunctureSiteSelected, setIvArmPunctureSiteSelected] = useState(false);
  const [ivArmFirstBloodReturn, setIvArmFirstBloodReturn] = useState(false);
  const [ivArmTourniquetReleased, setIvArmTourniquetReleased] = useState(false);
  const [ivArmSecondBloodReturn, setIvArmSecondBloodReturn] = useState(false);
  const [ivArmFeedback, setIvArmFeedback] = useState('');
  const [ivActionFlags, setIvActionFlags] = useState<Record<string, boolean>>({});
  const [ivInjectedVolume, setIvInjectedVolume] = useState(0);
  const [ivSyringeNeedleDetached, setIvSyringeNeedleDetached] = useState(false);
  const [ivCottonPressed, setIvCottonPressed] = useState(false);
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
  const [foreheadHandPosition, setForeheadHandPosition] = useState({ x: 39, y: 58 });
  const [foreheadHandDragging, setForeheadHandDragging] = useState(false);
  const [foreheadHandPlaced, setForeheadHandPlaced] = useState(false);
  const [chinHandPosition, setChinHandPosition] = useState({ x: 61, y: 66 });
  const [chinHandDragging, setChinHandDragging] = useState(false);
  const [chinHandPlaced, setChinHandPlaced] = useState(false);
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
  const [selectedSmpOptions, setSelectedSmpOptions] = useState<string[]>([]);
  const [smpFeedback, setSmpFeedback] = useState('');
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
    if (stage !== 'iv_prep') return;
    const ready = ['tray','syringe','needles','swabs','gloves','waste'].every(id => ivPrepEquipment.includes(id)) &&
      ivPrepAmpouleChecked && ivPrepAmpouleOpened && ivPrepSyringeFilled && ivPrepNeedleChanged;
    if (!ready) return;
    setIvAnswers(prev => ({ ...prev, iv_07: true, iv_08: true, iv_09: true, iv_10: true }));
    setIvArmTourniquetPosition('');
    setIvArmPulseChecked(false);
    setIvArmFirstSkinPrep(false);
    setIvArmSecondSkinPrep(false);
    setIvArmPunctureSiteSelected(false);
    setIvArmFirstBloodReturn(false);
    setIvArmTourniquetReleased(false);
    setIvArmSecondBloodReturn(false);
    setIvArmFeedback('');
    setStage('iv_arm');
  }, [stage, ivPrepEquipment, ivPrepAmpouleChecked, ivPrepAmpouleOpened, ivPrepSyringeFilled, ivPrepNeedleChanged]);

  useEffect(() => {
    if (stage !== 'iv_playing' && stage !== 'iv_prep' && stage !== 'iv_arm') return;
    if (timeLeft <= 0) { setStage('iv_finished'); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, stage]);

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
    if (station.id === 'iv_injection') {
      setIvScenarioIndex(Math.floor(Math.random() * IV_SCENARIOS.length));
      setIvAnswers({});
      setIvCurrentCriterion(0);
      setIvPatientChatOpen(false);
      setIvPatientChatMessages([]);
      setIvPatientChatInput('');
      setIvGreetingSent(false);
      setIvIdentityResponseReceived(false);
      setIvPatientBubble('');
      setIvPrepEquipment([]);
      setIvPrepAmpouleChecked(false);
      setIvPrepAmpouleOpened(false);
      setIvPrepSelectedVolume('');
      setIvPrepSyringeFilled(false);
      setIvPrepNeedleChanged(false);
      setIvPrepFeedback('');
      setTimeLeft(600);
      setStage('iv_briefing');
      return;
    }
    
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
      setForeheadHandPosition({ x: 39, y: 58 });
      setForeheadHandPlaced(false);
      setChinHandPosition({ x: 61, y: 66 });
      setChinHandDragging(false);
      setChinHandPlaced(false);
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
      setSelectedSmpOptions([]);
      setSmpFeedback('');
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

  const handleTrainingSmpSubmit = () => {
    if (callSuccess) return;
    const options = getTrainingSmpOptions(scenario);
    const selected = options.filter(option => selectedSmpOptions.includes(option.id));
    const wrong = selected.filter(option => !option.correct);
    const missing = options.filter(option => option.correct && !selectedSmpOptions.includes(option.id));

    setChatHistory(prev => [
      ...prev,
      { sender: 'doctor', text: selected.map(option => option.text).join(' ') || 'Передаю сведения о пострадавшем.' }
    ]);

    if (wrong.length > 0 || missing.length > 0) {
      const prompts: Record<string, string> = {
        address: 'Назовите адрес или место происшествия.',
        victims: 'Сколько пострадавших?',
        ageSex: 'Уточните пол и возраст или возрастную категорию пострадавшего.',
        condition: 'В каком состоянии находится пострадавший?',
        help: 'Какую помощь Вы оказываете или готовы начать?'
      };
      const prompt = missing.length > 0
        ? prompts[missing[0].id]
        : 'Проверьте передаваемые сведения и выберите подходящие варианты.';
      setChatHistory(prev => [...prev, { sender: 'dispatcher', text: prompt }]);
      setSmpFeedback(wrong.length > 0
        ? 'Есть неверный вариант. Снимите отметку с него и выберите правильные сведения.'
        : 'Не все необходимые сведения переданы. Дополните выбор.');
      playAudio(prompt);
      return;
    }

    const confirmation = 'Вызов принят!';
    setChatHistory(prev => [...prev, { sender: 'dispatcher', text: confirmation }]);
    setSmpFeedback('Верно! Все необходимые сведения переданы.');
    setCallSuccess(true);
    playAudio(confirmation);
    setTimeout(() => {
      setPhoneModal(false);
      toggleAction('call');
    }, 2500);
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
                  {st.type === 'group' && <p className="text-sm text-gray-400 mt-1">Обязательная станция · случайный выбор одного из 9 клинических сценариев</p>}
                  {st.required && st.type !== 'group' && st.id !== 'iv_injection' && <p className="text-sm text-gray-400 mt-1">Обязательная станция</p>}
                  {!st.required && st.choices && <div className="text-sm text-gray-400 mt-2 space-y-1"><p>Случайно выбирается один вариант:</p>{st.choices.map((choice: string) => <p key={choice}>• {choice}</p>)}</div>}
                  {st.id === 'iv_injection' && <p className="text-sm text-gray-400 mt-1">Обязательная станция · 3 варианта лекарственного назначения</p>}
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

  if (stage === 'iv_briefing') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-blue-400/40 bg-gray-900 p-6 md:p-8 shadow-2xl">
          <button onClick={() => setStage('station_select')} className="mb-5 text-blue-300 hover:text-blue-100">← К выбору станций</button>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Первичная аккредитация · Лечебное дело · Станция 3</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Внутривенная инъекция</h1>
          <div className="mt-5 rounded-xl border border-blue-400/30 bg-slate-800 p-5">
            <p className="font-bold text-blue-200">Вводная информация</p>
            <p className="mt-2 leading-relaxed text-gray-100">В процедурном кабинете Вас ожидает пациент, которому необходимо провести внутривенную инъекцию лекарственного препарата, указанного в листе назначения. Озвучивайте все действия, которые считаете необходимыми.</p>
            <p className="mt-3 leading-relaxed text-gray-100">Перед выполнением манипуляции ознакомьтесь с листом назначения и медицинской документацией. Самостоятельно определите назначенный препарат и необходимую дозу.</p>
          </div>
          <div className="mt-5">
            <p className="mb-2 font-semibold text-gray-200">Режим прохождения</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setRunMode('training')} className={`rounded-xl border-2 px-4 py-3 font-bold ${runMode === 'training' ? 'border-blue-400 bg-blue-900/60 text-blue-100' : 'border-gray-600 bg-gray-800 text-gray-300'}`}>Обучение</button>
              <button onClick={() => setRunMode('exam')} className={`rounded-xl border-2 px-4 py-3 font-bold ${runMode === 'exam' ? 'border-amber-400 bg-amber-900/40 text-amber-100' : 'border-gray-600 bg-gray-800 text-gray-300'}`}>Экзамен</button>
            </div>
          </div>
          <button onClick={() => { setIvAnswers({}); setIvCurrentCriterion(0); setIvPrepEquipment([]); setIvPrepAmpouleChecked(false); setIvPrepAmpouleOpened(false); setIvPrepSelectedVolume(''); setIvPrepSyringeFilled(false); setIvPrepNeedleChanged(false); setIvPrepFeedback(''); setIvArmTourniquetPosition(''); setIvArmPulseChecked(false); setIvArmFirstSkinPrep(false); setIvArmSecondSkinPrep(false); setIvArmPunctureSiteSelected(false); setIvArmFirstBloodReturn(false); setIvArmTourniquetReleased(false); setIvArmSecondBloodReturn(false); setIvArmFeedback(''); setIvActionFlags({}); setIvSyringeNeedleDetached(false); setIvCottonPressed(false); setIvInjectedVolume(0); setIvPrepFeedback(''); setTimeLeft(600); setStage('iv_contact'); }} className="mt-7 w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-4 font-bold text-white shadow-lg">Приступить к станции</button>
        </div>
      </div>
    );
  }

  if (stage === 'iv_contact') {
    const ivScenario = IV_SCENARIOS[ivScenarioIndex];
    const contactSteps = [
      { title: 'Установить контакт с пациентом', detail: 'Нажмите на пациента. Откроется чат, в котором нужно поздороваться, представиться и обозначить свою роль.', object: 'patient' },
      { title: 'Идентифицировать пациента', detail: 'Повторно нажмите на пациента, попросите назвать ФИО и возраст и сверьте ответ с данными задания.', object: 'patient' },
      { title: 'Уточнить самочувствие', detail: 'Обратитесь к пациенту по имени и отчеству и спросите о самочувствии.', object: 'patient' },
      { title: 'Уточнить аллергологический анамнез', detail: 'Спросите пациента об аллергии в анамнезе и на назначенное лекарство.', object: 'patient' },
      { title: 'Проверить информированное согласие', detail: 'Нажмите на планшет и проверьте наличие подписанного согласия в документации.', object: 'documents' },
      { title: 'Выполнить гигиеническую обработку рук', detail: 'Нажмите на дозатор у раковины и выполните гигиеническую обработку рук.', object: 'sink' },
    ];
    const step = contactSteps[Math.min(ivCurrentCriterion, 5)];
    const contactHotspots: IVRoomHotspot[] = [
      { id: 'patient', label: 'Пациент', x: 28, y: 48, w: 24, h: 78 },
      { id: 'documents', label: 'Лист документов', x: 10, y: 80, w: 18, h: 23 },
      { id: 'sink', label: 'Раковина и дозатор', x: 59, y: 36, w: 20, h: 24 },
    ];
    const handleContactClick = (id: string) => {
      if (ivCurrentCriterion >= 0 && ivCurrentCriterion <= 3 && id === 'patient') {
        if (ivCurrentCriterion === 0) {
          setIvPatientChatMessages([]);
          setIvPatientChatInput('');
          setIvGreetingSent(false);
          setIvIdentityResponseReceived(false);
        }
        setIvPatientChatOpen(true);
        return;
      }
      if (ivCurrentCriterion === 1 && id === 'documents') {
        setIvPatientBubble('');
        if (!ivIdentityResponseReceived) {
          setIvPrepFeedback('Сначала попросите пациента назвать ФИО и возраст. Затем откройте лист назначения для сверки.');
          return;
        }
        setIvPrescriptionOpen(true);
        setIvPrepFeedback('Откройте лист назначения и сверьте ФИО и возраст пациента с ответом.');
        return;
      }
      if (id !== step.object) {
        setIvPrepFeedback('Сейчас выполните действие с нужным объектом: ' + (step.object === 'patient' ? 'пациентом' : step.object === 'documents' ? 'планшетом с документами' : 'дозатором у раковины') + '.');
        return;
      }
      const criterionId = IV_CRITERIA[ivCurrentCriterion].id;
      setIvAnswers(prev => ({ ...prev, [criterionId]: true }));
      setIvActionFlags(prev => ({ ...prev, [criterionId]: true }));
      const response = ivCurrentCriterion === 0 ? 'Вы поздоровались, представились и обозначили свою роль.' :
        ivCurrentCriterion === 1 ? 'Пациент: «Николаенко Николай Николаевич, 30 лет». Данные сверены.' :
        ivCurrentCriterion === 2 ? 'Пациент: «Нормально».' :
        ivCurrentCriterion === 3 ? 'Пациент: «Аллергических реакций не было».' :
        ivCurrentCriterion === 4 ? 'В документации найдено подписанное информированное добровольное согласие.' :
        'Гигиеническая обработка рук выполнена.';
      setIvPrepFeedback(response);
      if (ivCurrentCriterion === 5) {
        setIvCurrentCriterion(0);
        setStage('iv_prep');
      } else {
        setIvCurrentCriterion(prev => prev + 1);
      }
    };
    const handlePatientOption = (message: string) => {
      const normalized = message.toLowerCase();
      setIvPatientChatMessages(prev => [...prev, {sender:'student',text:message}]);
      const reply = (text:string, audio?:string) => {
        setIvPatientChatMessages(prev => [...prev, {sender:'patient',text}]);
        setIvPatientBubble(text);
        if (audio) playAudio(audio);
      };
      const valid = ivCurrentCriterion === 0
        ? (!ivGreetingSent ? message === 'Здравствуйте.' : ['Меня зовут Анна, я медицинская сестра.', 'Я фельдшер, меня зовут Анна.', 'Я врач, меня зовут Анна.'].includes(message))
        : ivCurrentCriterion === 1
          ? ['Представьтесь, пожалуйста, и назовите Ваш возраст.', 'Назовите, пожалуйста, Ваши ФИО и дату рождения.', 'Как Вас зовут и сколько Вам лет?'].includes(message)
          : ivCurrentCriterion === 2
            ? ['Николай Николаевич, как Вы себя чувствуете?', 'Есть ли сейчас жалобы на самочувствие?'].includes(message)
            : ['Есть ли у Вас аллергия на лекарства?', 'Были ли у Вас аллергические реакции на препараты?'].includes(message);
      if (!valid) {
        setIvPrepFeedback('Этот вопрос или реплика не подходит для текущего этапа. Попробуйте выбрать другой вариант.');
        return;
      }
      if (ivCurrentCriterion === 0) {
        if (!ivGreetingSent) {
          setIvGreetingSent(true);
          reply('Здравствуйте!');
          setIvPrepFeedback('Хорошее начало. Теперь представьтесь и обозначьте свою роль.');
          return;
        }
        reply('Очень приятно. Я готов ответить на Ваши вопросы.');
        setIvAnswers(prev => ({...prev,iv_01:true}));
        setIvActionFlags(prev => ({...prev,iv_01:true}));
        setIvPrepFeedback('Контакт установлен.');
        setIvCurrentCriterion(1);
        return;
      }
      if (ivCurrentCriterion === 1) {
        const answer='Николаенко Николай Николаевич, 30 лет.';
        reply(answer,'Николаенко Николай Николаевич, тридцать лет.');
        setIvIdentityResponseReceived(true);
        setIvPrepFeedback('Пациент назвал ФИО и возраст. Теперь сверьте их с медицинской документацией.');
        return;
      }
      if (ivCurrentCriterion === 2) {
        reply('Чувствую себя нормально. Спасибо.');
        setIvAnswers(prev => ({...prev,iv_03:true}));
        setIvActionFlags(prev => ({...prev,iv_03:true}));
        setIvPrepFeedback('Самочувствие пациента уточнено.');
        setIvCurrentCriterion(3);
        return;
      }
      if (ivCurrentCriterion === 3) {
        reply('Нет, аллергических реакций не было.');
        setIvAnswers(prev => ({...prev,iv_04:true}));
        setIvActionFlags(prev => ({...prev,iv_04:true}));
        setIvPrepFeedback('Аллергологический анамнез уточнён.');
        setIvPatientChatOpen(false);
        setIvCurrentCriterion(4);
      }
    };
    const patientOptions = ivCurrentCriterion === 0
      ? (!ivGreetingSent
        ? ['Здравствуйте.', 'Вы по записи?', 'У нас проветривание.', 'Садитесь в кресло.']
        : ['Меня зовут Анна, я медицинская сестра.', 'Я фельдшер, меня зовут Анна.', 'Я врач, меня зовут Анна.', 'Вы по записи?', 'Садитесь в кресло.'])
      : ivCurrentCriterion === 1
        ? ['Представьтесь, пожалуйста, и назовите Ваш возраст.', 'Назовите, пожалуйста, Ваши ФИО и дату рождения.', 'Как Вас зовут и сколько Вам лет?', 'Как Вы себя чувствуете?', 'Вы по записи?']
        : ivCurrentCriterion === 2
          ? ['Николай Николаевич, как Вы себя чувствуете?', 'Есть ли сейчас жалобы на самочувствие?', 'Назовите Ваши ФИО и возраст.', 'Есть ли у Вас аллергия на лекарства?']
          : ['Есть ли у Вас аллергия на лекарства?', 'Были ли у Вас аллергические реакции на препараты?', 'Как Вы себя чувствуете?', 'Назовите Ваши ФИО и возраст.', 'Хорошо ли Вы переносите лекарственные препараты?'];
    const ivHintText = ivCurrentCriterion === 0 ? 'Поздоровайтесь, представьтесь и обозначьте свою роль.' : ivCurrentCriterion === 1 ? 'Попросите пациента назвать ФИО и возраст. Затем сверьте сведения с листом назначений или медицинской документацией.' : ivCurrentCriterion === 2 ? 'Обратитесь к пациенту по имени и отчеству и уточните его самочувствие.' : ivCurrentCriterion === 3 ? 'Уточните, были ли аллергические реакции в прошлом и есть ли аллергия на назначенный препарат.' : 'Проверьте наличие добровольного информированного согласия в документах.';
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-7 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3 border-b border-gray-700 pb-4">
            <div><p className="text-sm font-semibold text-blue-300">СТАНЦИЯ 3 · НАЧАЛО МАНИПУЛЯЦИИ</p><h1 className="text-2xl md:text-3xl font-bold text-white">Пациент и подготовка к процедуре</h1></div>
            <div className="rounded-xl border border-gray-600 bg-gray-800 px-4 py-2 text-center"><p className="text-xs text-gray-400">Осталось времени</p><p className="text-2xl font-bold tabular-nums text-blue-300">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p></div>
          </div>
          <IVRoomScene phase="" imageSrc="/iv-patient-entry.png" imageAlt="Пациент только что вошёл в процедурный кабинет" hotspots={contactHotspots} onHotspotClick={handleContactClick} patientSpeech={ivPatientBubble} overlay={<div className="rounded-xl border border-sky-200 bg-white/95 p-3 shadow-xl backdrop-blur"><p className="text-sm font-bold text-sky-900">{runMode === 'training' ? step.title : 'Выполните следующий этап общения с пациентом'}</p>{runMode === 'training' && <p className="mt-1 text-xs text-slate-600">{step.detail}</p>}{ivPrepFeedback && <p className="mt-2 text-xs font-medium text-emerald-800">{ivPrepFeedback}</p>}</div>} />
          {runMode === 'training' && (
            <div className="fixed bottom-8 left-4 z-40 flex w-[min(92vw,360px)] items-end gap-3">
              <img src="/helper.png" alt="Аккредик" className="h-24 w-24 shrink-0 object-contain drop-shadow-xl" />
              <div className="mb-1 flex min-w-0 flex-col items-start gap-2">
                <button type="button" onClick={() => setIvAkkredikHint(v => !v)} className="rounded-xl border border-blue-400/50 bg-gray-800 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-gray-700">{ivAkkredikHint ? 'Скрыть подсказку' : 'Подсказка'}</button>
                {ivAkkredikHint && <div className="max-w-[240px] rounded-xl border border-blue-400/40 bg-gray-800 p-3 text-sm leading-relaxed text-gray-100 shadow-xl">{ivHintText}</div>}
              </div>
            </div>
          )}
          {ivPrescriptionOpen && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Лист назначения для идентификации пациента">
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-sky-200 bg-white text-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Медицинская документация</p>
                    <h2 className="mt-1 text-xl font-bold">Лист назначения</h2>
                  </div>
                  <button type="button" onClick={() => setIvPrescriptionOpen(false)} aria-label="Закрыть лист назначения" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-white">✕</button>
                </div>
                <div className="p-5 md:p-7">
                  <div className="border border-slate-300 p-5 shadow-inner">
                    <p className="text-center text-xs font-semibold uppercase tracking-wide">Медицинская документация</p>
                    <h3 className="mt-1 border-b-2 border-slate-800 pb-3 text-center text-lg font-bold">Лист врачебных назначений</h3>
                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <p><span className="text-slate-500">Пациент:</span><br/><strong>Николаенко Николай Николаевич</strong></p>
                      <p><span className="text-slate-500">Возраст:</span><br/><strong>30 лет</strong></p>
                    </div>
                    <div className="mt-5 rounded-lg border-2 border-slate-400 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Назначение</p>
                      <p className="mt-2 text-lg font-bold">{ivScenario.title}</p>
                      <p className="mt-1 font-semibold">{ivScenario.prescription}</p>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">Сверьте ФИО и возраст в листе назначения с данными, которые сообщил пациент.</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3 border-t border-sky-100 bg-slate-50 px-5 py-4">
                  <button type="button" onClick={() => setIvPrescriptionOpen(false)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Закрыть</button>
                  <button type="button" onClick={() => {
                    setIvPrescriptionOpen(false);
                    setIvAnswers(prev => ({ ...prev, iv_02: true }));
                    setIvActionFlags(prev => ({ ...prev, iv_02: true }));
                    setIvPrepFeedback('ФИО и возраст пациента сверены с листом назначения. Критерий № 2 выполнен.');
                    setIvCurrentCriterion(2);
                  }} className="rounded-xl bg-sky-700 px-5 py-3 font-bold text-white hover:bg-sky-800">Данные совпадают — подтвердить</button>
                </div>
              </div>
            </div>
          )}
          {ivPatientChatOpen && (
            <div className="mx-auto mt-4 max-w-3xl overflow-hidden rounded-2xl border border-gray-600 bg-gray-800 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-600 bg-gray-700 px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Разговор с пациентом</p>
                  <p className="text-sm font-semibold text-white">Обратитесь к Николаю Николаевичу</p>
                </div>
                <button type="button" onClick={() => setIvPatientChatOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white">Свернуть</button>
              </div>
              <div className="max-h-56 space-y-3 overflow-y-auto bg-gray-900 p-4">
                {ivPatientChatMessages.length === 0 && <p className="text-sm text-slate-500">Пациент ожидает, когда Вы к нему обратитесь.</p>}
                {ivPatientChatMessages.map((message,index) => (
                  <div key={index} className={message.sender === 'student' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={message.sender === 'student' ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-sky-700 px-4 py-3 text-sm text-white' : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-sky-100 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm'}>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide opacity-70">{message.sender === 'student' ? 'Вы' : 'Пациент'}</span>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-600 bg-gray-800 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-300">Выберите реплику</p>
                <div className="flex flex-wrap gap-2">
                  {patientOptions.map((option,index) => (
                    <button key={index} type="button" onClick={() => handlePatientOption(option)}
                      className="rounded-xl border border-blue-400/50 bg-gray-700 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:border-blue-300 hover:bg-gray-600">
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  if (stage === 'iv_prep') {
    const ivScenario = IV_SCENARIOS[ivScenarioIndex];
    const requiredEquipment = [
      { id: 'tray', label: 'Лоток' },
      { id: 'syringe', label: 'Шприц подходящего объёма' },
      { id: 'needles', label: 'Стерильные иглы' },
      { id: 'swabs', label: 'Ватные шарики и антисептик' },
      { id: 'gloves', label: 'Смотровые перчатки' },
      { id: 'waste', label: 'Контейнер для острых отходов' },
    ];
    const equipmentReady = requiredEquipment.every(item => ivPrepEquipment.includes(item.id));
    const correctAmpoule = ivScenario.id === 'ascorbic' ? 'ascorbic' : ivScenario.id === 'furosemide' ? 'furosemide' : 'tranexamic';
    const correctVolume = ivScenario.dose;
    const prepComplete = equipmentReady && ivPrepAmpouleChecked && ivPrepAmpouleOpened && ivPrepSyringeFilled && ivPrepNeedleChanged;
    const prepHotspots: IVRoomHotspot[] = [
      // Координаты привязаны к реальным предметам на изображении кабинета.
      { id: 'patient', label: 'Пациент', x: 43, y: 40, w: 25, h: 48 },
      { id: 'documents', label: 'Лист назначения', x: 9, y: 79, w: 19, h: 23 },
      { id: 'sink', label: 'Раковина и антисептик', x: 57, y: 34, w: 25, h: 23 },
      { id: 'tray', label: 'Лоток', x: 75, y: 80, done: ivPrepEquipment.includes('tray') },
      { id: 'syringe', label: 'Шприц', x: 49, y: 77, done: ivPrepEquipment.includes('syringe') },
      { id: 'needles', label: 'Стерильные иглы', x: 59, y: 77, done: ivPrepEquipment.includes('needles') },
      { id: 'swabs', label: 'Ватные шарики и антисептик', x: 66, y: 71, done: ivPrepEquipment.includes('swabs') },
      { id: 'gloves', label: 'Перчатки', x: 80, y: 86, done: ivPrepEquipment.includes('gloves') },
      { id: 'waste', label: 'Контейнер для острых отходов', x: 92, y: 81, done: ivPrepEquipment.includes('waste') },
      { id: 'ampoule', label: 'Ампула', x: 61, y: 73, done: ivPrepAmpouleChecked },
    ];
    const handlePrepRoomClick = (id: string) => {
      if (id === 'patient') {
        setIvPrepActiveObject('patient');
        setIvPrepFeedback('Пациент: Николаенко Николай Николаевич, 30 лет.');
        return;
      }
      if (id === 'documents') {
        setIvPrepActiveObject('documents');
        setIvPrescriptionOpen(true);
        return;
      }
      if (id === 'sink') {
        setIvPrepActiveObject('sink');
        setIvPrepFeedback('Зона гигиены рук. Обработка рук уже выполнена на предыдущем этапе.');
        return;
      }
      if (id === 'gloves' || id === 'waste') {
        setIvPrepActiveObject(id);
        setIvPrepEquipment(prev => prev.includes(id) ? prev : [...prev, id]);
        setIvPrepFeedback(id === 'gloves'
          ? 'Смотровые перчатки проверены и подготовлены к использованию.'
          : 'Контейнер для острых отходов проверен и установлен для безопасной утилизации.');
        return;
      }
      if (['tray', 'syringe', 'needles', 'swabs'].includes(id)) {
        setIvPrepActiveObject(id);
        const item = requiredEquipment.find(entry => entry.id === id);
        if (id === 'syringe') {
          setIvPrepEquipment(prev => prev.includes('syringe') ? prev : [...prev, 'syringe']);
          setIvPrepFeedback(ivPrepAmpouleOpened ? 'Шприц выбран. Выберите назначенный объём, затем выполните набор препарата.' : 'Шприц выбран и проверен. Сначала проверьте маркировку и вскройте ампулу.');
        } else if (id === 'needles') {
          setIvPrepEquipment(prev => prev.includes('needles') ? prev : [...prev, 'needles']);
          if (ivPrepSyringeFilled) {
            setIvPrepNeedleChanged(true);
            setIvPrepFeedback('Смена иглы выполнена: использованная для набора игла заменена на стерильную иглу для введения.');
          } else {
            setIvPrepFeedback('Стерильные иглы проверены. После набора препарата нажмите здесь ещё раз, чтобы выполнить смену иглы.');
          }
        } else {
          setIvPrepEquipment(prev => prev.includes(id) ? prev : [...prev, id]);
          setIvPrepFeedback(item ? `Проверено: ${item.label}. Предмет подготовлен к работе.` : '');
        }
        return;
      }
      if (id === 'ampoule') {
        setIvPrepActiveObject('ampoule');
        if (!ivPrepAmpouleChecked) {
          setIvPrepAmpouleChecked(true);
          setIvPrepFeedback(`Маркировка сверена: ${ivScenario.ampoule}. Назначено набрать ${ivScenario.dose}.`);
        } else if (!ivPrepAmpouleOpened) {
          setIvPrepAmpouleOpened(true);
          setIvPrepFeedback('Ампула вскрыта в симуляции. Теперь выберите шприц и наберите назначенный объём.');
        } else {
          setIvPrepFeedback('Ампула уже вскрыта. Продолжите работу со шприцем.');
        }
      }
    };
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-7">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
            <div><p className="text-sm font-semibold text-sky-700">СТАНЦИЯ 3 · ИНТЕРАКТИВНЫЙ ЭТАП 1</p><h1 className="text-2xl md:text-3xl font-bold">Подготовка препарата</h1></div>
            <div className="rounded-xl bg-white border border-sky-200 px-5 py-3 text-center shadow-sm"><p className="text-xs text-slate-500">Осталось времени</p><p className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600' : 'text-sky-800'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p></div>
          </div>
          <IVRoomScene phase="Подготовка препарата" hotspots={prepHotspots} onHotspotClick={handlePrepRoomClick} overlay={<div className="space-y-2">{ivPrepFeedback && <div className="rounded-xl border border-sky-200 bg-white/95 p-3 text-xs font-medium text-slate-800 shadow-lg backdrop-blur">{ivPrepFeedback}</div>}{ivPrepActiveObject === 'syringe' && ivPrepAmpouleOpened && <div className="rounded-xl border border-sky-200 bg-white/95 p-3 shadow-xl backdrop-blur"><p className="text-sm font-bold text-slate-900">Выберите объём шприца по назначению</p><div className="mt-2 flex flex-wrap gap-2">{['1 мл','2 мл','5 мл'].map(volume => <button key={volume} type="button" onClick={() => { setIvPrepSelectedVolume(volume); setIvPrepSyringeFilled(false); setIvPrepFeedback('Выбран объём '+volume+'. Подтвердите набор назначенной дозы.'); }} className={`rounded-lg border px-4 py-2 text-sm font-bold ${ivPrepSelectedVolume===volume?'border-sky-600 bg-sky-100 text-sky-900':'border-slate-200 bg-white text-slate-700'}`}>{volume}</button>)}</div><button type="button" disabled={!ivPrepSelectedVolume} onClick={() => { if(ivPrepSelectedVolume===correctVolume){setIvPrepSyringeFilled(true);setIvPrepFeedback('В шприц набран назначенный объём: '+correctVolume+'.');}else{setIvPrepSyringeFilled(false);setIvPrepFeedback('Объём не соответствует назначению. Сверьте лист назначения.');}}} className="mt-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Набрать препарат</button></div>}<div className="rounded-xl border border-white/80 bg-slate-900/75 px-3 py-2 text-xs text-white shadow-lg">Проверено: {ivPrepEquipment.length} из 6 · ампула {ivPrepAmpouleOpened?'вскрыта':'не вскрыта'} · шприц {ivPrepSyringeFilled?'наполнен':'не наполнен'} · игла {ivPrepNeedleChanged?'заменена':'не заменена'}</div></div>} />
          {ivPrescriptionOpen && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Лист назначения">
              <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Медицинская документация</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">Лист назначения</h2>
                  </div>
                  <button type="button" onClick={() => setIvPrescriptionOpen(false)} aria-label="Закрыть лист назначения" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-white hover:text-slate-900">✕</button>
                </div>
                <div className="p-5 md:p-8">
                  <div className="border border-slate-300 bg-white p-5 md:p-7 text-slate-900 shadow-inner">
                    <div className="border-b-2 border-slate-800 pb-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide">Медицинская документация</p>
                      <h3 className="mt-1 text-lg font-bold">Лист врачебных назначений</h3>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <p><span className="text-slate-500">Пациент:</span><br/><strong>Николаенко Николай Николаевич</strong></p>
                      <p><span className="text-slate-500">Возраст:</span><br/><strong>30 лет</strong></p>
                      <p><span className="text-slate-500">Медицинская карта:</span><br/><strong>№ {ivScenario.id === 'ascorbic' ? '110' : ivScenario.id === 'furosemide' ? '111' : '112'}</strong></p>
                      <p><span className="text-slate-500">Путь введения:</span><br/><strong>Внутривенно</strong></p>
                    </div>
                    <div className="mt-6 rounded-lg border-2 border-slate-400 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Назначено</p>
                      <p className="mt-2 text-xl font-bold">{ivScenario.title}</p>
                      <p className="mt-1 text-lg font-semibold">{ivScenario.prescription}</p>
                      <p className="mt-3 text-sm">Ввести внутривенно: <strong>{ivScenario.dose}</strong></p>
                    </div>
                    <p className="mt-5 text-xs text-slate-500">Перед выполнением процедуры сверьте назначение с маркировкой ампулы.</p>
                  </div>
                </div>
                <div className="flex justify-end border-t border-sky-100 bg-slate-50 px-5 py-4">
                  <button type="button" onClick={() => setIvPrescriptionOpen(false)} className="rounded-xl bg-sky-700 px-6 py-3 font-bold text-white hover:bg-sky-800">Закрыть документ</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }


  if (stage === 'iv_arm') {
    const tourniquetCorrect = ivArmTourniquetPosition === 'middle';
    const armHotspots: IVRoomHotspot[] = [
      { id: 'upper', label: 'Верхняя треть плеча', x: 48, y: 48, w: 12, h: 10, done: ivArmTourniquetPosition === 'upper' },
      { id: 'middle', label: 'Средняя треть плеча · жгут', x: 48, y: 57, w: 12, h: 10, done: tourniquetCorrect },
      { id: 'lower', label: 'Нижняя треть плеча', x: 48, y: 66, w: 12, h: 9, done: ivArmTourniquetPosition === 'lower' },
      ...(tourniquetCorrect ? [{ id: 'pulse', label: 'Проверить пульс', x: 59, y: 71, w: 9, h: 9, done: ivArmPulseChecked }] : []),
      ...(ivArmPulseChecked ? [{ id: 'skin', label: ivArmSecondSkinPrep ? 'Кожа обработана ×2' : ivArmFirstSkinPrep ? 'Повторить обработку' : 'Обработать кожу', x: 52, y: 61, w: 12, h: 9, done: ivArmSecondSkinPrep }] : []),
      ...(ivArmSecondSkinPrep ? [{ id: 'puncture', label: ivArmSecondBloodReturn ? 'Положение иглы подтверждено' : ivArmFirstBloodReturn ? 'Повторно проверить вену' : ivArmPunctureSiteSelected ? 'Подтвердить появление крови' : 'Выбрать место пункции', x: 53, y: 58, w: 10, h: 8, done: ivArmSecondBloodReturn }] : []),
      ...(ivArmFirstBloodReturn && !ivArmTourniquetReleased ? [{ id: 'release', label: 'Снять жгут', x: 47, y: 49, w: 9, h: 8 }] : []),
    ];
    const handleArmRoomClick = (id: string) => {
      if (['upper','middle','lower'].includes(id)) {
        setIvArmTourniquetPosition(id);
        setIvArmFeedback(id === 'middle' ? 'Жгут наложен на среднюю треть плеча.' : 'Неверное положение. По критерию требуется средняя треть плеча. Выберите правильную зону.');
        return;
      }
      if (id === 'pulse' && tourniquetCorrect) {
        setIvArmPulseChecked(true);
        setIvArmFeedback('Пульс на лучевой артерии проверен.');
        return;
      }
      if (id === 'skin' && ivArmPulseChecked) {
        if (!ivArmFirstSkinPrep) { setIvArmFirstSkinPrep(true); setIvArmFeedback('Первая обработка места инъекции выполнена. Повторите обработку.'); }
        else if (!ivArmSecondSkinPrep) { setIvArmSecondSkinPrep(true); setIvArmFeedback('Вторая обработка выполнена. Теперь выберите место пункции.'); }
        return;
      }
      if (id === 'puncture' && ivArmSecondSkinPrep) {
        if (!ivArmPunctureSiteSelected) { setIvArmPunctureSiteSelected(true); setIvArmFeedback('Место пункции выбрано. Выполните пункцию.'); }
        else if (!ivArmFirstBloodReturn) { setIvArmFirstBloodReturn(true); setIvArmFeedback('Получено первое подтверждение нахождения иглы в вене. Теперь снимите жгут.'); }
        else if (ivArmTourniquetReleased && !ivArmSecondBloodReturn) {
          setIvArmSecondBloodReturn(true);
          setIvArmFeedback('Положение иглы повторно подтверждено после снятия жгута.');
          setIvAnswers(prev => ({ ...prev, iv_11: true, iv_12: true, iv_13: true, iv_14: true }));
          setIvCurrentCriterion(14);
          setStage('iv_playing');
        }
        return;
      }
      if (id === 'release' && ivArmFirstBloodReturn && !ivArmTourniquetReleased) {
        setIvArmTourniquetReleased(true);
        setIvArmFeedback('Жгут снят после первого подтверждения нахождения иглы в вене. Повторно проверьте положение иглы.');
      }
    };
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-7 text-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
            <div><p className="text-sm font-semibold text-sky-700">СТАНЦИЯ 3 · ВНУТРИВЕННАЯ ИНЪЕКЦИЯ</p><h1 className="text-2xl md:text-3xl font-bold">Подготовка руки и венепункция</h1></div>
            <div className="rounded-xl bg-white border border-sky-200 px-5 py-3 text-center shadow-sm"><p className="text-xs text-slate-500">Осталось времени</p><p className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600' : 'text-sky-800'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p></div>
          </div>
          <IVRoomScene phase="Подготовка руки пациента и венепункция" hotspots={armHotspots} onHotspotClick={handleArmRoomClick} overlay={<div className="rounded-xl border border-sky-200 bg-white/95 p-3 shadow-xl backdrop-blur"><p className="text-sm font-bold text-sky-900">{runMode === 'training' ? 'Выполните действия на руке пациента' : 'Продолжайте процедуру'}</p>{runMode === 'training' && <p className="mt-1 text-xs text-slate-600">Последовательно наложите жгут, проверьте пульс, обработайте кожу дважды и выполните венепункцию.</p>}{ivArmFeedback && <p className="mt-2 text-xs font-medium text-emerald-800">{ivArmFeedback}</p>}</div>} />
        </div>
      </div>
    );
  }

  if (stage === 'iv_playing') {
    const ivScenario = IV_SCENARIOS[ivScenarioIndex];
    const current = IV_CRITERIA[ivCurrentCriterion];
    const completed = Object.values(ivAnswers).filter(Boolean).length;
    const answered = Object.keys(ivAnswers).length;
    const autoEvaluated = /^iv_(0[1-9]|1[0-4])$/.test(current.id) && ivAnswers[current.id] === true;
    const ivIntroActionSteps = [
      { id: 'iv_01', title: 'Установить контакт с пациентом', button: 'Поздороваться, представиться и назвать свою роль', done: 'Контакт установлен: специалист поздоровался, представился и обозначил свою роль.', note: 'Обратитесь к пациенту, поздоровайтесь, представьтесь и назовите свою роль.' },
      { id: 'iv_02', title: 'Идентифицировать пациента', button: 'Запросить ФИО и возраст и сверить с назначением', done: 'Пациент идентифицирован: ФИО и возраст сверены с данными задания.', note: 'Попросите пациента назвать ФИО и возраст, затем сверьте сведения с данными задания.' },
      { id: 'iv_03', title: 'Уточнить самочувствие пациента', button: 'Спросить пациента о самочувствии', done: 'Самочувствие уточнено. Пациент отвечает: «Нормально».', note: 'Обратитесь к пациенту по имени и отчеству и спросите о самочувствии.' },
      { id: 'iv_04', title: 'Уточнить аллергологический анамнез', button: 'Спросить об аллергических реакциях', done: 'Аллергологический анамнез уточнён. Пациент сообщает: «Аллергических реакций не было».', note: 'Уточните наличие аллергии в анамнезе и реакций на вводимое лекарственное средство.' },
      { id: 'iv_05', title: 'Убедиться в наличии информированного добровольного согласия', button: 'Проверить наличие подписанного согласия', done: 'Наличие информированного добровольного согласия подтверждено.', note: 'Убедитесь, что информированное добровольное согласие пациента получено.' },
      { id: 'iv_06', title: 'Обработать руки гигиеническим способом', button: 'Выполнить гигиеническую обработку рук', done: 'Гигиеническая обработка рук перед манипуляцией выполнена.', note: 'Выполните один предусмотренный алгоритмом способ гигиенической обработки рук.' },
    ];
    const ivActionSteps = [
      { id: 'iv_15', title: 'Ввести назначенный объём препарата', button: 'Ввести препарат', done: 'Назначенный объём введён в симуляции.', note: 'Действие доступно после повторного подтверждения положения иглы после снятия жгута.' },
      { id: 'iv_16', title: 'Оценить состояние пациента во время введения', button: 'Уточнить самочувствие пациента', done: 'Пациент отвечает: «Чувствую себя как обычно».', note: 'Смоделируйте контроль самочувствия во время введения.' },
      { id: 'iv_17', title: 'Утилизировать шприц', button: 'Утилизировать шприц в контейнере для острых отходов', done: 'Шприц утилизирован в непрокалываемый контейнер.', note: 'Не помещайте использованную иглу в обычный мусор.' },
      { id: 'iv_18', title: 'Наложить давящую повязку', button: 'Наложить давящую повязку', done: 'Давящая повязка наложена в симуляции.', note: 'Смоделируйте прижатие места инъекции и наложение повязки.' },
      { id: 'iv_19', title: 'Оценить состояние пациента после введения', button: 'Уточнить самочувствие после процедуры', done: 'Пациент отвечает: «Всё хорошо, спасибо, доктор».', note: 'Уточните состояние пациента после завершения введения.' },
      { id: 'iv_20', title: 'Сдать лоток на дезинфекцию и стерилизацию', button: 'Передать лоток на обработку', done: 'Лоток передан на дезинфекцию и последующую стерилизацию.', note: 'Завершите работу с использованным лотком.' },
      { id: 'iv_21', title: 'Сообщить о необходимости снятия повязки', button: 'Сообщить пациенту о снятии повязки', done: 'Пациенту сообщено, что повязку необходимо снять через 15–20 минут.', note: 'Озвучьте пациенту рекомендацию по снятию повязки.' },
      { id: 'iv_22', title: 'Утилизировать смотровые перчатки', button: 'Снять и утилизировать перчатки', done: 'Смотровые перчатки утилизированы.', note: 'Завершите работу с использованными перчатками.' },
      { id: 'iv_23', title: 'Обработать руки после манипуляции', button: 'Выполнить гигиеническую обработку рук', done: 'Гигиеническая обработка рук после манипуляции выполнена.', note: 'Выполните заключительную гигиеническую обработку рук.' },
      { id: 'iv_24', title: 'Сделать запись в медицинской документации', button: 'Оформить запись в медицинской карте', done: 'Отметка о выполненной процедуре внесена в медицинскую документацию.', note: 'Выберите действие оформления записи. Карта пациента соответствует назначенному сценарию.' },
    ];
    const currentIvAction = ivCurrentCriterion < 6 ? ivIntroActionSteps[ivCurrentCriterion] : ivCurrentCriterion >= 14 ? ivActionSteps[ivCurrentCriterion - 14] : null;
    const postProcedureHotspotByCriterion: Record<number, IVRoomHotspot> = {
      14: { id: 'syringe', label: 'Шприц · введение препарата', x: 49, y: 77, done: ivActionFlags.iv_15 },
      15: { id: 'patient', label: 'Пациент · контроль самочувствия', x: 43, y: 40, w: 25, h: 48, done: ivActionFlags.iv_16 },
      16: { id: 'waste', label: 'Контейнер для острых отходов', x: 92, y: 81, done: ivActionFlags.iv_17 },
      17: { id: 'arm', label: 'Рука пациента · повязка', x: 47, y: 58, w: 20, h: 20, done: ivActionFlags.iv_18 },
      18: { id: 'patient', label: 'Пациент · после процедуры', x: 43, y: 40, w: 25, h: 48, done: ivActionFlags.iv_19 },
      19: { id: 'tray', label: 'Лоток · передать на обработку', x: 75, y: 80, done: ivActionFlags.iv_20 },
      20: { id: 'patient', label: 'Пациент · рекомендации', x: 43, y: 40, w: 25, h: 48, done: ivActionFlags.iv_21 },
      21: { id: 'gloves', label: 'Смотровые перчатки', x: 80, y: 86, done: ivActionFlags.iv_22 },
      22: { id: 'sink', label: 'Раковина · гигиена рук', x: 57, y: 34, w: 25, h: 23, done: ivActionFlags.iv_23 },
      23: { id: 'documents', label: 'Медицинская документация', x: 9, y: 79, w: 19, h: 23, done: ivActionFlags.iv_24 },
    };
    const ivInteractionHotspots: IVRoomHotspot[] = ivCurrentCriterion >= 14 ? [
      { id: 'patient', label: ivCurrentCriterion === 15 ? 'Спросить о самочувствии' : ivCurrentCriterion === 18 ? 'Уточнить состояние после процедуры' : ivCurrentCriterion === 20 ? 'Сообщить о снятии повязки' : 'Пациент', x: 43, y: 40, w: 25, h: 48, done: [15,18,20].includes(ivCurrentCriterion) && ivActionFlags[IV_CRITERIA[ivCurrentCriterion].id] },
      { id: 'syringe', label: ivCurrentCriterion === 16 ? 'Безопасно снять иглу' : 'Шприц · введение препарата', x: 49, y: 77, done: ivCurrentCriterion === 16 ? ivSyringeNeedleDetached : ivActionFlags.iv_15 },
      { id: 'swabs', label: 'Ватный шарик · прижать место инъекции', x: 66, y: 71, done: ivCottonPressed },
      { id: 'arm', label: 'Рука пациента · наложить повязку', x: 47, y: 58, w: 20, h: 20, done: ivActionFlags.iv_18 },
      { id: 'waste', label: 'Контейнер для острых отходов', x: 92, y: 81, done: ivActionFlags.iv_17 },
      { id: 'tray', label: 'Лоток · передать на обработку', x: 75, y: 80, done: ivActionFlags.iv_20 },
      { id: 'gloves', label: 'Перчатки · снять и утилизировать', x: 80, y: 86, done: ivActionFlags.iv_22 },
      { id: 'sink', label: 'Раковина · гигиена рук', x: 57, y: 34, w: 25, h: 23, done: ivActionFlags.iv_23 },
      { id: 'documents', label: 'Медицинская документация', x: 9, y: 79, w: 19, h: 23, done: ivActionFlags.iv_24 },
    ] : [
      { id: 'patient', label: 'Пациент · диалог', x: 52, y: 48, w: 31, h: 48 },
      { id: 'documents', label: 'Документы', x: 17, y: 81, w: 22, h: 18 },
      { id: 'sink', label: 'Гигиена рук', x: 69, y: 31, w: 18, h: 22 },
    ];
    const handleIVInteraction = (id: string) => {
      if (ivCurrentCriterion >= 14 && ivCurrentCriterion <= 23) {
        const finishCriterion = (criterionId: string, message: string) => {
          setIvActionFlags(prev => ({ ...prev, [criterionId]: true }));
          setIvAnswers(prev => ({ ...prev, [criterionId]: true }));
          setIvPrepFeedback(message);
          if (ivCurrentCriterion === 23) {
            setStage('iv_finished');
          } else {
            setIvCurrentCriterion(prev => Math.min(prev + 1, 23));
          }
        };
        if (ivCurrentCriterion === 14) {
          if (id !== 'syringe') {
            setIvPrepFeedback('Для введения препарата взаимодействуйте со шприцем.');
            return;
          }
          const prescribed = Number.parseFloat(ivScenario.dose);
          const nextVolume = Math.min(prescribed, Number((ivInjectedVolume + 0.5).toFixed(1)));
          setIvInjectedVolume(nextVolume);
          if (nextVolume >= prescribed) {
            finishCriterion('iv_15', `Назначенный объём ${ivScenario.dose} введён в симуляции.`);
          } else {
            setIvPrepFeedback(`Введение продолжается: ${nextVolume.toFixed(1).replace('.', ',')} мл из ${ivScenario.dose}. Продолжайте взаимодействовать со шприцем.`);
          }
          return;
        }
        if (ivCurrentCriterion === 15) {
          if (id !== 'patient') { setIvPrepFeedback('Обратитесь к пациенту и уточните самочувствие во время введения.'); return; }
          finishCriterion('iv_16', 'Пациент отвечает: «Чувствую себя как обычно».');
          return;
        }
        if (ivCurrentCriterion === 16) {
          if (id === 'syringe' && !ivSyringeNeedleDetached) {
            setIvSyringeNeedleDetached(true);
            setIvPrepFeedback('Игла безопасно отсоединена с помощью предусмотренного устройства. Теперь поместите использованный шприц и острые отходы в контейнер.');
            return;
          }
          if (id === 'waste' && ivSyringeNeedleDetached) {
            finishCriterion('iv_17', 'Шприц и острые отходы помещены в непрокалываемый контейнер.');
            setIvSyringeNeedleDetached(false);
            return;
          }
          setIvPrepFeedback(id === 'waste'
            ? 'Сначала безопасно отсоедините иглу с помощью предусмотренного устройства.'
            : 'Сейчас требуется безопасно отсоединить иглу от шприца.');
          return;
        }
        if (ivCurrentCriterion === 17) {
          if (id === 'swabs' && !ivCottonPressed) {
            setIvCottonPressed(true);
            setIvPrepFeedback('Место инъекции прижато ватным шариком. Теперь наложите давящую повязку на руку пациента.');
            return;
          }
          if (id === 'arm' && ivCottonPressed) {
            finishCriterion('iv_18', 'Давящая повязка наложена после прижатия места инъекции.');
            setIvCottonPressed(false);
            return;
          }
          setIvPrepFeedback(id === 'arm'
            ? 'Сначала прижмите место инъекции ватным шариком.'
            : 'Сейчас возьмите ватный шарик и прижмите место инъекции.');
          return;
        }
        const expectedByCriterion: Record<number, { id: string; message: string }> = {
          18: { id: 'patient', message: 'Пациент отвечает: «Всё хорошо, спасибо, доктор».' },
          19: { id: 'tray', message: 'Лоток передан на дезинфекцию и последующую стерилизацию.' },
          20: { id: 'patient', message: 'Пациенту сообщено о необходимости снять повязку через 15–20 минут.' },
          21: { id: 'gloves', message: 'Смотровые перчатки сняты и утилизированы.' },
          22: { id: 'sink', message: 'После манипуляции выполнена гигиеническая обработка рук.' },
          23: { id: 'documents', message: 'Отметка о выполненной процедуре внесена в медицинскую документацию.' },
        };
        const expected = expectedByCriterion[ivCurrentCriterion];
        if (!expected || id !== expected.id) {
          setIvPrepFeedback('Выберите соответствующий предмет в процедурном кабинете для текущего действия.');
          return;
        }
        finishCriterion(IV_CRITERIA[ivCurrentCriterion].id, expected.message);
        return;
      }
      const expected = ivCurrentCriterion <= 3 ? 'patient' : ivCurrentCriterion === 4 ? 'documents' : 'sink';
      if (id !== expected) {
        setIvPrepFeedback('Сейчас требуется другой объект. Вернитесь к текущему этапу процедуры.');
        return;
      }
      const criterionId = IV_CRITERIA[ivCurrentCriterion].id;
      setIvActionFlags(prev => ({ ...prev, [criterionId]: true }));
      setIvAnswers(prev => ({ ...prev, [criterionId]: true }));
      setIvPrepFeedback(
        id === 'patient'
          ? ['Контакт установлен. Вы представились и обозначили свою роль.', 'Пациент назвал ФИО и возраст. Данные сверены.', 'Пациент сообщил: «Нормально».', 'Пациент сообщил: «Аллергических реакций не было».'][ivCurrentCriterion]
          : id === 'documents'
            ? 'Открыты медицинские документы. Наличие информированного добровольного согласия проверено.'
            : 'У дозатора выполнена гигиеническая обработка рук.'
      );
      setIvCurrentCriterion(prev => Math.min(prev + 1, 6));
    };
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
            <div><p className="text-sm font-semibold text-sky-700">СТАНЦИЯ 3 · ЛЕЧЕБНОЕ ДЕЛО</p><h1 className="text-2xl md:text-3xl font-bold">Внутривенная инъекция</h1></div>
            <div className="rounded-xl bg-white border border-sky-200 px-5 py-3 text-center shadow-sm"><p className="text-xs text-slate-500">Осталось времени</p><p className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600' : 'text-sky-800'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p></div>
          </div>
          <IVRoomScene phase={ivCurrentCriterion >= 14 ? (currentIvAction?.title ?? "Завершение манипуляции") : "Пациент · документы · гигиена рук"} hotspots={ivInteractionHotspots} onHotspotClick={handleIVInteraction} patientSpeech={ivPatientBubble} overlay={<div className="rounded-xl border border-sky-200 bg-white/95 p-3 shadow-xl backdrop-blur"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-sky-900">{runMode === 'training' ? current.title : 'Выполните действие на предметах в кабинете'}</p><span className="text-xs font-semibold text-sky-700">{completed}/24</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-sky-600" style={{width:`${(completed/24)*100}%`}} /></div>{runMode === 'training' && <p className="mt-2 text-xs text-slate-600">{current.detail}</p>}{ivPrepFeedback && <p className="mt-2 text-xs font-medium text-emerald-800">{ivPrepFeedback}</p>}</div>} />

        </div>
      </div>
    );
  }

  if (stage === 'iv_finished') {
    const completed = IV_CRITERIA.filter(item => ivAnswers[item.id] === true).length;
    const scoreIv = Math.floor((completed / IV_CRITERIA.length) * 100);
    const passed = completed >= Math.ceil(IV_CRITERIA.length * 0.7);
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-sky-100 bg-white p-6 md:p-8 shadow-xl">
          <p className="text-center text-sm font-semibold text-sky-700">СТАНЦИЯ 3 · ИТОГОВЫЙ ЧЕК-ЛИСТ</p>
          <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">Внутривенная инъекция</h1>
          <div className="mt-5 text-center"><p className={`text-6xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{scoreIv}%</p><p className={`mt-2 text-xl font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>{passed ? 'ЭКЗАМЕН СДАН' : 'ЭКЗАМЕН НЕ СДАН'}</p><p className="mt-1 text-sm text-slate-500">{completed} из 24 · проходной порог 70%</p></div>
          <div className="mt-6 space-y-2">{IV_CRITERIA.map((item, index) => { const yes = ivAnswers[item.id] === true; return <div key={item.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${yes ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><span className="text-sm text-slate-800">{index + 1}. {item.title}</span><strong className={yes ? 'text-green-700' : 'text-red-700'}>{yes ? 'Да' : 'Нет'}</strong></div>; })}</div>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => { setIvAnswers({}); setIvActionFlags({}); setIvPatientChatOpen(false); setIvPatientChatMessages([]); setIvPatientChatInput(''); setIvGreetingSent(false); setIvIdentityResponseReceived(false); setIvInjectedVolume(0); setIvSyringeNeedleDetached(false); setIvCottonPressed(false); setIvCurrentCriterion(0); setTimeLeft(600); setStage('iv_briefing'); }} className="rounded-xl bg-sky-700 px-6 py-3 font-bold text-white">Повторить станцию</button><button onClick={() => setStage('station_select')} className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700">К выбору станций</button></div>
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
          <div className="max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-3 text-gray-800 shadow-2xl sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">Положите ладонь на лоб пострадавшего</h3>
              <button type="button" onClick={() => { setForeheadHandOpen(false); setForeheadHandDragging(false); setForeheadHandPlaced(false); setChinHandDragging(false); setChinHandPlaced(false); }} className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100">Закрыть</button>
            </div>
            <div
              ref={foreheadSceneRef}
              className="relative mx-auto w-fit max-w-full touch-none overflow-visible rounded-xl bg-slate-100"
              onPointerMove={(event) => {
                if (!foreheadSceneRef.current) return;
                const rect = foreheadSceneRef.current.getBoundingClientRect();
                const position = {
                  x: Math.max(-12, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100 - 11)),
                  y: Math.max(-12, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100 - 11))
                };
                if (foreheadHandDragging && !foreheadHandPlaced) setForeheadHandPosition(position);
                if (chinHandDragging && foreheadHandPlaced && !chinHandPlaced) setChinHandPosition(position);
              }}
              onPointerUp={(event) => {
                if (!foreheadSceneRef.current) return;
                const rect = foreheadSceneRef.current.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                if (foreheadHandDragging && !foreheadHandPlaced) {
                  setForeheadHandDragging(false);
                  if (x >= 34 && x <= 67 && y >= 5 && y <= 39) {
                    setForeheadHandPlaced(true);
                    toggleAction('forehead_hand');
                    setPatientResponse('Правильно: ладонь одной руки расположена на лбу пострадавшего.');
                  } else {
                    setForeheadHandPosition({ x: 39, y: 58 });
                    setPatientResponse('Рука расположена неправильно. Попробуйте ещё раз.');
                  }
                  return;
                }
                if (chinHandDragging && foreheadHandPlaced && !chinHandPlaced) {
                  setChinHandDragging(false);
                  if (x >= 30 && x <= 75 && y >= 43 && y <= 84) {
                    setChinHandPlaced(true);
                    toggleAction('chin_lift');
                    setPatientResponse('Правильно: подбородок приподнят двумя пальцами.');
                  } else {
                    setChinHandPosition({ x: 61, y: 66 });
                    setPatientResponse('Установите пальцы под подбородок и попробуйте ещё раз.');
                  }
                }
              }}
              onPointerCancel={() => { setForeheadHandDragging(false); setChinHandDragging(false); }}
            >
              <img src="/patient_face_closeup.png" alt="Лицо пострадавшего" draggable={false} className="mx-auto block h-auto max-h-[70vh] w-auto max-w-full select-none object-contain" />
              <img
                src="/airway_hand_forehead.png"
                alt="Рука на лбу"
                draggable={false}
                onPointerDown={(event) => { event.preventDefault(); if (foreheadHandPlaced) return; setForeheadHandDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
                className={`absolute z-10 w-[40%] max-w-[300px] select-none ${foreheadHandPlaced ? 'pointer-events-none' : 'cursor-grab touch-none active:cursor-grabbing'}`}
                style={{ left: `${foreheadHandPosition.x}%`, top: `${foreheadHandPosition.y}%` }}
              />
              {foreheadHandPlaced && (
                <img
                  src="/airway_hand_chin2.png"
                  alt="Вторая рука для подъёма подбородка"
                  draggable={false}
                  onPointerDown={(event) => { event.preventDefault(); if (chinHandPlaced) return; setChinHandDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
                  className={`absolute z-20 w-[40%] max-w-[300px] select-none ${chinHandPlaced ? 'pointer-events-none' : 'cursor-grab touch-none active:cursor-grabbing'}`}
                  style={{ left: `${chinHandPosition.x}%`, top: `${chinHandPosition.y}%` }}
                />
              )}
            </div>
            <p className="mt-3 text-center text-sm text-gray-600">{!foreheadHandPlaced ? "Перетащите первую руку на область лба пациента." : !chinHandPlaced ? "Теперь перетащите вторую руку под подбородок." : "Правильно! Подбородок приподнят. Можно закрыть окно."}</p>
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
                  <div className={`max-w-[90%] p-3 rounded-xl text-sm ${msg.sender === 'doctor' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                    {msg.sender === 'dispatcher' && <span className="block text-xs text-gray-400 mb-1">Диспетчер:</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {runMode === 'training' && !callSuccess ? (
                <div className="rounded-xl border border-gray-600 bg-gray-900/70 p-3 space-y-3">
                  <p className="text-sm font-semibold text-white">Диспетчер: «Скорая помощь. Слушаю!» Выберите правильные ответы:</p>
                  <div className="space-y-2">
                    {getTrainingSmpOptions(scenario).map(option => (
                      <label key={option.id} className="flex items-start gap-3 rounded-lg bg-gray-700/70 p-3 text-sm text-gray-100 cursor-pointer hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedSmpOptions.includes(option.id)}
                          onChange={(event) => {
                            setSelectedSmpOptions(prev => event.target.checked ? [...prev, option.id] : prev.filter(id => id !== option.id));
                            setSmpFeedback('');
                          }}
                          className="mt-0.5 h-4 w-4 accent-blue-500"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                  {smpFeedback && <p className="text-sm text-amber-300">{smpFeedback}</p>}
                  <button onClick={handleTrainingSmpSubmit} disabled={selectedSmpOptions.length === 0} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Передать диспетчеру</button>
                </div>
              ) : runMode !== 'training' && !callSuccess ? (
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