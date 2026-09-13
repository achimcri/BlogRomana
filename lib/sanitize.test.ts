import { beforeAll, describe, expect, it } from "vitest";

import { construiesteExtras, sanitizeazaContinut, textDinHtml } from "./sanitize";

beforeAll(() => {
  process.env.NEXT_PUBLIC_BLOB_HOST = "exemplu.blob.core.windows.net";
});

describe("sanitizeazaContinut", () => {
  it("pastreaza formatarea permisa din editor", () => {
    const html =
      '<p>Un text cu <strong>aldine</strong>, <em>cursive</em> si <u>subliniat</u>.</p>';
    expect(sanitizeazaContinut(html)).toBe(html);
  });

  it("pastreaza diacriticele romanesti neatinse", () => {
    const html = "<p>În fiecare dimineață, frunzele cad peste aleea școlii.</p>";
    expect(sanitizeazaContinut(html)).toContain("dimineață");
    expect(sanitizeazaContinut(html)).toContain("școlii");
  });

  // Vectorii de mai jos sunt exact ce poate trimite cineva prin formularul
  // public de submisie, ocolind editorul.
  const vectoriXss: Array<[string, string]> = [
    ["script inline", '<p>salut</p><script>alert(1)</script>'],
    ["handler onerror", '<img src=x onerror=alert(1)>'],
    ["handler onload", '<p onload="alert(1)">text</p>'],
    ["javascript: in href", '<a href="javascript:alert(1)">click</a>'],
    ["data: uri", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ["iframe", '<iframe src="https://exemplu.ro"></iframe>'],
    ["svg cu script", '<svg><script>alert(1)</script></svg>'],
    ["object", '<object data="x.swf"></object>'],
    ["style tag", "<style>body{display:none}</style>"],
    ["form ascuns", '<form action="https://rau.ro"><input name="p"></form>'],
    ["meta refresh", '<meta http-equiv="refresh" content="0;url=https://rau.ro">'],
    ["textarea solidus", "<p>a</p><textarea/><script>alert(1)</script>"],
  ];

  it.each(vectoriXss)("neutralizeaza: %s", (_nume, intrare) => {
    const rezultat = sanitizeazaContinut(intrare);
    expect(rezultat).not.toMatch(/<script/i);
    expect(rezultat).not.toMatch(/onerror/i);
    expect(rezultat).not.toMatch(/onload/i);
    expect(rezultat).not.toMatch(/javascript:/i);
    expect(rezultat).not.toMatch(/<iframe/i);
    expect(rezultat).not.toMatch(/<object/i);
    expect(rezultat).not.toMatch(/<style/i);
    expect(rezultat).not.toMatch(/<form/i);
    expect(rezultat).not.toMatch(/<meta/i);
  });

  it("adauga rel de siguranta pe legaturile externe", () => {
    const rezultat = sanitizeazaContinut('<a href="https://exemplu.ro">x</a>');
    expect(rezultat).toContain('rel="noopener noreferrer nofollow"');
    expect(rezultat).toContain('target="_blank"');
  });

  it("pastreaza imaginile de pe host-ul propriu", () => {
    const html =
      '<img src="https://exemplu.blob.core.windows.net/post-images/a.webp" alt="poză" />';
    expect(sanitizeazaContinut(html)).toContain("exemplu.blob.core.windows.net");
  });

  it("elimina imaginile externe, care pot fi pixeli de urmarire", () => {
    const html = '<img src="https://tert-necunoscut.ro/pixel.gif" alt="x" />';
    expect(sanitizeazaContinut(html)).not.toContain("tert-necunoscut.ro");
  });

  it("permite doar proprietatile CSS din allowlist", () => {
    const html =
      '<span style="color:#ff0000;font-size:18px;position:fixed;top:0">x</span>';
    const rezultat = sanitizeazaContinut(html);
    expect(rezultat).toContain("color");
    expect(rezultat).toContain("font-size");
    expect(rezultat).not.toContain("position");
  });

  it("normalizeaza b/i la varianta semantica", () => {
    expect(sanitizeazaContinut("<b>x</b>")).toBe("<strong>x</strong>");
    expect(sanitizeazaContinut("<i>x</i>")).toBe("<em>x</em>");
  });
});

describe("textDinHtml", () => {
  it("scoate markup-ul si normalizeaza spatiile", () => {
    expect(textDinHtml("<p>Un   text</p><p>si altul</p>")).toBe(
      "Un text si altul",
    );
  });

  it("decodifica entitatile, fara sa reintroduca markup", () => {
    expect(textDinHtml("<p>a &amp; b</p>")).toBe("a & b");
  });
});

describe("construiesteExtras", () => {
  it("taie la limita de cuvant", () => {
    const extras = construiesteExtras(`<p>${"cuvant ".repeat(60)}</p>`, 50);
    expect(extras.length).toBeLessThanOrEqual(51);
    expect(extras.endsWith("…")).toBe(true);
    expect(extras).not.toMatch(/cuva…$/);
  });

  it("lasa textele scurte neatinse", () => {
    expect(construiesteExtras("<p>Text scurt.</p>")).toBe("Text scurt.");
  });
});
