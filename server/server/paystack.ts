import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata: {
      userId: string;
      subscriptionType: string;
    };
  };
}

export interface PaystackSubscriptionData {
  email: string;
  amount: number;
  reference: string;
  metadata: {
    userId: string;
    subscriptionType: 'premium';
    plan: 'monthly';
  };
}

export class PaystackService {
  private headers = {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  async initializeTransaction(data: PaystackSubscriptionData): Promise<PaystackInitializeResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Paystack verification error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY!)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }

  generateReference(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `premium_${userId}_${timestamp}_${random}`;
  }
}

export const paystackService = new PaystackService();
