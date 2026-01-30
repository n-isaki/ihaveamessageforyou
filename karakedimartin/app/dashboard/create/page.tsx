"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { createNote, createLink } from "@/lib/firestore";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Save, Globe, Lock, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

type ContentType = "note" | "link";

export default function CreatePage() {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const { showToast } = useToast();
  
  useEffect(() => {
    if (!loading && !user) {
      console.log("Kein User - leite zu Login weiter");
      router.push("/login");
    }
    if (user) {
      console.log("User authentifiziert:", user.uid, user.email);
    }
  }, [user, loading, router]);
  const [contentType, setContentType] = useState<ContentType>("note");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Note fields
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Link fields
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Bitte anmelden...</div>
      </div>
    );
  }
  
  if (error) {
    console.error("Auth Error:", error);
  }

  const handleSave = async () => {
    if (!user) {
      showToast('error', 'Bitte melde dich an');
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      if (contentType === "note") {
        if (!noteTitle.trim()) {
          showToast('error', 'Bitte gib einen Titel ein');
          setSaving(false);
          return;
        }

        const slug = isPublic ? generateSlug(noteTitle) : undefined;
        const noteData = {
          title: noteTitle,
          content: noteContent,
          isPublic,
          slug,
          tags: [],
          authorId: user.uid,
        };
        
        console.log("Erstelle Notiz:", noteData);
        console.log("User UID:", user.uid);
        console.log("User Email:", user.email);
        try {
          const noteId = await createNote(noteData);
          console.log("✅ Notiz erstellt mit ID:", noteId);
          showToast('success', 'Notiz erfolgreich erstellt!');
        } catch (err: any) {
          console.error("❌ Fehler beim Erstellen:", err);
          throw err; // Re-throw damit der outer catch es fängt
        }
      } else {
        if (!linkUrl.trim() || !linkTitle.trim()) {
          showToast('error', 'Bitte gib URL und Titel ein');
          setSaving(false);
          return;
        }

        const slug = isPublic ? generateSlug(linkTitle) : undefined;
        const linkData = {
          url: linkUrl,
          title: linkTitle,
          description: linkDescription,
          isPublic,
          slug,
          tags: [],
          authorId: user.uid,
        };
        
        console.log("Erstelle Link:", linkData);
        console.log("User UID:", user.uid);
        console.log("User Email:", user.email);
        try {
          const linkId = await createLink(linkData);
          console.log("✅ Link erstellt mit ID:", linkId);
          showToast('success', 'Link erfolgreich erstellt!');
        } catch (err: any) {
          console.error("❌ Fehler beim Erstellen:", err);
          throw err; // Re-throw damit der outer catch es fängt
        }
      }

      // Warte kurz bevor Redirect (damit User die Success-Message sieht)
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("❌ Fehler beim Speichern:", error);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      
      let errorMessage = "Unbekannter Fehler";
      if (error.code === "permission-denied") {
        errorMessage = "Keine Berechtigung. Bitte prüfe die Firestore Rules.";
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Fehler: ${error.code}`;
      }
      
      showToast('error', 'Fehler beim Speichern: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold mb-2">Neu erstellen</h1>
            <p className="text-stone-400">Erstelle eine Notiz oder füge einen Link hinzu</p>
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setContentType("note")}
            className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
              contentType === "note"
                ? "border-rose-500 bg-rose-500/10"
                : "border-stone-800 hover:border-stone-700"
            }`}
          >
            <div className="text-lg font-bold mb-1">Notiz</div>
            <div className="text-sm text-stone-400">Markdown-Notiz erstellen</div>
          </button>
          <button
            onClick={() => setContentType("link")}
            className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
              contentType === "link"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-stone-800 hover:border-stone-700"
            }`}
          >
            <div className="text-lg font-bold mb-1">Link</div>
            <div className="text-sm text-stone-400">Link hinzufügen</div>
          </button>
        </div>

        {/* Public/Private Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
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
          {contentType === "note" ? (
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
