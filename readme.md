# 🍽️ Folk & Forks

### Crafted for Every Craving

Folk & Forks is a modern full-stack Restaurant Management & POS System designed to streamline restaurant operations through separate dashboards for Customers, Employees, Kitchen Staff, and Administrators.

The platform provides real-time order management, table reservations, payment processing, kitchen coordination, and restaurant analytics through an intuitive and responsive interface.

---

## 🚀 Features

### 👤 Customer Dashboard

* Browse restaurant menu
* Search and filter food items
* Book tables online
* Place food orders
* Track order status in real time
* View booking history
* View order history
* Secure checkout experience

### 🧑‍🍳 Employee Dashboard

* Manage table occupancy
* Create and manage orders
* Send orders directly to kitchen
* Update order status
* Process customer payments
* Complete reservations
* Release tables after payment
* View real-time restaurant activity

### 🍳 Kitchen Dashboard

* Receive incoming orders instantly
* View active food preparation queue
* Update order preparation status
* Mark orders as ready for serving

### 👨‍💼 Admin Dashboard

* Restaurant analytics and reports
* User management
* Menu management
* Category management
* Promotions and coupons
* Table and floor management
* Payment method management
* Booking management
* Real-time operational monitoring

---

## 🔄 Real-Time Features

Powered by Socket.IO

* Live order updates
* Live kitchen notifications
* Live table availability updates
* Live reservation status updates
* Live dashboard synchronization

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router

### Backend

* Node.js
* Express.js

### Database

* Prisma ORM
* SQL Database

### Authentication

* JWT Authentication
* Role-Based Access Control (RBAC)

### Real-Time Communication

* Socket.IO

---

## 🎨 UI Features

* Modern Dark Mode
* Responsive Design
* Premium Dashboard Layout
* Smooth Animations
* Glassmorphism Effects
* Mobile Friendly Interface

---

## 👥 User Roles

| Role     | Access                            |
| -------- | --------------------------------- |
| Customer | Menu, Booking, Ordering, Tracking |
| Employee | Orders, Tables, Payments          |
| Kitchen  | Food Preparation Management       |
| Admin    | Full System Control               |

---

## 📊 Order Lifecycle

Pending
→ Preparing
→ Ready
→ Served
→ Completed

---

## 💳 Payment Flow

1. Employee selects a table.
2. Employee creates an order.
3. Order is sent to kitchen.
4. Order remains linked to the table.
5. Customer consumes order.
6. Employee generates bill.
7. Employee collects payment.
8. Order marked as completed.
9. Table automatically becomes available.

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/0xheaptrace/Odoo-x-PU---Cafe.git
cd Odoo-x-PU---Cafe
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file inside the server directory:

```env
DATABASE_URL=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASSWORD=
```

---

## 📂 Project Structure

```text
client/
├── src/
├── public/
└── package.json

server/
├── controllers/
├── middleware/
├── prisma/
├── routes/
├── socket/
├── utils/
└── package.json
```

---

## 🌟 Future Enhancements

* QR Code Ordering
* AI-based Food Recommendations
* Online Payments Integration
* Loyalty Rewards System
* Multi-Branch Restaurant Support
* Inventory Management
* Sales Forecasting

---

## 👨‍💻 Contributors

* Stavan Katrojwar
* Aditya Chaurasia

---

## 📜 License

This project was developed for educational and hackathon purposes.

© Folk & Forks — Crafted for Every Craving

