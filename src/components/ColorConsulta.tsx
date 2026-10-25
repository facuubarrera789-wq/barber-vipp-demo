"use client";

export type TipoColor =
  | "Mechas"
  | "Color global"
  | "Personalizado";

const opciones: TipoColor[] = [
  "Mechas",
  "Color global",
  "Personalizado",
];

export default function ColorConsulta({
  habilitado,
  seleccionado,
  tipoColor,
  onActivar,
  onSeleccionarTipo,
}: {
  habilitado: boolean;
  seleccionado: boolean;
  tipoColor: TipoColor | null;
  onActivar: () => void;
  onSeleccionarTipo: (tipo: TipoColor) => void;
}) {
  if (!habilitado) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border p-6 transition md:p-8 ${
        seleccionado
          ? "border-yellow-500 bg-yellow-500/10"
          : "border-white/10 bg-[#111]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">
            Servicio personalizado
          </p>

          <h3 className="mt-3 text-2xl font-black">
            🎨 Color
          </h3>

          <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
            Mechas, color global o un trabajo
            personalizado. Elegís el día y después
            coordinás por WhatsApp con la barbería.
          </p>

          <p className="mt-3 text-sm font-bold text-yellow-500">
            Sin horario fijo · Precio y duración a coordinar
          </p>
        </div>

        {seleccionado && (
          <span className="rounded-full bg-yellow-500 px-4 py-2 text-xs font-black text-black">
            ELEGIDO
          </span>
        )}
      </div>

      {!seleccionado ? (
        <button
          type="button"
          onClick={onActivar}
          className="mt-6 w-full rounded-xl border border-yellow-500 bg-yellow-500 py-4 font-black text-black transition hover:bg-yellow-400"
        >
          ELEGIR COLOR
        </button>
      ) : (
        <>
          <p className="mt-7 text-sm font-bold text-neutral-300">
            ¿Qué tipo de trabajo querés consultar?
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {opciones.map((opcion) => {
              const activo =
                tipoColor === opcion;

              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() =>
                    onSeleccionarTipo(opcion)
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    activo
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-black hover:border-yellow-500/40"
                  }`}
                >
                  <p className="font-black">
                    {opcion}
                  </p>

                  {activo && (
                    <p className="mt-2 text-[10px] font-black">
                      SELECCIONADO
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}