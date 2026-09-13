"use client";

import Link from "@tiptap/extension-link";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

/*
  Editorul de text.

  Iese HTML, care ajunge intr-un input ascuns si de acolo in server action.
  NU are incredere in nimic din ce produce: HTML-ul este sanitizat pe server
  (lib/sanitize.ts) inainte de orice scriere in baza de date. Editorul e doar
  o comoditate pentru autor, nu o masura de securitate.
*/

const MARIMI = [
  { eticheta: "Mic", valoare: "16px" },
  { eticheta: "Normal", valoare: "" },
  { eticheta: "Mare", valoare: "22px" },
  { eticheta: "Foarte mare", valoare: "28px" },
];

export function RichTextEditor({
  numeCamp = "contentHtml",
  continutInitial = "",
  placeholder = "Scrie textul aici…",
}: {
  numeCamp?: string;
  continutInitial?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(continutInitial);

  const editor = useEditor({
    // Fara asta, React 19 avertizeaza despre nepotrivirea dintre server si client.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Titlurile de nivel 1 sunt rezervate titlului postarii.
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Editorul nu trebuie sa poata produce scheme periculoase; sanitizarea
        // de pe server le-ar taia oricum, dar le oprim si aici.
        protocols: ["http", "https", "mailto"],
      }),
    ],
    content: continutInitial,
    editorProps: {
      attributes: {
        class: "scris min-h-64 px-4 py-3 focus:outline-none",
        "aria-label": "Conținutul textului",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="border border-liniatura">
        <div className="h-12 border-b border-liniatura bg-hartie-umbra" />
        <div className="min-h-64 px-4 py-3 text-cerneala-stinsa">
          Se încarcă editorul…
        </div>
      </div>
    );
  }

  return (
    <div className="border border-liniatura focus-within:border-cerneala">
      <Toolbar editor={editor} />
      {/* Placeholder-ul e pozitionat absolut peste zona de scris.
          O varianta in flux normal (cu margine negativa) ar trage in sus
          marginea de jos a containerului si ar turti editorul la un rand. */}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty ? (
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-3 select-none px-4 font-scris text-[1.1875rem] text-cerneala-stinsa"
          >
            {placeholder}
          </p>
        ) : null}
      </div>
      {/* Valoarea trimisa efectiv catre server action. */}
      <input type="hidden" name={numeCamp} value={html} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Butoanele trebuie sa se reaprinda cand se muta cursorul, nu doar cand se
  // scrie; de aceea ascultam si `selectionUpdate`.
  const [, forteazaRandare] = useState(0);
  useEffect(() => {
    const reactualizeaza = () => forteazaRandare((n) => n + 1);
    editor.on("transaction", reactualizeaza);
    return () => {
      editor.off("transaction", reactualizeaza);
    };
  }, [editor]);

  const marimeCurenta =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-liniatura bg-hartie-umbra px-2 py-1.5">
      <Buton
        activ={editor.isActive("bold")}
        titlu="Aldine (Ctrl+B)"
        la={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </Buton>
      <Buton
        activ={editor.isActive("italic")}
        titlu="Cursive (Ctrl+I)"
        la={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic font-scris">I</span>
      </Buton>
      <Buton
        activ={editor.isActive("underline")}
        titlu="Subliniat (Ctrl+U)"
        la={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </Buton>

      <Separator />

      <Buton
        activ={editor.isActive("heading", { level: 2 })}
        titlu="Titlu de secțiune"
        la={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        T1
      </Buton>
      <Buton
        activ={editor.isActive("heading", { level: 3 })}
        titlu="Subtitlu"
        la={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        T2
      </Buton>

      <Separator />

      <label className="sr-only" htmlFor="marime-font">
        Mărimea textului
      </label>
      <select
        id="marime-font"
        value={marimeCurenta}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontSize(v).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        className="border border-liniatura bg-hartie px-2 py-1 text-sm"
      >
        {MARIMI.map((m) => (
          <option key={m.eticheta} value={m.valoare}>
            {m.eticheta}
          </option>
        ))}
      </select>

      <Separator />

      <Buton
        activ={editor.isActive("bulletList")}
        titlu="Listă cu puncte"
        la={() => editor.chain().focus().toggleBulletList().run()}
      >
        •—
      </Buton>
      <Buton
        activ={editor.isActive("orderedList")}
        titlu="Listă numerotată"
        la={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </Buton>
      <Buton
        activ={editor.isActive("blockquote")}
        titlu="Citat"
        la={() => editor.chain().focus().toggleBlockquote().run()}
      >
        „”
      </Buton>

      <Separator />

      <Buton
        activ={editor.isActive("link")}
        titlu="Adaugă o legătură"
        la={() => {
          const existent = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("Adresa legăturii:", existent ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </Buton>

      <div className="ml-auto flex gap-1">
        <Buton
          titlu="Anulează (Ctrl+Z)"
          dezactivat={!editor.can().undo()}
          la={() => editor.chain().focus().undo().run()}
        >
          ↶
        </Buton>
        <Buton
          titlu="Refă (Ctrl+Shift+Z)"
          dezactivat={!editor.can().redo()}
          la={() => editor.chain().focus().redo().run()}
        >
          ↷
        </Buton>
      </div>
    </div>
  );
}

function Buton({
  children,
  la,
  activ = false,
  dezactivat = false,
  titlu,
}: {
  children: React.ReactNode;
  la: () => void;
  activ?: boolean;
  dezactivat?: boolean;
  titlu: string;
}) {
  return (
    <button
      type="button"
      onClick={la}
      disabled={dezactivat}
      title={titlu}
      aria-label={titlu}
      aria-pressed={activ}
      className={`min-w-8 border px-2 py-1 text-sm transition-colors disabled:opacity-30 ${
        activ
          ? "border-cerneala bg-cerneala text-hartie"
          : "border-transparent hover:border-liniatura"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-liniatura" aria-hidden="true" />;
}
