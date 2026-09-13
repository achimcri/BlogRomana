import { spawn } from "node:child_process";
import WebSocket from "ws";

/*
  Gaseste elementele care fac pagina sa derulaze orizontal pe telefon.

  Depasirea pe latime e greu de depistat din ochi: efectul (text taiat la
  marginea dreapta) apare peste tot, dar cauza e un singur element prea lat.
  Scriptul deschide Chrome fara interfata, masoara latimea documentului si
  raporteaza exact ce elemente depasesc.

    npx tsx scripts/check-layout.ts [url] [latime]
*/

const URL_TINTA = process.argv[2] ?? "http://localhost:3000/";
const LATIME = Number(process.argv[3] ?? 390);
const INALTIME = 844;
const PORT = 9222;

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SCRIPT_MASURARE = `
(() => {
  const doc = document.documentElement;
  const latimeVizibila = doc.clientWidth;
  const vinovati = [];

  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > latimeVizibila + 1 || r.left < -1) {
      // Pastram doar elementele care nu au un parinte deja vinovat, ca sa
      // raportam cauza, nu toti descendentii ei.
      if (!vinovati.some((v) => v.el.contains(el))) {
        vinovati.push({
          el,
          info: {
            tag: el.tagName.toLowerCase(),
            clase: (el.className && String(el.className).slice(0, 90)) || '',
            stanga: Math.round(r.left),
            dreapta: Math.round(r.right),
            latime: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40),
          },
        });
      }
    }
  });

  return JSON.stringify({
    latimeVizibila,
    latimeDocument: doc.scrollWidth,
    depasire: doc.scrollWidth - latimeVizibila,
    vinovati: vinovati.map((v) => v.info).slice(0, 12),
  });
})()
`;

async function main() {
  const chrome = spawn(CHROME, [
    "--headless",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    `--window-size=${LATIME},${INALTIME}`,
    "--user-data-dir=/tmp/chrome-masurare",
    URL_TINTA,
  ]);
  chrome.stderr.on("data", () => {});

  // Asteptam ca portul de depanare sa raspunda.
  let tinta: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const file = (await r.json()) as Array<{
        type: string;
        url: string;
        webSocketDebuggerUrl: string;
      }>;
      tinta = file.find((f) => f.type === "page" && f.url.startsWith("http"));
      if (tinta) break;
    } catch {
      /* inca nu a pornit */
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!tinta) {
    console.error("Nu am reușit să pornesc Chrome pe portul de depanare.");
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(tinta.webSocketDebuggerUrl);
  await new Promise((r) => ws.once("open", r));

  type RaspunsCdp = { result?: { value?: string } };

  function trimite(id: number, method: string, params: unknown) {
    return new Promise<RaspunsCdp>((resolve) => {
      const la = (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", la);
          resolve(msg.result);
        }
      };
      ws.on("message", la);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Chrome pe macOS are o latime minima de fereastra (~500px), deci
  // --window-size NU poate produce un viewport de telefon. Emularea de
  // dispozitiv ocoleste limita si da dimensiunea reala ceruta.
  await trimite(1, "Emulation.setDeviceMetricsOverride", {
    width: LATIME,
    height: INALTIME,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Lasam layout-ul sa se aseze dupa schimbarea de viewport.
  await new Promise((r) => setTimeout(r, 600));

  const rezultat = await trimite(2, "Runtime.evaluate", {
    expression: SCRIPT_MASURARE,
    returnByValue: true,
  });
  const raspuns: string = rezultat?.result?.value ?? "{}";

  ws.close();
  chrome.kill();

  const r = JSON.parse(raspuns);
  console.log(`\n${URL_TINTA}  la ${LATIME}px\n`);
  console.log(`  lățime vizibilă : ${r.latimeVizibila}px`);
  console.log(`  lățime document : ${r.latimeDocument}px`);

  if (r.depasire <= 0) {
    console.log(`\n  Fără depășire pe orizontală.\n`);
    process.exit(0);
  }

  console.log(`  DEPĂȘIRE        : ${r.depasire}px\n`);
  console.log("  Elemente care ies din ecran:\n");
  for (const v of r.vinovati) {
    console.log(`    <${v.tag}>  ${v.stanga} → ${v.dreapta}  (lățime ${v.latime})`);
    if (v.clase) console.log(`      class: ${v.clase}`);
    if (v.text) console.log(`      text : ${v.text}`);
    console.log();
  }
  process.exit(1);
}

main();
