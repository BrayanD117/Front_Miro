"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface PeriodContextType {
  selectedPeriod: string | null;
  setSelectedPeriod: (period: string) => void;
  availablePeriods: string[];
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/allperiods`);
        if (Array.isArray(response.data)) {
          const periodNames = response.data.map((period: { _id: string; name: string }) => period.name);
          setAvailablePeriods(periodNames);
          setSelectedPeriod(periodNames[0] || null);
        } else {
          console.error("La respuesta del API no es un array:", response.data);
        }
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };
  
    fetchPeriods();
  }, []);
  

  return (
    <PeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod, availablePeriods }}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
};
