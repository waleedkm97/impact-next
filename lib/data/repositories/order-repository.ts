import type {
  Order,
  OrderFilter,
  OrderQuery,
  OrderStatus,
  PaymentStatus,
} from '@/types/order';
import { DEFAULT_ORDERS } from '@/lib/data/seed-data';
import {
  browserDbGet,
  browserDbSet,
  migrateLegacyData,
} from '@/lib/data/browser-db';

function amount(value: unknown) {
  return Number(String(value ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    type: order.type ?? 'public',
    customer: {
      ...order.customer,
    },
    items: (order.items ?? []).map((item) => ({ ...item })),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    confirmedAt: order.confirmedAt ? new Date(order.confirmedAt) : undefined,
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : undefined,
    bookingDate: order.bookingDate ? new Date(order.bookingDate) : undefined,
    payment: {
      ...order.payment,
      paidAt: order.payment.paidAt ? new Date(order.payment.paidAt) : undefined,
    },
  };
}

function buildSeedOrders(): Order[] {
  return (DEFAULT_ORDERS as any[]).map((order, index) => {
    const value = amount(order.amount);

    return {
      id: order.id,
      orderNumber: order.id,
      type: 'public',
      customer: {
        traineeId: '',
        name: order.customer,
        email: order.email,
      },
      items: [
        {
          id: `item-${index}`,
          type: 'course',
          itemId: order.courseId,
          title: order.product,
          quantity: 1,
          unitPrice: value,
          totalPrice: value,
        },
      ],
      subtotal: value,
      discount: 0,
      tax: 0,
      total: value,
      currency: 'SAR',
      payment: {
        method: 'credit-card',
        status: 'paid',
        amount: value,
        currency: 'SAR',
      },
      status: order.status === 'مكتمل' ? 'completed' : 'processing',
      createdAt: new Date(order.date),
      updatedAt: new Date(order.date),
    };
  });
}

let orders: Order[] = buildSeedOrders();
let hydrated = false;
let hydration: Promise<void> | null = null;

async function ensureHydrated() {
  if (hydrated) {
    return;
  }

  await migrateLegacyData();

  if (!hydration) {
    hydration = (async () => {
      const saved = await browserDbGet<Order[]>('orders');

      if (saved !== null) {
        orders = saved.map(normalizeOrder);
      }

      hydrated = true;
    })().catch(() => {
      hydrated = true;
    });
  }

  await hydration;
}

async function persist() {
  await browserDbSet('orders', orders);
}

export class OrderRepository {
  async refresh() {
    hydrated = false;
    hydration = null;
    await ensureHydrated();
  }

  async findById(id: string) {
    await ensureHydrated();
    return orders.find((order) => order.id === id) ?? null;
  }

  async findByOrderNumber(orderNumber: string) {
    await ensureHydrated();
    return (
      orders.find((order) => order.orderNumber === orderNumber) ?? null
    );
  }

  async findAll(query?: OrderQuery) {
    await ensureHydrated();

    let result = orders.filter((order) => {
      const filter = query?.filter;

      if (!filter) {
        return true;
      }

      if (filter.status && order.status !== filter.status) {
        return false;
      }

      if (filter.paymentStatus && order.payment.status !== filter.paymentStatus) {
        return false;
      }

      if (filter.traineeId && order.customer.traineeId !== filter.traineeId) {
        return false;
      }

      if (filter.searchQuery) {
        const text = [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          order.customer.company,
          order.customer.responsibleName,
          ...order.items.map((item) => item.title),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!text.includes(filter.searchQuery.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const order = query?.order ?? 'desc';

    result.sort((a, b) => {
      let value = a.createdAt.getTime() - b.createdAt.getTime();

      if (query?.sort === 'total') {
        value = a.total - b.total;
      }

      if (query?.sort === 'status') {
        value = a.status.localeCompare(b.status);
      }

      return order === 'asc' ? value : -value;
    });

    const offset = query?.offset ?? 0;
    const end = typeof query?.limit === 'number' ? offset + query.limit : undefined;

    return result.slice(offset, end).map(normalizeOrder);
  }

  async create(
  input: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>,
) {
    await ensureHydrated();

    const timestamp = new Date();
    const order: Order = {
      ...input,
      id: `order-${Date.now()}`,
orderNumber: `IMP-${Date.now()}`,
      type: input.type ?? 'public',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    orders.push(order);
    await persist();

    return normalizeOrder(order);
  }

  async update(id: string, input: Partial<Order>) {
    await ensureHydrated();

    const index = orders.findIndex((order) => order.id === id);

    if (index < 0) {
      throw new Error('Order not found');
    }

    orders[index] = {
      ...orders[index],
      ...input,
      updatedAt: new Date(),
    };

    await persist();
    return normalizeOrder(orders[index]);
  }

  async delete(id: string) {
    await ensureHydrated();
    orders = orders.filter((order) => order.id !== id);
    await persist();
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.update(id, { status });
  }

  async updatePaymentStatus(id: string, status: PaymentStatus) {
    const order = await this.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }

    return this.update(id, {
      payment: {
        ...order.payment,
        status,
      },
    });
  }

  async confirmOrder(id: string) {
    const order = await this.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }

    const now = new Date();
    const updated = await this.update(id, {
      status: 'confirmed',
      confirmedAt: now,
      payment: {
        ...order.payment,
        status: 'paid',
        paidAt: now,
      },
    });

    const item = order.items?.[0];

    if (item?.itemId) {
      const { traineeRepository } = await import('./trainee-repository');
      await traineeRepository.refresh();
      const trainee = order.customer?.traineeId
        ? await traineeRepository.findById(order.customer.traineeId)
        : null;
      const resolvedTrainee = trainee ?? (order.customer?.email
        ? await traineeRepository.findByEmail(order.customer.email)
        : null);

      if (resolvedTrainee) {
        await traineeRepository.enrollInCourse(
          resolvedTrainee.id,
          item.itemId,
          item.title,
          {
            scheduleId: order.scheduleId,
            groupId: order.customer.groupId,
          },
        );
      }
    }

    return updated;
  }

  async cancelOrder(id: string, reason?: string) {
    return this.update(id, {
      status: 'cancelled',
      notes: reason,
    });
  }

  async findByTraineeId(id: string, query?: OrderQuery) {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        traineeId: id,
      },
    });
  }

  async findActiveOrders(id?: string) {
    return (await this.findAll({ filter: { traineeId: id } })).filter((order) =>
      ['pending', 'confirmed', 'processing'].includes(order.status),
    );
  }

  async findCompletedOrders(id?: string) {
    return (await this.findAll({ filter: { traineeId: id } })).filter(
      (order) => order.status === 'completed',
    );
  }

  async findByCouponId(id: string) {
    await ensureHydrated();
    return orders.filter((order) => order.coupon?.couponId === id).map(normalizeOrder);
  }

  async getCount(filter?: OrderFilter) {
    return (await this.findAll({ filter })).length;
  }

  async getTotalRevenue(filter?: OrderFilter) {
    return (await this.findAll({ filter }))
      .filter((order) => order.payment.status === 'paid')
      .reduce((total, order) => total + order.total, 0);
  }

  async getRecentOrders(limit = 10) {
    await ensureHydrated();

    return [...orders]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(normalizeOrder);
  }

  async search(query: string, limit = 20) {
    return this.findAll({
      filter: { searchQuery: query },
      limit,
    });
  }

  async findByStatus(status: OrderStatus, query?: OrderQuery) {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        status,
      },
    });
  }

  async bulkUpdateStatus(ids: string[], status: OrderStatus) {
    await ensureHydrated();

    const selected = new Set(ids);

    orders = orders.map((order) =>
      selected.has(order.id)
        ? {
            ...order,
            status,
            updatedAt: new Date(),
          }
        : order,
    );

    await persist();
  }
}

export const orderRepository = new OrderRepository();
