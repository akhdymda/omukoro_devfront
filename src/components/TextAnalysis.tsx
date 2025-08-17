'use client';

import { useState } from 'react';
import { FileText, Loader2, AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { analysisApi } from '@/lib/api';
import { useMasterData } from '@/contexts/MasterDataContext';
import type { AnalysisRequest, AnalysisResult } from '@/types';

interface TextAnalysisProps {
  initialText?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function TextAnalysis({ initialText = '', onAnalysisComplete }: TextAnalysisProps) {
  const { industries, alcoholTypes } = useMasterData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [request, setRequest] = useState<AnalysisRequest>({
    text: initialText,
    industry_id: '',
    alcohol_type_id: '',
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 分析実行
  const handleAnalyze = async () => {
    if (!request.text.trim()) {
      setError('分析するテキストを入力してください');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      const analysisResult = await analysisApi.analyzeText(request);
      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      console.error('テキスト分析に失敗しました:', err);
      setError(err instanceof Error ? err.message : '分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // リクエストパラメータ更新
  const updateRequest = (updates: Partial<AnalysisRequest>) => {
    setRequest(prev => ({ ...prev, ...updates }));
  };

  // リスクレベルに基づくアイコンと色の取得
  const getRiskLevelDisplay = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'text-green-600 bg-green-50 border-green-200',
          label: '低リスク',
        };
      case 'medium':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          label: '中リスク',
        };
      case 'high':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'text-red-600 bg-red-50 border-red-200',
          label: '高リスク',
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          label: '不明',
        };
    }
  };

  // スコアに基づく色の取得
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#B34700]" />
          <h2 className="text-lg font-semibold text-gray-900">テキスト分析</h2>
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
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {request.text.length} 文字
            </p>
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
            onClick={handleAnalyze}
            disabled={isAnalyzing || !request.text.trim()}
            className="w-full px-4 py-2 bg-[#B34700] hover:bg-[#FB8F44] text-white rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                分析を開始
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

        {/* 分析結果 */}
        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">分析結果</h3>
            
            {/* スコアとリスクレベル */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">分析スコア</span>
                  <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}/100
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      result.score >= 80 ? 'bg-green-500' :
                      result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-md">
                {(() => {
                  const display = getRiskLevelDisplay(result.risk_level);
                  return (
                    <div className={`flex items-center gap-2 p-2 rounded-md border ${display.color}`}>
                      {display.icon}
                      <span className="font-medium">{display.label}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 分析詳細 */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">分析詳細</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{result.analysis}</p>
              </div>

              {/* 推奨事項 */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">推奨事項</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}