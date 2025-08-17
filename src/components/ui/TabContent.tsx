'use client';

import FileUploadSystem from '@/components/FileUploadSystem';
import ConsultationSearch from '@/components/ConsultationSearch';
import ConsultationSuggestion from '@/components/ConsultationSuggestion';
import TextAnalysis from '@/components/TextAnalysis';
import type { TabType } from '@/types';

interface TabContentProps {
  activeTab: TabType;
}

interface TabSection {
  title: string;
  description: string;
  content: React.ReactNode;
}

const tabSections: Record<TabType, TabSection> = {
  'ai-consultation': {
    title: 'AI相談機能',
    description: '酒税法に関する質問をテキストで入力し、AIによる分析と相談提案を受けられます',
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TextAnalysis />
        <ConsultationSuggestion />
      </div>
    ),
  },
  'document-analysis': {
    title: '資料分析機能',
    description: '事業計画書や関連資料をアップロードしてリスク分析を行います',
    content: <FileUploadSystem />,
  },
  'past-cases': {
    title: '過去事例検索',
    description: '過去の相談事例を検索して、類似ケースを参考にできます',
    content: <ConsultationSearch />,
  },
};

export default function TabContent({ activeTab }: TabContentProps) {
  const section = tabSections[activeTab];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {section.title}
        </h2>
        <p className="text-gray-600">
          {section.description}
        </p>
      </div>
      {section.content}
    </div>
  );
}