'use client';

import React, { useState, useCallback, useRef } from 'react';

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
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'xlsx': return '📊';
      default: return '📁';
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const handleAnalysisStart = async () => {
    setIsAnalyzing(true);
    
    // 将来のAPI連携用（現在はコメントアウト）
    // const formData = new FormData();
    // files.forEach((item, index) => {
    //   formData.append(`file${index}`, item.file);
    // });
    // 
    // const response = await fetch('/api/analyze', {
    //   method: 'POST',
    //   body: formData,
    // });
    
    // 5秒のモック処理でローディング表示テスト
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('分析が完了しました。（モック処理）');
    }, 5000);
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
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
        className={`border-2 border-dashed rounded-lg p-12 text-center mb-6 transition-colors ${
          isDragOver
            ? 'border-[#B34700] bg-[#B34700]/5'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl text-gray-400">📁</div>
          <div className="space-y-2">
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
          </div>
          <p className="text-sm text-gray-500">
            ※PDF、Word、Excelファイルのファイルアップロードできます（10MB、3件まで）
          </p>
        </div>
      </div>

      {/* エラーメッセージ */}
      {errors.length > 0 && (
        <div className="mb-6">
          {errors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm mb-1">
              {error}
            </div>
          ))}
        </div>
      )}

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
                  <span className="text-2xl">{getFileIcon(item.file.name)}</span>
                  <div>
                    <p className="font-medium text-black">{item.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(item.id)}
                  className="text-gray-400 hover:text-red-500 text-xl"
                  aria-label="ファイルを削除"
                >
                  ×
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

      {/* ローディング表示 */}
      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#B34700] mb-4"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-black">Wait for it...</p>
            <p className="text-sm text-gray-600">
              アップロードされた資料を分析しています。しばらくお待ちください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadSystem;