'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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
  BLS: 'Вы увидели, что человеку стало плохо. Необходимо оказать ему первую помощь. На станции есть автоматический наружный дефибриллятор. Время пошло!',
  OKS1: 'Пациент 45 лет. Жалуется на сильные загрудинные боли. Вы — врач бригады экстренной помощи. Время пошло!',
  ANAPHYLAXIS: 'Пациент 30 лет. После укуса пчелы появилась резкая слабость. Время пошло!',
  OKS2: 'Пациент 50 лет. Жалобы на одышку. Время пошло!',
  ZHKK: 'Пациент 55 лет. Рвота кофейной гущей. Время пошло!',
  BOS: 'Пациент 25 лет. Затрудненное дыхание. Время пошло!',
  TELA: 'Пациент 60 лет. Резкая боль в грудной клетке. Время пошло!',
  PNEUMOTHORAX: 'Пациент 40 лет. Травма грудной клетки. Время пошло!',
  HYPOGLYCEMIA: 'Пациент 50 лет. Состояние спутанное. Время пошло!',
  HYPERGLYCEMIA: 'Пациент 35 лет. Сухость во рту, слабость. Время пошло!',
};

const ALL_ACTIONS = [
  { id: 'danger', label: 'Убедиться в отсутствии опасности' },
  { id: 'choking', label: 'Спросить: «Вы подавились?»' },
  { id: 'back_blows', label: 'Нанести 5 ударов между лопатками' },
  { id: 'heimlich', label: '5 надавливаний на живот (Геймлих)' },
  { id: 'consciousness', label: 'Оценить сознание' },
  { id: 'airway', label: 'Открыть дыхательные пути' },
  { id: 'breathing', label: 'Оценить дыхание (7-10 сек)' },
  { id: 'call', label: 'Вызвать СМП' },
  { id: 'compressions', label: 'Начать компрессии (30 раз)' },
  { id: 'breaths', label: 'Сделать 2 вдоха' },
  { id: 'aed', label: 'Работа с АНД' },
  { id: 'recovery', label: 'Устойчивое боковое положение' },
  { id: 'gloves', label: 'Надеть перчатки' },
  { id: 'spo2', label: 'Пульсоксиметрия' },
  { id: 'oxygen', label: 'Кислородотерапия' },
  { id: 'ecg', label: 'Снять ЭКГ' },
  { id: 'adrenaline', label: 'Ввести адреналин' },
];

const BLS_ORDER = [
  'danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 
  'breathing', 'call', 'compressions', 'breaths', 'aed', 'compressions', 'recovery'
];

