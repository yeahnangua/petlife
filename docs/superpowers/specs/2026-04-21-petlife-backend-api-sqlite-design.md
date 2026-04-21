# PetLife Backend API + SQLite Design

Date: 2026-04-21

## 1. Context

`PetLife` currently has a Vue 3 mobile web frontend with mock data only. The current app can display product, service, cart, booking, and profile flows, but it has no backend API, no database persistence, no admin management API, and no file upload capability.

This document defines the first backend sub-project only:

- Build a standalone backend service
- Persist data in SQLite
- Expose user-facing APIs and admin APIs
- Support local image upload
- Exclude payment and full login/auth systems

User-facing frontend and admin frontend implementations are intentionally out of scope for this spec. They will consume the backend defined here in later phases.

## 2. Goals

The backend must provide a complete non-payment business loop for the PetLife project:

- Public browsing APIs for categories, products, services, stores, and time slots
- User APIs for profile, addresses, pets, cart, orders, and bookings
- Admin APIs for managing categories, products, services, stores, time slots, orders, and bookings
- SQLite persistence instead of in-memory mock state
- Local image upload for admin content management

## 3. Non-Goals

This phase explicitly does not include:

- Real login or registration
- JWT, sessions, or full role-based access control
- Payment, refund, invoice, or settlement flows
- Coupon, promotion, or points-ledger systems
- Complex SKU inventory matrices
- Logistics tracking
- Reviews, comments, or community features
- Cloud object storage

## 4. Scope Decisions

The following scope was confirmed during design:

- Backend stack: `Node.js + Express + better-sqlite3`
- Architecture: single backend service with internal module layering
- Admin protection: fixed `x-admin-key` header
- User-side behavior: requests act as one preset demo user
- Upload strategy: local file upload with static URL serving
- API scope: user APIs and admin APIs are both included in phase one

## 5. Architecture

## 5.1 Deployment Shape

The project remains front-end/back-end separated in runtime, but can stay in one repository:

- Frontend mobile web continues in the existing project root `src/`
- Backend is added under `server/`
- Frontend dev server calls backend through `/api`
- Backend also serves `/uploads/*` static assets

Recommended local development:

- Vite runs the user frontend
- Express runs the backend
- Vite proxies `/api` and `/uploads` to the backend in development

## 5.2 Backend Directory Structure

```text
server/
  package.json
  data/
    petlife.sqlite
    petlife.test.sqlite
  src/
    app.js
    server.js
    config/
      env.js
    db/
      index.js
      migrate.js
      seed.js
      migrations/
    middleware/
      adminAuth.js
      attachDemoUser.js
      uploadImage.js
      errorHandler.js
      notFound.js
    routes/
      public.js
      user.js
      admin.js
    controllers/
      publicController.js
      userAddressController.js
      userPetController.js
      userCartController.js
      userOrderController.js
      userBookingController.js
      adminCategoryController.js
      adminProductController.js
      adminServiceController.js
      adminStoreController.js
      adminTimeSlotController.js
      adminOrderController.js
      adminBookingController.js
      adminUploadController.js
    services/
      catalogService.js
      cartService.js
      orderService.js
      bookingService.js
      uploadService.js
    repositories/
      userRepository.js
      addressRepository.js
      petRepository.js
      categoryRepository.js
      productRepository.js
      serviceRepository.js
      storeRepository.js
      timeSlotRepository.js
      cartRepository.js
      orderRepository.js
      bookingRepository.js
    utils/
      apiResponse.js
      appError.js
      validators.js
  uploads/
```

## 5.3 Layer Boundaries

- `routes` define URL to controller mapping only
- `controllers` parse request input and shape responses
- `services` own business rules and cross-repository coordination
- `repositories` own direct SQLite access
- `middleware` owns admin key checks, demo user injection, upload parsing, and shared error handling

Rules:

- Controllers do not write SQL
- Repositories do not enforce business workflows
- Services do not manipulate Express response objects

