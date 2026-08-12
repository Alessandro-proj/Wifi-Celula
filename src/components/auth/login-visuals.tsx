"use client";

import {
  BarChart3,
  CalendarCheck,
  Heart,
  Quote,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

export function WifiCellLogo() {
  return (
    <div className="flex items-center gap-4">
      <span className="login-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 80 80" className="h-16 w-16" role="img">
          <defs>
            <linearGradient id="wifi-logo-gradient" x1="12" x2="68" y1="12" y2="72">
              <stop stopColor="#2d74ff" />
              <stop offset="1" stopColor="#8037f6" />
            </linearGradient>
          </defs>
          <rect width="80" height="80" rx="20" fill="url(#wifi-logo-gradient)" />
          <path d="M24 28a26 26 0 0 1 32 0" fill="none" stroke="white" strokeLinecap="round" strokeWidth="5" />
          <path d="M31 36a15 15 0 0 1 18 0" fill="none" stroke="white" strokeLinecap="round" strokeWidth="5" opacity=".9" />
          <path d="M27 56V44l13-11 13 11v12" fill="white" opacity=".96" />
          <path d="M37 56V45h8v11" fill="#633cf2" opacity=".8" />
          <path d="M40 29v10" stroke="white" strokeLinecap="round" strokeWidth="4" />
        </svg>
      </span>
      <span>
        <span className="block text-5xl font-bold leading-none tracking-[-0.02em] text-slate-950 sm:text-6xl">WiFi</span>
        <span className="login-script block text-4xl font-bold leading-none text-violet-600 sm:text-5xl">Célula</span>
      </span>
    </div>
  );
}

export function LoginBrandPanel() {
  const features = [
    {
      icon: UsersRound,
      title: "Gestão de pessoas",
      text: "Acompanhe visitantes, integrantes e aniversariantes.",
      tone: "violet",
    },
    {
      icon: CalendarCheck,
      title: "Encontros e presenças",
      text: "Registre presenças e organize encontros com facilidade.",
      tone: "purple",
    },
    {
      icon: BarChart3,
      title: "Relatórios inteligentes",
      text: "Informações claras para acompanhar o crescimento da célula.",
      tone: "cyan",
    },
  ] as const;

  return (
    <section className="login-brand-panel order-2 overflow-hidden rounded-[28px] p-6 sm:p-8 lg:order-1 lg:min-h-[720px] lg:p-10 xl:min-h-[760px] xl:p-12">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <div className="login-particles" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="relative z-10">
        <WifiCellLogo />

        <div className="mt-10 h-1 w-10 rounded-full bg-cyan-300" />
        <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight tracking-[-0.02em] text-slate-950 sm:text-5xl">
          Conectados com <span className="login-gradient-text">Deus</span>
          <br />e <span className="login-gradient-text">uns com os outros</span>
        </h1>
        <p className="mt-5 max-w-md text-lg font-medium leading-8 text-slate-600">
          Ferramentas simples para uma gestão pastoral eficiente e acolhedora.
        </p>

        <div className="mt-6 grid gap-3 md:max-w-xl xl:mt-8 xl:gap-4">
          {features.map((feature, index) => (
            <LoginFeatureItem
              key={feature.title}
              icon={feature.icon}
              index={index}
              text={feature.text}
              title={feature.title}
              tone={feature.tone}
            />
          ))}
        </div>
      </div>

      <div className="login-visual-stage relative z-0 mt-6 lg:absolute lg:bottom-5 lg:left-8 lg:right-8">
        <ChurchIllustration />
        <VerseCard />
      </div>
    </section>
  );
}

function LoginFeatureItem({
  icon: Icon,
  index,
  text,
  title,
  tone,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  index: number;
  text: string;
  title: string;
  tone: "violet" | "purple" | "cyan";
}) {
  const tones = {
    violet: "bg-violet-100/70 text-violet-700 shadow-violet-900/10",
    purple: "bg-purple-100/70 text-purple-700 shadow-purple-900/10",
    cyan: "bg-cyan-100/80 text-cyan-700 shadow-cyan-900/10",
  };

  return (
    <article
      className="login-feature flex items-center gap-4 rounded-2xl border border-white/40 bg-white/18 p-3 backdrop-blur-sm"
      style={{ animationDelay: `${index * 120 + 160}ms` }}
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg ${tones[tone]}`}>
        <Icon aria-hidden className="h-7 w-7" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{text}</span>
      </span>
    </article>
  );
}

export function ChurchIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="login-church-illustration mx-auto block h-auto w-full max-w-[620px]"
      viewBox="0 0 680 360"
      fill="none"
    >
      <defs>
        <linearGradient id="hill-gradient" x1="0" x2="680" y1="280" y2="360">
          <stop stopColor="#dfe7ff" />
          <stop offset=".55" stopColor="#c8cdfd" />
          <stop offset="1" stopColor="#9fb7ff" />
        </linearGradient>
        <linearGradient id="church-body" x1="250" x2="430" y1="112" y2="292">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#e9e5ff" />
        </linearGradient>
        <linearGradient id="church-roof" x1="210" x2="470" y1="118" y2="180">
          <stop stopColor="#8d71ff" />
          <stop offset="1" stopColor="#5133d9" />
        </linearGradient>
        <radialGradient id="window-glow" cx="0" cy="0" r="1" gradientTransform="translate(340 247) rotate(90) scale(52 38)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffc77f" />
          <stop offset=".58" stopColor="#fb9f67" />
          <stop offset="1" stopColor="#6c3af4" />
        </radialGradient>
        <filter id="soft-shadow" x="120" y="20" width="440" height="320" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="20" stdDeviation="16" floodColor="#5748e8" floodOpacity=".22" />
        </filter>
      </defs>

      <path d="M0 288c70-32 126-34 192-5 68 30 116 27 185-1 96-39 166-29 303 12v66H0v-72z" fill="url(#hill-gradient)" opacity=".8" />
      <path d="M0 313c101-29 182-20 247 5 76 29 149 9 211-7 89-23 141-6 222 21v28H0v-47z" fill="#8da8ff" opacity=".28" />

      <g className="login-wifi-float" opacity=".5">
        <path d="M279 52a92 92 0 0 1 122 0" stroke="#7d6cf6" strokeLinecap="round" strokeWidth="16" />
        <path d="M307 83a50 50 0 0 1 66 0" stroke="#7d6cf6" strokeLinecap="round" strokeWidth="14" />
        <circle cx="340" cy="116" r="12" fill="#7d6cf6" />
      </g>

      <g filter="url(#soft-shadow)">
        <path d="M255 167h170v132H255V167z" fill="url(#church-body)" />
        <path d="M340 92 223 179h234L340 92z" fill="url(#church-roof)" />
        <path d="M424 198h96v101h-96v-101z" fill="#e5e1ff" />
        <path d="M424 198 370 159l150 39h-96z" fill="#5f41e8" opacity=".86" />
        <path d="M160 213h95v86h-95v-86z" fill="#efecff" />
        <path d="M160 213 255 167v46h-95z" fill="#7d61f5" opacity=".92" />
        <path d="M313 299v-56c0-20 13-36 27-36s27 16 27 36v56h-54z" fill="url(#window-glow)" />
        <path d="M313 299v-56c0-20 13-36 27-36s27 16 27 36v56" stroke="#6044dc" strokeWidth="4" opacity=".45" />
        <path d="M340 80v-39M323 57h34" stroke="#6145e4" strokeLinecap="round" strokeWidth="9" />
        <rect x="286" y="194" width="23" height="48" rx="11.5" fill="#ffd280" opacity=".82" />
        <rect x="371" y="194" width="23" height="48" rx="11.5" fill="#ffd280" opacity=".82" />
        <rect x="184" y="240" width="20" height="40" rx="10" fill="#ffd280" opacity=".78" />
        <rect x="473" y="234" width="20" height="44" rx="10" fill="#ffd280" opacity=".78" />
      </g>

      <path d="M126 302c0-26 16-47 35-47s35 21 35 47" fill="#8c69f6" opacity=".5" />
      <path d="M530 306c0-32 19-58 42-58s42 26 42 58" fill="#7654e8" opacity=".42" />
      <path d="M92 315c0-18 13-33 29-33s29 15 29 33" fill="#25bcd3" opacity=".35" />
      <circle cx="117" cy="92" r="5" fill="#5e8df8" opacity=".75" />
      <circle cx="514" cy="93" r="5" fill="#8b5cf6" opacity=".75" />
      <circle cx="580" cy="244" r="7" fill="#8b5cf6" opacity=".5" />
      <circle cx="216" cy="118" r="4" fill="#38bdf8" opacity=".8" />
    </svg>
  );
}

function VerseCard() {
  return (
    <div className="login-verse-card relative z-10 mx-auto max-w-[460px] rounded-[22px] border border-white/60 bg-white/82 p-5 shadow-xl shadow-violet-900/10 backdrop-blur-md sm:p-6 lg:ml-8 lg:mr-auto">
      <Quote aria-hidden className="h-9 w-9 fill-violet-600 text-violet-600" />
      <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
        Portanto, ide e fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo.
      </p>
      <p className="mt-3 text-sm font-bold text-violet-700">Mateus 28:19</p>
    </div>
  );
}

export function DecorativeLockIllustration() {
  return (
    <div className="login-lock-illustration relative mx-auto flex h-32 w-44 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-x-8 top-5 h-24 rounded-full bg-violet-100 blur-xl" />
      <svg viewBox="0 0 176 128" className="relative h-32 w-44">
        <defs>
          <linearGradient id="lock-grad" x1="70" x2="112" y1="34" y2="92">
            <stop stopColor="#2c6df8" />
            <stop offset="1" stopColor="#7c35f3" />
          </linearGradient>
        </defs>
        <circle cx="88" cy="64" r="45" fill="#f0eaff" />
        <circle cx="88" cy="64" r="43" stroke="#fff" strokeWidth="4" />
        <path d="M68 61h40v31H68V61z" fill="white" stroke="url(#lock-grad)" strokeLinejoin="round" strokeWidth="4" />
        <path d="M77 61V50c0-12 8-21 20-21s20 9 20 21v11" stroke="url(#lock-grad)" strokeLinecap="round" strokeWidth="4" />
        <circle cx="88" cy="76" r="4" fill="#6d3ef2" />
        <path d="M88 80v7" stroke="#6d3ef2" strokeLinecap="round" strokeWidth="3" />
        <path d="M38 72c-16 3-25 13-29 29 17-3 29-12 37-27" stroke="#8c7cf6" strokeLinecap="round" strokeWidth="4" />
        <path d="M30 84c-8-6-13-12-15-20 12 2 22 8 28 18" stroke="#ad9bff" strokeLinecap="round" strokeWidth="4" />
        <path d="M138 72c16 3 25 13 29 29-17-3-29-12-37-27" stroke="#8c7cf6" strokeLinecap="round" strokeWidth="4" />
        <path d="M146 84c8-6 13-12 15-20-12 2-22 8-28 18" stroke="#ad9bff" strokeLinecap="round" strokeWidth="4" />
        <circle cx="38" cy="34" r="4" fill="#7c3aed" opacity=".55" />
        <circle cx="137" cy="30" r="4" fill="#7c3aed" opacity=".55" />
        <path d="M52 42h9M56.5 37.5v9M126 45h9M130.5 40.5v9" stroke="#7c3aed" strokeLinecap="round" strokeWidth="3" opacity=".7" />
      </svg>
    </div>
  );
}

export function LoginFooterMark() {
  return (
    <div className="mt-16 text-center">
      <div className="flex items-center gap-5">
        <span className="h-px flex-1 bg-slate-200" />
        <Heart aria-hidden className="h-5 w-5 fill-violet-600 text-violet-600" />
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <p className="mt-8 text-sm font-medium text-slate-500">
        Servir a Deus e às pessoas é o que nos conecta.
      </p>
    </div>
  );
}
