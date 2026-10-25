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

type Dia = {
  valor: string;
  nombre: string;
  numero: string;
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
    mostrarDemoWhatsApp,
    setMostrarDemoWhatsApp,
  ] = useState(false);

  const [
    horarios,
    setHorarios,
  ] = useState<string[]>([]);

  const [
    servicioSeleccionado,
    setServicioSeleccionado,
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
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const servicioActual =
    servicios.find(
      (servicio) =>
        servicio.id ===
        servicioSeleccionado
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

      const nuevosServicios =
        resultado.servicios ?? [];

      setServicios(
        nuevosServicios
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
    fechaElegida: string
  ) {
    if (
      !fechaElegida ||
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
          )}`,
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

      setOcupados(
        resultado.ocupados ??
          []
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
    cargarHorarios();
  }, []);

  useEffect(() => {
    setHora("");
    setError("");
    setMensaje("");
    setMostrarDemoWhatsApp(
      false
    );

    if (!fecha) {
      setOcupados([]);
      return;
    }

    if (modoColor) {
      setOcupados([]);
      return;
    }

    cargarOcupados(fecha);
  }, [fecha, modoColor]);

  function seleccionarServicio(
    servicio: Servicio
  ) {
    setModoColor(false);
    setTipoColor(null);

    setMostrarDemoWhatsApp(
      false
    );

    setHora("");
    setError("");
    setMensaje("");

    setServicioSeleccionado(
      (actual) =>
        actual === servicio.id
          ? null
          : servicio.id
    );
  }

  function activarColor() {
    setModoColor(true);

    setServicioSeleccionado(
      null
    );

    setTipoColor(null);

    setHora("");
    setOcupados([]);

    setError("");
    setMensaje("");

    setMostrarDemoWhatsApp(
      false
    );
  }

  function seleccionarTipoColor(
    tipo: TipoColor
  ) {
    setModoColor(true);

    setTipoColor(tipo);

    setServicioSeleccionado(
      null
    );

    setHora("");
    setOcupados([]);

    setMostrarDemoWhatsApp(
      false
    );
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

  async function confirmarTurno(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (modoColor) {
      return;
    }

    if (!servicioActual) {
      setError(
        "Elegí un servicio."
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
            fecha
          );
        }

        throw new Error(
          resultado.error ||
            "No se pudo reservar el turno"
        );
      }

      setMensaje(
        "¡Turno reservado correctamente!"
      );

      setNombre("");
      setApellido("");
      setTelefono("");
      setFormaPago("");

      setServicioSeleccionado(
        null
      );

      setHora("");

      await cargarOcupados(
        fecha
      );
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
              Reservá tu turno online
              de forma rápida, simple
              y segura.
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
                      className={`rounded-2xl border p-5 text-left ${
                        seleccionado
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-white/10 bg-black"
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

        {/* DÍA */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
              2
            </div>

            <h3 className="text-2xl font-black">
              Elegí una fecha
            </h3>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {dias.map(
              (dia) => {
                const seleccionado =
                  fecha ===
                  dia.valor;

                return (
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
                      seleccionado
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
                );
              }
            )}
          </div>
        </section>

        {/* COLOR */}
        {modoColor && (
          <section className="mt-8 rounded-3xl border border-green-500/20 bg-[#0d0d0d] p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 font-black text-black">
                3
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-widest text-green-400">
                  Consulta
                </p>

                <h3 className="text-2xl font-black">
                  Coordiná por WhatsApp
                </h3>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-black p-6">
              <p className="text-sm text-neutral-500">
                Tipo de color
              </p>

              <p className="mt-1 text-xl font-black">
                {tipoColor
                  ? `🎨 ${tipoColor}`
                  : "Elegí Mechas, Color global o Personalizado"}
              </p>

              <p className="mt-5 text-sm text-neutral-500">
                Día preferido
              </p>

              <p className="mt-1 text-xl font-black">
                {fecha ||
                  "Elegí un día"}
              </p>

              <p className="mt-5 text-neutral-400">
                Para Color no se
                reserva un horario
                automáticamente.
                El horario, precio y
                duración se coordinan
                directamente con la
                barbería.
              </p>

              <button
                type="button"
                disabled={
                  !fecha ||
                  !tipoColor
                }
                onClick={() =>
                  setMostrarDemoWhatsApp(
                    true
                  )
                }
                className="mt-6 w-full rounded-xl bg-green-500 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!tipoColor
                  ? "PRIMERO ELEGÍ EL TIPO DE COLOR"
                  : !fecha
                    ? "PRIMERO ELEGÍ UN DÍA"
                    : "CONSULTAR POR WHATSAPP →"}
              </button>
            </div>

            {mostrarDemoWhatsApp &&
              tipoColor &&
              fecha && (
                <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
                  <p className="font-black text-green-400">
                    💬 Mensaje de WhatsApp
                  </p>

                  <div className="mt-4 rounded-xl bg-black/50 p-4 text-sm leading-6 text-neutral-300">
                    Hola, quiero
                    consultar por{" "}
                    <strong>
                      {tipoColor}
                    </strong>
                    . Mi día preferido
                    sería{" "}
                    <strong>
                      {fecha}
                    </strong>
                    . Quería coordinar
                    el trabajo, horario,
                    precio y duración.
                  </div>

                  <p className="mt-4 text-xs text-neutral-400">
                    En la página
                    personalizada este
                    botón abrirá el
                    WhatsApp real de la
                    barbería.
                  </p>
                </div>
              )}
          </section>
        )}

        {/* HORARIOS — SOLO SERVICIOS NORMALES */}
        {!modoColor && (
          <>
            <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                  3
                </div>

                <h3 className="text-2xl font-black">
                  Elegí la hora
                </h3>
              </div>

              {!fecha ? (
                <div className="mt-7 rounded-xl bg-black p-5 text-neutral-500">
                  Primero elegí un día.
                </div>
              ) : cargandoHorarios ||
                cargandoOcupados ? (
                <div className="mt-7 rounded-xl bg-black p-5 text-neutral-500">
                  Cargando horarios...
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
                              ? "cursor-not-allowed border-red-500/20 text-neutral-600"
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

            <form
              onSubmit={
                confirmarTurno
              }
              className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                  4
                </div>

                <h3 className="text-2xl font-black">
                  Confirmá tu reserva
                </h3>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <input
                  value={nombre}
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  placeholder="Nombre"
                  className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                />

                <input
                  value={apellido}
                  onChange={(e) =>
                    setApellido(
                      e.target.value
                    )
                  }
                  placeholder="Apellido"
                  className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                />

                <input
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(
                      e.target.value
                    )
                  }
                  placeholder="Teléfono"
                  className="rounded-xl border border-white/10 bg-black p-4 outline-none"
                />

                <select
                  value={formaPago}
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

              {error && (
                <div className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-400">
                  {error}
                </div>
              )}

              {mensaje && (
                <div className="mt-5 rounded-xl bg-green-500/10 p-4 text-green-400">
                  ✓ {mensaje}
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
      </section>

      <footer className="border-t border-white/10 bg-black py-10 text-center text-sm text-neutral-600">
        BARBER VIPP · Sistema de
        turnos online
      </footer>
    </main>
  );
}