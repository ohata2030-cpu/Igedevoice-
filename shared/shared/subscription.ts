// Subscription and payment types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly';
  features: string[];
}

export const PREMIUM_PLAN: SubscriptionPlan = {
  id: 'premium_monthly',
  name: 'Premium Dating',
  price: 250000, // ₦2,500 in kobo (Paystack uses kobo)
  currency: 'NGN',
  duration: 'monthly',
  features: [
    'Advanced matchmaking based on detailed preferences',
    'Age bracket filtering',
    'Complexion and physical preferences',
    'Location-based matching',
    'Body size and height preferences',
    'Relationship purpose alignment',
    'Priority profile visibility',
    'Unlimited messaging',
    'Extended photo gallery (5 photos vs 3)',
    'Read receipts and message status',
  ],
};

export interface PaymentIntent {
  userId: string;
  email: string;
  plan: SubscriptionPlan;
  reference: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan?: SubscriptionPlan;
  expiresAt?: Date;
  daysRemaining?: number;
}
