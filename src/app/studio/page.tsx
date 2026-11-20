'use client';

import { useMemo, useRef, useState } from 'react';
import './studio.css';
import StudioSceneLoader from './components/StudioSceneLoader';

type Specialty = 'Лечебное дело' | 'Педиатрия';
type Mode = 'training' | 'exam';

const stations: Record<Specialty, { id: string; title: string; subtitle: string; available: boolean }[]> = {
  'Лечебное дело': [
    { id: 'bls', title: 'Базовая сердечно-лёгочная реанимация', subtitle: 'Станция 1 · 4 клинических сценария', available: true },
    { id: 'emergency', title: 'Экстренная медицинская помощь', subtitle: 'Станция 2 · клинические ситуации', available: true },
    { id: 'iv', title: 'Внутривенная инъекция', subtitle: 'Станция 3', available: false },
    { id: 'history', title: 'Сбор жалоб и анамнеза', subtitle: 'Станция 4 · выбор варианта', available: false },
    { id: 'exam', title: 'Физикальное обследование', subtitle: 'Станция 5 · выбор варианта', available: false },
  ],
  'Педиатрия': [
    { id: 'pbls', title: 'Сердечно-лёгочная реанимация у детей', subtitle: 'Станция 1', available: false },
    { id: 'pemergency', title: 'Экстренная помощь ребёнку', subtitle: 'Станция 2', available: false },
  ],
};

const actions = [
  { id: 'patient', label: 'Оценить пациента', hint: 'Первичная оценка состояния', icon: '✚' },
  { id: 'aed', label: 'Подготовить АНД', hint: 'Автоматический наружный дефибриллятор', icon: '▣' },
  { id: 'cpr', label: 'Начать СЛР', hint: 'Компрессии и искусственное дыхание', icon: '♡' },
  { id: 'call', label: 'Вызвать помощь', hint: 'Вызов бригады СМП', icon: '☎' },
];

