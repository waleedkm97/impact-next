/**
 * Service type definitions
 * Represents consulting and corporate training services
 */

export type ServiceType = 'consulting' | 'corporate-training' | 'assessment' | 'leadership-development';
export type ServiceStatus = 'draft' | 'published' | 'archived';
export type ServiceDelivery = 'on-site' | 'remote' | 'hybrid';

export interface ServiceDeliverable {
  id: string;
  title: string;
  description?: string;
  estimatedHours?: number;
  order: number;
}

export interface ServicePricing {
  basePrice: number;
  currency: string;
  pricingModel: 'fixed' | 'hourly' | 'per-participant' | 'custom';
  minParticipants?: number;
  maxParticipants?: number;
  hourlyRate?: number;
  customQuote?: boolean;
}

export interface ServiceTarget {
  audience?: string;
  industries?: string[];
  companySizes?: string[];
  jobRoles?: string[];
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Categorization
  categoryId?: string;
  type: ServiceType;
  delivery: ServiceDelivery;
  
  // Service details
  objectives: string[];
  outcomes: string[];
  deliverables: ServiceDeliverable[];
  
  // Target audience
  target: ServiceTarget;
  
  // Pricing
  pricing: ServicePricing;
  
  // Duration
  estimatedDuration?: string; // e.g., "2-3 days", "1 week"
  estimatedHours?: number;
  
  // Consultant/Trainer information
  consultantId?: string;
  consultantName?: string;
  consultantBio?: string;
  
  // Media
  image?: string;
  thumbnail?: string;
  
  // Status and flags
  featured: boolean;
  published: boolean;
  status: ServiceStatus;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Additional configuration
  requireConsultation?: boolean;
  consultationForm?: string;
}

// Service filter and query types
export interface ServiceFilter {
  type?: ServiceType;
  delivery?: ServiceDelivery;
  categoryId?: string;
  featured?: boolean;
  published?: boolean;
  customQuote?: boolean;
  searchQuery?: string;
}

export interface ServiceQuery {
  filter?: ServiceFilter;
  sort?: 'createdAt' | 'price' | 'title' | 'popularity';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
