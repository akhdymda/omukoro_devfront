import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploadSystem from '../FileUploadSystem';

describe('FileUploadSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders the main title and components', () => {
      render(<FileUploadSystem />);
      
      expect(screen.getByText('酒税法リスク分析判定システム')).toBeInTheDocument();
      expect(screen.getByText('ファイルをドラッグ&ドロップ')).toBeInTheDocument();
      expect(screen.getByText('ファイルを選択')).toBeInTheDocument();
      expect(screen.getByText('分析開始')).toBeInTheDocument();
    });

    test('analysis button is initially disabled', () => {
      render(<FileUploadSystem />);
      
      const analysisButton = screen.getByText('分析開始');
      expect(analysisButton).toBeDisabled();
    });
  });

  describe('Drag and Drop UI', () => {
    test('handles drag enter and leave events', () => {
      render(<FileUploadSystem />);
      
      const dropZone = screen.getByText('ファイルをドラッグ&ドロップ').closest('div');
      
      // Simulate drag enter
      fireEvent.dragEnter(dropZone!);
      expect(screen.getByText('ここにファイルをドロップしてアップロード')).toBeInTheDocument();
      
      // Simulate drag leave
      fireEvent.dragLeave(dropZone!);
      expect(screen.getByText('ファイルをドラッグ&ドロップ')).toBeInTheDocument();
    });

    test('handles drag over event', () => {
      render(<FileUploadSystem />);
      
      const dropZone = screen.getByText('ファイルをドラッグ&ドロップ').closest('div');
      
      // Simulate drag over (should not throw error)
      expect(() => fireEvent.dragOver(dropZone!)).not.toThrow();
    });
  });

  describe('File Upload Interface', () => {
    test('has hidden file input with correct attributes', () => {
      render(<FileUploadSystem />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.pdf,.docx,.xlsx');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveClass('hidden');
    });

    test('file input opens when button is clicked', () => {
      render(<FileUploadSystem />);
      
      const button = screen.getByText('ファイルを選択');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Mock the click method
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      fireEvent.click(button);
      
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockRestore();
    });
  });

  describe('File Display Area', () => {
    test('shows helper text when no files uploaded', () => {
      render(<FileUploadSystem />);
      
      expect(screen.getByText(/PDF、Word、Excelファイルのファイルアップロードできます/)).toBeInTheDocument();
      expect(screen.getByText(/10MB、3件まで/)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('renders tab navigation correctly', () => {
      render(<FileUploadSystem />);
      
      expect(screen.getByText('AI相談')).toBeInTheDocument();
      expect(screen.getByText('資料で分析')).toBeInTheDocument();
      expect(screen.getByText('過去事例')).toBeInTheDocument();
      
      // Check that "資料で分析" is the active tab
      const activeTab = screen.getByText('資料で分析');
      expect(activeTab).toHaveClass('bg-[#B34700]');
    });
  });

  describe('Main Content', () => {
    test('displays main instruction text', () => {
      render(<FileUploadSystem />);
      
      expect(screen.getByText('事業計画書や関連資料をアップロードしてリスク分析を行います')).toBeInTheDocument();
    });
  });
});