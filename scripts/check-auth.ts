import "dotenv/config";

/*
  Verifica setarile de autentificare inainte sa pornesti aplicatia.

  Exista pentru ca o configurare gresita de OAuth produce erori greu de citit
  ("redirect_uri_mismatch", "invalid_client", sau pur si simplu un login care
  esueaza tacut). Aici primesti mesajul concret.

    npx tsx scripts/check-auth.ts
*/

type Verificare = { ok: boolean; mesaj: string; detaliu?: string };

const rezultate: Verificare[] = [];

function verifica(ok: boolean, mesaj: string, detaliu?: string) {
  rezultate.push({ ok, mesaj, detaliu });
}

// --- AUTH_SECRET ---
const secret = process.env.AUTH_SECRET ?? "";
verifica(
  secret.length >= 32,
  "AUTH_SECRET",
  secret.length === 0
    ? "Lipsește. Generează cu: npx auth secret"
    : secret.length < 32
      ? `Prea scurt (${secret.length} caractere, minim 32).`
      : undefined,
);

// --- AUTH_GOOGLE_ID ---
const clientId = process.env.AUTH_GOOGLE_ID ?? "";
if (!clientId) {
  verifica(false, "AUTH_GOOGLE_ID", "Lipsește. Vezi pașii din README.");
} else if (!clientId.endsWith(".apps.googleusercontent.com")) {
  verifica(
    false,
    "AUTH_GOOGLE_ID",
    "Nu arată ca un Client ID Google — ar trebui să se termine în " +
      '".apps.googleusercontent.com". Ai copiat cumva Client Secret-ul aici?',
  );
} else {
  verifica(true, "AUTH_GOOGLE_ID");
}

// --- AUTH_GOOGLE_SECRET ---
const clientSecret = process.env.AUTH_GOOGLE_SECRET ?? "";
if (!clientSecret) {
  verifica(false, "AUTH_GOOGLE_SECRET", "Lipsește.");
} else if (clientSecret.endsWith(".apps.googleusercontent.com")) {
  verifica(
    false,
    "AUTH_GOOGLE_SECRET",
    "Aici ai pus Client ID-ul, nu secretul. Sunt inversate.",
  );
} else {
  verifica(true, "AUTH_GOOGLE_SECRET");
}

// --- Conturi permise ---
function lista(cheie: string): string[] {
  return (process.env[cheie] ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

const profesori = lista("TEACHER_EMAILS");
const admini = lista("ADMIN_EMAILS");
const toate = [...profesori, ...admini];

if (toate.length === 0) {
  verifica(
    false,
    "TEACHER_EMAILS / ADMIN_EMAILS",
    "Ambele lipsesc. Fără ele, ORICE login este respins (intenționat).",
  );
} else if (toate.some((e) => e.endsWith("@exemplu.ro"))) {
  verifica(
    false,
    "TEACHER_EMAILS",
    "Încă e valoarea de exemplu. Pune adresa Gmail reală.",
  );
} else if (toate.some((e) => !e.includes("@"))) {
  verifica(false, "Conturi permise", "Una dintre valori nu e o adresă de email.");
} else {
  // Un email in ambele liste ar fi ambiguu; ADMIN castiga, dar semnalam.
  const duble = profesori.filter((e) =>
    admini.some((a) => a.toLowerCase() === e.toLowerCase()),
  );
  const detaliu = [
    profesori.length ? `TEACHER: ${profesori.join(", ")}` : null,
    admini.length ? `ADMIN: ${admini.join(", ")}` : null,
    duble.length
      ? `în ambele liste (câștigă ADMIN): ${duble.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  verifica(duble.length === 0, "Conturi permise", detaliu);
}

// --- AUTH_URL ---
const authUrl = process.env.AUTH_URL ?? "";
if (!authUrl) {
  verifica(false, "AUTH_URL", "Lipsește. Local: http://localhost:3000");
} else {
  try {
    const u = new URL(authUrl);
    if (u.protocol !== "https:" && u.hostname !== "localhost") {
      verifica(
        false,
        "AUTH_URL",
        "În producție trebuie https. Google refuză redirect-uri http " +
          "către orice altceva decât localhost.",
      );
    } else {
      verifica(true, "AUTH_URL", authUrl);
    }
  } catch {
    verifica(false, "AUTH_URL", `Nu e o adresă validă: ${authUrl}`);
  }
}

// --- Raport ---
console.log("\nVerificare autentificare Google\n");
for (const r of rezultate) {
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.mesaj}`);
  if (r.detaliu) console.log(`      ${r.detaliu}`);
}

const esecuri = rezultate.filter((r) => !r.ok);

console.log("\n" + "─".repeat(64));
if (authUrl) {
  console.log("\nAdaugă EXACT această adresă în Google Cloud Console,");
  console.log("la „Authorized redirect URIs”:\n");
  console.log(`  ${authUrl.replace(/\/$/, "")}/api/auth/callback/google\n`);
  console.log("Trebuie să fie identică — fără slash în plus la final,");
  console.log("iar http/https și portul contează.\n");
}

if (esecuri.length > 0) {
  console.log(
    `${esecuri.length} ${esecuri.length === 1 ? "problemă" : "probleme"} de rezolvat înainte să funcționeze login-ul.\n`,
  );
  process.exit(1);
}

console.log("Configurația arată corect. Repornește: npm run docker:up\n");
