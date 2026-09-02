# 🏗️ High-Level & Low-Level System Design Document (HLD / LLD)
## Project: Smart Travel & Tourism Web Platform (SIH26207)
### "Discover India, Every Step of the Way" (100% Web Architecture)

---

## 1. System Overview & Design Principles

The **Smart Tourism Web Platform** is architected as an event-driven, micro-modular, cloud-native web application designed for high availability, low latency, multilingual accessibility, and instant browser performance.

```mermaid
flowchart LR
    A[Decoupled Web Tiers] --> B[Edge CDN Caching]
    B --> C[PostGIS Spatial Optimization]
    C --> D[Idempotent Microservices]
```

---

## 2. High-Level Design (HLD)

### 2.1 End-to-End Web System Architecture

```mermaid
flowchart TD
    subgraph Clients ["Client Presentation Tier (Web Browsers)"]
        WebDesktop["Desktop Web Browser (Next.js)"]
        WebMobile["Mobile Web Browser (Responsive)"]
        WebTablet["Tablet Web Viewport"]
    end

    subgraph EdgeTier ["Edge & Gateway Tier"]
        VercelEdge["Vercel Edge Network & Global CDN"]
        APIRouter["API Gateway Router"]
    end

    subgraph Microservices ["Core Application Services"]
        AuthSvc["Auth Service (NextAuth / JWT)"]
        ItinSvc["Itinerary & Dynamic Rerouter Service"]
        BookSvc["Booking & Digital Ticketing Service"]
        GroupSvc["Group Collab & Split-Bill Service"]
        VoiceSvc["Voice & Translation Service"]
        GovtSvc["Govt Crowd & Analytics Service"]
    end

    subgraph IntelligenceTier ["AI & Intelligence Tier"]
        LLMOrch["LLM Orchestrator"]
        GeminiFlash["Gemini 1.5 Flash API"]
        GroqLlama["Groq LLaMA 3.3 API"]
        VectorStore["pgvector Embeddings"]
    end

    subgraph DataTier ["Data & Storage Tier"]
        Postgres[("PostgreSQL + PostGIS")]
        RedisDB[("Upstash Redis Cache & PubSub")]
        MediaCDN[("Cloudinary Media CDN")]
    end

    subgraph ExternalAPIs ["External Public APIs"]
        MapboxAPI["Mapbox Navigation API"]
        WeatherAPI["Open-Meteo Weather API"]
        PayAPI["Payment Gateway API (Razorpay/Stripe)"]
    end

    WebDesktop --> VercelEdge
    WebMobile --> VercelEdge
    WebTablet --> VercelEdge
    VercelEdge --> APIRouter

    APIRouter --> AuthSvc
    APIRouter --> ItinSvc
    APIRouter --> BookSvc
    APIRouter --> GroupSvc
    APIRouter --> VoiceSvc
    APIRouter --> GovtSvc

    ItinSvc --> LLMOrch
    VoiceSvc --> LLMOrch
    LLMOrch --> GeminiFlash
    LLMOrch --> GroqLlama
    LLMOrch --> VectorStore

    AuthSvc --> Postgres
    AuthSvc --> RedisDB
    ItinSvc --> Postgres
    ItinSvc --> RedisDB
    BookSvc --> Postgres
    GroupSvc --> RedisDB
    GroupSvc --> Postgres
    GovtSvc --> Postgres

    ItinSvc --> MapboxAPI
    ItinSvc --> WeatherAPI
    BookSvc --> PayAPI
    WebDesktop --> MediaCDN
```

---

## 3. Low-Level Design (LLD)

### 3.1 Component Decomposition & Relationships

```mermaid
flowchart TD
    subgraph ItineraryModule ["Itinerary Module"]
        ItinService["ItineraryService"]
        AIPlanner["AIPlannerEngine"]
        POIRepo["POIRepository"]
    end

    subgraph BookingModule ["Booking Module"]
        BookService["BookingService"]
        PayProcessor["PaymentProcessor"]
        QRGen["QRCodeGenerator"]
    end

    subgraph CollabModule ["Collaboration & Fair-Price Module"]
        GroupService["GroupCollabService"]
        FairPriceEngine["FairPriceEngine"]
        CultureAdvisor["CultureAdvisorEngine"]
    end

    ItinService --> POIRepo
    ItinService --> AIPlanner
    BookService --> ItinService
    BookService --> PayProcessor
    BookService --> QRGen
    GroupService --> ItinService
    FairPriceEngine --> POIRepo
    CultureAdvisor --> POIRepo
```

---

## 4. Key Workflows & Sequence Diagrams

