"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AuthState, User } from "./types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Returns a valid access token, refreshing silently if needed. */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    expiresAt: null,
  });
  // Start as false — we set it true only after the async restore settles,
  // using a ref to avoid driving renders directly inside the effect body.
  const [isLoading, setIsLoading] = useState(true);

  const refreshPromise = useRef<Promise<string | null> | null>(null);

  // Shared refresh helper — updates state and returns the new token.
  const doRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return null;
      const json = await res.json();
      const { access_token, expires_in } = json.data as {
        access_token: string;
        expires_in: number;
      };
      const expiresAt = Date.now() + expires_in * 1000;

      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const user: User | null = meRes.ok ? (await meRes.json()).data : null;

      setState({ accessToken: access_token, expiresAt, user });
      return access_token;
    } catch {
      return null;
    }
  }, []);

  // Silent restore on mount: the effect starts an async function so all
  // setState calls happen asynchronously — not synchronously in the effect
  // body — which satisfies the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    let active = true;

    async function restore() {
      await doRefresh();
      if (active) setIsLoading(false);
    }

    restore();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const getToken = useCallback(async (): Promise<string | null> => {
    if (
      state.accessToken &&
      state.expiresAt &&
      Date.now() < state.expiresAt - 30_000
    ) {
      return state.accessToken;
    }
    if (!refreshPromise.current) {
      refreshPromise.current = doRefresh().finally(() => {
        refreshPromise.current = null;
      });
    }
    return refreshPromise.current;
  }, [state.accessToken, state.expiresAt, doRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message ?? "Login failed");
    }

    const { access_token, expires_in } = json.data as {
      access_token: string;
      expires_in: number;
    };
    const expiresAt = Date.now() + expires_in * 1000;

    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user: User | null = meRes.ok ? (await meRes.json()).data : null;

    setState({ accessToken: access_token, expiresAt, user });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, accessToken: null, expiresAt: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        isLoading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
