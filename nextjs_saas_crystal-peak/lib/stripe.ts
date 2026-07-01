import Stripe from 'stripe';

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY. Add it to .env.local or your deployment environment.');
  }

  return new Stripe(secretKey);
}
