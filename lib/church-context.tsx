"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const COOKIE_NAME = "currentChurchId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface ChurchOption {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  isSponsored: boolean;
}

interface ChurchContextValue {
  churches: ChurchOption[];
  selectedChurchId: string | null;
  setSelectedChurchId: (churchId: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  currentChurch: ChurchOption | undefined;
}

const ChurchContext = createContext<ChurchContextValue | undefined>(undefined);

const readCookie = () => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  return match ? match.split("=")[1] : null;
};

const writeCookie = (value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}`;
};

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [selectedChurchId, setSelectedChurchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/churches/list");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setChurches([]);
          return;
        }
        throw new Error("Unable to load churches");
      }
      const data = await response.json();
      setChurches(data.churches || []);
      const storedChurchId = readCookie();
      const availableIds = (data.churches || []).map((church: ChurchOption) => church.id);
      if (storedChurchId && availableIds.includes(storedChurchId)) {
        setSelectedChurchIdState(storedChurchId);
      } else if (availableIds.length > 0) {
        const firstId = availableIds[0];
        setSelectedChurchIdState(firstId);
        writeCookie(firstId);
      } else {
        setSelectedChurchIdState(null);
      }
    } catch (fetchError: any) {
      console.error("Error loading churches:", fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const setSelectedChurchId = (churchId: string) => {
    setSelectedChurchIdState(churchId);
    writeCookie(churchId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("church:selected", { detail: churchId }));
    }
  };

  const currentChurch = useMemo(
    () => churches.find((church) => church.id === selectedChurchId) ?? churches[0],
    [churches, selectedChurchId],
  );

  return (
    <ChurchContext.Provider
      value={{
        churches,
        loading,
        selectedChurchId,
        setSelectedChurchId,
        refresh,
        currentChurch,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurchContext(): ChurchContextValue {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error("useChurchContext must be used within a ChurchProvider");
  }
  return context;
}
