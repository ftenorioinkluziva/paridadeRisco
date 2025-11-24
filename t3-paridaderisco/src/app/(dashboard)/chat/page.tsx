import { InvestmentChat } from "~/components/chat/InvestmentChat";

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Consultor de Investimentos</h1>
        <p className="text-muted-foreground">
          Converse com o assistente especializado em Paridade de Risco
        </p>
      </div>

      <InvestmentChat />
    </div>
  );
}
