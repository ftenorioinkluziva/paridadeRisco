import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/20 to-secondary/20">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">
            <span className="text-primary">Paridade</span>
            <span className="text-foreground">Risco</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            Plataforma de gestão de investimentos com foco em paridade de risco
            para otimizar seu portfólio financeiro.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-4">
              Acessar Plataforma
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Criar Conta
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8 max-w-4xl">
          <div className="flex flex-col gap-4 rounded-xl bg-card p-6 text-card-foreground">
            <h3 className="text-xl font-bold">Paridade de Risco</h3>
            <p className="text-muted-foreground">
              Estratégia de alocação que equilibra o risco entre diferentes ativos.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-xl bg-card p-6 text-card-foreground">
            <h3 className="text-xl font-bold">Dashboard Inteligente</h3>
            <p className="text-muted-foreground">
              Visualize métricas, performance e recomendações em tempo real.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-xl bg-card p-6 text-card-foreground">
            <h3 className="text-xl font-bold">Gestão Simplificada</h3>
            <p className="text-muted-foreground">
              Interface moderna para gerenciar transações e rebalanceamento.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}