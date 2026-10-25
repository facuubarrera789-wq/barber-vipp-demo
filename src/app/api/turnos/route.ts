import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// CONSULTAR HORARIOS OCUPADOS
export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha");

  if (!fecha) {
    return NextResponse.json(
      { error: "Falta la fecha" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("turnos")
    .select("hora")
    .eq("fecha", fecha)
    .eq("estado", "confirmado");

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudieron consultar los horarios" },
      { status: 500 }
    );
  }

  const ocupados =
    data?.map((turno) =>
      String(turno.hora).slice(0, 5)
    ) ?? [];

  return NextResponse.json({ ocupados });
}

// CREAR TURNO
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nombre,
      apellido,
      telefono,
      servicioId,
      fecha,
      hora,
      formaPago,
    } = body;

    if (
      !nombre ||
      !apellido ||
      !telefono ||
      !servicioId ||
      !fecha ||
      !hora ||
      !formaPago
    ) {
      return NextResponse.json(
        { error: "Completá todos los datos" },
        { status: 400 }
      );
    }

    // SERVICIO ACTIVO Y PRECIO ACTUAL
    const {
      data: servicio,
      error: errorServicio,
    } = await supabaseAdmin
      .from("servicios")
      .select(
        "id,nombre,precio,duracion_minutos,activo"
      )
      .eq("id", Number(servicioId))
      .eq("activo", true)
      .single();

    if (errorServicio || !servicio) {
      return NextResponse.json(
        { error: "Servicio inválido o desactivado" },
        { status: 400 }
      );
    }

    // COMPROBAR QUE EL HORARIO ESTÉ ACTIVO
    const {
      data: horarioActivo,
      error: errorHorario,
    } = await supabaseAdmin
      .from("horarios")
      .select("id,hora,activo")
      .eq("hora", hora)
      .eq("activo", true)
      .maybeSingle();

    if (errorHorario) {
      console.error(errorHorario);

      return NextResponse.json(
        { error: "No se pudo comprobar el horario" },
        { status: 500 }
      );
    }

    if (!horarioActivo) {
      return NextResponse.json(
        {
          error:
            "Ese horario no está disponible para reservas.",
        },
        { status: 400 }
      );
    }

    if (
      ![
        "Efectivo",
        "Transferencia",
        "Tarjeta",
      ].includes(formaPago)
    ) {
      return NextResponse.json(
        { error: "Forma de pago inválida" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("turnos")
      .insert({
        nombre,
        apellido,
        telefono,
        servicio: servicio.nombre,
        precio: servicio.precio,
        fecha,
        hora,
        forma_pago: formaPago,
        estado: "confirmado",
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ese horario acaba de ser reservado. Elegí otro.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo guardar el turno" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        turno: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}