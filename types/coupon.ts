/**
 * Coupon type definitions
 * Used for discounts and promotional codes
 */

export type CouponType = 'percentage' | 'fixed' | 'free-shipping';
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'exhausted';
export type CouponApplicability = 'all' | 'courses' | 'services' | 'training' | 'specific';

export interface CouponRestriction {
  type: 'min-purchase' | 'max-purchase' | 'first-order' | 'specific-categories' | 'specific-items';
  value?: number;
  categoryIds?: string[];
  itemIds?: string[];
}

export interface CouponUsage {
  traineeId: string;
  usedAt: Date;
  orderId: string;
  discountAmount: number;
}

export interface Coupon {
  id: string;
  code: string; // Case-insensitive promo code
  description?: string;
  
  // Discount configuration
  type: CouponType;
  value: number; // Percentage or fixed amount
  currency?: string; // For fixed amount discounts
  
  // Applicability
  applicability: CouponApplicability;
  applicableCategoryIds?: string[];
  applicableItemIds?: string[];
  
  // Restrictions
  restrictions: CouponRestriction[];
  
  // Usage limits
  maxUses?: number; // Total usage limit
  usedCount: number; // Current usage count
  maxUsesPerTrainee?: number; // Per trainee limit
  
  // Validity period
  startDate: Date;
  endDate: Date;
  
  // Status
  status: CouponStatus;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Tracking
  usageHistory: CouponUsage[];
  
  // Additional configuration
  autoApply?: boolean;
  stackable?: boolean; // Can be combined with other coupons
  minimumOrderValue?: number;
}

// Coupon filter and query types
export interface CouponFilter {
  status?: CouponStatus;
  type?: CouponType;
  applicability?: CouponApplicability;
  active?: boolean; // Filter for currently active coupons
  code?: string; // Search by specific code
  searchQuery?: string;
}

export interface CouponQuery {
  filter?: CouponFilter;
  sort?: 'createdAt' | 'endDate' | 'value';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
