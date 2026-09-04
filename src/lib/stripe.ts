import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use the latest API version supported by stripe@17
  apiVersion: '2025-02-24.acacia',
})
