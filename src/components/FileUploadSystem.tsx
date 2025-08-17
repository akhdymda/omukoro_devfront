'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Paperclip, FileText, FileSpreadsheet, File, X, AlertTriangle, Beer } from 'lucide-react';

interface FileUploadItem {
  file: File;
  id: string;
}

interface FileUploadSystemProps {
  className?: string;
}

const FileUploadSystem: React.FC<FileUploadSystemProps> = ({ className = '' }) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': 
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx': 
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xlsx': 
        return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
      default: 
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    // ファイル形式チェック
    const isValidType = Object.keys(ALLOWED_TYPES).includes(file.type) ||
      Object.values(ALLOWED_TYPES).flat().some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      return `「${file.name}」はサポートされていない形式です。PDF、Word、Excelファイルのみアップロードできます。`;
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return `「${file.name}」のファイルサイズが10MBを超えています。`;
    }

    // 重複チェック
    if (files.some(item => item.file.name === file.name)) {
      return `「${file.name}」は既にアップロード済みです。`;
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // 最大件数チェック
    if (files.length + fileArray.length > MAX_FILES) {
      newErrors.push('ファイルは最大3件までアップロードできます。');
      setErrors(newErrors);
      return;
    }

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const newFileItems: FileUploadItem[] = validFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`
    }));

    setFiles(prev => [...prev, ...newFileItems]);
    setErrors([]);
  }, [files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
    setErrors([]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only reset if we're leaving the entire drop zone, not just moving between child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const handleAnalysisStart = async () => {
    setIsAnalyzing(true);
    setErrors([]);
    
    try {
      // 各ファイルのテキスト抽出を実行
      const extractionPromises = files.map(async (fileItem) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/extract_text`, {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('file', fileItem.file);
              return formData;
            })(),
          });

          if (!response.ok) {
            throw new Error(`ファイル「${fileItem.file.name}」の処理に失敗しました`);
          }

          const result = await response.json();
          return {
            fileName: fileItem.file.name,
            text: result.data?.text || '',
            confidence: result.data?.confidence || 0,
            success: true,
          };
        } catch (error) {
          console.error(`ファイル処理エラー (${fileItem.file.name}):`, error);
          return {
            fileName: fileItem.file.name,
            text: '',
            confidence: 0,
            success: false,
            error: error instanceof Error ? error.message : '処理に失敗しました',
          };
        }
      });

      const results = await Promise.all(extractionPromises);
      
      // エラーチェック
      const failedFiles = results.filter(result => !result.success);
      if (failedFiles.length > 0) {
        const errorMessages = failedFiles.map(file => file.error || `${file.fileName}の処理に失敗しました`);
        setErrors(errorMessages);
        setIsAnalyzing(false);
        return;
      }

      // 成功した場合の処理
      const extractedTexts = results
        .filter(result => result.success && result.text.trim())
        .map(result => `【${result.fileName}】\n${result.text}`)
        .join('\n\n');

      if (!extractedTexts.trim()) {
        setErrors(['アップロードされたファイルからテキストを抽出できませんでした。']);
        setIsAnalyzing(false);
        return;
      }

      // テキスト抽出成功時の表示（実際のアプリでは分析画面に遷移など）
      alert(`テキスト抽出が完了しました。\n\n抽出されたテキスト:\n${extractedTexts.substring(0, 200)}${extractedTexts.length > 200 ? '...' : ''}`);
      
      // 完了後にファイルリストをクリア
      setFiles([]);
      
    } catch (error) {
      console.error('分析処理でエラーが発生しました:', error);
      setErrors([error instanceof Error ? error.message : '分析処理でエラーが発生しました']);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto pb-12 ${className}`}>
      {/* ヘッダー */}
      <div className="bg-black text-white py-4 px-6 mb-8">
        <h1 className="text-xl font-bold text-left">酒税法リスク分析判定システム</h1>
      </div>

      {/* タブメニュー */}
      <div className="flex mb-8 border-b">
        <button className="py-3 px-6 text-gray-500 border-b-2 border-transparent">
          AI相談
        </button>
        <button className="py-3 px-6 text-white bg-[#B34700] border-b-2 border-[#B34700]">
          資料で分析
        </button>
        <button className="py-3 px-6 text-gray-500 border-b-2 border-transparent">
          過去事例
        </button>
      </div>

      {/* メインタイトル */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-medium text-black mb-2">
          事業計画書や関連資料をアップロードしてリスク分析を行います
        </h2>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center mb-6 transition-all duration-300 min-h-[300px] ${
          isDragOver
            ? 'border-[#FB8F44] bg-[#FB8F44]/10'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <Paperclip className={`w-12 h-12 ${isDragOver ? 'text-[#FB8F44]' : 'text-gray-400'}`} />
          
          <div className="space-y-2 text-center mt-4 mb-4 h-[120px] flex flex-col justify-center">
            {isDragOver ? (
              <p className="text-lg font-medium text-[#B34700]">
                ここにファイルをドロップしてアップロード
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-black">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-gray-500">または</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#B34700] hover:bg-[#FB8F44] text-white px-6 py-2 rounded transition-colors"
                >
                  ファイルを選択
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            ※PDF、Word、Excelファイルのファイルアップロードできます（10MB、3件まで）
          </p>
        </div>

        {/* エラーメッセージをドロップエリア内に表示 */}
        {errors.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            {errors.map((error, index) => (
              <div key={index} className="text-red-600 text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アップロード済みファイル一覧 */}
      {files.length > 0 && (
        <div className="mb-6">
          <div className="space-y-3">
            {files.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(item.file.name)}
                  <div>
                    <p className="font-medium text-black">{item.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(item.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  aria-label="ファイルを削除"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分析開始ボタン */}
      <div className="text-center mb-8">
        <button
          onClick={handleAnalysisStart}
          disabled={files.length === 0 || isAnalyzing}
          className={`px-8 py-3 rounded text-white font-medium transition-colors ${
            files.length === 0 || isAnalyzing
              ? 'bg-[#5A5552] cursor-not-allowed'
              : 'bg-[#B34700] hover:bg-[#FB8F44]'
          }`}
        >
          {isAnalyzing ? '分析中...' : '分析開始'}
        </button>
      </div>

      {/* ローディングオーバーレイ */}
      {isAnalyzing && (
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
              <h3 className="text-lg font-medium text-black mb-2">分析中...</h3>
              <p className="text-sm text-gray-600">
                アップロードされた資料を分析しています。<br />
                しばらくお待ちください。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadSystem;