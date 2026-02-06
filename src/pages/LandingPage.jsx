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
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto h-24 w-24 bg-rose-100 rounded-full flex items-center justify-center animate-bounce-slow">
          <Gift className="h-12 w-12 text-rose-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-stone-900">
            Willkommen
          </h1>
          <p className="text-lg text-stone-600">
            Du hast ein besonderes Geschenk erhalten. Gib unten deinen Code ein,
            um deine Nachricht zu öffnen.
          </p>
          <p className="text-sm text-stone-500">
            Wo findest du den Code? Auf der Geschenkkarte (z.B. neben dem
            QR-Code) oder in der Nachricht, die dir der Absender geschickt hat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              required
              value={giftId}
              onChange={(e) => setGiftId(e.target.value)}
              className="block w-full px-4 py-4 text-center text-lg tracking-widest border-stone-300 rounded-full focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400"
              placeholder="Geschenk-Code hier eingeben"
            />
          </div>

          <button
            type="submit"
            disabled={!giftId}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-rose-300 transition-all transform hover:scale-105"
          >
            Geschenk öffnen <ArrowRight className="ml-2 h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
