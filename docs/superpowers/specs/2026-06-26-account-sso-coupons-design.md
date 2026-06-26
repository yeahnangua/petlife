# PetLife Account SSO And Coupons Design

## Goal

Build a real account and coupon system for the mobile app:

- Mobile users must log in before viewing any mobile app content.
- Login is SSO-only. The first version uses a WeChat-style button that signs into the seeded test user.
- User identity is stored in the database through server-side sessions.
- Coupons belong to users, can be selected on order confirmation, reduce the payable amount, and become used after order creation.
- Admin users can create coupon campaigns, issue coupons to users, and disable campaigns or individual coupons.

## Scope

This design covers the user-facing mobile app, backend API, SQLite schema, and admin app. It does not integrate real WeChat OAuth yet. The simulated WeChat login must be shaped so a real provider can replace it later without changing all user APIs.

## Architecture

### Authentication

The backend replaces the unconditional demo-user middleware with token-based session authentication.

- `POST /api/auth/wechat-login` creates or refreshes a database session for the seeded test account `u_demo_001`.
- The response returns `{ token, user }`.
- Mobile clients persist the token in local storage and send it as `Authorization: Bearer <token>` on every request.
- `/api/user/*` routes require a valid session and load `req.user`.
- `GET /api/auth/session` returns the current user for an existing token.
- `POST /api/auth/logout` deletes the current session.

The first implementation stores opaque random tokens in `user_sessions`. Tokens expire in 30 days and can be revoked on logout. This keeps SSO state in the database and avoids adding a JWT dependency.

### Mobile Route Guard

The mobile router gets a `/login` route. Every route except `/login` requires an authenticated mobile session. On first load, the auth store checks local token state and validates it through `/api/auth/session`.

Unauthenticated users are redirected to `/login?redirect=<target>`. After simulated WeChat login, the app returns to the original target.

### Coupons

Coupon data is split into campaigns and user-owned coupons.

- `coupon_campaigns`: reusable coupon rules and admin status.
- `user_coupons`: issued coupon instances tied to a user.

First-version rules are intentionally simple:

- Fixed amount discount only.
- Product orders only.
- Minimum order subtotal threshold.
- Validity window.
- Status values:
  - Campaign: `active`, `disabled`.
  - User coupon: `available`, `used`, `disabled`, `expired`.

The user coupon list endpoint computes availability from status, campaign status, validity window, and selected cart subtotal.

### Checkout And Orders

`GET /api/user/coupons` lists the user's coupons and optional availability against a subtotal.

`POST /api/user/orders` accepts optional `coupon_id`.

During order creation the backend:

1. Loads selected valid cart items.
2. Computes subtotal and shipping.
3. Validates the coupon belongs to the user and is available for the subtotal.
4. Persists order pricing snapshots: subtotal, shipping fee, discount amount, payable total, coupon id/name.
5. Marks the user coupon as used in the same transaction.
6. Deletes purchased cart items and updates inventory.

Order detail and admin order detail expose the coupon snapshot fields so historical orders do not change if campaigns are edited later.

### Admin Coupon Management

Admin APIs stay behind the existing `x-admin-key` middleware.

Admin endpoints:

- `GET /api/admin/coupon-campaigns`
- `POST /api/admin/coupon-campaigns`
- `PUT /api/admin/coupon-campaigns/:id`
- `POST /api/admin/coupon-campaigns/:id/issue`
- `GET /api/admin/user-coupons`
- `PUT /api/admin/user-coupons/:id`

Admin UI adds a `优惠券` navigation item and page. It supports campaign list, campaign creation/editing, issuing a campaign to a user id, and disabling individual user coupons.

## Data Model

`user_sessions`

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL`
- `token TEXT NOT NULL UNIQUE`
- `provider TEXT NOT NULL`
- `provider_subject TEXT NOT NULL`
- `expires_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`coupon_campaigns`

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT NOT NULL`
- `discount_amount INTEGER NOT NULL`
- `min_order_amount INTEGER NOT NULL DEFAULT 0`
- `total_limit INTEGER NOT NULL DEFAULT 0`
- `issued_count INTEGER NOT NULL DEFAULT 0`
- `status TEXT NOT NULL`
- `valid_from TEXT NOT NULL`
- `valid_to TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`user_coupons`

- `id TEXT PRIMARY KEY`
- `campaign_id TEXT NOT NULL`
- `user_id TEXT NOT NULL`
- `status TEXT NOT NULL`
- `issued_at TEXT NOT NULL`
- `used_at TEXT NOT NULL DEFAULT ''`
- `used_order_id TEXT NOT NULL DEFAULT ''`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`orders` gains:

- `subtotal_amount INTEGER NOT NULL DEFAULT 0`
- `shipping_fee INTEGER NOT NULL DEFAULT 0`
- `discount_amount INTEGER NOT NULL DEFAULT 0`
- `payable_amount INTEGER NOT NULL DEFAULT 0`
- `coupon_id TEXT NOT NULL DEFAULT ''`
- `coupon_name_snapshot TEXT NOT NULL DEFAULT ''`

For compatibility, `total_amount` remains the payable product order amount used by existing views until adapters are expanded.

## Error Handling

- Missing or invalid user token: `401 / 40100 / unauthorized`.
- Expired token: `401 / 40101 / session expired`.
- Invalid coupon: `409 / 40910 / coupon is unavailable`.
- Coupon below threshold: `409 / 40911 / coupon threshold is not met`.
- Campaign disabled or quota exhausted: `409 / 40912`.

The frontend central request wrapper handles `401` by clearing mobile auth state and redirecting to login.

## Testing

Backend tests cover:

- User APIs reject missing tokens.
- Simulated WeChat login creates a database session and authorizes `/api/user/profile`.
- Coupon campaigns can be created, issued, disabled, and listed by admin.
- User coupons list is account-scoped.
- Order creation applies a valid coupon and marks it used.
- Invalid or already-used coupons are rejected without mutating order/cart data.

Mobile tests cover:

- Router redirects unauthenticated users to login.
- Login button stores token and returns to redirect target.
- User requests send `Authorization`.
- Order confirmation lists usable coupons, applies one to totals, submits `coupon_id`, and shows discount.

Admin tests cover:

- Coupon nav appears.
- Admin can create a campaign and issue it to a user through API calls.

Browser verification covers:

- Mobile unauthenticated home redirects to login.
- Clicking WeChat login enters home.
- Coupon appears in confirm order and reduces payable amount.
- Admin coupon page can create and issue a campaign.

