/**
 * Category type definitions
 * Legacy-compatible flat structure for organizing courses and training programs
 */

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  published?: boolean;
  updatedAt?: string;
}

// Category filter types
export interface CategoryFilter {
  published?: boolean;
  searchQuery?: string;
}

export interface CategoryQuery {
  filter?: CategoryFilter;
  sort?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
