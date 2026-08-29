import { db } from "@/lib/db";
import { notices } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import NoticesClient from "./NoticesClient";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.createdAt));

  return <NoticesClient notices={allNotices} />;
}
