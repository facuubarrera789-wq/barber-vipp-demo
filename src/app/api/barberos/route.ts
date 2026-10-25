import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("barberos")
        .select("id,nombre,activo")
        .eq("activo", true)
        .order("id", {
          ascending: true,
        });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudieron cargar los barberos",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      barberos: data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los barberos",
      },
      {
        status: 500,
      }
    );
  }
}