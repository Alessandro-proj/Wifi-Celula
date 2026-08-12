import { RadioTower, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="page-shell soft-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[640px] overflow-hidden rounded-lg border border-cyan-100 bg-white/78 p-8 shadow-2xl shadow-blue-950/10 backdrop-blur md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
              <RadioTower aria-hidden className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-700">WiFi Célula</p>
              <h1 className="text-2xl font-semibold text-slate-950">
                Conectados com Deus e uns com os outros
              </h1>
            </div>
          </div>

          <div className="relative mt-16 h-[420px]">
            <div className="absolute left-8 top-12 flex h-28 w-28 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shadow-lg shadow-cyan-900/10">
              <UsersRound aria-hidden className="h-12 w-12" />
            </div>
            <div className="absolute right-12 top-4 flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-700 shadow-lg shadow-violet-900/10">
              <Sparkles aria-hidden className="h-10 w-10" />
            </div>
            <div className="absolute bottom-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-100" />
            <div className="absolute inset-x-12 top-48 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-600 to-violet-600" />
            <div className="absolute left-24 top-32 h-4 w-4 rounded-full bg-blue-600" />
            <div className="absolute right-28 top-28 h-4 w-4 rounded-full bg-violet-600" />
            <div className="absolute bottom-28 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-emerald-500" />
            <div className="absolute bottom-0 left-0 right-0 rounded-lg border border-blue-100 bg-white/84 p-6 shadow-xl shadow-blue-950/10">
              <p className="text-sm font-medium text-blue-700">Cuidado com dados, leveza com pessoas</p>
              <p className="mt-2 text-3xl font-semibold leading-tight text-slate-950">
                Uma chamada rápida, histórico claro e acompanhamento pastoral respeitoso.
              </p>
            </div>
          </div>
        </section>

        <section className="card flex min-h-[620px] flex-col justify-center p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
              <RadioTower aria-hidden className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-700">WiFi Célula</p>
              <p className="text-base font-semibold text-slate-950">Conectados</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
