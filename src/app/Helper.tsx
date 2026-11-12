'use client';

import { useEffect, useState } from 'react';

const QUICK_ANSWERS = [
  {
    question: 'Как пользоваться тренажёром?',
    answer: 'Выбирай доступные действия в комнате: нажимай на пациента и оборудование. Некоторые задания открывают дополнительный мини-тест. Не торопись — сначала внимательно прочитай условие.',
  },
  {
    question: 'Я ошибся. Что делать?',
    answer: 'Ошибки здесь для того и нужны, чтобы учиться! Посмотри разбор после завершения сценария, отметь непонятный шаг и повтори тему. Я пока могу подсказать, как устроен тренажёр, но не заменяю преподавателя.',
  },
];

export default function Helper({ message, onClose }: { message: string | null, onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setReply(message);
      setIsOpen(true);
    }
  }, [message]);

  const closePanel = () => {
    setIsOpen(false);
    setReply(null);
    onClose();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end">
      {(isOpen || Boolean(message)) && (
        <div className="bg-white text-gray-800 border-2 border-blue-400 p-4 rounded-2xl shadow-2xl mb-3 w-[min(320px,calc(100vw-2rem))] relative">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="font-bold text-blue-700">Аккредик на связи 🐙</p>
            <button
              onClick={closePanel}
              aria-label="Закрыть помощника"
              className="text-gray-500 hover:text-red-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-sm leading-relaxed mb-3">
            {reply || 'Привет! Я Аккредик. Выбери, чем помочь — я подскажу, как ориентироваться в тренажёре.'}
          </p>
          <div className="flex flex-col gap-2">
            {QUICK_ANSWERS.map((item) => (
              <button
                key={item.question}
                type="button"
                onClick={() => setReply(item.answer)}
                className="text-left text-sm bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-3 py-2 transition-colors"
              >
                {item.question}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-3">
            Учебный помощник. Не заменяет клинические рекомендации и экспертную оценку.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Открыть помощника Аккредика"
        title="Аккредик — помощник"
        className="rounded-full focus:outline-none focus:ring-4 focus:ring-blue-400/40"
      >
        <img
          src="/helper.png"
          alt="Аккредик"
          className="w-24 h-24 object-contain hover:scale-110 transition-transform drop-shadow-2xl"
        />
      </button>
    </div>
  );
}
