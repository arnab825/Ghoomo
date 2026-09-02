# Software Requirements Specification (SRS)
## Project: Smart Tourism & Hospitality Web Platform (SIH26207)
### Specification Standard: IEEE 830 / ISO/IEC/IEEE 29148 Compliant

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the complete software architecture, technical interfaces, data models, functional requirements, and behavioral constraints for the **Smart Travel & Tourism Web Platform (SIH26207)**.

### 1.2 Scope
The system is an end-to-end intelligent tourism web platform consisting of:
1. **Client Layer:** Responsive Next.js 14+ Web Application with interactive Mapbox/Leaflet Maps, glassmorphic UI, and Web Speech API.
2. **Application & API Layer:** REST/Serverless API micro-routes orchestrating business logic, AI recommendations, and third-party integrations.
3. **AI/ML Engine:** Large Language Model (LLM) + Knowledge Graph driven recommendation and dynamic weather-delay routing service.
4. **Data Layer:** PostgreSQL (relational structured data) with PostGIS (geospatial operations) and Upstash Redis (caching and session management).
5. **External Adapters:** Weather API, Geospatial Mapbox/Google Maps, Payment Gateway (Razorpay/Stripe).

### 1.3 Definitions, Acronyms, and Abbreviations
- **PRD:** Product Requirements Document
- **PostGIS:** Spatial database extender for PostgreSQL
- **RAG:** Retrieval-Augmented Generation
- **DPDP Act:** Digital Personal Data Protection Act, 2023 (India)

---

## 2. Overall Description

### 2.1 System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client_Layer ["Client Presentation Layer (Web Browser)"]
        WebPortal["Next.js Responsive Web Portal"]
        MapClient["Mapbox / Leaflet Map Engine"]
        SpeechEngine["Web Speech API - Voice Translator"]
    end

    subgraph Gateway_App ["Application & API Layer"]
        APIGateway["Next.js API Gateway / Edge Handlers"]
        AuthService["Auth & Session Manager - NextAuth / JWT"]
        BookingEngine["Booking & QR Ticketing Service"]
        GovtAnalytics["Govt Crowd & Analytics Service"]
    end

    subgraph AI_Engine ["AI / ML Core Engine"]
        LLM["GenAI Itinerary & Multi-Agent Planner"]
        RAG["Tourism Domain Vector Store - Qdrant / pgvector"]
        NLPTrans["Multilingual Translation & TTS/STT Engine"]
    end

    subgraph Data_Layer ["Data & Storage Layer"]
        PG["PostgreSQL + PostGIS"]
        Redis["Redis Cache & Session Store"]
        S3["Object Store - Media & Photos"]
    end

    subgraph External_APIs ["Third-Party Services"]
        WeatherAPI["Open-Meteo / OpenWeather API"]
        MapsAPI["Mapbox / Google Maps API"]
        PayGateway["Payment Gateway - Razorpay / Stripe"]
    end

    WebPortal --> APIGateway
    MapClient --> APIGateway
    SpeechEngine --> APIGateway

    APIGateway --> AuthService
    APIGateway --> BookingEngine
    APIGateway --> GovtAnalytics
    APIGateway --> AI_Engine

    AI_Engine <--> RAG
    AI_Engine --> LLM
    AI_Engine --> NLPTrans

    AuthService --> PG
    BookingEngine --> PG
    BookingEngine --> PayGateway
    GovtAnalytics --> Redis
    GovtAnalytics --> PG

    APIGateway --> MapsAPI
    APIGateway --> WeatherAPI
    APIGateway --> Redis
    APIGateway --> PG
    WebPortal --> S3
```

---

## 3. Specific Technical Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces (UI/UX)
- Modern, clean design using glassmorphism, responsive grid layouts, and high-contrast accessibility compliance (WCAG 2.1 AA).
- Multi-theme support (Dark/Light mode) tailored for bright sunlight outdoors and battery conservation.
- Touch-optimized web navigation for desktop, tablet, and mobile browsers.

#### 3.1.2 Hardware & Web API Interfaces
- **Web Geolocation API:** On-demand GPS location capture for nearby attraction distance calculations and fair auto fares.
- **Web Speech API:** Built-in browser speech recognition and synthesis for voice translation dialogues.

#### 3.1.3 Software & API Interfaces
- **Geospatial & Navigation:** Mapbox GL JS / OpenStreetMap for route rendering and matrix calculations.
- **Weather Services:** Open-Meteo / OpenWeather API for meteorological forecasts and alerts.
- **Payment Gateway:** Razorpay / Stripe SDK supporting UPI AutoPay, cards, and multi-currency conversions.

---

## 4. Detailed System Features & Use Cases

### 4.1 Use Case UC-01: Generate Dynamic AI Itinerary with Weather Adaptation

```mermaid
sequenceDiagram
    autonumber
    actor Tourist as Tourist (Web User)
    participant Client as Next.js Web App
    participant API as API Handler
    participant AI as AI Engine (RAG + LLM)
    participant DB as PostgreSQL + PostGIS
    participant Ext as Weather / Maps API

    Tourist->>Client: Inputs City, Days, Budget, Interests
    Client->>API: POST /api/itinerary/generate
    API->>Ext: Fetch Real-Time Weather & Traffic Feeds
    Ext-->>API: Current weather & travel times
    API->>DB: Query places/homestays filtered by Geospatial radius
    DB-->>API: Qualified POIs & Homestay entities
    API->>AI: Prompts RAG pipeline with Context + POIs + User Constraints
    AI->>AI: Computes optimal multi-day sequence (Time, Route, Weather)
    AI-->>API: Structured JSON Itinerary Plan
    API->>DB: Persists generated plan (status: DRAFT)
    API-->>Client: 200 OK (Render Interactive Timeline)
    Tourist->>Client: Customizes or Clicks "Confirm & Book"
