'use client';

import { useState } from 'react';

export default function Helper({ message, onClose }: { message: string | null, onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end">
      {(isOpen || Boolean(message)) && (
        <div className="bg-white border-2 border-blue-400 p-4 rounded-2xl shadow-2xl mb-3 max-w-[250px] relative">
          <p className="text-sm text-gray-800 font-medium">
            {message || 'Привет! Я Аккредик. Нужна подсказка? Я рядом!'}
          </p>
          <button
            onClick={() => { setIsOpen(false); onClose(); }}
            aria-label="Закрыть подсказку Аккредика"
            className="absolute -top-2 -right-2 bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors"
          >
            ✕
          </button>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-400 transform rotate-45"></div>
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
