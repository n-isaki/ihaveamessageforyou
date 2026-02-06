import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getGiftById, updateGift, markSetupAsStarted } from "../services/gifts";
import WizardMessageEditor from "../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor";
import {
  Loader,
  Lock,
  CheckCircle,
  Save,
  Info,
  ShieldAlert,
  X,
  Eye,
  Edit2,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  Gift,
} from "lucide-react";
import { uploadAlbumImage } from "../services/albumUpload";
import { ALBUM_MAX_FILES } from "../utils/security";
import MugViewer from "../modules/anima/experiences/multimedia-gift/pages/Viewer";
import { v4 as uuidv4 } from "uuid";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { getExperience } from "../modules/registry";
import { sanitizeInput, isValidMessage } from "../utils/security";

export default function CustomerSetup() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [albumImages, setAlbumImages] = useState([]);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Memoria Specific State (Text Only)
  const [memoriaData, setMemoriaData] = useState({
    deceasedName: "",
    lifeDates: "",
    meaningText: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getGiftById(id);
        if (data) {
          // Check if this product type requires setup
          const exp = getExperience(data);
          if (!exp.isSetupRequired) {
            // Noor/Bracelet products don't need setup - redirect to viewer
            navigate(`/v/${id}`, { replace: true });
            return;
          }

          if (data.securityToken && data.securityToken !== token) {
            setAccessDenied(true);
            setLoading(false);
            return;
          }

          setGift(data);
          setMessages(data.messages || []);
          setLocked(!!data.locked);
          setHeadline(data.headline || "");
          setSubheadline(data.subheadline || "");
          setAlbumImages(data.albumImages || []);

          // Memoria Init
          if (data.project === "memoria") {
            setMemoriaData({
              deceasedName: data.deceasedName || "",
              lifeDates: data.lifeDates || "",
              meaningText: data.meaningText || "",
            });
          }

          if (!data.setupStarted && !data.locked) {
            markSetupAsStarted(id);
          }
        }
      } catch (err) {
        console.error("Failed to load gift", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, token, navigate]);

  const handleAddMessage = (type) => {
    if (locked) return;
    setMessages([
      ...messages,
      {
        id: uuidv4(),
        type,
        content: "",
        author: gift.senderName || "",
      },
    ]);
  };

  const handleRemoveMessage = (msgId) => {
    if (locked) return;
    setMessages(messages.filter((m) => m.id !== msgId));
  };

  const handleUpdateMessage = (msgId, field, value) => {
    if (locked) return;
    setMessages(
      messages.map((m) => (m.id === msgId ? { ...m, [field]: value } : m))
    );
  };

  const handleAlbumUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || locked) return;
    setUploadingAlbum(true);
    try {
      const { url } = await uploadAlbumImage(id, file, albumImages);
      setAlbumImages((prev) => [...prev, url]);
    } catch (err) {
      console.error("Album upload failed", err);
      alert(err.message || "Upload fehlgeschlagen.");
    } finally {
      setUploadingAlbum(false);
      e.target.value = "";
    }
  };

  const removeAlbumImage = (index) => {
    if (locked) return;
    setAlbumImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndLockClick = () => {
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setShowConfirmModal(false);
    try {
      const updates = {
        locked: true,
        setupCompletedAt: new Date(),
      };

      if (gift.project === "memoria") {
        updates.deceasedName = sanitizeInput(
          memoriaData.deceasedName || "",
          200
        );
        updates.lifeDates = sanitizeInput(memoriaData.lifeDates || "", 100);
        updates.meaningText = sanitizeInput(
          memoriaData.meaningText || "",
          5000
        );
      } else {
        const validMessages = messages
          .filter((m) => isValidMessage(m))
          .map((m) => ({
            ...m,
            content: sanitizeInput(m.content || "", 2000),
            author: sanitizeInput(m.author || "", 100),
          }));
        updates.messages = validMessages;
        updates.headline = sanitizeInput(headline, 200);
        updates.subheadline = sanitizeInput(subheadline, 200);
        updates.albumImages = Array.isArray(albumImages) ? albumImages : [];
      }

      // Include securityToken in update to validate ownership in Firestore rules
      await updateGift(id, {
        ...updates,
        securityToken: gift.securityToken, // Include token for Firestore rule validation
      });
      setLocked(true);
      setGift((prev) => ({ ...prev, locked: true, ...updates }));
    } catch (err) {
      console.error("Failed to save", err);
      alert("Fehler beim Speichern. Bitte überprüfe deine Internetverbindung.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <Loader className="animate-spin text-stone-500" />
      </div>
    );

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-stone-900 rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-red-900/50">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-serif font-bold text-stone-100">
            Dieser Link funktioniert nicht
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Der Link ist ungültig oder wurde nicht vollständig kopiert. Bitte
            öffne den Link genau so, wie er dir zugeschickt wurde (z.B. aus der
            E-Mail oder Nachricht). Bei Fragen wende dich an den Absender oder
            an uns.
          </p>
        </div>
      </div>
    );
  }

  if (!gift)
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">
        Geschenk nicht gefunden.
      </div>
    );

  if (locked) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-stone-900/50 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-stone-800">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              Vielen Dank!
            </h1>
            <p className="text-stone-400 leading-relaxed">
              Wir beginnen nun mit der Veredelung deines Geschenks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MEMORIA SETUP (No Image Upload)
  if (gift.project === "memoria") {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 pb-36 font-setup">
        <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
          <div className="px-4 py-4 sm:px-6 sm:py-5 flex justify-center">
            <span className="font-setup-heading text-2xl sm:text-3xl text-white">
              Memoria
            </span>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-8 sm:p-8 space-y-8">
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white mb-2">
              Willkommen
            </h2>
            <p className="text-stone-400 text-base leading-relaxed">
              Fülle die Angaben aus. Nach dem Absenden wird die Karte für uns
              freigegeben. Der Link ist nur für dich gültig.
            </p>
          </div>
          <div className="bg-stone-900/40 border border-stone-800/80 p-5 sm:p-6 rounded-2xl space-y-5 sm:space-y-6">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white">
              Erinnerung teilen
            </h2>

            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" /> Name des Verstorbenen
              </label>
              <input
                type="text"
                value={memoriaData.deceasedName}
                onChange={(e) =>
                  setMemoriaData({
                    ...memoriaData,
                    deceasedName: e.target.value,
                  })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-stone-600 outline-none min-h-[52px] leading-relaxed"
                placeholder="Vorname Nachname"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> Lebensdaten
              </label>
              <input
                type="text"
                value={memoriaData.lifeDates}
                onChange={(e) =>
                  setMemoriaData({ ...memoriaData, lifeDates: e.target.value })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-stone-600 outline-none min-h-[52px] leading-relaxed"
                placeholder="geb. 01.01.1950 - gest. 10.12.2024"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" /> Deine Geschichte (für
                Audio & Text)
              </label>
              <textarea
                rows={5}
                value={memoriaData.meaningText}
                onChange={(e) =>
                  setMemoriaData({
                    ...memoriaData,
                    meaningText: e.target.value,
                  })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-stone-600 outline-none min-h-[140px] leading-relaxed"
                placeholder="Erzähle uns etwas über die Person..."
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-stone-950/95 backdrop-blur-xl border-t border-stone-800 flex justify-center z-30">
          <button
            type="button"
            onClick={handleSaveAndLockClick}
            disabled={saving}
            className="w-full max-w-md min-h-[52px] sm:min-h-[56px] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base sm:text-lg bg-stone-100 text-stone-900 hover:bg-white transition-colors touch-manipulation active:scale-[0.98]"
          >
            {saving ? (
              <Loader className="animate-spin" />
            ) : (
              <span>Absenden & Versiegeln</span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-stone-800 relative overflow-hidden"
              >
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-4 right-4 text-stone-600 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="text-center space-y-6">
                  <Lock className="h-10 w-10 text-stone-100 mx-auto" />
                  <div>
                    <h3 className="font-setup-heading text-2xl text-white mb-2">
                      Versiegeln?
                    </h3>
                    <p className="text-stone-400 text-base leading-relaxed">
                      Änderungen sind danach nicht mehr möglich.
                    </p>
                  </div>
                  <button
                    onClick={confirmSave}
                    className="w-full py-3.5 bg-stone-100 text-stone-900 font-bold rounded-xl hover:bg-white"
                  >
                    Ja, Versiegeln
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // MUG SETUP VIEW
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-36 font-setup selection:bg-rose-500/30">
      {/* Header – minimal */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/80">
        <div className="px-4 py-4 sm:px-6 sm:py-5 flex justify-center">
          <span className="font-setup-heading text-2xl sm:text-3xl text-white">
            Kamlimos
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:p-8 space-y-10 sm:space-y-12">
        {/* Willkommen */}
        <div className="bg-stone-900/50 border border-stone-800/80 rounded-2xl p-5 sm:p-6">
          <h2 className="font-setup-heading text-lg sm:text-xl text-white mb-2">
            Willkommen
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            Du hast einen persönlichen Link erhalten. Fülle die Bereiche unten
            aus – der Link ist nur für dich gültig.
          </p>
          <details className="group mt-4 pt-4 border-t border-stone-800/60">
            <summary className="text-sm font-medium text-stone-500 cursor-pointer list-none flex items-center gap-1.5">
              So geht’s
              <span className="group-open:rotate-180 transition-transform text-xs">
                ▼
              </span>
            </summary>
            <ol className="text-stone-500 text-base space-y-1.5 list-decimal list-inside mt-3 leading-relaxed">
              <li>Start: Titel & Untertitel</li>
              <li>Album: optional bis zu {ALBUM_MAX_FILES} Fotos</li>
              <li>Inhalte: Nachricht oder Video</li>
              <li>Zum Schluss: Versiegeln klicken</li>
            </ol>
          </details>
        </div>

        {/* Start-Bildschirm */}
        <section className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 relative z-10">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white leading-tight">
              Start-Bildschirm
            </h2>

          </div>
          <div className="space-y-5 relative z-10">
            <div>
              <label className="text-sm font-semibold text-stone-500 mb-2 block">
                Titel
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Von Herzen für dich"
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-lg text-white placeholder-stone-600 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 outline-none transition-all min-h-[52px] leading-relaxed"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-500 mb-2 block">
                Untertitel / Absender
              </label>
              <input
                type="text"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Deine Botschaft"
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-base text-stone-300 placeholder-stone-600 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all min-h-[52px] leading-relaxed"
              />
            </div>

            {gift.personalizationText && (
              <div className="mt-4 p-4 bg-stone-950/50 rounded-xl text-base border border-stone-800 flex items-start gap-3 leading-relaxed">
                <Info className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-semibold text-stone-500 text-sm mb-1">
                    Deine Etsy Gravur
                  </span>
                  <span className="text-stone-200 font-medium text-base italic">
                    "{gift.personalizationText}"
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Album */}
        <section className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white mb-1">
              Album
            </h2>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Optional, bis zu {ALBUM_MAX_FILES} Fotos. JPG, PNG oder WebP, max.
              5 MB.
            </p>
            <div className="flex flex-wrap gap-3 items-start">
              {albumImages.map((url, index) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-20 h-20 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-700"
                  />
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => removeAlbumImage(index)}
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow touch-manipulation"
                      aria-label="Bild entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {albumImages.length < ALBUM_MAX_FILES && !locked && (
                <label className="w-20 h-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-700 text-stone-500 hover:border-rose-500/50 hover:bg-stone-800/50 cursor-pointer transition-colors touch-manipulation active:scale-95">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAlbumUpload}
                    disabled={uploadingAlbum}
                  />
                  {uploadingAlbum ? (
                    <Loader className="h-6 w-6 animate-spin text-rose-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 mb-0.5" />
                  )}
                  <span className="text-xs">+</span>
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Deine Inhalte */}
        <section className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white mb-6 leading-tight">
              Deine Inhalte
            </h2>

            <WizardMessageEditor
              messages={messages}
              onAdd={handleAddMessage}
              onRemove={handleRemoveMessage}
              onUpdate={handleUpdateMessage}
              widgetMode={false}
              darkMode={true}
            />
          </div>
        </section>

        <p className="text-center text-sm text-stone-500 pb-24 sm:pb-20 px-4 leading-relaxed">
          <Lock className="inline h-4 w-4 mr-1.5 mb-0.5 opacity-70" />
          Nach dem Versiegeln kann das Geschenk nicht mehr bearbeitet werden.
        </p>
      </div>

      {/* Bottom Action Bar – mobile-optimiert, safe-area */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-stone-950/95 backdrop-blur-xl border-t border-stone-800 flex justify-center z-30">
        <button
          type="button"
          onClick={handleSaveAndLockClick}
          disabled={
            saving || (messages.length === 0 && albumImages.length === 0)
          }
          className={`
            w-full max-w-md flex items-center justify-center gap-3 min-h-[52px] sm:min-h-[56px] px-6 py-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl transition-all touch-manipulation active:scale-[0.98]
            ${messages.length === 0 && albumImages.length === 0
              ? "bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800"
              : "bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white shadow-rose-900/20 border border-rose-500/20"
            }
          `}
        >
          {saving ? (
            <Loader className="h-6 w-6 animate-spin text-white/50" />
          ) : (
            <>
              <span>Geschenk versiegeln</span>
              <Save className="h-5 w-5 opacity-80 shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* Elegant Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-stone-800 relative overflow-hidden"
            >
              {/* Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-600/10 blur-[50px] pointer-events-none"></div>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-stone-600 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="relative text-center space-y-6">
                <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/10">
                  <Lock className="h-7 w-7 text-rose-500" />
                </div>

                <div>
                  <h3 className="font-setup-heading text-2xl text-white mb-2">
                    Bist du fertig?
                  </h3>
                  <p className="text-stone-400 text-base leading-relaxed">
                    Wenn du jetzt speicherst, wird dein Geschenk{" "}
                    <strong>versiegelt</strong>. Änderungen sind danach nicht
                    mehr möglich.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={confirmSave}
                    className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                  >
                    Ja, jetzt versiegeln
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full py-3.5 bg-transparent border border-stone-800 text-stone-400 font-medium rounded-xl hover:bg-stone-800 hover:text-white transition-colors"
                  >
                    Noch bearbeiten
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] bg-black">
            <button
              onClick={() => setShowPreview(false)}
              className="fixed top-6 right-6 z-[110] bg-stone-900/80 backdrop-blur text-white p-3 rounded-full hover:bg-rose-600 transition-colors border border-stone-700 hover:scale-110 shadow-xl"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="h-full w-full overflow-y-auto">
              <MugViewer
                initialData={{
                  ...gift,
                  headline,
                  subheadline,
                  messages,
                  albumImages,
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
