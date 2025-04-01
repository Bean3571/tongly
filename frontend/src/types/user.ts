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
export interface User extends BaseEntity {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  sex?: string;
  age?: number;
  role: UserRole;
}

// User registration request
export interface UserRegistrationRequest {
  username: string;
  password: string; // Note: Changed from passwordHash for frontend use
  email: string;
  role: UserRole;
}

// User update request
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  sex?: string;
  age?: number;
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