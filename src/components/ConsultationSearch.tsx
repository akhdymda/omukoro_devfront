'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { consultationApi } from '@/lib/api';
import { useMasterData } from '@/contexts/MasterDataContext';
import type { Consultation, ConsultationSearchParams } from '@/types';

interface ConsultationSearchProps {
  onResultsChange?: (results: Consultation[]) => void;
}

export default function ConsultationSearch({ onResultsChange }: ConsultationSearchProps) {
  const { industries, alcoholTypes, isLoading: masterDataLoading } = useMasterData();
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState<ConsultationSearchParams>({
    keyword: '',
    industry_id: '',
    alcohol_type_id: '',
    limit: 20,
  });
  const [results, setResults] = useState<Consultation[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索実行
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      
      const searchData = await consultationApi.searchConsultations(searchParams);
      setResults(searchData);
      onResultsChange?.(searchData);
    } catch (err) {
      console.error('相談検索に失敗しました:', err);
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (!masterDataLoading) {
      handleSearch();
    }
  }, [masterDataLoading]);

  // 検索パラメータ更新
  const updateSearchParams = (updates: Partial<ConsultationSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...updates }));
  };

  // エンターキーでの検索実行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* 検索バー */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="相談内容で検索..."
              value={searchParams.keyword || ''}
              onChange={(e) => updateSearchParams({ keyword: e.target.value })}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            フィルター
          </button>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-[#B34700] hover:bg-[#FB8F44] text-white rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            検索
          </button>
        </div>

        {/* フィルター */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業界
              </label>
              <select
                value={searchParams.industry_id || ''}
                onChange={(e) => updateSearchParams({ industry_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
              >
                <option value="">すべての業界</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                酒類
              </label>
              <select
                value={searchParams.alcohol_type_id || ''}
                onChange={(e) => updateSearchParams({ alcohol_type_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B34700] focus:border-transparent"
              >
                <option value="">すべての酒類</option>
                {alcoholTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 検索結果 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              検索結果 ({results.length}件)
            </h3>
          </div>

          {results.length === 0 && !isSearching ? (
            <div className="text-center py-8 text-gray-500">
              <p>該当する相談が見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{consultation.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      consultation.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : consultation.status === 'analyzed'
                        ? 'bg-blue-100 text-blue-800'
                        : consultation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {consultation.status === 'pending' ? '待機中' 
                       : consultation.status === 'analyzed' ? '分析済み'
                       : consultation.status === 'completed' ? '完了'
                       : consultation.status === 'archived' ? 'アーカイブ済み'
                       : consultation.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{consultation.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>作成日: {new Date(consultation.created_at).toLocaleDateString('ja-JP')}</span>
                    <span>ID: {consultation.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}