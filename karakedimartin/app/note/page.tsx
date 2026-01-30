"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { getNote, getPublicNotes } from "@/lib/firestore";
import type { Note } from "@/types";
import ReactMarkdown from "react-markdown";

function NotePageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadNote();
    }
  }, [slug]);

  const loadNote = async () => {
    try {
      // Versuche zuerst mit slug, dann mit ID
      const publicNotes = await getPublicNotes();
      const foundNote = publicNotes.find(n => n.slug === slug || n.id === slug);
      
      if (foundNote) {
        const fullNote = await getNote(foundNote.id);
        if (fullNote && fullNote.isPublic) {
          setNote(fullNote);
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!slug) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Keine Notiz angegeben</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Notiz nicht gefunden</h1>
          <p className="text-stone-400 mb-6">Diese Notiz existiert nicht oder ist nicht öffentlich.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-100 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{note.title}</h1>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            {note.createdAt?.toDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {note.createdAt.toDate().toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            )}
            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {note.tags.join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-stone max-w-none">
          <div className="bg-stone-900 rounded-xl border border-stone-800 p-8 text-stone-100">
            <ReactMarkdown>
              {note.content || ""}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function NotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    }>
      <NotePageContent />
    </Suspense>
  );
}
