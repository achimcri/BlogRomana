import { describe, expect, it } from "vitest";

import { slugDinTitlu, slugUnic } from "./slug";

describe("slugDinTitlu", () => {
  it("transforma diacriticele romanesti in ASCII", () => {
    expect(slugDinTitlu("Toamna în parcul școlii")).toBe(
      "toamna-in-parcul-scolii",
    );
    expect(slugDinTitlu("Împărat și țăran")).toBe("imparat-si-taran");
  });

  it("trateaza identic varianta cu sedila si cea cu virgula", () => {
    // ş U+015F (sedila, gresit dar frecvent) vs ș U+0219 (corect)
    const cuSedila = slugDinTitlu("Bucureşti");
    const cuVirgula = slugDinTitlu("București");
    expect(cuSedila).toBe("bucuresti");
    expect(cuVirgula).toBe("bucuresti");
    expect(cuSedila).toBe(cuVirgula);
  });

  it("elimina punctuatia si spatiile multiple", () => {
    expect(slugDinTitlu("  Ce-am făcut... în vacanță?!  ")).toBe(
      "ce-am-facut-in-vacanta",
    );
  });

  it("nu depaseste lungimea coloanei si nu se termina in cratima", () => {
    const slug = slugDinTitlu("cuvant ".repeat(60));
    expect(slug.length).toBeLessThanOrEqual(180);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("da un slug valid pentru un titlu doar din punctuatie", () => {
    expect(slugDinTitlu("!!!???")).toBe("postare");
  });
});

describe("slugUnic", () => {
  it("returneaza slugul de baza cand e liber", async () => {
    const slug = await slugUnic("Prima zi de școală", async () => false);
    expect(slug).toBe("prima-zi-de-scoala");
  });

  it("adauga sufix numeric la coliziune", async () => {
    // Titluri repetate sunt normale intr-o scoala: fiecare an are o "Prima zi".
    const ocupate = new Set(["prima-zi-de-scoala", "prima-zi-de-scoala-2"]);
    const slug = await slugUnic("Prima zi de școală", async (s) =>
      ocupate.has(s),
    );
    expect(slug).toBe("prima-zi-de-scoala-3");
  });
});
