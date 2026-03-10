// Auth types
export interface User {
    id: number;
    email: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

