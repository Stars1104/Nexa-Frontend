import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

if (!publishableKey) {
  // eslint-disable-next-line no-console
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe Elements will be disabled.');
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);


