let vaultKey: CryptoKey | null = null;

export const cryptoStore = {
    setVaultKey(key: CryptoKey) {
        vaultKey = key;
    },

    getVaultKey() {
        return vaultKey;
    },

    clear() {
        vaultKey = null;
    }
};


export function generateSalt(length = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export async function deriveHash(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600_000, 
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// dacă vrei AES
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string) {
  const key = cryptoStore.getVaultKey();
  if (!key) throw new Error("Vault locked");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decrypt(ciphertext: string, iv: string) {
  const key = cryptoStore.getVaultKey();
  if (!key) throw new Error("Vault locked");

  const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}