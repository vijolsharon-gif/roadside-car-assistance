# 🎓 RoadRescue — Software Engineering Academic Project Report

**Course Subject**: Software Engineering / Distributed Systems / Web Engineering  
**Project Title**: *RoadRescue: Smart Car Breakdown Assistance with Explainable Triage, Smart Dispatch, and Predictive Subsystem Degradation*  
**Architecture**: 3-Tier Layered Architecture with Event-Driven Real-Time Websockets  
**Tech Stack**: React 19, Vite, Tailwind CSS, Leaflet/OSM, Node.js, Express, Socket.io, SQLite (pure JS `sql.js`)

---

## 1. Executive Summary & Problem Formulation
Vehicle breakdowns on expressways and urban corridors carry significant safety hazards and economic costs. Traditional roadside assistance services rely on slow human call centers where drivers struggle to articulate vehicle issues, mechanics arrive with mismatched tools, and dispatch is unoptimized.

**RoadRescue** formulates an end-to-end cyber-physical roadside assistance paradigm that combines:
1. Rule-based explainable fault triage across 5 critical vehicular subsystems.
2. A multi-attribute weighted dispatch algorithm with automated cascading timeouts.
3. Real-time GPS mapping and unauthenticated, expiring safety links.
4. **Academic Novelty 1**: *Vehicle Health Degradation Predictor* computing instantaneous subsystem health indices and failure rates.
5. **Academic Novelty 2**: *Smart Repair Cost & Labor Estimator* offering algorithmic parts/labor cost boundaries and roadside warranty audits.

---

## 2. Software Architecture & Design Patterns

### 2.1 Architectural Pattern: Model-View-Controller + Event-Driven Publish/Subscribe
```
+-------------------------------------------------------------------------+
|                              PRESENTATION LAYER                         |
|  React 19 SPA (Vite + Tailwind v4 + Leaflet OpenStreetMap + Recharts)   |
|  - Driver Breakdown Flow (4-Step Telematics Wizard)                     |
|  - Mechanic Mission Console (Live Status FSM & Tooling Manifest)        |
|  - Public Safety Monitor (/track/:token - No Auth Expiring URL)         |
+------------------------------------+------------------------------------+
                                     | HTTPS / WSS
+------------------------------------v------------------------------------+
|                             APPLICATION LAYER                           |
|  Express REST API Gateway + Socket.io Real-Time Event Hub               |
|                                                                         |
|  +--------------------+  +----------------------+  +------------------+ |
|  | Diagnosis Engine   |  | Smart Dispatch Core  |  | Novelty Engine   | |
|  | - 5 Fault Rules    |  | - 4-Factor Ranking   |  | - Degradation    | |
|  | - Severity Triage  |  | - 60s Auto-Cascade   |  | - Cost Estimator | |
|  +--------------------+  +----------------------+  +------------------+ |
+------------------------------------+------------------------------------+
                                     | Synchronous & Prepared Queries
+------------------------------------v------------------------------------+
|                                DATA LAYER                               |
|  SQLite (sql.js / Pure JS Database Engine with Auto-Flushing)           |
|  Tables: users, vehicles, mechanics, requests, events, ratings, share   |
+-------------------------------------------------------------------------+
```

### 2.2 Key Design Patterns Implemented
1. **State Pattern (Finite State Machine)**: Strict state transitions for breakdown requests:
   $$\text{Requested} \rightarrow \text{Accepted} \rightarrow \text{On the Way} \rightarrow \text{Arrived} \rightarrow \text{Completed}$$
2. **Strategy / Rule-Based Pattern**: Rule-driven explainable diagnosis engine without opaque neural network black-boxes, ensuring deterministic safety recommendations.
3. **Observer / Pub-Sub Pattern**: Socket.io room multiplexing (`user:{id}`, `request:{id}`) for instant coordinate synchronization without polling.
4. **Decorator / Middleware Pattern**: Composable JWT authentication, role guards (`driver`, `mechanic`, `admin`), and token-bucket rate limiting.

---

## 3. Core Algorithms & Mathematical Formulations

