export interface Promotion {
  id: string;
  listing_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  amount_paid: number;
  payment_id?: string;
  created_at: string;
}

export interface PromotionPlan {
  id: string;
  name: string;
  duration: number; // in days
  price: number;
  description: string;
}

export const PROMOTION_PLANS: PromotionPlan[] = [
  {
    id: 'weekly',
    name: 'Mise en avant 7 jours',
    duration: 7,
    price: 2.99,
    description: 'Votre annonce sera mise en avant pendant 7 jours'
  },
  {
    id: 'monthly',
    name: 'Mise en avant 30 jours',
    duration: 30,
    price: 9.99,
    description: 'Votre annonce sera mise en avant pendant 30 jours'
  }
];