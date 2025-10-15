# Estória 1.3: Reimplementação da Lógica de Negócio (Ativos e Portfólio)

**Como um desenvolvedor,** eu quero reimplementar os serviços de backend para ativos e portfólio em TypeScript, para que a aplicação possa gerenciar os dados financeiros conforme as regras de negócio.

### Critérios de Aceitação:
- A API expõe os roteadores `asset`, `portfolio` e `cesta` com todos os procedimentos definidos na arquitetura.
- O serviço `FinancialDataFetcher` é reimplementado para buscar dados das APIs externas e salvá-los no banco de dados.
- O procedimento `portfolio.getRebalancePlan` calcula corretamente as sugestões de compra/venda.
