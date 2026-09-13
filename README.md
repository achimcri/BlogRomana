# Blog de Limba Română

Blog pentru lucrările elevilor, administrat de o profesoară. Elevii trimit texte
fără cont; profesoara le citește și le aprobă înainte să apară public.

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 · PostgreSQL ·
Auth.js v5 (Google) · TipTap 3 · Tailwind CSS 4

**Găzduire:** Vercel (aplicația) + Neon (baza de date) — 0 €/lună

---

## Pornire rapidă (totul în Docker)

Ai nevoie doar de Docker Desktop.

```bash
cp .env.example .env    # AUTH_SECRET: npx auth secret
npm run docker:up
```

Atât. Containerul așteaptă baza de date, o creează dacă lipsește, aplică
migrările, încarcă datele demo și pornește aplicația pe **http://localhost:3000**

| Comandă | Ce face |
|---|---|
| `npm run docker:up` | pornește tot (aplicație + bază de date) |
| `npm run docker:logs` | urmărește logurile aplicației |
| `npm run docker:down` | oprește |
| `npm run docker:reset` | oprește **și șterge baza de date** |

Modificările în cod se văd imediat — hot reload funcționează prin volumul montat.

### Alternativ: aplicația pe gazdă, doar baza de date în Docker

Util dacă vrei să rulezi debugger-ul direct în editor.

```bash
npm install
npm run db:up                     # doar Postgres
npm run db:migrate && npm run db:seed
npm run dev
```

În acest caz `DATABASE_URL` din `.env` trebuie să indice `localhost` (valoarea
implicită din `.env.example`), nu `postgres`.

---

## Variabile de mediu

Toate sunt în `.env.example`. Cele obligatorii ca aplicația să pornească:

