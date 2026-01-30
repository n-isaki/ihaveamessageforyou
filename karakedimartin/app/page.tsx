import Link from "next/link";
import { ArrowRight, BookOpen, Link as LinkIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
            Karakedimartin
          </h1>
          <p className="text-stone-400 text-lg">
            Gedankenwerkstatt & Notizen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/dashboard"
            className="group p-8 bg-stone-900 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all"
          >
            <BookOpen className="h-8 w-8 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Dashboard</h2>
            <p className="text-stone-400 mb-4">
              Verwalte deine Notizen und Links
            </p>
            <div className="flex items-center text-rose-500 group-hover:translate-x-1 transition-transform">
              Öffnen <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          <Link
            href="/public"
            className="group p-8 bg-stone-900 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all"
          >
            <LinkIcon className="h-8 w-8 text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Public Inhalte</h2>
            <p className="text-stone-400 mb-4">
              Öffentliche Notizen und Links
            </p>
            <div className="flex items-center text-emerald-500 group-hover:translate-x-1 transition-transform">
              Ansehen <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>
        </div>

        <div className="text-center text-stone-500 text-sm">
          <p>Privat & Public • Notizen • Links • Gedanken</p>
        </div>
      </div>
    </div>
  );
}
