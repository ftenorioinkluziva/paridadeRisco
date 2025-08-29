# Modelos de Dados

## Schema do Banco de Dados (schema.prisma)
```prisma
// 1. Definição dos Enums (Tipos de Dados Customizados)
enum AssetCalculationType {
  PRECO      // Para ativos como Ações, ETFs
  PERCENTUAL // Para ativos como CDI
}
enum TransactionType {
  COMPRA
  VENDA
}

// 2. Definição dos Modelos (Tabelas)
model User {
  id         String      @id @default(cuid())
  name       String
  email      String      @unique
  phone      String
  password   String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  cestas     Cesta[]
  portfolio  Portfolio?
  transacoes Transacao[]
}

model Portfolio {
  id          String   @id @default(cuid())
  cashBalance Decimal  @db.Decimal(12, 2)
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
}

model Cesta {
  id         String           @id @default(cuid())
  name       String
  userId     String
  user       User             @relation(fields: [userId], references: [id])
  ativos     AtivosEmCestas[]
}

model Ativo {
  id              String               @id @default(cuid())
  ticker          String               @unique
  name            String
  type            String
  calculationType AssetCalculationType
  dadosHistoricos DadoHistorico[]
  cestas          AtivosEmCestas[]
  transacoes      Transacao[]
}

model AtivosEmCestas {
  cestaId          String
  cesta            Cesta            @relation(fields: [cestaId], references: [id])
  ativoId          String
  ativo            Ativo            @relation(fields: [ativoId], references: [id])
  targetPercentage Decimal          @db.Decimal(5, 2)

  @@id([cestaId, ativoId])
}

model DadoHistorico {
  id               String    @id @default(cuid())
  date             DateTime
  price            Decimal?  @db.Decimal(10, 2)
  percentageChange Decimal?  @db.Decimal(10, 4)
  ativoId          String
  ativo            Ativo     @relation(fields: [ativoId], references: [id])

  @@unique([ativoId, date])
}

model Transacao {
  id            String          @id @default(cuid())
  type          TransactionType
  shares        Decimal         @db.Decimal(18, 8)
  pricePerShare Decimal         @db.Decimal(10, 2)
  date          DateTime
  
  ativoId       String
  ativo         Ativo           @relation(fields: [ativoId], references: [id])
  
  userId        String
  user          User            @relation(fields: [userId], references: [id])
}
```
