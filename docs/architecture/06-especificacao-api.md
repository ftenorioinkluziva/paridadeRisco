# Especificação da API (tRPC)

## Roteador: auth
- **Propósito:** Gerenciar o registro e a autenticação de usuários.
- **Procedimentos:** `register`, `login`.

## Roteador: asset
- **Propósito:** Fornecer dados públicos sobre os ativos financeiros.
- **Procedimentos:** `list`, `getById`, `getHistory`.

## Roteador: portfolio (Protegido)
- **Propósito:** Gerenciar a carteira de investimentos e as transações do usuário autenticado.
- **Procedimentos:** `get`, `addTransaction`, `listTransactions`, `getRebalancePlan`.

## Roteador: cesta (Protegido)
- **Propósito:** Gerenciar as cestas (modelos de alocação).
- **Procedimentos:** `list`, `getById`, `create`.
