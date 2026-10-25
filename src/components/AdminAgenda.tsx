"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Turno = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  forma_pago: string;
  estado: string;
};

type ServicioAdmin = {
  id: number;
  nombre: string;
  precio: number | null;
  duracion_minutos:
    | number
    | null;
  activo: boolean;
};

type HorarioAdmin = {
  id: number;
  hora: string;
  activo: boolean;
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
};

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

function esServicioColor(
  nombre: string
) {
  return (
    nombre
      .trim()
      .toLowerCase() === "color"
  );
}

export default function AdminAgenda({
  turnos = [],
  servicios = [],
  horarios = [],
}: Props) {
  const router = useRouter();

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>("hoy");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    precios,
    setPrecios,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios
        .filter(
          (servicio) =>
            !esServicioColor(
              servicio.nombre
            )
        )
        .map(
          (servicio) => [
            servicio.id,
            String(
              servicio.precio ??
                0
            ),
          ]
        )
    )
  );

  const [
    procesandoServicio,
    setProcesandoServicio,
  ] =
    useState<number | null>(
      null
    );

  const [
    procesandoHorario,
    setProcesandoHorario,
  ] =
    useState<number | null>(
      null
    );

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const hoy =
    obtenerHoy();

  const cantidadHoy =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha === hoy
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
          filtro === "hoy" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha === hoy
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
            turno.fecha > hoy
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
            turno.fecha < hoy
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
          `${turno.nombre} ${turno.apellido} ${turno.telefono}`.toLowerCase();

        return texto.includes(
          busqueda
            .trim()
            .toLowerCase()
        );
      }
    );

  async function cerrarSesion() {
    setCerrandoSesion(true);

    await fetch(
      "/api/admin/logout",
      {
        method: "POST",
      }
    );

    window.location.href =
      "/admin/login";
  }

  async function actualizarServicio(
    id: number,
    cambios: {
      precio?: number;
      activo?: boolean;
    }
  ) {
    setProcesandoServicio(
      id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/servicios",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
              ...cambios,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar el servicio"
        );
      }

      if (
        resultado.servicio
          .precio !== null
      ) {
        setPrecios(
          (actuales) => ({
            ...actuales,

            [id]: String(
              resultado.servicio
                .precio
            ),
          })
        );
      }

      setMensaje(
        `${resultado.servicio.nombre} actualizado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setProcesandoServicio(
        null
      );
    }
  }

  async function guardarPrecio(
    id: number
  ) {
    const precio =
      Number(precios[id]);

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
      id,
      {
        precio,
      }
    );
  }

  async function cambiarServicio(
    servicio: ServicioAdmin
  ) {
    await actualizarServicio(
      servicio.id,
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
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: horario.id,
              activo:
                !horario.activo,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar el horario"
        );
      }

      setMensaje(
        `Horario ${String(
          resultado.horario.hora
        ).slice(
          0,
          5
        )} actualizado.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setProcesandoHorario(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <img
              src="/barber-vipp-logo.png"
              alt="Barber VIPP"
              className="h-14 w-14 rounded-full object-cover"
            />

            <div>
              <p className="font-black tracking-widest text-yellow-500">
                BARBER VIPP
              </p>

              <p className="text-xs text-neutral-500">
                Panel administrador
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-xl border border-white/10 px-4 py-3 text-sm"
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
              className="rounded-xl border border-red-500/20 px-4 py-3 text-sm font-bold text-red-400 disabled:opacity-50"
            >
              {cerrandoSesion
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-500">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Panel Barber VIPP
        </h1>

        {mensaje && (
          <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-400">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-3xl border border-yellow-500/20 bg-[#111] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500">
            Servicios
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Precios y disponibilidad
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {servicios.map(
              (servicio) => {
                const color =
                  esServicioColor(
                    servicio.nombre
                  );

                if (color) {
                  return (
                    <div
                      key={
                        servicio.id
                      }
                      className="rounded-2xl border border-yellow-500/20 bg-black p-5"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black">
                            🎨 Color
                          </p>

                          <p className="mt-1 text-sm text-neutral-500">
                            Consulta por
                            WhatsApp
                          </p>
                        </div>

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

                      <div className="mt-5 rounded-xl border border-white/10 bg-[#111] p-4">
                        <p className="text-sm text-neutral-400">
                          Mechas · Color
                          global ·
                          Personalizado
                        </p>

                        <p className="mt-2 text-xs text-yellow-500">
                          Sin precio ni
                          duración fija
                        </p>
                      </div>

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
                        className={`mt-4 w-full rounded-xl py-3 font-black disabled:opacity-50 ${
                          servicio.activo
                            ? "bg-red-500/10 text-red-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {servicio.activo
                          ? "DESACTIVAR"
                          : "ACTIVAR"}
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={
                      servicio.id
                    }
                    className="rounded-2xl border border-white/10 bg-black p-5"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-black">
                          ✂️{" "}
                          {
                            servicio.nombre
                          }
                        </p>

                        <p className="mt-1 text-sm text-neutral-500">
                          {servicio.duracion_minutos ??
                            "-"}{" "}
                          min
                        </p>
                      </div>

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

                    <div className="mt-5 flex items-center rounded-xl border border-white/10 bg-[#111] px-4">
                      <span className="font-black text-yellow-500">
                        $
                      </span>

                      <input
                        type="number"
                        value={
                          precios[
                            servicio.id
                          ] ?? ""
                        }
                        onChange={(
                          event
                        ) =>
                          setPrecios(
                            (
                              actuales
                            ) => ({
                              ...actuales,

                              [servicio.id]:
                                event
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
                          servicio.id
                        )
                      }
                      disabled={
                        procesandoServicio ===
                        servicio.id
                      }
                      className="mt-4 w-full rounded-xl bg-yellow-500 py-3 font-black text-black disabled:opacity-50"
                    >
                      GUARDAR PRECIO
                    </button>

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
                      className={`mt-3 w-full rounded-xl py-3 font-black disabled:opacity-50 ${
                        servicio.activo
                          ? "bg-red-500/10 text-red-400"
                          : "bg-green-500/10 text-green-400"
                      }`}
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

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500">
            Agenda
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Horarios de atención
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Tocá un horario para
            activarlo o desactivarlo.
          </p>

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
                  className={`rounded-2xl border p-4 text-center disabled:opacity-50 ${
                    horario.activo
                      ? "border-green-500/20 bg-green-500/10 text-green-400"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  <span className="block text-xl font-black">
                    {
                      horario.hora
                    }
                  </span>

                  <span className="mt-1 block text-[10px] font-black">
                    {horario.activo
                      ? "ACTIVO"
                      : "INACTIVO"}
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500">
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
                filtro === "hoy"
              }
              onClick={() =>
                setFiltro("hoy")
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
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
            placeholder="Buscar por nombre, apellido o teléfono..."
            className="mt-5 w-full rounded-2xl border border-white/10 bg-[#111] p-4 outline-none focus:border-yellow-500"
          />

          <p className="mt-5 text-sm text-neutral-500">
            {
              turnosFiltrados.length
            }{" "}
            turnos encontrados
          </p>

          {turnosFiltrados.length ===
          0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-10 text-center">
              <p className="text-4xl">
                📅
              </p>

              <p className="mt-4 font-black">
                No hay turnos para
                mostrar.
              </p>
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
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${
        activo
          ? "border-yellow-500 bg-yellow-500 text-black"
          : "border-white/10 bg-[#111]"
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
  horarios = [],
  actualizar,
}: {
  turno: Turno;
  horarios?: HorarioAdmin[];
  actualizar: () => void;
}) {
  const [
    fechaNueva,
    setFechaNueva,
  ] =
    useState(turno.fecha);

  const [
    horaNueva,
    setHoraNueva,
  ] = useState(
    String(
      turno.hora
    ).slice(0, 5)
  );

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const cancelado =
    turno.estado ===
    "cancelado";

  const horaActual =
    String(
      turno.hora
    ).slice(0, 5);

  const horariosActivos =
    horarios
      .filter(
        (horario) =>
          horario.activo
      )
      .map(
        (horario) =>
          horario.hora
      );

  const opcionesHorario =
    horariosActivos.includes(
      horaActual
    )
      ? horariosActivos
      : [
          horaActual,
          ...horariosActivos,
        ];

  async function enviarCambio(
    cambios: Record<
      string,
      string
    >
  ) {
    setCargando(true);
    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              cambios
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo realizar el cambio"
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setCargando(false);
    }
  }

  async function moverTurno() {
    if (
      fechaNueva ===
        turno.fecha &&
      horaNueva === horaActual
    ) {
      setError(
        "Elegí otra fecha u otro horario."
      );

      return;
    }

    await enviarCambio({
      accion: "mover",
      fecha: fechaNueva,
      hora: horaNueva,
    });
  }

  async function cancelarTurno() {
    const confirmar =
      window.confirm(
        `¿Cancelar el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    await enviarCambio({
      accion: "cancelar",
    });
  }

  async function borrarTurno() {
    const confirmar =
      window.confirm(
        `¿Borrar definitivamente el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "DELETE",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo borrar el turno"
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <article
      className={`rounded-3xl border p-6 ${
        cancelado
          ? "border-red-500/20 bg-red-500/[0.04]"
          : "border-white/10 bg-[#111]"
      }`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">
              {turno.nombre}{" "}
              {turno.apellido}
            </h3>

            <span
              className={
                cancelado
                  ? "text-xs font-black text-red-400"
                  : "text-xs font-black text-green-400"
              }
            >
              {turno.estado.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-neutral-400">
            <p>
              ✂️{" "}
              {turno.servicio}
            </p>

            <p>
              📱{" "}
              {turno.telefono}
            </p>

            <p>
              💳{" "}
              {
                turno.forma_pago
              }
            </p>

            <p>
              💰 $
              {turno.precio.toLocaleString(
                "es-AR"
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={fechaNueva}
            disabled={cancelado}
            onChange={(event) =>
              setFechaNueva(
                event.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-black p-3 disabled:opacity-40"
          />

          <select
            value={horaNueva}
            disabled={cancelado}
            onChange={(event) =>
              setHoraNueva(
                event.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-black p-3 disabled:opacity-40"
          >
            {opcionesHorario.map(
              (horario) => (
                <option
                  key={horario}
                  value={horario}
                >
                  {horario}
                </option>
              )
            )}
          </select>
        </div>

        {!cancelado ? (
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <button
              type="button"
              onClick={
                moverTurno
              }
              disabled={
                cargando
              }
              className="rounded-xl bg-yellow-500 px-5 py-3 font-black text-black disabled:opacity-50"
            >
              {cargando
                ? "Procesando..."
                : "Mover"}
            </button>

            <button
              type="button"
              onClick={
                cancelarTurno
              }
              disabled={
                cargando
              }
              className="rounded-xl bg-red-500/10 px-5 py-3 font-black text-red-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              borrarTurno
            }
            disabled={
              cargando
            }
            className="rounded-xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {cargando
              ? "Borrando..."
              : "Borrar definitivamente"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}
    </article>
  );
}