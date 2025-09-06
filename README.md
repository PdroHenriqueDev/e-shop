# E-Shop

## Description

E-Shop is an e-commerce portfolio developed with Next.js.

**Live application link:** [E-Shop on Vercel](https://e-shop-plum.vercel.app)

## Features

- [x] Initial project setup
- [x] User authentication
- [x] Home page
- [x] Product catalog
- [x] Shopping cart
- [x] Product details page
- [x] Checkout
- [x] Admin dashboard
- [x] Payment system integration (Stripe)
- [ ] Unit tests
- [ ] Automated tests

## Payment Flow

The application integrates with Stripe for secure payment processing:

1. **Checkout Process**: Users add items to cart and proceed to checkout
2. **Order Creation**: Order is created in the database with pending status
3. **Stripe Session**: Checkout session is created via `/api/stripe/create-checkout-session`
4. **Payment Processing**: User is redirected to Stripe's secure payment page
5. **Webhook Handling**: Stripe webhooks update order status via `/api/stripe/webhooks`
6. **Payment Verification**: Session verification through `/api/stripe/verify-session`
7. **Order Completion**: Successful payments update order status to 'paid' and 'confirmed'

### Supported Payment Events

- `checkout.session.completed` - Order marked as paid
- `payment_intent.succeeded` - Payment confirmation
- `payment_intent.payment_failed` - Payment failure handling
- `checkout.session.expired` - Session timeout handling

## How to Start the Project

1. **Clone the repository**:

```bash
git clone https://github.com/your-username/e-shop.git
```

Replace `your-username` with your GitHub username.

2. **Navigate to the project directory**:

```bash
cd e-shop
```

3. **Install dependencies**:
   Ensure you have Node.js and npm or Yarn installed on your machine. Then, run:

```bash
yarn install
```

Or, if you prefer npm:

```bash
npm install
```

4- **Run the project**:
Start the development server with:

```bash
yarn dev
```

Or, if you prefer npm:

```bash
npm run dev
```
