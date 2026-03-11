import api from './api';
import { deriveHash } from './cryptoUtils';
import { getKdfSalt } from './authService';

export async function getUserInfo() {
    const { data } = await api.get('/user/me');
    return data;
}

export async function changePassword(
    email: string,
    currentPassword: string,
    newPassword: string
) {
    const currentSaltBytes = await getKdfSalt(email);
    const currentPasswordHash = await deriveHash(currentPassword, currentSaltBytes);

    // Generate fresh KDF salt for new password
    const newSaltBytes = crypto.getRandomValues(new Uint8Array(16));
    const newPasswordHash = await deriveHash(newPassword, newSaltBytes);
    const newKdfSalt = btoa(String.fromCharCode(...newSaltBytes));

    await api.post('/user/change-password', {
        currentPasswordHash,
        newPasswordHash,
        newKdfSalt,
    });
}

export async function changeEmail(email: string, password: string, newEmail: string) {
    const saltBytes = await getKdfSalt(email);
    const passwordHash = await deriveHash(password, saltBytes);
    await api.post('/user/change-email', { newEmail, passwordHash });
}

export async function verifyEmailChange(token: string) {
    await api.post('/auth/verify-email-change', { token });
}

export async function deleteAccount(email: string, password: string) {
    const saltBytes = await getKdfSalt(email);
    const passwordHash = await deriveHash(password, saltBytes);
    await api.post('/user/delete-account', { password: passwordHash });
}
