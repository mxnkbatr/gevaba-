import { getItem, setItem } from "@/app/capacitor/storage/offlineStorage";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/**
 * Enhanced fetch utility that handles offline caching and fallbacks.
 * 
 * 1. Tries to fetch fresh data from the network.
 * 2. If successful, updates the persistent cache with defined TTL.
 * 3. If the network fails, attempts to retrieve the latest valid data from cache.
 * 4. Returns the found data or throws an error if neither are available.
 */
export async function fetchWithFallback<T>(
    url: string,
    cacheKey: string,
    ttl: number = 300, // Default 5 minutes
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Background cache update
        await setItem(cacheKey, data, { ttl });
        
        return data;
    } catch (networkError) {
        console.warn(`[Network Fallback] Fetch failed for ${url}, checking cache:`, networkError);
        
        const cachedContent = await getItem<T>(cacheKey);
        
        if (cachedContent !== null) {
            return cachedContent;
        }

        // Translation fallback (Hardcoded here for simplicity, or we could pass t)
        const isMn = typeof window !== 'undefined' && window.location.pathname.includes('/mn');
        const errorMessage = isMn 
            ? "Сүлжээгүй байна. Дахин оролдоно уу."
            : "No internet connection and no cached data found.";
            
        throw new Error(errorMessage);
    }
}

export async function fetchWithSessionCache(url: string, ttlMins: number = 10): Promise<Response> {
    if (typeof window === 'undefined') return fetch(url);
    const cacheKey = `sess_cache_${url}`;
    const isNative = Capacitor.isNativePlatform();
    const cached = isNative
        ? (await Preferences.get({ key: cacheKey })).value
        : sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < ttlMins * 60 * 1000) {
                return new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (e) {
            if (isNative) {
                await Preferences.remove({ key: cacheKey });
            } else {
                sessionStorage.removeItem(cacheKey);
            }
        }
    }
    const req = await fetch(url);
    if (req.ok) {
        req.clone().json().then(data => {
            const value = JSON.stringify({ data, timestamp: Date.now() });
            if (isNative) {
                void Preferences.set({ key: cacheKey, value });
            } else {
                sessionStorage.setItem(cacheKey, value);
            }
        }).catch(err => console.error('Cache write error:', err));
    }
    return req;
}