| Variabilă | Ce e | Cum o obții |
|---|---|---|
| `DATABASE_URL` | Conexiunea la Postgres | e deja completată pentru dev local |
| `AUTH_SECRET` | Cheia de semnare a sesiunilor | `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Credențiale OAuth | Google Cloud Console (vezi mai jos) |
| `TEACHER_EMAILS` | Cine are voie să se logheze (rol TEACHER) | emailul profesoarei |
| `ADMIN_EMAILS` | La fel, dar cu rol ADMIN | opțional |

### Configurarea login-ului Google

Verifică oricând ce lipsește:

```bash
npm run check:auth
```

**1. Proiect Google Cloud**

Intră în [Google Cloud Console](https://console.cloud.google.com) și creează un
proiect nou (ex. `blog-romana`).

**2. Ecranul de consimțământ**

*APIs & Services* → *OAuth consent screen* (în consolele mai noi apare ca
*Google Auth Platform*). Alege **External**, completează numele aplicației și
emailul de contact.

**Lasă aplicația în starea „Testing”** și adaugă emailul profesoarei la
*Test users*. Motive:

- Nu ai nevoie de verificare din partea Google.
- Doar utilizatorii de test se pot autentifica — un al doilea strat de apărare,
  peste allowlist-ul din `TEACHER_EMAILS`.
- Limita de 7 zile a refresh token-urilor în modul Testing **nu ne afectează**:
  folosim sesiuni JWT proprii și nu cerem acces offline.

**3. Credențiale**

*Credentials* → *Create Credentials* → *OAuth client ID* → **Web application**.

La *Authorized redirect URIs* adaugă exact:

```
http://localhost:3000/api/auth/callback/google
```

Iar când ajungi în producție, încă una:

```
https://DOMENIUL-TĂU/api/auth/callback/google
```

> Adresa trebuie să fie identică, caracter cu caracter. Un slash în plus la
> final, `http` în loc de `https` sau alt port produc `redirect_uri_mismatch`.

**4. Completează `.env`**

```env
AUTH_GOOGLE_ID="....apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-..."
TEACHER_EMAILS="adresa.reala@gmail.com"
```

**5. Repornește**

```bash
npm run check:auth     # confirmă că totul e pus corect
npm run docker:up
```

### Erori frecvente

| Ce vezi | Ce înseamnă |
|---|---|
| `redirect_uri_mismatch` | Adresa din Console diferă de cea reală. Rulează `npm run check:auth`, care ți-o tipărește exact. |
| `invalid_client` | Client ID sau Secret greșit, ori inversate între ele. |
| „Cont neautorizat” | Login-ul Google a reușit, dar emailul nu e în `TEACHER_EMAILS`. |
| „Access blocked: app not verified” | Contul nu e adăugat la *Test users* pe ecranul de consimțământ. |
| Merge local, nu și în producție | Lipsește `AUTH_TRUST_HOST=true` în spatele unui proxy (Azure Container Apps), sau `AUTH_URL` nu e domeniul real cu `https`. |

**`TEACHER_EMAILS` și `ADMIN_EMAILS` formează împreună lista completă a celor
care se pot autentifica.** Orice alt cont Google este respins la login, nu doar
lipsit de drepturi. Dacă ambele lipsesc, *toate* login-urile sunt respinse —
intenționat, ca o configurare incompletă să nu deschidă panoul de administrare.

> ⚠️ **Cele două roluri au deocamdată exact aceleași drepturi.** Distincția e
> stocată corect în baza de date și rescrisă la fiecare login (sursa de adevăr
> sunt variabilele de mediu, nu baza de date), dar niciun cod nu verifică încă
> `role === "ADMIN"`. Când vrei ca ștergerea definitivă sau setările să fie
> rezervate adminilor, verificarea se adaugă în `requireTeacher()` din
> [lib/auth.ts](lib/auth.ts).

Fiecare cont adăugat aici trebuie să fie și în lista *Test users* din Google
Cloud Console, cât timp aplicația e în starea „Testing”.

---

## Deploy pe Vercel + Neon

Costă 0 €/lună. Vercel rulează aplicația, Neon ține baza de date.

> Planul Hobby al Vercel este declarat „personal, non-comercial”. Un blog școlar
> fără venituri se încadrează. Dacă școala vrea ceva sub contract comercial,
> planul Pro costă 20 $/lună.

### 1. Baza de date (Neon) — gata

Proiectul `winter-boat-47767141` e creat în `eu-central-1` (Frankfurt), legat de
acest director (`.neon`, gitignorat), iar **schema e deja aplicată** pe branch-ul
`production`.

Șirul de conexiune, când ai nevoie de el:

```bash
neon connection-string production --pooled
```

Două lucruri de schimbat înainte să-l pui în Vercel:

**Folosește varianta `--pooled`.** Pe Vercel fiecare cerere poate porni o
instanță serverless proprie, cu propriul pool de conexiuni. Șirul direct
epuizează rapid limita bazei; cel „pooled" trece printr-un PgBouncer care le
multiplexează.

**Schimbă `sslmode=require` în `sslmode=verify-full`.** Driverul `pg` tratează
azi `require` ca `verify-full`, dar avertizează că la versiunea majoră următoare
va trece la semantica libpq — care **nu verifică certificatul**. Scris explicit,
comportamentul rămâne același indiferent de versiune. Am testat că Neon acceptă
`verify-full`.

> ⚠️ `neon link` și `neon env pull` **suprascriu `DATABASE_URL` din `.env`** cu
> șirul de producție. Dacă se întâmplă, `npm run db:seed` sau
> `prisma migrate dev` ar lovi baza reală. După orice comandă `neon`, verifică
> că `.env` arată spre `localhost`.

### 2. Aplicația (Vercel)

1. Urcă repo-ul pe GitHub.
2. [vercel.com](https://vercel.com) → *Add New Project* → alege repo-ul.
   Next.js e detectat automat, nu trebuie configurat nimic.
3. Adaugă variabilele de mediu (*Settings → Environment Variables*):

   | Variabilă | Valoare |
   |---|---|
   | `DATABASE_URL` | șirul *pooled* de la Neon, cu `sslmode=verify-full` |
   | `AUTH_SECRET` | `npx auth secret` (altul decât cel local) |
   | `AUTH_GOOGLE_ID` | din Google Cloud Console |
   | `AUTH_GOOGLE_SECRET` | din Google Cloud Console |
   | `AUTH_URL` | `https://domeniul-tău.vercel.app` |
   | `TEACHER_EMAILS` | emailul profesoarei |
   | `ADMIN_EMAILS` | opțional |

4. Deploy.

Migrările rulează automat la fiecare deploy: scriptul `vercel-build` din
`package.json` face `prisma generate && prisma migrate deploy && next build`.

> `prisma generate` e explicit în build, nu doar în `postinstall`. Vercel
> restaurează uneori `node_modules` din cache și sare peste `postinstall`, iar
> clientul Prisma se generează în `lib/generated/` — care e gitignorat. Fără
> pasul explicit, build-ul ar eșua cu „module not found”.

### 3. Google OAuth pentru domeniul de producție

În Google Cloud Console, la *Authorized redirect URIs*, adaugă:

```
https://domeniul-tău.vercel.app/api/auth/callback/google
```

Ține minte: fiecare deploy de *preview* primește un URL propriu, care **nu** va
fi în listă. Login-ul Google va funcționa doar pe domeniul de producție. E și
mai sigur așa.

### 4. Domeniu propriu (opțional)