This boundary is required because later both the user frontend and admin frontend will depend on the same backend codebase and the logic will grow quickly if not separated early.

## 6. Runtime and Security Model

## 6.1 Demo User Model

Phase one does not implement true authentication.

User-facing APIs behave as a preset demo user:

- `userId = u_demo_001`
- A middleware attaches the demo user to the request context
- User APIs never accept arbitrary `userId` from the client

This keeps the frontend simple while still allowing real database persistence.

## 6.2 Admin Protection

Admin APIs require:

- Header: `x-admin-key`
- Value must match the configured environment variable

If the header is missing or incorrect, the backend returns `401 Unauthorized`.

This is intentionally lightweight and only suitable for local development and portfolio demonstration.

## 6.3 Configuration

Backend configuration should come from environment variables:

- `PORT`
- `DB_PATH`
- `ADMIN_KEY`
- `UPLOAD_DIR`
- `BASE_URL` or a derived public origin for file URL generation

Defaults may be provided for local development, but the service must run without editing source code.

## 7. SQLite Data Model

The database uses normalized core business tables plus a few JSON text fields for display-oriented data. The goal is to stay simple while preserving enough structure for realistic CRUD and order persistence.

## 7.1 Core Tables

### `users`

- `id`
- `nickname`
- `phone`
- `avatar_url`
- `member_level`
- `points`
- `created_at`
- `updated_at`

### `addresses`

- `id`
- `user_id`
- `receiver_name`
- `receiver_phone`
- `region`
- `detail_address`
- `tag`
- `is_default`
- `created_at`
- `updated_at`

### `pets`

- `id`
- `user_id`
- `name`
- `type`
- `breed`
- `gender`
- `birthday`
- `weight`
- `neutered`
- `allergies_json`
- `preferences_json`
- `avatar_url`
- `color`
- `created_at`
- `updated_at`

### `categories`

- `id`
- `name`
- `slug`
- `pet_type`
- `sort_order`
- `cover_url`
- `is_enabled`
- `created_at`
- `updated_at`

### `products`

- `id`
- `category_id`
- `title`
- `subtitle`
- `pet_type`
- `price`
- `member_price`
- `original_price`
- `stock`
- `stock_status`
- `badge`
- `tags_json`
- `specs_json`
- `summary_json`
- `suitable_text`
- `cover_url`
- `status`
- `created_at`
- `updated_at`

### `product_images`

- `id`
- `product_id`
- `image_url`
- `sort_order`

### `services`

- `id`
- `title`
- `subtitle`
- `pet_type`
- `price`
- `original_price`
- `duration_minutes`
- `badge`
- `highlights_json`
- `summary_json`
- `notice_json`
- `cover_url`
- `status`
- `created_at`
- `updated_at`

### `service_images`

- `id`
- `service_id`
- `image_url`
- `sort_order`

### `stores`

- `id`
- `name`
- `phone`
- `address`
- `business_hours`
- `cover_url`
- `status`
- `created_at`
- `updated_at`

### `time_slots`

- `id`
- `label`
- `start_time`
- `end_time`
- `capacity`
- `sort_order`
- `is_enabled`
- `created_at`
- `updated_at`

### `cart_items`

- `id`
- `user_id`
- `product_id`
- `spec_key`
- `spec_label`
- `quantity`
- `selected`
- `created_at`
- `updated_at`

### `orders`

- `id`
- `order_no`
- `user_id`
- `status`
- `status_label`
- `total_amount`
- `remark`
- `receiver_name_snapshot`
- `receiver_phone_snapshot`
- `receiver_region_snapshot`
- `receiver_address_snapshot`
- `created_at`
- `updated_at`

### `order_items`

- `id`
- `order_id`
- `product_id`
- `product_title_snapshot`
- `product_cover_snapshot`
- `spec_label_snapshot`
- `unit_price_snapshot`
- `quantity`
- `line_total`

### `bookings`

