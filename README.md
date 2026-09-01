# Finance Family 🌿💰
### AI-Driven Household Wealth Optimization & Dynamic Budget Rebalancing System

**Finance Family** is a modern, full-stack personal finance engineering application designed to optimize household capital allocation, balance short-term purchases against multi-year wealth goals, and automate month-end savings accumulation.

---

## 🚀 Key Features

1. **Dynamic Mathematical Budget Balancer**:
   - Strict budget conservation ($\sum = \text{Total Income}$) across Essential Needs, Long-Term Goals, Short-Term Purchases, and Cash Reserves.
   - Real-time manual overrides and dynamic priority waterfall recalibration.

2. **0/1 Knapsack Short-Term Purchase Optimizer**:
   - Evaluates discrete purchase requests ($<1\text{ yr}$) using Dynamic Programming to maximize utility under a strict discretionary spending cap.

3. **Future-Value Annuity Priority Waterfall Goal Engine**:
   - Multi-year goal compounding ($FV = P \cdot \frac{(1+r)^n - 1}{r}$) ranked by composite scores (Urgency $45\%$, Importance $35\%$, Financial Scale $20\%$).

4. **Source Spending Pool Tracker & Manager**:
   - Directly select the source pool when logging expenses (Essentials vs. Discretionary vs. Savings).
   - Live remaining pool gauges and itemized history.

5. **Month-End Surplus Vault & Secret Safe Locker**:
   - Settle leftover unspent budget on the 30th/31st.
   - Customizable split between **Long-Term Goals (Compounding Savings)** and **Secret Safe Locker (Emergency Vault)**.
   - Automatically triggers celebration alerts (**🎉 GOAL ACHIEVED!**) when targets are hit!

6. **Post-Goal Living Cash Flow Splitter**:
   - Shows remaining liquid monthly budget after deducting long-term goal investments.
   - Interactive split controls with quick presets (80/20, 70/30, 50/50).

7. **5-Year Wealth Trajectory Model**:
   - Real-time wealth compounding curve comparing optimized planning against linear saving.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript 5.4, Recharts, Lucide Icons, Vanilla CSS Design System
- **Backend**: Node.js v24, Express 4, PostgreSQL 16 (pg Client with Transactions)
- **Algorithms**: 0/1 Knapsack Dynamic Programming, Future-Value of Annuity compounding, Priority Waterfall scoring

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📄 Academic Project Reference
- **Project Title**: Finance Family: AI-Driven Household Wealth Optimization & Dynamic Budget Rebalancing System
- **Student**: Om Khudasiya (Reg. No: 23BCE0290)
- **Supervision**: Dr. Saravanarajan M S (SCOPE, VIT Vellore)
- **Course**: BCSE497J - Project-I
