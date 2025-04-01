/**
 * Common types used across the application
 */

// Base interface for all entities with timestamps
export interface BaseEntity {
  createdAt: string;
  updatedAt?: string;
}

// Error response from API
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
}

// Pagination response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 