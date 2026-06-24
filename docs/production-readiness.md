# Maison Outdoor - Production Readiness

This document describes what is implemented in the current codebase, what depends on Shopify configuration, and what still needs provider or production setup before launch.

Current status: production-ready candidate for storefront, customer account, cart, checkout, billing profile, and wishlist flows. Invoice/AWB remain demo/provider-dependent. Contact form/email requires real-environment verification before production use.

## 1. Implemented / Real

- Shopify Storefront products, collections, cart, and checkout handoff are implemented through Storefront API flows.
- Customer authentication is implemented with Shopify customer access tokens.
- Customer account page loads customer data and order/account context.
- Customer shipping addresses are read and written against Shopify customer addresses.
- Billing profiles are persisted on Shopify customer metafields.
- Billing profile readable summary is persisted separately on a Shopify customer metafield for store-owner visibility in Shopify Admin.
- Wishlist is persisted on a Shopify customer metafield for logged-in users.
- Guest wishlist remains local-only in `localStorage`.
- Cart attributes carry billing and order context into Shopify checkout/order data.
- Admin orders list is implemented against Shopify Admin API.
- Admin order detail is implemented and shows billing, invoice, and AWB context.
- Invoice controls exist in admin as demo/provider-ready flows. There is no fully validated real billing provider integration in this moment.
- AWB controls exist in admin as demo/provider-ready flows. There is no real courier/logistics provider integration in this moment.
- CUI lookup is connected to ANAF public API v9 with a fallback request to `lista-firme.info`.

## 2. Shopify Configuration Required

### Admin API scopes

The Admin API token must include:

- `read_customers`
- `write_customers`

Regenerate or reinstall the Shopify app token after changing scopes.

Additional Admin API access is also needed for the existing admin/order flows. Keep the token aligned with the exact Shopify APIs used by the deployment.

### Customer metafield definitions

Recommended customer metafield definitions:

- `maison.billing_profiles`
  - Owner: Customer
  - Type: JSON
  - Purpose: full billing profiles JSON, source of truth for the app

- `maison.billing_profiles_summary`
  - Owner: Customer
  - Type: Multi-line text
  - Purpose: readable billing profile summary for store owner/admin visibility

- `maison.wishlist`
  - Owner: Customer
  - Type: JSON
  - Purpose: persistent wishlist for logged-in users

The app can read/write metafields through the Admin API even if the Shopify Admin definition is missing, but definitions make the data easier to inspect and manage in Shopify Admin.

### Shipping

- Romania must be included in the Shopify shipping zone.
- Free shipping over 500 lei should be configured as a separate Shopify shipping rate.
- Products must have correct weight and shipping profile configuration.

### Checkout and payments

- Checkout and payment provider behavior is handled by Shopify.
- Saved payment methods are not implemented in the custom account UI.

## 3. Environment Variables

Required or supported env names, without real values:

- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION`
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN`
- `SHOPIFY_ADMIN_API_VERSION`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `AWB_PROVIDER`
- `INVOICING_PROVIDER`
- `OBLIO_EMAIL`
- `OBLIO_SECRET`
- `OBLIO_CIF`
- `OBLIO_DEFAULT_SERIES`
- `SMARTBILL_EMAIL`
- `SMARTBILL_TOKEN`
- `SMARTBILL_CIF`
- `SMARTBILL_DEFAULT_SERIES`

Notes:

- `SHOPIFY_ADMIN_ACCESS_TOKEN` is preferred by the Admin helper; `SHOPIFY_ADMIN_API_ACCESS_TOKEN` is accepted as a fallback.
- `SHOPIFY_ADMIN_API_VERSION` defaults in code if missing, but production should set it explicitly.
- The Admin API token must be regenerated or the app reinstalled after scope changes.
- Do not commit real tokens, passwords, invoice credentials, or provider secrets.
- The contact form currently has no email-provider env variables because the endpoint is not connected to a real email provider.

## 4. Demo / Provider-Dependent Areas

- Invoice provider:
  - Invoice flows are currently implemented as demo/provider-ready administrative flows.
  - A real production deployment requires integration with billing provider APIs such as SmartBill, FGO, Oblio, an e-Factura provider, or another approved fiscal provider.
  - `INVOICING_PROVIDER=demo` uses a demo invoice response and local invoice download route.
  - `oblio` and `smartbill` services exist, but require real credentials and provider-side validation before production use.
  - The admin interface/structure is prepared, but the real API connection and end-to-end fiscal validation are a future production step.

