# DriveStore

Használt autóalkatrész piactér – full-stack webalkalmazás Spring Boot backenddel és Angular frontenddel. Lehetővé teszi felhasználóknak alkatrészek feltöltését, böngészését kategóriák szerint, valós idejű frissítéseket WebSocket-en, valamint privát üzenetváltást vevő és eladó között.

🌐 **Live demo:** https://drivestore.vercel.app
📦 **API backend:** https://drivestore-api.onrender.com

> ⚠️ A backend Render free tier-en fut, az első kérés 30-60 mp lehet (cold start után újra gyors).

## Tech stack

**Backend**
- Java 17, Spring Boot 3.3.5
- Spring Security + JWT (jjwt 0.12.5) – stateless authentikáció
- Spring Data JPA + Hibernate
- Spring WebSocket (STOMP) – real-time termék- és üzenet-események
- ModelMapper, Lombok, Maven

**Frontend**
- Angular 20 (standalone komponensek)
- Angular Material – dialogok, snackbar
- RxJS, STOMP.js + SockJS WebSocket kliens
- SCSS BEM konvencióval

**Adatbázis & Tárolás**
- PostgreSQL 16 (lokálisan Docker, élesen [Neon](https://neon.tech) serverless)
- [Cloudinary](https://cloudinary.com) – CDN képtárolás (signed upload Java SDK-val)

**Infra & Deploy**
- Docker + docker-compose lokális fejlesztéshez
- Multi-stage Dockerfile a backend image-hez
- Render – backend hosting (`render.yaml` Blueprint)
- Vercel – frontend hosting (`vercel.json` rewrite-ok)

## Funkciók

- **Authentikáció** – regisztráció, bejelentkezés, JWT token (24h lejárat)
- **Termékek** – feltöltés képpel, szerkesztés, törlés (csak saját), szűrés kategória szerint
- **Vásárlás** – külön `POST /products/{id}/buy` endpoint, ami eltávolítja a hirdetést a piactérről
- **Képfeltöltés** – multipart, max 5 MB, jpg/png/webp/gif validáció, Cloudinary CDN-en tárolva
- **4 kategória** – karosszéria, motor, futómű, elektronika
- **Real-time termék frissítés** – új/módosított/törölt termékek WebSocket-en (`/topic/products`) azonnal megjelennek minden kliensnek
- **Real-time üzenetek** – privát chat termékhez kötve, új üzenet azonnal megjelenik a fogadó képernyőjén (`/topic/messages/{productId}/{receiverId}`)
- **Eladói nézet** – ha a felhasználó az eladó, partner-lista jelenik meg minden vevőről aki üzent
- **Tulajdonosi védelem** – `checkOwnership()` minden módosító/törlő műveletnél (szerkesztés és törlés)
- **Custom exception hierarchia** – `ResourceNotFoundException`, `UnauthorizedException`, `EmailAlreadyExistsException`, `InvalidFileException`, `InvalidMessageException` → megfelelő HTTP státuszokra mapping `@RestControllerAdvice`-ban

## Architektúra

Klasszikus rétegezett (controller → service → repository) Spring Boot backend, REST API-val. A frontend különálló Angular SPA, ami `/api` prefixen keresztül kommunikál (Angular dev proxy a backendre).

```
Angular SPA  ──HTTP+JWT──>  Spring Boot REST  ──JPA──>  PostgreSQL (Neon)
     │                            │
     │                            └──── HTTP upload ──>  Cloudinary CDN
     │
     └──── STOMP/WebSocket ─────>  Spring Broker
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

A backend a `http://localhost:8080`-on indul.

A képfeltöltéshez Cloudinary credentialek kellenek – ezeket vagy környezeti változóként, vagy `src/main/resources/application-local.yml`-ben add meg:

```yaml
cloudinary:
  cloud-name: <your-cloud-name>
  api-key: <your-api-key>
  api-secret: <your-api-secret>
```

Ingyenes fiók: https://cloudinary.com/users/register/free

További támogatott env változók: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PARAMS`, `JWT_SECRET`, `JWT_EXPIRATION`, `CORS_ORIGINS`, `PORT`.

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
| POST   | `/products/{id}/buy` | ✓ | Vásárlás – levesz a piactérről |
| POST   | `/upload/image`  | ✓ | Kép feltöltése (multipart) → Cloudinary URL |
| GET    | `/messages/product/{productId}` | ✓ | Beszélgetés egy termékhez |
| POST   | `/messages`      | ✓ | Üzenet küldése |
| WS     | `/ws` + `/topic/products` | – | Real-time termék események broadcast |
| WS     | `/ws` + `/topic/messages/{productId}/{userId}` | – | User-specifikus üzenet topic |

A `http/` mappában elérhetők IntelliJ HTTP kliens fájlok a végpontok manuális teszteléséhez.

## Projekt struktúra

```
DriveStore/
├── src/main/java/com/drivestore/
│   ├── config/         # SecurityConfig, WebSocketConfig, ModelMapperConfig
│   ├── controller/     # REST controllerek
│   ├── domain/         # JPA entitások (User, Product, Message, Category enum)
│   ├── dto/
│   │   ├── incoming/   # Request DTO-k
│   │   └── outgoing/   # Response DTO-k
│   ├── exception/      # Custom exception-ök + GlobalExceptionHandler
│   ├── repository/     # Spring Data JPA repository-k
│   ├── security/       # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│   └── service/        # Üzleti logika (AuthService, ProductService, MessageService,
│                       #   FileStorageService [Cloudinary], ProductWebSocketService,
│                       #   MessageWebSocketService)
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

A projekt három különböző cloud szolgáltatást használ:

- **Backend** → [Render](https://render.com) – Spring Boot Docker konténerben
- **Frontend** → [Vercel](https://vercel.com) – Angular SPA
- **Adatbázis** → [Neon](https://neon.tech) – serverless PostgreSQL
- **Képtárolás** → [Cloudinary](https://cloudinary.com) – CDN object storage

### Backend deploy Render-re

A repóban található `render.yaml` egy **Blueprint** fájl, ami automatikusan létrehozza a backend web service-t (Docker build a `Dockerfile`-ből) és előre definiálja az env változókat.

1. Render dashboard → **New** → **Blueprint**
2. Csatlakoztasd a GitHub repót → Apply
3. Töltsd ki a `sync: false`-ra állított env változókat (Neon DB adatok, Cloudinary credentialek, CORS_ORIGINS)
4. Deploy → backend URL: `https://drivestore-api.onrender.com`

### Frontend deploy Vercel-re

A `frontend/vercel.json` `rewrites`-okat tartalmaz, amik a `/api/*` kéréseket a Render backendre proxy-zzák, így a frontend kódban nem kell URL-eket cserélni.

1. Vercel dashboard → **Add New** → **Project**
2. Import a GitHub repó
3. **Root Directory:** `frontend`
4. Framework: Angular (automatikusan felismeri)
5. Deploy → frontend URL: `https://drivestore.vercel.app`

### Production limitációk (known issues)

- **Render free tier cold start** – 15 perc inaktivitás után a service alszik, az első request 30-60 másodperc lehet.
- **Neon free tier** – idle után pár másodperces cold start lehet az adatbázis első lekérdezésénél.

## Implementációs döntések

- **Stateless JWT** session helyett – horizontális skálázáshoz előnyösebb, a backend nem tart session state-et
- **Globális exception handler** (`@RestControllerAdvice`) – konzisztens hibaválaszok, nem szivárog technical detail a kliensre
- **Soft FK kezelés** – termék törlésekor a hozzá tartozó üzenetek explicit törlése a service rétegben (FK constraint elkerülése)
- **`buy` és `delete` szétválasztása** – mindkét művelet eltávolítja a hirdetést, de `delete` csak tulajdonosé, `buy` bármely auth. usernek
- **User-specifikus WebSocket topic-ok** – `/topic/messages/{productId}/{receiverId}` célzottan a fogadónak, így nem leak más beszélgetésekbe
- **Externális képtárolás** – Cloudinary CDN-en, nem lokál fájlrendszeren (production-ready, ephemeral container-en is működik)
- **Standalone Angular komponensek** – moduláris struktúra, `NgModule` nélkül (Angular modern best practice)
- **Functional HttpInterceptor** – Angular 20 stílus, könnyebben tesztelhető
- **12-factor app** – minden konfiguráció env változókból (`application.yml` csak default-okat tart, prod override env-en)

## Lehetséges továbbfejlesztések

- Tesztek (jelenleg csak boilerplate Spring Boot test van) – unit + integration
- E2E tesztek (Cypress / Playwright)
- Pagináció a termékek listájához
- Search/filter szöveg alapján
- Email értesítés új üzenetekről
- Soft delete üzeneteknél
- Rate limiting a publikus végpontokon
- CI/CD pipeline (GitHub Actions)
