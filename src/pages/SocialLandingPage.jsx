import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";
import {
  ChevronDown,
  ExternalLink,
  Mail,
  Shield,
  Smartphone,
  Sparkles,
  Heart,
  Lock,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Was ist NFC?",
    answer:
      "Platzhalter – Hier kommt deine Erklärung zu NFC rein. Z. B.: NFC (Near Field Communication) ist eine drahtlose Technologie, mit der dein Geschenk per Smartphone-Berührung eine persönliche digitale Nachricht öffnet.",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    question: "Wie funktioniert die Gravur?",
    answer:
      "Platzhalter – Hier kommt dein Text zur Gravur. Z. B.: Jede Tasse und jedes Produkt wird individuell mit Laser graviert – präzise, dauerhaft und einzigartig.",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    question: "Sind meine Daten sicher?",
    answer:
      "Platzhalter – Hier kommt dein Sicherheitstext. Z. B.: Deine Daten werden verschlüsselt gespeichert, du bestimmst die Aufbewahrungsdauer, und du kannst jederzeit löschen.",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    question: "Wie richte ich mein Geschenk ein?",
    answer:
      "Platzhalter – Hier kommt deine Setup-Erklärung. Z. B.: Nach dem Kauf erhältst du einen persönlichen Link. Dort kannst du Nachrichten, Fotos und Videos für den Empfänger hinterlegen.",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    question: "Wer kann mein Geschenk sehen?",
    answer:
      "Platzhalter – Hier kommt dein Datenschutztext. Z. B.: Nur wer den Link hat, kann das Geschenk öffnen. Optional kannst du einen PIN setzen für noch mehr Schutz.",
    icon: <Lock className="w-5 h-5" />,
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-brand-border rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-brand-cream-tint transition-colors"
      >
        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-patina/10 text-brand-patina flex items-center justify-center">
          {item.icon}
        </span>
        <span className="flex-1 font-semibold text-brand-anthracite text-[15px] sm:text-base">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-brand-text transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="px-5 pb-5 pt-0 text-sm text-brand-text leading-relaxed pl-[4.25rem]">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function SocialLandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const source = searchParams.get("utm_source") || "";
    const medium = searchParams.get("utm_medium") || "";
    const campaign = searchParams.get("utm_campaign") || "";
    const referrer = document.referrer || "";

    try {
      logEvent(analytics, "landing_page_view", {
        utm_source: source || "direct",
        utm_medium: medium,
        utm_campaign: campaign,
        referrer,
      });
    } catch {
      // Analytics may be blocked by adblocker
    }
  }, [searchParams]);

  const trackClick = (buttonName) => {
    try {
      const source = searchParams.get("utm_source") || "direct";
      logEvent(analytics, "landing_cta_click", {
        button: buttonName,
        utm_source: source,
        referrer: document.referrer || "",
      });
    } catch {
      // Analytics may be blocked
    }
  };

  const etsyUrl = "https://www.etsy.com/shop/Kamlimos";

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-patina/5 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-5 pt-14 pb-10 sm:pt-20 sm:pb-14 text-center">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-brand-patina/10 rounded-2xl flex items-center justify-center mb-6 shadow-brand">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-brand-patina" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
            {/* PLATZHALTER – Dein Headline-Text */}
            Kamlimos
          </h1>
          <p className="text-lg sm:text-xl text-brand-patina font-display italic mb-6">
            Make it yours
          </p>

          <p className="text-brand-text text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
            {/* PLATZHALTER – Wer bist du, was macht Kamlimos? */}
            Platzhalter – Hier kommt dein Text: Wer du bist, was Kamlimos
            macht, warum deine Produkte besonders sind. Ich tausche das ein,
            sobald du mir den Text gibst.
          </p>
        </div>
      </header>

      {/* CTA Buttons */}
      <section className="max-w-md mx-auto px-5 pb-10">
        <div className="space-y-3">
          <a
            href={etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("etsy_shop")}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-brand-patina text-white font-semibold rounded-2xl hover:bg-brand-patina-hover transition-colors shadow-brand text-[15px] sm:text-base no-underline"
          >
            <ExternalLink className="w-5 h-5" />
            Zum Etsy Shop
          </a>

          <button
            disabled
            onClick={() => trackClick("website_coming_soon")}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-brand-cream-tint text-brand-text/50 font-semibold rounded-2xl border border-brand-border cursor-not-allowed text-[15px] sm:text-base relative overflow-hidden"
          >
            Website
            <span className="ml-2 text-xs bg-brand-patina/10 text-brand-patina px-2.5 py-0.5 rounded-full font-medium">
              Coming soon
            </span>
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-5 pb-10">
        <h2 className="text-2xl sm:text-3xl text-center mb-8">
          Häufige Fragen
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} item={item} />
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-md mx-auto px-5 pb-16 text-center">
        <div className="bg-white rounded-2xl border border-brand-border shadow-brand p-6 sm:p-8">
          <Mail className="w-8 h-8 text-brand-patina mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Noch Fragen?</h3>
          <p className="text-sm text-brand-text mb-4">
            Schreib uns – wir helfen dir gerne weiter.
          </p>
          <a
            href="mailto:kamlimos@kamlimos.de"
            className="inline-flex items-center gap-2 text-brand-patina font-semibold hover:text-brand-patina-hover transition-colors"
          >
            <Mail className="w-4 h-4" />
            kamlimos@kamlimos.de
          </a>
        </div>
      </section>

      {/* Hidden admin link */}
      <footer className="pb-8 text-center">
        <button
          onClick={() => navigate("/admin/login")}
          className="text-xs text-brand-text/30 hover:text-brand-text/60 transition-colors"
        >
          Admin
        </button>
      </footer>
    </div>
  );
}
