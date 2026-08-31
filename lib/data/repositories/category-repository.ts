/**
 * Category Repository Interface
 * Defines the contract for category data access operations
 */

import { Category, CategoryQuery } from '@/types/category';

export interface ICategoryRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(query?: CategoryQuery): Promise<Category[]>;
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
  
  // Hierarchy management
  findChildren(parentId: string): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  buildTree(): Promise<Category[]>;
  
  // Type-specific queries
  findByType(type: 'course' | 'service' | 'training', query?: CategoryQuery): Promise<Category[]>;
  findActiveCategories(query?: CategoryQuery): Promise<Category[]>;
  
  // Search and filter
  search(query: string, limit?: number): Promise<Category[]>;
  
  // Analytics
  getCount(filter?: CategoryQuery['filter']): Promise<number>;
  
  // Bulk operations
  bulkUpdate(ids: string[], updates: Partial<Category>): Promise<void>;
  reorder(ids: string[]): Promise<void>;
}

/**
 * Category Repository Implementation (LocalStorage)
 * 
 * TODO: This is a temporary implementation using LocalStorage.
 * Future implementation should replace this with API calls to a real backend.
 * 
 * Migration notes:
 * - Replace localStorage calls with API endpoints
 * - Tree building logic should be optimized for large hierarchies
 * - Consider caching frequently accessed category trees
 */
export class CategoryRepository implements ICategoryRepository {
  private storageKey = 'impact_categories';
  
  async findById(id: string): Promise<Category | null> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findBySlug(slug: string): Promise<Category | null> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findAll(query?: CategoryQuery): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async update(id: string, category: Partial<Category>): Promise<Category> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findChildren(parentId: string): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findRootCategories(): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async buildTree(): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findByType(type: 'course' | 'service' | 'training', query?: CategoryQuery): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async findActiveCategories(query?: CategoryQuery): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async search(query: string, limit?: number): Promise<Category[]> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async getCount(filter?: CategoryQuery['filter']): Promise<number> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async bulkUpdate(ids: string[], updates: Partial<Category>): Promise<void> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
  
  async reorder(ids: string[]): Promise<void> {
    throw new Error('Not implemented - will be replaced with API implementation');
  }
}

export const categoryRepository = new CategoryRepository();
