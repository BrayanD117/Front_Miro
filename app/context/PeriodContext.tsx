"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface Period {
  _id: string;
  name: string;
}

interface PeriodContextType {
  selectedPeriodId: string | null;
  setSelectedPeriodId: (periodId: string) => void;
  availablePeriods: Period[];
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/active`);
        if (Array.isArray(response.data)) {
          setAvailablePeriods(response.data);
  
          const savedPeriodId = localStorage.getItem("selectedPeriodId");
          if (savedPeriodId && response.data.some((p: Period) => p._id === savedPeriodId)) {
            setSelectedPeriodId(savedPeriodId);
          } else {
            setSelectedPeriodId(response.data[0]?._id || null);
          }
        } else {
          console.error("La respuesta del API no es un array:", response.data);
        }
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };
  
    fetchPeriods();
  }, []);
  
  useEffect(() => {
    if (selectedPeriodId) {
      localStorage.setItem("selectedPeriodId", selectedPeriodId);
    }
  }, [selectedPeriodId]);  

  return (
    <PeriodContext.Provider value={{ selectedPeriodId, setSelectedPeriodId, availablePeriods }}>
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
