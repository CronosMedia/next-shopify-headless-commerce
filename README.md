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
