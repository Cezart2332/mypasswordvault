import api from './api';
import { deriveHash, deriveKey,cryptoStore } from './cryptoUtils';



export async function login(email: string, password: string) {
    const { data: saltData } = await api.post('auth/get-salt', { email });
    const saltBytes = Uint8Array.from(atob(saltData.kdfSalt), c => c.charCodeAt(0));
    const passwordHash = await deriveHash(password, saltBytes);


    const vaultKey = await deriveKey(password, saltBytes);

    const { data } = await api.post('/auth/login', { email, passwordHash });

    cryptoStore.setVaultKey(vaultKey); // Store the derived key for later use in encryption/decryption   
    return data;
}

export async function register(username: string, email: string, password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const passwordHash = await deriveHash(password, salt);
    const vaultKey = await deriveKey(password, salt);
    const { data } = await api.post('/auth/register', { username, email, passwordHash, kdfSalt: saltBase64 });
    cryptoStore.setVaultKey(vaultKey); // Store the derived key for later use in encryption/decryption
    return data;
}

export async function refreshToken() {
    const { data } = await api.post('/auth/refresh');
    return data;
}

export async function logout() {
    await api.post('/auth/logout');
    cryptoStore.clear(); // Clear the stored key on logout
}

