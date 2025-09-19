import { redirect } from "next/navigation";
import { Suspense } from "react";
import HomeDashboardClient from "./(protected)/_components/HomeDashboardClient";
import { getServerAuthSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedHomePage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <Suspense fallback={null}>
      <HomeDashboardClient />
    </Suspense>
  );
}
