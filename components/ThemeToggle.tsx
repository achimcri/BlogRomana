"use client";

import { useSyncExternalStore } from "react";

const CHEIE = "tema";

/*
  Tema traieste pe <html data-theme>, pusa acolo de scriptul inline din
  app/layout.tsx inainte de prima pictura. Pentru React, asta este stare
  EXTERNA -- nu o detine el.

  De aceea `useSyncExternalStore` si nu `useState` + `useEffect`: primitiva
  asta e facuta exact pentru a citi stare din afara React-ului, trateaza
  corect hidratarea (foloseste instantaneul de server intai) si nu cade sub
  regula react-hooks/set-state-in-effect.
*/

const ascultatori = new Set<() => void>();

function aboneaza(callback: () => void) {
  ascultatori.add(callback);
  return () => {
    ascultatori.delete(callback);
  };
}

function instantaneuClient() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/** Pe server nu stim ce a ales utilizatorul. Implicitul este luminos. */
function instantaneuServer() {
  return false;
}

function schimba(intunecat: boolean) {
  const radacina = document.documentElement;
  if (intunecat) {
    radacina.setAttribute("data-theme", "dark");
  } else {
    radacina.removeAttribute("data-theme");
  }

  try {
    localStorage.setItem(CHEIE, intunecat ? "dark" : "light");
  } catch {
    // Navigare privata sau stocare blocata: tema merge pentru sesiunea
    // curenta, doar ca nu se tine minte.
  }

  for (const asculta of ascultatori) asculta();
}

/**
 * Comutator între modul luminos și cel întunecat.
 * Implicit este LUMINOS, indiferent de setarea sistemului de operare.
 */
export function ThemeToggle() {
  const intunecat = useSyncExternalStore(
    aboneaza,
    instantaneuClient,
    instantaneuServer,
  );

  const eticheta = intunecat
    ? "Treci pe modul luminos"
    : "Treci pe modul întunecat";

  return (
    <button
      type="button"
      onClick={() => schimba(!intunecat)}
      title={eticheta}
      aria-label={eticheta}
      aria-pressed={intunecat}
      className="inline-flex size-9 items-center justify-center rounded-mediu text-cerneala-slaba transition-colors hover:bg-hartie-umbra hover:text-cerneala"
    >
      {intunecat ? <Soare /> : <Luna />}
    </button>
  );
}

function Luna() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function Soare() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
