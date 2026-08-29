"use server";

import { setAdminSession } from "@/lib/session";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password") as string;
  
  if (password === process.env.ADMIN_PASSWORD) {
    await setAdminSession();
    return { success: true };
  } else {
    return { success: false, error: "Invalid password" };
  }
}
