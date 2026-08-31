/**
 * Coupon Repository
 *
 * LocalStorage implementation for coupons.
 * Legacy storage key: impact_coupons_v1
 */

import {
  Coupon,
  CouponFilter,
  CouponQuery,
  CouponUsage,
} from '@/types/coupon';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface ICouponRepository {
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(query?: CouponQuery): Promise<Coupon[]>;

  create(
    coupon: Omit<
      Coupon,
      'id' | 'createdAt' | 'updatedAt' | 'usageHistory'
    >
  ): Promise<Coupon>;

  update(
    id: string,
    coupon: Partial<Coupon>
  ): Promise<Coupon>;

  delete(id: string): Promise<void>;

  validateCode(
    code: string,
    traineeId?: string,
    orderValue?: number
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
  }>;

  applyCoupon(
    couponId: string,
    traineeId: string,
    orderId: string,
    discountAmount: number
  ): Promise<void>;

  removeCouponUsage(
    couponId: string,
    traineeId: string,
    orderId: string
  ): Promise<void>;

  getUsageCount(
    couponId: string
  ): Promise<number>;

  getTraineeUsageCount(
    couponId: string,
    traineeId: string
  ): Promise<number>;

  incrementUsage(
    couponId: string
  ): Promise<void>;

  decrementUsage(
    couponId: string
  ): Promise<void>;

  search(
    query: string,
    limit?: number
  ): Promise<Coupon[]>;

  findActiveCoupons(
    query?: CouponQuery
  ): Promise<Coupon[]>;

  findExpiredCoupons(
    query?: CouponQuery
  ): Promise<Coupon[]>;

  getCount(
    filter?: CouponQuery['filter']
  ): Promise<number>;

  getTotalDiscount(
    filter?: CouponQuery['filter']
  ): Promise<number>;

  bulkUpdateStatus(
    ids: string[],
    status: Coupon['status']
  ): Promise<void>;
}

const COUPONS_KEY = 'impact_coupons_v1';

const storage = new LocalStorageAdapter('');

function toDate(
  value: unknown,
  fallback = new Date()
): Date {
  if (!value) {
    return fallback;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime())
    ? fallback
    : date;
}

function reviveCoupon(
  coupon: Coupon
): Coupon {
  return {
    ...coupon,

    startDate: toDate(
      coupon.startDate
    ),

    endDate: toDate(
      coupon.endDate
    ),

    createdAt: toDate(
      coupon.createdAt
    ),

    updatedAt: toDate(
      coupon.updatedAt
    ),

    usageHistory: Array.isArray(
      coupon.usageHistory
    )
      ? coupon.usageHistory.map(
          usage => ({
            ...usage,
            usedAt: toDate(
              usage.usedAt
            ),
          })
        )
      : [],
  };
}

function readCoupons(): Coupon[] {
  const coupons =
    storage.get<Coupon[]>(
      COUPONS_KEY
    );

  if (!Array.isArray(coupons)) {
    return [];
  }

  return coupons.map(
    reviveCoupon
  );
}

function writeCoupons(
  coupons: Coupon[]
): void {
  storage.set(
    COUPONS_KEY,
    coupons
  );
}

function isCurrentlyActive(
  coupon: Coupon
): boolean {
  const now = new Date();

  return (
    coupon.status === 'active' &&
    now >= coupon.startDate &&
    now <= coupon.endDate &&
    (
      coupon.maxUses === undefined ||
      coupon.usedCount <
        coupon.maxUses
    )
  );
}

