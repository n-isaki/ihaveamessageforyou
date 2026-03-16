import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
    question: "Was ist NFC & der Magic Key?",
    answer:
      "In unseren Geschenken – den Magic Keys – ist ein winziger, unsichtbarer NFC-Chip versteckt. Wenn dein Lieblingsmensch sein Smartphone (egal ob Apple oder Android) einfach an das Geschenk hält, öffnet sich wie von Zauberhand deine ganz persönliche, digitale Nachricht auf dem Display. Kein Kabel, kein QR-Code scannen, keine App – einfach dranhalten und staunen!",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    question: "Wie funktioniert die Gravur?",
    answer:
      "Wir setzen auf modernste, hochpräzise Lasergravur, die ein Leben lang hält. Bei der Tassengravur arbeitet der Laser dein Wunschmotiv oder deinen Text tief in die Keramik ein – spürbar, unverwüstlich und zu 100 % spülmaschinenfest. Bei unseren schwarzen Metall-Schlüsselanhängern trägt der Laser mikrometergenau die oberste Schicht ab, sodass das helle Metall darunter zum Vorschein kommt. So verewigen wir Texte und sogar detailreiche, hochauflösende Fotos extrem langlebig und kratzfest.",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    question: "Sind meine Daten sicher?",
    answer:
      "Deine Privatsphäre hat für uns höchste Priorität. Deine Daten werden streng verschlüsselt gespeichert. Du bestimmst bei der Einrichtung ganz allein die Aufbewahrungsdauer deiner Botschaft – von einer Woche über einen Monat bis hin zu 1, 3 oder 5 Jahren. Und wenn du deine Daten doch schon früher löschen möchtest? Gar kein Problem! Schreib uns einfach eine kurze Nachricht mit deiner Bestellnummer, und wir löschen deine Daten sofort und unwiderruflich aus dem System.",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    question: "Wie richte ich mein Geschenk ein?",
    answer:
      "100 % Privatsphäre – du richtest alles ganz bequem von zu Hause aus ein! Du musst uns vorab keine privaten Dateien oder Bilder schicken. Sobald dein Paket bei dir ankommt, scannst du einfach den Code auf dem Geschenk mit deinem Smartphone – und schon kannst du direkt mit der Einrichtung loslegen. Schreib persönliche Nachrichten, lade eure schönsten gemeinsamen Fotos und Videos hoch, füge einen Spotify-Link hinzu – alles in wenigen Sekunden, direkt auf deinem Handy. Wenn du das Geschenk dann übergibst, ist die digitale Überraschung perfekt vorbereitet!",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    question: "Wer kann mein Geschenk sehen?",
    answer:
      "Deine persönliche Botschaft bleibt dein Geheimnis! Nur wer das physische Geschenk in den Händen hält und den Chip scannt (oder den exakten Direktlink besitzt), kann deine Nachricht öffnen. All unsere Links sind so konfiguriert, dass sie nicht von Google oder anderen Suchmaschinen indexiert werden – man kann sie im Internet also nicht über die Suche finden. Optional kannst du deine Botschaft bei der Einrichtung zusätzlich mit einem persönlichen PIN-Code sichern. So kann wirklich niemand außer deinem Lieblingsmenschen die Überraschung sehen!",
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
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"}`}
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
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-6 shadow-brand-lg border-2 border-brand-border">
            <img src="/sea.png" alt="Sea – Gründerin von Kamlimos" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
            Kamlimos
          </h1>

          <p className="text-brand-text text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
            Hallo, ich bin Sea, die Gründerin von Kamlimos! Ich bin das kreative
            Herz unseres Shops, entwerfe mit viel Leidenschaft unsere Designs und
            kümmere mich im Kundenservice ganz persönlich um all eure Fragen,
            individuellen Wünsche und die perfekte Organisation eurer Geschenke.
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

      <footer className="pb-8" />
    </div>
  );
}
