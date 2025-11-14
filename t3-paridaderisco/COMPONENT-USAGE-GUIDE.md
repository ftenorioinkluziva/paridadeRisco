# Guia de Uso dos Componentes UI/UX

Este guia mostra como usar os componentes atualizados conforme a especificação UI/UX.

## 📦 Componentes Base

### Card

Cards agora suportam glassmorphism e múltiplas variantes:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"

// Card padrão com glassmorphism
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>

// Card com hover effect
<Card variant="glass-hover">
  <CardContent>Card interativo</CardContent>
</Card>

// Card ativo (selecionado)
<Card variant="active">
  <CardContent>Cenário ativo</CardContent>
</Card>

// Cards de status
<Card variant="success">
  <CardContent>Meta Atingível!</CardContent>
</Card>

<Card variant="error">
  <CardContent>Ajustes Necessários</CardContent>
</Card>

<Card variant="warning">
  <CardContent>Atenção</CardContent>
</Card>

<Card variant="info">
  <CardContent>Informação</CardContent>
</Card>
```

### Button

Botões agora seguem a especificação com animações e cores atualizadas:

```tsx
import { Button } from "~/components/ui/button"

// Botão primário (ação principal)
<Button>
  <Icon className="h-4 w-4 mr-2" />
  Ação Principal
</Button>

// Botão secundário
<Button variant="outline">
  Ação Secundária
</Button>

// Botão ghost (ação sutil)
<Button variant="ghost">
  Ação Sutil
</Button>

// Botão destrutivo
<Button variant="destructive">
  <Trash2 className="h-4 w-4 mr-2" />
  Excluir
</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>

// Estado de loading
<Button disabled>
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
  Processando...
</Button>
```

### Input

Inputs agora suportam variantes de validação:

```tsx
import { Input } from "~/components/ui/input"

// Input padrão
<Input
  type="text"
  placeholder="Digite aqui..."
  className="w-full"
/>

// Input com erro
<Input
  variant="error"
  type="text"
  value={value}
/>

// Input com sucesso
<Input
  variant="success"
  type="text"
  value={value}
/>
```

### Badge

Badges agora têm múltiplas variantes:

```tsx
import { Badge } from "~/components/ui/badge"

<Badge>Padrão</Badge>
<Badge variant="primary">Primário</Badge>
<Badge variant="success">Sucesso</Badge>
<Badge variant="error">Erro</Badge>
<Badge variant="warning">Aviso</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="active">Ativo</Badge>
<Badge variant="outline">Outline</Badge>
```

## 💰 Componentes Financeiros

### InputComValidacao

Input com validação inline, ícones e mensagens:

```tsx
import { InputComValidacao } from "~/components/financial"
import { DollarSign } from "lucide-react"

<InputComValidacao
  label="Aporte Mensal"
  placeholder="R$ 0,00"
  icon={<DollarSign className="h-4 w-4" />}
  hint="Valor que você pode investir mensalmente"
  required
  value={value}
  onChange={handleChange}
/>

// Com erro
<InputComValidacao
  label="Idade"
  error="Idade deve ser maior que 18 anos"
  value={value}
/>

// Com informação dinâmica
<InputComValidacao
  label="Taxa"
  dynamicInfo="Taxa CDI atual: 10,50% a.a."
  value={value}
/>
```

### StatCard

Cards para métricas financeiras:

```tsx
import { StatCard } from "~/components/financial"

<StatCard
  label="Valor Atual"
  value="R$ 1.500.000,00"
  info="Última atualização: hoje"
/>

<StatCard
  variant="success"
  label="Retorno 12M"
  value="+15,3%"
/>

<StatCard
  variant="error"
  label="Diferença"
  value="-R$ 50.000"
/>

// Grid de estatísticas
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <StatCard label="CDI" value="10,50%" variant="info" />
  <StatCard label="IPCA" value="4,82%" variant="success" />
  <StatCard label="Dólar" value="R$ 5,25" variant="warning" />
  <StatCard label="Meta" value="85%" variant="default" />
</div>
```

### LoadingSpinner

Spinners e cards de loading:

```tsx
import { LoadingSpinner, LoadingCard } from "~/components/financial"

// Spinner inline
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" text="Calculando..." />
<LoadingSpinner size="lg" />

// Card de loading completo
<LoadingCard text="Carregando dados financeiros..." />
```

### EmptyState

Estados vazios informativos:

```tsx
import { EmptyState } from "~/components/financial"
import { FolderOpen } from "lucide-react"
import { Button } from "~/components/ui/button"

<EmptyState
  icon={FolderOpen}
  title="Nenhum cenário criado"
  description="Crie seu primeiro cenário para comparar diferentes estratégias de investimento."
  action={
    <Button>
      Criar Primeiro Cenário
    </Button>
  }
/>
```

## 🎨 Classes Utilitárias

### Glassmorphism

```tsx
// Card com glassmorphism
<div className="glass-card border border-slate-700 rounded-lg p-6">
  Conteúdo com efeito de vidro fosco
</div>

// Com hover
<div className="glass-card-hover border border-slate-700 rounded-lg p-4">
  Card interativo
</div>

// Card ativo
<div className="glass-card-active border rounded-lg p-4">
  Card selecionado
</div>
```

### Status Cards

```tsx
// Sucesso
<div className="status-card-success rounded-lg p-4">
  <div className="flex items-center gap-3">
    <CheckCircle className="h-6 w-6 text-green-400" />
    <h3 className="text-xl font-bold text-green-400">Meta Atingível!</h3>
  </div>
</div>

// Erro
<div className="status-card-error rounded-lg p-4">
  <div className="flex items-center gap-3">
    <AlertTriangle className="h-6 w-6 text-red-400" />
    <h3 className="text-xl font-bold text-red-400">Ajustes Necessários</h3>
  </div>
