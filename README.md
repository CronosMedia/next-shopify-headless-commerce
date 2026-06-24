# Veridis Shopify Headless Storefront

Reusable Shopify headless storefront built with Next.js, React and the Shopify
Storefront API.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and provide the Shopify credentials, then start
the development server:

```bash
npm run dev
```

The storefront is available at [http://localhost:3000](http://localhost:3000).


## Production setup

Before using this project as a real production storefront, review:

- `docs/production-readiness.md`
- `docs/qa-checklist.md`

## Shopify Shipping Setup

For the demo checkout, make sure the Shopify shipping zone includes Romania,
the products are assigned to the correct shipping profile, products are marked
as physical products, and variants have a weight set.

For free shipping over 500 lei, use two separate shipping rates instead of only
enabling `Offer free shipping` on the standard rate:

```text
Shipping zone: Romania

Rate 1:
Name: Standard
Condition: Order amount 0 - 499.99 lei
Price: 25 lei

Rate 2:
Name: Livrare gratuită
Condition: Order amount minimum 500 lei
Maximum: none
Price: 0 lei
```

If Shopify Checkout shows `Items in the cart do not meet price or weight
requirements to qualify for shipping`, first check the shipping profile,
shipping zone, location fulfillment, physical product setting, variant weights,
and whether the rates are configured as separate rates.

## Quality Checks

```bash
npm run codegen
npm run lint
npm run typecheck
npm run build
```

## End-To-End Tests

The Playwright smoke suite starts the storefront on port `3100` and uses the
locally installed Google Chrome:

```bash
npm run test:e2e
```

Interactive mode:

```bash
npm run test:e2e:ui
```

The initial suite covers:

- homepage and primary navigation;
- collections index;
- deterministic search rendering;
- wishlist hydration and removal;
- anonymous access denial for order cancellation.

The tests do not create orders or mutate Shopify customer data.
