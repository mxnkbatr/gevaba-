"use client";

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

/**
 * Secure storage for sensitive data (tokens, credentials).
 *
 * NOTE: For high security, use a native secure storage plugin (Keychain/Keystore).
 *
 * Current implementation:
 * - Native: Uses Capacitor Preferences (device storage)
 * - Web: Uses sessionStorage (NOT secure, only for development)
 */


/**
 * Save sensitive data to secure storage
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setSecure(key: string, value: string): Promise<void> {
    if (isNative) {
        try {
            await Preferences.set({ key: `secure_${key}`, value });
        } catch (error) {
            console.error('Secure storage set failed:', error);
            throw error;
        }
    } else {
        // Web fallback - NOT SECURE, only for development
        console.warn('Using insecure sessionStorage - ONLY FOR DEVELOPMENT');
        sessionStorage.setItem(key, value);
    }
}

/**
 * Get sensitive data from secure storage
 * @param key - Storage key
 * @returns Stored value or null if not found
 */
export async function getSecure(key: string): Promise<string | null> {
    if (isNative) {
        try {
            const result = await Preferences.get({ key: `secure_${key}` });
            if (!result.value) return null;
            return result.value;
        } catch (error) {
            return null;
        }
    } else {
        // Web fallback
        return sessionStorage.getItem(key);
    }
}

/**
 * Remove sensitive data from secure storage
 * @param key - Storage key
 */
export async function removeSecure(key: string): Promise<void> {
    if (isNative) {
        try {
            await Preferences.remove({ key: `secure_${key}` });
        } catch (error) {
            console.error('Secure storage remove failed:', error);
        }
    } else {
        sessionStorage.removeItem(key);
    }
}

/**
 * Clear all secure storage
 */
export async function clearSecure(): Promise<void> {
    if (isNative) {
        try {
            const { keys } = await Preferences.keys();
            for (const key of keys) {
                if (key.startsWith('secure_')) {
                    await Preferences.remove({ key });
                }
            }
        } catch (error) {
            console.error('Secure storage clear failed:', error);
        }
    } else {
        sessionStorage.clear();
    }
}

// Secure storage keys
export const SECURE_KEYS = {
    AUTH_TOKEN: 'secure_auth_token',
    REFRESH_TOKEN: 'secure_refresh_token',
    USER_CREDENTIALS: 'secure_user_credentials',
    API_KEY: 'secure_api_key',
} as const;

/**
 * Save authentication token securely
 */
export async function saveAuthToken(token: string): Promise<void> {
    await setSecure(SECURE_KEYS.AUTH_TOKEN, token);
}

/**
 * Get authentication token
 */
export async function getAuthToken(): Promise<string | null> {
    return await getSecure(SECURE_KEYS.AUTH_TOKEN);
}

/**
 * Remove authentication token
 */
export async function removeAuthToken(): Promise<void> {
    await removeSecure(SECURE_KEYS.AUTH_TOKEN);
}

/**
 * Save refresh token securely
 */
export async function saveRefreshToken(token: string): Promise<void> {
    await setSecure(SECURE_KEYS.REFRESH_TOKEN, token);
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
    return await getSecure(SECURE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
    await removeSecure(SECURE_KEYS.AUTH_TOKEN);
    await removeSecure(SECURE_KEYS.REFRESH_TOKEN);
}

export const SecureStorage = {
    getToken: getAuthToken,
    setToken: saveAuthToken,
    removeToken: removeAuthToken
};
