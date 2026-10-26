"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Turno = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  servicio: string;
  precio: number | null;
  fecha: string;
  hora: string;
  forma_pago: string;
  estado: string;
  barbero_id: number;
  barbero_nombre: string;
};

type ServicioAdmin = {
  id: number;
  nombre: string;
  precio: number | null;
  duracion_minutos?: number | null;
  activo: boolean;
};

type HorarioAdmin = {
  id: number;
  hora: string;
  activo: boolean;
};

type BarberoAdmin = {
  id: number;
  nombre: string;
  activo: boolean;
};

type PropuestaCambio = {
  fecha: string;
  hora: string;
  enviada: boolean;
};

type Filtro =
  | "hoy"
  | "proximos"
  | "historial"
  | "cancelados";

type Props = {
  turnos?: Turno[];
  servicios?: ServicioAdmin[];
  horarios?: HorarioAdmin[];
  barberos?: BarberoAdmin[];
};

const STORAGE_PROPUESTAS =
  "barber_vipp_propuestas_turnos";

function obtenerHoy() {
  const ahora = new Date();

  const año =
    ahora.getFullYear();

  const mes = String(
    ahora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    ahora.getDate()
  ).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

function formatearFecha(
  fecha: string
) {
  const partes =
    fecha.split("-");

  if (
    partes.length !== 3
  ) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function prepararNumeroWhatsApp(
  telefono: string
) {
  let numero =
    telefono.replace(
      /\D/g,
      ""
    );

  numero =
    numero.replace(
      /^0+/,
      ""
    );

  if (!numero) {
    return "";
  }

  if (
    numero.startsWith(
      "549"
    )
  ) {
    return numero;
  }

  if (
    numero.startsWith(
      "54"
    )
  ) {
    const resto =
      numero.slice(2);

    if (
      resto.startsWith(
        "9"
      )
    ) {
      return `54${resto}`;
    }

    return `549${resto}`;
  }

  if (
    numero.startsWith(
      "9"
    )
  ) {
    return `54${numero}`;
  }

  return `549${numero}`;
}

function crearLinkWhatsApp(
  telefono: string,
  mensaje: string
) {
  const numero =
    prepararNumeroWhatsApp(
      telefono
    );

  if (!numero) {
    return "";
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    mensaje
  )}`;
}

function mensajePropuesta(
  turno: Turno,
  propuesta: PropuestaCambio
) {
  return (
    `Hola ${turno.nombre} 👋\n\n` +
    `Te escribimos de Barber VIPP por tu turno de ${turno.servicio}.\n\n` +
    `Necesitamos proponerte un cambio de horario:\n\n` +
    `💈 Turno actual:\n` +
    `📅 ${formatearFecha(
      turno.fecha
    )}\n` +
    `🕐 ${String(
      turno.hora
    ).slice(0, 5)}\n\n` +
    `✂️ Nuevo turno propuesto:\n` +
    `📅 ${formatearFecha(
      propuesta.fecha
    )}\n` +
    `🕐 ${propuesta.hora}\n` +
    `💈 Barbero: ${turno.barbero_nombre}\n\n` +
    `¿Podés confirmarnos por acá si te queda bien el nuevo día y horario?\n\n` +
    `¡Gracias!`
  );
}

function mensajeConfirmacion(
  turno: Turno,
  fecha: string,
  hora: string
) {
  return (
    `Hola ${turno.nombre} 👋\n\n` +
    `¡Perfecto! Te confirmamos que tu turno en Barber VIPP quedó reprogramado correctamente.\n\n` +
    `✂️ Servicio: ${turno.servicio}\n` +
    `💈 Barbero: ${turno.barbero_nombre}\n` +
    `📅 Fecha: ${formatearFecha(
      fecha
    )}\n` +
    `🕐 Horario: ${hora}\n\n` +
    `¡Te esperamos! 💈`
  );
}

export default function AdminAgenda({
  turnos = [],
  servicios = [],
  horarios = [],
  barberos = [],
}: Props) {
  const router =
    useRouter();

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      "hoy"
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    precios,
    setPrecios,
  ] =
    useState<
      Record<
        number,
        string
      >
    >(() =>
      Object.fromEntries(
        servicios.map(
          (
            servicio
          ) => [
            servicio.id,
            servicio.precio ===
            null
              ? ""
              : String(
                  servicio.precio
                ),
          ]
        )
      )
    );

  const [
    nuevoBarbero,
    setNuevoBarbero,
  ] =
    useState("");

  const [
    agregandoBarbero,
    setAgregandoBarbero,
  ] =
    useState(false);

  const [
    procesandoBarbero,
    setProcesandoBarbero,
  ] =
    useState<
      number | null
    >(null);

  const [
    procesandoServicio,
    setProcesandoServicio,
  ] =
    useState<
      number | null
    >(null);

  const [
    procesandoHorario,
    setProcesandoHorario,
  ] =
    useState<
      number | null
    >(null);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] =
    useState(false);

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const hoy =
    obtenerHoy();

  useEffect(() => {
    setPrecios(
      Object.fromEntries(
        servicios.map(
          (
            servicio
          ) => [
            servicio.id,
            servicio.precio ===
            null
              ? ""
              : String(
                  servicio.precio
                ),
          ]
        )
      )
    );
  }, [servicios]);

  const cantidadHoy =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha ===
          hoy
    ).length;

  const cantidadProximos =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha > hoy
    ).length;

  const cantidadHistorial =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha < hoy
    ).length;

  const cantidadCancelados =
    turnos.filter(
      (turno) =>
        turno.estado ===
        "cancelado"
    ).length;

  const turnosFiltrados =
    turnos.filter(
      (turno) => {
        if (
          filtro ===
            "hoy" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha ===
              hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "proximos" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha >
              hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "historial" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha <
              hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "cancelados" &&
          turno.estado !==
            "cancelado"
        ) {
          return false;
        }

        const texto =
          `${turno.nombre} ${turno.apellido} ${turno.telefono} ${turno.barbero_nombre}`.toLowerCase();

        return texto.includes(
          busqueda
            .trim()
            .toLowerCase()
        );
      }
    );

  async function cerrarSesion() {
    setCerrandoSesion(
      true
    );

    await fetch(
      "/api/admin/logout",
      {
        method:
          "POST",
      }
    );

    window.location.href =
      "/admin/login";
  }

  async function agregarBarbero() {
    const nombre =
      nuevoBarbero.trim();

    if (!nombre) {
      setError(
        "Ingresá el nombre del barbero."
      );

      return;
    }

    setAgregandoBarbero(
      true
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                nombre,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo agregar el barbero"
        );
      }

      setNuevoBarbero(
        ""
      );

      setMensaje(
        `${resultado.barbero.nombre} agregado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo agregar el barbero"
      );
    } finally {
      setAgregandoBarbero(
        false
      );
    }
  }

  async function cambiarBarbero(
    barbero: BarberoAdmin
  ) {
    setProcesandoBarbero(
      barbero.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                id:
                  barbero.id,

                activo:
                  !barbero.activo,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar el barbero"
        );
      }

      setMensaje(
        `${resultado.barbero.nombre} actualizado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo actualizar el barbero"
      );
    } finally {
      setProcesandoBarbero(
        null
      );
    }
  }

  async function eliminarBarbero(
    barbero: BarberoAdmin
  ) {
    const confirmar =
      window.confirm(
        `¿Eliminar definitivamente a ${barbero.nombre}?`
      );

    if (!confirmar) {
      return;
    }

    setProcesandoBarbero(
      barbero.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                id:
                  barbero.id,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo eliminar el barbero"
        );
      }

      setMensaje(
        `${resultado.nombre} eliminado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo eliminar el barbero"
      );
    } finally {
      setProcesandoBarbero(
        null
      );
    }
  }

  async function actualizarServicio(
    servicio: ServicioAdmin,
    cambios: {
      precio?: number;
      activo?: boolean;
    }
  ) {
    setProcesandoServicio(
      servicio.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/servicios",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                id:
                  servicio.id,
                ...cambios,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar el servicio"
        );
      }

      setMensaje(
        `${resultado.servicio.nombre} actualizado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo actualizar el servicio"
      );
    } finally {
      setProcesandoServicio(
        null
      );
    }
  }

  async function guardarPrecio(
    servicio: ServicioAdmin
  ) {
    const precio =
      Number(
        precios[
          servicio.id
        ]
      );

    if (
      !Number.isInteger(
        precio
      ) ||
      precio < 0
    ) {
      setError(
        "Ingresá un precio válido."
      );

      return;
    }

    await actualizarServicio(
      servicio,
      {
        precio,
      }
    );
  }

  async function cambiarServicio(
    servicio: ServicioAdmin
  ) {
    await actualizarServicio(
      servicio,
      {
        activo:
          !servicio.activo,
      }
    );
  }

  async function cambiarHorario(
    horario: HorarioAdmin
  ) {
    setProcesandoHorario(
      horario.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/horarios",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                id:
                  horario.id,

                activo:
                  !horario.activo,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar el horario"
        );
      }

      setMensaje(
        "Horario actualizado correctamente."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo actualizar el horario"
      );
    } finally {
      setProcesandoHorario(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <img
              src="/barber-vipp-logo.png"
              alt="Barber VIPP"
              className="h-16 w-16 rounded-full object-contain"
            />

            <div>
              <p className="font-black tracking-[0.2em] text-[#e6db61]">
                BARBER VIPP
              </p>

              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Panel administrador
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold"
            >
              Ver web
            </a>

            <button
              type="button"
              onClick={
                cerrarSesion
              }
              disabled={
                cerrandoSesion
              }
              className="rounded-full border border-red-500/40 px-5 py-3 text-sm font-bold text-red-400"
            >
              {cerrandoSesion
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#e6db61]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Panel Barber VIPP
        </h1>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* BARBEROS */}
        <section className="mt-10 rounded-[30px] border border-white/10 bg-[#101010] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e6db61]">
            Equipo
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Barberos
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={
                nuevoBarbero
              }
              onChange={(e) =>
                setNuevoBarbero(
                  e.target.value
                )
              }
              placeholder="Nombre del nuevo barbero"
              className="flex-1 rounded-2xl border border-white/10 bg-black p-4 outline-none focus:border-[#e6db61]"
            />

            <button
              type="button"
              onClick={
                agregarBarbero
              }
              disabled={
                agregandoBarbero
              }
              className="rounded-full bg-[#e6db61] px-6 py-4 font-black text-black disabled:opacity-50"
            >
              + AGREGAR BARBERO
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barberos.map(
              (barbero) => (
                <div
                  key={
                    barbero.id
                  }
                  className="rounded-3xl border border-white/10 bg-black p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-black">
                        💈{" "}
                        {
                          barbero.nombre
                        }
                      </p>
                    </div>

                    <span
                      className={
                        barbero.activo
                          ? "text-xs font-black text-green-400"
                          : "text-xs font-black text-red-400"
                      }
                    >
                      {barbero.activo
                        ? "ACTIVO"
                        : "INACTIVO"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarBarbero(
                        barbero
                      )
                    }
                    disabled={
                      procesandoBarbero ===
                      barbero.id
                    }
                    className="mt-5 w-full rounded-full bg-white/10 py-3 font-black"
                  >
                    {barbero.activo
                      ? "DESACTIVAR"
                      : "ACTIVAR"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarBarbero(
                        barbero
                      )
                    }
                    disabled={
                      procesandoBarbero ===
                      barbero.id
                    }
                    className="mt-3 w-full rounded-full border border-red-500/30 py-3 font-black text-red-400"
                  >
                    ELIMINAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* SERVICIOS */}
        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#101010] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e6db61]">
            Servicios
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Servicios y precios
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {servicios.map(
              (servicio) => {
                const esColor =
                  servicio.nombre
                    .trim()
                    .toLowerCase() ===
                  "color";

                return (
                  <div
                    key={
                      servicio.id
                    }
                    className="rounded-3xl border border-white/10 bg-black p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black">
                        ✂️{" "}
                        {
                          servicio.nombre
                        }
                      </p>

                      <span
                        className={
                          servicio.activo
                            ? "text-xs font-black text-green-400"
                            : "text-xs font-black text-red-400"
                        }
                      >
                        {servicio.activo
                          ? "ACTIVO"
                          : "INACTIVO"}
                      </span>
                    </div>

                    {!esColor && (
                      <>
                        <label className="mt-5 block text-xs font-bold text-white/50">
                          Precio
                        </label>

                        <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#111] px-4">
                          <span className="font-black text-[#e6db61]">
                            $
                          </span>

                          <input
                            type="number"
                            value={
                              precios[
                                servicio.id
                              ] ?? ""
                            }
                            onChange={(e) =>
                              setPrecios(
                                (
                                  actuales
                                ) => ({
                                  ...actuales,

                                  [servicio.id]:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            className="w-full bg-transparent p-3 outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            guardarPrecio(
                              servicio
                            )
                          }
                          disabled={
                            procesandoServicio ===
                            servicio.id
                          }
                          className="mt-4 w-full rounded-full bg-[#e6db61] py-3 font-black text-black disabled:opacity-50"
                        >
                          GUARDAR PRECIO
                        </button>
                      </>
                    )}

                    {esColor && (
                      <div className="mt-5 rounded-2xl border border-[#e6db61]/20 bg-[#e6db61]/10 p-4 text-sm text-[#e6db61]">
                        El servicio de Color se consulta por WhatsApp.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        cambiarServicio(
                          servicio
                        )
                      }
                      disabled={
                        procesandoServicio ===
                        servicio.id
                      }
                      className="mt-3 w-full rounded-full bg-white/10 py-3 font-black"
                    >
                      {servicio.activo
                        ? "DESACTIVAR"
                        : "ACTIVAR"}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* HORARIOS */}
        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#101010] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e6db61]">
            Agenda
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Horarios de atención
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {horarios.map(
              (horario) => (
                <button
                  key={
                    horario.id
                  }
                  type="button"
                  onClick={() =>
                    cambiarHorario(
                      horario
                    )
                  }
                  disabled={
                    procesandoHorario ===
                    horario.id
                  }
                  className={`rounded-2xl border p-4 font-black ${
                    horario.activo
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {String(
                    horario.hora
                  ).slice(0, 5)}
                </button>
              )
            )}
          </div>
        </section>

        {/* TURNOS */}
        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e6db61]">
            Turnos
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Agenda e historial
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Filtro
              nombre="Hoy"
              cantidad={
                cantidadHoy
              }
              activo={
                filtro ===
                "hoy"
              }
              onClick={() =>
                setFiltro(
                  "hoy"
                )
              }
            />

            <Filtro
              nombre="Próximos"
              cantidad={
                cantidadProximos
              }
              activo={
                filtro ===
                "proximos"
              }
              onClick={() =>
                setFiltro(
                  "proximos"
                )
              }
            />

            <Filtro
              nombre="Historial"
              cantidad={
                cantidadHistorial
              }
              activo={
                filtro ===
                "historial"
              }
              onClick={() =>
                setFiltro(
                  "historial"
                )
              }
            />

            <Filtro
              nombre="Cancelados"
              cantidad={
                cantidadCancelados
              }
              activo={
                filtro ===
                "cancelados"
              }
              onClick={() =>
                setFiltro(
                  "cancelados"
                )
              }
            />
          </div>

          <input
            value={
              busqueda
            }
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            placeholder="Buscar cliente, teléfono o barbero..."
            className="mt-5 w-full rounded-2xl border border-white/10 bg-[#101010] p-4 outline-none focus:border-[#e6db61]"
          />

          {turnosFiltrados.length ===
          0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#101010] p-10 text-center text-white/60">
              No hay turnos para mostrar.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {turnosFiltrados.map(
                (turno) => (
                  <TurnoCard
                    key={
                      turno.id
                    }
                    turno={
                      turno
                    }
                    horarios={
                      horarios
                    }
                    actualizar={() =>
                      router.refresh()
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Filtro({
  nombre,
  cantidad,
  activo,
  onClick,
}: {
  nombre: string;
  cantidad: number;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-2xl border p-4 text-left ${
        activo
          ? "border-[#e6db61] bg-[#e6db61] text-black"
          : "border-white/10 bg-[#101010] text-white"
      }`}
    >
      <span className="block text-sm font-black">
        {nombre}
      </span>

      <span className="mt-1 block text-2xl font-black">
        {cantidad}
      </span>
    </button>
  );
}

function TurnoCard({
  turno,
  horarios,
  actualizar,
}: {
  turno: Turno;
  horarios: HorarioAdmin[];
  actualizar: () => void;
}) {
  const [
    fechaNueva,
    setFechaNueva,
  ] =
    useState(
      turno.fecha
    );

  const [
    horaNueva,
    setHoraNueva,
  ] =
    useState(
      String(
        turno.hora
      ).slice(0, 5)
    );

  const [
    propuesta,
    setPropuesta,
  ] =
    useState<
      PropuestaCambio | null
    >(null);

  const [
    cargando,
    setCargando,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    mensajeLocal,
    setMensajeLocal,
  ] =
    useState("");

  const [
    cambioConfirmado,
    setCambioConfirmado,
  ] =
    useState<{
      fecha: string;
      hora: string;
    } | null>(null);

  const cancelado =
    turno.estado ===
    "cancelado";

  const horaActual =
    String(
      turno.hora
    ).slice(0, 5);

  useEffect(() => {
    try {
      const guardado =
        localStorage.getItem(
          STORAGE_PROPUESTAS
        );

      if (!guardado) {
        return;
      }

      const todas =
        JSON.parse(
          guardado
        ) as Record<
          string,
          PropuestaCambio
        >;

      const encontrada =
        todas[
          turno.id
        ];

      if (encontrada) {
        setPropuesta(
          encontrada
        );

        setFechaNueva(
          encontrada.fecha
        );

        setHoraNueva(
          encontrada.hora
        );
      }
    } catch {
      // Si localStorage estuviera dañado,
      // simplemente no cargamos propuesta.
    }
  }, [turno.id]);

  function guardarPropuestaLocal(
    nueva:
      PropuestaCambio | null
  ) {
    try {
      const guardado =
        localStorage.getItem(
          STORAGE_PROPUESTAS
        );

      const todas: Record<
        string,
        PropuestaCambio
      > = guardado
        ? JSON.parse(
            guardado
          )
        : {};

      if (nueva) {
        todas[
          turno.id
        ] = nueva;
      } else {
        delete todas[
          turno.id
        ];
      }

      localStorage.setItem(
        STORAGE_PROPUESTAS,
        JSON.stringify(
          todas
        )
      );
    } catch {
      // El turno igual puede seguir funcionando
      // durante esta sesión.
    }
  }

  const horariosActivos =
    horarios
      .filter(
        (horario) =>
          horario.activo
      )
      .map((horario) =>
        String(
          horario.hora
        ).slice(0, 5)
      );

  const opcionesHorario =
    horariosActivos.includes(
      horaNueva
    )
      ? horariosActivos
      : [
          horaNueva,
          ...horariosActivos,
        ];

  function proponerCambio() {
    setError("");
    setMensajeLocal("");

    if (
      fechaNueva ===
        turno.fecha &&
      horaNueva ===
        horaActual
    ) {
      setError(
        "Elegí otra fecha u otro horario."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Preparar esta propuesta?\n\n` +
          `TURNO ACTUAL\n` +
          `${formatearFecha(
            turno.fecha
          )} - ${horaActual}\n\n` +
          `NUEVA PROPUESTA\n` +
          `${formatearFecha(
            fechaNueva
          )} - ${horaNueva}\n\n` +
          `IMPORTANTE: el turno real todavía NO se va a modificar.`
      );

    if (!confirmar) {
      return;
    }

    const nueva: PropuestaCambio =
      {
        fecha:
          fechaNueva,

        hora:
          horaNueva,

        enviada:
          false,
      };

    setPropuesta(
      nueva
    );

    guardarPropuestaLocal(
      nueva
    );

    setMensajeLocal(
      "Propuesta preparada. El turno original sigue igual."
    );
  }

  function marcarPropuestaEnviada() {
    if (!propuesta) {
      return;
    }

    const actualizada: PropuestaCambio =
      {
        ...propuesta,
        enviada:
          true,
      };

    setPropuesta(
      actualizada
    );

    guardarPropuestaLocal(
      actualizada
    );

    setMensajeLocal(
      "Propuesta enviada. Esperá la respuesta del cliente."
    );
  }

  async function confirmarCambio() {
    if (!propuesta) {
      setError(
        "No hay una propuesta pendiente."
      );

      return;
    }

    if (
      !propuesta.enviada
    ) {
      setError(
        "Primero enviá la propuesta por WhatsApp."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `IMPORTANTE\n\n` +
          `Tocá Aceptar solamente si ${turno.nombre} respondió que SÍ por WhatsApp.\n\n` +
          `¿El cliente aceptó el turno del ${formatearFecha(
            propuesta.fecha
          )} a las ${propuesta.hora}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(
      true
    );

    setError("");
    setMensajeLocal("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                accion:
                  "mover",

                fecha:
                  propuesta.fecha,

                hora:
                  propuesta.hora,
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo mover el turno."
        );
      }

      const fechaFinal =
        propuesta.fecha;

      const horaFinal =
        propuesta.hora;

      guardarPropuestaLocal(
        null
      );

      setPropuesta(
        null
      );

      setCambioConfirmado(
        {
          fecha:
            fechaFinal,

          hora:
            horaFinal,
        }
      );

      setMensajeLocal(
        "Turno reprogramado correctamente. Ahora podés enviar la confirmación al cliente."
      );
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo mover el turno."
      );
    } finally {
      setCargando(
        false
      );
    }
  }

  function descartarPropuesta() {
    const confirmar =
      window.confirm(
        "¿Descartar esta propuesta? El turno original seguirá igual."
      );

    if (!confirmar) {
      return;
    }

    guardarPropuestaLocal(
      null
    );

    setPropuesta(
      null
    );

    setFechaNueva(
      turno.fecha
    );

    setHoraNueva(
      horaActual
    );

    setMensajeLocal(
      "Propuesta descartada."
    );

    setError("");
  }

  async function cancelarTurno() {
    const confirmar =
      window.confirm(
        `¿Cancelar el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(
      true
    );

    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                accion:
                  "cancelar",
              }
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo cancelar el turno."
        );
      }

      guardarPropuestaLocal(
        null
      );

      actualizar();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo cancelar."
      );
    } finally {
      setCargando(
        false
      );
    }
  }

  async function borrarTurno() {
    const confirmar =
      window.confirm(
        `¿Borrar definitivamente el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(
      true
    );

    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method:
              "DELETE",
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          resultado.error ||
            "No se pudo borrar el turno."
        );
      }

      guardarPropuestaLocal(
        null
      );

      actualizar();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No se pudo borrar."
      );
    } finally {
      setCargando(
        false
      );
    }
  }

  const linkPropuesta =
    propuesta
      ? crearLinkWhatsApp(
          turno.telefono,
          mensajePropuesta(
            turno,
            propuesta
          )
        )
      : "";

  const linkConfirmacion =
    cambioConfirmado
      ? crearLinkWhatsApp(
          turno.telefono,
          mensajeConfirmacion(
            turno,
            cambioConfirmado.fecha,
            cambioConfirmado.hora
          )
        )
      : "";

  return (
    <article
      className={`rounded-[28px] border p-6 ${
        cancelado
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/10 bg-[#101010]"
      }`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">
              {turno.nombre}{" "}
              {turno.apellido}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                cancelado
                  ? "bg-red-500/20 text-red-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {turno.estado.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>
              💈 Barbero:{" "}
              <strong className="text-[#e6db61]">
                {
                  turno.barbero_nombre
                }
              </strong>
            </p>

            <p>
              ✂️ Servicio:{" "}
              {turno.servicio}
            </p>

            <p>
              📱{" "}
              {turno.telefono}
            </p>

            <p>
              📅 Turno actual:{" "}
              <strong className="text-white">
                {formatearFecha(
                  turno.fecha
                )}
              </strong>
            </p>

            <p>
              🕐 Horario:{" "}
              <strong className="text-white">
                {horaActual}
              </strong>
            </p>

            {turno.precio !==
              null && (
              <p>
                💰 $
                {turno.precio.toLocaleString(
                  "es-AR"
                )}
              </p>
            )}
          </div>
        </div>

        {!cancelado &&
          !propuesta &&
          !cambioConfirmado && (
            <div className="rounded-3xl border border-white/10 bg-black p-5">
              <p className="font-black">
                Proponer otro horario
              </p>

              <p className="mt-2 text-xs leading-5 text-white/50">
                El turno real no cambiará hasta que el cliente confirme por WhatsApp.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={
                    fechaNueva
                  }
                  onChange={(e) =>
                    setFechaNueva(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#111] p-3"
                />

                <select
                  value={
                    horaNueva
                  }
                  onChange={(e) =>
                    setHoraNueva(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#111] p-3"
                >
                  {opcionesHorario.map(
                    (
                      horario
                    ) => (
                      <option
                        key={
                          horario
                        }
                        value={
                          horario
                        }
                      >
                        {horario}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={
                  proponerCambio
                }
                className="mt-4 w-full rounded-full bg-[#e6db61] py-3 font-black text-black"
              >
                PROPONER CAMBIO
              </button>
            </div>
          )}
      </div>

      {!cancelado &&
        propuesta &&
        !cambioConfirmado && (
          <div className="mt-6 rounded-3xl border-2 border-[#e6db61]/50 bg-[#e6db61]/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e6db61]">
              Cambio pendiente
            </p>

            <h4 className="mt-2 text-xl font-black">
              Esperando confirmación del cliente
            </h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs font-bold text-white/50">
                  TURNO ACTUAL
                </p>

                <p className="mt-2 font-black">
                  {formatearFecha(
                    turno.fecha
                  )}
                </p>

                <p className="font-black">
                  {horaActual}
                </p>
              </div>

              <div className="rounded-2xl bg-[#e6db61] p-4 text-black">
                <p className="text-xs font-bold">
                  NUEVA PROPUESTA
                </p>

                <p className="mt-2 font-black">
                  {formatearFecha(
                    propuesta.fecha
                  )}
                </p>

                <p className="font-black">
                  {
                    propuesta.hora
                  }
                </p>
              </div>
            </div>

            {linkPropuesta && (
              <a
                href={
                  linkPropuesta
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={
                  marcarPropuestaEnviada
                }
                className="mt-5 block w-full rounded-full bg-[#25D366] py-4 text-center font-black text-white"
              >
                💬{" "}
                {propuesta.enviada
                  ? "VOLVER A ABRIR WHATSAPP"
                  : "ENVIAR PROPUESTA POR WHATSAPP"}
              </a>
            )}

            {propuesta.enviada && (
              <>
                <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-bold text-green-300">
                  ✓ Propuesta enviada. Esperá que el cliente responda por WhatsApp.
                </div>

                <button
                  type="button"
                  onClick={
                    confirmarCambio
                  }
                  disabled={
                    cargando
                  }
                  className="mt-3 w-full rounded-full bg-white py-4 font-black text-black disabled:opacity-50"
                >
                  {cargando
                    ? "CONFIRMANDO..."
                    : "✓ EL CLIENTE CONFIRMÓ — APLICAR CAMBIO"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={
                descartarPropuesta
              }
              className="mt-3 w-full rounded-full border border-red-500/30 py-3 font-black text-red-400"
            >
              DESCARTAR PROPUESTA
            </button>
          </div>
        )}

      {cambioConfirmado && (
        <div className="mt-6 rounded-3xl border-2 border-green-500/40 bg-green-500/10 p-6">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-green-400">
            ✓ Cambio confirmado
          </p>

          <h4 className="mt-2 text-2xl font-black">
            El turno ya fue reprogramado
          </h4>

          <p className="mt-4">
            Nueva fecha:{" "}
            <strong>
              {formatearFecha(
                cambioConfirmado.fecha
              )}
            </strong>
          </p>

          <p>
            Nuevo horario:{" "}
            <strong>
              {
                cambioConfirmado.hora
              }
            </strong>
          </p>

          {linkConfirmacion && (
            <a
              href={
                linkConfirmacion
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setTimeout(
                  () => {
                    setCambioConfirmado(
                      null
                    );

                    actualizar();
                  },
                  500
                );
              }}
              className="mt-5 block w-full rounded-full bg-[#25D366] py-4 text-center font-black text-white"
            >
              💬 ENVIAR CONFIRMACIÓN POR WHATSAPP
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              setCambioConfirmado(
                null
              );

              actualizar();
            }}
            className="mt-3 w-full rounded-full border border-green-500/30 py-3 font-black text-green-400"
          >
            CERRAR SIN ENVIAR
          </button>
        </div>
      )}

      {!cancelado &&
        !cambioConfirmado && (
          <button
            type="button"
            onClick={
              cancelarTurno
            }
            disabled={
              cargando
            }
            className="mt-5 rounded-full bg-red-500/10 px-5 py-3 font-black text-red-400"
          >
            Cancelar turno
          </button>
        )}

      {cancelado && (
        <button
          type="button"
          onClick={
            borrarTurno
          }
          disabled={
            cargando
          }
          className="mt-5 rounded-full bg-red-600 px-5 py-3 font-black text-white"
        >
          Borrar definitivamente
        </button>
      )}

      {mensajeLocal && (
        <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
          ✓ {mensajeLocal}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}
    </article>
  );
}