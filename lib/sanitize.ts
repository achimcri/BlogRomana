import sanitizeHtml from "sanitize-html";

/*
  Curatarea HTML-ului venit din editor.

  Regula, fara exceptii: orice HTML care ajunge in baza de date trece pe aici
  intai, indiferent daca vine de la profesoara sau de la un elev. Nu exista
  "utilizator de incredere" -- contul profesoarei poate fi compromis, iar
  formularul de elev este public si anonim.

  Abordarea este allowlist: ce nu e enumerat explicit mai jos, dispare.
*/

/**
 * Doar aceste proprietati CSS trec, si doar cu valori de forma asteptata.
 * `style` liber ar permite atacuri de tip clickjacking cu position/z-index si
 * exfiltrare prin url() in background.
 */
const STILURI_PERMISE: Record<string, RegExp[]> = {
  color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i],
  "font-size": [/^\d{1,2}(\.\d+)?(px|pt|em|rem)$/],
  "text-align": [/^(left|right|center|justify)$/],
};

/**
 * Host-ul propriu de imagini. Permitem `img` doar de la noi:
 * o imagine externa intr-o postare poate fi un pixel de urmarire care scurge
 * adresele IP ale cititorilor (aici, copii si parinti) catre un tert.
 */
function hostPermisImagini(): string | null {
  return process.env.NEXT_PUBLIC_BLOB_HOST || null;
}

const OPTIUNI: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "span",
  ],

  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    span: ["style"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
  },

  allowedStyles: {
    "*": STILURI_PERMISE,
  },

  // Fara "javascript:", "data:" sau alte scheme exotice.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],

  // Un <a> fara href nu are ce cauta; goleste si tag-urile ramase fara continut.
  exclusiveFilter: (frame) =>
    frame.tag === "a" && !frame.attribs.href,

  transformTags: {
    // Legaturile externe se deschid in tab nou si nu transmit referrer-ul.
    // `noopener` blocheaza accesul paginii tinta la window.opener.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      },
    }),
    // Editorul poate produce <b>/<i>; le normalizam la varianta semantica.
    b: "strong",
    i: "em",
  },
};

/**
 * Curata HTML-ul unei postari. Intotdeauna pe server, niciodata in browser:
 * o sanitizare facuta doar pe client poate fi ocolita trimitand direct cererea.
 */
export function sanitizeazaContinut(htmlBrut: string): string {
  const host = hostPermisImagini();

  const optiuni: sanitizeHtml.IOptions = {
    ...OPTIUNI,
    allowedTags: host
      ? OPTIUNI.allowedTags
      : // Daca nu stim host-ul propriu, nu permitem deloc imagini inline.
        (OPTIUNI.allowedTags as string[]).filter((t) => t !== "img"),
    transformTags: {
      ...OPTIUNI.transformTags,
      ...(host
        ? {
            img: (tagName: string, attribs: Record<string, string>) => {
              try {
                const url = new URL(attribs.src ?? "");
                if (url.hostname !== host) {
                  // Sursa straina -> scoatem complet elementul.
                  return { tagName: "span", attribs: {}, text: "" };
                }
              } catch {
                return { tagName: "span", attribs: {}, text: "" };
              }
              return { tagName, attribs };
            },
          }
        : {}),
    },
  };

  return sanitizeHtml(htmlBrut, optiuni);
}

/**
 * Text simplu dintr-un HTML deja sanitizat, pentru rezumate si meta description.
 * Nu produce HTML, deci nu poate reintroduce markup.
 */
export function textDinHtml(html: string): string {
  // Fara pasul asta, </p><p> ar lipi ultimul cuvant al unui paragraf de primul
  // cuvant al urmatorului ("...text" + "si..." -> "textsi"), ceea ce ar strica
  // fiecare rezumat care se intinde pe mai multe paragrafe.
  const cuSeparatoare = html.replace(
    /<\/(p|h2|h3|li|blockquote|ul|ol)>|<br\s*\/?>/gi,
    " ",
  );

  const doarText = sanitizeHtml(cuSeparatoare, {
    allowedTags: [],
    allowedAttributes: {},
  });
  // sanitize-html lasa entitatile codificate; le aducem la text citibil.
  return doarText
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rezumat scurt pentru meta description si Open Graph. */
export function construiesteExtras(html: string, maxLungime = 200): string {
  return previzualizare(html, maxLungime).text;
}

/**
 * Previzualizare pentru listare, impreuna cu informatia daca textul a fost
 * taiat.
 *
 * Steagul `trunchiat` exista ca sa putem arata "Citește mai mult" DOAR cand
 * chiar mai urmeaza ceva. Un link care promite mai mult text si duce la
 * acelasi lucru e mai rau decat lipsa lui.
 */
export function previzualizare(
  html: string,
  maxLungime = 200,
): { text: string; trunchiat: boolean } {
  const text = textDinHtml(html);
  if (text.length <= maxLungime) return { text, trunchiat: false };

  const taiat = text.slice(0, maxLungime);
  const ultimulSpatiu = taiat.lastIndexOf(" ");
  return {
    text: `${taiat.slice(0, ultimulSpatiu > 0 ? ultimulSpatiu : maxLungime)}…`,
    trunchiat: true,
  };
}
