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
- [ ] Invoice flow is marked/documented as demo or provider-dependent when no real billing provider is configured.
- [ ] Invoice flow does not promise real invoice generation without a real provider.
- [ ] AWB/tracking status is visible.
- [ ] AWB action is correctly enabled or disabled.
- [ ] AWB flow is marked/documented as demo or provider-dependent when no real courier provider is configured.
- [ ] AWB flow does not promise real courier shipment generation without a real provider.
- [ ] Document buttons show the correct loading/error/success states.

## Contact Form / Email

- [ ] Complete the contact form with valid name, email, message, and privacy consent.
- [ ] Submit the form.
- [ ] Confirm the email is received in the configured destination inbox when a real email provider is connected.
- [ ] Verify the success message when sending succeeds.
- [ ] Misconfigure or disable the email provider in a safe environment and verify the user-facing error.
- [ ] Verify required-field validation for name, email, message, and privacy consent.
- [ ] Verify invalid email format is rejected by the browser/UI.
- [ ] Verify anti-spam/honeypot behavior if one is added.
- [ ] Verify no provider secrets or sensitive internals are exposed in the client response.

## Invoice / AWB Provider Status

- [ ] Confirm invoice buttons/admin flow are marked or documented as demo/provider-dependent.
- [ ] Confirm AWB buttons/admin flow are marked or documented as demo/provider-dependent.
- [ ] Confirm no screen promises real invoice generation unless a billing provider is configured and tested.
- [ ] Confirm no screen promises real AWB/courier generation unless a logistics provider is configured and tested.
- [ ] Confirm document links/buttons disabled/enabled behavior is correct for missing, demo, error, and generated states.
- [ ] Confirm selected billing provider credentials and fiscal behavior are validated before production use.
- [ ] Confirm selected courier provider credentials and shipment behavior are validated before production use.

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
