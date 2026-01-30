"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAllNotes, getAllLinks, deleteNote, deleteLink } from "@/lib/firestore";
import type { Note, Link as LinkType } from "@/types";
import { Plus, Search, BookOpen, Link as LinkIcon, Lock, Globe, Edit2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'note' | 'link' | null;
    id: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null,
  });
  const router = useRouter();
  const { showToast } = useToast();
  
  const loadData = async (userId: string) => {
    try {
      console.log("Dashboard: Lade Daten für User:", userId);
      const [notesData, linksData] = await Promise.all([
        getAllNotes(userId),
        getAllLinks(userId)
      ]);
      console.log("Dashboard: Notizen geladen:", notesData.length);
      console.log("Dashboard: Links geladen:", linksData.length);
      setNotes(notesData);
      setLinks(linksData);
    } catch (error: any) {
      console.error("Dashboard: Fehler beim Laden:", error);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
    }
  };
  
  const handleDeleteNote = (noteId: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'note',
      id: noteId,
    });
  };
  
  const handleDeleteLink = (linkId: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'link',
      id: linkId,
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id || !confirmModal.type) return;

    setDeletingId(confirmModal.id);
    try {
      if (confirmModal.type === 'note') {
        await deleteNote(confirmModal.id);
        setNotes(notes.filter(n => n.id !== confirmModal.id));
        showToast('success', 'Notiz erfolgreich gelöscht!');
      } else {
        await deleteLink(confirmModal.id);
        setLinks(links.filter(l => l.id !== confirmModal.id));
        showToast('success', 'Link erfolgreich gelöscht!');
      }
    } catch (error: any) {
      console.error("Fehler beim Löschen:", error);
      showToast('error', 'Fehler beim Löschen: ' + error.message);
    } finally {
      setDeletingId(null);
      setConfirmModal({ isOpen: false, type: null, id: null });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        loadData(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  // Filter für Suche
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) ||
           note.content.toLowerCase().includes(query);
  });
  
  const filteredLinks = links.filter(link => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return link.title.toLowerCase().includes(query) ||
           link.url.toLowerCase().includes(query) ||
           (link.description && link.description.toLowerCase().includes(query));
  });
  
  const publicNotes = notes.filter(n => n.isPublic).length;
  const privateNotes = notes.filter(n => !n.isPublic).length;
  const publicLinks = links.filter(l => l.isPublic).length;
  const privateLinks = links.filter(l => !l.isPublic).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-stone-400">Verwalte deine Notizen und Links</p>
          </div>
          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            Neu erstellen
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Notizen oder Links..."
              className="w-full pl-12 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-stone-400">
              {filteredNotes.length + filteredLinks.length} Ergebnisse gefunden
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-stone-900 rounded-xl border border-stone-800">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-rose-500" />
              <span className="text-stone-400 text-sm">Notizen</span>
            </div>
            <div className="text-2xl font-bold">{notes.length}</div>
          </div>
          <div className="p-6 bg-stone-900 rounded-xl border border-stone-800">
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="h-5 w-5 text-emerald-500" />
              <span className="text-stone-400 text-sm">Links</span>
            </div>
            <div className="text-2xl font-bold">{links.length}</div>
          </div>
          <div className="p-6 bg-stone-900 rounded-xl border border-stone-800">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="h-5 w-5 text-amber-500" />
              <span className="text-stone-400 text-sm">Privat</span>
            </div>
            <div className="text-2xl font-bold">{privateNotes + privateLinks}</div>
          </div>
          <div className="p-6 bg-stone-900 rounded-xl border border-stone-800">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <span className="text-stone-400 text-sm">Public</span>
            </div>
            <div className="text-2xl font-bold">{publicNotes + publicLinks}</div>
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-rose-500" />
              Notizen ({filteredNotes.length})
            </h2>
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-6 bg-stone-900 rounded-xl border border-stone-800 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{note.title}</h3>
                        {note.isPublic ? (
                          <div title="Öffentlich">
                            <Globe className="h-4 w-4 text-blue-500" />
                          </div>
                        ) : (
                          <div title="Privat">
                            <Lock className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-stone-400 text-sm line-clamp-2 mb-2">
                        {note.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>
                          {note.createdAt?.toDate
                            ? note.createdAt.toDate().toLocaleDateString("de-DE")
                            : "Unbekannt"}
                        </span>
                        {note.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            {note.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-stone-800 rounded">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {note.isPublic && (note.slug || note.id) && (
                        <a
                          href={`/note?slug=${note.slug || note.id}`}
                          target="_blank"
                          className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                          title="Öffentliche Seite öffnen"
                        >
                          <ExternalLink className="h-4 w-4 text-stone-400" />
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/edit?type=note&id=${note.id}`)}
                        className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4 text-stone-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deletingId === note.id}
                        className="p-2 hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links List */}
        {filteredLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-emerald-500" />
              Links ({filteredLinks.length})
            </h2>
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-6 bg-stone-900 rounded-xl border border-stone-800 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{link.title}</h3>
                        {link.isPublic ? (
                          <div title="Öffentlich">
                            <Globe className="h-4 w-4 text-blue-500" />
                          </div>
                        ) : (
                          <div title="Privat">
                            <Lock className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-500 hover:text-emerald-400 text-sm mb-2 block"
                      >
                        {link.url}
                      </a>
                      {link.description && (
                        <p className="text-stone-400 text-sm mb-2">{link.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>
                          {link.createdAt?.toDate
                            ? link.createdAt.toDate().toLocaleDateString("de-DE")
                            : "Unbekannt"}
                        </span>
                        {link.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            {link.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-stone-800 rounded">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {link.isPublic && link.slug && (
                        <a
                          href={`/public/link/${link.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                          title="Öffentliche Seite öffnen"
                        >
                          <ExternalLink className="h-4 w-4 text-stone-400" />
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/edit?type=link&id=${link.id}`)}
                        className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4 text-stone-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deletingId === link.id}
                        className="p-2 hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && filteredLinks.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-stone-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? "Keine Ergebnisse" : "Noch keine Inhalte"}
            </h3>
            <p className="text-stone-400 mb-6">
              {searchQuery
                ? "Versuche einen anderen Suchbegriff"
                : "Erstelle deine erste Notiz oder füge einen Link hinzu"}
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                <Plus className="h-5 w-5" />
                Erste Notiz erstellen
              </Link>
            )}
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.type === 'note' ? 'Notiz löschen?' : 'Link löschen?'}
          message={
            confirmModal.type === 'note'
              ? 'Diese Notiz wird unwiderruflich gelöscht. Möchtest du fortfahren?'
              : 'Dieser Link wird unwiderruflich gelöscht. Möchtest du fortfahren?'
          }
          confirmText="Löschen"
          cancelText="Abbrechen"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
}
