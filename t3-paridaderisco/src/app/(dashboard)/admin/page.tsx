import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "~/lib/prisma";
import { env } from "~/env";
import { DataUpdateManager } from "~/features/admin/DataUpdateManager";
import { UserAdmin } from "~/components/admin/UserAdmin";
import { KnowledgeManager } from "~/components/admin/KnowledgeManager";
import { PortfolioAnalyzer } from "~/components/admin/PortfolioAnalyzer";

export default async function AdminPage() {
  // Verificar autenticação e role ADMIN
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      redirect("/portfolio");
    }
  } catch (error) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerenciar usuários, dados e base de conhecimento do sistema
        </p>
      </div>

      <PortfolioAnalyzer />
      <KnowledgeManager />
      <UserAdmin />
      <DataUpdateManager />
    </div>
  );
}