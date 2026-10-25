"use client";

import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(event: FormEvent) {
    event.preventDefault();

    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo iniciar sesión"
        );
      }

      window.location.href = "/admin";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
      <form
        onSubmit={iniciarSesion}
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#111] p-8"
      >
        <div className="text-center">
          <img
            src="/barber-vipp-logo.png"
            alt="Barber VIPP"
            className="mx-auto h-28 w-28 rounded-full object-cover"
          />

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-yellow-500">
            BARBER VIPP
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Panel Admin
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Acceso exclusivo del peluquero.
          </p>
        </div>

        <label className="mt-8 block text-sm text-neutral-400">
          Contraseña
        </label>

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black p-4 outline-none focus:border-yellow-500"
        />

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          disabled={cargando}
          className="mt-6 w-full rounded-xl bg-yellow-500 py-4 font-black text-black disabled:opacity-50"
        >
          {cargando
            ? "INGRESANDO..."
            : "INGRESAR"}
        </button>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-neutral-500 hover:text-white"
        >
          ← Volver a Barber VIPP
        </a>
      </form>
    </main>
  );
}