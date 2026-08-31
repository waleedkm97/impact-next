/**
 * Order type definitions
 * Represents orders for courses, training programs, and services
 */

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit-card' | 'bank-transfer' | 'cash' | 'online-payment';

export interface OrderItem {
  id: string;
  type: 'course' | 'training-program' | 'service';
  itemId: string; // Course ID, Service ID, etc.
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  metadata?: Record<string, unknown>; // Additional item-specific data
}

export interface OrderCustomer {
  traineeId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  paidAt?: Date;
  paymentGateway?: string;
  metadata?: Record<string, unknown>;
}

export interface CouponApplication {
  couponId: string;
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number
  
  // Customer information
  customer: OrderCustomer;
  
  // Order items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  
  // Coupon if applied
  coupon?: CouponApplication;
  
  // Payment information
  payment: OrderPayment;
  
  // Status
  status: OrderStatus;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Additional information
  notes?: string;
  metadata?: Record<string, unknown>;
  
  // For training bookings
  scheduleId?: string;
  bookingDate?: Date;
}

// Order filter and query types
export interface OrderFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  traineeId?: string;
  couponId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface OrderQuery {
  filter?: OrderFilter;
  sort?: 'createdAt' | 'total' | 'status';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
