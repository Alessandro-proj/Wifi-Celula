"use client";

import { Suspense } from "react";
import { LoginForm } from "./login-form";
import {
  DecorativeLockIllustration,
  LoginBrandPanel,
  LoginFooterMark,
  WifiCellLogo,
} from "./login-visuals";

export function LoginPage() {
  return (
    <main className="login-page-shell min-h-screen px-4 py-4 sm:px-6 lg:p-5">
      <div className="login-main-card mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1680px] gap-0 overflow-hidden rounded-[28px] bg-white shadow-[0_28px_100px_rgba(54,54,120,0.16)] lg:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.96fr)]">
        <LoginBrandPanel />

        <section className="order-1 flex min-h-[calc(100vh-2rem)] flex-col justify-center bg-white px-5 py-6 sm:px-8 sm:py-8 lg:order-2 lg:min-h-full lg:px-10 xl:px-16">
          <div className="mx-auto w-full max-w-[520px]">
            <div className="login-mobile-logo mb-5 flex justify-center sm:mb-8 lg:hidden">
              <WifiCellLogo />
            </div>

            <DecorativeLockIllustration />

            <div className="mt-5 text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-[-0.015em] text-slate-950 sm:text-4xl">
                Bem-vindo de volta!
              </h1>
              <p className="mt-4 max-w-md text-base font-medium leading-7 text-slate-500">
                Entre para registrar presenças, acompanhar pessoas e cuidar da rotina da célula WiFi.
              </p>
            </div>

            <div className="mt-7 sm:mt-10">
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>

            <LoginFooterMark />
          </div>
        </section>
      </div>
    </main>
  );
}
