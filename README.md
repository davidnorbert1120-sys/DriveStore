# DriveStore

Használt autóalkatrész piactér – full-stack webalkalmazás Spring Boot backenddel és Angular frontenddel. Lehetővé teszi felhasználóknak alkatrészek feltöltését, böngészését kategóriák szerint, valós idejű frissítéseket WebSocket-en, valamint privát üzenetváltást vevő és eladó között.

## Tech stack

**Backend**
- Java 17, Spring Boot 3.3.5
- Spring Security + JWT (jjwt 0.12.5) – stateless authentikáció
- Spring Data JPA + Hibernate – PostgreSQL 16
- Spring WebSocket (STOMP) – real-time termék események
- ModelMapper, Lombok, Maven

**Frontend**
- Angular 20 (standalone komponensek, signal-alapú change detection)
- Angular Material – dialogok, snackbar
- RxJS, STOMP WebSocket kliens
- SCSS BEM konvencióval

**Infra**
- Docker + docker-compose (PostgreSQL)
- Dockerfile multi-stage backend image
- **Cloudinary** – CDN képtárolás (signed upload Java SDK-val)

## Funkciók

- **Authentikáció** – regisztráció, bejelentkezés, JWT token (24h lejárat)
- **Termékek** – feltöltés képpel, szerkesztés, törlés (csak saját), szűrés kategória szerint
- **Képfeltöltés** – multipart, max 5 MB, jpg/png/webp/gif validáció, **Cloudinary CDN-en tárolva**
- **4 kategória** – karosszéria, motor, futómű, elektronika
- **Real-time frissítés** – új/módosított/törölt termékek WebSocket-en azonnal megjelennek minden kliensnek
- **Privát üzenetek** – vevő és eladó közötti chat termékhez kötve, eladói nézetben partner-listával
- **Tulajdonosi védelem** – `checkOwnership()` minden módosító műveletnél
- **Custom exception hierarchia** – `ResourceNotFoundException`, `UnauthorizedException`, `EmailAlreadyExistsException`, `InvalidFileException`, `InvalidMessageException` → mapping megfelelő HTTP státuszokra `@RestControllerAdvice`-ban

## Architektúra

Klasszikus rétegezett (controller → service → repository) Spring Boot backend, REST API-val. A frontend különálló Angular SPA, ami `/api` prefixen keresztül kommunikál (Angular dev proxy a backendre).

```
Angular SPA  ──HTTP+JWT──>  Spring Boot REST  ──JPA──>  PostgreSQL
     │                            │
     └──── STOMP/WebSocket ────────┘
```

A JWT-t a frontend `localStorage`-ban tárolja, és egy `HttpInterceptor` automatikusan minden requesthez hozzácsatolja `Authorization: Bearer ...` headerként. 401 esetén az interceptor automatikusan kijelentkezteti a felhasználót.

### DTO struktúra

A DTO-k `incoming/` (request) és `outgoing/` (response) alcsomagokba vannak rendezve, így egyértelmű egy adott osztály felelőssége.

```
dto/
├── incoming/    LoginRequest, RegisterRequest, CreateProductRequest, ...
└── outgoing/    AuthResponse, ProductDto, ProductEvent, MessageDto
```

## Futtatás lokálisan

### Előfeltételek

- Java 17+
- Node.js 20+
- Docker (PostgreSQL-hez)

### 1. Adatbázis indítása

```bash
docker-compose up -d
```

Ez elindít egy PostgreSQL 16 instance-et `localhost:5433`-on, `drivestore` adatbázissal.

### 2. Backend indítása

```bash
./mvnw spring-boot:run
```

