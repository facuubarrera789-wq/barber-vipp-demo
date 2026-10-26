"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import ColorConsulta, {
  TipoColor,
} from "../components/ColorConsulta";

type Servicio = {
  id: number;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  activo: boolean;
};

type Barbero = {
  id: number;
  nombre: string;
  activo: boolean;
};

type Dia = {
  valor: string;
  nombre: string;
  numero: string;
};

type Confirmacion = {
  nombre: string;
  apellido: string;
  servicio: string;
  barbero: string;
  fecha: string;
  hora: string;
  formaPago: string;
  precio: number;
};

function crearDias(): Dia[] {
  const resultado: Dia[] = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + i
    );

    const año =
      fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      fecha.getDate()
    ).padStart(2, "0");

    const valor =
      `${año}-${mes}-${dia}`;

    const nombre = fecha
      .toLocaleDateString(
        "es-AR",
        {
          weekday: "short",
        }
      )
      .replace(".", "")
      .toUpperCase();

    resultado.push({
      valor,
      nombre,
      numero: dia,
    });
  }

  return resultado;
}

export default function Home() {
  const dias = useMemo(
    () => crearDias(),
    []
  );

  const [
    servicios,
    setServicios,
  ] = useState<Servicio[]>([]);

  const [
    barberos,
    setBarberos,
  ] = useState<Barbero[]>([]);

  const [
    horarios,
    setHorarios,
  ] = useState<string[]>([]);

  const [
    colorActivo,
    setColorActivo,
  ] = useState(false);

  const [
    modoColor,
    setModoColor,
  ] = useState(false);

  const [
    tipoColor,
    setTipoColor,
  ] =
    useState<TipoColor | null>(
      null
    );

  const [
    servicioSeleccionado,
    setServicioSeleccionado,
  ] = useState<number | null>(
    null
  );

  const [
    barberoSeleccionado,
    setBarberoSeleccionado,
  ] = useState<number | null>(
    null
  );

  const [
    fecha,
    setFecha,
  ] = useState("");

  const [
    hora,
    setHora,
  ] = useState("");

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    apellido,
    setApellido,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState("");

  const [
    formaPago,
    setFormaPago,
  ] = useState("");

  const [
    ocupados,
    setOcupados,
  ] = useState<string[]>([]);

  const [
    cargandoServicios,
    setCargandoServicios,
  ] = useState(true);

  const [
    cargandoBarberos,
    setCargandoBarberos,
  ] = useState(true);

  const [
    cargandoHorarios,
    setCargandoHorarios,
  ] = useState(true);

  const [
    cargandoOcupados,
    setCargandoOcupados,
  ] = useState(false);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<Confirmacion | null>(
      null
    );

  const servicioActual =
    servicios.find(
      (servicio) =>
        servicio.id ===
        servicioSeleccionado
    ) ?? null;

  const barberoActual =
    barberos.find(
      (barbero) =>
        barbero.id ===
        barberoSeleccionado
    ) ?? null;

  async function cargarServicios() {
    setCargandoServicios(true);

    try {
      const respuesta =
        await fetch(
          "/api/servicios",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los servicios"
        );
      }

      setServicios(
        resultado.servicios ??
          []
      );

      const estaColorActivo =
        Boolean(
          resultado.colorActivo
        );

      setColorActivo(
        estaColorActivo
      );

      if (!estaColorActivo) {
        setModoColor(false);
        setTipoColor(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron cargar los servicios."
      );
    } finally {
      setCargandoServicios(
        false
      );
    }
  }

  async function cargarBarberos() {
    setCargandoBarberos(true);

    try {
      const respuesta =
        await fetch(
          "/api/barberos",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los barberos"
        );
      }

      const nuevosBarberos =
        resultado.barberos ?? [];

      setBarberos(
        nuevosBarberos
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron cargar los barberos."
      );
    } finally {
      setCargandoBarberos(
        false
      );
    }
  }

  async function cargarHorarios() {
    setCargandoHorarios(true);

    try {
      const respuesta =
        await fetch(
          "/api/horarios",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los horarios"
        );
      }

      const nuevosHorarios:
        string[] =
        (
          resultado.horarios ??
          []
        ).map(
          (horario: {
            hora: string;
          }) =>
            String(
              horario.hora
            ).slice(0, 5)
        );

      setHorarios(
        nuevosHorarios
      );
    } catch (err) {
      console.error(err);

      setHorarios([]);
    } finally {
      setCargandoHorarios(
        false
      );
    }
  }

  async function cargarOcupados(
    fechaElegida: string,
    barberoId: number
  ) {
    if (
      !fechaElegida ||
      !barberoId ||
      modoColor
    ) {
      setOcupados([]);
      return;
    }

    setCargandoOcupados(true);

    try {
      const respuesta =
        await fetch(
          `/api/turnos?fecha=${encodeURIComponent(
            fechaElegida
          )}&barberoId=${barberoId}`,
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron consultar los horarios"
        );
      }

      const nuevosOcupados =
        resultado.ocupados ??
        [];

      setOcupados(
        nuevosOcupados
      );

      setHora(
        (horaActual) =>
          nuevosOcupados.includes(
            horaActual
          )
            ? ""
            : horaActual
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron consultar los horarios."
      );
    } finally {
      setCargandoOcupados(
        false
      );
    }
  }

  useEffect(() => {
    cargarServicios();
    cargarBarberos();
    cargarHorarios();
  }, []);

  useEffect(() => {
    setHora("");
    setError("");

    if (
      modoColor ||
      !fecha ||
      !barberoSeleccionado
    ) {
      setOcupados([]);
      return;
    }

    cargarOcupados(
      fecha,
      barberoSeleccionado
    );
  }, [
    fecha,
    barberoSeleccionado,
    modoColor,
  ]);

  function seleccionarServicio(
    servicio: Servicio
  ) {
    setModoColor(false);
    setTipoColor(null);

    setServicioSeleccionado(
      (actual) =>
        actual === servicio.id
          ? null
          : servicio.id
    );

    setBarberoSeleccionado(
      null
    );

    setFecha("");
    setHora("");
    setOcupados([]);
    setError("");
  }

  function seleccionarBarbero(
    barbero: Barbero
  ) {
    setBarberoSeleccionado(
      (actual) =>
        actual === barbero.id
          ? null
          : barbero.id
    );

    setFecha("");
    setHora("");
    setOcupados([]);
    setError("");
  }

  function activarColor() {
    setModoColor(true);

    setServicioSeleccionado(
      null
    );

    setBarberoSeleccionado(
      null
    );

    setTipoColor(null);

    setFecha("");
    setHora("");
    setOcupados([]);
    setError("");
  }

  function seleccionarTipoColor(
    tipo: TipoColor
  ) {
    setModoColor(true);

    setTipoColor(tipo);

    setServicioSeleccionado(
      null
    );

    setBarberoSeleccionado(
      null
    );

    setHora("");
    setOcupados([]);
  }

  function seleccionarFecha(
    valor: string
  ) {
    setFecha(
      (actual) =>
        actual === valor
          ? ""
          : valor
    );
  }

  function seleccionarHora(
    valor: string
  ) {
    if (
      ocupados.includes(valor)
    ) {
      return;
    }

    setHora(
      (actual) =>
        actual === valor
          ? ""
          : valor
    );
  }

  function abrirConsultaColorWhatsApp() {
    if (!tipoColor || !fecha) {
      setError(
        "Elegí el tipo de color y una fecha."
      );

      return;
    }

    const numero =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

    if (!numero) {
      setError(
        "El WhatsApp de la barbería todavía no está configurado."
      );

      return;
    }

    const partesFecha =
      fecha.split("-");

    const fechaFormateada =
      partesFecha.length === 3
        ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`
        : fecha;

    const mensaje =
      `Hola, quisiera consultar por un trabajo de Color en Barber VIPP.\n\n` +
      `🎨 Tipo de trabajo: ${tipoColor}\n` +
      `📅 Día elegido: ${fechaFormateada}\n\n` +
      `Quisiera consultar disponibilidad, horario, duración y precio.`;

    const link =
      `https://wa.me/${numero}?text=${encodeURIComponent(
        mensaje
      )}`;

    window.open(
      link,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function confirmarTurno(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (modoColor) {
      return;
    }

    if (!servicioActual) {
      setError(
        "Elegí un servicio."
      );
      return;
    }

    if (!barberoActual) {
      setError(
        "Elegí un barbero."
      );
      return;
    }

    if (!fecha) {
      setError(
        "Elegí una fecha."
      );
      return;
    }

    if (!hora) {
      setError(
        "Elegí un horario."
      );
      return;
    }

    if (!nombre.trim()) {
      setError(
        "Ingresá tu nombre."
      );
      return;
    }

    if (!apellido.trim()) {
      setError(
        "Ingresá tu apellido."
      );
      return;
    }

    if (!telefono.trim()) {
      setError(
        "Ingresá tu teléfono."
      );
      return;
    }

    if (!formaPago) {
      setError(
        "Elegí una forma de pago."
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta =
        await fetch(
          "/api/turnos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nombre:
                nombre.trim(),

              apellido:
                apellido.trim(),

              telefono:
                telefono.trim(),

              servicioId:
                servicioActual.id,

              barberoId:
                barberoActual.id,

              fecha,

              hora,

              formaPago,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        if (
          respuesta.status ===
          409
        ) {
          setHora("");

          await cargarOcupados(
            fecha,
            barberoActual.id
          );
        }

        throw new Error(
          resultado.error ||
            "No se pudo reservar el turno"
        );
      }

      setConfirmacion({
        nombre:
          nombre.trim(),

        apellido:
          apellido.trim(),

        servicio:
          servicioActual.nombre,

        barbero:
          barberoActual.nombre,

        fecha,

        hora,

        formaPago,

        precio:
          servicioActual.precio,
      });

      setNombre("");
      setApellido("");
      setTelefono("");
      setFormaPago("");

      setServicioSeleccionado(
        null
      );

      setBarberoSeleccionado(
        null
      );

      setFecha("");
      setHora("");
      setOcupados([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo reservar el turno."
      );
    } finally {
      setEnviando(false);
    }
  }

  function nuevaReserva() {
    setConfirmacion(null);

    setModoColor(false);
    setTipoColor(null);

    setServicioSeleccionado(
      null
    );

    setBarberoSeleccionado(
      null
    );

    setFecha("");
    setHora("");
    setNombre("");
    setApellido("");
    setTelefono("");
    setFormaPago("");
    setOcupados([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
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
                Barber Studio
              </p>
            </div>
          </div>

          <a
            href="#reservar"
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black"
          >
            RESERVAR
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-500">
              Barbería premium
            </p>

            <h1 className="mt-6 text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
              TU CORTE.
              <br />

              <span className="text-yellow-500">
                TU ESTILO.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
              Elegí tu servicio,
              tu barbero y reservá
              tu turno online.
            </p>

            <a
              href="#reservar"
              className="mt-8 inline-flex rounded-xl bg-yellow-500 px-7 py-4 font-black text-black"
            >
              AGENDAR TURNO →
            </a>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src="/barber-vipp-logo.png"
              alt="Barber VIPP"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </section>

      <section
        id="reservar"
        className="mx-auto max-w-7xl px-5 py-20"
      >
        {confirmacion ? (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-green-500/30 bg-[#111] p-8 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-5xl">
              ✓
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[0.3em] text-green-400">
              Turno confirmado
            </p>

            <h2 className="mt-3 text-4xl font-black">
              ¡Te esperamos!
            </h2>

            <p className="mt-4 text-neutral-400">
              Tu turno quedó
              reservado correctamente.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black p-6 text-left">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    Cliente
                  </p>

                  <p className="mt-1 font-black">
                    {confirmacion.nombre}{" "}
                    {confirmacion.apellido}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    Servicio
                  </p>

                  <p className="mt-1 font-black">
                    {
                      confirmacion.servicio
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    Barbero
                  </p>

                  <p className="mt-1 font-black text-yellow-500">
                    💈{" "}
                    {
                      confirmacion.barbero
                    }
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Fecha
                    </p>

                    <p className="mt-1 font-black">
                      {
                        confirmacion.fecha
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Hora
                    </p>

                    <p className="mt-1 font-black">
                      {
                        confirmacion.hora
                      }
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Forma de pago
                    </p>

                    <p className="mt-1 font-black">
                      {
                        confirmacion.formaPago
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Total
                    </p>

                    <p className="mt-1 font-black text-yellow-500">
                      $
                      {confirmacion.precio.toLocaleString(
                        "es-AR"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                nuevaReserva
              }
              className="mt-8 w-full rounded-xl bg-yellow-500 py-4 font-black text-black transition hover:bg-yellow-400"
            >
              AGENDAR OTRO TURNO
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-500">
                Reservas
              </p>

              <h2 className="mt-2 text-4xl font-black">
                Agendá tu turno
              </h2>
            </div>

            {/* SERVICIO */}
            <section className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                  1
                </div>

                <h3 className="text-2xl font-black">
                  ¿Qué querés hacerte?
                </h3>
              </div>

              {cargandoServicios ? (
                <p className="mt-7 text-neutral-500">
                  Cargando servicios...
                </p>
              ) : (
                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  {servicios.map(
                    (servicio) => {
                      const seleccionado =
                        servicioSeleccionado ===
                          servicio.id &&
                        !modoColor;

                      return (
                        <button
                          key={
                            servicio.id
                          }
                          type="button"
                          onClick={() =>
                            seleccionarServicio(
                              servicio
                            )
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            seleccionado
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-white/10 bg-black hover:border-yellow-500/40"
                          }`}
                        >
                          <span className="text-2xl">
                            ✂️
                          </span>

                          <h4 className="mt-5 text-lg font-black">
                            {
                              servicio.nombre
                            }
                          </h4>

                          <p className="mt-2 text-sm text-neutral-500">
                            {
                              servicio.duracion_minutos
                            }{" "}
                            minutos
                          </p>

                          <p className="mt-5 text-xl font-black text-yellow-500">
                            $
                            {servicio.precio.toLocaleString(
                              "es-AR"
                            )}
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              <div className="mt-6">
                <ColorConsulta
                  habilitado={
                    colorActivo
                  }
                  seleccionado={
                    modoColor
                  }
                  tipoColor={
                    tipoColor
                  }
                  onActivar={
                    activarColor
                  }
                  onSeleccionarTipo={
                    seleccionarTipoColor
                  }
                />
              </div>
            </section>

            {!modoColor && (
              <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                    2
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-yellow-500">
                      Profesional
                    </p>

                    <h3 className="text-2xl font-black">
                      Elegí tu barbero
                    </h3>
                  </div>
                </div>

                {!servicioActual ? (
                  <div className="mt-7 rounded-2xl border border-white/10 bg-black p-5 text-neutral-500">
                    Primero elegí un
                    servicio.
                  </div>
                ) : cargandoBarberos ? (
                  <div className="mt-7 rounded-2xl border border-white/10 bg-black p-5 text-neutral-500">
                    Cargando barberos...
                  </div>
                ) : (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {barberos.map(
                      (barbero) => {
                        const seleccionado =
                          barberoSeleccionado ===
                          barbero.id;

                        return (
                          <button
                            key={
                              barbero.id
                            }
                            type="button"
                            onClick={() =>
                              seleccionarBarbero(
                                barbero
                              )
                            }
                            className={`rounded-2xl border p-6 text-left transition ${
                              seleccionado
                                ? "border-yellow-500 bg-yellow-500/10"
                                : "border-white/10 bg-black hover:border-yellow-500/40"
                            }`}
                          >
                            <div className="text-3xl">
                              💈
                            </div>

                            <p className="mt-4 text-xl font-black">
                              {
                                barbero.nombre
                              }
                            </p>

                            {seleccionado && (
                              <p className="mt-2 text-xs font-black text-yellow-500">
                                ELEGIDO
                              </p>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}

            {/* DÍA */}
            <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                  {modoColor
                    ? "2"
                    : "3"}
                </div>

                <h3 className="text-2xl font-black">
                  Elegí una fecha
                </h3>
              </div>

              {!modoColor &&
              !barberoActual ? (
                <div className="mt-7 rounded-2xl bg-black p-5 text-neutral-500">
                  Primero elegí un
                  servicio y un
                  barbero.
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {dias.map(
                    (dia) => (
                      <button
                        key={
                          dia.valor
                        }
                        type="button"
                        onClick={() =>
                          seleccionarFecha(
                            dia.valor
                          )
                        }
                        className={`rounded-2xl border p-4 text-center ${
                          fecha ===
                          dia.valor
                            ? "border-yellow-500 bg-yellow-500 text-black"
                            : "border-white/10 bg-black"
                        }`}
                      >
                        <span className="block text-xs font-black">
                          {dia.nombre}
                        </span>

                        <span className="mt-2 block text-2xl font-black">
                          {dia.numero}
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
            </section>

            {modoColor ? (
              <section className="mt-8 rounded-3xl border border-green-500/20 bg-[#0d0d0d] p-6 md:p-8">
                <h3 className="text-2xl font-black">
                  Coordiná por WhatsApp
                </h3>

                <p className="mt-5 text-neutral-400">
                  Tipo:{" "}
                  <strong>
                    {tipoColor ??
                      "-"}
                  </strong>
                </p>

                <p className="mt-2 text-neutral-400">
                  Día:{" "}
                  <strong>
                    {fecha || "-"}
                  </strong>
                </p>

                <button
                  type="button"
                  disabled={
                    !tipoColor ||
                    !fecha
                  }
                  onClick={
                    abrirConsultaColorWhatsApp
                  }
                  className="mt-6 w-full rounded-xl bg-green-500 py-4 font-black text-black disabled:opacity-40"
                >
                  💬 CONSULTAR POR WHATSAPP →
                </button>

                <p className="mt-4 text-sm text-neutral-500">
                  Se abrirá WhatsApp con el tipo de color y el día que elegiste.
                  El horario, la duración y el precio se coordinan con la barbería.
                </p>
              </section>
            ) : (
              <>
                {/* HORARIO */}
                <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                      4
                    </div>

                    <h3 className="text-2xl font-black">
                      Elegí la hora
                    </h3>
                  </div>

                  {!fecha ? (
                    <div className="mt-7 rounded-xl bg-black p-5 text-neutral-500">
                      Primero elegí un
                      día.
                    </div>
                  ) : cargandoHorarios ||
                    cargandoOcupados ? (
                    <div className="mt-7 rounded-xl bg-black p-5 text-neutral-500">
                      Consultando horarios...
                    </div>
                  ) : (
                    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {horarios.map(
                        (horario) => {
                          const ocupado =
                            ocupados.includes(
                              horario
                            );

                          return (
                            <button
                              key={
                                horario
                              }
                              type="button"
                              disabled={
                                ocupado
                              }
                              onClick={() =>
                                seleccionarHora(
                                  horario
                                )
                              }
                              className={`rounded-xl border p-4 font-black ${
                                ocupado
                                  ? "cursor-not-allowed border-red-500/20 bg-red-500/5 text-neutral-600"
                                  : hora ===
                                      horario
                                    ? "border-yellow-500 bg-yellow-500 text-black"
                                    : "border-white/10 bg-black"
                              }`}
                            >
                              {horario}

                              {ocupado && (
                                <span className="mt-1 block text-[9px]">
                                  OCUPADO
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>

                {/* DATOS */}
                <form
                  onSubmit={
                    confirmarTurno
                  }
                  className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                      5
                    </div>

                    <h3 className="text-2xl font-black">
                      Confirmá tu reserva
                    </h3>
                  </div>

                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <input
                      value={
                        nombre
                      }
                      onChange={(e) =>
                        setNombre(
                          e.target.value
                        )
                      }
                      placeholder="Nombre"
                      className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                    />

                    <input
                      value={
                        apellido
                      }
                      onChange={(e) =>
                        setApellido(
                          e.target.value
                        )
                      }
                      placeholder="Apellido"
                      className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                    />

                    <input
                      value={
                        telefono
                      }
                      onChange={(e) =>
                        setTelefono(
                          e.target.value
                        )
                      }
                      placeholder="Teléfono"
                      className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                    />

                    <select
                      value={
                        formaPago
                      }
                      onChange={(e) =>
                        setFormaPago(
                          e.target.value
                        )
                      }
                      className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                    >
                      <option value="">
                        Forma de pago
                      </option>

                      <option value="Efectivo">
                        Efectivo
                      </option>

                      <option value="Transferencia">
                        Transferencia
                      </option>

                      <option value="Tarjeta">
                        Tarjeta
                      </option>
                    </select>
                  </div>

                  <div className="mt-7 rounded-2xl border border-white/10 bg-black p-5">
                    <p className="font-black text-yellow-500">
                      Resumen
                    </p>

                    <p className="mt-4">
                      Servicio:{" "}
                      <strong>
                        {servicioActual?.nombre ??
                          "-"}
                      </strong>
                    </p>

                    <p className="mt-2">
                      Barbero:{" "}
                      <strong>
                        {barberoActual?.nombre ??
                          "-"}
                      </strong>
                    </p>

                    <p className="mt-2">
                      Fecha:{" "}
                      <strong>
                        {fecha || "-"}
                      </strong>
                    </p>

                    <p className="mt-2">
                      Hora:{" "}
                      <strong>
                        {hora || "-"}
                      </strong>
                    </p>

                    <p className="mt-2">
                      Total:{" "}
                      <strong className="text-yellow-500">
                        {servicioActual
                          ? `$${servicioActual.precio.toLocaleString(
                              "es-AR"
                            )}`
                          : "-"}
                      </strong>
                    </p>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      enviando
                    }
                    className="mt-7 w-full rounded-xl bg-yellow-500 py-4 font-black text-black disabled:opacity-50"
                  >
                    {enviando
                      ? "RESERVANDO..."
                      : "CONFIRMAR TURNO"}
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-white/10 bg-black py-10 text-center">
        <p className="font-black tracking-widest text-yellow-500">
          BARBER VIPP
        </p>

        <p className="mt-2 text-sm text-neutral-600">
          Sistema de turnos online
        </p>
      </footer>
    </main>
  );
}