- AWB/logistics provider:
  - AWB flows are currently implemented as demo/provider-ready administrative flows.
  - A real production deployment requires integration with logistics provider APIs such as Sameday, FAN Courier, DPD, Cargus, or another courier provider.
  - `AWB_PROVIDER=demo` generates simulated AWB data on Shopify order metafields.
  - Any non-demo provider currently returns a not-configured response in the AWB endpoint.
  - The admin interface/structure is prepared, but the real API connection and courier-side fulfillment behavior are a future production step.

- Transactional emails:
  - Shopify checkout/customer transactional emails are handled by Shopify.
  - The custom contact form endpoint is currently not configured to send email and returns a 503 response after validation.
  - No SMTP/Resend/Nodemailer/Postmark/Mailgun/SendGrid provider is currently wired in the app.
  - Before production use, connect a real email provider and test valid submit, received email, failure messaging, required-field validation, and sensitive-data handling in the real environment.

- ANAF/CUI check:
  - The CUI endpoint calls ANAF public API v9 and falls back to `lista-firme.info`.
  - It uses in-memory cache and should be monitored for availability/rate-limit behavior in production.

- Product/demo content:
  - Product data comes from Shopify.
  - Some static imagery and editorial assets in `public/images` may still be campaign/demo assets and should be reviewed before launch.

## 5. Known Implementation Notes

- Billing profiles are saved in `maison.billing_profiles`.
- Billing profile read has legacy fallback/migration from `custom.billing_profiles`.
- Billing summary is saved separately in `maison.billing_profiles_summary` so Shopify Admin users can read the data without parsing the full JSON.
- Wishlist for logged-in users is saved in `maison.wishlist`.
- Guest wishlist remains in `localStorage` under `wishlist_items`.
- On login, local guest wishlist is merged into account wishlist.
- After login, Shopify customer metafield is the source of truth for wishlist.
- For production performance, wishlist can later be optimized to store only `productId`, `productHandle`, `variantId`, and `addedAt`, then hydrate product details from Shopify.
- Cart billing attributes are used for the current order/checkout context. Saving to account is separate and only happens when the user chooses to save billing data.
- Contact form UI posts to `/api/contact`, but the current endpoint validates input and returns a "not configured" error. It does not send, simulate, or log a real email.

## 6. Production Checklist

- [ ] Admin API token has `read_customers` and `write_customers`.
- [ ] Admin API token has the order/metafield scopes required by admin order, invoice, and AWB flows.
- [ ] Customer metafield definitions are created:
  - [ ] `maison.billing_profiles`
  - [ ] `maison.billing_profiles_summary`
  - [ ] `maison.wishlist`
- [ ] Romania shipping zone is configured.
- [ ] Free shipping over 500 lei is configured as a separate rate.
- [ ] Product weights and shipping profiles are configured.
- [ ] Checkout is tested end to end.
- [ ] Payment provider is configured and tested in Shopify.
- [ ] Billing profile save/read is tested on desktop and mobile.
- [ ] Billing profile edit/delete is tested.
- [ ] Wishlist sync is tested on desktop, mobile, and iPad.
- [ ] Guest wishlist is tested after refresh.
- [ ] Local wishlist to account wishlist merge is tested after login.
- [ ] Account order list is tested.
- [ ] Order detail page is tested.
- [ ] Invoice status is clearly marked as demo/provider-dependent unless a real billing provider is connected.
- [ ] Real billing provider is selected and validated, for example SmartBill, FGO, Oblio, e-Factura provider, or another approved provider.
- [ ] AWB status is clearly marked as demo/provider-dependent unless a real courier provider is connected.
- [ ] Real courier provider is selected and validated, for example Sameday, FAN Courier, DPD, Cargus, or another approved provider.
- [ ] Contact form status is decided: connected to a provider or intentionally disabled.
- [ ] Contact form valid submit is tested in the real environment.
- [ ] Contact email is received by the configured destination inbox.
- [ ] Contact form failure state is tested by disabling or misconfiguring the email provider in a safe non-production environment.
- [ ] Contact form required-field validation is tested.
- [ ] Contact form does not expose provider secrets or sensitive internals to the client.
- [ ] No `console.*` debug output remains.
- [ ] API responses do not expose tokens or internal customer IDs unnecessarily.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `git diff --check` passes.