### 3.1 Smart Dispatch Scoring Formula
For any assistance request $R$ with coordinates $(\phi_R, \lambda_R)$ and diagnosed fault category $F_R$, candidate mechanic $M_i$ is evaluated by a multi-attribute utility function:

$$\text{Score}(M_i) = w_d \cdot S_{\text{dist}}(M_i) + w_s \cdot S_{\text{skill}}(M_i) + w_r \cdot S_{\text{rating}}(M_i) + w_w \cdot S_{\text{workload}}(M_i)$$

Where weights satisfy $\sum w = 1.0$:
- $w_d = 0.40$ (Distance factor)
- $w_s = 0.25$ (Specialization match)
- $w_r = 0.20$ (Historical rating)
- $w_w = 0.15$ (Current workload)

#### Factor Formulations:
1. **Haversine Distance**:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_R)\cos(\phi_i)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   $$S_{\text{dist}} = \max\left(0, 1 - \frac{d}{d_{\max}}\right), \quad d_{\max} = 25\text{ km}$$
2. **Skill Alignment**:
   $$S_{\text{skill}} = \begin{cases} 1.0 & \text{if } F_R \in \text{Skills}(M_i) \\ 0.3 & \text{otherwise} \end{cases}$$
3. **Rating Score**: $S_{\text{rating}} = \frac{\text{Rating}(M_i)}{5.0}$
4. **Workload Score**: $S_{\text{workload}} = \max\left(0, 1 - \frac{J_{\text{active}}}{J_{\max}}\right), \quad J_{\max} = 5$

---

## 4. Academic Novelties Added

### 4.1 Novelty 1: Vehicle Health Degradation Predictor
Computes real-time wear-and-tear degradation indices across 5 automotive subsystems:
- **Electrical & Battery Subsystem**
- **Engine Thermal Regulation**
- **Tyre & Wheel Pressure**
- **Fuel Delivery & Injection**
- **Brake Hydraulic Integrity**

It inspects the slope of the 60-second telematics history buffer:
$$\frac{dT}{dt} > +0.33^\circ\text{C/sec} \implies \text{Rapid Thermal Runaway}$$
$$\frac{dV}{dt} < -0.05\text{V/sec} \implies \text{Critical Alternator/Battery Depletion}$$

### 4.2 Novelty 2: Smart Repair Cost & Labor Estimator
Calculates transparent pricing bounds before mechanic dispatch:
$$\text{Cost}_{\text{Total}} = \left( C_{\text{Hardware}} + T_{\text{Labor}} \cdot R_{\text{Hour}} \right) \times \gamma_{\text{Severity}}$$
- Severity surcharge factor $\gamma_{\text{Severity}} = 1.25$ for emergency field interventions.
- Accompanied by certified component specifications and warranty duration guarantees.

---

## 5. Deployment Instructions (Cloud Production)

### 5.1 One-Click Render Deployment
This repository contains a native `render.yaml` blueprint:
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com).
3. Click **Blueprints** $\rightarrow$ **New Blueprint Instance**.
4. Connect this repository. Render automatically reads `render.yaml`, builds the Vite frontend, runs the database seed, and launches the unified production server.

### 5.2 Docker / Railway / Fly.io Deployment
A production multi-stage `Dockerfile` is provided in the root directory:
```bash
# Build the Docker image
docker build -t roadrescue:latest .

# Run container on port 3001
docker run -p 3001:3001 -e NODE_ENV=production roadrescue:latest
```

---

## 6. Software Engineering Quality Attributes & Verification

| Attribute | Implementation Strategy | Verification Outcome |
| :--- | :--- | :--- |
| **Correctness** | Automated Node.js unit tests (`node --test`) | 6/6 tests passing (Diagnosis rules & Dispatch weights) |
| **Maintainability** | Clean separation (`client/`, `server/`, `shared/`) | Modular services with zero tight-coupling |
| **Robustness** | Memory fallback SQLite (`sql.js`), rate-limiting | Graceful handling in zero-dependency environments |
| **Usability** | High contrast dark mode, one-handed mobile layouts | Evaluated for roadside emergency legibility |
