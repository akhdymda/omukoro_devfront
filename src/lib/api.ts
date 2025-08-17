// バックエンドAPI統合のための改良されたAPIクライアント

import type { 
  ApiResponse, 
  RequestConfig, 
  HttpMethod,
  Industry,
  AlcoholType,
  MasterDataItem,
  Consultation,
  ConsultationSearchParams,
  ConsultationSuggestion,
  AnalysisRequest,
  AnalysisResult,
  ExtractTextResult,
  ApiError
} from '@/types';

// 設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30000; // 30秒

// カスタムエラークラス
export class ApiClientError extends Error {
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly statusCode?: number;

  constructor(message: string, errorCode: string = 'UNKNOWN_ERROR', statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
  }
}


// タイムアウト付きfetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('リクエストがタイムアウトしました', 'TIMEOUT_ERROR');
    }
    throw error;
  }
}

// 改良されたAPIリクエスト関数
async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT
  } = config;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // ボディがFormDataでない場合のみJSONに変換
  if (body !== undefined) {
    if (body instanceof FormData) {
      delete (requestHeaders as any)['Content-Type']; // FormDataの場合はContent-Typeを削除
      requestInit.body = body;
    } else {
      requestInit.body = JSON.stringify(body);
    }
  }

  try {
    console.log(`API Request: ${method} ${url}`);
    
    const response = await fetchWithTimeout(url, requestInit, timeout);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiClientError(
        errorData.error?.message || `HTTP Error ${response.status}`,
        errorData.error?.error_code || 'HTTP_ERROR',
        response.status,
        errorData.error?.details
      );
    }

    const data: ApiResponse<T> = await response.json();
    
    // 新しいAPIレスポンス形式に対応
    if (data.success === false && data.error) {
      throw new ApiClientError(
        data.error.message,
        data.error.error_code,
        response.status,
        data.error.details
      );
    }

    return data.data as T;
  } catch (error) {
    console.error(`API request failed: ${method} ${endpoint}`, error);
    
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new ApiClientError(
        'ネットワークエラーが発生しました。接続を確認してください。',
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiClientError(
      '予期しないエラーが発生しました',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}

// データ変換ヘルパー
function convertIndustryToMasterData(industry: Industry): MasterDataItem {
  return {
    id: industry.category_id,
    name: industry.category_name,
    description: industry.description,
  };
}

function convertAlcoholTypeToMasterData(alcoholType: AlcoholType): MasterDataItem {
  return {
    id: alcoholType.type_id,
    name: alcoholType.type_name,
    description: alcoholType.description,
  };
}

// マスタデータ専用のAPIリクエスト関数（現在のレスポンス形式に対応）
async function masterDataRequest<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`Master Data API Request: GET ${url}`);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, DEFAULT_TIMEOUT);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiClientError(
        errorData.error?.message || `HTTP Error ${response.status}`,
        errorData.error?.error_code || 'HTTP_ERROR',
        response.status,
        errorData.error?.details
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`Master Data API request failed: GET ${endpoint}`, error);
    
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new ApiClientError(
        'ネットワークエラーが発生しました。接続を確認してください。',
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiClientError(
      '予期しないエラーが発生しました',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}

// マスタデータAPI
export const masterDataApi = {
  // 業界一覧取得
  getIndustries: async (): Promise<MasterDataItem[]> => {
    const response = await masterDataRequest<{ industries: Industry[] }>('/api/master/industries');
    return response.industries.map(convertIndustryToMasterData);
  },

  // 酒類一覧取得
  getAlcoholTypes: async (): Promise<MasterDataItem[]> => {
    const response = await masterDataRequest<{ alcohol_types: AlcoholType[] }>('/api/master/alcohol-types');
    return response.alcohol_types.map(convertAlcoholTypeToMasterData);
  },
};

// 相談関連API
export const consultationApi = {
  // 相談一覧取得
  getConsultations: async (params?: ConsultationSearchParams): Promise<Consultation[]> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.industry_id) queryParams.append('industry_id', params.industry_id);
    if (params?.alcohol_type_id) queryParams.append('alcohol_type_id', params.alcohol_type_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const endpoint = `/api/consultations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<{ consultations: Consultation[] }>(endpoint);
    return response.consultations || [];
  },

  // 相談検索
  searchConsultations: async (params: ConsultationSearchParams): Promise<Consultation[]> => {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.industry_id) queryParams.append('industry_id', params.industry_id);
    if (params.alcohol_type_id) queryParams.append('alcohol_type_id', params.alcohol_type_id);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await apiRequest<Consultation[]>(`/api/consultations/search?${queryParams.toString()}`);
    return Array.isArray(response) ? response : [];
  },

  // 相談提案生成
  generateSuggestions: async (request: AnalysisRequest): Promise<ConsultationSuggestion[]> => {
    const formData = new FormData();
    formData.append('text', request.text);
    if (request.industry_id) formData.append('industry_id', request.industry_id);
    if (request.alcohol_type_id) formData.append('alcohol_type_id', request.alcohol_type_id);
    
    const response = await apiRequest<ConsultationSuggestion[]>('/api/consultations/generate-suggestions', {
      method: 'POST',
      body: formData,
    });
    return Array.isArray(response) ? response : [];
  },
};

// 分析関連API
export const analysisApi = {
  // テキスト分析
  analyzeText: async (request: AnalysisRequest): Promise<AnalysisResult> => {
    const response = await apiRequest<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: request,
    });
    return response;
  },

  // テキスト抽出
  extractText: async (file: File): Promise<ExtractTextResult> => {
    const formData = new FormData();
    formData.append('files[]', file);
    
    const response = await apiRequest<{ extractedText: string; files: any[] }>('/api/extract_text', {
      method: 'POST',
      body: formData,
    });
    
    return {
      text: response.extractedText,
      confidence: 1.0, // バックエンドから返されない場合のデフォルト値
      pages: response.files?.length || 1,
    };
  },
};