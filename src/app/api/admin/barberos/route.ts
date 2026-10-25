import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const nombre =
      String(
        body.nombre ?? ""
      ).trim();

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "Ingresá el nombre del barbero",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("barberos")
        .insert({
          nombre,
          activo: true,
        })
        .select(
          "id,nombre,activo"
        )
        .single();

    if (error) {
      console.error(error);

      if (
        error.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "Ya existe un barbero con ese nombre",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "No se pudo agregar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      barbero: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo agregar el barbero",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    const activo =
      body.activo;

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Barbero inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof activo !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Estado inválido",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("barberos")
        .update({
          activo,
        })
        .eq("id", id)
        .select(
          "id,nombre,activo"
        )
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      barbero: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el barbero",
      },
      {
        status: 500,
      }
    );
  }
}