</div>

// Warning
<div className="status-card-warning rounded-lg p-4">
  Atenção necessária
</div>

// Info
<div className="status-card-info rounded-lg p-4">
  Informação importante
</div>
```

### Animações

```tsx
// Fade in up
<div className="animate-fade-in-up">
  Aparece de baixo para cima
</div>

// Com delays
<div className="animate-fade-in-up-delay-100">Delay 100ms</div>
<div className="animate-fade-in-up-delay-200">Delay 200ms</div>
<div className="animate-fade-in-up-delay-300">Delay 300ms</div>

// Scale in
<div className="animate-scale-in">
  Aparece com zoom
</div>

// Slide from left
<div className="animate-slide-in-left">
  Entra pela esquerda
</div>

// Hover grow
<div className="hover-grow">
  Cresce no hover
</div>
```

### Transições

```tsx
// Transições padrão
<div className="transition-fast">Transição rápida (150ms)</div>
<div className="transition-default">Transição padrão (200ms)</div>
<div className="transition-medium">Transição média (300ms)</div>
```

### Shadows

```tsx
// Sombras
<div className="shadow-card">Sombra de card</div>
<div className="shadow-card-hover">Sombra no hover</div>
<div className="shadow-modal">Sombra de modal</div>

// Glow effects
<div className="shadow-glow-success">Brilho verde</div>
<div className="shadow-glow-error">Brilho vermelho</div>
<div className="shadow-glow-info">Brilho azul</div>
```

## 🎯 Padrões de Layout

### Container Principal

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
  <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8 max-w-7xl">
    {/* Conteúdo */}
  </div>
</div>
```

### Grid de 2 Colunas

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {/* Coluna esquerda */}
  <div className="space-y-6">
    <Card>Formulário</Card>
  </div>

  {/* Coluna direita */}
  <div className="space-y-6">
    <Card>Resultados</Card>
  </div>
</div>
```

### Grid Responsivo

```tsx
// 1 col mobile, 2 cols tablet, 3 cols desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>

// 2 cols mobile, 5 cols desktop
<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
  <StatCard label="Stat 1" value="100" />
  <StatCard label="Stat 2" value="200" />
  <StatCard label="Stat 3" value="300" />
  <StatCard label="Stat 4" value="400" />
  <StatCard label="Stat 5" value="500" />
</div>
```

## 🎨 Cores CSS Customizadas

### Usando variáveis CSS

```tsx
// Cores semânticas
<div style={{ color: 'rgb(var(--success))' }}>Texto verde</div>
<div style={{ backgroundColor: 'rgb(var(--error-bg))' }}>Fundo vermelho</div>

// Cores financeiras
<div style={{ color: 'rgb(var(--financial-cdi))' }}>CDI</div>
<div style={{ color: 'rgb(var(--financial-ipca))' }}>IPCA</div>
<div style={{ color: 'rgb(var(--financial-selic))' }}>SELIC</div>
```

## 📱 Responsividade

### Breakpoints

- **sm**: 640px (tablets pequenos)
- **md**: 768px (tablets)
- **lg**: 1024px (desktops pequenos)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (desktops grandes)

### Texto Responsivo

```tsx
<h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
  Título Responsivo
</h1>

<p className="text-sm sm:text-base lg:text-lg text-slate-300">
  Parágrafo responsivo
</p>
```

### Espaçamento Responsivo

```tsx
<div className="space-y-4 sm:space-y-6">
  {/* Espaçamento vertical responsivo */}
</div>

<div className="grid gap-3 sm:gap-4">
  {/* Gap responsivo em grids */}
</div>

<Card className="p-3 sm:p-4 lg:p-6">
  {/* Padding responsivo */}
</Card>
```

## ♿ Acessibilidade

### Labels e IDs

```tsx
<Label htmlFor="idade" className="text-slate-300">
  Idade Atual
</Label>
<Input
  id="idade"
  aria-describedby="idade-hint"
  aria-invalid={hasError}
/>
<p id="idade-hint" className="text-xs text-slate-400">
  Sua idade atual em anos
</p>
```

### ARIA

```tsx
// Loading state
<div role="status" aria-live="polite" aria-label="Carregando dados">
  <LoadingSpinner />
</div>

// Alert
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Button com ícone
<Button aria-label="Excluir cenário">
  <Trash2 aria-hidden="true" />
</Button>
```

### Screen Reader Only

```tsx
<span className="sr-only">Texto apenas para leitores de tela</span>
```

## 🚀 Exemplo Completo

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { InputComValidacao, StatCard, LoadingSpinner } from "~/components/financial"
import { DollarSign, TrendingUp } from "lucide-react"

export default function ExamplePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl sm:text-4xl font-bold text-white mb-6">
        Dashboard Financeiro
      </h1>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="CDI" value="10,50%" variant="info" />
        <StatCard label="IPCA" value="4,82%" variant="success" />
        <StatCard label="Retorno" value="+15%" variant="success" />
        <StatCard label="Meta" value="85%" />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              Calculadora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputComValidacao
              label="Aporte Mensal"
              placeholder="R$ 0,00"
              icon={<DollarSign className="h-4 w-4" />}
              hint="Valor que você pode investir mensalmente"
              required
            />

            <Button className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Calcular
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card variant="success">
          <CardHeader>
            <CardTitle className="text-green-400">
              Meta Atingível!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              Seu plano atual conseguirá sustentar a renda desejada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 📚 Recursos Adicionais

- **Especificação Completa**: `UI-UX-SPECIFICATION.md`
- **Estilos Globais**: `src/app/globals.css`
- **Componentes UI**: `src/components/ui/`
- **Componentes Financeiros**: `src/components/financial/`
