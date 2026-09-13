import type { Metadata } from "next";
import { Archivo, Spectral } from "next/font/google";

import "./globals.css";

// subsets: latin-ext este OBLIGATORIU pentru romana. Diacriticele ă î â ș ț
// nu sunt in subsetul "latin"; fara latin-ext browserul ar face fallback la
// alt font doar pentru ele, iar textul ar arata rupt.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Blog de Limba Română",
    template: "%s — Blog de Limba Română",
  },
  description:
    "Compuneri, analize și lucrări ale elevilor, publicate de doamna profesoară.",
};

/*
  Aplica tema salvata INAINTE de prima pictura a paginii.

  Fara scriptul asta, un utilizator care a ales modul intunecat ar vedea o
  clipa pagina alba la fiecare incarcare. Trebuie sa fie inline si sincron,
  in <head> -- un efect React ar rula prea tarziu.

  Implicit: luminos. Absenta unei valori salvate NU inseamna "urmeaza sistemul".
*/
const SCRIPT_TEMA = `
(function(){try{
  if(localStorage.getItem('tema')==='dark'){
    document.documentElement.setAttribute('data-theme','dark');
  }
}catch(e){}})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${spectral.variable} ${archivo.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="tranzitie-tema flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
