import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const [giftId, setGiftId] = useState(searchParams.get("id") || "");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (giftId.trim()) {
      navigate(`/gift/${giftId}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto h-24 w-24 bg-brand-patina/10 rounded-full flex items-center justify-center shadow-brand">
          <Gift className="h-12 w-12 text-brand-patina" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-brand-anthracite">
            Willkommen
          </h1>
          <p className="text-lg text-brand-text">
            Du hast ein besonderes Geschenk erhalten. Gib unten deinen Code ein,
            um deine Nachricht zu öffnen.
          </p>
          <p className="text-sm text-brand-text/80">
            Wo findest du den Code? Auf der Geschenkkarte (z.B. neben dem
            QR-Code) oder in der Nachricht, die dir der Absender geschickt hat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative rounded-lg shadow-brand">
            <input
              type="text"
              required
              value={giftId}
              onChange={(e) => setGiftId(e.target.value)}
              className="input-base block w-full px-4 py-4 text-center text-lg tracking-widest rounded-lg"
              placeholder="Geschenk-Code hier eingeben"
            />
          </div>

          <button
            type="submit"
            disabled={!giftId}
            className="btn-primary w-full flex justify-center py-4 px-4 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02]"
          >
            Geschenk öffnen <ArrowRight className="ml-2 h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
