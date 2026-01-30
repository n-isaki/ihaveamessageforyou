"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getNote, getLink, updateNote, updateLink } from "@/lib/firestore";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Save, Globe, Lock } from "lucide-react";
import Link from "next/link";
import type { Note, Link as LinkType } from "@/types";
import { useToast } from "@/components/Toast";

function EditPageContent() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "note" | "link" | null;
  const id = searchParams.get("id") || "";
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // Note fields
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Link fields
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id && type) {
      loadData();
    }
  }, [user, id, type]);

  const loadData = async () => {
    if (!type || !id) return;
    
    try {
      if (type === "note") {
        const note = await getNote(id);
        if (note) {
          setNoteTitle(note.title);
          setNoteContent(note.content);
          setIsPublic(note.isPublic);
        }
      } else {
        const link = await getLink(id);
        if (link) {
          setLinkUrl(link.url);
          setLinkTitle(link.title);
          setLinkDescription(link.description || "");
          setIsPublic(link.isPublic);
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden:", error);
      showToast('error', 'Fehler beim Laden');
    }
  };

  const handleSave = async () => {
    if (!user || !type || !id) return;

    setSaving(true);
    try {
      if (type === "note") {
        if (!noteTitle.trim()) {
          showToast('error', 'Bitte gib einen Titel ein');
          setSaving(false);
          return;
        }

        const slug = isPublic ? generateSlug(noteTitle) : undefined;
        await updateNote(id, {
          title: noteTitle,
          content: noteContent,
          isPublic,
          slug,
        });
      } else {
        if (!linkUrl.trim() || !linkTitle.trim()) {
          showToast('error', 'Bitte gib URL und Titel ein');
          setSaving(false);
          return;
        }

        const slug = isPublic ? generateSlug(linkTitle) : undefined;
        await updateLink(id, {
          url: linkUrl,
          title: linkTitle,
          description: linkDescription,
          isPublic,
          slug,
        });
      }

      showToast('success', 'Erfolgreich gespeichert!');
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      showToast('error', 'Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!type || !id) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Ungültige Parameter</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-stone-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {type === "note" ? "Notiz bearbeiten" : "Link bearbeiten"}
            </h1>
            <p className="text-stone-400">Bearbeite deine Inhalte</p>
          </div>
        </div>

        {/* Public/Private Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full ${
              isPublic
                ? "border-blue-500 bg-blue-500/10"
                : "border-stone-800 hover:border-stone-700"
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Öffentlich</span>
                <span className="text-sm text-stone-400 ml-auto">
                  Für alle sichtbar
                </span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Privat</span>
                <span className="text-sm text-stone-400 ml-auto">
                  Nur für dich
                </span>
              </>
            )}
          </button>
        </div>

        {/* Form */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 space-y-6">
          {type === "note" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Titel der Notiz..."
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Inhalt (Markdown)</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Schreibe deine Notiz hier... (Markdown unterstützt)"
                  rows={15}
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Titel des Links..."
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung (optional)</label>
                <textarea
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Beschreibung des Links..."
                  rows={4}
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-stone-800">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-stone-700 rounded-xl hover:bg-stone-800 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl font-medium transition-colors"
            >
              <Save className="h-5 w-5" />
              {saving ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    }>
      <EditPageContent />
    </Suspense>
  );
}
