/**
 * Category type definitions
 * Used for organizing courses, services, and training programs
 */

export type CategoryType = 'course' | 'service' | 'training';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  
  // Hierarchy
  parentId?: string;
  children?: Category[];
  
  // Display
  icon?: string;
  image?: string;
  color?: string;
  
  // Ordering
  order: number;
  
  // Status
  active: boolean;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Category filter and query types
export interface CategoryFilter {
  type?: CategoryType;
  active?: boolean;
  parentId?: string;
  searchQuery?: string;
}

export interface CategoryQuery {
  filter?: CategoryFilter;
  sort?: 'order' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
