/**
 * Setup Stripe Products and Prices for CloudDesk
 *
 * Run this script once to create the necessary products and prices in Stripe.
 * Usage: npx ts-node src/scripts/setupStripe.ts
 *
 * After running, copy the Price IDs to your .env file.
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRODUCTS = {
  team: {
    name: 'CloudDesk Team',
    description: 'For growing teams - up to 25 users, 50 instances, 10 concurrent sessions',
    prices: {
      monthly: 9900, // $99.00 in cents
      yearly: 99000, // $990.00 in cents (17% discount)
    },
  },
  enterprise: {
    name: 'CloudDesk Enterprise',
    description: 'For large organizations - unlimited users, instances, and sessions',
    prices: {
      monthly: 29900, // $299.00 in cents
      yearly: 299000, // $2990.00 in cents (17% discount)
    },
  },
};

interface PriceResults {
  team: { monthly: string; yearly: string };
  enterprise: { monthly: string; yearly: string };
}

async function createProducts(): Promise<PriceResults> {
  console.log('Creating Stripe products and prices...\n');

  const results: PriceResults = {
    team: { monthly: '', yearly: '' },
    enterprise: { monthly: '', yearly: '' },
  };

  for (const [tier, config] of Object.entries(PRODUCTS)) {
    console.log(`Creating ${tier} product...`);

    // Create product
    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: {
        tier,
        app: 'clouddesk',
      },
    });

    console.log(`  Product created: ${product.id}`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.prices.monthly,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier,
        billingCycle: 'monthly',
      },
    });

    console.log(`  Monthly price created: ${monthlyPrice.id}`);

    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.prices.yearly,
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        tier,
        billingCycle: 'yearly',
      },
    });

    console.log(`  Yearly price created: ${yearlyPrice.id}`);

    // Store results
    if (tier === 'team') {
      results.team.monthly = monthlyPrice.id;
      results.team.yearly = yearlyPrice.id;
    } else if (tier === 'enterprise') {
      results.enterprise.monthly = monthlyPrice.id;
      results.enterprise.yearly = yearlyPrice.id;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Setup complete! Add these values to your .env file:\n');
  console.log(`STRIPE_TEAM_MONTHLY_PRICE_ID=${results.team.monthly}`);
  console.log(`STRIPE_TEAM_YEARLY_PRICE_ID=${results.team.yearly}`);
  console.log(`STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=${results.enterprise.monthly}`);
  console.log(`STRIPE_ENTERPRISE_YEARLY_PRICE_ID=${results.enterprise.yearly}`);
  console.log('='.repeat(60));

  return results;
}

// Check if running directly
if (require.main === module) {
  createProducts()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error setting up Stripe:', error);
      process.exit(1);
    });
}

export { createProducts };
