# 🚗 RoadRescue — Academic Presentation Slide Deck

**Course**: Software Engineering / Distributed Systems / Web Systems  
**Project**: *RoadRescue: Smart Car Breakdown Assistance with Explainable Triage, Smart Dispatch, and Predictive Degradation*

---

## Slide 1: Title Slide
- **Title**: RoadRescue: Smart Car Breakdown Roadside Assistance
- **Subtitle**: Explainable Fault Triage, Multi-Factor Smart Dispatch, Real-Time Fleet Tracking, and Subsystem Health Degradation Forecasting
- **Course**: Software Engineering Academic Capstone Project
- **Key Architectural Pillars**:
  - 🏛️ 3-Tier Distributed Architecture (React + Express + SQLite)
  - ⚡ Event-Driven WebSocket FSM (Finite State Machine)
  - 🔬 Predictive Maintenance & Transparent Repair Economics

---

## Slide 2: Problem Statement & Motivation
- **Subjective Articulation**: Stranded drivers struggle to accurately communicate vehicle failure symptoms under stress.
- **Tooling Mismatch & High Repeat Trips**: Traditional dispatchers assign mechanics blindly, causing mechanics to arrive without required components (e.g., jump packs for ruptured cooling hoses).
- **Opaque Dispatch & Safety Hazards**: Proximity-only dispatch ignores mechanic specialization and workload, leaving motorists stranded in dark, hazardous expressway corridors.

---

## Slide 3: Scope & Scope Control
- **5 Governed Mechanical Fault Categories**:
  1. *Battery / Electrical*: Voltage decay thresholds (<11.8V 🟠, <11.0V 🔴)
  2. *Engine Overheating*: Thermal regulation breaches (>100°C 🟠, >110°C 🔴)
  3. *Tyre / Puncture*: 4-Corner TPMS sensor checks (<25 PSI 🟠, <20 PSI 🔴)
  4. *Fuel System*: Tank depletion and starvation stall (<5% 🟠, 0% 🔴)
  5. *Braking & Unknown Noise*: Failsafe critical triage protocol (Always 🔴 Stop Now)
- **High-Fidelity Telematics Simulator**: Eliminates reliance on physical OBD-II dongles by allowing simulated telematics injection (*Weak Battery*, *Overheating*, *Low Tyre*, *Empty Tank*).

---

## Slide 4: System Architecture & Design Patterns
- **Presentation Layer**: React 19 SPA, Tailwind CSS (v4), Leaflet OpenStreetMap, Recharts.
- **Application Layer**: Node.js + Express REST API Gateway + Socket.io Event Hub.
- **Data Layer**: SQLite (`sql.js` pure JS database engine with ACID transactions & auto-disk synchronization).
- **Core Design Patterns**:
  - *Finite State Machine (FSM)*: Strict request state transitions (`Requested → Accepted → On the Way → Arrived → Completed`).
  - *Strategy Pattern*: Pluggable rule-based diagnostic evaluation.
  - *Observer / Pub-Sub*: Socket.io room multiplexing for real-time coordinate streaming.
  - *Decorator / Middleware*: JWT role guards and rate limiting.

---

## Slide 5: Explainable Fault Diagnosis & Triage Protocol
- **Deterministic Explainability**: Zero black-box neural ambiguity; produces verifiable plain-English rationale and immediate roadside safety protocol.
- **Color-Coded Severity Triage**:
  - 🟢 **Green (Safe to Drive Slowly)**: Drive cautiously to the nearest garage.
  - 🟠 **Orange (Stop Soon)**: Pull over safely within 5-10 minutes.
  - 🔴 **Red (Stop NOW)**: Hazard lights on, engine shut off immediately.
- **Pre-Arrival Mechanic Checklist**: Auto-generated manifest detailing exact tools (e.g., multimeter, coolant pressure tester) and replacement parts to guarantee first-visit resolution.

---

