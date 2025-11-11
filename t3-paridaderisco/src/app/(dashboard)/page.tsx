import { redirect } from "next/navigation";

// Redirect /dashboard to /portfolio (Portfolio is the main dashboard)
export default function DashboardPage() {
  redirect("/portfolio");
}