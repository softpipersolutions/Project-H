# Stripe Payment Setup Guide for Synthera

## 💳 Stripe Account Setup

### Step 1: Create Stripe Account
1. Go to [Stripe.com](https://stripe.com)
2. Click "Start now" and create your account
3. Complete business verification (required for live payments)

### Step 2: Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to "Developers" → "API Keys"
3. Copy both keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Environment Variables:
```env
STRIPE_SECRET_KEY="sk_test_your-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-publishable-key"
```

---

## 🪝 Webhook Setup

### Step 1: Create Webhook Endpoint
1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - For development: Use ngrok or similar tunnel service
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 2: Get Webhook Secret
1. After creating the webhook, click on it
2. Reveal the "Signing secret"
3. Copy the webhook secret (starts with `whsec_`)

### Environment Variables:
```env
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

---

## 🛒 Product Configuration

### Step 1: Create Video License Products
1. Go to "Products" in Stripe Dashboard
2. Create products for each license type:

#### Personal License
- Name: "Personal License"
- Description: "For personal use only"
- Pricing: One-time payment

#### Commercial License  
- Name: "Commercial License"
- Description: "For commercial projects"
- Pricing: One-time payment

#### Extended License
- Name: "Extended License" 
- Description: "Unlimited commercial use"
- Pricing: One-time payment

#### Exclusive Rights
- Name: "Exclusive Rights"
- Description: "Full ownership and rights"
- Pricing: One-time payment

### Step 2: Create Subscription Plans (Optional)
1. Create subscription products for Creator tiers:

#### Pro Plan
- Name: "Pro Plan"
- Description: "Advanced creator features"
- Pricing: Monthly/Yearly recurring

#### Premium Plan
- Name: "Premium Plan"
- Description: "Ultimate creator experience"
- Pricing: Monthly/Yearly recurring

---

## 🧪 Testing Setup

### Step 1: Use Test Mode
- Always start with test mode (keys starting with `sk_test_` and `pk_test_`)
- Test cards provided by Stripe:
  - Success: `4242424242424242`
  - Declined: `4000000000000002`
  - Requires authentication: `4000002500003155`

### Step 2: Test Payment Flow
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test video with pricing
3. Try purchasing each license type
4. Check Stripe Dashboard for payment records

### Step 3: Test Webhooks Locally
Using ngrok for local webhook testing:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Expose your local server:
   ```bash
   ngrok http 3000
   ```

3. Update webhook URL in Stripe to your ngrok URL:
   `https://your-ngrok-id.ngrok.io/api/webhooks/stripe`

4. Test webhook events by making payments

---

## 🚀 Production Setup

### Step 1: Switch to Live Mode
1. In Stripe Dashboard, toggle to "Live mode"
2. Get your live API keys
3. Update environment variables:
   ```env
   STRIPE_SECRET_KEY="sk_live_your-live-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_live_your-live-publishable-key"
   ```

### Step 2: Update Webhook URL
1. Update webhook endpoint to your production domain
2. Get new webhook secret for live mode
3. Update environment variable:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_your-live-webhook-secret"
   ```

### Step 3: Business Verification
1. Complete Stripe's business verification process
2. Provide required documentation
3. Set up bank account for payouts

---

## 💰 Pricing Strategy

### Recommended License Pricing:
- **Personal License**: $5-15
- **Commercial License**: $25-50  
- **Extended License**: $100-200
- **Exclusive Rights**: $500-2000

### Subscription Plans:
- **Pro Plan**: $29/month or $290/year
- **Premium Plan**: $99/month or $990/year

### Creator Revenue Share:
- **Free Users**: 15% platform fee
- **Pro Users**: 10% platform fee  
- **Premium Users**: 5% platform fee

---

## 🔐 Security Best Practices

### 1. Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency for webhook handling

### 2. API Key Security
- Never expose secret keys in frontend code
- Use environment variables for all keys
- Rotate keys periodically

### 3. Payment Validation
- Validate payment amounts server-side
- Check payment status before granting access
- Implement proper error handling

---

## 📊 Analytics & Reporting

### Built-in Stripe Features:
1. **Revenue Reports**: Track earnings by period
2. **Customer Analytics**: View customer behavior
3. **Payment Analytics**: Success rates and failures
4. **Subscription Metrics**: Churn, MRR, etc.

### Custom Analytics in Synthera:
- Creator earnings dashboard
- Video performance metrics
- License type popularity
- Geographic sales data

---

## ⚠️ Common Issues

### Webhook Not Receiving Events
- Check webhook URL is accessible
- Verify HTTPS is enabled
- Check webhook secret matches
- Look at webhook logs in Stripe Dashboard

### Payment Intent Creation Fails
- Verify API keys are correct
- Check amount is in correct format (cents)
- Ensure customer ID is valid

### "No such customer" Error
- Create customer before creating payment intent
- Verify customer ID format
- Check customer exists in same environment (test vs live)

### 3D Secure Authentication Issues
- Implement proper 3D Secure handling
- Test with authentication required cards
- Handle authentication redirects

---

## 🔄 Next Steps

After setting up Stripe:
1. Test all payment flows thoroughly
2. Set up file storage for videos
3. Configure email notifications for payments
4. Implement payout system for creators
5. Add tax calculation if needed
6. Set up subscription management