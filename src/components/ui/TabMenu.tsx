'use client';

import type { TabType } from '@/types';

interface TabMenuItem {
  id: TabType;
  label: string;
}

interface TabMenuProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabItems: TabMenuItem[] = [
  { id: 'ai-consultation', label: 'AI相談' },
  { id: 'document-analysis', label: '資料で分析' },
  { id: 'past-cases', label: '過去事例' },
];

export default function TabMenu({ activeTab, onTabChange }: TabMenuProps) {
  return (
    <div className="flex mb-8 border-b">
      {tabItems.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-3 px-6 border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'text-white bg-[#B34700] border-[#B34700]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}