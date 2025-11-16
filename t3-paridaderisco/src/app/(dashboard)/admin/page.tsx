import { DataUpdateManager } from "~/features/admin/DataUpdateManager";
import { UserAdmin } from "~/components/admin/UserAdmin";

export default function AdminPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <UserAdmin />
      <DataUpdateManager />
    </div>
  );
}