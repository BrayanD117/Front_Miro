import { useState } from "react";

export interface SortConfig {
  key: string | null;
  direction: "asc" | "desc";
}

export function useSort<T>(items: T[], config: SortConfig) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(config);

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const valueA = getNestedValue(a, sortConfig.key);
    const valueB = getNestedValue(b, sortConfig.key);

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    } else {
      return 0;
    }
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return { sortedItems, handleSort, sortConfig };
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
