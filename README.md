# 🌸 Progressive Naari — Full Stack E-Commerce Platform

## Features
- ✅ Seller & Customer separate login/register
- ✅ Amazon/Flipkart-style UI
- ✅ Real-time order notifications (Socket.IO)
- ✅ ₹10 platform fee on every order
- ✅ 3 delivery types: Self Pickup (Free), Seller Delivery (₹50), Company Delivery (₹200)
- ✅ Order Accept/Reject by seller with customer notifications
- ✅ Razorpay payment integration
- ✅ Order tracking (placed → accepted → processing → shipped → delivered)

---

## 🔑 API KEYS REQUIRED

### 1. MongoDB (Database)
- **Free:** https://www.mongodb.com/cloud/atlas
- Register → Create Free Cluster → Connect → Get connection string
- Add to `.env`: `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/progressive-naari`

### 2. Razorpay (Payment Gateway)
- **Free test account:** https://razorpay.com
- Dashboard → Settings → API Keys → Generate Test Keys
- Add to `.env`:
  ```
  RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
  RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
  ```

### 3. JWT Secret
- Any random string (min 32 chars)
- Add to `.env`: `JWT_SECRET=your_super_secret_random_string_here`

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js, validate.js, upload.js
│   ├── models/User.js, Product.js, Order.js, Notification.js
│   ├── routes/auth.js, product.js, order.js, payment.js, notification.js
│   ├── server.js
│   ├── package.json
│   └── .env.example  ← copy to .env and fill keys
│
└── frontend/
    ├── src/
    │   ├── api/api.js
    │   ├── components/Navbar.jsx, ProductCard.jsx, Toast.jsx
    │   ├── context/AuthContext.jsx, CartContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── SellerDashboard.jsx
    │   │   ├── CustomerDashboard.jsx
    │   │   ├── CartPage.jsx
    │   │   ├── OrdersPage.jsx
    │   │   └── NotificationsPage.jsx
    │   ├── utils/auth.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🚀 Setup & Run

### Step 1: Backend
```bash
cd backend
cp .env.example .env
# Fill in .env with your MongoDB URI, Razorpay keys, JWT secret
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Step 2: Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 💰 Platform Fee
- ₹10 is automatically added to every order
- Configured via `PLATFORM_FEE=10` in backend `.env`

## 🚚 Delivery Types
| Type | Charge |
|------|--------|
| Self Pickup | FREE |
| Seller Delivery | ₹50 |
| Company Delivery | ₹200 |

## 🔔 Notifications (Real-time)
- When customer places order → Seller gets instant notification
- When seller accepts/rejects → Customer gets notification
- When seller ships/delivers → Customer gets notification
- Socket.IO powers real-time updates

## 📱 User Roles
### Seller Can:
- Add/Edit/Delete products
- View incoming orders
- Accept or Reject orders
- Update order status (processing/shipped/delivered)

### Customer Can:
- Browse & search products
- Add to cart
- Choose delivery type
- Place & pay for orders
- Track order status
- View order history
