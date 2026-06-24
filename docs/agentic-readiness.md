# Agentic Readiness

This document covers the current readiness of the Maison Outdoor headless storefront for search engines, AI crawlers, product discovery surfaces, and future agentic commerce integrations.

## Current Structured Data

The storefront now exposes:

- Global `OnlineStore` JSON-LD.
- Global `WebSite` JSON-LD with `SearchAction` targeting `/search?q={search_term_string}`.
- Product page `Product` JSON-LD.
- Product page `Offer` data with price, currency, URL, condition, and availability.
- Product page `BreadcrumbList`.
- Collection page `BreadcrumbList`.
- Collection/listing `CollectionPage` and `ItemList`.
- Home page `ItemList` for featured/trending products.
- Canonical metadata for home, product, collection, and static informational pages.
- OpenGraph/Twitter metadata for global defaults, product pages, and collection pages.
- Sitemap generated from static routes, Shopify products, and Shopify collections.
- Robots rules that disallow internal/private routes such as API, admin, account, cart, invoice, logout, search, and wishlist.

## Shopify Dependencies

AI shopping surfaces and product discovery quality depend heavily on Shopify product data:

- Shopify Catalog readiness in Shopify Admin.
- Product titles that are clear and specific.
- Product descriptions that are real, complete, and useful.
- Product options and variants that are named clearly.
- Product images that show the actual product.
- Live price and availability from Shopify.
- Vendor/brand quality.
- Product type/category taxonomy.
- Product metafields for materials, dimensions, weight, intended use, season, compatibility, and other agent-readable attributes.
- Compliance disclosures where applicable.
- Shipping weight and shipping profile correctness.

## Prepared For Agentic Commerce

The storefront is prepared in the following ways:

- Product pages are crawlable.
- Product URLs are clean and stable: `/products/[handle]`.
- Collection URLs are clean and stable: `/collections/[handle]`.
- Product structured data is available on product pages.
- Offer price and availability are derived from Shopify variant data.
- Breadcrumbs clarify product and collection context.
- Cart and checkout flow are real and powered by Shopify.
- Checkout handoff remains Shopify-owned.
- Sitemap and robots are available for crawler discovery and route control.

## Not Implemented

The following are not implemented in this codebase:

- Custom Shopify Catalog API integration.
- Universal Commerce Protocol custom app.
- Custom MCP server for product discovery or shopping agents.
- AI chat assistant on the storefront.
- Shop sign-in personalization through Shopify Catalog API.
- Custom AI channel integration.
- Product feed enrichment beyond Storefront API data and JSON-LD.

## Product Data Quality Checklist

- [ ] Product title is clear and specific.
- [ ] Product description is real, useful, and not placeholder text.
- [ ] Product images are relevant, sharp, and show the product clearly.
- [ ] Product variants are clear and buyer-friendly.
- [ ] Product availability is accurate in Shopify.
- [ ] Product price is accurate in Shopify.
- [ ] Product currency is correct for the market.
- [ ] Product has weight configured for shipping.
- [ ] Product has correct vendor/brand.
- [ ] Product has correct product type/category.
- [ ] Product taxonomy is consistent across collections.
- [ ] Product metafields cover useful agent-readable details:
  - [ ] material;
  - [ ] weight;
  - [ ] dimensions;
  - [ ] season;
  - [ ] activity/use-case;
  - [ ] compatibility;
  - [ ] care instructions;
  - [ ] technical specs.
- [ ] Compliance disclosures are present when the product requires them.
- [ ] Product data is verified in Shopify Admin and storefront output.

## Future Checklist

- [ ] Validate Product JSON-LD with Google Rich Results Test.
- [ ] Validate JSON-LD with Schema.org validator.
- [ ] Verify sitemap output in production.
- [ ] Verify robots output in production.
- [ ] Verify canonical URLs use the production domain.
- [ ] Add `NEXT_PUBLIC_SITE_URL` or `SITE_URL` in production environment.
- [ ] Improve product taxonomy in Shopify Admin.
- [ ] Enrich product descriptions/specifications.
- [ ] Add product metafields for material, weight, dimensions, season, activity, compatibility, and compliance.
- [ ] Verify Shopify Catalog readiness in Shopify Admin.
- [ ] Decide whether search results should remain `noindex`.
- [ ] Decide whether wishlist should remain `noindex` for all users.
- [ ] Define a strategy before adding custom Catalog API, UCP, MCP, or AI assistant integrations.
