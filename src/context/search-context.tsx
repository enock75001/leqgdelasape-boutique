
'use client';

import { Product } from '@/lib/mock-data';
import { generateVisualQuery } from '@/ai/flows/image-search-flow';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  searchResults: Product[];
  setSearchResults: (results: Product[]) => void;
  performSearch: (query: string, allProducts: Product[]) => Promise<Product[]>;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Cosine similarity function to compare text embeddings (represented as arrays of numbers)
// Note: Genkit doesn't provide embeddings yet, so we use string similarity as a proxy.
function calculateStringSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const performSearch = useCallback(async (query: string, allProducts: Product[]): Promise<Product[]> => {
    if (query.trim() === '') {
        return allProducts;
    }

    const lowerCaseQuery = query.toLowerCase();

    // 1. Direct keyword search (fast)
    const keywordMatches = allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.description.toLowerCase().includes(lowerCaseQuery) ||
        product.categories?.some(cat => cat.toLowerCase().includes(lowerCaseQuery))
    );

    // 2. AI-powered semantic search
    let semanticMatches: Product[] = [];
    try {
        const visualQuery = await generateVisualQuery(lowerCaseQuery);
        
        // Calculate similarity score for each product against the AI's visual description
        const productsWithScores = allProducts.map(product => {
            const descriptionForSimilarity = `${product.name} ${product.description}`;
            const score = calculateStringSimilarity(visualQuery, descriptionForSimilarity);
            return { ...product, score };
        });

        // Filter and sort by score
        semanticMatches = productsWithScores
            .filter(p => p.score > 0.1) // Threshold to avoid irrelevant results
            .sort((a, b) => b.score - a.score);

    } catch (error) {
        console.warn("AI search failed, falling back to keyword search only.", error);
    }
    
    // Combine results, remove duplicates, and prioritize keyword matches
    const combinedResults = [...keywordMatches, ...semanticMatches];
    const uniqueResults = Array.from(new Map(combinedResults.map(p => [p.id, p])).values());
    
    return uniqueResults;
  }, []);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, searchResults, setSearchResults, performSearch }}>
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
