import { db } from "@/lib/db";
import { notices } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import NoticesClient from "./NoticesClient";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Announcements & Notices - BJCC",
  description: "Read the latest rules, meeting notices, and official announcements from the Beltala Jr Cricket Council.",
  keywords: ["BJCC notice board", "cricket tournament announcements", "BJCC rules", "cricket council news"],
};

export default async function NoticesPage() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.createdAt));

  return <NoticesClient notices={allNotices} />;
}