- `id`
- `booking_no`
- `user_id`
- `pet_id`
- `pet_name_snapshot`
- `pet_type_snapshot`
- `service_id`
- `service_title_snapshot`
- `service_cover_snapshot`
- `service_price_snapshot`
- `store_id`
- `store_name_snapshot`
- `time_slot_id`
- `time_slot_label_snapshot`
- `booking_date`
- `status`
- `status_label`
- `contact_phone`
- `note`
- `created_at`
- `updated_at`

## 7.2 Data Modeling Rules

- Orders and bookings must store snapshot fields so historical records remain stable after catalog edits
- Cart items do not store full snapshots; they are validated against current product data when queried
- JSON text fields are allowed for tags, specs, summaries, notices, allergies, and preferences
- Images are stored as URLs, not binary blobs in SQLite

## 7.3 Status Rules

Order statuses:

- `pendingShipment`
- `completed`
- `cancelled`

Because payment is out of scope, new orders created in phase one should move directly into an operational status. Recommended behavior:

- Create order as `pendingShipment`

Booking statuses:

- `pendingService`
- `completed`
- `cancelled`

New bookings start as:

- `pendingService`

## 8. Core Business Rules

## 8.1 Product Browsing

- Only enabled categories and active products are returned from public APIs
- Product detail returns current inventory and image list
- Product list supports category, keyword, pet type, and pagination filters

## 8.2 Cart

- Cart stores products only, never services
- Adding the same product with the same spec merges quantity
- Querying cart marks invalid items when the product is missing, disabled, or out of stock
- Invalid cart items can be removed in one action

## 8.3 Order Creation

- Orders are created from currently selected valid cart items
- An order requires at least one selected valid cart item
- An order requires a valid address
- Order creation writes the order, order items, and removes the purchased cart items in one transaction
- Product stock must be decremented transactionally
- If stock is insufficient, order creation fails with a business conflict

## 8.4 Booking Creation

- Booking requires a valid pet, service, store, date, and time slot
- Only active services, stores, and enabled time slots are bookable
- Slot capacity is limited by the number of existing active bookings for that date and slot
- Booking creation fails if the slot is already full

## 8.5 Admin Content Management

- Admin can create, edit, disable, and delete categories, products, services, stores, and time slots
- Deleting records should be conservative where history exists
- Products or services referenced by historical orders or bookings should prefer status changes over hard delete
- In phase one, all active services are considered bookable at all active stores; `serviceId` in slot queries is validated for existence and status, but no separate service-store mapping table is introduced

## 9. API Design

## 9.1 Base Paths

- Public APIs: `/api/public`
- User APIs: `/api/user`
- Admin APIs: `/api/admin`
- Static uploads: `/uploads`

## 9.2 Response Format

All successful responses use:

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

List responses use:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0
    }
  }
}
```

Error responses also keep the same top-level keys, but return an HTTP error status and a non-zero `code`.

## 9.3 Public APIs

- `GET /api/public/categories`
- `GET /api/public/products`
- `GET /api/public/products/:id`
- `GET /api/public/services`
- `GET /api/public/services/:id`
- `GET /api/public/stores`
- `GET /api/public/stores/:id/slots?date=YYYY-MM-DD&serviceId=...`

Behavior notes:

- Product and service lists support pagination
- Store slot querying returns computed availability for the given date
- Slot availability is derived from `time_slots`, `stores`, and active bookings

## 9.4 User APIs

- `GET /api/user/profile`

Addresses:

- `GET /api/user/addresses`
- `POST /api/user/addresses`
- `PUT /api/user/addresses/:id`
- `DELETE /api/user/addresses/:id`

Pets:

- `GET /api/user/pets`
- `POST /api/user/pets`
- `PUT /api/user/pets/:id`
- `DELETE /api/user/pets/:id`

Cart:

- `GET /api/user/cart`
- `POST /api/user/cart/items`
- `PUT /api/user/cart/items/:id`
- `DELETE /api/user/cart/items/:id`
- `DELETE /api/user/cart/invalid-items`

Orders:

- `POST /api/user/orders`
- `GET /api/user/orders`
- `GET /api/user/orders/:id`
- `POST /api/user/orders/:id/cancel`

Bookings:

- `POST /api/user/bookings`
- `GET /api/user/bookings`
- `GET /api/user/bookings/:id`
- `POST /api/user/bookings/:id/cancel`

## 9.5 Admin APIs

Uploads:

- `POST /api/admin/uploads/images`

Categories:

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

Products:

- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

Services:

- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`

