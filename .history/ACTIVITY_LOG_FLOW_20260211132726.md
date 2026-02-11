# Complete Activity Log Flow

## User Journey Tracking

Your SaaSify platform now tracks the complete user journey from domain search to payment verification with detailed activity logs in the database.

### Activity Log Actions Tracked:

#### 1. **Domain Search** 
   - **Action**: `domain_search`
   - **Category**: `domain`
   - **Triggered**: When user searches for domains
   - **Location**: `domain.controller.js:searchDomains()`
   - **Details**: Query, results count, available domains

#### 2. **Add to Cart**
   - **Action**: `order_create`
   - **Category**: `order`  
   - **Triggered**: When user adds domain to cart
   - **Location**: `cart.controller.js:addToCart()`
   - **Details**: 
     - Item type (domain/hosting/addon)
     - Item ID & name
     - Price
     - Cart total
     - Number of items in cart

#### 3. **Order Creation**
   - **Action**: `order_create`
   - **Category**: `order`
   - **Triggered**: When user initiates checkout
   - **Location**: `cart.controller.js:checkout()`
   - **Details**:
     - Order ID & number (e.g., ORD-2026-000004)
     - Total amount & currency
     - Payment method
     - Items count
     - All cart items with prices

#### 4. **Domain Registration Queued**
   - **Action**: `domain_register`
   - **Category**: `domain`
   - **Triggered**: After payment verification
   - **Location**: `cart.controller.js:verifyPayment()`
   - **Details**:
     - Domain ID & name
     - Order ID
     - Registration period

#### 5. **Invoice Generated**
   - **Action**: `order_complete`
   - **Category**: `order`
   - **Triggered**: After payment verification
   - **Location**: `cart.controller.js:verifyPayment()`
   - **Details**:
     - Invoice ID & number (e.g., INV-2026-000004)
     - Order number
     - Total amount

#### 6. **Payment Success**
   - **Action**: `payment_success`
   - **Category**: `payment`
   - **Triggered**: After Razorpay payment verification
   - **Location**: `cart.controller.js:verifyPayment()`
   - **Details**:
     - Order number
     - Payment amount
     - Razorpay payment ID
     - Gateway used

#### 7. **Order Completion** (Wallet Payment)
   - **Action**: `order_complete`
   - **Category**: `order`
   - **Triggered**: When order paid via wallet
   - **Location**: `cart.controller.js:checkout()`
   - **Details**:
     - Order number
     - Total amount
     - Number of domains
     - Wallet payment confirmation

---

## Complete User Journey Example:

```
User: john@example.com
Session: 2026-02-11 13:00:00

1. [13:00:15] domain_search - Searched for "mycompany"
   → Found 20 available domains

2. [13:01:30] order_create - Added mycompany.com to cart
   → Price: $12.99, Cart total: $12.99

3. [13:02:45] order_create - Created order ORD-2026-000005
   → Total: $12.99 USD, Payment: Razorpay

4. [13:03:10] payment_success - Payment verified
   → Razorpay Payment ID: pay_xxxxx, Amount: ₹1077

5. [13:03:11] domain_register - Domain queued for registration
   → Domain: mycompany.com, Period: 1 year

6. [13:03:11] order_complete - Invoice generated
   → Invoice: INV-2026-000005

7. [13:03:11] payment_success - Order marked complete
   → Status: Paid, Domain status: Pending registration
```

---

## How to View Activity Logs:

### Via API:
```http
GET /api/clients/me/activity
Authorization: Bearer <token>

Query Parameters:
- page=1          # Pagination
- limit=20        # Results per page  
- action=         # Filter by action (domain_search, order_create, etc.)
- category=       # Filter by category (domain, order, payment)
- status=         # Filter by status (success, failed)
- startDate=      # Filter by date range
- endDate=        # Filter by date range
```

### Response Format:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": "...",
        "clientId": "...",
        "action": "payment_success",
        "category": "payment",
        "description": "Payment successful for order ORD-2026-000004",
        "metadata": {
          "orderNumber": "ORD-2026-000004",
          "amount": 12.99,
          "razorpayPaymentId": "pay_xxxxx"
        },
        "ipAddress": "::1",
        "status": "success",
        "createdAt": "2026-02-11T07:43:12.000Z"
      },
      // ... more logs
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Activity logs retrieved successfully"
}
```

---

## Metadata Details by Action:

### `order_create` (Add to Cart):
```json
{
  "type": "domain",
  "itemId": "mycompany.com",
  "price": 12.99,
  "cartTotal": 25.98,
  "itemsCount": 2
}
```

### `order_create` (Order Created):
```json
{
  "orderId": "65f...",
  "orderNumber": "ORD-2026-000004",
  "total": 12.99,
  "currency": "USD",
  "itemsCount": 1,
  "paymentMethod": "razorpay",
  "items": [
    {
      "type": "domain",
      "name": "mycompany.com",
      "price": 12.99
    }
  ]
}
```

### `domain_register`:
```json
{
  "domainId": "65f...",
  "domainName": "mycompany.com",
  "orderId": "65f...",
  "period": 1
}
```

### `payment_success`:
```json
{
  "orderNumber": "ORD-2026-000004",
  "amount": 12.99,
  "razorpayPaymentId": "pay_xxxxx"
}
```

---

## Database Collection:

**Collection**: `activitylogs`

**Schema Fields**:
- `userId` - User ID (indexed)
- `clientId` - Client ID (indexed)
- `action` - Action performed (indexed)
- `category` - Category: domain/order/payment (indexed)
- `description` - Human-readable description
- `metadata` - JSON object with action-specific data
- `ipAddress` - User's IP address
- `userAgent` - Browser/client info
- `status` - success/failed (indexed)
- `createdAt` - Timestamp (indexed)

---

## Frontend Integration:

Create an activity timeline view in the user dashboard showing:

1. **Icon** based on category (🔍 search, 🛒 cart, 📦 order, 💳 payment)
2. **Timestamp** (relative: "2 minutes ago")
3. **Description** from the log
4. **Details** from metadata (expandable)

### Example Frontend Code:
```jsx
import { useEffect, useState } from 'react';
import api from '@/config/api';

const ActivityTimeline = () => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await api.get('/clients/me/activity?limit=50');
      setLogs(data.data.logs);
    };
    fetchLogs();
  }, []);
  
  return (
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log._id} className="flex items-start gap-3">
          <ActivityIcon category={log.category} />
          <div>
            <p className="font-medium">{log.description}</p>
            <p className="text-sm text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing Complete Flow:

1. **Search Domain**: Check for `domain_search` log
2. **Add to Cart**: Check for `order_create` log with cart details
3. **Checkout**: Check for `order_create` log with order number
4. **Payment**: Check for `payment_success` log
5. **Post-Payment**: Check for `domain_register` and `order_complete` logs

All logs should appear in chronological order with complete metadata for tracking the entire user journey!
