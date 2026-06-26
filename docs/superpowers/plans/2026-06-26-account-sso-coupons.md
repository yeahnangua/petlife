# Account SSO And Coupons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SSO-only mobile login, authenticated user APIs, real user-bound coupons, coupon checkout redemption, and admin coupon management.

**Architecture:** Implement backend session auth first, then coupon persistence and order redemption, then mobile route guards and coupon UI, then admin campaign management. Use SQLite migrations and existing Express/Vue/Pinia patterns.

**Tech Stack:** Express, better-sqlite3, Vue 3, Pinia, Vue Router, Vitest, Playwright MCP.

---

## Task 1: Backend Auth Sessions

**Files:**
- Create: `server/src/db/migrations/002_auth_coupons.sql`
- Create: `server/src/repositories/sessionRepository.js`
- Create: `server/src/services/authService.js`
- Create: `server/src/controllers/authController.js`
- Create: `server/src/routes/auth.js`
- Create: `server/src/middleware/requireUserAuth.js`
- Modify: `server/src/app.js`
- Modify: `server/src/routes/user.js`
- Test: `server/tests/user-auth.test.js`

- [ ] Write failing tests for missing auth on `/api/user/profile`, WeChat login creating a session, session lookup, and logout.
- [ ] Run `npm run test:server -- user-auth.test.js` and verify expected failures.
- [ ] Add auth migration tables and repositories.
- [ ] Implement auth service/controller/routes and require-user middleware.
- [ ] Mount `/api/auth` and replace `attachDemoUser`.
- [ ] Run auth tests and affected existing user API tests.
- [ ] Commit backend auth.

## Task 2: Backend Coupons And Order Redemption

**Files:**
- Create: `server/src/repositories/couponRepository.js`
- Create: `server/src/services/couponService.js`
- Create: `server/src/controllers/userCouponController.js`
- Create: `server/src/controllers/adminCouponController.js`
- Modify: `server/src/routes/user.js`
- Modify: `server/src/routes/admin.js`
- Modify: `server/src/services/orderService.js`
- Modify: `server/src/repositories/orderRepository.js`
- Modify: `server/src/services/profileService.js`
- Modify: `server/src/db/seed.js`
- Test: `server/tests/user-coupons-orders.test.js`
- Test: `server/tests/admin-coupons.test.js`

- [ ] Write failing backend tests for user coupon list, coupon order redemption, already-used coupon rejection, admin campaign creation, issuing, disabling.
- [ ] Run focused server tests and verify failures.
- [ ] Implement coupon repositories and services.
- [ ] Add user and admin coupon controllers/routes.
- [ ] Extend order persistence with pricing snapshots and coupon usage transaction.
- [ ] Seed one active campaign and available coupon for `u_demo_001`.
- [ ] Run focused server tests and existing order/cart/profile tests.
- [ ] Commit backend coupons.

## Task 3: Mobile Auth Store, API Headers, Route Guard, Login UI

**Files:**
- Create: `src/api/auth.js`
- Create: `src/stores/auth.js`
- Create: `src/views/LoginView.vue`
- Modify: `src/api/http.js`
- Modify: `src/router/index.js`
- Modify: `src/App.vue`
- Test: `src/tests/mobile-auth.test.js`
- Test: `src/tests/api-client.test.js`

- [ ] Write failing client tests for route redirect, login flow, token persistence, auth header injection, and 401 clearing.
- [ ] Run focused client tests and verify failures.
- [ ] Implement mobile auth API/store and request auth header support.
- [ ] Add `/login` route and global auth guard.
- [ ] Add mobile login page with a WeChat-style SSO button.
- [ ] Hide top/tab shell on login.
- [ ] Run focused client tests and affected shell/router tests.
- [ ] Commit mobile auth.

## Task 4: Mobile Coupon List And Checkout Selection

**Files:**
- Modify: `src/api/user.js`
- Create: `src/stores/coupons.js`
- Create: `src/views/CouponListView.vue`
- Modify: `src/router/index.js`
- Modify: `src/views/OrderConfirmView.vue`
- Modify: `src/views/ProfileView.vue`
- Modify: `src/views/MemberView.vue`
- Modify: `src/adapters/profile.js`
- Test: `src/tests/mobile-coupons-checkout.test.js`
- Test: `src/tests/pricing.test.js`

- [ ] Write failing client tests for coupon list, profile coupon count, confirm-order coupon selection, displayed discount, and submitted `coupon_id`.
- [ ] Run focused client tests and verify failures.
- [ ] Implement coupon API/store/adapters.
- [ ] Add coupon list route and link from profile/member.
- [ ] Load available coupons on confirm order and apply selected coupon to pricing.
- [ ] Submit `coupon_id` to order API.
- [ ] Run focused client tests and existing cart/order flow tests.
- [ ] Commit mobile coupons.

## Task 5: Admin Coupon Management

**Files:**
- Create: `admin/src/api/coupons.js`
- Create: `admin/src/views/CouponAdminView.vue`
- Modify: `admin/src/router/index.js`
- Modify: `admin/src/layouts/AdminLayout.vue`
- Test: `admin/src/tests/admin-coupons.test.js`
- Test: `admin/src/tests/session-auth.test.js`

- [ ] Write failing admin tests for coupon nav, campaign list, create campaign, issue campaign, and disable coupon.
- [ ] Run focused admin tests and verify failures.
- [ ] Implement admin coupon API module.
- [ ] Add route/nav item and coupon management page.
- [ ] Run focused admin tests and existing session auth tests.
- [ ] Commit admin coupon management.

## Task 6: Full Verification

**Files:**
- Modify as needed only for issues found during verification.

- [ ] Run `npm run test:server`.
- [ ] Run `npm run test:client`.
- [ ] Run `npm run test:admin`.
- [ ] Run `npm run build`.
- [ ] Run `npm run build:admin`.
- [ ] Run `git diff --check`.
- [ ] Start backend, mobile, and admin dev servers.
- [ ] Use Playwright to verify mobile login redirect, WeChat login, coupon checkout redemption, and admin coupon create/issue flow.
- [ ] Commit verification fixes if needed.
- [ ] Mark goal complete only after all requirements have direct evidence.

