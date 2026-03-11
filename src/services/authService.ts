import api from './api';
import { deriveHash, deriveKey,cryptoStore } from './cryptoUtils';



export async function getKdfSalt(email: string): Promise<Uint8Array> {
    const { data: saltData } = await api.post('auth/get-salt', { email });
    return Uint8Array.from(atob(saltData.kdfSalt), c => c.charCodeAt(0));
}

export async function login(email: string, password: string) {
    const saltBytes = await getKdfSalt(email);
    const passwordHash = await deriveHash(password, saltBytes);

    const vaultKey = await deriveKey(password, saltBytes);

    const { data } = await api.post('/auth/login', { email, passwordHash });

    // If 2FA is required, carry the vault key for use after verification
    if (data.requiresTwoFactor) return { ...data, _vaultKey: vaultKey };

    cryptoStore.setVaultKey(vaultKey);
    return { ...data, _vaultKey: vaultKey }; // carry key for AuthContext
}

export async function completeTwoFactorLogin(pendingToken: string, code: string, vaultKey: CryptoKey) {
    const { data } = await api.post('/auth/verify-2fa', { pendingToken, code });
    cryptoStore.setVaultKey(vaultKey);
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

export async function resendVerificationEmail(email: string) {
    await api.post('/auth/resend-verification', { email });
}

export async function verifyEmail(token: string) {
    await api.post('/auth/verify-email', { token });
}

export async function getTwoFactorSetup() {
    const { data } = await api.get('/auth/2fa/setup');
    return data as { secret: string; qrUri: string };
}

export async function enableTwoFactor(code: string): Promise<string[]> {
    const { data } = await api.post('/auth/2fa/enable', { code });
    return data.backupCodes as string[];
}

export async function disableTwoFactor(code: string) {
    await api.post('/auth/2fa/disable', { code });
}

export async function forgotPassword(email: string) {
    await api.post('/auth/forgot-password', { email });
}

export async function confirmResetPassword(token: string, newPassword: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const newPasswordHash = await deriveHash(newPassword, salt);
    await api.post('/auth/reset-password', { token, newPasswordHash, newKdfSalt: saltBase64 });
}

export async function loginWithBackupCode(pendingToken: string, code: string, vaultKey: CryptoKey) {
    const { data } = await api.post('/auth/2fa/use-backup-code', { pendingToken, code });
    cryptoStore.setVaultKey(vaultKey);
    return data;
}

export async function regenerateBackupCodes(): Promise<string[]> {
    const { data } = await api.post('/auth/2fa/backup-codes/regenerate');
    return data.backupCodes;
}

