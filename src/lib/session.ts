import { cookies } from "next/headers";

const SESSION_COOKIE = "bjcc_admin_session";

export async function setAdminSession() {
  const c = await cookies();
  c.set(SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
}

export async function getAdminSession() {
  const c = await cookies();
  return c.get(SESSION_COOKIE)?.value === "authenticated";
}

export async function destroyAdminSession() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}