```

### 4.2 Use Case UC-02: Collaborative Group Trip Planning & Split-Bill

```mermaid
sequenceDiagram
    autonumber
    actor User1 as Trip Organizer
    actor User2 as Friend / Co-Traveler
    participant Client as Next.js Web App
    participant API as Group Service
    participant Redis as Redis Pub/Sub Room
    participant DB as PostgreSQL

    User1->>Client: Creates Group Room & Shares Link / QR
    User2->>Client: Joins Room via Browser Link
    User2->>API: Upvotes / Suggests New Attraction
    API->>Redis: Broadcasts attraction update to room
    Redis-->>Client: Real-time UI synchronization
    User1->>API: Adds shared dinner bill (₹1,500)
    API->>DB: Updates ledger & computes fair split
    API-->>Client: Generates instant 1-click UPI deep links for settlement
```

---

## 5. Database Schema & Data Models

```mermaid
erDiagram
    USERS ||--o{ ITINERARIES : "creates"
    USERS ||--o{ BOOKINGS : "makes"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ GROUP_ROOMS : "participates_in"

    ITINERARIES ||--o{ ITINERARY_DAYS : "contains"
    ITINERARY_DAYS ||--o{ ITINERARY_ITEMS : "includes"
    PLACES ||--o{ ITINERARY_ITEMS : "referenced_in"
    PLACES ||--o{ REVIEWS : "receives"
    HOMESTAYS ||--o{ BOOKINGS : "booked_in"
    VENDORS ||--o{ HOMESTAYS : "owns"

    USERS {
        uuid id PK
        string full_name
        string email
        string phone_number
        string preferred_language
        string nationality
        timestamp created_at
    }

    PLACES {
        uuid id PK
        string name
        string category
        geography coordinates
        string state
        string city
        jsonb opening_hours
        decimal entrance_fee
        float crowd_rating
        jsonb cultural_guidelines
        jsonb image_gallery
    }

    ITINERARIES {
        uuid id PK
        uuid user_id FK
        string destination_city
        int duration_days
        decimal budget_allocated
        jsonb preferences
        string status
        timestamp created_at
    }

    HOMESTAYS {
        uuid id PK
        uuid vendor_id FK
        string name
        geography coordinates
        decimal price_per_night
        boolean is_verified
        string amenities
        jsonb photos
    }

    BOOKINGS {
        uuid id PK
        uuid user_id FK
        string booking_type
        uuid target_reference_id
        decimal total_amount
        string payment_status
        string qr_ticket_hash
        timestamp check_in_date
    }

    GROUP_ROOMS {
        uuid id PK
        uuid host_user_id FK
        string room_code
        jsonb members
        jsonb votes_ledger
        jsonb expense_split_ledger
        timestamp created_at
    }
```

---

## 6. Security, Reliability & Compliance Requirements

### 6.1 Data Privacy & Encryption
- **Data in Transit:** Enforced HTTPS with TLS 1.3 and HSTS.
- **Data at Rest:** AES-256 encryption on all relational tables containing user data.
- **DPDP Act & GDPR:** Explicit user consent flags and full data erasure capabilities.

### 6.2 Availability & Disaster Recovery
- Multi-AZ cloud deployment with automatic failover.
- Redis replication for persistent session storage and caching.
- Daily automated database snapshots with RPO <= 1 hour and RTO <= 15 minutes.

---

## 7. Verification & Acceptance Criteria (Testing Matrix)

| Test ID | Test Scenario | Acceptance Criteria |
| :--- | :--- | :--- |
| **TC-01** | Itinerary Generation with varying parameters | Complete JSON itinerary returned in < 3.0 seconds with zero overlapping schedule conflicts. |
| **TC-02** | Multilingual Web Voice Conversion | Audio prompt in Tamil/Hindi accurately transcribed and responded to in < 1.5 seconds. |
| **TC-03** | Interactive Map & POI Rendering | Map vector tiles and POI markers render smoothly at >= 60 FPS. |
| **TC-04** | Real-time Group Collaboration | Vote or bill update reflects in connected browsers in < 200 ms. |
| **TC-05** | Fair-Price Calculator | Correct auto-rickshaw fare estimate generated based on distance with regional negotiation phrases. |
