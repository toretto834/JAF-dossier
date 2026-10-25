"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Scale } from "lucide-react";

export function AuthScreen() {
  const [bootstrap, setBootstrap] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetch("/api/auth/status").then((r) => r.json()).then((d) => setBootstrap(d.needsBootstrap)).catch(() => setError("Impossible de joindre l’application.")); }, []);

  async function submit(formData: FormData) {
    setLoading(true); setError("");
    const body = Object.fromEntries(formData.entries());
    const response = await fetch(bootstrap ? "/api/auth/bootstrap" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Connexion impossible"); setLoading(false); return; }
    window.location.href = "/dossier";
  }

  return <main className="min-h-screen bg-[#ede9df] p-4 md:p-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(36,50,42,.16)] lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-12 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative">
          <div className="mb-14 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Scale size={23}/></span><span className="text-xl font-semibold tracking-tight">JAF Dossier</span></div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[#cce1d4]">Préparation documentaire</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-[-.04em]">Un dossier clair, factuel et vérifiable pour votre avocat.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#dce9e0]">Centralisez les faits, reliez chaque pièce et préparez les points à faire arbitrer — sans jugement automatique ni prédiction.</p>
        </div>
        <div className="relative grid gap-4 text-sm text-[#dce9e0] sm:grid-cols-3">
          {[['Données locales',LockKeyhole],['Originaux préservés',FileCheck2],['Traçabilité',CheckCircle2]].map(([label, Icon]: any) => <div key={label} className="flex items-center gap-2"><Icon size={17}/><span>{label}</span></div>)}
        </div>
      </section>
      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-white"><Scale size={23}/></span><span className="text-xl font-semibold">JAF Dossier</span></div>
          <p className="text-sm font-semibold text-forest">{bootstrap ? "Première ouverture" : "Espace confidentiel"}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.03em]">{bootstrap ? "Créer le compte local" : "Heureux de vous revoir"}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">{bootstrap ? "Ce compte sera l’unique propriétaire initial des dossiers stockés sur cette installation." : "Connectez-vous pour retrouver vos dossiers et vos pièces."}</p>
          {bootstrap === null && !error ? <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-forest" /></div> :
          <form action={submit} className="mt-8 space-y-5">
            {bootstrap && <label><span className="label">Nom affiché</span><input className="field" name="displayName" required minLength={2} autoComplete="name" placeholder="Votre prénom ou vos initiales" /></label>}
            <label><span className="label">Adresse e-mail</span><input className="field" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" /></label>
            <label><span className="label">Mot de passe</span><input className="field" name="password" type="password" required minLength={bootstrap ? 12 : 1} autoComplete={bootstrap ? "new-password" : "current-password"} placeholder={bootstrap ? "12 caractères minimum" : "Votre mot de passe"} /></label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Veuillez patienter…" : bootstrap ? "Créer mon espace" : "Se connecter"}<ArrowRight size={17}/></button>
          </form>}
          <p className="mt-8 border-t border-line pt-6 text-xs leading-5 text-stone-500">JAF Dossier est un outil de préparation documentaire. Il ne remplace ni l’analyse ni le conseil de votre avocat.</p>
        </div>
      </section>
    </div>
  </main>;
}
