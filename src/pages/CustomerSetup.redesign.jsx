import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getGiftById, getGiftBySetupToken, updateGift, getContributions } from "../services/gifts";
import WizardMessageEditor from "../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor";
import {
  Loader,
  Lock,
  CheckCircle,
  ShieldAlert,
  Eye,
  Edit2,
  User,
  FileText,
  Image as ImageIcon,
  Gift,
  Share2,
  Copy,
  Trash2,
  Upload,
  MessageSquare,
  Users,
  Lightbulb,
  Save,
  ArrowRight,
} from "lucide-react";
import {
  uploadAlbumImage,
  uploadMemoriaDesignImage,
  deleteAlbumImageByUrl,
} from "../services/albumUpload";
import { ALBUM_MAX_FILES } from "../utils/security";
import MugViewer from "../modules/anima/experiences/multimedia-gift/pages/Viewer";
import { v4 as uuidv4 } from "uuid";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { sanitizeInput, isValidMessage } from "../utils/security";

export default function CustomerSetup() {
  const { id, token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const _navigate = useNavigate();
  const token = tokenFromPath || searchParams.get("token");

  // Core state
  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [engravingText, setEngravingText] = useState("");
  const [accessChoice, setAccessChoice] = useState("public");
  const [customerPin, setCustomerPin] = useState("");

  // Messages state
  const [messages, setMessages] = useState([]);

  // Media state
  const [albumImages, setAlbumImages] = useState([]);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);

  // Memoria specific state
  const [memoriaData, setMemoriaData] = useState({
    deceasedName: "",
    lifeDates: "",
    meaningText: "",
  });
  const [uploadingMemoriaDesign, setUploadingMemoriaDesign] = useState(false);
  const [memoriaDesignImage, setMemoriaDesignImage] = useState("");

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [_showPreview, _setShowPreview] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [_contributionLink, setContributionLink] = useState("");

  // Calculate completion status
  const isBasicComplete = headline || subheadline || recipientName || senderName;
  const isMessagesComplete = messages.filter((msg) => isValidMessage(msg.content)).length > 0;
  const isMediaComplete = albumImages.length > 0 || memoriaDesignImage || memoriaData.deceasedName;

  useEffect(() => {
    const loadGift = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let data = null;
        if (token) {
          try {
            data = await getGiftBySetupToken(id, token);
          } catch (err) {
            console.warn("getGiftBySetupToken failed, falling back to getGiftById:", err?.message);
          }
        }
        if (!data) {
          data = await getGiftById(id);
        }
        if (!data) {
          setAccessDenied(true);
          return;
        }

        setGift(data);
        setMessages(data.messages || []);
        setLocked(!!data.locked);

        // Initialize form data
        setHeadline(data.headline || "");
        setSubheadline(data.subheadline || "");
        setRecipientName(data.recipientName || "");
        setSenderName(data.senderName || "");
        setEngravingText(data.engravingText || "");
        setAccessChoice(data.isPublic ? "public" : "pin");
        setCustomerPin(data.accessCode || "");

        if (data.project === "memoria") {
          setMemoriaData({
            deceasedName: data.deceasedName || "",
            lifeDates: data.lifeDates || "",
            meaningText: data.meaningText || "",
          });
          setMemoriaDesignImage(data.designImage || "");
        }

        setAlbumImages(data.albumImages || []);

        // Load contributions if enabled
        if (data.allowContributions) {
          const contribs = await getContributions(id);
          setContributions(contribs || []);
        }
      } catch (err) {
        console.error("Failed to load gift:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGift();
    }
  }, [id, token]);

  // Message handlers (type = "text" | "video" | "image" from WizardMessageEditor)
  const handleAddMessage = (type = "text") => {
    const newMessage = {
      id: uuidv4(),
      type: type || "text",
      content: "",
      author: "",
      title: "",
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleRemoveMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleUpdateMessage = (id, field, value) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, [field]: value } : msg)),
    );
  };

  // Album handlers
  const handleAlbumImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingAlbum(true);
      const current = albumImages || [];
      const { url } = await uploadAlbumImage(id, file, current);
      setAlbumImages((prev) => [...(prev || []), url]);
    } catch (err) {
      console.error("Album upload failed", err);
      setMessageModal({
        type: "error",
        text: err.message || "Upload fehlgeschlagen.",
      });
    } finally {
      setUploadingAlbum(false);
      e.target.value = "";
    }
  };

  const handleRemoveAlbumImage = async (index) => {
    try {
      const url = albumImages[index];
      await deleteAlbumImageByUrl(id, url);
      setAlbumImages((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to remove album image:", err);
      setMessageModal({
        type: "error",
        text: "Fehler beim Löschen des Bildes.",
      });
    }
  };

  // Memoria handlers
  const handleMemoriaImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingMemoriaDesign(true);
      const { url } = await uploadMemoriaDesignImage(
        gift.id,
        file,
        memoriaDesignImage,
      );
      setMemoriaDesignImage(url);
    } catch (err) {
      console.error("Upload failed", err);
      setMessageModal({
        type: "error",
        text: err.message || "Fehler beim Upload.",
      });
    } finally {
      setUploadingMemoriaDesign(false);
      e.target.value = "";
    }
  };

  const handleRemoveMemoriaImage = () => {
    setMemoriaDesignImage("");
  };

  // Save handlers
  const handleSaveDraft = async () => {
    if (!gift) return;

    try {
      setSaving(true);
      const validMessages = messages.filter((msg) => isValidMessage(msg.content));
      const updates = {
        headline: sanitizeInput(headline, 200),
        subheadline: sanitizeInput(subheadline, 200),
        recipientName: sanitizeInput(recipientName, 100),
        senderName: sanitizeInput(senderName, 100),
        isPublic: accessChoice === "public",
        accessCode: customerPin,
        messages: validMessages,
        albumImages: albumImages,
      };
      if (gift.allowCustomerEngraving) updates.engravingText = sanitizeInput(engravingText, 30);
      if (gift.securityToken) updates.securityToken = gift.securityToken;

      if (gift.project === "memoria") {
        updates.deceasedName = sanitizeInput(memoriaData.deceasedName, 200);
        updates.lifeDates = sanitizeInput(memoriaData.lifeDates, 100);
        updates.meaningText = sanitizeInput(memoriaData.meaningText, 5000);
        updates.designImage = memoriaDesignImage;
      }

      await updateGift(id, updates);
      setGift((prev) => ({ ...prev, ...updates }));

      setMessageModal({
        type: "success",
        text: "Entwurf erfolgreich gespeichert!",
      });
    } catch (err) {
      console.error("Draft save failed", err);
      setMessageModal({
        type: "error",
        text: err.message
          ? `Fehler beim Speichern: ${err.message}`
          : "Fehler beim Speichern. Bitte versuche es erneut.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndLock = async () => {
    if (accessChoice === "pin" && !customerPin) {
      setMessageModal({
        type: "error",
        text: "Bitte erst einen PIN-Code festlegen oder 'Öffentlich' wählen.",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveAndLock = async () => {
    if (!gift) return;

    try {
      setSaving(true);
      setShowConfirmModal(false);

      const validMessages = messages.filter((msg) => isValidMessage(msg.content));
      const updates = {
        headline: sanitizeInput(headline, 200),
        subheadline: sanitizeInput(subheadline, 200),
        recipientName: sanitizeInput(recipientName, 100),
        senderName: sanitizeInput(senderName, 100),
        isPublic: accessChoice === "public",
        accessCode: customerPin,
        messages: validMessages,
        albumImages: albumImages,
        locked: true,
      };
      if (gift.allowCustomerEngraving) updates.engravingText = sanitizeInput(engravingText, 30);
      if (gift.securityToken) updates.securityToken = gift.securityToken;

      if (gift.project === "memoria") {
        updates.deceasedName = sanitizeInput(
          memoriaData.deceasedName || "",
          200,
        );
        updates.lifeDates = sanitizeInput(memoriaData.lifeDates || "", 100);
        updates.meaningText = sanitizeInput(
          memoriaData.meaningText || "",
          5000,
        );
        updates.designImage = memoriaDesignImage;
        updates.isPublic = true;
        updates.accessCode = "";
      }

      await updateGift(id, updates);
      setLocked(true);
      setGift((prev) => ({ ...prev, ...updates }));

      console.log("Gift locked and saved:", {
        updates,
        finalGift: { ...gift, ...updates },
      });
    } catch (err) {
      console.error("Lock failed", err);
      setMessageModal({ type: "error", text: "Fehler beim Speichern." });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (gift?.allowContributions) {
      const link = `${window.location.origin}/join/${gift.contributionToken}`;
      setContributionLink(link);
      navigator.clipboard.writeText(link);
      setMessageModal({ type: "success", text: "Link kopiert!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader className="animate-spin text-brand-patina" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-brand p-8 text-center space-y-6 border border-red-200">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-display font-bold text-brand-anthracite">
            Dieser Link funktioniert nicht
          </h1>
          <p className="text-brand-text text-sm leading-relaxed">
            Der Link ist ungültig oder wurde nicht vollständig kopiert. Bitte
            öffne den Link genau so, wie er dir zugeschickt wurde.
          </p>
        </div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center text-brand-text">
        Geschenk nicht gefunden.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-brand p-8 text-center space-y-6 border border-brand-border">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-anthracite mb-2">
              Vielen Dank!
            </h1>
            <p className="text-brand-text leading-relaxed">
              Wir beginnen nun mit der Veredelung deines Geschenks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canSave = isBasicComplete || messages.length > 0 || albumImages.length > 0 || memoriaData.deceasedName;
  const canLock = canSave && messages.length > 0;

  return (
    <div className="min-h-screen bg-brand-cream text-brand-text pb-32 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-brand-cream/95 backdrop-blur-md border-b border-brand-border">
        <div className="px-4 py-4 text-center">
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-brand-anthracite">
            {gift.project === "memoria"
              ? "Memoria"
              : gift.project === "noor"
                ? "Noor"
                : gift.productType === "bracelet"
                  ? "Armband"
                  : "Geschenk"}{" "}
            Setup
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Basic Information Section */}
        <section className="bg-white rounded-2xl border border-brand-border shadow-brand p-6">
          <div className="flex items-center gap-3 mb-6">
            <Edit2 className="w-5 h-5 text-brand-patina" />
            <h2 className="text-xl font-semibold text-brand-anthracite">Grundinformationen</h2>
            {isBasicComplete && (
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">✅</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-anthracite mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Für die beste Mama"
                  className="input-base w-full rounded-xl px-4 py-3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-anthracite mb-2">
                  Empfänger
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Name des Empfängers"
                  className="input-base w-full rounded-xl px-4 py-3"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-anthracite mb-2">
                  Absender
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Dein Name"
                  className="input-base w-full rounded-xl px-4 py-3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-anthracite mb-2">
                  Untertitel
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Zu deinem Geburtstag"
                  className="input-base w-full rounded-xl px-4 py-3"
                />
              </div>
            </div>
          </div>

          {/* Access Options */}
          {gift.project !== "noor" && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-brand-anthracite mb-4">Zugangsoptionen</h3>
              <div className="bg-brand-cream-tint border border-brand-border rounded-xl p-4 mb-4">
                <p className="text-sm text-brand-text leading-relaxed">
                  Auch bei "Öffentlich": Nur wer den Link hat, kann das Geschenk
                  öffnen. Der Link enthält eine zufällig generierte ID – ohne den
                  Link ist das Geschenk nicht auffindbar. Die Geschenk-Seiten
                  werden von Suchmaschinen (z. B. Google) nicht indexiert.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-3 text-brand-anthracite mb-3">
                    <input
                      type="radio"
                      name="access"
                      value="public"
                      checked={accessChoice === "public"}
                      onChange={(e) => setAccessChoice(e.target.value)}
                      className="w-4 h-4 text-brand-patina focus:ring-brand-patina"
                    />
                    <span>Öffentlich (kein PIN)</span>
                  </label>
                  <p className="text-sm text-brand-text">
                    Jeder mit dem Link kann das Geschenk öffnen – ohne
                    PIN-Eingabe.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 text-brand-anthracite mb-3">
                    <input
                      type="radio"
                      name="access"
                      value="pin"
                      checked={accessChoice === "pin"}
                      onChange={(e) => setAccessChoice(e.target.value)}
                      className="w-4 h-4 text-brand-patina focus:ring-brand-patina"
                    />
                    <span>PIN-geschützt</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-brand-anthracite mb-2">
                      PIN-Code
                    </label>
                    <input
                      type="text"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                      placeholder="1234"
                      maxLength={4}
                      disabled={accessChoice !== "pin"}
                      className="input-base w-full rounded-xl px-4 py-3 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engraving Text – nur wenn Admin es erlaubt hat (Gravurtext vom Kunden erlauben) */}
          {gift.productType !== "noor" && gift.allowCustomerEngraving && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-brand-anthracite mb-2">
                Gravur Text
              </label>
              <input
                type="text"
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value)}
                placeholder="Für die beste Oma"
                maxLength={30}
                className="input-base w-full rounded-xl px-4 py-3"
              />
              <p className="text-xs text-brand-text mt-1">
                {engravingText.length}/30 Zeichen
              </p>
            </div>
          )}
        </section>

        {/* Media Section */}
        {gift.project !== "noor" && (
          <section className="bg-white rounded-2xl border border-brand-border shadow-brand p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-5 h-5 text-brand-patina" />
              <h2 className="text-xl font-semibold text-brand-anthracite">Medien</h2>
              {isMediaComplete && (
                <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">✅</span>
              )}
            </div>

            {gift.project === "memoria" ? (
              <div>
                <label className="block text-sm font-medium text-brand-anthracite mb-2">
                  Bild für die Gravur
                </label>
                {memoriaDesignImage ? (
                  <div className="relative group">
                    <div className="w-full max-w-xs mx-auto aspect-[3/4] bg-brand-cream-tint rounded-xl overflow-hidden border border-brand-border shadow-xl">
                      <img
                        src={memoriaDesignImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={handleRemoveMemoriaImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-border rounded-xl cursor-pointer hover:border-brand-patina hover:bg-brand-cream-tint transition-all">
                    <Upload className="w-8 h-8 text-brand-text mb-2" />
                    <span className="text-brand-text text-sm">Bild hochladen</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleMemoriaImageUpload}
                      disabled={uploadingMemoriaDesign}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                  {albumImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <div className="aspect-square bg-brand-cream-tint rounded-lg overflow-hidden border border-brand-border">
                        <img
                          src={url}
                          alt={`Album image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!locked && (
                        <button
                          onClick={() => handleRemoveAlbumImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {albumImages.length < ALBUM_MAX_FILES && !locked && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-brand-border rounded-xl cursor-pointer hover:border-brand-patina hover:bg-brand-cream-tint transition-all">
                    <Upload className="w-6 h-6 text-brand-text mb-2" />
                    <span className="text-brand-text text-sm">
                      Foto hinzufügen ({albumImages.length}/{ALBUM_MAX_FILES})
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAlbumImageUpload}
                      disabled={uploadingAlbum}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </section>
        )}

        {/* Messages Section */}
        <section className="bg-white rounded-2xl border border-brand-border shadow-brand p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-brand-patina" />
            <h2 className="text-xl font-semibold text-brand-anthracite">Persönliche Nachrichten</h2>
            {isMessagesComplete && (
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">✅</span>
            )}
          </div>
          
          <WizardMessageEditor
            messages={messages}
            onAdd={handleAddMessage}
            onRemove={handleRemoveMessage}
            onUpdate={handleUpdateMessage}
            widgetMode={false}
            darkMode={false}
          />
        </section>

        {/* Social Gifting Section */}
        {gift?.allowContributions && (
          <section className="bg-white rounded-2xl border border-brand-border shadow-brand p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-brand-patina" />
              <h2 className="text-xl font-semibold text-brand-anthracite">Gemeinschaftliches Geschenk</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-brand-cream-tint rounded-xl p-4 border border-brand-border">
                <div className="flex items-center gap-3 mb-3">
                  <Share2 className="w-5 h-5 text-brand-text" />
                  <h3 className="text-lg font-semibold text-brand-anthracite">Beitrags-Link</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${gift.contributionToken}`}
                    readOnly
                    className="flex-1 bg-white border border-brand-border rounded-lg px-4 py-3 text-brand-anthracite font-mono text-sm"
                  />
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 btn-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Kopieren
                  </button>
                </div>
              </div>

              {contributions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-brand-anthracite mb-3">
                    Eingegangene Beiträge ({contributions.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {contributions.map((c) => (
                      <div
                        key={c.id}
                        className="bg-brand-cream-tint rounded-xl p-4 border border-brand-border"
                      >
                        <div className="font-medium text-brand-anthracite">
                          {c.author || "Gast"}
                        </div>
                        <p className="text-brand-text mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-cream/95 backdrop-blur-md border-t border-brand-border p-4 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !canSave}
            className="flex-1 px-6 py-3 btn-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Speichert..." : "Entwurf speichern"}
          </button>
          
          <button
            onClick={handleSaveAndLock}
            disabled={saving || !canLock}
            className="flex-1 px-6 py-3 bg-gradient-to-r btn-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {saving ? "Speichert..." : "Geschenk versiegeln"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-brand border border-brand-border max-w-md w-full p-6"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-brand-patina" />
                  <h3 className="text-xl font-semibold text-brand-anthracite">
                    Geschenk versiegeln?
                  </h3>
                </div>
                <p className="text-brand-anthracite mb-6 leading-relaxed">
                  Bist du sicher, dass du dieses Geschenk versiegeln möchtest?
                  Nach dem Versiegeln können keine Änderungen mehr vorgenommen
                  werden.
                </p>
                {accessChoice === "pin" && (
                  <div className="bg-brand-cream-tint rounded-lg p-3 mb-6">
                    <p className="text-sm text-brand-text">
                      <span className="font-medium text-brand-anthracite">
                        PIN-Code:
                      </span>{" "}
                      {customerPin || "Nicht festgelegt"}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="btn-secondary flex-1 px-4 py-3 rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={confirmSaveAndLock}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r btn-primary font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? "Wird gespeichert..." : "Versiegeln"}
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence>
        {messageModal && (
          <Motion.div
            key="message-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-brand border border-brand-border max-w-md w-full p-6"
            >
              <div className="flex items-start gap-3">
                {messageModal.type === "success" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-brand-patina shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm leading-relaxed ${messageModal.type === "success" ? "text-brand-anthracite" : "text-brand-anthracite"}`}
                >
                  {messageModal.text}
                </p>
              </div>
              <button
                onClick={() => setMessageModal(null)}
                className="mt-4 w-full px-4 py-3 btn-secondary rounded-lg transition-colors"
              >
                OK
              </button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
