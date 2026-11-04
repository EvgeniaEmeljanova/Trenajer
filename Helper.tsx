'use client';

import { useState } from 'react';

export default function Helper({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Облачко с текстом */}
      <div className="bg-white border-2 border-blue-400 p-4 rounded-2xl shadow-2xl mb-3 max-w-[250px] relative">
        <p className="text-sm text-gray-800 font-medium">{message}</p>
        <button 
          onClick={onClose} 
          className="absolute -top-2 -right-2 bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors"
        >
          ✕
        </button>
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-400 transform rotate-45"></div>
      </div>

      {/* Твой Аккредик */}
      <img 
        src="/helper.png" 
        alt="Аккредик" 
        className="w-24 h-24 hover:scale-110 transition-transform drop-shadow-2xl cursor-help"
      />
    </div>
  );
}