/**
 * Order Repository
 *
 * LocalStorage implementation for orders.
 * Legacy storage key: impact_orders_v1
 */

import {
  Order,
  OrderFilter,
  OrderItem,
  OrderQuery,
  OrderStatus,
  PaymentStatus,
} from '@/types/order';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findAll(query?: OrderQuery): Promise<Order[]>;

  create(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Order>;

  update(
    id: string,
    order: Partial<Order>
  ): Promise<Order>;

  delete(id: string): Promise<void>;

  updateStatus(
    id: string,
    status: OrderStatus
  ): Promise<Order>;

  updatePaymentStatus(
    id: string,
    status: PaymentStatus
  ): Promise<Order>;

  confirmOrder(id: string): Promise<Order>;
  cancelOrder(
    id: string,
    reason?: string
  ): Promise<Order>;

  findByTraineeId(
    traineeId: string,
    query?: OrderQuery
  ): Promise<Order[]>;

  findActiveOrders(
    traineeId?: string
  ): Promise<Order[]>;

  findCompletedOrders(
    traineeId?: string
  ): Promise<Order[]>;

  findByCouponId(
    couponId: string
  ): Promise<Order[]>;

  getCount(filter?: OrderFilter): Promise<number>;

  getTotalRevenue(
    filter?: OrderFilter
  ): Promise<number>;

  getRecentOrders(
    limit?: number
  ): Promise<Order[]>;

  search(
    query: string,
    limit?: number
  ): Promise<Order[]>;

  findByStatus(
    status: OrderStatus,
    query?: OrderQuery
  ): Promise<Order[]>;

  bulkUpdateStatus(
    ids: string[],
    status: OrderStatus
  ): Promise<void>;
}

const ORDERS_KEY = 'impact_orders_v1';

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

function reviveOrder(order: Order): Order {
  return {
    ...order,

    createdAt: toDate(order.createdAt),
    updatedAt: toDate(order.updatedAt),

    confirmedAt: order.confirmedAt
      ? toDate(order.confirmedAt)
      : undefined,

    completedAt: order.completedAt
      ? toDate(order.completedAt)
      : undefined,

    cancelledAt: order.cancelledAt
      ? toDate(order.cancelledAt)
      : undefined,

    bookingDate: order.bookingDate
      ? toDate(order.bookingDate)
      : undefined,

    payment: {
      ...order.payment,

      paidAt: order.payment.paidAt
        ? toDate(order.payment.paidAt)
        : undefined,
    },
  };
}

function calculateItemTotal(
  item: OrderItem
): number {
  return (
    item.totalPrice ??
    item.unitPrice * item.quantity
  );
}

function normalizeOrder(
  data: Partial<Order>,
  existing?: Order
): Order {
  const now = new Date();

  const items = (
    data.items ??
    existing?.items ??
    []
  ).map((item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;

    return {
      ...item,
      quantity,
      unitPrice,
      totalPrice:
        item.totalPrice ??
        unitPrice * quantity,
    };
  });

  const subtotal =
    typeof data.subtotal === 'number'
      ? data.subtotal
      : items.reduce(
          (sum, item) =>
            sum + calculateItemTotal(item),
          0
        );

  const discount =
    typeof data.discount === 'number'
      ? data.discount
      : 0;

  const tax =
    typeof data.tax === 'number'
      ? data.tax
      : 0;

  const total =
    typeof data.total === 'number'
      ? data.total
      : Math.max(
          0,
          subtotal - discount + tax
        );

  const customer =
    data.customer ??
    existing?.customer ?? {
      traineeId: '',
      name: '',
      email: '',
    };

  const payment =
    data.payment ??
    existing?.payment ?? {
      method: 'cash',
      status: 'pending',
      amount: total,
      currency:
        data.currency ??
        existing?.currency ??
        'SAR',
    };

  return {
    ...(existing ?? ({} as Order)),
    ...data,

    id:
      existing?.id ??
      data.id ??
      `order-${Date.now()}`,

    orderNumber:
      existing?.orderNumber ??
      data.orderNumber ??
      `IMP-${Date.now()}`,

    customer,

    items,

    subtotal,
    discount,
    tax,
    total,

    currency:
      data.currency ??
      existing?.currency ??
      'SAR',

    payment: {
      ...payment,
      amount:
        payment.amount ??
        total,
    },

    status:
      data.status ??
      existing?.status ??
      'pending',

    createdAt:
      existing?.createdAt ??
      toDate(data.createdAt, now),

    updatedAt: now,

    scheduleId:
      data.scheduleId ??
      existing?.scheduleId,

    bookingDate:
      data.bookingDate ??
      existing?.bookingDate,
  };
}