*Settings → Domains* în Vercel. Certificatul HTTPS e automat și gratuit. După
ce îl legi, actualizează `AUTH_URL` și adaugă noul redirect URI în Google.

### De ce NU folosim Neon Auth

Panoul Neon propune un pas `neon config init` cu `auth: true`, care activează
**Neon Auth** — produsul lor de autentificare, cu tabele proprii de utilizatori.

Nu îl folosim: avem deja Auth.js cu Google, iar modelul `User` e administrat de
Prisma. Activarea lui ar adăuga în baza de date un al doilea sistem de
autentificare, pe care aplicația nu l-ar folosi niciodată.

Din aceleași motive, variabilele `NEON_AUTH_BASE_URL` și `NEON_AUTH_JWKS_URL`,
adăugate automat de `neon link`, au fost scoase din `.env`.

### Ce mai lipsește înainte de lansare

- **Stocarea pozelor** (Faza 4) — Cloudflare R2 e gratuit până la 10 GB, fără
  costuri de trafic. Momentan postările merg doar cu text.
- **Acordul părinților** pentru publicarea numelor elevilor minori.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | server de dezvoltare |
| `npm run build` | build de producție |
| `npm test` | teste (sanitizare HTML, slug-uri) |
| `npm run db:up` / `db:down` | pornește/oprește Postgres local |
| `npm run db:migrate` | aplică migrările Prisma |
| `npm run db:seed` | date demo (idempotent) |
| `npm run db:studio` | interfață vizuală peste baza de date |

---

## Structură

```
app/
  (public)/          pagina principală, articol, formular de trimitere, despre
  admin/             panou protejat: postări, coadă de aprobare, setări
  api/auth/          Auth.js
actions/             server actions (posts, submissions)
components/
  editor/            editorul TipTap
  admin/             formulare de administrare
lib/
  auth.ts            configurarea Auth.js + allowlist
  db.ts              client Prisma (cu gardă server-only)
  prisma-client.ts   fabrica de client, folosibilă și din scripturi Node
  sanitize.ts        curățarea HTML
  slug.ts            slug-uri din titluri românești
  validation.ts      scheme Zod
proxy.ts             verificare optimistă de sesiune (fostul middleware.ts)
```

---

## Note de implementare

Lucruri care nu se văd din cod și care sunt ușor de stricat din greșeală.

**Sanitizarea se face de două ori.** O dată la salvare, o dată la randare. Al
doilea pas nu e redundant: sanitizarea doar la scriere „îngheață” politica din
momentul salvării, deci un rând scris sub o regulă mai permisivă ar rămâne așa
în baza de date pentru totdeauna.

**`proxy.ts` nu este autorizare.** Verifică doar *existența* unui cookie, fără
să-i valideze semnătura. Autorizarea reală este `auth()` din
`app/admin/layout.tsx` și verificarea din fiecare server action. Documentația
Next.js numește asta „optimistic check” și avertizează explicit să nu folosești
proxy-ul ca soluție de autorizare.

**Diacriticele cer `latin-ext`.** Caracterele ă î â ș ț nu sunt în subsetul
`latin` al fonturilor Google. Fără `subsets: ["latin", "latin-ext"]` browserul
face fallback la alt font doar pentru ele, iar textul arată rupt.

**Statusurile sunt `String`, nu `enum`.** Restricția venea de la SQL Server
(folosit înainte de mutarea pe Neon), unde Prisma nu suportă enum-uri. Pe
Postgres ar merge, dar le-am păstrat ca `String`: adăugarea unei stări noi nu
cere o migrare. Tipurile stricte stau în `lib/types.ts` și sunt validate cu Zod
la fiecare scriere.

**Temele se definesc într-un `:root` obișnuit, nu într-un `@theme` imbricat
în `@media`.** Tailwind v4 aplatizează `@theme` indiferent de media query-ul din
jur, deci varianta imbricată ar șterge complet paleta luminoasă.

**Culorile au înțeles.** Albastru-cerneală = vocea elevului, partea publică.
Roșu = mâna profesoarei, exclusiv moderare. Roșu apărut pe partea publică a
site-ului este o greșeală.

---

## Confidențialitate

Site-ul publică **numele și clasa unor minori**. Măsurile din cod:

- Numele complet rămâne în baza de date, vizibil doar în panoul de administrare.
- Public apare `displayName`, propus implicit ca prenume + inițială („Maria P.”).
- Profesoara vede și confirmă numele public la fiecare aprobare — nu e o valoare
  ascunsă, ca decizia să fie conștientă.
- `sharp` elimină EXIF din poze (inclusiv geolocația) la încărcare.

**Înainte de lansare:** obține acordul scris al părinților și pune o politică de
confidențialitate pe pagina „Despre”.