const SCENARIO_DATA: Record<ScenarioType, { order: string[] }> = {
  BLS: { order: BLS_ORDER },
  OKS1: { order: ['consciousness', 'gloves', 'airway', 'spo2', 'oxygen', 'ecg', 'call', 'aed'] },
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

const SMP_PHRASES = [
  { id: 'intro', text: '«Здравствуйте, я врач. У нас пострадавший»', correct: true },
  { id: 'address', text: '«Адрес: улица Ленина, дом 5»', correct: true },
  { id: 'who', text: '«Мужчина, 45 лет»', correct: true },
  { id: 'state', text: '«Без сознания, не дышит»', correct: true },
  { id: 'action', text: '«Начинаю сердечно-легочную реанимацию»', correct: true },
  { id: 'joke', text: '«А можно побыстрее, у меня обед»', correct: false },
  { id: 'unknown', text: '«Не знаю, что с ним, просто лежит»', correct: false },
  { id: 'noaddress', text: '«Приезжайте, сами найдете»', correct: false },
];

type Stage = 'briefing' | 'room_entry' | 'intro' | 'playing' | 'finished';

export default function Home() {
  const [stage, setStage] = useState<Stage>('briefing');
  const [studentId, setStudentId] = useState('');
  const [scenario, setScenario] = useState<ScenarioType>('BLS');
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(510);
  const [score, setScore] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  
  const [accredicMessage, setAccredicMessage] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<string | null>(null);
  const [cprCount, setCprCount] = useState(0);
  const [cprFeedback, setCprFeedback] = useState('');
  const lastCprTime = useRef<number>(0);
  
  const [aedOpen, setAedOpen] = useState(false);
  const [aedState, setAedState] = useState<'idle' | 'analyzing' | 'shock' | 'success'>('idle');
  const [aedTimer, setAedTimer] = useState(0);

  const [vitals, setVitals] = useState({ hr: 120, spo2: 88 });
  
  const [phoneModal, setPhoneModal] = useState(false);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [callFeedback, setCallFeedback] = useState('');
  const [callSuccess, setCallSuccess] = useState(false);

  const hasSpokenMinuteWarning = useRef(false);

  const currentOrder = SCENARIO_DATA[scenario].order;

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
  }, [timeLeft, stage]);

  useEffect(() => {
    if (actions['oxygen']) setVitals(prev => ({ ...prev, spo2: 98 }));
    if (actions['compressions']) setVitals(prev => ({ ...prev, hr: 100 }));
  }, [actions]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aedState === 'analyzing' && aedTimer > 0) {
      timer = setTimeout(() => setAedTimer((t) => t - 1), 1000);
    } else if (aedState === 'analyzing' && aedTimer === 0) {
      setAedState('shock');
    }
    return () => clearTimeout(timer);
  }, [aedState, aedTimer]);

  const handleEnterRoom = () => {
    const keys = Object.keys(SCENARIO_TITLES) as ScenarioType[];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setScenario(randomKey);
    setStage('room_entry');
    setTimeout(() => playAudio("Войдите на станцию и назовите свой логин."), 500);
  };

  const handleLogin = () => {
    const finalId = studentId.trim() || 'Аноним';
    setStudentId(finalId);
    setStage('intro');
    playAudio(VOICE_INTROS[scenario], () => setStage('playing'));
    setTimeout(() => { if (stage === 'intro') setStage('playing'); }, 15000);
  };

  const toggleAction = (id: string) => {
    if (actions[id]) return;
    setActions((prev) => ({ ...prev, [id]: true }));
    setSequence((prev) => [...prev, id]);
    setChallenge(null);
  };

  // --- УМНЫЙ АККРЕДИК (Строгая проверка последовательности) ---
  const handleActionClick = (id: string) => {
    // Если действие уже выполнено
    if (actions[id]) {
      setAccredicMessage('Вы уже выполнили это действие!');
      setTimeout(() => setAccredicMessage(null), 2000);
      return;
    }

    const expectedId = currentOrder[sequence.length];
    const expectedAction = ALL_ACTIONS.find(a => a.id === expectedId);
    
    // Если действие не то, что ожидалось — БЛОКИРУЕМ его
    if (expectedId && id !== expectedId) {
      if (id === 'aed' && expectedId !== 'aed') {
        setAccredicMessage('Стой! Рано включать АНД. Сначала выполните предыдущие шаги!');
      } else if (id === 'compressions' && expectedId !== 'compressions') {
        setAccredicMessage('Подожди с компрессиями! Сначала проверь сознание и дыхание.');
      } else if (id === 'call' && expectedId !== 'call') {
        setAccredicMessage('Сначала оцени состояние пациента, потом вызывай скорую.');
      } else {
        setAccredicMessage(`Неверный шаг! Сейчас нужно: ${expectedAction?.label.toLowerCase()}`);
      }
      
      setTimeout(() => setAccredicMessage(null), 4000);
      return; // ВАЖНО: действие не выполняется!
    }

    // Если действие верное
    setAccredicMessage('Верно! Молодец!');
    setTimeout(() => setAccredicMessage(null), 2000);

    if (id === 'compressions') {
      setChallenge('cpr'); setCprCount(0); setCprFeedback(''); lastCprTime.current = 0;
      return;
    }
    if (id === 'recovery') {
      toggleAction(id); return;
    }
    if (id === 'choking') {
      toggleAction(id); return;
    }
    if (id === 'call') {
      setPhoneModal(true); setSelectedPhrases([]); setCallFeedback(''); setCallSuccess(false);
      return;
    }
    toggleAction(id);
  };

  // Проверка нажатия кнопки АНД в интерфейсе дефибриллятора
  const handleAedShock = () => {
    if (aedState === 'shock') {
      const expectedId = currentOrder[sequence.length];
      if (expectedId === 'aed') {
        setAedState('success'); 
        toggleAction('aed');
        setTimeout(() => setAedOpen(false), 1500); // Закрываем АНД после успеха
      } else {
        setAccredicMessage('Вы применили АНД не вовремя!');
        setTimeout(() => setAccredicMessage(null), 3000);
      }
    }
  };

  const togglePhrase = (phraseId: string) => {
    setSelectedPhrases(prev => prev.includes(phraseId) ? prev.filter(id => id !== phraseId) : [...prev, phraseId]);
    setCallFeedback('');
  };

  const handleSendCall = () => {
    const correctIds = SMP_PHRASES.filter(p => p.correct).map(p => p.id);
    const incorrectIds = SMP_PHRASES.filter(p => !p.correct).map(p => p.id);
    
    const selectedIncorrect = selectedPhrases.filter(id => incorrectIds.includes(id));
    const selectedCorrect = selectedPhrases.filter(id => correctIds.includes(id));
    
    if (selectedIncorrect.length > 0) {
      setCallFeedback('Ошибка! Диспетчер не понял. Вы сказали лишнее.');
      return;
    }
    if (selectedCorrect.length < correctIds.length) {
      setCallFeedback('Неполный вызов! Диспетчер переспрашивает. Вы не назвали всю информацию.');
      return;
    }
    setCallSuccess(true);
    setCallFeedback('Вызов принят! Бригада выехала.');
    setTimeout(() => { setPhoneModal(false); toggleAction('call'); }, 2000);
  };

  const handleCprClick = () => {
    const now = Date.now();
    let feedback = '';
    if (lastCprTime.current !== 0) {
      const interval = now - lastCprTime.current;
      if (interval < 400) feedback = 'Слишком быстро!';
      else if (interval > 750) feedback = 'Слишком медленно!';
      else feedback = 'Отличный ритм!';
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

  const finishScenario = async () => {
    setStage('finished');
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
        await supabase.from('attempts').insert({ 
          scenario_id: scenario, score: calculatedScore, actions: { studentId: studentId, fullSequence: sequence } 
        });
      } catch (e) { console.error(e); }
    }
  };

  // ЭКРАНЫ
  if (stage === 'briefing') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Брифинг аккредитуемого</h1>
          <div className="space-y-4 text-lg text-gray-200 leading-relaxed">
            <p>Вы — врач своей специальности. Медицинский брат/сестра вызвал/а Вас на помощь.</p>
            <p>Перед Вами пациент <strong>45 лет</strong>.</p>
          </div>
          <button onClick={handleEnterRoom} className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg">Войти на станцию</button>
        </div>
      </div>
    );
  }

  if (stage === 'room_entry') {
    return (
      <div className="min-h-screen bg-gray-900 text-white relative flex items-center justify-center">
        <div className="absolute inset-0 z-0"><img src="/room.jpg" alt="Комната" className="w-full h-full object-cover blur-sm opacity-50" /></div>
        <div className="relative z-10 bg-gray-800/90 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center backdrop-blur-md">
          <h1 className="text-3xl font-bold mb-4 text-blue-400">Вы вошли на станцию</h1>
          <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Ваш логин" className="w-full bg-gray-700 text-white text-center text-2xl font-mono p-4 rounded-xl mb-6 border-2 border-gray-600 focus:border-blue-500 outline-none" autoFocus />
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg">Подтвердить ID</button>
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
    const isPassed = score === 100;
    return (
      <div className={`min-h-screen p-8 flex flex-col items-center justify-center ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
        <h1 className="text-4xl font-bold mb-4">{isPassed ? 'Экзамен сдан! 🎉' : 'Экзамен не сдан 😔'}</h1>
        <p className={`text-6xl font-bold mb-8 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-md max-h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Студент: {studentId}</h2>
          <h3 className="text-lg font-semibold mt-4 mb-2">Порядок ваших действий:</h3>
          <div className="space-y-1 mb-6">
            {sequence.map((id, index) => {
              const action = ALL_ACTIONS.find(a => a.id === id);
              return (
                <div key={index} className="flex gap-2 text-sm p-1 border-b border-gray-100">
                  <span className="text-gray-400 w-6">{index + 1}.</span>
                  <span className="text-gray-800">{action?.label || id}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">Пройти заново</button>
      </div>
    );
  }

  // ИНТЕРФЕЙС
  return (
    <div className={`min-h-screen bg-gray-900 text-white overflow-hidden relative ${timeLeft < 60 ? 'animate-pulse ring-8 ring-red-600 ring-inset' : ''}`}>
      
      <div className="absolute top-4 right-4 bg-black/80 border border-gray-600 p-3 rounded-xl z-40 font-mono text-sm shadow-xl">
        <div className="flex items-center gap-2 mb-1"><span className="text-red-500 animate-pulse">❤️</span><span>ЧСС: {vitals.hr} уд/мин</span></div>
        <div className="flex items-center gap-2"><span className="text-blue-400">🫁</span><span>SpO2: {vitals.spo2}%</span></div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-8 py-2 rounded-full backdrop-blur-md z-40 flex items-center gap-6 shadow-lg">
        <span className={`text-2xl font-mono font-bold tracking-widest ${timeLeft < 60 ? 'text-red-500' : 'text-green-400'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        <button onClick={finishScenario} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition text-sm font-semibold">Завершить</button>
      </div>

      {/* АККРЕДИК */}
      <div className="absolute bottom-20 left-4 z-40 flex items-end pointer-events-none">
        <img src="/helper.png" alt="Аккредик" className="w-24 h-24 drop-shadow-2xl" />
        {accredicMessage && (
          <div className="ml-2 mb-4 bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-2xl border-2 border-blue-500 max-w-xs animate-fade-in relative">
            <div className="absolute -left-2 bottom-2 w-4 h-4 bg-white border-b-2 border-l-2 border-blue-500 transform rotate-45"></div>
            <p className="font-medium text-sm">{accredicMessage}</p>
          </div>
        )}
      </div>

      {/* Окно вызова СМП */}
      {phoneModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-center text-blue-400">📞 Вызов СМП</h3>
            <p className="text-sm text-gray-400 text-center mb-4">Соберите правильный доклад, нажимая на нужные фразы</p>
            {callSuccess ? (
              <div className="text-center py-8"><p className="text-2xl font-bold text-green-400 mb-4">✅ Вызов принят!</p><p className="text-gray-300">Бригада выехала.</p></div>
            ) : (
              <>
                <div className="bg-gray-900 p-3 rounded-lg mb-4 min-h-[80px]">
                  <p className="text-xs text-gray-500 mb-1">Ваш доклад:</p>
                  {selectedPhrases.length === 0 ? <p className="text-gray-500 italic">Нажимайте на фразы ниже...</p> : (
                    <ul className="space-y-1">{selectedPhrases.map(id => { const p = SMP_PHRASES.find(x => x.id === id); return <li key={id} className={`text-sm ${p?.correct ? 'text-green-400' : 'text-red-400'}`}>• {p?.text}</li>; })}</ul>
                  )}
                </div>
                {callFeedback && <div className={`p-2 rounded mb-4 text-center font-bold text-sm ${callFeedback.includes('принят') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{callFeedback}</div>}
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto mb-4">
                  {SMP_PHRASES.map(phrase => (
                    <button key={phrase.id} onClick={() => togglePhrase(phrase.id)} className={`p-2 rounded text-left text-sm border transition ${selectedPhrases.includes(phrase.id) ? 'bg-blue-900 border-blue-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>{phrase.text}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPhoneModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg">Отмена</button>
                  <button onClick={handleSendCall} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold">Отправить</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ритм-игра */}
      {challenge === 'cpr' && (
        <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50 p-4">
          <h2 className="text-3xl font-bold mb-2 text-white">Компрессии</h2>
          <p className="text-gray-400 mb-8">Нажимайте в ритме 100-120 в минуту</p>
          <div className={`mb-6 text-2xl font-bold ${cprFeedback === 'Отличный ритм!' ? 'text-green-400' : cprFeedback.includes('Слишком') ? 'text-red-500' : 'text-white'}`}>{cprFeedback}</div>
          <button onClick={handleCprClick} className="w-64 h-64 bg-red-600 rounded-full text-white text-7xl font-bold shadow-[0_0_80px_rgba(220,38,38,0.6)] active:scale-95 transition-transform flex items-center justify-center select-none">{cprCount}</button>
          <p className="mt-8 text-white text-xl">Осталось: {30 - cprCount}</p>
        </div>
      )}

      {/* Окно АНД */}
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

      {/* Комната */}
      <div className="relative w-full max-w-[1200px] mx-auto">
        <img src="/room.jpg" alt="Комната" className="w-full h-auto object-contain" />
        {HOTSPOTS.map((spot) => (
          <button key={spot.id} onClick={() => setActiveHotspot(spot.id)} className="absolute border-2 border-transparent hover:border-blue-400/70 hover:bg-blue-400/20 rounded-xl z-10" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }} />
        ))}

        {activeHotspot && !aedOpen && !challenge && !phoneModal && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
            <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <button onClick={() => setActiveHotspot(null)} className="float-right font-bold">✕</button>
              <h3 className="text-xl font-bold mb-4">Действия</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {ALL_ACTIONS.map((action) => {
                  if (scenario === 'BLS') {
                    if (activeHotspot === 'patient' && !['danger', 'choking', 'back_blows', 'heimlich', 'consciousness', 'airway', 'breathing', 'compressions', 'breaths', 'recovery'].includes(action.id)) return null;
                    if (activeHotspot === 'phone' && action.id !== 'call') return null;
                    if (activeHotspot === 'aed') {
                      return <button key="aed-btn" onClick={() => { setAedOpen(true); setActiveHotspot(null); }} className="w-full text-left p-3 rounded border-2 border-gray-200 hover:border-blue-300 mb-2">Открыть АНД</button>;
                    }
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
