import api from "./api";
import {cryptoStore,encrypt,decrypt } from './cryptoUtils';


export async function getVaultItems() {
    const { data } = await api.get('/vault/items');
    const vaultKey = cryptoStore.getVaultKey();
    if (!vaultKey) {
        throw new Error("Vault key not found");
    }
    // Decrypt each item before returning
    const decryptedItems = await Promise.all(data.map(async (item: any) => {
        const decryptedPassword = await decrypt(item.password, item.iv);
        return {
            ...item,
            password: decryptedPassword
        };
    }));
    return decryptedItems;
}

export async function addVaultItem(item: { title: string; password: string; url: string; notes: string; category: string }) {
    const encrypted = await encrypt(item.password);
    const payload = {
        title: item.title,
        password: encrypted.ciphertext,
        iv: encrypted.iv,
        url: item.url,
        notes: item.notes,
        category: item.category,
    };
    const { data } = await api.post('/vault/items', payload);
    return data;
}

export async function deleteVaultItem(id: number) {
    await api.delete(`/vault/items/${id}`);
}
