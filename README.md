# Supplier Risk & Lead-Time Tracking Dashboard

A full-stack supply chain risk intelligence dashboard designed to monitor vendor performance, track delivery predictability, and identify high-risk suppliers before disruptions occur.

Built with **Node.js**, **Express**, **SQLite** (`sql.js`), **React** (Vite), **Tailwind CSS**, **Recharts**, and **Lucide Icons**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Performance & Risk Formulas](#performance--risk-formulas)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Seeding](#database-seeding)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Mock Data & Seed Profiles](#mock-data--seed-profiles)
- [License](#license)

---

## Overview

In modern supply chain management, late deliveries and high defect rates cascade into production delays and costly stockouts. The **Supplier Risk & Lead-Time Tracking Dashboard** gives operations and procurement teams real-time visibility into supplier reliability by:

1. Tracking **On-Time Delivery (OTD)** and defect ratios across purchase orders.
2. Quantifying delivery predictability via **Lead Time Variance** (actual vs. promised delivery dates).
3. Calculating an aggregate **Supplier Reliability Score (0–100)** to categorize suppliers into **Low**, **Medium**, or **High Risk**.
4. Providing instant **High-Risk Isolation** to focus on suppliers needing mitigation.

---

## Key Features

### 1. Executive Summary KPI Grid
- **Avg On-Time Delivery (OTD)**: Fleet-wide delivery fulfillment percentage vs. benchmark (>90%).
- **High-Risk Vendors**: Count of critical vendors with an interactive click trigger to filter the entire view.
- **Active Purchase Orders**: Pending fulfillment orders in the active pipeline.
- **Avg Reliability Score**: Composite supply risk index out of 100.

### 2. Interactive Supplier Leaderboard
- **Ranked Performance**: Top-tier suppliers highlighted with medal badges (`#1`, `#2`, `#3`).
- **Multi-Column Sorting**: Sort by Rank, Supplier Name, Country, Category, OTD Rate, Defect Rate, Lead Time Variance, Score, or Risk Tier.
- **Search & Filter**: Real-time search across supplier names, categories, and countries.
- **High-Risk Isolation Toggle**: One-click filter button (`Isolate High-Risk`) to isolate suppliers scoring `< 50`.
- **Color-Coded Badges**: Visual risk indicators (🟢 Low, 🟡 Medium, 🔴 High).

### 3. Visual Performance Charts (Recharts)
- **Lead Time Variance Line Chart**: Historical timeline of delivery deviations with a 0-day baseline reference line.
- **Supplier Reliability Bar Chart**: Horizontal bar chart comparing all vendors against critical (50) and optimal (80) threshold lines.
- **OTD Trend Area Chart**: Chronological fulfillment trajectory.
- **Defect Rate Bar Chart**: Per-supplier defect percentage with risk threshold fills.

### 4. Supplier Profile & Order History (`/suppliers/:id`)
- Supplier profile header with country, category, contact email, and risk tier.
- Individual KPI scorecards.
- **Per-Order Lead Time Variance Chart**: Bar chart highlighting late deliveries (+days in red) and early deliveries (-days in green).
- **Purchase Orders History Table**: Detailed list of all orders with PO numbers, order dates, delivery timestamps, quantities, defect counts, and late delivery tags.

---

## System Architecture

```mermaid
graph TD
    subgraph Frontend["Frontend (React + Vite + Tailwind CSS + Recharts)"]
        UI_Dash[Dashboard Page]
        UI_Detail[Supplier Detail Page]
        UI_Cards[Executive KPI Cards]
        UI_Table[Supplier Leaderboard Table]
        UI_Charts[Recharts: Lead Time, Reliability, OTD, Defects]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        API_Dash["/api/dashboard (summary & trends)"]
        API_Supp["/api/suppliers & /api/suppliers/:id/analytics"]
        API_PO["/api/purchase-orders"]
        Engine[Metrics Engine (OTD, Defects, Variance, Score)]
        M_Supp[Supplier Model]
        M_PO[PurchaseOrder Model]
    end

    subgraph Database["Database (SQLite / sql.js)"]
        T_Supp[(suppliers table)]
        T_PO[(purchase_orders table)]
    end

    UI_Dash -->|fetch| API_Dash
    UI_Dash -->|fetch| API_Supp
    UI_Detail -->|fetch| API_Supp
    UI_Detail -->|fetch| API_PO

    API_Dash --> Engine
    API_Supp --> Engine

    API_Supp --> M_Supp
    API_Supp --> M_PO
    API_PO --> M_PO

    M_Supp --> T_Supp
    M_PO --> T_PO
```

---

## Performance & Risk Formulas

The metrics engine ([server/utils/metrics.js](server/utils/metrics.js)) calculates the following metrics:

### 1. On-Time Delivery (OTD) Rate
$$\text{OTD Rate (\%)} = \left(\frac{\text{Delivered POs where } \text{Actual Date} \le \text{Expected Date}}{\text{Total Delivered POs}}\right) \times 100$$

### 2. Defect Rate
$$\text{Defect Rate (\%)} = \left(\frac{\sum \text{Defect Count}}{\sum \text{Quantity Delivered}}\right) \times 100$$

### 3. Lead Time Variance
$$\text{Variance (Days)} = \frac{\sum (\text{Actual Delivery Date} - \text{Expected Delivery Date})}{\text{Total Delivered POs}}$$
- **Positive ($> 0$)**: Delivered late (delay in days).
- **Zero ($0$)**: Delivered exactly on promised date.
- **Negative ($< 0$)**: Delivered early.

### 4. Supplier Reliability Score (0–100)
A weighted composite index:
$$\text{Reliability Score} = 0.40 \times \text{OTD Score} + 0.30 \times \text{Defect Score} + 0.30 \times \text{Variance Score}$$

- **OTD Score**: Directly the OTD rate ($0\text{–}100$).
- **Defect Score**: $100 - (\text{Defect Rate} \times 10)$, clamped between $0$ and $100$.
- **Variance Score**: $100 - (\max(0, \text{Avg Variance}) \times 10)$, clamped between $0$ and $100$.

### Risk Categorization
| Risk Badge | Score Range | Description |
|---|---|---|
| 🟢 **Low Risk** | $\ge 80$ | High predictability, low defect rate, reliable partner. |
| 🟡 **Medium Risk** | $50\text{–}79$ | Moderate delays or defects, monitor closely. |
| 🔴 **High Risk** | $< 50$ | Frequent delays, elevated defect rate, requires immediate intervention. |

---

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Database
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express 4](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) via [`sql.js`](https://github.com/sql-js/sql.js) (pure JavaScript WebAssembly SQLite — runs natively on any OS without native C++ compilation tools)
- **Process Orchestration**: [Concurrently](https://github.com/open-cli-tools/concurrently)

---

## Project Structure

```text
scmm/
├── client/                           # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── DefectRateChart.jsx
│   │   │   │   ├── LeadTimeVarianceChart.jsx
│   │   │   │   ├── OTDTrendChart.jsx
│   │   │   │   └── ReliabilityChart.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   └── SupplierTable.jsx
│   │   ├── lib/
│   │   │   └── api.js                # API client with error handling
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Executive dashboard view
│   │   │   └── SupplierDetail.jsx    # Individual supplier profile view
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                           # Express Backend
│   ├── models/
│   │   ├── PurchaseOrder.js          # Purchase order database queries
│   │   └── Supplier.js               # Supplier database queries
│   ├── routes/
│   │   ├── dashboard.js              # /api/dashboard/summary & /trends
│   │   ├── purchaseOrders.js         # /api/purchase-orders
│   │   └── suppliers.js              # /api/suppliers & /analytics
│   ├── utils/
│   │   └── metrics.js                # OTD, defect, variance & reliability engine
│   ├── data.db                       # Persisted SQLite database file
│   ├── db.js                         # sql.js wrapper & schema initialization
│   ├── index.js                      # Express server entry point
│   ├── package.json
│   └── seed.js                       # Mock data seed script
│
├── package.json                      # Root package with concurrently scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### Installation

Clone the repository and install all dependencies (root, backend, and frontend):

```bash
# From the project root
npm run install:all
```

Or install individually:
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### Database Seeding

Populate the SQLite database with 6 suppliers and 42 diverse purchase orders:

```bash
npm run seed
```

Output confirmation:
```text
--- Starting Database Seeding ---
Cleared existing data.
Inserted supplier: TechParts Global (ID: 1)
Inserted supplier: SteelWorks Inc. (ID: 2)
Inserted supplier: PackRight Solutions (ID: 3)
Inserted supplier: ChipSource Ltd. (ID: 4)
Inserted supplier: GreenMaterials Co. (ID: 5)
Inserted supplier: PrecisionTools AG (ID: 6)
Inserted 42 purchase orders.
--- Database Seeding Complete ---
```

### Running the Application

Start both the backend API and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

#### Running Services Separately
```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend dev server
npm run client
```

#### Production Build
```bash
cd client
npm run build
```

---

## API Reference

### Health Check
- `GET /api/health` — Confirms backend server status and timestamp.

### Dashboard
- `GET /api/dashboard/summary` — Returns fleet-wide aggregate KPIs (total suppliers, order counts, overall OTD, average defect rate, average reliability score, risk distribution).
- `GET /api/dashboard/trends` — Returns chronological monthly performance buckets (month, OTD rate, defect rate, lead time variance, delivered count).

### Suppliers
- `GET /api/suppliers` — Returns all suppliers with calculated performance metrics (`otdRate`, `defectRate`, `leadTimeVariance`, `reliabilityScore`, `riskBadge`).
- `GET /api/suppliers/:id` — Returns single supplier profile along with all associated purchase orders and metrics.
- `GET /api/suppliers/:id/analytics` — Returns time-series lead-time history and summary statistics for individual supplier charts.

### Purchase Orders
- `GET /api/purchase-orders` — Lists all purchase orders with supplier metadata.
- `GET /api/purchase-orders?supplier_id=:id` — Filters purchase orders by supplier ID.
- `GET /api/purchase-orders/:id` — Retrieves a single purchase order by ID.

---

## Mock Data & Seed Profiles

The seed dataset contains **6 suppliers** and **42 purchase orders** (7 POs per supplier) calibrated across realistic risk categories:

| Supplier | Country | Category | OTD Rate | Defect Rate | Lead Time Variance | Reliability Score | Risk Badge |
|---|---|---|---|---|---|---|---|
| **TechParts Global** | China | Electronics | 85.7% | 0.1% | +0.1d | **93.8** | 🟢 Low Risk |
| **SteelWorks Inc.** | Germany | Raw Materials | 83.3% | 0.1% | +0.3d | **92.6** | 🟢 Low Risk |
| **PackRight Solutions** | India | Packaging | 66.7% | 3.8% | +1.3d | **73.3** | 🟡 Medium Risk |
| **ChipSource Ltd.** | Taiwan | Semiconductors | 42.9% | 3.9% | +3.0d | **61.0** | 🟡 Medium Risk |
| **GreenMaterials Co.** | Brazil | Sustainable Materials | 40.0% | 8.3% | +7.0d | **40.6** | 🔴 High Risk |
| **PrecisionTools AG** | Japan | Precision Engineering | 16.7% | 7.6% | +6.7d | **33.8** | 🔴 High Risk |

---

## License

This project is licensed under the MIT License.
