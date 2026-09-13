# Blog de Limba Română

Blog pentru lucrările elevilor, administrat de o profesoară. Elevii trimit texte
fără cont; profesoara le citește și le aprobă înainte să apară public.

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 · SQL Server ·
Auth.js v5 (Google) · TipTap 3 · Tailwind CSS 4

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

> **Apple Silicon:** imaginea SQL Server există doar pentru x86_64. Activează în
> Docker Desktop → Settings → General → *Use Rosetta for x86_64/amd64 emulation*.

### Alternativ: aplicația pe gazdă, doar baza de date în Docker

Util dacă vrei să rulezi debugger-ul direct în editor.

```bash
npm install
npm run db:up                     # doar SQL Server
npx tsx scripts/ensure-db.ts      # creează baza de date
npm run db:migrate && npm run db:seed
npm run dev
```

În acest caz `DATABASE_URL` din `.env` trebuie să indice `localhost` (valoarea
implicită din `.env.example`), nu `sqlserver`.

---

## Variabile de mediu

Toate sunt în `.env.example`. Cele obligatorii ca aplicația să pornească:

| Variabilă | Ce e | Cum o obții |
|---|---|---|
| `DATABASE_URL` | Conexiunea la SQL Server | e deja completată pentru dev local |
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

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | server de dezvoltare |
| `npm run build` | build de producție |
| `npm test` | teste (sanitizare HTML, slug-uri) |
| `npm run db:up` / `db:down` | pornește/oprește SQL Server local |
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

**SQL Server nu suportă `enum` în Prisma.** Statusurile sunt `String`, cu
tipurile stricte în `lib/types.ts`. În plus, cheile de index sunt limitate la
900 de octeți iar `String` devine implicit `NVarChar(1000)` — de aceea fiecare
coloană cu `@id`, `@unique` sau `@@index` are lungime explicită în schemă.

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