## Slide 6: Smart Dispatch Mathematical Formulation
- **Multi-Attribute Utility Function**:
  $$\text{Score}(M_i) = 0.40 \cdot S_{\text{dist}} + 0.25 \cdot S_{\text{skill}} + 0.20 \cdot S_{\text{rating}} + 0.15 \cdot S_{\text{workload}}$$
  - $S_{\text{dist}}$: Great-circle Haversine distance, bounded at 25 km max range.
  - $S_{\text{skill}}$: $1.0$ if mechanic specializes in diagnosed fault, else $0.3$.
  - $S_{\text{rating}}$: Normalized customer rating ($\text{Rating} / 5.0$).
  - $S_{\text{workload}}$: Concurrent active job capacity ($\max(0, 1 - \text{ActiveJobs} / 5)$).
- **Auto-Cascading Dispatch**: 60-second acceptance timer on the #1 match before cascading automatically to candidate #2.

---

## Slide 7: Academic Novelty 1 — Vehicle Health Degradation Predictor
- **Subsystem Breakdown Risk Evaluation**:
  - Electrical & Battery Subsystem (25% weight)
  - Engine Thermal Regulation (25% weight)
  - Tyre & Wheel Pressure (20% weight)
  - Fuel Delivery & Injection (15% weight)
  - Brake Hydraulic Integrity (15% weight)
- **Derivative Slope Telematics Analysis**:
  - $\frac{dT}{dt} > +0.33^\circ\text{C/sec}$: Rapid Thermal Runaway detection.
  - $\frac{dV}{dt} < -0.05\text{V/sec}$: Critical Alternator / Battery depletion.
- **Engineering Advisory**: Actionable preventative maintenance guidance before catastrophic mechanical damage.

---

## Slide 8: Academic Novelty 2 — Smart Repair Cost & Labor Estimator
- **Transparent Algorithmic Pricing**:
  $$\text{Cost}_{\text{Total}} = \left( C_{\text{Hardware}} + T_{\text{Labor}} \cdot R_{\text{Hour}} \right) \times \gamma_{\text{Severity}}$$
- **Emergency Field Surcharge**: $\gamma_{\text{Severity}} = 1.25\times$ for dangerous Red-triage field conditions.
- **Warranty & Component Certification**: Verified specifications and warranty coverage (e.g., *12-month battery replacement, 30-day labor guarantee*).

---

## Slide 9: Public Safety & Mechanic Mission Console
- **Expiring Public Safety Link (`/track/:token`)**: Unauthenticated live monitoring URL for family and friends.
- **Night / Unsafe-Area SOS**: One-tap pre-filled WhatsApp emergency dispatch message with live coordinates.
- **Mechanic Mission Console**: Availability toggle, incoming breakdown alerts radar, and real-time step-by-step status progression.

---

## Slide 10: Verification, Testing & Quality Attributes
- **Automated Test Suites (6/6 passing)**:
  - Battery, Overheating, Tyre, Fuel, and Brake diagnostic rules.
  - Dispatch scoring weights & Haversine distance calculations.
- **Software Engineering Quality Attributes**:
  - *Correctness*: Deterministic rule-based evaluation.
  - *Maintainability*: Decoupled 3-tier architecture.
  - *Robustness*: In-memory SQLite with auto-sync fallback.
  - *Safety & UX*: High contrast dark mode tailored for roadside emergencies.

---

## Slide 11: Live Deployment & Credentials
- **Live Public Cloudflare URL**:
  👉 **[https://surgery-everyone-waterproof-column.trycloudflare.com](https://surgery-everyone-waterproof-column.trycloudflare.com)**
- **Demo Accounts (Password: `password123`)**:
  - 🚗 **Driver**: `arun@example.com`
  - 🔧 **Mechanic (Priya)**: `priya@roadrescue.com`
  - 🔧 **Mechanic (Ravi)**: `ravi@roadrescue.com`
  - 👑 **Admin**: `admin@roadrescue.com`

---

## Slide 12: Conclusion & Future Research
- **Summary**: Delivered a fully functional, browser-verified roadside assistance platform combining explainable diagnosis, optimal fleet dispatch, predictive degradation, and fair pricing models.
- **Future Directions**:
  - Web Bluetooth API integration for physical ELM327 OBD-II hardware.
  - Convolutional neural networks for acoustic engine knocking detection.
  - Smart-contract escrow payments upon verified completion.