### 4.1 Real-Time AI Itinerary Generation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Tourist as Tourist (Web Browser)
    participant Gateway as Vercel Edge Router
    participant Svc as Itinerary Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL PostGIS
    participant AI as Gemini Groq Engine
    participant Ext as Weather and Maps API

    Tourist->>Gateway: POST /api/itinerary/generate
    Gateway->>Svc: Forward Payload
    Svc->>Cache: Check Cached POIs
    alt Cache Miss
        Svc->>DB: Query POIs by Radius
        DB-->>Svc: Candidate POIs
        Svc->>Cache: Save Candidate POIs
    else Cache Hit
        Cache-->>Svc: Return Cached POIs
    end

    par Real-time Enrichment
        Svc->>Ext: Fetch Forecast & Route Matrix
        Ext-->>Svc: Weather & Durations
    end

    Svc->>AI: Send Prompt Context (Weather + Budget + Days)
    AI-->>Svc: Return Optimized JSON Itinerary
    Svc->>DB: Persist Itinerary
    DB-->>Svc: Saved Confirmation
    Svc-->>Gateway: Return Itinerary Response
    Gateway-->>Tourist: Render Itinerary Timeline
```

---

## 5. Database Architecture & Physical Data Model

```mermaid
erDiagram
    USERS ||--o{ ITINERARIES : creates
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ REVIEWS : submits
    USERS ||--o{ GROUP_ROOMS : hosts
    
    ITINERARIES ||--o{ ITINERARY_DAYS : contains
    ITINERARY_DAYS ||--o{ ITINERARY_ACTIVITIES : contains
    PLACES ||--o{ ITINERARY_ACTIVITIES : referenced_in
    PLACES ||--o{ REVIEWS : rated_by
    
    VENDORS ||--o{ HOMESTAYS : operates
    HOMESTAYS ||--o{ BOOKINGS : reserved_in

    USERS {
        uuid id PK
        string full_name
        string email
        string phone
        string preferred_locale
        string created_at
    }

    PLACES {
        uuid id PK
        string name
        string category
        string location_point
        string city
        string state
        string operating_hours
        float price_entry
        float avg_rating
        string cultural_advisory
        string image_urls
    }

    ITINERARIES {
        uuid id PK
        uuid user_id FK
        string destination_city
        int total_days
        float budget_total
        string preferences
        string status
        string created_at
    }

    ITINERARY_DAYS {
        uuid id PK
        uuid itinerary_id FK
        int day_number
        string target_date
        string weather_summary
    }

    ITINERARY_ACTIVITIES {
        uuid id PK
        uuid day_id FK
        uuid place_id FK
        string start_time
        string end_time
        int sequence_order
        string activity_title
        string notes
    }

    HOMESTAYS {
        uuid id PK
        uuid vendor_id FK
        string property_name
        string location_point
        float price_per_night
        boolean is_verified
        string amenities
        string gallery_urls
    }

    BOOKINGS {
        uuid id PK
        uuid user_id FK
        string booking_type
        uuid reference_id
        float total_amount
        string payment_status
        string idempotency_key
        string qr_ticket_code
        string booking_date
    }

    GROUP_ROOMS {
        uuid id PK
        uuid host_user_id FK
        string room_code
        string group_members
        string votes_ledger
        string expense_split_ledger
        string created_at
    }
```

---

## 6. API Design & Specifications

### 6.1 Core RESTful Endpoints

| Method | Endpoint | Description | Request Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/itinerary/generate` | Generates a multi-day itinerary using AI | `{ city, days, budget, interests: [] }` | `{ itineraryId, days: [...] }` |
| `GET` | `/api/places/nearby` | Spatial query for POIs/homestays | `?lat=28.61&lng=77.20&radius=10` | `[{ id, name, coords, category }]` |
| `POST` | `/api/chat/message` | Multilingual AI chat assistant | `{ message, history: [], locale: "hi" }` | `{ reply, suggestedActions: [] }` |
| `POST` | `/api/scam-shield/estimate` | Fair-price calculator & phrases | `{ from, to, distanceKm, vehicleType }` | `{ estimatedFairPrice, phrases: [] }` |
| `POST` | `/api/bookings/checkout` | Creates booking & payment intent | `{ type, targetId, dateRange, amount }` | `{ orderId, qrCode, status }` |

---

## 7. Non-Functional & Resilience Strategy

### 7.1 Scalability & Caching Flow

```mermaid
flowchart TD
    Req[Client Web Request] --> L1{Layer 1: Browser SWR / Edge CDN Cache}
    L1 -- Hit --> Res1[Return Cached Response < 10ms]
    L1 -- Miss --> L2{Layer 2: Upstash Redis Cache}
    L2 -- Hit --> Res2[Return Redis Cache < 50ms]
    L2 -- Miss --> L3[Layer 3: PostGIS Spatial DB Query < 200ms]
    L3 --> UpdateCache[Update Redis Cache]
    UpdateCache --> Res3[Return Fresh Data]
```
