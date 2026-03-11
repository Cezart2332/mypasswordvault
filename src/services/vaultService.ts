import api from "./api";
import { cryptoStore, encrypt, decrypt } from './cryptoUtils';

interface VaultFields {
    title: string;
    username: string;
    url: string;
    notes: string;
    category: string;
    password: string;
}

export async function getVaultItems() {
    const { data } = await api.get('/vault/items');
    const vaultKey = cryptoStore.getVaultKey();
    if (!vaultKey) {
        throw new Error("Vault key not found");
    }
    return Promise.all(data.map(async (item: any) => {
        const plaintext = await decrypt(item.encryptedData, item.dataIv);
        const fields: VaultFields = JSON.parse(plaintext);
        return {
            id: item.id,
            isFavorite: item.isFavorite,
            createdAt: item.createdAt,
            ...fields,
        };
    }));
}

export async function addVaultItem(item: { title: string; password: string; username?: string; url: string; notes: string; category: string; isFavorite?: boolean }) {
    const fields: VaultFields = {
        title: item.title,
        username: item.username ?? '',
        url: item.url,
        notes: item.notes,
        category: item.category,
        password: item.password,
    };
    const { ciphertext, iv } = await encrypt(JSON.stringify(fields));
    const { data } = await api.post('/vault/items', {
        encryptedData: ciphertext,
        dataIv: iv,
        isFavorite: item.isFavorite ?? false,
    });
    return data;
}

export async function deleteVaultItem(id: number) {
    await api.delete(`/vault/items/${id}`);
}

export async function updateVaultItem(id: number, updates: { title: string; password: string; username?: string; url: string; notes: string; category: string; isFavorite?: boolean }) {
    const fields: VaultFields = {
        title: updates.title,
        username: updates.username ?? '',
        url: updates.url,
        notes: updates.notes,
        category: updates.category,
        password: updates.password,
    };
    const { ciphertext, iv } = await encrypt(JSON.stringify(fields));
    const { data } = await api.put(`/vault/items/${id}`, {
        encryptedData: ciphertext,
        dataIv: iv,
        isFavorite: updates.isFavorite ?? false,
    });
    return data;
}