Stores:

- `GET /api/admin/stores`
- `POST /api/admin/stores`
- `PUT /api/admin/stores/:id`
- `DELETE /api/admin/stores/:id`

Time slots:

- `GET /api/admin/time-slots`
- `POST /api/admin/time-slots`
- `PUT /api/admin/time-slots/:id`
- `DELETE /api/admin/time-slots/:id`

Orders:

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders/:id/status`

Bookings:

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:id`
- `POST /api/admin/bookings/:id/status`

## 9.6 Validation Expectations

The backend must validate:

- required fields
- enum fields such as status or pet type
- pagination values
- image upload mime types and size limits
- foreign-key-like references at the service layer where user-facing errors matter

Validation errors return `400 Bad Request`.

## 10. Image Upload Design

Image upload is local-only in phase one.

Behavior:

- Admin uploads via `multipart/form-data`
- Backend stores files under a configured uploads directory
- Saved files get unique generated filenames
- API returns a stable public URL such as `/uploads/2026/04/<file>.jpg`

Required constraints:

- accept image files only
- reject oversized files
- prevent filename collisions

Uploads are used for:

- category cover images
- product cover and detail images
- service cover and detail images
- store cover images

## 11. Error Handling

The backend uses centralized error handling middleware.

HTTP mapping:

- `400` invalid input
- `401` missing or invalid `x-admin-key`
- `404` resource not found
- `409` business conflict such as insufficient stock or full booking slot
- `500` unexpected server error

Response shape remains consistent:

```json
{
  "code": 1001,
  "message": "stock not enough",
  "data": null
}
```

## 12. Database Initialization

The backend must support deterministic local setup:

- run migrations automatically or through a dedicated command
- create all required tables if missing
- seed one demo user and realistic domain data
- seed a realistic starter dataset for categories, products, services, stores, time slots, pets, addresses, cart items, orders, and bookings

The seed dataset should be compatible with the existing frontend theme and naming so later UI integration does not need placeholder remapping.

## 13. Testing Strategy

Recommended tooling:

- `Vitest` for unit and integration tests
- `Supertest` for HTTP API tests

Required test coverage for phase one:

- repository/service tests for cart merge behavior
- repository/service tests for order creation transaction behavior
- repository/service tests for booking slot conflict behavior
- admin auth middleware tests
- upload endpoint tests
- admin CRUD API tests for products and services
- user API tests for cart, orders, and bookings

Testing rules:

- test database file must be separate from development database
- each test suite must start from deterministic seed data or isolated setup
- tests must not rely on the frontend codebase

## 14. Definition of Done

This backend sub-project is complete when:

- Express server runs independently from the frontend
- SQLite schema and seed data initialize successfully
- Public APIs return real data from SQLite
- User APIs persist addresses, pets, cart changes, orders, and bookings
- Admin APIs manage content and operational records
- Image upload works locally and returns reusable URLs
- Core tests pass against the backend

## 15. Implementation Notes for Later Phases

- The user frontend should eventually replace its current mock imports with calls to `/api/public` and `/api/user`
- The admin frontend should consume `/api/admin`
- Because true auth is absent, all auth-related integration in later phases must treat the backend as a local demo environment
- If the project later needs true login, replace demo user injection and `x-admin-key` with a proper auth layer without changing the repository and service boundaries
