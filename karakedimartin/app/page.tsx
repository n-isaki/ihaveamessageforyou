"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Link as LinkIcon, Calendar, Tag } from "lucide-react";
import { getPublicNotes, getPublicLinks } from "@/lib/firestore";
import type { Note, Link as LinkType } from "@/types";

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicContent();
  }, []);

  const loadPublicContent = async () => {
    try {
      const [publicNotes, publicLinks] = await Promise.all([
        getPublicNotes(),
        getPublicLinks()
      ]);
      setNotes(publicNotes);
      setLinks(publicLinks);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
            Karakedimartin
          </h1>
          <p className="text-stone-400 text-lg">
            Gedankenwerkstatt & Notizen
          </p>
        </div>

        {/* Public Notes */}
        {notes.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Notizen & Artikel</h2>
              <Link
                href="/dashboard"
                className="text-sm text-stone-400 hover:text-stone-100 transition-colors flex items-center gap-2"
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/note?slug=${note.slug || note.id}`}
                  className="group p-6 bg-stone-900 rounded-xl border border-stone-800 hover:border-stone-700 transition-all"
                >
                  <h3 className="text-xl font-bold mb-2 group-hover:text-rose-400 transition-colors">
                    {note.title}
                  </h3>
                  <p className="text-stone-400 text-sm line-clamp-3 mb-4">
                    {note.content?.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    {note.createdAt?.toDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {note.createdAt.toDate().toLocaleDateString("de-DE")}
                      </div>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {note.tags[0]}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Public Links */}
        {links.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Links</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-6 bg-stone-900 rounded-xl border border-stone-800 hover:border-stone-700 transition-all"
                >
                  <LinkIcon className="h-6 w-6 text-emerald-500 mb-3" />
                  <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-stone-400 text-sm mb-3 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 truncate">{link.url}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notes.length === 0 && links.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-stone-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Noch keine öffentlichen Inhalte</h3>
            <p className="text-stone-400 mb-6">
              Die ersten Notizen und Links werden hier erscheinen
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
            >
              Zum Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-stone-500 text-sm pt-12 border-t border-stone-800">
          <p>Karakedimartin • Gedankenwerkstatt • Notizen • Links</p>
        </div>
      </div>
    </div>
  );
}
