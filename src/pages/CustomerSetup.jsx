import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  getGiftById,
  updateGift,
  markSetupAsStarted,
  getContributions,
} from "../services/gifts";
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
  Share2,
  Copy,
  Trash2,
} from "lucide-react";
import {
  uploadAlbumImage,
  uploadMemoriaDesignImage,
  deleteAlbumImageByUrl,
} from "../services/albumUpload";
import { ALBUM_MAX_FILES, isValidPin } from "../utils/security";
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
  const [memoriaDesignImage, setMemoriaDesignImage] = useState("");
  const [uploadingMemoriaDesign, setUploadingMemoriaDesign] = useState(false);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [albumImages, setAlbumImages] = useState([]);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Social Gifting
  const [contributions, setContributions] = useState([]);
  const [contributionLink, setContributionLink] = useState("");

  const [accessChoice, setAccessChoice] = useState("public"); // "public" | "pin" – Default ohne PIN
  const [customerPin, setCustomerPin] = useState("");
  const [engravingText, setEngravingText] = useState("");

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
          setEngravingText(data.engravingText || "");
          setAccessChoice(data.isPublic === false ? "pin" : "public"); // Default öffentlich (ohne PIN)
          setCustomerPin(
            typeof data.accessCode === "string" ? data.accessCode : ""
          );

          // Memoria Init
          if (data.project === "memoria") {
            setMemoriaData({
              deceasedName: data.deceasedName || "",
              lifeDates: data.lifeDates || "",
              meaningText: data.meaningText || "",
            });
            if (data.designImage) {
              setMemoriaDesignImage(data.designImage);
            }
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

  // Fetch Contributions separately (nur wenn Geschenk als "teilbar" freigegeben)
  useEffect(() => {
    if (gift && gift.contributionToken && gift.allowContributions === true) {
      const origin = window.location.origin;
      setContributionLink(`${origin}/join/${gift.contributionToken}`);

      const fetchContribs = async () => {
        const data = await getContributions(id);
        setContributions(data);
      };
      fetchContribs();
      // TODO: Add real-time listener later
    } else {
      setContributionLink("");
      setContributions([]);
    }
  }, [gift, id]);

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

  // --- MEMORIA IMAGE LOGIC ---

  const handleMemoriaImageUpload = async (e) => {
    if (locked || !gift?.id) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMemoriaDesign(true);
    try {
      // Hilfsfunktion: lädt hoch und löscht ggf. ALTES Bild (replacement logic)
      const { url } = await uploadMemoriaDesignImage(
        gift.id,
        file,
        memoriaDesignImage
      );
      setMemoriaDesignImage(url);
    } catch (err) {
      console.error("Upload failed", err);
      alert(err.message || "Fehler beim Upload.");
    } finally {
      setUploadingMemoriaDesign(false);
      // Reset input value to allow re-uploading same file if needed
      e.target.value = "";
    }
  };

  const handleRemoveMemoriaImage = async () => {
    if (locked || !memoriaDesignImage) return;
    if (
      !confirm(
        "Möchtest du das Bild wirklich löschen? Es wird sofort entfernt."
      )
    )
      return;

    const urlToDelete = memoriaDesignImage;

    // 1. Optimistic UI update
    setMemoriaDesignImage("");

    try {
      // 2. Delete from Storage
      await deleteAlbumImageByUrl(urlToDelete);

      // 3. Persist deletion in Firestore immediately (Requirement: "jederzeit löschen ohne Auftrag zu löschen")
      await updateGift(id, {
        designImage: "",
        securityToken: gift.securityToken,
      });
    } catch (err) {
      console.error("Delete failed", err);
      alert("Fehler beim Löschen. Bitte überprüfe deine Verbindung.");
      // Rollback UI if strictly necessary, but empty state is safer here
    }
  };

  const handleSaveMemoriaDraft = async () => {
    if (locked || !gift?.securityToken) return;
    setSaving(true);
    try {
      // Memoria ist immer öffentlich (kein PIN)
      const draftUpdates = {
        deceasedName: sanitizeInput(memoriaData.deceasedName || "", 200),
        lifeDates: sanitizeInput(memoriaData.lifeDates || "", 100),
        meaningText: sanitizeInput(memoriaData.meaningText || "", 5000),
        designImage: memoriaDesignImage,
        isPublic: true,
        accessCode: "",
        accessCodeHash: null,
        securityToken: gift.securityToken,
      };

      await updateGift(id, draftUpdates);
      setGift((prev) => ({
        ...prev,
        ...draftUpdates,
      }));
      alert("Entwurf gespeichert!");
    } catch (err) {
      console.error("Draft save failed", err);
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------

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
        updates.designImage = memoriaDesignImage;
        // Memoria ist immer öffentlich (kein PIN)
        updates.isPublic = true;
        updates.accessCode = "";
        updates.accessCodeHash = null;
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
        if (gift.allowCustomerEngraving) {
          updates.engravingText = sanitizeInput(engravingText, 30);
        }
        const isPublicChoice = accessChoice === "public";
        updates.isPublic = isPublicChoice;
        if (isPublicChoice) {
          updates.accessCode = "";
          updates.accessCodeHash = null; // Daten-Hygiene: kein Zombie-PIN bei öffentlichen Geschenken
        } else {
          const pin = customerPin.trim();
          if (!pin || !isValidPin(pin)) {
            alert(
              "Bitte gib einen gültigen PIN ein (4–8 Zeichen, Buchstaben oder Zahlen)."
            );
            setSaving(false);
            return;
          }
          updates.accessCode = pin;
        }
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

  /** Speichern ohne Versiegeln – nur bei explizitem Klick, verhindert Datenverlust. */
  const handleSaveDraft = async () => {
    if (locked || !gift?.securityToken) return;
    setSaving(true);
    try {
      const validMessages = messages
        .filter((m) => isValidMessage(m))
        .map((m) => ({
          ...m,
          content: sanitizeInput(m.content || "", 2000),
          author: sanitizeInput(m.author || "", 100),
        }));
      const isPublicChoice = accessChoice === "public";
      const draftUpdates = {
        messages: validMessages,
        headline: sanitizeInput(headline, 200),
        subheadline: sanitizeInput(subheadline, 200),
        albumImages: Array.isArray(albumImages) ? albumImages : [],
        engravingText: gift.allowCustomerEngraving // Only save if allowed
          ? sanitizeInput(engravingText, 30)
          : gift.engravingText || "", // Keep existing if hidden
        isPublic: isPublicChoice,
        accessCode: isPublicChoice
          ? ""
          : customerPin.trim() || gift.accessCode || "",
        ...(isPublicChoice && { accessCodeHash: null }), // Daten-Hygiene: kein Zombie-PIN
        securityToken: gift.securityToken,
      };
      if (
        !isPublicChoice &&
        draftUpdates.accessCode &&
        !isValidPin(draftUpdates.accessCode)
      ) {
        alert(
          "Bitte gib einen gültigen PIN ein (4–8 Zeichen, Buchstaben oder Zahlen)."
        );
        setSaving(false);
        return;
      }
      await updateGift(id, draftUpdates);
      setGift((prev) => ({
        ...prev,
        messages: validMessages,
        headline: sanitizeInput(headline, 200),
        subheadline: sanitizeInput(subheadline, 200),
        albumImages: Array.isArray(albumImages) ? albumImages : [],
        engravingText: draftUpdates.engravingText,
        isPublic: isPublicChoice,
        accessCode: draftUpdates.accessCode || "",
      }));
    } catch (err) {
      console.error("Draft save failed", err);
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
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

            {/* --- MEMORIA IMAGE UPLOAD SECTION --- */}
            <div className="pt-6 border-t border-stone-800/60">
              <label className="block text-sm font-semibold text-stone-500 mb-2 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" /> Bild für die Gravur
              </label>

              {/* Quality Hint */}
              <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl mb-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200/80 leading-relaxed">
                  Für die Gravur brauchen wir ein Bild in guter Qualität:{" "}
                  <strong>scharf, gut beleuchtet, am besten im Hochformat</strong>.
                  <br />
                  Max. 5 MB, JPG/PNG oder WebP.
                </p>
              </div>

              {memoriaDesignImage ? (
                <div className="relative w-full max-w-xs mx-auto aspect-[3/4] bg-stone-950 rounded-xl overflow-hidden border border-stone-700 shadow-xl group">
                  <img
                    src={memoriaDesignImage}
                    alt="Gravur Vorlage"
                    className="w-full h-full object-cover"
                  />
                  {!locked && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {/* Replace Button (Input overlay) */}
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-colors text-white border border-white/20">
                        <Edit2 className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleMemoriaImageUpload}
                          disabled={uploadingMemoriaDesign}
                        />
                      </label>
                      {/* Delete Button */}
                      <button
                        onClick={handleRemoveMemoriaImage}
                        className="bg-red-500/80 hover:bg-red-600 p-3 rounded-full backdrop-blur-md transition-colors text-white shadow-lg"
                        title="Bild löschen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  {uploadingMemoriaDesign && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="block w-full border-2 border-dashed border-stone-800 hover:border-stone-600 hover:bg-stone-900/30 transition-all rounded-xl p-8 text-center cursor-pointer group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleMemoriaImageUpload}
                    disabled={uploadingMemoriaDesign}
                  />
                  {uploadingMemoriaDesign ? (
                    <Loader className="h-8 w-8 text-stone-500 animate-spin mx-auto mb-3" />
                  ) : (
                    <div className="h-12 w-12 bg-stone-800 group-hover:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors text-stone-400 group-hover:text-stone-200">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <span className="text-stone-300 font-medium block">
                    Bild hochladen
                  </span>
                  <span className="text-stone-600 text-sm mt-1 block">
                    Klicken zum Auswählen
                  </span>
                </label>
              )}
            </div>
            {/* ------------------------------------ */}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
          {/* Draft Save Button for Memoria */}
          <button
            type="button"
            onClick={handleSaveMemoriaDraft}
            disabled={saving}
            className="flex-1 sm:flex-initial min-h-[52px] min-w-[140px] flex items-center justify-center font-bold text-base rounded-2xl bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-colors"
          >
            {saving ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              <span>Speichern</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveAndLockClick}
            disabled={saving}
            className="flex-[2] sm:flex-initial min-h-[52px] min-w-[180px] flex items-center justify-center gap-2 px-6 rounded-2xl font-bold text-base bg-stone-100 text-stone-900 hover:bg-white transition-colors"
          >
            {saving ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4" /> <span>Versiegeln</span>
              </>
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
                      Änderungen sind danach nicht mehr möglich. Memoria ist
                      immer öffentlich zugänglich.
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

        {/* Gravurwunsch – eigene Sektion am Anfang, nur wenn Admin es erlaubt hat */}
        {gift && gift.allowCustomerEngraving && (
          <section className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
            <h2 className="font-setup-heading text-xl sm:text-2xl text-white leading-tight mb-4">
              Dein Gravurwunsch
            </h2>
            <p className="text-stone-500 text-sm mb-4">
              Dieser Text erscheint z.B. auf dem Tassenboden. Der Admin sieht deinen Eintrag und kann ihn bei Bedarf anpassen.
            </p>
            <label className="text-sm font-semibold text-stone-500 mb-2 block flex justify-between items-center">
              <span>Gravurtext</span>
              <span className="text-xs font-normal text-stone-600">{engravingText.length}/30</span>
            </label>
            <textarea
              value={engravingText}
              onChange={(e) => setEngravingText(e.target.value.slice(0, 30))}
              maxLength={30}
              placeholder="z.B. Für die beste Oma"
              rows={3}
              className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-base text-stone-300 placeholder-stone-600 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all leading-relaxed resize-y min-h-[80px]"
            />
          </section>
        )}

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
                placeholder="Eine persönliche Nachricht..."
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-base text-stone-300 placeholder-stone-600 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all min-h-[52px] leading-relaxed"
              />
            </div>

            {/* Social Gifting Invite Section – nur sichtbar wenn allowContributions === true (Admin oder Käufer-Opt-in) */}
            {/* Social Gifting Invite Section */}
            {gift.contributionToken && gift.allowContributions && (
              <div className="bg-stone-900/30 border border-stone-800 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="text-rose-400 h-5 w-5" />
                  <h3 className="text-stone-200 font-semibold">
                    Freunde einladen
                  </h3>
                </div>
                <p className="text-stone-400 text-sm mb-3">
                  Teile diesen Link, damit Freunde und Familie persönliche
                  Nachrichten für den Empfänger hinterlassen können. Diese
                  erscheinen dann direkt im digitalen Geschenk (z.B. beim
                  Scannen des QR-Codes).
                </p>
                <div className="flex gap-2">
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex-1 text-stone-300 text-sm truncate font-mono">
                    {contributionLink}
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard
                        .writeText(contributionLink)
                        .then(() => alert("Link kopiert!"))
                    }
                    className="bg-stone-800 hover:bg-stone-700 text-white p-3 rounded-xl transition-colors"
                    title="Link kopieren"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>

                {/* Display Contributions if any */}
                {contributions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-800/50">
                    <h4 className="text-stone-400 text-xs uppercase font-bold tracking-wider mb-2">
                      Eingegangene Nachrichten ({contributions.length})
                    </h4>
                    <div className="space-y-2">
                      {contributions.map((c) => (
                        <div
                          key={c.id}
                          className="bg-stone-950/50 p-3 rounded-xl border border-stone-800/50 text-sm"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-stone-300">
                              {c.author}
                            </span>
                            <span className="text-xs text-stone-600">Gast</span>
                          </div>
                          <p className="text-stone-400">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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

        <p className="text-center text-sm text-stone-500 pb-24 sm:pb-20 px-4 leading-relaxed bg-stone-900/40 p-4 rounded-xl border border-stone-800/50 mt-8 mx-auto max-w-lg">
          <Info className="inline h-4 w-4 mr-1.5 mb-0.5 opacity-70 text-rose-400" />
          <strong>Wichtig:</strong> Nutze{" "}
          <span className="text-white">"Speichern"</span>, um deinen Entwurf zu
          sichern.
          <br />
          Erst wenn du fertig bist, klicke auf{" "}
          <span className="text-white">"Geschenk versiegeln"</span>. Danach sind
          keine Änderungen mehr möglich.
        </p>
      </div>

      {/* Bottom Action Bar – mobile-optimiert, safe-area */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-stone-950/95 backdrop-blur-xl border-t border-stone-800 flex justify-center gap-3 z-30">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="w-full max-w-[140px] flex items-center justify-center px-4 py-4 rounded-2xl font-bold text-base bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition"
        >
          {saving ? <Loader className="h-5 w-5 animate-spin" /> : "Speichern"}
        </button>
        <button
          type="button"
          onClick={handleSaveAndLockClick}
          disabled={
            saving || (messages.length === 0 && albumImages.length === 0)
          }
          className={`
            w-full max-w-sm flex items-center justify-center gap-3 min-h-[52px] sm:min-h-[56px] px-6 py-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl transition-all touch-manipulation active:scale-[0.98]
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

                  {/* Zugriff: Default „Öffentlich“ – ohne PIN; mit Erklärung zu Link & Indexierung */}
                  <div className="text-left bg-stone-800/50 p-4 rounded-xl border border-stone-700 mt-4 space-y-3">
                    <span className="text-white font-medium block text-sm">
                      Zugriff
                    </span>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Auch bei „Öffentlich“: Ohne den Link ist das Geschenk nicht auffindbar – wir verwenden zufällige Link-IDs. Die Geschenk-Seiten sind für Suchmaschinen (z.B. Google) nicht indexiert, auch bei öffentlicher Freigabe.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => setAccessChoice("public")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${accessChoice === "public"
                          ? "bg-rose-600 text-white"
                          : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                          }`}
                      >
                        Öffentlich stellen
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccessChoice("pin")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${accessChoice === "pin"
                          ? "bg-rose-600 text-white"
                          : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                          }`}
                      >
                        Mit PIN
                      </button>
                    </div>
                    {accessChoice === "pin" && (
                      <div>
                        <label className="text-xs text-stone-500 block mb-1">
                          PIN (4–8 Zeichen, z.B. für Empfänger)
                        </label>
                        <input
                          type="text"
                          value={customerPin}
                          onChange={(e) =>
                            setCustomerPin(
                              e.target.value
                                .replace(/[^A-Za-z0-9]/g, "")
                                .slice(0, 8)
                            )
                          }
                          placeholder="PIN eingeben"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-white placeholder-stone-600 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 outline-none"
                          maxLength={8}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={confirmSave}
                    className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                  >
                    Ja, jetzt endgültig versiegeln
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full py-3.5 bg-transparent border border-stone-800 text-stone-400 font-medium rounded-xl hover:bg-stone-800 hover:text-white transition-colors"
                  >
                    Nein, noch bearbeiten
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
