import React from 'react';
import { Beer } from 'lucide-react';

interface BeerLoadingAnimationProps {
  message?: string;
  subMessage?: string;
}

export default function BeerLoadingAnimation({ 
  message = "読み込み中...", 
  subMessage = "しばらくお待ちください" 
}: BeerLoadingAnimationProps) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl max-w-md mx-4">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <Beer className="w-16 h-16 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="beer-fill-animation">
                <Beer className="w-16 h-16 text-[#D1B607]" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-black mb-2">{message}</h3>
          <p className="text-sm text-gray-600">{subMessage}</p>
        </div>
      </div>
    </div>
  );
}