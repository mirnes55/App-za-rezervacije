# Kako deployati (što jednostavnije)

Aplikacija se sastoji od **web** (frontend) i **backend** (API + baza). Najjednostavnije:

- **Web** → **Vercel** (besplatno, par klikova)
- **Backend + PostgreSQL** → **Railway** ili **Render** (besplatni tier)

---

## 1. Backend + baza na Railway (preporučeno)

1. Otvori [railway.app](https://railway.app), prijavi se (npr. GitHub).
2. **New Project** → **Deploy from GitHub repo** → izaberi repozitorij (moraš prvo pushati kod na GitHub).
3. U projektu dodaj **PostgreSQL**: **+ New** → **Database** → **PostgreSQL**. Railway će kreirati bazu i dati `DATABASE_URL`.
4. Dodaj **backend** kao servis: **+ New** → **GitHub Repo** → isti repo, u postavkama postavi **Root Directory** na `backend`.
5. U **Variables** za backend servis dodaj:
   - `DATABASE_URL` – kopiraj iz PostgreSQL servisa (Railway ga nudi u kartici **Connect** → **Postgres connection URL**).
   - `JWT_SECRET` – neka nasumična riječ (npr. `moja-tajna-za-jwt-123`).
   - Opcionalno: `FRONTEND_URL` – kasnije URL tvog Vercel frontenda (npr. `https://tvoj-projekt.vercel.app`).
6. **Settings** za backend:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`
7. Build i migracije: u ovom projektu **build** skripta već pokreće `prisma migrate deploy`, tako da će se tablice kreirati pri prvom deployu. **Build Command** ostavi `npm run build`, **Start Command** `npm start`.
8. (Opcionalno) Za test podatke nakon deploya: u Railwayu otvori **Shell** za backend servis i pokreni `npx prisma db seed` (korisnici: vlasnik@test.ba, gost@test.ba, lozinka: lozinka123).
9. Nakon deploya Railway će dati URL backendu, npr. `https://tvoj-backend.up.railway.app`. Sačuvaj ga.

---

## 2. Web na Vercel

1. Otvori [vercel.com](https://vercel.com), prijavi se (GitHub).
2. **Add New** → **Project** → uvezi isti GitHub repozitorij.
3. **Root Directory**: postavi na **web** (klik na **Edit** pored imena projekta i odaberi folder `web`).
4. **Environment Variables**:
   - `VITE_API_URL` = URL tvog backend API-ja (npr. `https://tvoj-backend.up.railway.app/api`). Bez završnog `/`!
5. **Deploy**. Vercel će buildati Vite projekt i dati ti link, npr. `https://app-za-rezervacije.vercel.app`.

---

## 3. Povezivanje

- Na Vercel-u (web) mora biti postavljen **VITE_API_URL** na Railway backend URL + `/api`, npr. `https://tvoj-backend.up.railway.app/api`.
- Na Railway-u (backend) u **Variables** možeš dodati **FRONTEND_URL** = tvoj Vercel URL (npr. `https://app-za-rezervacije.vercel.app`) da CORS dozvoli samo taj frontend (opcionalno, za produkciju).

Nakon toga otvori Vercel link – trebao bi vidjeti listu restorana. Ako baza nema podataka, prvo se registriraj kao **Vlasnik restorana**, pa u Dashboardu dodaj restoran i rasporede.

---

## Alternativa: Render umjesto Railway

1. [render.com](https://render.com) → **New** → **PostgreSQL** (besplatno). Zapiši **Internal Database URL**.
2. **New** → **Web Service** → poveži repo, **Root Directory**: `backend`.
3. **Build**: `npm install && npm run build && npx prisma migrate deploy`  
   **Start**: `npm start`
4. **Environment**: dodaj `DATABASE_URL` (Internal Database URL), `JWT_SECRET`, opcionalno `FRONTEND_URL`.
5. Web frontend možeš također hostati na Renderu (**Static Site**), ili ga ostaviti na Vercel i samo postaviti **VITE_API_URL** na Render backend URL + `/api`.

---

## Brzi pregled

| Što        | Gdje    | URL / napomena                          |
|-----------|---------|-----------------------------------------|
| Web       | Vercel  | Root: `web`, env: `VITE_API_URL`        |
| Backend   | Railway | Root: `backend`, env: `DATABASE_URL`, `JWT_SECRET` |
| Baza      | Railway | PostgreSQL iz istog projekta             |

Po prvom deployu na Railway, u Shellu za backend pokreni: `npx prisma migrate deploy` pa (po želji) `npx prisma db seed`.
