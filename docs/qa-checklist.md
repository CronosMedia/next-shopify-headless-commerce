# QA Checklist

Use this checklist before a production deploy or before tagging a release candidate.

## Guest Flow

- [ ] Browse products.
- [ ] Open product detail page.
- [ ] Add product to cart.
- [ ] Update cart quantity.
- [ ] Remove item from cart.
- [ ] Add item to wishlist as guest.
- [ ] Refresh page and confirm guest wishlist is kept locally.
- [ ] Remove item from guest wishlist.
- [ ] Checkout as guest.
- [ ] Contact form behavior is verified.

## Logged-In Customer Flow

- [ ] Register a new customer.
- [ ] Login.
- [ ] Logout.
- [ ] Account page loads customer data.
- [ ] Edit profile, if enabled.
- [ ] Add shipping address.
- [ ] Edit shipping address.
- [ ] Delete shipping address.
- [ ] Add billing profile PF.
- [ ] Add billing profile PJ.
- [ ] Edit billing profile.
- [ ] Delete billing profile.
- [ ] Billing profile persists after refresh.
- [ ] Billing profile is visible on another device after login.
- [ ] Add wishlist item on desktop.
- [ ] Wishlist item appears on mobile/iPad after login.
- [ ] Remove wishlist item on mobile.
- [ ] Wishlist item disappears on desktop after refresh.
- [ ] Create test order.
- [ ] Account order list updates.
- [ ] Order detail opens.
- [ ] Invoice/download behavior is checked.

## Admin Flow

- [ ] Admin login.
- [ ] Admin orders list loads.
- [ ] Admin order detail opens.
- [ ] Invoice status/link is visible.
- [ ] Invoice action is correctly enabled or disabled.
- [ ] AWB/tracking status is visible.
- [ ] AWB action is correctly enabled or disabled.
- [ ] Document buttons show the correct loading/error/success states.

## Mobile / Tablet Layout

- [ ] Account forms.
- [ ] Address modal.
- [ ] Billing modal/section.
- [ ] Wishlist grid.
- [ ] Cart.
- [ ] Checkout handoff.
- [ ] Legal/info tabs.
- [ ] iPad/Safari address fields alignment.
- [ ] iPad/Safari billing fields alignment.

## Regression Commands

```bash
npm run lint
npm run typecheck
npm run build
git diff --check
```