export default function AkkredikStudioPage() {
  const [specialty, setSpecialty] = useState<Specialty>('Лечебное дело');
  const [mode, setMode] = useState<Mode>('training');
  const [station, setStation] = useState('bls');
  const [selectedAction, setSelectedAction] = useState('patient');
  const [started, setStarted] = useState(false);
  const [compressionCount, setCompressionCount] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [cprPhase, setCprPhase] = useState<'compressions' | 'breaths'>('compressions');
  const [cadence, setCadence] = useState<number | null>(null);
  const [completedCycles, setCompletedCycles] = useState(0);
  const compressionTimes = useRef<number[]>([]);

  function registerCompression() {
    if (cprPhase !== 'compressions' || compressionCount >= 30) return;
    const now = Date.now();
    const times = [...compressionTimes.current, now];
    compressionTimes.current = times.slice(-6);
    if (times.length >= 2) {
      const recent = times.slice(1).map((time, index) => time - times[index]);
      const averageInterval = recent.reduce((sum, value) => sum + value, 0) / recent.length;
      if (averageInterval > 0) setCadence(Math.round(60000 / averageInterval));
    }
    const nextCount = compressionCount + 1;
    setCompressionCount(nextCount);
    if (nextCount === 30) {
      setCprPhase('breaths');
      setBreathCount(0);
    }
  }

  function registerBreath() {
    if (cprPhase !== 'breaths' || breathCount >= 2) return;
    const nextCount = breathCount + 1;
    setBreathCount(nextCount);
    if (nextCount === 2) {
      setCompletedCycles((count) => count + 1);
      setCompressionCount(0);
      setBreathCount(0);
      setCprPhase('compressions');
      setCadence(null);
      compressionTimes.current = [];
    }
  }

  function resetCprCycle() {
    setCompressionCount(0);
    setBreathCount(0);
    setCprPhase('compressions');
    setCadence(null);
    setCompletedCycles(0);
    compressionTimes.current = [];
  }

  function handleSceneSelect(value: string) {
    if (value === 'compression') {
      registerCompression();
      return;
    }
    setSelectedAction(value);
  }

  const activeStation = useMemo(
    () => stations[specialty].find((item) => item.id === station),
    [specialty, station],
  );

  function changeSpecialty(value: Specialty) {
    setSpecialty(value);
    setStation(value === 'Лечебное дело' ? 'bls' : 'pbls');
    setStarted(false);
  }

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Аккредик — главная">
          <span className="brand-mark">A</span>
          <span><strong>АККРЕДИК</strong><small>СИМУЛЯЦИОННЫЙ ТРЕНАЖЁР 2.0</small></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> УЧЕБНАЯ СРЕДА <span className="topbar-divider" /> ВЕРСИЯ ПРОТОТИПА</div>
        <button className="profile-chip" type="button" onClick={() => setMode(mode === 'training' ? 'exam' : 'training')}>
          <span className="profile-avatar">С</span><span>{mode === 'training' ? 'Обучение' : 'Экзамен'}</span><span className="chevron">⌄</span>
        </button>
      </header>

      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="eyebrow">ПОДГОТОВКА К АККРЕДИТАЦИИ</div>
          <h1>Тренажёр<br /><em>практических</em><br />навыков</h1>
          <p className="sidebar-copy">Отрабатывайте клинические алгоритмы в интерактивной симуляционной среде.</p>

          <div className="field-label">СПЕЦИАЛЬНОСТЬ</div>
          <div className="specialty-switch">
            {(['Лечебное дело', 'Педиатрия'] as Specialty[]).map((item) => (
              <button key={item} type="button" className={specialty === item ? 'specialty-option active' : 'specialty-option'} onClick={() => changeSpecialty(item)}>
                <span className="specialty-icon">{item === 'Лечебное дело' ? '＋' : '⌂'}</span>{item}
              </button>
            ))}
          </div>

          <div className="field-label station-label">СТАНЦИИ</div>
          <div className="station-list">
            {stations[specialty].map((item, index) => (
              <button key={item.id} type="button" disabled={!item.available} onClick={() => { setStation(item.id); setStarted(false); }} className={station === item.id ? 'station-option selected' : 'station-option'}>
                <span className="station-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="station-info"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                {item.available ? <span className="station-arrow">↗</span> : <span className="lock-icon">⌑</span>}
              </button>
            ))}
          </div>
          <div className="sidebar-bottom"><span className="shield-icon">⬡</span><span>Учебный режим. Не предназначен для принятия клинических решений.</span></div>
        </aside>

        <section className="studio-main">
          <div className="workspace-heading">
            <div><div className="eyebrow">СИМУЛЯЦИОННЫЙ КАБИНЕТ / {specialty.toUpperCase()}</div><h2>{activeStation?.title ?? 'Станция'}</h2><p>{activeStation?.subtitle ?? ''}</p></div>
            <div className="mode-switch" aria-label="Режим тренажёра">
              <button type="button" className={mode === 'training' ? 'mode-active' : ''} onClick={() => setMode('training')}>Обучение</button>
              <button type="button" className={mode === 'exam' ? 'mode-active' : ''} onClick={() => setMode('exam')}>Экзамен</button>
            </div>
          </div>

          <div className="simulation-grid">
            <section className="scene-panel">
              <div className="scene-toolbar"><div><span className="scene-live" /> СИМУЛЯЦИОННАЯ СЦЕНА</div><div className="scene-tools"><button type="button" title="Уменьшить масштаб" onClick={() => setSelectedAction('zoom-out')}>−</button><button type="button" title="Увеличить масштаб" onClick={() => setSelectedAction('zoom-in')}>＋</button><button type="button" title="Сбросить вид" onClick={() => setSelectedAction('patient')}>⟲</button></div></div>
              <div className="scene-canvas scene-canvas-webgl">
                <StudioSceneLoader selected={selectedAction} onSelect={handleSceneSelect} />
              </div>
              <div className="scene-legend"><span><i className="legend-blue" /> Пациент</span><span><i className="legend-green" /> Оборудование</span><span><i className="legend-amber" /> Активное действие</span></div>
            </section>

            <aside className="action-panel">
              <div className="panel-heading"><div><div className="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</div><h3>Действия студента</h3></div><span className="step-count">ШАГ 01</span></div>
              <div className="patient-status"><div className="status-icon">♥</div><div><strong>Пациент ожидает оценки</strong><small>Исходное состояние сценария</small></div><span className="status-dot" /></div>
              <div className="action-list">
                {actions.map((action, index) => (
                  <button key={action.id} type="button" onClick={() => setSelectedAction(action.id)} className={selectedAction === action.id ? 'action-row action-selected' : 'action-row'}>
                    <span className="action-index">0{index + 1}</span><span className="action-symbol">{action.icon}</span><span className="action-text"><strong>{action.label}</strong><small>{action.hint}</small></span><span className="action-chevron">›</span>
                  </button>
                ))}
              </div>
              <div className="action-detail"><span className="detail-label">ВЫБРАННОЕ ДЕЙСТВИЕ</span><strong>{actions.find((item) => item.id === selectedAction)?.label ?? 'Управление сценой'}</strong><p>{mode === 'training' ? 'В режиме обучения будут доступны методические подсказки и разбор каждого шага.' : 'В экзаменационном режиме подсказки скрыты. Действия оцениваются по алгоритму станции.'}</p></div>
              {selectedAction === 'cpr' && (
                <section className="cpr-trainer" aria-label="Тренировка цикла сердечно-лёгочной реанимации">
                  <div className="cpr-trainer-head">
                    <div><span className="detail-label">ТЕКУЩИЙ ЦИКЛ 30:2</span><strong>{cprPhase === 'compressions' ? 'Компрессии грудной клетки' : 'Искусственное дыхание'}</strong></div>
                    <span className="cpr-cycle-count">{completedCycles} циклов</span>
                  </div>
                  <div className="cpr-progress-row"><span>Компрессии</span><strong>{compressionCount}/30</strong></div>
                  <div className="cpr-progress-track"><span style={{ width: (compressionCount / 30 * 100) + '%' }} /></div>
                  <div className="cpr-progress-row"><span>Вдохи</span><strong>{breathCount}/2</strong></div>
                  <div className="cpr-progress-track breath-track"><span style={{ width: (breathCount / 2 * 100) + '%' }} /></div>
                  {cprPhase === 'compressions' ? (
                    <button type="button" className="cpr-action-button compression-button" onClick={registerCompression} disabled={compressionCount >= 30}>
                      <span className="cpr-button-pulse">↓</span> ОДНА КОМПРЕССИЯ
                    </button>
                  ) : (
                    <button type="button" className="cpr-action-button breath-button" onClick={registerBreath} disabled={breathCount >= 2}>
                      <span className="cpr-button-pulse">↗</span> ВЫПОЛНИТЬ ВДОХ {breathCount + 1}
                    </button>
                  )}
                  <div className="cpr-cadence">
                    <span>Текущий темп</span>
                    <strong>{cadence === null ? '—' : cadence + '/мин'}</strong>
                    <small>{cadence === null ? 'Выполните несколько нажатий для оценки темпа' : cadence >= 100 && cadence <= 120 ? 'В ориентире 100–120 в минуту' : 'Ориентир: 100–120 в минуту'}</small>
                  </div>
                  {mode === 'training' && <p className="cpr-guidance">{cprPhase === 'compressions' ? 'Выполняйте нажатия по одному, с полным отпусканием грудной клетки между ними.' : 'Выполните два отдельных вдоха. После второго начнётся следующий цикл.'}</p>}
                  <p className="cpr-limitation">Глубина 5–6 см в этой версии визуально не измеряется: для объективной оценки нужен датчик манекена.</p>
                  <button type="button" className="cpr-reset" onClick={resetCprCycle}>Сбросить цикл</button>
                </section>
              )}
              <button type="button" className="start-button" onClick={() => setStarted(true)} disabled={!activeStation?.available}>{started ? 'Сценарий подготовлен' : 'Начать сценарий'} <span>→</span></button>
              <p className="panel-footnote">{started ? 'Это демонстрационный интерфейс. Клиническая логика будет подключена следующим этапом.' : 'Перед началом ознакомьтесь с вводной и правилами станции.'}</p>
            </aside>
          </div>

          <div className="bottom-status"><div><span className="status-check">✓</span><span><strong>Система готова</strong><small>Выберите действие или начните сценарий</small></span></div><div className="bottom-meta"><span>ГРАФИКА <b>СРЕДНЯЯ</b></span><span>СЕТЬ <b>АКТИВНА</b></span><span>v2.0 · PREVIEW</span></div></div>
        </section>
      </div>
    </main>
  );
}