export class OrderRepository
  implements IOrderRepository
{
  private readOrders(): Order[] {
    const orders =
      storage.get<Order[]>(ORDERS_KEY);

    if (!Array.isArray(orders)) {
      return [];
    }

    return orders.map(reviveOrder);
  }

  private writeOrders(
    orders: Order[]
  ): void {
    storage.set(
      ORDERS_KEY,
      orders
    );
  }

  private matchesFilter(
    order: Order,
    filter?: OrderFilter
  ): boolean {
    if (!filter) {
      return true;
    }

    if (
      filter.status &&
      order.status !== filter.status
    ) {
      return false;
    }

    if (
      filter.paymentStatus &&
      order.payment.status !==
        filter.paymentStatus
    ) {
      return false;
    }

    if (
      filter.traineeId &&
      order.customer.traineeId !==
        filter.traineeId
    ) {
      return false;
    }

    if (
      filter.couponId &&
      order.coupon?.couponId !==
        filter.couponId
    ) {
      return false;
    }

    if (filter.dateFrom) {
      if (
        order.createdAt <
        new Date(filter.dateFrom)
      ) {
        return false;
      }
    }

    if (filter.dateTo) {
      if (
        order.createdAt >
        new Date(filter.dateTo)
      ) {
        return false;
      }
    }

    if (filter.searchQuery) {
      const query =
        filter.searchQuery
          .trim()
          .toLowerCase();

      const itemText = order.items
        .map((item) =>
          [
            item.title,
            item.description,
            item.itemId,
          ]
            .filter(Boolean)
            .join(' ')
        )
        .join(' ');

      const haystack = [
        order.id,
        order.orderNumber,
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        order.customer.company,
        order.notes,
        order.coupon?.code,
        itemText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  }

  async findById(
    id: string
  ): Promise<Order | null> {
    return (
      this.readOrders().find(
        (order) => order.id === id
      ) ?? null
    );
  }

  async findByOrderNumber(
    orderNumber: string
  ): Promise<Order | null> {
    const value =
      orderNumber.trim().toLowerCase();

    return (
      this.readOrders().find(
        (order) =>
          order.orderNumber
            .toLowerCase() === value
      ) ?? null
    );
  }

  async findAll(
    query?: OrderQuery
  ): Promise<Order[]> {
    let orders =
      this.readOrders().filter(
        (order) =>
          this.matchesFilter(
            order,
            query?.filter
          )
      );

    const sort =
      query?.sort ?? 'createdAt';

    const direction =
      query?.order ?? 'desc';

    orders.sort((a, b) => {
      let comparison = 0;

      switch (sort) {
        case 'total':
          comparison =
            a.total - b.total;
          break;

        case 'status':
          comparison =
            a.status.localeCompare(
              b.status
            );
          break;

        case 'createdAt':
        default:
          comparison =
            a.createdAt.getTime() -
            b.createdAt.getTime();
          break;
      }

      return direction === 'asc'
        ? comparison
        : -comparison;
    });

    const offset =
      query?.offset ?? 0;

    if (
      typeof query?.limit ===
      'number'
    ) {
      return orders.slice(
        offset,
        offset + query.limit
      );
    }

    return orders.slice(offset);
  }

  async create(
    order: Omit<
      Order,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Order> {
    const orders =
      this.readOrders();

    const newOrder =
      normalizeOrder({
        ...order,
        id: `order-${Date.now()}`,
        orderNumber:
          order.orderNumber ||
          `IMP-${Date.now()}`,
      });

    orders.unshift(newOrder);

    this.writeOrders(orders);

    return newOrder;
  }

  async update(
    id: string,
    updates: Partial<Order>
  ): Promise<Order> {
    const orders =
      this.readOrders();

    const index =
      orders.findIndex(
        (order) =>
          order.id === id
      );

    if (index === -1) {
      throw new Error(
        `Order not found: ${id}`
      );
    }

    const updated =
      normalizeOrder(
        updates,
        orders[index]
      );

    orders[index] = updated;

    this.writeOrders(orders);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const orders =
      this.readOrders();

    const filtered =
      orders.filter(
        (order) =>
          order.id !== id
      );

    this.writeOrders(filtered);
  }

  async updateStatus(
    id: string,
    status: OrderStatus
  ): Promise<Order> {
    const updates: Partial<Order> = {
      status,
    };

    if (status === 'confirmed') {
      updates.confirmedAt =
        new Date();
    }

    if (status === 'completed') {
      updates.completedAt =
        new Date();
    }

    if (status === 'cancelled') {
      updates.cancelledAt =
        new Date();
    }

    return this.update(
      id,
      updates
    );
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus
  ): Promise<Order> {
    const order =
      await this.findById(id);

    if (!order) {
      throw new Error(
        `Order not found: ${id}`
      );
    }

    const payment = {
      ...order.payment,
      status,
      paidAt:
        status === 'paid'
          ? order.payment.paidAt ??
            new Date()
          : order.payment.paidAt,
    };

    return this.update(
      id,
      {
        payment,
      }
    );
  }

  async confirmOrder(
    id: string
  ): Promise<Order> {
    return this.updateStatus(
      id,
      'confirmed'
    );
  }

  async cancelOrder(
    id: string,
    reason?: string
  ): Promise<Order> {
    const order =
      await this.findById(id);

    if (!order) {
      throw new Error(
        `Order not found: ${id}`
      );
    }

    const metadata = {
      ...(order.metadata ?? {}),
    };

    if (reason) {
      metadata.cancellationReason =
        reason;
    }

    return this.update(
      id,
      {
        status: 'cancelled',
        cancelledAt:
          new Date(),
        metadata,
      }
    );
  }

  async findByTraineeId(
    traineeId: string,
    query?: OrderQuery
  ): Promise<Order[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        traineeId,
      },
    });
  }

  async findActiveOrders(
    traineeId?: string
  ): Promise<Order[]> {
    return this.readOrders().filter(
      (order) =>
        (!traineeId ||
          order.customer
            .traineeId ===
            traineeId) &&
        order.status !==
          'cancelled' &&
        order.status !==
          'refunded' &&
        order.status !==
          'completed'
    );
  }

  async findCompletedOrders(
    traineeId?: string
  ): Promise<Order[]> {
    return this.readOrders().filter(
      (order) =>
        (!traineeId ||
          order.customer
            .traineeId ===
            traineeId) &&
        order.status ===
          'completed'
    );
  }

  async findByCouponId(
    couponId: string
  ): Promise<Order[]> {
    return this.readOrders().filter(
      (order) =>
        order.coupon?.couponId ===
        couponId
    );
  }

  async getCount(
    filter?: OrderFilter
  ): Promise<number> {
    return this.readOrders().filter(
      (order) =>
        this.matchesFilter(
          order,
          filter
        )
    ).length;
  }

  async getTotalRevenue(
    filter?: OrderFilter
  ): Promise<number> {
    return this.readOrders()
      .filter((order) => {
        if (
          order.status ===
            'cancelled' ||
          order.status ===
            'refunded'
        ) {
          return false;
        }

        if (
          order.payment.status !==
          'paid'
        ) {
          return false;
        }

        return this.matchesFilter(
          order,
          filter
        );
      })
      .reduce(
        (total, order) =>
          total + order.total,
        0
      );
  }

  async getRecentOrders(
    limit = 10
  ): Promise<Order[]> {
    return this.findAll({
      sort: 'createdAt',
      order: 'desc',
      limit,
    });
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Order[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async findByStatus(
    status: OrderStatus,
    query?: OrderQuery
  ): Promise<Order[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        status,
      },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status: OrderStatus
  ): Promise<void> {
    const idSet =
      new Set(ids);

    const orders =
      this.readOrders();

    const now =
      new Date();

    const updated =
      orders.map((order) => {
        if (
          !idSet.has(order.id)
        ) {
          return order;
        }

        return {
          ...order,
          status,
          updatedAt: now,
          confirmedAt:
            status === 'confirmed'
              ? order.confirmedAt ??
                now
              : order.confirmedAt,
          completedAt:
            status === 'completed'
              ? order.completedAt ??
                now
              : order.completedAt,
          cancelledAt:
            status === 'cancelled'
              ? order.cancelledAt ??
                now
              : order.cancelledAt,
        };
      });

    this.writeOrders(updated);
  }
}

export const orderRepository =
  new OrderRepository();