function matchesFilter(
  coupon: Coupon,
  filter?: CouponFilter
): boolean {
  if (!filter) {
    return true;
  }

  if (
    filter.status &&
    coupon.status !==
      filter.status
  ) {
    return false;
  }

  if (
    filter.type &&
    coupon.type !== filter.type
  ) {
    return false;
  }

  if (
    filter.applicability &&
    coupon.applicability !==
      filter.applicability
  ) {
    return false;
  }

  if (
    typeof filter.active ===
    'boolean'
  ) {
    if (
      isCurrentlyActive(
        coupon
      ) !== filter.active
    ) {
      return false;
    }
  }

  if (filter.code) {
    if (
      coupon.code.toLowerCase() !==
      filter.code
        .trim()
        .toLowerCase()
    ) {
      return false;
    }
  }

  if (filter.searchQuery) {
    const query =
      filter.searchQuery
        .trim()
        .toLowerCase();

    const haystack = [
      coupon.id,
      coupon.code,
      coupon.description,
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

export class CouponRepository
  implements ICouponRepository
{
  async findById(
    id: string
  ): Promise<Coupon | null> {
    return (
      readCoupons().find(
        coupon =>
          coupon.id === id
      ) ?? null
    );
  }

  async findByCode(
    code: string
  ): Promise<Coupon | null> {
    const normalized =
      code.trim().toLowerCase();

    return (
      readCoupons().find(
        coupon =>
          coupon.code
            .trim()
            .toLowerCase() ===
          normalized
      ) ?? null
    );
  }

  async findAll(
    query?: CouponQuery
  ): Promise<Coupon[]> {
    let coupons =
      readCoupons().filter(
        coupon =>
          matchesFilter(
            coupon,
            query?.filter
          )
      );

    const sort =
      query?.sort ?? 'createdAt';

    const direction =
      query?.order ?? 'desc';

    coupons.sort((a, b) => {
      let result = 0;

      switch (sort) {
        case 'endDate':
          result =
            a.endDate.getTime() -
            b.endDate.getTime();
          break;

        case 'value':
          result =
            a.value - b.value;
          break;

        case 'createdAt':
        default:
          result =
            a.createdAt.getTime() -
            b.createdAt.getTime();
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
      return coupons.slice(
        offset,
        offset + query.limit
      );
    }

    return coupons.slice(offset);
  }

  async create(
    coupon: Omit<
      Coupon,
      'id' | 'createdAt' |
      'updatedAt' | 'usageHistory'
    >
  ): Promise<Coupon> {
    const coupons =
      readCoupons();

    const now = new Date();

    const newCoupon: Coupon = {
      ...coupon,

      id:
        `coupon-${Date.now()}`,

      code:
        coupon.code
          .trim()
          .toUpperCase(),

      usedCount:
        coupon.usedCount ?? 0,

      usageHistory: [],

      createdAt: now,

      updatedAt: now,
    };

    coupons.push(newCoupon);

    writeCoupons(coupons);

    return newCoupon;
  }

  async update(
    id: string,
    updates: Partial<Coupon>
  ): Promise<Coupon> {
    const coupons =
      readCoupons();

    const index =
      coupons.findIndex(
        coupon =>
          coupon.id === id
      );

    if (index === -1) {
      throw new Error(
        `Coupon not found: ${id}`
      );
    }

    const updated: Coupon = {
      ...coupons[index],
      ...updates,

      id: coupons[index].id,

      code:
        updates.code !== undefined
          ? updates.code
              .trim()
              .toUpperCase()
          : coupons[index].code,

      usageHistory:
        updates.usageHistory ??
        coupons[index]
          .usageHistory,

      updatedAt:
        new Date(),
    };

    coupons[index] = updated;

    writeCoupons(coupons);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const coupons =
      readCoupons();

    writeCoupons(
      coupons.filter(
        coupon =>
          coupon.id !== id
      )
    );
  }

  async validateCode(
    code: string,
    traineeId?: string,
    orderValue?: number
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
  }> {
    const coupon =
      await this.findByCode(
        code
      );

    if (!coupon) {
      return {
        valid: false,
        error:
          'Coupon not found',
      };
    }

    if (
      coupon.status !==
      'active'
    ) {
      return {
        valid: false,
        error:
          'Coupon is not active',
      };
    }

    const now = new Date();

    if (
      now < coupon.startDate
    ) {
      return {
        valid: false,
        error:
          'Coupon is not active yet',
      };
    }

    if (
      now > coupon.endDate
    ) {
      return {
        valid: false,
        error:
          'Coupon has expired',
      };
    }

    if (
      coupon.maxUses !==
        undefined &&
      coupon.usedCount >=
        coupon.maxUses
    ) {
      return {
        valid: false,
        error:
          'Coupon usage limit reached',
      };
    }

    if (
      orderValue !== undefined &&
      coupon.minimumOrderValue !==
        undefined &&
      orderValue <
        coupon.minimumOrderValue
    ) {
      return {
        valid: false,
        error:
          'Minimum order value not met',
      };
    }

    if (
      traineeId &&
      coupon.maxUsesPerTrainee !==
        undefined
    ) {
      const usageCount =
        await this.getTraineeUsageCount(
          coupon.id,
          traineeId
        );

      if (
        usageCount >=
        coupon.maxUsesPerTrainee
      ) {
        return {
          valid: false,
          error:
            'Coupon usage limit reached for this trainee',
        };
      }
    }

    return {
      valid: true,
      coupon,
    };
  }

  async applyCoupon(
    couponId: string,
    traineeId: string,
    orderId: string,
    discountAmount: number
  ): Promise<void> {
    const coupons =
      readCoupons();

    const index =
      coupons.findIndex(
        coupon =>
          coupon.id ===
          couponId
      );

    if (index === -1) {
      throw new Error(
        `Coupon not found: ${couponId}`
      );
    }

    const coupon =
      coupons[index];

    const alreadyUsed =
      coupon.usageHistory.some(
        usage =>
          usage.orderId ===
            orderId ||
          (
            usage.traineeId ===
              traineeId &&
            usage.orderId ===
              orderId
          )
      );

    if (alreadyUsed) {
      return;
    }

    const usage: CouponUsage = {
      traineeId,
      usedAt: new Date(),
      orderId,
      discountAmount,
    };

    coupons[index] = {
      ...coupon,

      usedCount:
        coupon.usedCount + 1,

      usageHistory: [
        ...coupon.usageHistory,
        usage,
      ],

      updatedAt:
        new Date(),
    };

    writeCoupons(coupons);
  }

  async removeCouponUsage(
    couponId: string,
    traineeId: string,
    orderId: string
  ): Promise<void> {
    const coupons =
      readCoupons();

    const index =
      coupons.findIndex(
        coupon =>
          coupon.id ===
          couponId
      );

    if (index === -1) {
      throw new Error(
        `Coupon not found: ${couponId}`
      );
    }

    const coupon =
      coupons[index];

    const history =
      coupon.usageHistory.filter(
        usage =>
          !(
            usage.traineeId ===
              traineeId &&
            usage.orderId ===
              orderId
          )
      );

    if (
      history.length ===
      coupon.usageHistory.length
    ) {
      return;
    }

    coupons[index] = {
      ...coupon,

      usedCount:
        Math.max(
          0,
          coupon.usedCount - 1
        ),

      usageHistory: history,

      updatedAt:
        new Date(),
    };

    writeCoupons(coupons);
  }

  async getUsageCount(
    couponId: string
  ): Promise<number> {
    const coupon =
      await this.findById(
        couponId
      );

    return coupon?.usedCount ?? 0;
  }

  async getTraineeUsageCount(
    couponId: string,
    traineeId: string
  ): Promise<number> {
    const coupon =
      await this.findById(
        couponId
      );

    if (!coupon) {
      return 0;
    }

    return coupon.usageHistory.filter(
      usage =>
        usage.traineeId ===
        traineeId
    ).length;
  }

  async incrementUsage(
    couponId: string
  ): Promise<void> {
    const coupon =
      await this.findById(
        couponId
      );

    if (!coupon) {
      throw new Error(
        `Coupon not found: ${couponId}`
      );
    }

    await this.update(
      couponId,
      {
        usedCount:
          coupon.usedCount + 1,
      }
    );
  }

  async decrementUsage(
    couponId: string
  ): Promise<void> {
    const coupon =
      await this.findById(
        couponId
      );

    if (!coupon) {
      throw new Error(
        `Coupon not found: ${couponId}`
      );
    }

    await this.update(
      couponId,
      {
        usedCount:
          Math.max(
            0,
            coupon.usedCount - 1
          ),
      }
    );
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Coupon[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async findActiveCoupons(
    query?: CouponQuery
  ): Promise<Coupon[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        active: true,
      },
    });
  }

  async findExpiredCoupons(
    query?: CouponQuery
  ): Promise<Coupon[]> {
    const now = new Date();

    const coupons =
      readCoupons().filter(
        coupon =>
          coupon.endDate < now ||
          coupon.status ===
            'expired'
      );

    const offset =
      query?.offset ?? 0;

    return typeof query?.limit ===
      'number'
      ? coupons.slice(
          offset,
          offset + query.limit
        )
      : coupons.slice(offset);
  }

  async getCount(
    filter?: CouponQuery['filter']
  ): Promise<number> {
    return readCoupons().filter(
      coupon =>
        matchesFilter(
          coupon,
          filter
        )
    ).length;
  }

  async getTotalDiscount(
    filter?: CouponQuery['filter']
  ): Promise<number> {
    return readCoupons()
      .filter(coupon =>
        matchesFilter(
          coupon,
          filter
        )
      )
      .reduce(
        (total, coupon) =>
          total +
          coupon.usageHistory.reduce(
            (sum, usage) =>
              sum +
              usage.discountAmount,
            0
          ),
        0
      );
  }

  async bulkUpdateStatus(
    ids: string[],
    status: Coupon['status']
  ): Promise<void> {
    const idSet =
      new Set(ids);

    const coupons =
      readCoupons();

    const updated =
      coupons.map(coupon =>
        idSet.has(coupon.id)
          ? {
              ...coupon,
              status,
              updatedAt:
                new Date(),
            }
          : coupon
      );

    writeCoupons(updated);
  }
}

export const couponRepository =
  new CouponRepository();