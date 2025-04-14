import { BaseEntity } from './common';

/**
 * User-related types
 */

// Roles in the system
export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
}

// User model
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  sex?: string;
  age?: number;
  role: string;
  created_at: string;
  updated_at: string;
}

// User registration request
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

// User update request
export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_picture_url?: string | null;
  sex?: string;
  age?: number | null;
}

// Authentication response
export interface AuthResponse {
  user: User;
  token: string;
}

// Login request
export interface LoginRequest {
  username: string;
  password: string;
}

// User with token model for auth context
export interface UserWithToken {
  user: User | null;
  token: string | null;
} 