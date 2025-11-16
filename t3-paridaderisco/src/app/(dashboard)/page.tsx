import { redirect } from "next/navigation";

// Redirect /dashboard to /overview
export default function DashboardPage() {
  redirect("/overview");
}