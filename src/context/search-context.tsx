
'use client';

import { Product } from '@/lib/mock-data';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  searchResults: Product[];
  setSearchResults: (results: Product[]) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, searchResults, setSearchResults }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
