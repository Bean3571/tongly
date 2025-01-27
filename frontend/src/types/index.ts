export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    email: string;
    role: 'student' | 'tutor';
} 