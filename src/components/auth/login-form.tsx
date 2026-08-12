"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "@/lib/schemas";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "success" | "offline" | "demo">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setMessage(null);
    setStatus("idle");
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setStatus("demo");
      setMessage("Modo de desenvolvimento ativo. Entrando com dados demonstrativos.");
      router.push(next);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setStatus("error");
        setMessage("Não foi possível entrar. Verifique seu e-mail e sua senha.");
        return;
      }
    } catch {
      setStatus("offline");
      setMessage("Não foi possível conectar agora. Confira sua internet e tente novamente.");
      return;
    }

    setStatus("success");
    setMessage("Login realizado com sucesso. Redirecionando...");
    router.push(next);
    router.refresh();
  }

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-semibold text-slate-800" htmlFor="email">
          E-mail
        </label>
        <div className={`login-input-wrap mt-3 ${errors.email ? "login-input-error" : ""}`}>
          <Mail aria-hidden className="h-5 w-5 text-slate-500" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 placeholder:text-slate-400"
            placeholder="seu@email.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <PasswordInput
        error={errors.password}
        inputProps={register("password")}
        onToggle={() => setShowPassword((current) => !current)}
        showPassword={showPassword}
      />

      <label className="group flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          className="h-5 w-5 rounded-md border-slate-300 text-violet-600 transition focus:ring-violet-300"
          {...register("remember")}
        />
        Lembrar-me neste dispositivo
      </label>

      {message && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            status === "error" || status === "offline"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-blue-100 bg-blue-50 text-blue-800"
          }`}
          role={status === "error" || status === "offline" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="login-submit-button flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-4 text-lg font-bold text-white shadow-xl shadow-blue-600/24 transition disabled:cursor-not-allowed disabled:opacity-75"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 aria-hidden className="h-5 w-5" />
        ) : (
          <LogIn aria-hidden className="h-5 w-5" />
        )}
        Entrar
      </button>
    </form>
  );
}

function PasswordInput({
  error,
  inputProps,
  onToggle,
  showPassword,
}: {
  error?: FieldError;
  inputProps: UseFormRegisterReturn;
  onToggle: () => void;
  showPassword: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800" htmlFor="password">
        Senha
      </label>
      <div className={`login-input-wrap mt-3 ${error ? "login-input-error" : ""}`}>
        <LockKeyhole aria-hidden className="h-5 w-5 text-slate-500" />
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 placeholder:text-slate-400"
          placeholder="Digite sua senha"
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        <button
          type="button"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
          onClick={onToggle}
        >
          {showPassword ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
