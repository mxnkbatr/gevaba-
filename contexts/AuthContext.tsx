"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SecureStorage } from "@/app/capacitor/storage/secureStorage";
import {
  getItem,
  setItem,
  CACHE_KEYS,
} from "@/app/capacitor/storage/offlineStorage";

interface AuthContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { },
  logout: async () => { },
  refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: any;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser); // If no initialUser, we are loading
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();

  const fetchUser = async () => {
    // If not loaded from Clerk yet, don't execute full sync
    if (!clerkLoaded) return;
    try {
      // 1. Try to load from cache first for instant UI response
      const cached = await getItem<any>(CACHE_KEYS.USER_PROFILE);
      if (cached && !user) {
        setUser(cached);
      }

      const token = await SecureStorage.getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/auth/me", {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const freshUser = data.user;

        // Update state and cache with TTL (5 minutes)
        setUser(freshUser);
        await setItem(CACHE_KEYS.USER_PROFILE, freshUser, { ttl: 300 });
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkLoaded) {
      fetchUser();
    }
  }, [clerkUser?.id, clerkLoaded]); // Refetch if Clerk state changes

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const login = async (formData: any) => {
    // This is for CUSTOM DB login
    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Login failed");

      // Small delay to ensure Set-Cookie header is committed by browser
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh state
      await fetchUser();
      return data; // Return data for redirect logic in component
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Best-effort: remove the push token from the user record on logout.
      // The app must work without notifications; token cleanup prevents sending to stale devices.
      void fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken: null }),
        credentials: "include",
      }).catch(() => { });

      await Promise.all([
        fetch("/api/auth/logout", { method: "POST" }),
        signOut(),
      ]);
      await SecureStorage.removeToken();
      await setItem(CACHE_KEYS.USER_PROFILE, null); // Clear cache

      setUser(null);

      // Attempt to extract lang code if we had it, but default fallback
      const pathSegments = window.location.pathname.split("/");
      const lang = pathSegments[1] === "en" ? "en" : "mn";
      router.push(`/${lang}/sign-in`);
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
