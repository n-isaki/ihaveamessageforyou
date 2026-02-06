import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Type } from "lucide-react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";
import { useGiftLogic } from "../hooks/useGiftLogic";

import LockScreen from "../components/LockScreen";
import BraceletExperience from "../components/BraceletExperience";
import MugExperience from "../components/MugExperience";

const RedirectToSetup = ({ id }) => {
  useEffect(() => {
    window.location.href = `/setup/${id}`;
  }, [id]);
  return null;
};

export default function GiftReveal({ initialData }) {
  const { id } = useParams();
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // 0=Normal, 1=Large, 2=Extra Large

  const {
    gift,
    loading,
    error,
    setError,
    unlocked,
    isTimeLocked,
    unlockTime,
    verifyPin,
  } = useGiftLogic(id, initialData);

  // Redirect to Setup if empty and unlocked (Scan-to-Setup)
  const isPreview = !!initialData;
  const shouldRedirectToSetup =
    gift &&
    !gift.locked &&
    (!gift.messages || gift.messages.length === 0) &&
    gift.productType !== "bracelet" &&
    !isPreview;

  if (shouldRedirectToSetup) {
    return <RedirectToSetup id={id} />;
  }

  const toggleFontSize = () => {
    setFontSizeLevel((prev) => (prev + 1) % 3);
  };

  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 1:
        return "text-lg md:text-xl leading-relaxed";
      case 2:
        return "text-xl md:text-2xl leading-loose";
      default:
        return "text-sm md:text-base leading-relaxed";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="h-8 w-8 animate-spin text-rose-500 rounded-full border-4 border-current border-t-transparent" />
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Geschenk nicht gefunden</h1>
          <p className="mt-2 text-stone-500">Bitte überprüfe den Link.</p>
        </div>
      </div>
    );
  }

  const isBracelet =
    gift?.productType === "bracelet" ||
    (gift?.engravingText && gift.engravingText.length > 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-rose-500/30">
      {!unlocked ? (
        <LockScreen
          gift={gift}
          onUnlock={verifyPin}
          error={error}
          setError={setError}
          isTimeLocked={isTimeLocked}
          unlockTime={unlockTime}
        />
      ) : (
        <>
          {/* Size Toggle (Top Right) */}
          <div className="fixed top-0 right-0 z-50 p-6 mix-blend-difference">
            <button
              onClick={toggleFontSize}
              className="p-2 rounded-full hover:bg-white/10 text-stone-500 hover:text-stone-300 transition-all"
              title="Schriftgröße ändern"
            >
              <Type
                className={`transition-all ${fontSizeLevel === 0
                  ? "h-5 w-5"
                  : fontSizeLevel === 1
                    ? "h-6 w-6"
                    : "h-7 w-7"
                  }`}
              />
            </button>
          </div>

          {isBracelet ? (
            <BraceletExperience
              gift={gift}
              getFontSizeClass={getFontSizeClass}
            />
          ) : (
            <MugExperience
              gift={gift}
              getFontSizeClass={getFontSizeClass}
            />
          )}
        </>
      )}
    </div>
  );
}
