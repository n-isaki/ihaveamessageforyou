import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getGiftById, updateGift, getContributions } from "../services/gifts";
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
import { getExperience } from "../modules/registry";
import { sanitizeInput, isValidMessage } from "../utils/security";

// New Redesign Components
import CustomerSetupProgress from "../components/CustomerSetupProgress";
import CustomerSetupSection from "../components/CustomerSetupSection";
import CustomerSetupInput from "../components/CustomerSetupInput";
import CustomerSetupActionBar from "../components/CustomerSetupActionBar";

export default function CustomerSetup() {
  const { id, token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [currentStep, setCurrentStep] = useState("basic");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [contributionLink, setContributionLink] = useState("");

  // Calculate progress
  const calculateProgress = () => {
    const requiredSteps = ["basic", "messages"];
    if (gift?.project !== "noor") {
      requiredSteps.push("media");
    }
    return (
      (completedSteps.filter((step) => requiredSteps.includes(step)).length /
        requiredSteps.length) *
      100
    );
  };

  useEffect(() => {
    const loadGift = async () => {
      try {
        setLoading(true);
        const data = await getGiftById(id, token);
        
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

        // Initialize recipient and sender names
        setRecipientName(data.recipientName || "");
        setSenderName(data.senderName || "");

        if (data.project === "memoria") {
          setMemoriaData({
            deceasedName: data.deceasedName || "",
            lifeDates: data.lifeDates || "",
            meaningText: data.meaningText || "",
          });
          setMemoriaDesignImage(data.designImage || "");
        }

        setAlbumImages(data.albumImages || []);

        // Set completed steps based on existing data
        const completed = [];
        if (data.headline || data.subheadline) completed.push("basic");
        if (data.messages && data.messages.length > 0)
          completed.push("messages");
        if (data.albumImages && data.albumImages.length > 0)
          completed.push("media");
        setCompletedSteps(completed);

        // Set initial step
        if (!completed.includes("basic")) {
          setCurrentStep("basic");
        } else if (
          !completed.includes("messages") &&
          data.project !== "noor"
        ) {
          setCurrentStep("messages");
        } else if (!completed.includes("media") && data.project !== "noor") {
          setCurrentStep("media");
        } else {
          setCurrentStep("completed");
        }

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

  // Message handlers
  const handleAddMessage = () => {
    const newMessage = {
      id: uuidv4(),
      type: "text",
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

      // Update completed steps
      if (!completedSteps.includes("media")) {
        setCompletedSteps((prev) => [...prev, "media"]);
      }
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

      // Update completed steps
      if (!completedSteps.includes("media")) {
        setCompletedSteps((prev) => [...prev, "media"]);
      }
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
        engravingText: sanitizeInput(engravingText, 30),
        isPublic: accessChoice === "public",
        accessCode: customerPin,
        messages: validMessages,
        albumImages: albumImages,
      };

      if (gift.project === "memoria") {
        updates.deceasedName = sanitizeInput(memoriaData.deceasedName, 200);
        updates.lifeDates = sanitizeInput(memoriaData.lifeDates, 100);
        updates.meaningText = sanitizeInput(memoriaData.meaningText, 5000);
        updates.designImage = memoriaDesignImage;
      }

      await updateGift(id, updates);
      setGift((prev) => ({ ...prev, ...updates }));

      // Update completed steps (newCompleted must be declared before any use)
      const newCompleted = [...completedSteps];
      if (
        updates.headline ||
        updates.subheadline ||
        updates.recipientName ||
        updates.senderName
      ) {
        if (!newCompleted.includes("basic")) newCompleted.push("basic");
      }
      if (validMessages.length > 0) {
        if (!newCompleted.includes("messages")) newCompleted.push("messages");
      }
      if (updates.albumImages && updates.albumImages.length > 0) {
        if (!newCompleted.includes("media")) newCompleted.push("media");
      }
      if (
        gift.project === "memoria" &&
        (updates.deceasedName || updates.designImage)
      ) {
        if (!newCompleted.includes("basic")) newCompleted.push("basic");
        if (!newCompleted.includes("media")) newCompleted.push("media");
      }
      setCompletedSteps(newCompleted);

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
        engravingText: sanitizeInput(engravingText, 30),
        isPublic: accessChoice === "public",
        accessCode: customerPin,
        messages: validMessages,
        albumImages: albumImages,
        locked: true,
      };

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
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <Loader className="animate-spin text-stone-500" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-red-900/50">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-serif font-bold text-stone-100">
            Dieser Link funktioniert nicht
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Der Link ist ungültig oder wurde nicht vollständig kopiert. Bitte
            öffne den Link genau so, wie er dir zugeschickt wurde.
          </p>
        </div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">
        Geschenk nicht gefunden.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
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

  const progressPercentage = calculateProgress();
  const canSave =
    headline ||
    subheadline ||
    messages.length > 0 ||
    albumImages.length > 0 ||
    memoriaData.deceasedName;
  const canLock = canSave && messages.length > 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-32 font-setup">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="px-4 py-4 text-center">
          <h1 className="font-setup-heading text-xl sm:text-2xl text-white">
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

      {/* Progress */}
      <CustomerSetupProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        giftType={gift.productType}
        isLocked={locked}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Information Section */}
        <CustomerSetupSection
          title="Grundinformationen"
          description="Titel, Empfänger und wichtige Details"
          icon={<Edit2 />}
          isCompleted={completedSteps.includes("basic")}
          isActive={currentStep === "basic"}
          badge="Wichtig"
          defaultOpen={true}
          tips={[
            "Der Titel ist das Erste, was der Empfänger sieht.",
            "Gib einen klaren Empfängernamen an.",
            gift.project !== "noor" &&
              "Du kannst später einen PIN-Code hinzufügen.",
          ].filter(Boolean)}
        >
          <div className="space-y-4">
            {/* Title and Recipient - Side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CustomerSetupInput
                label="Titel"
                description="Erste Zeile auf dem Cover"
                placeholder="Für die beste Mama"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                icon={<MessageSquare />}
                success={headline.length > 0}
              />
              <CustomerSetupInput
                label="Empfänger"
                description="Wer beschenkt wird?"
                placeholder="Name des Empfängers"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                icon={<User />}
                success={recipientName.length > 0}
              />
            </div>

            {/* Sender and Subtitle - Side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CustomerSetupInput
                label="Absender"
                description="Wer schenkt?"
                placeholder="Dein Name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                icon={<User />}
                success={senderName.length > 0}
              />
              <CustomerSetupInput
                label="Untertitel"
                description="Zweite Zeile auf dem Cover"
                placeholder="Zu deinem Geburtstag"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                icon={<MessageSquare />}
                success={subheadline.length > 0}
              />
            </div>

            {/* Access Options - Full width */}
            {gift.project !== "noor" && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Zugangsoptionen
                </h3>
                <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4 mb-4">
                  <p className="text-sm text-stone-400 leading-relaxed">
                    Auch bei "Öffentlich": Nur wer den Link hat, kann das Geschenk
                    öffnen. Der Link enthält eine zufällig generierte ID – ohne den
                    Link ist das Geschenk nicht auffindbar. Die Geschenk-Seiten
                    werden von Suchmaschinen (z. B. Google) nicht indexiert.
                  </p>
                </div>

                {/* Radio buttons - Side by side on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-3 text-stone-300 mb-2">
                      <input
                        type="radio"
                        name="access"
                        value="public"
                        checked={accessChoice === "public"}
                        onChange={(e) => setAccessChoice(e.target.value)}
                        className="w-4 h-4 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Öffentlich (kein PIN)</span>
                    </label>
                    <p className="text-sm text-stone-500">
                      Jeder mit dem Link kann das Geschenk öffnen – ohne
                      PIN-Eingabe.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 text-stone-300 mb-2">
                      <input
                        type="radio"
                        name="access"
                        value="pin"
                        checked={accessChoice === "pin"}
                        onChange={(e) => setAccessChoice(e.target.value)}
                        className="w-4 h-4 text-rose-500 focus:ring-rose-500"
                      />
                      <span>PIN-geschützt</span>
                    </label>
                    <CustomerSetupInput
                      label="PIN-Code"
                      description="4-stelliger Code für den Zugang"
                      placeholder="1234"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                      disabled={accessChoice !== "pin"}
                      maxLength={4}
                      showCharCount={true}
                      success={accessChoice === "pin" && customerPin.length === 4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Engraving Text */}
            {gift.productType !== "noor" && (
              <CustomerSetupInput
                label="Gravur Text"
                description="Text für die Gravur (max. 30 Zeichen)"
                placeholder="Für die beste Oma"
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value)}
                maxLength={30}
                showCharCount={true}
                icon={<Edit2 />}
                success={engravingText.length > 0}
              />
            )}

            {/* Gravurwunsch - Special section */}
            {gift && gift.allowCustomerEngraving && (
              <div className="mt-4 p-4 bg-stone-800/50 border border-stone-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Dein Gravurwunsch
                </h3>
                <p className="text-sm text-stone-400 mb-4">
                  Dein Wunschtext für die Gravur.
                </p>
                <CustomerSetupInput
                  label="Gravurwunsch"
                  description="Dein persönlicher Wunschtext für die Gravur (max. 30 Zeichen)"
                  placeholder="z.B. Für die beste Oma"
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  maxLength={30}
                  showCharCount={true}
                  icon={<Edit2 />}
                  success={engravingText.length > 0}
                />
              </div>
            )}
          </div>
        </CustomerSetupSection>

        {/* Media Section */}
        {gift.project !== "noor" && (
          <CustomerSetupSection
            title="Medien"
            description="Fotos und Videos für das Geschenk"
            icon={<ImageIcon />}
            isCompleted={completedSteps.includes("media")}
            isActive={currentStep === "media"}
            badge="Visuell"
            defaultOpen={false}
            tips={[
              "Lade hochwertige Fotos hoch.",
              `Du kannst bis zu ${ALBUM_MAX_FILES} Fotos hinzufügen.`,
              "Für Memoria: Ein Bild für die Gravur auswählen.",
            ]}
          >
            {gift.project === "memoria" ? (
              <CustomerSetupInput
                type="file"
                label="Bild für die Gravur"
                description="Ein scharfes Bild für die Gravur (Hochformat empfohlen)"
                accept="image/jpeg,image/png,image/webp"
                onFileUpload={handleMemoriaImageUpload}
                uploading={uploadingMemoriaDesign}
                previewUrl={memoriaDesignImage}
                onPreviewRemove={handleRemoveMemoriaImage}
                icon={<ImageIcon />}
              />
            ) : (
              <div className="space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {albumImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <div className="aspect-square bg-stone-950 rounded-lg overflow-hidden border border-stone-700">
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
                          title="Bild entfernen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload Button */}
                {albumImages.length < ALBUM_MAX_FILES && !locked && (
                  <CustomerSetupInput
                    type="file"
                    label="Foto hinzufügen"
                    description={`Noch ${ALBUM_MAX_FILES - albumImages.length} Fotos möglich`}
                    accept="image/jpeg,image/png,image/webp"
                    onFileUpload={handleAlbumImageUpload}
                    uploading={uploadingAlbum}
                    icon={<Upload />}
                  />
                )}
              </div>
            )}
          </CustomerSetupSection>
        )}

        {/* Messages Section */}
        <CustomerSetupSection
          title="Persönliche Nachrichten"
          description="Füge persönliche Worte und Erinnerungen hinzu"
          icon={<MessageSquare />}
          isCompleted={completedSteps.includes("messages")}
          isActive={currentStep === "messages"}
          badge="Emotional"
          defaultOpen={false}
          tips={[
            "Schreibe aus dem Herzen - das berührt am meisten.",
            "Du kannst verschiedene Nachrichtentypen hinzufügen.",
            "Füge Bilder, Videos oder Audio hinzu.",
          ]}
        >
          <WizardMessageEditor
            messages={messages}
            onAdd={handleAddMessage}
            onRemove={handleRemoveMessage}
            onUpdate={handleUpdateMessage}
            widgetMode={false}
            darkMode={true}
          />
        </CustomerSetupSection>

        {/* Social Gifting Section */}
        {gift?.allowContributions && (
          <CustomerSetupSection
            title="Gemeinschaftliches Geschenk"
            description="Freunde und Familie können ebenfalls Beiträge hinzufügen"
            icon={<Users />}
            isCompleted={contributions.length > 0}
            defaultOpen={false}
            tips={[
              "Teile den Link nach dem Absenden mit Freunden.",
              "Jeder kann eine persönliche Nachricht hinterlassen.",
              "Alle Beiträge werden im Geschenk angezeigt.",
            ]}
          >
            <div className="space-y-4">
              <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                <div className="flex items-center gap-3 mb-3">
                  <Share2 className="w-5 h-5 text-stone-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Beitrags-Link
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${gift.contributionToken}`}
                    readOnly
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-3 text-stone-300 font-mono text-sm"
                  />
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Kopieren
                  </button>
                </div>
              </div>

              {contributions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Eingegangene Beiträge ({contributions.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {contributions.map((c) => (
                      <div
                        key={c.id}
                        className="bg-stone-800/50 rounded-xl p-4 border border-stone-700"
                      >
                        <div className="font-medium text-stone-300">
                          {c.author || "Gast"}
                        </div>
                        <p className="text-stone-400 mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CustomerSetupSection>
        )}
      </main>

      {/* Action Bar */}
      <CustomerSetupActionBar
        onSaveDraft={handleSaveDraft}
        onSaveAndLock={handleSaveAndLock}
        onPreview={null}
        onShare={null}
        saving={saving}
        canSave={canSave}
        canLock={canLock}
        showPreview={false}
        isLocked={locked}
        progressPercentage={progressPercentage}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-rose-500" />
                  <h3 className="text-xl font-semibold text-white">
                    Geschenk versiegeln?
                  </h3>
                </div>
                <p className="text-stone-300 mb-6 leading-relaxed">
                  Bist du sicher, dass du dieses Geschenk versiegeln möchtest?
                  Nach dem Versiegeln können keine Änderungen mehr vorgenommen
                  werden.
                </p>
                {accessChoice === "pin" && (
                  <div className="bg-stone-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-stone-400">
                      <span className="font-medium text-stone-300">
                        PIN-Code:
                      </span>{" "}
                      {customerPin || "Nicht festgelegt"}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={confirmSaveAndLock}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold transition-colors disabled:opacity-50"
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
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-3">
                {messageModal.type === "success" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm leading-relaxed ${messageModal.type === "success" ? "text-stone-200" : "text-stone-300"}`}
                >
                  {messageModal.text}
                </p>
              </div>
              <button
                onClick={() => setMessageModal(null)}
                className="mt-4 w-full px-4 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <MugViewer gift={gift} />
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
