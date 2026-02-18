import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createGift, getGiftById, updateGift, getContributions } from "@/services/gifts";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  ArrowRight,
  Loader,
  Menu,
} from "lucide-react";
import WizardMessageEditor from "../components/WizardMessageEditor";
import AdminSidebar from "@/components/AdminSidebar";
import { uploadAlbumImage } from "@/services/albumUpload";

// New modular components
import WizardStepIndicator from "../components/WizardStepIndicator";
import AudioUpload from "../components/AudioUpload";
import AlbumUpload from "../components/AlbumUpload";
import NoorForm from "../components/forms/NoorForm";
import MemoriaForm from "../components/forms/MemoriaForm";
import KamlimosForm from "../components/forms/KamlimosForm";

export default function GiftWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;

  // Determine project mode from URL or default to standard behavior
  // If editing, we will set this based on fetched data
  const urlProjectMode = searchParams.get("project");

  const [step, setStep] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingRecitation, setUploadingRecitation] = useState(false);
  const [uploadingMeaning, setUploadingMeaning] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [contributions, setContributions] = useState([]);

  const [formData, setFormData] = useState({
    // Common
    project: urlProjectMode || "kamlimos", // 'kamlimos' | 'noor' | 'memoria' | 'ritual'
    productType: "mug", // 'mug', 'bracelet', 'noor-audio', 'memory-card'
    recipientName: "",
    senderName: "",
    customerName: "",
    customerEmail: "",
    orderId: "",

    // Kamlimos Specific (Mug/Bracelet)
    headline: "", // Titel (erste Zeile auf dem Cover)
    subheadline: "", // Untertitel / zweite Zeile
    accessCode: "",
    unlockDate: "", // Time Capsule Date (ISO String for Input)
    // Time Capsule Date (ISO String for Input)
    allowContributions: false, // New Feature Flag
    allowCustomerEngraving: false, // New Feature Flag: Enable customer engraving input
    openingAnimation: "none",
    messages: [],
    albumImages: [],
    designImage: "",
    engravingText: "",
    meaningText: "",

    // Noor Specific
    title: "", // e.g. "Dua für Verzeihung"
    arabicText: "", // The Arabic script
    audioUrl: "", // URL to MP3 in Storage (Recitation)
    meaningAudioUrl: "", // URL to MP3 in Storage (Meaning)
    transliteration: "", // Optional phonetic

    // Memoria Specific
    deceasedName: "",
    lifeDates: "", // e.g. "1954 - 2023"
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchGift = async () => {
        try {
          const data = await getGiftById(id);
          if (data) {
            // Helper to format Date/Timestamp to DateTime Local String (YYYY-MM-DDTHH:mm)
            let formattedUnlockDate = "";
            if (data.unlockDate) {
              const d = data.unlockDate.toDate
                ? data.unlockDate.toDate()
                : new Date(data.unlockDate);
              // Format manually to local ISO string without timezone issues for input
              // Simple approach: d.toISOString().slice(0, 16) gives UTC. We want local usually.
              // Adjust for timezone offset to show correct local time in input
              const offset = d.getTimezoneOffset() * 60000;
              formattedUnlockDate = new Date(d.getTime() - offset)
                .toISOString()
                .slice(0, 16);
            }

            setFormData({
              project: data.project || "kamlimos",
              productType: data.productType || "mug",
              recipientName: data.recipientName || "",
              senderName: data.senderName || "",
              customerName: data.customerName || "",
              customerEmail: data.customerEmail || "",
              orderId: data.orderId || "",
              headline: data.headline || "",
              subheadline: data.subheadline || "",
              accessCode: data.accessCode || "",
              unlockDate: formattedUnlockDate,
              allowContributions: data.allowContributions === true,
              allowCustomerEngraving: data.allowCustomerEngraving === true,
              openingAnimation: data.openingAnimation || "none",
              messages: data.messages || [],
              albumImages: data.albumImages || [],
              designImage: data.designImage || "",
              engravingText: data.engravingText || "",
              meaningText: data.meaningText || "",
              // Noor
              title: data.title || "",
              arabicText: data.arabicText || "",
              audioUrl: data.audioUrl || "",
              meaningAudioUrl: data.meaningAudioUrl || "",
              transliteration: data.transliteration || "",
              // Memoria
              deceasedName: data.deceasedName || "",
              lifeDates: data.lifeDates || "",
            });
          } else {
            setError("Geschenk nicht gefunden.");
          }
        } catch (err) {
          console.error("Failed to fetch gift for editing:", err);
          setError("Fehler beim Laden des Geschenks.");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchGift();
    } else {
      // ... (Initial new config - existing code) ...
      // New gift creation with preset project mode
      if (urlProjectMode === "noor" || urlProjectMode === "dua") {
        setFormData((prev) => ({
          ...prev,
          project: "noor",
          productType: "noor-audio",
        }));
      } else if (urlProjectMode === "memoria") {
        setFormData((prev) => ({
          ...prev,
          project: "memoria",
          productType: "memory-card",
        }));
      } else if (urlProjectMode === "ritual") {
        setFormData((prev) => ({
          ...prev,
          project: "ritual",
          productType: "bracelet",
        }));
      } else if (urlProjectMode === "tasse") {
        setFormData((prev) => ({
          ...prev,
          project: "kamlimos",
          productType: "mug",
        }));
      }
    }
  }, [id, isEditMode, urlProjectMode]);

  // Social Gifting: Beiträge laden, damit Admin sie sieht (auch bei versiegeltem Geschenk)
  useEffect(() => {
    if (!id || !formData.allowContributions) {
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
  }, [id, formData.allowContributions]);

  const handleSocialGiftingChange = (allowContributions) => {
    setFormData((prev) => ({ ...prev, allowContributions }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAudioUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "recitation") setUploadingRecitation(true);
    else setUploadingMeaning(true);

    try {
      // Create a reference to 'audio/filename_timestamp'
      const storageRef = ref(storage, `noor-audio/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (type === "recitation") {
        setFormData((prev) => ({ ...prev, audioUrl: url }));
      } else {
        setFormData((prev) => ({ ...prev, meaningAudioUrl: url }));
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert(`Upload Fehler: ${error.message}`);
    } finally {
      if (type === "recitation") setUploadingRecitation(false);
      else setUploadingMeaning(false);
    }
  };

  const addMessage = (type) => {
    const newMessage = {
      id: Date.now(),
      type,
      author: formData.senderName || formData.customerName,
      content: "",
    };
    setFormData((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  };

  const updateMessage = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, [field]: value } : msg
      ),
    }));
  };

  const removeMessage = (id) => {
    setFormData((prev) => ({
      ...prev,
      messages: prev.messages.filter((msg) => msg.id !== id),
    }));
  };

  const handleAlbumUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!id) {
      alert(
        "Bitte zuerst das Geschenk speichern, danach können Sie Bilder hinzufügen."
      );
      return;
    }
    setUploadingAlbum(true);
    try {
      const current = formData.albumImages || [];
      const { url } = await uploadAlbumImage(id, file, current);
      setFormData((prev) => ({
        ...prev,
        albumImages: [...(prev.albumImages || []), url],
      }));
    } catch (err) {
      console.error("Album upload failed", err);
      alert(err.message || "Upload fehlgeschlagen.");
    } finally {
      setUploadingAlbum(false);
      e.target.value = "";
    }
  };

  const removeAlbumImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      albumImages: (prev.albumImages || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // Prepare Data: Convert unlockDate string to Date Object (will be saved as Timestamp by Firebase SDK)
      const dataToSave = { ...formData };
      if (dataToSave.unlockDate) {
        dataToSave.unlockDate = new Date(dataToSave.unlockDate);
      } else {
        dataToSave.unlockDate = null; // Explicitly clear if empty
      }

      if (isEditMode) {
        await updateGift(id, dataToSave);
      } else {
        const giftId = await createGift(dataToSave);
        console.log("✅ Gift created successfully:", giftId);
        // Wait a bit to ensure Firestore has fully written the document
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      navigate(`/admin/dashboard?tab=${getDashboardTab()}`);
    } catch (err) {
      console.error("Failed to save gift:", err);
      setError(`Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardTab = () => {
    if (formData.project === "noor" || formData.project === "dua")
      return "noor";
    if (formData.project === "memoria") return "memoria";
    if (formData.project === "ritual" || formData.productType === "bracelet")
      return "ritual";
    return "kamlimos";
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  // Styles - reduced since we moved most styling to components
  const styles = {
    btnPrimary:
      "inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-stone-900 hover:bg-stone-800 focus:outline-none disabled:bg-stone-300 transition-colors",
    btnSecondary:
      "inline-flex items-center px-6 py-3 border border-stone-300 shadow-sm text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 focus:outline-none transition-colors",
  };

  const isNoor = formData.project === "noor" || formData.project === "dua";
  const isMemoria = formData.project === "memoria";
  const isRitual =
    formData.project === "ritual" || formData.productType === "bracelet";
  const isBracelet = isRitual; // Alias for readability in render logic if needed

  return (
    <div className="flex bg-stone-50 min-h-screen font-sans">
      <AdminSidebar
        activeView="edit"
        onViewChange={() => navigate("/admin/dashboard")}
        onRefresh={() => window.location.reload()}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 h-screen overflow-y-auto relative py-12 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-40 p-2 text-stone-600 bg-stone-100/80 backdrop-blur rounded-lg shadow-sm border border-stone-200"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-stone-900">
              {isEditMode
                ? "Auftrag bearbeiten"
                : isNoor
                  ? "Neues Noor"
                  : isMemoria
                    ? "Neues Memoria"
                    : isBracelet
                      ? "Neues Armband"
                      : "Neue Tasse"}
            </h1>
            <button
              onClick={() =>
                navigate(`/admin/dashboard?tab=${getDashboardTab()}`)
              }
              className="text-stone-500 hover:text-stone-700"
            >
              Abbrechen
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {/* Progress Steps */}
          <WizardStepIndicator 
            step={step} 
            projectType={isNoor ? 'noor' : isMemoria ? 'memoria' : isRitual ? 'ritual' : 'kamlimos'}
          />

          <div className="bg-white shadow rounded-2xl p-8 border border-stone-100">
            {/* ---------- STEP 1: DETAILS (Formerly Step 2) ---------- */}
            {step === 1 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-stone-900">
                  1. Inhalte erfassen
                </h2>

                {/* NOOR FORM */}
                {isNoor ? (
                  <NoorForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    uploadingRecitation={uploadingRecitation}
                    uploadingMeaning={uploadingMeaning}
                    onAudioUpload={handleAudioUpload}
                  />
                ) : isMemoria ? (
                  <MemoriaForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    uploadingRecitation={uploadingRecitation}
                    onAudioUpload={handleAudioUpload}
                  />
                ) : (
                  <KamlimosForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    isBracelet={isBracelet}
                    onSocialGiftingChange={handleSocialGiftingChange}
                    contributions={contributions}
                  />
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() =>
                      navigate(`/admin/dashboard?tab=${getDashboardTab()}`)
                    }
                    className={styles.btnSecondary}
                  >
                    Zurück
                  </button>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => setStep(2)}
                    className={styles.btnPrimary}
                  >
                    Weiter <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------- STEP 2: SUMMARY (Formerly Step 3/Messages) ---------- */}
            {step === 2 && (
              <div className="space-y-6">
                {!isNoor && !isBracelet ? (
                  <>
                    {/* Album: bis zu 7 Bilder */}
                    <AlbumUpload
                      albumImages={formData.albumImages}
                      uploading={uploadingAlbum}
                      onUpload={handleAlbumUpload}
                      onRemoveImage={removeAlbumImage}
                      giftId={id}
                    />
                    <WizardMessageEditor
                      messages={formData.messages}
                      onAdd={addMessage}
                      onRemove={removeMessage}
                      onUpdate={updateMessage}
                    />
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-stone-900">
                    Zusammenfassung
                  </h2>
                )}

                {(isMemoria || isNoor) && (
                  <div className="bg-stone-50 p-6 rounded-xl space-y-4">
                    {isMemoria && (
                      <>
                        <p>
                          <strong>Name:</strong> {formData.deceasedName}
                        </p>
                        <p>
                          <strong>Daten:</strong> {formData.lifeDates}
                        </p>
                        <p>
                          <strong>Audio:</strong>{" "}
                          {formData.audioUrl ? "Vorhanden ✅" : "Fehlt ❌"}
                        </p>
                      </>
                    )}
                    {isNoor && (
                      <>
                        <p>
                          <strong>Titel:</strong> {formData.title}
                        </p>
                        <p>
                          <strong>Audio (Rezitation):</strong>{" "}
                          {formData.audioUrl ? "Vorhanden ✅" : "Fehlt ❌"}
                        </p>
                        <p>
                          <strong>Audio (Bedeutung):</strong>{" "}
                          {formData.meaningAudioUrl
                            ? "Vorhanden ✅"
                            : "Fehlt ❌"}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className={styles.btnSecondary}
                  >
                    Zurück
                  </button>
                  <div className="w-4"></div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`${styles.btnPrimary} flex-1`}
                  >
                    {loading ? (
                      <Loader className="animate-spin h-5 w-5 mx-auto" />
                    ) : (
                      "Speichern"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
