/**
 * Service Repository
 *
 * LocalStorage implementation for consulting,
 * assessment and corporate training services.
 *
 * Legacy storage key: impact_services_v1
 */

import {
  Service,
  ServiceQuery,
  ServiceFilter,
} from '@/types/service';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface IServiceRepository {
  findById(id: string): Promise<Service | null>;
  findBySlug(slug: string): Promise<Service | null>;
  findAll(query?: ServiceQuery): Promise<Service[]>;

  create(
    service: Omit<
      Service,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Service>;

  update(
    id: string,
    service: Partial<Service>
  ): Promise<Service>;

  delete(id: string): Promise<void>;

  search(
    query: string,
    limit?: number
  ): Promise<Service[]>;

  findByType(
    type: Service['type'],
    query?: ServiceQuery
  ): Promise<Service[]>;

  findByCategory(
    categoryId: string,
    query?: ServiceQuery
  ): Promise<Service[]>;

  findFeatured(
    query?: ServiceQuery
  ): Promise<Service[]>;

  findPublished(
    query?: ServiceQuery
  ): Promise<Service[]>;

  getCount(
    filter?: ServiceFilter
  ): Promise<number>;

  bulkUpdate(
    ids: string[],
    updates: Partial<Service>
  ): Promise<void>;
}

const SERVICES_KEY = 'impact_services_v1';

const storage =
  new LocalStorageAdapter('');

function readServices(): Service[] {
  const services =
    storage.get<Service[]>(
      SERVICES_KEY
    );

  if (!Array.isArray(services)) {
    return [];
  }

  return services;
}

function writeServices(
  services: Service[]
): void {
  storage.set(
    SERVICES_KEY,
    services
  );
}

function makeSlug(
  title: string
): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeService(
  data: Partial<Service>,
  existing?: Service
): Service {
  const now =
    new Date();

  return {
    ...(existing ?? {}),
    ...data,

    id:
      existing?.id ??
      data.id ??
      `service-${Date.now()}`,

    title:
      data.title ??
      existing?.title ??
      '',

    slug:
      data.slug ??
      existing?.slug ??
      makeSlug(
        data.title ??
          existing?.title ??
          ''
      ),

    description:
      data.description ??
      existing?.description ??
      '',

    objectives:
      data.objectives ??
      existing?.objectives ??
      [],

    outcomes:
      data.outcomes ??
      existing?.outcomes ??
      [],

    deliverables:
      data.deliverables ??
      existing?.deliverables ??
      [],

    target:
      data.target ??
      existing?.target ??
      {},
type:
  data.type ??
  existing?.type ??
  'consulting',

  delivery:
  data.delivery ??
  existing?.delivery ??
  'remote',
  
    pricing:
      data.pricing ??
      existing?.pricing ??
      {
        basePrice: 0,
        currency: 'SAR',
        pricingModel: 'custom',
      },

    featured:
      data.featured ??
      existing?.featured ??
      false,

    published:
      data.published ??
      existing?.published ??
      false,

    status:
      data.status ??
      existing?.status ??
      'draft',

    createdAt:
      existing?.createdAt ??
      data.createdAt ??
      now,

    updatedAt:
      now,
  };
}

function matchesFilter(
  service: Service,
  filter?: ServiceFilter
): boolean {
  if (!filter) {
    return true;
  }

  if (
    filter.type &&
    service.type !== filter.type
  ) {
    return false;
  }

  if (
    filter.delivery &&
    service.delivery !==
      filter.delivery
  ) {
    return false;
  }

  if (
    filter.categoryId &&
    service.categoryId !==
      filter.categoryId
  ) {
    return false;
  }

  if (
    typeof filter.featured ===
      'boolean' &&
    service.featured !==
      filter.featured
  ) {
    return false;
  }

  if (
    typeof filter.published ===
      'boolean' &&
    service.published !==
      filter.published
  ) {
    return false;
  }

  if (
    typeof filter.customQuote ===
      'boolean' &&
    service.pricing.customQuote !==
      filter.customQuote
  ) {
    return false;
  }

  if (filter.searchQuery) {
    const query =
      filter.searchQuery
        .trim()
        .toLowerCase();

    const haystack = [
      service.id,
      service.title,
      service.slug,
      service.description,
      service.shortDescription,
      service.consultantName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      !haystack.includes(query)
    ) {
      return false;
    }
  }

  return true;
}

function applyQuery(
  services: Service[],
  query?: ServiceQuery
): Service[] {
  const filtered =
    services.filter(service =>
      matchesFilter(
        service,
        query?.filter
      )
    );

  const sort =
    query?.sort ?? 'createdAt';

  const direction =
    query?.order ?? 'desc';

  filtered.sort((a, b) => {
    let result = 0;

    switch (sort) {
      case 'title':
        result =
          a.title.localeCompare(
            b.title,
            undefined,
            {
              sensitivity:
                'base',
            }
          );
        break;

      case 'price':
        result =
          a.pricing.basePrice -
          b.pricing.basePrice;
        break;

      case 'popularity':
        // Popularity is not currently
        // stored in the legacy model.
        result = 0;
        break;

      case 'createdAt':
      default:
        result =
          new Date(
            a.createdAt
          ).getTime() -
          new Date(
            b.createdAt
          ).getTime();
        break;
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
    return filtered.slice(
      offset,
      offset + query.limit
    );
  }

  return filtered.slice(offset);
}

export class ServiceRepository
  implements IServiceRepository
{
  async findById(
    id: string
  ): Promise<Service | null> {
    return (
      readServices().find(
        service =>
          service.id === id
      ) ?? null
    );
  }

  async findBySlug(
    slug: string
  ): Promise<Service | null> {
    const normalized =
      makeSlug(slug);

    return (
      readServices().find(
        service =>
          service.slug ===
            normalized ||
          makeSlug(
            service.title
          ) === normalized
      ) ?? null
    );
  }

  async findAll(
    query?: ServiceQuery
  ): Promise<Service[]> {
    return applyQuery(
      readServices(),
      query
    );
  }

  async create(
    service: Omit<
      Service,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Service> {
    const services =
      readServices();

    const newService =
      normalizeService(
        service
      );

    services.push(
      newService
    );

    writeServices(
      services
    );

    return newService;
  }

  async update(
    id: string,
    updates: Partial<Service>
  ): Promise<Service> {
    const services =
      readServices();

    const index =
      services.findIndex(
        service =>
          service.id === id
      );

    if (index === -1) {
      throw new Error(
        `Service not found: ${id}`
      );
    }

    const updated =
      normalizeService(
        updates,
        services[index]
      );

    services[index] =
      updated;

    writeServices(
      services
    );

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const services =
      readServices();

    writeServices(
      services.filter(
        service =>
          service.id !== id
      )
    );
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Service[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async findByType(
    type: Service['type'],
    query?: ServiceQuery
  ): Promise<Service[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        type,
      },
    });
  }

  async findByCategory(
    categoryId: string,
    query?: ServiceQuery
  ): Promise<Service[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        categoryId,
      },
    });
  }

  async findFeatured(
    query?: ServiceQuery
  ): Promise<Service[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        featured: true,
      },
    });
  }

  async findPublished(
    query?: ServiceQuery
  ): Promise<Service[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        published: true,
      },
    });
  }

  async getCount(
    filter?: ServiceFilter
  ): Promise<number> {
    return readServices()
      .filter(service =>
        matchesFilter(
          service,
          filter
        )
      ).length;
  }

  async bulkUpdate(
    ids: string[],
    updates: Partial<Service>
  ): Promise<void> {
    const idSet =
      new Set(ids);

    const services =
      readServices();

    const updated =
      services.map(service =>
        idSet.has(service.id)
          ? normalizeService(
              updates,
              service
            )
          : service
      );

    writeServices(
      updated
    );
  }
}

export const serviceRepository =
  new ServiceRepository();