import { redirect } from "next/navigation";
import AdminAgenda from "../../components/AdminAgenda";
import { isAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const autorizado = await isAdmin();

  if (!autorizado) {
    redirect("/admin/login");
  }

  const [
    respuestaTurnos,
    respuestaServicios,
    respuestaHorarios,
  ] = await Promise.all([
    supabaseAdmin
      .from("turnos")
      .select(
        "id,nombre,apellido,telefono,servicio,precio,fecha,hora,forma_pago,estado"
      )
      .order("fecha", {
        ascending: true,
      })
      .order("hora", {
        ascending: true,
      }),

    supabaseAdmin
      .from("servicios")
      .select(
        "id,nombre,precio,duracion_minutos,activo"
      )
      .order("id", {
        ascending: true,
      }),

    supabaseAdmin
      .from("horarios")
      .select("id,hora,activo")
      .order("hora", {
        ascending: true,
      }),
  ]);

  if (respuestaTurnos.error) {
    console.error(
      "Error cargando turnos:",
      respuestaTurnos.error
    );
  }

  if (respuestaServicios.error) {
    console.error(
      "Error cargando servicios:",
      respuestaServicios.error
    );
  }

  if (respuestaHorarios.error) {
    console.error(
      "Error cargando horarios:",
      respuestaHorarios.error
    );
  }

  const turnos =
    respuestaTurnos.data ?? [];

  const servicios =
    respuestaServicios.data ?? [];

  const horarios =
    respuestaHorarios.data?.map(
      (horario) => ({
        id: Number(horario.id),

        hora: String(
          horario.hora
        ).slice(0, 5),

        activo: Boolean(
          horario.activo
        ),
      })
    ) ?? [];

  return (
    <AdminAgenda
      turnos={turnos}
      servicios={servicios}
      horarios={horarios}
    />
  );
}