# Aplikacija za rezervacije restorana

Web i Android aplikacija za online rezervacije stolova. Restorani mogu dodavati rasporede i stolove; gosti mogu pregledati restorane i rezervisati stolove. Svi tekstovi su na bosanskom jeziku.

## Zahtjevi

- Node.js 20+
- PostgreSQL (ili pokreni lokalni Prisma Postgres: `npx prisma dev` u folderu `backend`)
- (Opcionalno) Android Studio / emulator za Android aplikaciju

## Pokretanje

### Backend (API)

1. U folderu `backend` kopiraj `.env.example` u `.env` i postavi `DATABASE_URL` (PostgreSQL connection string) i `JWT_SECRET`.
2. Ako koristiš Prisma lokalni Postgres: u `backend` pokreni `npx prisma dev` (pokreće bazu), zatim u drugom terminalu `npm run dev`.
3. Inače: pokreni svoju PostgreSQL bazu, u `backend` pokreni migracije: `npx prisma migrate deploy`, zatim `npm run dev`.
4. API radi na `http://localhost:4000`.

### Web aplikacija

1. U folderu `web` pokreni `npm install`, zatim `npm run dev`.
2. Otvori `http://localhost:5173`. Ako backend nije na portu 4000, postavi `VITE_API_URL` u `web/.env` (npr. `VITE_API_URL=http://localhost:4000/api`).

### Android aplikacija (Expo)

1. U folderu `mobile` pokreni `npm install`, zatim `npx expo start`.
2. Skeniraj QR kod sa Expo Go aplikacijom ili pokreni emulator.

## Deploy (Vercel + Railway)

Za brzi deploy da možete isprobati i pokazati partnerima: **web** na [Vercel](https://vercel.com), **backend + PostgreSQL** na [Railway](https://railway.app). Korak-po-korak upute: **[DEPLOY.md](DEPLOY.md)**.

**Railway:** Za backend servis obavezno postavi **Root Directory** na `backend`, inače build neće naći `package.json`.

## Struktura

- `backend/` – Node.js (Express + TypeScript), Prisma ORM, PostgreSQL. API: auth, restorani, rasporedi, stolovi, rezervacije.
- `web/` – React (Vite + TypeScript), stranice: lista restorana, detalji, prijava, registracija, moje rezervacije, dashboard vlasnika.
- `mobile/` – React Native (Expo), ekrani za goste: prijava, lista restorana, detalji, rezervacija, moje rezervacije.

## Uloge

- **Gost** – pregled restorana, rezervacija stola, pregled svojih rezervacija.
- **Vlasnik** – sve što gost + kreiranje restorana, rasporeda i stolova, pregled i potvrda/otkazivanje rezervacija.
- **Admin** – puna kontrola (planirano).
