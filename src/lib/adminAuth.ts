import { cookies } from "next/headers";

const COOKIE_NAME = "barber_vipp_admin";

export async function isAdmin() {
  const token = process.env.ADMIN_SESSION_TOKEN;

  if (!token) {
    return false;
  }

  const cookieStore = await cookies();

  return cookieStore.get(COOKIE_NAME)?.value === token;
}

export const adminCookieName = COOKIE_NAME;