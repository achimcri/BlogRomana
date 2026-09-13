import slugify from "slugify";

/*
  Slug-uri din titluri romanesti.

  Capcana specifica romanei: ș si ț exista in Unicode in doua variante care
  arata aproape identic dar sunt caractere diferite --
    - corect:  ș U+0219 / ț U+021B  (cu virgula dedesubt)
    - gresit:  ş U+015F / ţ U+0163  (cu sedila, mostenit din turca)
  Ambele circula in texte reale, mai ales copiate din Word sau de pe telefoane.
  Daca nu le tratam pe amandoua, "Bucureşti" si "București" ar produce
  slug-uri diferite pentru acelasi cuvant.
*/
const INLOCUIRI_ROMANESTI: Record<string, string> = {
  ă: "a",
  Ă: "A",
  â: "a",
  Â: "A",
  î: "i",
  Î: "I",
  ș: "s",
  Ș: "S",
  ş: "s", // varianta cu sedila
  Ş: "S",
  ț: "t",
  Ț: "T",
  ţ: "t", // varianta cu sedila
  Ţ: "T",
};

for (const [din, in_] of Object.entries(INLOCUIRI_ROMANESTI)) {
  slugify.extend({ [din]: in_ });
}

/** Slug de baza, fara garantie de unicitate. */
export function slugDinTitlu(titlu: string): string {
  const slug = slugify(titlu, {
    lower: true,
    strict: true,
    locale: "ro",
    trim: true,
  })
    // Coloana din baza de date este NVarChar(200); lasam loc pentru sufix.
    .slice(0, 180)
    .replace(/-+$/, "");

  // Un titlu format doar din semne de punctuatie ar da slug gol.
  return slug || "postare";
}

/**
 * Slug unic. `slugExista` primeste un candidat si spune daca e deja folosit,
 * ca functia sa ramana testabila fara baza de date.
 */
export async function slugUnic(
  titlu: string,
  slugExista: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baza = slugDinTitlu(titlu);

  if (!(await slugExista(baza))) return baza;

  // Doua postari cu acelasi titlu sunt normale intr-o scoala ("Toamna",
  // "Prima zi de scoala"), deci adaugam un sufix numeric.
  for (let i = 2; i < 200; i++) {
    const candidat = `${baza}-${i}`;
    if (!(await slugExista(candidat))) return candidat;
  }

  // Plasa de siguranta; practic inaccesibila.
  return `${baza}-${Date.now()}`;
}
