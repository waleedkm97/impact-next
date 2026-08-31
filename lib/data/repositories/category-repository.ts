/**
 * Category Repository
 *
 * LocalStorage implementation for category data.
 * Legacy storage key: impact_categories_v1
 */

import { Category, CategoryQuery } from '@/types/category';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(query?: CategoryQuery): Promise<Category[]>;
  create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Category>;
  update(
    id: string,
    category: Partial<Category>
  ): Promise<Category>;
  delete(id: string): Promise<void>;

  findChildren(parentId: string): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  buildTree(): Promise<Category[]>;

  findByType(
    type: 'course' | 'service' | 'training',
    query?: CategoryQuery
  ): Promise<Category[]>;

  findActiveCategories(
    query?: CategoryQuery
  ): Promise<Category[]>;

  search(
    query: string,
    limit?: number
  ): Promise<Category[]>;

  getCount(
    filter?: CategoryQuery['filter']
  ): Promise<number>;

  bulkUpdate(
    ids: string[],
    updates: Partial<Category>
  ): Promise<void>;

  reorder(ids: string[]): Promise<void>;
}

const CATEGORIES_KEY = 'impact_categories_v1';

const storage = new LocalStorageAdapter('');

type LegacyCategory = Category & {
  slug?: string;
  parentId?: string | null;
  type?: 'course' | 'service' | 'training';
  order?: number;
  createdAt?: string;
};

function readCategories(): LegacyCategory[] {
  const data =
    storage.get<LegacyCategory[]>(CATEGORIES_KEY);

  if (!Array.isArray(data)) {
    return [];
  }

  return data;
}

function writeCategories(
  categories: LegacyCategory[]
): void {
  storage.set(
    CATEGORIES_KEY,
    categories
  );
}

function makeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeCategory(
  data: Partial<LegacyCategory>,
  existing?: LegacyCategory
): LegacyCategory {
  const now = new Date().toISOString();

  return {
    ...(existing ?? {}),
    ...data,

    id:
      existing?.id ??
      data.id ??
      `category-${Date.now()}`,

    name:
      data.name ??
      existing?.name ??
      '',

    slug:
      data.slug ??
      existing?.slug ??
      makeSlug(data.name ?? existing?.name ?? ''),

    published:
      data.published ??
      existing?.published ??
      true,

    updatedAt: now,

    createdAt:
      existing?.createdAt ??
      data.createdAt ??
      now,
  };
}

function matchesFilter(
  category: LegacyCategory,
  query?: CategoryQuery
): boolean {
  const filter = query?.filter;

  if (!filter) {
    return true;
  }

  if (
    typeof filter.published === 'boolean' &&
    category.published !== filter.published
  ) {
    return false;
  }

  if (filter.searchQuery) {
    const search =
      filter.searchQuery
        .trim()
        .toLowerCase();

    const haystack = [
      category.id,
      category.name,
      category.description,
      category.slug,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(search)) {
      return false;
    }
  }

  return true;
}

export class CategoryRepository
  implements ICategoryRepository
{
  async findById(
    id: string
  ): Promise<Category | null> {
    return (
      readCategories().find(
        category => category.id === id
      ) ?? null
    );
  }

  async findBySlug(
    slug: string
  ): Promise<Category | null> {
    const normalized =
      makeSlug(slug);

    return (
      readCategories().find(
        category =>
          category.slug === normalized ||
          makeSlug(category.name) ===
            normalized
      ) ?? null
    );
  }

  async findAll(
    query?: CategoryQuery
  ): Promise<Category[]> {
    let categories =
      readCategories().filter(
        category =>
          matchesFilter(
            category,
            query
          )
      );

    const sort =
      query?.sort ?? 'name';

    const direction =
      query?.order ?? 'asc';

    categories.sort((a, b) => {
      let result = 0;

      if (sort === 'name') {
        result =
          a.name.localeCompare(
            b.name,
            undefined,
            {
              sensitivity: 'base',
            }
          );
      } else if (
        sort === 'createdAt'
      ) {
        result =
          new Date(
            a.createdAt ?? 0
          ).getTime() -
          new Date(
            b.createdAt ?? 0
          ).getTime();
      }

      return direction === 'asc'
        ? result
        : -result;
    });

    const offset =
      query?.offset ?? 0;

    if (
      typeof query?.limit ===
      'number'
    ) {
      return categories.slice(
        offset,
        offset + query.limit
      );
    }

    return categories.slice(offset);
  }

  async create(
    category: Omit<
      Category,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Category> {
    const categories =
      readCategories();

    const newCategory =
      normalizeCategory({
        ...category,
      });

    categories.push(newCategory);

    writeCategories(categories);

    return newCategory;
  }

  async update(
    id: string,
    updates: Partial<Category>
  ): Promise<Category> {
    const categories =
      readCategories();

    const index =
      categories.findIndex(
        category =>
          category.id === id
      );

    if (index === -1) {
      throw new Error(
        `Category not found: ${id}`
      );
    }

    const updated =
      normalizeCategory(
        updates,
        categories[index]
      );

    categories[index] =
      updated;

    writeCategories(categories);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const categories =
      readCategories();

    const filtered =
      categories.filter(
        category =>
          category.id !== id
      );

    writeCategories(filtered);
  }

  async findChildren(
    parentId: string
  ): Promise<Category[]> {
    return readCategories().filter(
      category =>
        category.parentId ===
        parentId
    );
  }

  async findRootCategories(): Promise<
    Category[]
  > {
    return readCategories().filter(
      category =>
        !category.parentId
    );
  }

  async buildTree(): Promise<
    Category[]
  > {
    const categories =
      readCategories();

    return categories.filter(
      category =>
        !category.parentId
    );
  }

  async findByType(
    type:
      | 'course'
      | 'service'
      | 'training',
    query?: CategoryQuery
  ): Promise<Category[]> {
    const categories =
      readCategories().filter(
        category =>
          category.type === type
      );

    const filtered =
      categories.filter(
        category =>
          matchesFilter(
            category,
            query
          )
      );

    const offset =
      query?.offset ?? 0;

    return typeof query?.limit ===
      'number'
      ? filtered.slice(
          offset,
          offset + query.limit
        )
      : filtered.slice(offset);
  }

  async findActiveCategories(
    query?: CategoryQuery
  ): Promise<Category[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        published: true,
      },
    });
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Category[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async getCount(
    filter?: CategoryQuery['filter']
  ): Promise<number> {
    return readCategories().filter(
      category =>
        matchesFilter(
          category,
          filter
            ? { filter }
            : undefined
        )
    ).length;
  }

  async bulkUpdate(
    ids: string[],
    updates: Partial<Category>
  ): Promise<void> {
    const idSet = new Set(ids);
    const categories =
      readCategories();

    const updated =
      categories.map(category =>
        idSet.has(category.id)
          ? normalizeCategory(
              updates,
              category
            )
          : category
      );

    writeCategories(updated);
  }

  async reorder(
    ids: string[]
  ): Promise<void> {
    const categories =
      readCategories();

    const position =
      new Map(
        ids.map(
          (id, index) => [
            id,
            index,
          ]
        )
      );

    categories.sort((a, b) => {
      const aPosition =
        position.get(a.id);

      const bPosition =
        position.get(b.id);

      if (
        aPosition === undefined &&
        bPosition === undefined
      ) {
        return 0;
      }

      if (
        aPosition === undefined
      ) {
        return 1;
      }

      if (
        bPosition === undefined
      ) {
        return -1;
      }

      return (
        aPosition - bPosition
      );
    });

    writeCategories(categories);
  }
}

export const categoryRepository =
  new CategoryRepository();