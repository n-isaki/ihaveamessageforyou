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
import { ALBUM_MAX_FILES, isValidPin } from "../utils/security";
import MugViewer from "../modules/anima/experiences/multimedia-gift/pages/Viewer";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { getExperience } from "../modules/registry";
import { sanitizeInput, isValidMessage } from "../utils/security";

// New Redesign Components
import CustomerSetupProgress from "../components/CustomerSetupProgress";
import CustomerSetupSection from "../components/CustomerSetupSection";
import CustomerSetupInput from "../components/CustomerSetupInput";
import CustomerSetupActionBar from "../components/CustomerSetupActionBar";

export default function CustomerSetup() {
  const { id, token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || tokenFromPath;

  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageModal, setMessageModal] = useState(null); // { type: 'success'|'error', text: string }
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

  const [accessChoice, setAccessChoice] = useState("public"); // "public" | "pin"
  const [customerPin, setCustomerPin] = useState("");
  const [engravingText, setEngravingText] = useState("");

  // Memoria Specific State
  const [memoriaData, setMemoriaData] = useState({
    deceasedName: "",
    lifeDates: "",
    meaningText: "",
  });

  // NEW: Setup recipient and sender state
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [currentStep, setCurrentStep] = useState('basic');
  const [completedSteps, setCompletedSteps] = useState([]);

  // Calculate progress
  const calculateProgress = () => {
    const requiredSteps = ['basic', 'messages'];
    if (gift?.project !== 'noor') {
      requiredSteps.push('media');
    }
    return (completedSteps.filter(step => requiredSteps.includes(step)).length / requiredSteps.length * 100);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getGiftById(id);
        if (data) {
          const exp = getExperience(data);
          if (!exp.isSetupRequired) {
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
          
          // Initialize form data
          setHeadline(data.headline || "");
          setSubheadline(data.subheadline || "");
          setAlbumImages(data.albumImages || []);
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

          // Set completed steps based on existing data
          const completed = [];
          if (data.headline || data.subheadline) completed.push('basic');
          if (data.messages && data.messages.length > 0) completed.push('messages');
          if (data.albumImages && data.albumImages.length > 0) completed.push('media');
          setCompletedSteps(completed);

          // Set initial step
          if (!completed.includes('basic')) {
            setCurrentStep('basic');
          } else if (!completed.includes('messages') && data.project !== 'noor') {
            setCurrentStep('messages');
          } else if (!completed.includes('media') && data.project !== 'noor') {
            setCurrentStep('media');
          } else {
            setCurrentStep('completed');
          }
        } else {
          setAccessDenied(true);
        }
      } catch (err) {
        console.error("Failed to load gift:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      init();
    }
  }, [id, token, navigate]);

  // Social Gifting
  useEffect(() => {
    if (!id || !gift?.allowContributions) {
      setContributions([]);
      return;
    }
    const load = async () => {
      try {
        const data = await getContributions(id);
        setContributions(data || []);
      } catch {
        setContributions([]);
      }
    };
    load();
  }, [id, gift?.allowContributions]);

  const handleAddMessage = (type) => {
    const newMessage = {
      id: uuidv4(),
      type,
      author: gift?.customerName || "Anonymous",
      content: "",
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleRemoveMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleUpdateMessage = (id, field, value) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, [field]: value } : msg))
    );
  };

  const handleAlbumUpload = async (e) => {
    if (locked || !gift?.id) return;
    const file = e?.target?.files?.[0];
    if (!file) return;
    setUploadingAlbum(true);
    try {
      const current = albumImages || [];
      const { url } = await uploadAlbumImage(id, file, current);
      setAlbumImages((prev) => [...(prev || []), url]);
      
      // Update completed steps
      if (!completedSteps.includes('media')) {
        setCompletedSteps(prev => [...prev, 'media']);
      }
    } catch (err) {
      console.error("Album upload failed", err);
      setMessageModal({ type: "error", text: err.message || "Upload fehlgeschlagen." });
    } finally {
      setUploadingAlbum(false);
      e.target.value = "";
    }
  };

  const handleRemoveAlbumImage = (index) => {
    if (locked) return;
    setAlbumImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMemoriaImageUpload = async (e) => {
    if (locked || !gift?.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMemoriaDesign(true);
    try {
      const { url } = await uploadMemoriaDesignImage(
        gift.id,
        file,
        memoriaDesignImage
      );
      setMemoriaDesignImage(url);
      
      // Update completed steps
      if (!completedSteps.includes('media')) {
        setCompletedSteps(prev => [...prev, 'media']);
      }
    } catch (err) {
      console.error("Upload failed", err);
      setMessageModal({ type: "error", text: err.message || "Fehler beim Upload." });
    } finally {
      setUploadingMemoriaDesign(false);
      e.target.value = "";
    }
  };

  const handleRemoveMemoriaImage = async () => {
    if (locked || !memoriaDesignImage) return;
    const urlToDelete = memoriaDesignImage;
    setMemoriaDesignImage("");
    try {
      await deleteAlbumImageByUrl(urlToDelete);
      await updateGift(id, {
        designImage: "",
        securityToken: gift.securityToken,
      });
    } catch (err) {
      console.error("Delete failed", err);
      setMessageModal({ type: "error", text: "Fehler beim Löschen." });
    }
  };

  const handleSaveDraft = async () => {
    if (locked || !gift?.securityToken) return;
    setSaving(true);
    try {
      let draftUpdates = {};

      if (gift.project === "memoria") {
        draftUpdates = {
          deceasedName: sanitizeInput(memoriaData.deceasedName || "", 200),
          lifeDates: sanitizeInput(memoriaData.lifeDates || "", 100),
          meaningText: sanitizeInput(memoriaData.meaningText || "", 5000),
          designImage: memoriaDesignImage,
          isPublic: true,
          accessCode: "",
          accessCodeHash: null,
          securityToken: gift.securityToken,
        };
      } else {
        draftUpdates = {
          headline: sanitizeInput(headline || "", 200),
          subheadline: sanitizeInput(subheadline || "", 200),
          recipientName: sanitizeInput(recipientName || "", 100),
          senderName: sanitizeInput(senderName || "", 100),
          albumImages: Array.isArray(albumImages) ? albumImages : [],
          engravingText: sanitizeInput(engravingText || "", 30),
          isPublic: accessChoice === "public",
          accessCode: accessChoice === "pin" ? customerPin : "",
          accessCodeHash: accessChoice === "pin" ? customerPin : null,
          securityToken: gift.securityToken,
        };
      }

      const validMessages = messages.filter(isValidMessage);
      draftUpdates.messages = validMessages;

      await updateGift(id, draftUpdates);
      setGift((prev) => ({ ...prev, ...draftUpdates }));

      // Update completed steps (newCompleted must be declared before any use)
      const newCompleted = [...completedSteps];
      if (draftUpdates.headline || draftUpdates.subheadline || draftUpdates.recipientName || draftUpdates.senderName) {
        if (!newCompleted.includes('basic')) newCompleted.push('basic');
      }
      if (validMessages.length > 0) {
        if (!newCompleted.includes('messages')) newCompleted.push('messages');
      }
      if (draftUpdates.albumImages && draftUpdates.albumImages.length > 0) {
        if (!newCompleted.includes('media')) newCompleted.push('media');
      }
      if (gift.project === "memoria" && (draftUpdates.deceasedName || draftUpdates.designImage)) {
        if (!newCompleted.includes('basic')) newCompleted.push('basic');
        if (!newCompleted.includes('media')) newCompleted.push('media');
      }
      setCompletedSteps(newCompleted);

      setMessageModal({ type: "success", text: "Entwurf gespeichert!" });
    } catch (err) {
      console.error("Draft save failed", err);
      setMessageModal({
        type: "error",
        text: err.message ? `Fehler beim Speichern: ${err.message}` : "Fehler beim Speichern. Bitte versuche es erneut.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndLock = async () => {
    if (accessChoice === "pin" && !customerPin) {
      setMessageModal({ type: "error", text: "Bitte erst einen PIN-Code festlegen oder 'Öffentlich' wählen." });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveAndLock = async () => {
    setSaving(true);
    setShowConfirmModal(false);
    try {
      const updates = {
        locked: true,
        setupCompletedAt: new Date(),
      };

      if (gift.project === "memoria") {
        updates.deceasedName = sanitizeInput(memoriaData.deceasedName || "", 200);
        updates.lifeDates = sanitizeInput(memoriaData.lifeDates || "", 100);
        updates.meaningText = sanitizeInput(memoriaData.meaningText || "", 5000);
        updates.designImage = memoriaDesignImage;
        updates.isPublic = true;
        updates.accessCode = "";
        updates.accessCodeHash = null;
      } else {
        updates.headline = sanitizeInput(headline || "", 200);
        updates.subheadline = sanitizeInput(subheadline || "", 200);
        updates.recipientName = sanitizeInput(recipientName || "", 100);
        updates.senderName = sanitizeInput(senderName || "", 100);
        updates.albumImages = Array.isArray(albumImages) ? albumImages : [];
        updates.engravingText = sanitizeInput(engravingText || "", 30);
        updates.isPublic = accessChoice === "public";
        updates.accessCode = accessChoice === "pin" ? customerPin : "";
        updates.accessCodeHash = accessChoice === "pin" ? customerPin : null;
      }

      const validMessages = messages.filter(isValidMessage);
      updates.messages = validMessages;

      await updateGift(id, updates);
      setLocked(true);
      setGift((prev) => ({ ...prev, ...updates }));
      
      // Debug: Log what was saved
      console.log('Gift locked and saved:', {
        updates,
        finalGift: { ...gift, ...updates }
      });
    } catch (err) {
      console.error("Lock failed", err);
      setMessageModal({ type: "error", text: "Fehler beim Speichern." });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
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

  const progressPercentage = calculateProgress();
  const canSave = headline || subheadline || messages.length > 0 || albumImages.length > 0 || memoriaData.deceasedName;
  const canLock = canSave && messages.length > 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-32 font-setup">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="px-3 sm:px-4 py-3 sm:py-4 sm:py-5 flex justify-center">
          <span className="font-setup-heading text-lg sm:text-2xl sm:text-3xl text-white">
            {gift.project === "memoria" ? "Memoria" : 
             gift.project === "noor" ? "Noor" : 
             gift.productType === "bracelet" ? "Armband" : "Geschenk"} Setup
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <CustomerSetupProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        giftType={gift.productType}
        isLocked={locked}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 sm:p-8 space-y-4 sm:space-y-8">
        {/* Basic Information Section – relative z-10 damit auf Mobile nicht unter Medien/folgenden Sections verschwindet */}
        <div className="relative z-10">
        <CustomerSetupSection
          title="Grundinformationen"
          description="Titel, Empfänger und wichtige Details"
          icon={<Edit2 />}
          isCompleted={completedSteps.includes('basic')}
          isActive={currentStep === 'basic'}
          badge="Wichtig"
          defaultOpen={false}
          tips={[
            "Der Titel ist das Erste, was der Empfänger sees.",
            "Gib einen klaren Empfängernamen an.",
            gift.project !== 'noor' && "Du kannst später ein PIN-Code hinzufügen."
          ].filter(Boolean)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* PIN/Access Section */}
            {gift.project !== 'noor' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">Zugangsoptionen</h4>
                <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4 mb-4">
                  <p className="text-sm text-stone-400 leading-relaxed">
                    Auch bei „Öffentlich“: Nur wer den Link hat, kann das Geschenk öffnen. Der Link enthält eine zufällig generierte ID – ohne den Link ist das Geschenk nicht auffindbar. Die Geschenk-Seiten werden von Suchmaschinen (z. B. Google) nicht indexiert.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-3 text-stone-300 mb-3">
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
                      Jeder mit dem Link kann das Geschenk öffnen – ohne PIN-Eingabe.
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 text-stone-300 mb-3">
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
            {gift.productType !== 'noor' && (
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
          </div>
        </CustomerSetupSection>
        </div>

        {/* Media Section */}
        {gift.project !== 'noor' && (
          <CustomerSetupSection
            title="Medien"
            description="Fotos und Videos für das Geschenk"
            icon={<ImageIcon />}
            isCompleted={completedSteps.includes('media')}
            isActive={currentStep === 'media'}
            badge="Visuell"
            defaultOpen={false}
            tips={[
              "Lade hochwertige Fotos hoch.",
              `Du kannst bis zu ${ALBUM_MAX_FILES} Fotos hinzufügen.`,
              "Für Memoria: Ein Bild für die Gravur auswählen."
            ]}
          >
            {gift.project === "memoria" ? (
              /* Memoria Image Upload */
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
              /* Standard Album Upload */
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albumImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <div className="aspect-square bg-stone-950 rounded-xl overflow-hidden border border-stone-700 shadow-xl">
                        <img
                          src={url}
                          alt={`Album image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!locked && (
                        <button
                          onClick={() => handleRemoveAlbumImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          title="Bild entfernen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {albumImages.length < ALBUM_MAX_FILES && !locked && (
                    <CustomerSetupInput
                      type="file"
                      label=""
                      description=""
                      accept="image/jpeg,image/png,image/webp"
                      onFileUpload={handleAlbumUpload}
                      uploading={uploadingAlbum}
                      icon={<Upload />}
                    />
                  )}
                </div>
              </div>
            )}
          </CustomerSetupSection>
        )}

        {/* Messages Section */}
        <CustomerSetupSection
          title="Persönliche Nachrichten"
          description="Füge persönliche Worte und Erinnerungen hinzu"
          icon={<MessageSquare />}
          isCompleted={completedSteps.includes('messages')}
          isActive={currentStep === 'messages'}
          badge="Emotional"
          defaultOpen={false}
          tips={[
            "Schreibe aus dem Herzen - das berührt am meisten.",
            "Du kannst verschiedene Nachrichtentypen hinzufügen.",
            "Füge Bilder, Videos oder Audio hinzu."
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
              "Alle Beiträge werden im Geschenk angezeigt."
            ]}
          >
            <div className="space-y-4">
              <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                <div className="flex items-center gap-3 mb-3">
                  <Share2 className="w-5 h-5 text-stone-400" />
                  <h4 className="text-lg font-semibold text-white">Beitrags-Link</h4>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${gift.contributionToken}`}
                    readOnly
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-3 text-stone-300 font-mono text-sm"
                  />
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Kopieren
                  </button>
                </div>
              </div>

              {contributions.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Eingegangene Beiträge ({contributions.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {contributions.map((c) => (
                      <div key={c.id} className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                        <div className="font-medium text-stone-300">{c.author || "Gast"}</div>
                        <p className="text-stone-400 mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CustomerSetupSection>
        )}
      </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-rose-500" />
                  <h3 className="text-xl font-semibold text-white">Geschenk versiegeln?</h3>
                </div>
                <p className="text-stone-300 mb-6 leading-relaxed">
                  Bist du sicher, dass du dieses Geschenk versiegeln möchtest? 
                  Nach dem Versiegeln können keine Änderungen mehr vorgenommen werden.
                </p>
                {accessChoice === "pin" && (
                  <div className="bg-stone-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-stone-400">
                      <span className="font-medium text-stone-300">PIN-Code:</span> {customerPin || "Nicht festgelegt"}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={confirmSaveAndLock}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold transition-all disabled:opacity-50"
                  >
                    {saving ? "Wird gespeichert..." : "Versiegeln"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal (Erfolg / Fehler) */}
      <AnimatePresence>
        {messageModal && (
          <motion.div
            key="message-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full border border-stone-800"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {messageModal.type === "success" ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                  )}
                  <p className={`text-sm leading-relaxed ${messageModal.type === "success" ? "text-stone-200" : "text-stone-300"}`}>
                    {messageModal.text}
                  </p>
                </div>
                <button
                  onClick={() => setMessageModal(null)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                    messageModal.type === "success"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-stone-700 hover:bg-stone-600 text-stone-200"
                  }`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-stone-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Vorschau</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-stone-400 hover:text-stone-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <MugViewer gift={gift} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