A backend a `http://localhost:8080`-on indul. Az `application.yml` env változókat is támogat (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`) – production deploy-hoz ezeket be kell állítani.

### 3. Frontend indítása

```bash
cd frontend
npm install
npm start
```

Az alkalmazás a `http://localhost:4200`-on érhető el. Az Angular dev proxy a `/api/**` kéréseket automatikusan átirányítja a backendre.

## API végpontok

| Method | Endpoint | Auth | Leírás |
|--------|----------|------|--------|
| POST   | `/auth/register` | – | Regisztráció |
| POST   | `/auth/login`    | – | Bejelentkezés, visszaad JWT-t |
| GET    | `/products`      | – | Összes termék (`?category=` opcionális) |
| GET    | `/products/{id}` | – | Termék részletei |
| GET    | `/products/my`   | ✓ | Saját termékek |
| POST   | `/products`      | ✓ | Új termék létrehozása |
| PUT    | `/products/{id}` | ✓ | Termék módosítása (csak tulajdonos) |
| DELETE | `/products/{id}` | ✓ | Termék törlése (csak tulajdonos) |
| POST   | `/upload/image`  | ✓ | Kép feltöltése (multipart) |
| GET    | `/uploads/{filename}` | – | Feltöltött kép letöltése |
| GET    | `/messages/product/{productId}` | ✓ | Beszélgetés egy termékhez |
| POST   | `/messages`      | ✓ | Üzenet küldése |
| WS     | `/ws` (`/topic/products`) | – | Real-time termék események |

A `http/` mappában elérhetők IntelliJ HTTP kliens fájlok a végpontok manuális teszteléséhez.

## Projekt struktúra

```
DriveStore/
├── src/main/java/com/drivestore/
│   ├── config/         # SecurityConfig, WebSocketConfig, WebConfig, ModelMapperConfig
│   ├── controller/     # REST controllerek
│   ├── domain/         # JPA entitások (User, Product, Message, Category enum)
│   ├── dto/
│   │   ├── incoming/   # Request DTO-k
│   │   └── outgoing/   # Response DTO-k
│   ├── exception/      # Custom exception-ök + GlobalExceptionHandler
│   ├── repository/     # Spring Data JPA repository-k
│   ├── security/       # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│   └── service/        # Üzleti logika (AuthService, ProductService, MessageService, ...)
├── src/main/resources/
│   └── application.yml
├── frontend/
│   └── src/app/
│       ├── core/       # Models, services, HTTP interceptor, route guard
│       ├── pages/      # Routed komponensek (auth, products, upload, dashboard, ...)
│       └── shared/     # Újrahasznosítható komponensek (navbar, product-card, confirm-dialog)
├── http/               # IntelliJ HTTP client fájlok
├── docker-compose.yml
├── Dockerfile
└── pom.xml
```

## Deploy

A projekt két különböző cloud platformra deployolható:

- **Backend** → [Render](https://render.com) – Spring Boot app + PostgreSQL DB
- **Frontend** → [Vercel](https://vercel.com) – Angular SPA

### Backend deploy Render-re

A repóban található `render.yaml` egy **Blueprint** fájl, ami automatikusan létrehoz mindent: web service-t (Docker build a `Dockerfile`-ből), managed PostgreSQL DB-t, és összeköti őket env változókon keresztül.

1. Render dashboard → **New** → **Blueprint**
2. Csatlakoztasd a GitHub repót
3. Render felismeri a `render.yaml`-t és listázza, mit fog létrehozni → **Apply**
4. Az első deploy után állítsd be a `CORS_ORIGINS` env változót a Vercel URL-edre (pl. `https://drivestore.vercel.app`)
5. A backend URL: `https://drivestore-api.onrender.com`

### Frontend deploy Vercel-re

A `frontend/vercel.json` tartalmaz `rewrites`-okat, amik a `/api/*` és `/uploads/*` kéréseket a Render backendre proxy-zzák, így a frontend kódban nem kell URL-eket cserélni.

1. Vercel dashboard → **Add New** → **Project**
2. Import a GitHub repó
3. **Root Directory:** `frontend`
4. Framework: Angular (automatikusan felismeri)
5. Deploy

### Production limitációk (known issues)

- **Render free tier cold start** – 15 perc inaktivitás után a service alszik, az első request 30-60 másodperc lehet.
- **Neon free tier** – idle után pár másodperces cold start lehet az adatbázis első lekérdezésénél.

## Implementációs döntések

- **Stateless JWT** session helyett – horizontális skálázáshoz előnyösebb
- **Globális exception handler** (`@RestControllerAdvice`) – konzisztens hibaválaszok, nem szivárog technical detail a kliensre
- **Soft FK kezelés** – termék törlésekor a hozzá tartozó üzenetek explicit törlése a service rétegben (FK constraint kezelése)
- **Standalone Angular komponensek** – moduláris struktúra, `NgModule` nélkül (Angular ajánlott modern pattern)
- **Functional HttpInterceptor** – Angular 20 stílus, könnyen tesztelhető

## Lehetséges továbbfejlesztések

- Tesztek (jelenleg csak boilerplate Spring Boot test van) – unit + integration
- E2E tesztek (Cypress / Playwright)
- Pagináció a termékek listájához
- Search/filter szöveg alapján
- Email értesítés új üzenetekről
- Soft delete üzeneteknél
- Rate limiting a publikus végpontokon
- CI/CD pipeline (GitHub Actions)
