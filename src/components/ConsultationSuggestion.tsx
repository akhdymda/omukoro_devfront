'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { consultationApi } from '@/lib/api';
import { useMasterData } from '@/contexts/MasterDataContext';
import type { ConsultationSuggestion, AnalysisRequest } from '@/types';

interface ConsultationSuggestionProps {
  initialText?: string;
}

export default function ConsultationSuggestionComponent({ initialText = '' }: ConsultationSuggestionProps) {
  const { industries, alcoholTypes } = useMasterData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [request, setRequest] = useState<AnalysisRequest>({
    text: initialText,
    industry_id: '',
    alcohol_type_id: '',
  });
  const [suggestions, setSuggestions] = useState<ConsultationSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 提案生成
  const handleGenerateSuggestions = async () => {
    if (!request.text.trim()) {
      setError('分析するテキストを入力してください');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const suggestionsData = await consultationApi.generateSuggestions(request);
      setSuggestions(suggestionsData);
    } catch (err) {
      console.error('相談提案の生成に失敗しました:', err);
      setError(err instanceof Error ? err.message : '提案の生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // リクエストパラメータ更新
  const updateRequest = (updates: Partial<AnalysisRequest>) => {
    setRequest(prev => ({ ...prev, ...updates }));
  };

  // 信頼度に基づく色の取得
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // 信頼度のラベル取得
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#B34700]" />
          <h2 className="text-lg font-semibold text-gray-900">相談提案生成</h2>
        </div>

        {/* 入力フォーム */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分析対象テキスト *
            </label>
            <textarea
              value={request.text}
              onChange={(e) => updateRequest({ text: e.target.value })}
              placeholder="酒税法に関連する企画や事業内容を入力してください..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業界 (任意)
              </label>
              <select
                value={request.industry_id || ''}
                onChange={(e) => updateRequest({ industry_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
              >
                <option value="">業界を選択</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                酒類 (任意)
              </label>
              <select
                value={request.alcohol_type_id || ''}
                onChange={(e) => updateRequest({ alcohol_type_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
              >
                <option value="">酒類を選択</option>
                {alcoholTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || !request.text.trim()}
            className="w-full px-4 py-2 bg-[#B34700] hover:bg-[#FB8F44] text-white rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                提案を生成中...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                相談提案を生成
              </>
            )}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 提案結果 */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              生成された相談提案 ({suggestions.length}件)
            </h3>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">提案 {index + 1}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      信頼度: {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">提案内容:</h5>
                      <p className="text-gray-600 text-sm leading-relaxed">{suggestion.suggestion}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">根拠:</h5>
                      <p className="text-gray-600 text-sm leading-relaxed">{suggestion.reasoning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}