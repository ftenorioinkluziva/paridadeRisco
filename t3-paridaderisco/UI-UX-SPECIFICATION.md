# Especificação UI/UX Completa
## Sistema de Planejamento de Aposentadoria

**Versão**: 1.0
**Data**: 2025
**Framework**: Next.js 15 + React + TypeScript + Tailwind CSS

---

## 📋 Índice

1. [Visão Geral do Design System](#1-visão-geral-do-design-system)
2. [Fundamentos Visuais](#2-fundamentos-visuais)
3. [Componentes de Interface](#3-componentes-de-interface)
4. [Padrões de Interação](#4-padrões-de-interação)
5. [Layout e Responsividade](#5-layout-e-responsividade)
6. [Feedback Visual e Estados](#6-feedback-visual-e-estados)
7. [Navegação e Fluxos](#7-navegação-e-fluxos)
8. [Visualização de Dados](#8-visualização-de-dados)
9. [Acessibilidade](#9-acessibilidade)
10. [Animações e Transições](#10-animações-e-transições)

---

## 1. Visão Geral do Design System

### 1.1 Filosofia de Design

**Princípios Fundamentais:**
- **Clareza Financeira**: Apresentar dados financeiros complexos de forma compreensível
- **Confiança**: Design profissional que transmite segurança em planejamento financeiro
- **Progressividade**: Interface que guia o usuário do simples ao complexo
- **Feedback Imediato**: Cálculos e validações em tempo real
- **Profissionalismo Acessível**: Aparência sofisticada sem intimidar usuários iniciantes

### 1.2 Arquitetura Visual

**Hierarquia de Informações:**
```
Nível 1: Background Gradient (Atmosférico)
Nível 2: Cards com Glassmorphism (Conteúdo Principal)
Nível 3: Elementos Interativos (Inputs, Botões)
Nível 4: Overlays e Modais (Ações Focadas)
Nível 5: Tooltips e Hints (Informações Contextuais)
```

---

## 2. Fundamentos Visuais

### 2.1 Paleta de Cores

#### Cores Primárias (Tema Escuro)
```css
/* Background Base */
--bg-primary: linear-gradient(to-br, #0f172a, #1e3a8a, #0f172a);
  /* from-slate-900 via-blue-900 to-slate-900 */

--bg-card: rgba(30, 41, 59, 0.5);           /* slate-800/50 */
--bg-card-hover: rgba(30, 41, 59, 0.7);     /* slate-800/70 */

/* Bordes e Divisores */
--border-default: #334155;                   /* slate-700 */
--border-input: #475569;                     /* slate-600 */
--border-focus: #60A5FA;                     /* blue-400 */

/* Textos */
--text-primary: #ffffff;                     /* white */
--text-secondary: #cbd5e1;                   /* slate-300 */
--text-muted: #94a3b8;                       /* slate-400 */
--text-disabled: #64748b;                    /* slate-500 */
```

#### Cores Semânticas
```css
/* Sucesso / Positivo */
--success-bg: rgba(6, 78, 59, 0.2);         /* green-900/20 */
--success-border: #15803d;                   /* green-700 */
--success-text: #4ade80;                     /* green-400 */
--success-text-light: #86efac;               /* green-300 */

/* Erro / Negativo */
--error-bg: rgba(127, 29, 29, 0.2);         /* red-900/20 */
--error-border: #b91c1c;                     /* red-700 */
--error-text: #f87171;                       /* red-400 */
--error-icon: #ef4444;                       /* red-500 */

/* Alerta / Atenção */
--warning-bg: rgba(113, 63, 18, 0.2);       /* yellow-900/20 */
--warning-border: #a16207;                   /* yellow-700 */
--warning-text: #fbbf24;                     /* yellow-400 */

/* Informação / Neutro */
--info-bg: rgba(30, 58, 138, 0.2);          /* blue-900/20 */
--info-border: #1d4ed8;                      /* blue-700 */
--info-text: #60a5fa;                        /* blue-400 */
--info-text-light: #93c5fd;                  /* blue-300 */
```

#### Cores Funcionais (Indicadores Financeiros)
```css
/* CDI / Taxa de Juros */
--financial-cdi: #3B82F6;                    /* blue-500 */

/* IPCA / Inflação */
--financial-ipca: #10B981;                   /* green-500 */

/* SELIC */
--financial-selic: #8B5CF6;                  /* purple-500 */

/* Dólar */
--financial-usd: #EF4444;                    /* red-500 */

/* Transição / Marco */
--financial-milestone: #F59E0B;              /* amber-500 */

/* ETFs */
--financial-etf-1: #FF6B35;                  /* orange */
--financial-etf-2: #9D4EDD;                  /* purple */
--financial-etf-3: #06FFA5;                  /* cyan-green */
--financial-etf-4: #FFB700;                  /* gold */
--financial-etf-5: #C77DFF;                  /* light purple */
```

### 2.2 Tipografia

#### Família de Fontes
```css
font-family: Arial, Helvetica, sans-serif;
```

#### Escala Tipográfica
```css
/* Títulos */
--text-4xl: 2.25rem;    /* 36px - Hero Title */
--text-3xl: 1.875rem;   /* 30px - Page Title */
--text-2xl: 1.5rem;     /* 24px - Section Title */
--text-xl: 1.25rem;     /* 20px - Card Title */
--text-lg: 1.125rem;    /* 18px - Subsection */

/* Corpo */
--text-base: 1rem;      /* 16px - Body */
--text-sm: 0.875rem;    /* 14px - Small body */
--text-xs: 0.75rem;     /* 12px - Captions, labels */
```

#### Pesos de Fonte
```css
--font-bold: 700;       /* Títulos principais, valores monetários */
--font-semibold: 600;   /* Subtítulos, labels importantes */
--font-medium: 500;     /* Labels padrão */
--font-normal: 400;     /* Texto corpo */
```

### 2.3 Espaçamento

#### Sistema de Escala (baseado em 4px)
```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

#### Aplicação de Espaçamento
- **Entre Cards**: `space-y-6` (24px)
- **Padding Card**: `p-6` (24px)
- **Gap em Grids**: `gap-3 sm:gap-4` (12-16px responsivo)
- **Margem de Seções**: `mb-4 sm:mb-6` (16-24px responsivo)

### 2.4 Bordas e Sombras

#### Raios de Borda
```css
--radius-sm: 0.25rem;   /* 4px - Badges */
--radius-md: 0.5rem;    /* 8px - Inputs, buttons */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Modais */
--radius-full: 9999px;  /* Elementos circulares */
```

#### Sombras
```css
/* Card Shadow */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

/* Card Hover */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

/* Modal Shadow */
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Glow Effect (Success) */
box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
```

---

## 3. Componentes de Interface

### 3.1 Cards (Containeres Principais)

#### Estrutura Base
```tsx
<Card className="bg-slate-800/50 backdrop-blur border-slate-700">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white">
      <Icon className="h-5 w-5 text-blue-400" />
      Título do Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
</Card>
```

#### Variantes de Cards

**1. Card Padrão (Informativo)**
```css
background: rgba(30, 41, 59, 0.5);  /* slate-800/50 */
backdrop-filter: blur(8px);
border: 1px solid #334155;          /* slate-700 */
border-radius: 0.75rem;             /* 12px */
```

**2. Card de Status (Sucesso)**
```css
background: rgba(6, 78, 59, 0.2);   /* green-900/20 */
border-left: 4px solid #4ade80;     /* green-400 */
border-top/right/bottom: 1px solid #15803d;
```

**3. Card de Status (Erro)**
```css
background: rgba(127, 29, 29, 0.2); /* red-900/20 */
border-left: 4px solid #f87171;     /* red-400 */
border-top/right/bottom: 1px solid #b91c1c;
```

**4. Card de Cenário Ativo**
```css
background: linear-gradient(to right,
  rgba(30, 58, 138, 0.3),           /* blue-900/30 */
  rgba(30, 64, 175, 0.2));          /* blue-800/20 */
border: 1px solid rgba(37, 99, 235, 0.5);
box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
```

### 3.2 Inputs e Formulários

#### Input com Validação
```tsx
<div className="relative">
  {/* Ícone esquerdo (opcional) */}
  <div className="absolute left-3 top-3 h-4 w-4 text-slate-400">
    <DollarSign />
  </div>

  {/* Input */}
  <Input
    className={`
      bg-slate-700
      border-slate-600
      text-white
      font-bold
      focus:border-blue-400
      focus:ring-1
      focus:ring-blue-400/20
      ${hasIcon ? 'pl-10' : 'pl-3'}
      ${hasError ? 'border-red-500 focus:border-red-500' : ''}
    `}
  />

  {/* Ícone de erro (direito) */}
  {hasError && (
    <div className="absolute right-3 top-3">
      <AlertTriangle className="h-4 w-4 text-red-500" />
    </div>
  )}
</div>

{/* Mensagem de erro */}
{hasError && (
  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
    <AlertTriangle className="h-3 w-3" />
    <span>{errorMessage}</span>
  </p>
)}

{/* Dica contextual */}
{!hasError && hasHint && (
  <p className="text-xs text-slate-400 mt-1">{hintText}</p>
)}

{/* Informação dinâmica (dados em tempo real) */}
{!hasError && hasDynamicInfo && (
  <p className="text-xs text-blue-400 mt-1">{dynamicInfo}</p>
)}
```

#### Estados de Input
- **Default**: `bg-slate-700 border-slate-600`
- **Hover**: `border-slate-500`
- **Focus**: `border-blue-400 ring-1 ring-blue-400/20`
- **Error**: `border-red-500 focus:border-red-500`
- **Disabled**: `opacity-50 pointer-events-none`

#### Padrão de Labels
```tsx
<Label className="text-slate-300 text-sm font-medium block mb-1">
  Nome do Campo
</Label>
```

### 3.3 Botões

#### Variantes de Botão

**1. Botão Primário (Ação Principal)**
```tsx
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  <Icon className="h-4 w-4 mr-2" />
  Ação Principal
</Button>
```

**2. Botão Secundário (Ação Alternativa)**
```tsx
<Button
  variant="outline"
  className="border-slate-500 text-slate-300 hover:bg-slate-600/50"
>
  Ação Secundária
</Button>
```

**3. Botão Ghost (Ação Sutil)**
```tsx
<Button
  variant="ghost"
  className="text-slate-400 hover:text-white hover:bg-slate-600/50"
>
  <Icon className="h-4 w-4 mr-2" />
  Ação Sutil
</Button>
```

**4. Botão Destrutivo**
```tsx
<Button
  variant="ghost"
  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
>
  <Trash2 className="h-4 w-4 mr-2" />
  Excluir
</Button>
```

#### Tamanhos de Botão
```tsx
size="sm"      // h-8 px-3 text-xs
size="default" // h-10 px-4 text-sm
size="lg"      // h-11 px-8 text-base
```

#### Estados de Botão
```tsx
{/* Loading State */}
<Button disabled>
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
  Processando...
</Button>

{/* Disabled State */}
<Button disabled className="opacity-50 pointer-events-none">
  Desabilitado
</Button>
```

### 3.4 Alertas e Feedback

#### Alert Component
```tsx
{/* Alerta Informativo */}
<Card className="border-l-4 border-l-blue-400 bg-blue-900/20 border-blue-700">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3 mb-3">
      <Info className="h-6 w-6 text-blue-400" />
      <h3 className="text-xl font-bold text-blue-400">Título do Alerta</h3>
    </div>
    <p className="text-slate-300">Mensagem do alerta...</p>
  </CardContent>
</Card>

{/* Alerta de Validação Global */}
<Card className="border-l-4 border-l-red-400 bg-red-900/20 border-red-700">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3 mb-3">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <h3 className="text-xl font-bold text-red-400">Dados Inválidos</h3>
    </div>
    <p className="text-slate-300 mb-3">
      Corrija os erros nos campos destacados...
    </p>
    <div className="text-sm text-slate-400">
      <p className="flex items-center gap-2">
        <Info className="h-4 w-4" />
        Informação adicional
      </p>
    </div>
  </CardContent>
</Card>
```

### 3.5 Badges e Indicadores

#### Badge de Status
```tsx
{/* Ativo */}
<span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
  Ativo
</span>

{/* Sucesso */}
<span className="bg-green-600/20 text-green-300 px-2 py-0.5 rounded text-xs font-medium">
  Completo
</span>

{/* Contador */}
<span className="text-slate-500 text-xs bg-slate-700/50 px-2 py-1 rounded">
  {count} {count === 1 ? 'item' : 'itens'}
</span>
```

#### Indicador de Cor (Dot)
```tsx
{/* Pequeno (lista) */}
<div className="w-3 h-3 rounded-full" style={{backgroundColor: color}} />

{/* Grande (status ativo) */}
<div className="w-4 h-4 rounded-full bg-blue-400 shadow-lg" />
```

---

## 4. Padrões de Interação

### 4.1 Validação em Tempo Real

**Padrão de Validação:**
1. **Debounce**: 300ms após última digitação
2. **Validação**: Executar validações síncronas
3. **Feedback**: Mostrar erro inline imediatamente
4. **Cálculos**: Executar apenas se validação passar

**Implementação Visual:**
```tsx
// Estado Normal → Digitando → Validando (300ms) → Erro/Sucesso

// Erro: Border vermelha + ícone + mensagem
<Input className="border-red-500" />
<AlertTriangle className="text-red-500" />
<p className="text-red-400">Mensagem de erro</p>

// Sucesso: Border azul focus, sem indicador visual extra
<Input className="focus:border-blue-400" />
```

### 4.2 Hover e Interações do Mouse

#### Cards Interativos
```css
/* Estado Padrão */
.scenario-card {
  border: 1px solid rgba(100, 116, 139, 0.6);
  background: rgba(51, 65, 85, 0.2);
  transition: all 200ms;
}

/* Hover */
.scenario-card:hover {
  background: rgba(51, 65, 85, 0.4);
  border-color: #64748b;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Ativo */
.scenario-card.active {
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(30, 58, 138, 0.2);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Botões de Ação no Hover
```tsx
{/* Ações aparecem no hover do card */}
<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
  <Button size="sm" variant="ghost">
    <FolderOpen className="h-3 w-3 mr-1.5" />
    Carregar
  </Button>
</div>
```

### 4.3 Estados de Loading

#### Spinner Inline
```tsx
<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
```

#### Loading de Página/Card
```tsx
<Card className="bg-slate-800/50 backdrop-blur border-slate-700">
  <CardContent className="pt-6 text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
    <p className="text-slate-400">Carregando dados...</p>
  </CardContent>
</Card>
```

#### Indicador de Cálculo em Progresso
```tsx
{isCalculating && (
  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
    <span>Calculando...</span>
  </div>
)}
```

### 4.4 Empty States

**Padrão Visual:**
```tsx
<div className="text-center py-12 px-4">
  {/* Ícone em círculo */}
  <div className="bg-slate-700/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
    <FolderOpen className="h-8 w-8 text-slate-400" />
  </div>

  {/* Título */}
  <h6 className="text-slate-300 font-medium mb-2">
    Nenhum cenário criado
  </h6>

  {/* Descrição */}
  <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
    Crie seu primeiro cenário para comparar diferentes estratégias...
  </p>
</div>
```

---

## 5. Layout e Responsividade

### 5.1 Estrutura de Página

**Container Principal:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
  <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8 max-w-7xl">
    {/* Conteúdo */}
  </div>
</div>
```

**Breakpoints:**
```css
sm:  640px   /* Tablets pequenos */
md:  768px   /* Tablets */
lg:  1024px  /* Desktops pequenos */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Desktops grandes */
```

### 5.2 Grid Systems

#### Layout de 2 Colunas (Calculator Page)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {/* Coluna Esquerda - Formulário */}
  <div className="lg:col-span-1 space-y-6">
    <CalculatorForm />
    <ScenarioManager />
  </div>

  {/* Coluna Direita - Resultados */}
  <div className="lg:col-span-1 space-y-6">
    <ResultsPanel />
    <ScenarioComparison />
  </div>
</div>
```

#### Grid de Cards (Financial Data)
```tsx
{/* Responsivo: 1 col mobile, 2 cols tablet, 3 cols desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

#### Grid de Estatísticas
```tsx
{/* 2 colunas mobile, 5 colunas desktop */}
<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### 5.3 Responsividade de Texto

```tsx
{/* Títulos */}
<h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
  Título Principal
</h1>

{/* Descrições */}
<p className="text-slate-300 text-sm sm:text-base lg:text-lg">
  Descrição do texto
</p>
```

### 5.4 Responsividade de Espaçamento

```tsx
{/* Espaçamento entre seções */}
<div className="space-y-4 sm:space-y-6">

{/* Gaps em grids */}
<div className="grid gap-3 sm:gap-4">

{/* Padding de cards */}
<Card className="p-3 sm:p-4 lg:p-6">
```

---

## 6. Feedback Visual e Estados

### 6.1 Indicadores de Status Financeiro

#### Resultado Positivo (Meta Atingível)
```tsx
<Card className="border-l-4 border-l-green-400 bg-green-900/20 bg-slate-800/50 backdrop-blur border-slate-700">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <CheckCircle className="h-6 w-6 text-green-400" />
      <h3 className="text-xl font-bold text-green-400">
        Meta Atingível!
      </h3>
    </div>
    <p className="text-slate-300">
      Seu plano atual conseguirá sustentar...
    </p>
  </CardContent>
</Card>
```

#### Resultado Negativo (Ajustes Necessários)
```tsx
<Card className="border-l-4 border-l-red-400 bg-red-900/20 bg-slate-800/50 backdrop-blur border-slate-700">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <h3 className="text-xl font-bold text-red-400">
        Ajustes Necessários
      </h3>
    </div>
    <p className="text-slate-300">
      Você precisará aportar...
    </p>
  </CardContent>
</Card>
```

### 6.2 Fases do Plano de Aposentadoria

**Visualização em 3 Fases:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Fase 1: Acumulação */}
  <div className="bg-green-900/20 p-4 rounded-lg border-2 border-green-600">
    <h5 className="font-bold text-green-400 text-lg mb-3">
      Fase de Acumulação
    </h5>
    {/* Detalhes */}
  </div>

  {/* Fase 2: Transição */}
  <div className="bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-600">
    <h5 className="font-bold text-yellow-400 text-lg mb-3">
      Transição
    </h5>
    {/* Detalhes */}
  </div>

  {/* Fase 3: Aposentadoria */}
  <div className={`p-4 rounded-lg border-2 ${
    sustentavel
      ? 'bg-blue-900/20 border-blue-600'
      : 'bg-red-900/20 border-red-600'
  }`}>
    <h5 className={`font-bold text-lg mb-3 ${
      sustentavel ? 'text-blue-400' : 'text-red-400'
    }`}>
      Fase de Aposentadoria
    </h5>
    {/* Detalhes */}
  </div>
</div>
```

### 6.3 Indicadores de Variação

**Variação Positiva/Negativa:**
```tsx
<div className={`p-2 rounded border ${
  change >= 0
    ? 'border-green-700 bg-green-900/20'
    : 'border-red-700 bg-red-900/20'
}`}>
  <p className={`font-medium ${
    change >= 0 ? 'text-green-400' : 'text-red-400'
  }`}>
    Variação
  </p>
  <p className="text-white font-mono">
    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
  </p>
</div>
```

### 6.4 Progress Indicators

**Percentual de Meta:**
```tsx
<div className="bg-slate-700/30 p-3 rounded">
  <div className="flex justify-between mb-2">
    <span className="text-slate-300 text-sm">Progresso da Meta</span>
    <span className="text-white font-bold">{percentual}%</span>
  </div>
  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
    <div
      className={`h-full ${
        percentual >= 100 ? 'bg-green-500' :
        percentual >= 75 ? 'bg-blue-500' :
        percentual >= 50 ? 'bg-yellow-500' :
        'bg-red-500'
      }`}
      style={{width: `${Math.min(percentual, 100)}%`}}
    />
  </div>
</div>
```

---

## 7. Navegação e Fluxos

### 7.1 Navegação Principal (Tabs)

```tsx
<div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-1">
  <div className="flex gap-1">
    <Button
      variant={active ? "default" : "ghost"}
      className={`px-4 py-2 text-sm ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:text-white hover:bg-slate-700'
      }`}
    >
      <Calculator className="h-4 w-4 mr-2" />
      Calculadora
    </Button>

    <Button
      variant={active ? "default" : "ghost"}
      className={`px-4 py-2 text-sm ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:text-white hover:bg-slate-700'
      }`}
    >
      <TrendingUp className="h-4 w-4 mr-2" />
      Dados Financeiros
    </Button>
  </div>
</div>
```

### 7.2 Breadcrumbs e Navegação Contextual

```tsx
<Button
  onClick={onBack}
  variant="ghost"
  className="text-slate-400 hover:text-white mb-4"
>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Voltar
</Button>
```

### 7.3 Modais e Overlays

**Estrutura de Modal:**
```tsx
<Dialog>
  <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-white">
        Título do Modal
      </DialogTitle>
    </DialogHeader>

    {/* Conteúdo do modal */}
    <div className="space-y-4">
      {/* ... */}
    </div>

    {/* Ações */}
    <div className="flex gap-3 pt-4">
      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
        Confirmar
      </Button>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## 8. Visualização de Dados

### 8.1 Gráficos de Linha (Recharts)

**Configuração Padrão:**
```tsx
<ResponsiveContainer width="100%" height="100%">
  <LineChart
    data={data}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
  >
    {/* Grid */}
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

    {/* Eixos */}
    <XAxis dataKey="ano" stroke="#9CA3AF" />
    <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />

    {/* Tooltip customizado */}
    <Tooltip content={<CustomTooltip />} />

    {/* Legenda */}
    <Legend />

    {/* Linha de referência */}
    <ReferenceLine
      x={aposentadoriaAge}
      stroke="#F59E0B"
      strokeDasharray="5 5"
      label={{ value: "Aposentadoria", position: "top" }}
    />

    {/* Linha principal */}
    <Line
      type="monotone"
      dataKey="patrimonio"
      stroke="#3B82F6"
      strokeWidth={3}
      dot={{ r: 2 }}
      activeDot={{ r: 6, fill: "#60A5FA" }}
    />

    {/* Brush para navegação */}
    {showBrush && (
      <Brush dataKey="ano" height={30} stroke="#3B82F6" fill="#1E293B" />
    )}
  </LineChart>
</ResponsiveContainer>
```

**Tooltip Customizado:**
```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold">Idade: {label} anos</p>
        <p className="text-blue-400">
          Patrimônio: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-slate-300 text-sm">
          Fase: {payload[0].payload.fase}
        </p>
      </div>
    );
  }
  return null;
};
```

### 8.2 Controles de Gráfico

**Botões de Zoom:**
```tsx
<div className="flex items-center gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={handleZoomIn}
    className="h-8 w-8 p-0"
    title="Zoom na aposentadoria"
  >
    <ZoomInIcon className="h-3 w-3" />
  </Button>

  <Button
    size="sm"
    variant="outline"
    onClick={handleZoomOut}
    className="h-8 w-8 p-0"
    title="Zoom completo"
  >
    <ZoomOutIcon className="h-3 w-3" />
  </Button>

  <Button
    size="sm"
    variant="outline"
    onClick={() => setShowBrush(!showBrush)}
  >
    {showBrush ? 'Ocultar' : 'Navegação'}
  </Button>
</div>
```

**Seletor de Período:**
```tsx
<div className="flex gap-1">
  {['1M', '3M', '6M', '1Y', '2Y', '5Y', 'ALL'].map(range => (
    <Button
      key={range}
      size="sm"
      variant={timeRange === range ? "default" : "outline"}
      onClick={() => setTimeRange(range)}
      className="h-8 px-3 text-xs"
    >
      {range}
    </Button>
  ))}
</div>
```

### 8.3 Cartões de Estatísticas

**Mini Card de Métrica:**
```tsx
<div className="bg-blue-900/20 p-2 sm:p-3 rounded border border-blue-700">
  <p className="text-blue-400 font-medium text-xs sm:text-sm">
    Label da Métrica
  </p>
  <p className="text-white text-sm sm:text-base font-mono">
    {formatValue(value)}
  </p>
  <p className="text-slate-400 text-xs mt-1">
    Informação adicional
  </p>
</div>
```

**Legenda de Gráfico:**
```tsx
<div className="flex flex-wrap gap-4 text-sm">
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-blue-500" />
    <span className="text-slate-300">Fase de Acumulação</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-red-500" />
    <span className="text-slate-300">Fase de Aposentadoria</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-amber-500" />
    <span className="text-slate-300">Transição</span>
  </div>
</div>
```

### 8.4 Tabelas de Dados

**Estrutura de Tabela:**
```tsx
<div className="rounded-lg border border-slate-700 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* Cabeçalho */}
      <thead className="bg-slate-700/50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
            Coluna 1
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
            Valor
          </th>
        </tr>
      </thead>

      {/* Corpo */}
      <tbody className="bg-slate-800/30 divide-y divide-slate-700">
        <tr className="hover:bg-slate-700/30 transition-colors">
          <td className="px-4 py-3 text-sm text-white">
            Dado 1
          </td>
          <td className="px-4 py-3 text-sm text-white font-mono text-right">
            R$ 1.000,00
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 9. Acessibilidade

### 9.1 Contraste e Legibilidade

**Ratios de Contraste (WCAG AA):**
- Texto normal (16px+): mínimo 4.5:1
- Texto grande (18px+ ou 14px+ bold): mínimo 3:1
- Elementos UI: mínimo 3:1

**Combinações Aprovadas:**
- `#ffffff` em `#1e3a8a` (blue-900): 7.2:1 ✓
- `#cbd5e1` (slate-300) em `#0f172a` (slate-900): 11.3:1 ✓
- `#60a5fa` (blue-400) em `#0f172a`: 6.8:1 ✓

### 9.2 Navegação por Teclado

**Tab Order:**
1. Navegação principal
2. Inputs do formulário (ordem lógica)
3. Botões de ação
4. Links secundários

**Focus States:**
```css
.focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
  border-radius: 0.375rem;
}
```

### 9.3 Screen Readers

**Atributos ARIA:**
```tsx
{/* Loading State */}
<div role="status" aria-live="polite" aria-label="Carregando dados">
  <span className="sr-only">Carregando...</span>
  <div className="spinner" />
</div>

{/* Alert */}
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

{/* Button com ícone */}
<Button aria-label="Excluir cenário">
  <Trash2 aria-hidden="true" />
</Button>
```

### 9.4 Labels e Descrições

```tsx
{/* Input com label associado */}
<Label htmlFor="idade" className="text-slate-300">
  Idade Atual
</Label>
<Input
  id="idade"
  aria-describedby="idade-hint"
  aria-invalid={hasError}
  aria-errormessage={hasError ? "idade-error" : undefined}
/>
<p id="idade-hint" className="text-xs text-slate-400">
  Idade atual ou quando começará a poupar
</p>
{hasError && (
  <p id="idade-error" className="text-xs text-red-400">
    {errorMessage}
  </p>
)}
```

---

## 10. Animações e Transições

### 10.1 Transições de Interface

**Duração Padrão:**
```css
transition-all duration-200  /* 200ms - Interações rápidas */
transition-all duration-300  /* 300ms - Transições médias */
transition-opacity duration-200  /* Fade in/out */
```

**Easing:**
```css
ease-out /* Padrão para a maioria */
ease-in-out /* Movimentos complexos */
```

### 10.2 Animações de Loading

**Spinner:**
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
```

**Pulse (placeholder):**
```tsx
<div className="animate-pulse bg-slate-700 h-4 w-full rounded" />
```

### 10.3 Hover Effects

```css
/* Cards */
.card {
  transition: all 200ms ease-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Botões */
.button {
  transition: all 150ms ease-out;
}
.button:hover {
  transform: scale(1.02);
}
.button:active {
  transform: scale(0.98);
}
```

### 10.4 Fade In/Out

```tsx
{/* Aparecer/Desaparecer */}
<div className={`
  transition-opacity duration-200
  ${isVisible ? 'opacity-100' : 'opacity-0'}
`}>
  Conteúdo
</div>

{/* Aparecer com delay */}
<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
  Ações do card
</div>
```

### 10.5 Slide Animations

```tsx
{/* Slide down (acordeão) */}
@keyframes accordion-down {
  from { height: 0 }
  to { height: var(--radix-accordion-content-height) }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height) }
  to { height: 0 }
}
```

---

## 11. Padrões Específicos do Domínio

### 11.1 Formatação de Valores

**Monetários:**
```tsx
// Padrão brasileiro
formatCurrency(value): `R$ ${value.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

// Exemplos:
R$ 1.000,00
R$ 1.500.000,00
R$ 0,00
```

**Percentuais:**
```tsx
formatPercentage(value): `${value.toFixed(2)}%`

// Exemplos:
4,50%
100,00%
-2,35%
```

**Grandes Números (Abreviados):**
```tsx
// Em eixos de gráficos
formatLarge(value): `${(value / 1000000).toFixed(1)}M`

// Exemplos:
1.5M (1.500.000)
0.5M (500.000)
12.3M (12.300.000)
```

### 11.2 Ícones Financeiros

**Mapeamento de Contextos:**
```tsx
// Valores monetários
<DollarSign className="h-4 w-4" />

// Metas e objetivos
<Target className="h-4 w-4" />

// Patrimônio acumulado
<PiggyBank className="h-4 w-4" />

// Tendências e análises
<TrendingUp className="h-4 w-4" />

// Sucesso
<CheckCircle className="h-6 w-6 text-green-400" />

// Atenção/Ajustes
<AlertTriangle className="h-6 w-6 text-red-400" />

// Informação
<Info className="h-6 w-6 text-blue-400" />

// Calendário/Datas
<Calendar className="h-4 w-4" />

// Cenários
<FolderOpen className="h-5 w-5" />
```

### 11.3 Hierarquia de Informações Financeiras

**Ordem de Importância (Top → Bottom):**
1. **Status Principal**: Meta atingível ou não (verde/vermelho)
2. **Valores Chave**: Renda possível, aporte necessário
3. **Fases do Plano**: Acumulação → Transição → Aposentadoria
4. **Detalhes Técnicos**: Rendimento, inflação, IR
5. **Gráficos e Visualizações**: Evolução ao longo do tempo
6. **Dados Tabulares**: Detalhamento mês a mês

### 11.4 Indicadores de Saúde Financeira

**Cores por Faixa:**
```tsx
// Percentual da meta
>= 100%: green (sucesso total)
75-99%: blue (bom progresso)
50-74%: yellow (atenção)
< 50%: red (crítico)

// Sustentabilidade
Sustentável: blue (border-blue-600, text-blue-400)
Insustentável: red (border-red-600, text-red-400)
```

---

## 12. Implementação Técnica

### 12.1 Stack Tecnológico

```json
{
  "framework": "Next.js 15",
  "runtime": "React 19",
  "language": "TypeScript 5",
  "styling": "Tailwind CSS 3.4",
  "components": "shadcn/ui (Radix UI)",
  "charts": "Recharts",
  "icons": "Lucide React",
  "forms": "React Hook Form + Zod",
  "backend": "Supabase (PostgreSQL)"
}
```

### 12.2 Estrutura de Componentes

```
components/
├── ui/                    # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── calculator/            # Calculadora de aposentadoria
│   ├── CalculatorForm.tsx
│   ├── InputComValidacao.tsx
│   └── ...
├── results/               # Painéis de resultados
│   └── ResultsPanel.tsx
├── charts/                # Gráficos
│   ├── PatrimonioChart.tsx
│   └── RendaChart.tsx
├── scenarios/             # Gerenciamento de cenários
│   ├── ScenarioManager.tsx
│   └── ScenarioComparison.tsx
├── financial/             # Dados financeiros
│   ├── FinancialDataChart.tsx
│   └── DataManagement.tsx
└── auth/                  # Autenticação
    ├── AuthModal.tsx
    └── UserMenu.tsx
```

### 12.3 Convenções de Código

**Nomenclatura de Classes:**
```tsx
// Componentes: PascalCase
<CalculatorForm />

// Propriedades/variáveis: camelCase
const [activeScenario, setActiveScenario] = useState()

// Constantes: UPPER_SNAKE_CASE
const DADOS_PADRAO = {...}

// CSS: kebab-case via Tailwind
className="bg-slate-800 border-blue-400"
```

**Organização de Props:**
```tsx
// Ordem de props
<Component
  // 1. Key/ref
  key={id}
  ref={ref}

  // 2. Dados
  value={value}
  data={data}

  // 3. Callbacks
  onChange={handleChange}
  onClick={handleClick}

  // 4. Estados booleanos
  disabled={isDisabled}
  loading={isLoading}

  // 5. Estilos
  className="custom-classes"
/>
```

### 12.4 Performance

**Otimizações Implementadas:**
- Debouncing de inputs (300ms)
- useMemo para cálculos pesados
- Lazy loading de componentes pesados
- Virtualização de listas longas
- Code splitting por página
- Paginação de dados financeiros (1000 registros/batch)

---

## 13. Casos de Uso Específicos

### 13.1 Fluxo de Nova Simulação

**Passo a Passo Visual:**
```
1. Usuário chega na página
   └─> Vê formulário pré-preenchido com dados padrão
   └─> Alerta sugere login (se não autenticado)

2. Usuário altera campo de idade
   └─> Border azul ao focar
   └─> Debounce de 300ms
   └─> Validação automática
   └─> Se válido: cálculo automático
   └─> Resultados atualizam em tempo real

3. Erro de validação
   └─> Border vermelha no input
   └─> Ícone de alerta (direita)
   └─> Mensagem de erro abaixo
   └─> Cálculos não executam
   └─> Alerta global aparece no topo

4. Todos os dados válidos
   └─> Painel de resultados mostra:
       ├─> Status (verde ou vermelho)
       ├─> Valores chave
       ├─> 3 fases do plano
       └─> Métricas técnicas

5. Visualização detalhada
   └─> Usuário scrolla para baixo
   └─> Vê gráficos interativos
   └─> Pode usar zoom e navegação
   └─> Tabela mês a mês disponível
```

### 13.2 Comparação de Cenários

**Interface de Comparação:**
```tsx
// Lista de cenários com cores distintas
<div className="space-y-3">
  {scenarios.map(scenario => (
    <div
      key={scenario.id}
      className="flex items-center gap-3 p-3 rounded border"
      style={{
        borderColor: scenario.color,
        background: `${scenario.color}15`
      }}
    >
      {/* Dot colorido */}
      <div
        className="w-4 h-4 rounded-full"
        style={{backgroundColor: scenario.color}}
      />

      {/* Nome e métricas */}
      <div className="flex-1">
        <h6 className="font-semibold text-white">{scenario.name}</h6>
        <p className="text-sm text-slate-400">
          Meta: {scenario.targetIncome} |
          Aporte: {scenario.monthlyContribution}
        </p>
      </div>

      {/* Ações */}
      <Button size="sm" variant="ghost">Carregar</Button>
    </div>
  ))}
</div>

// Gráfico comparativo (overlay de linhas)
<LineChart>
  {scenarios.map(scenario => (
    <Line
      key={scenario.id}
      dataKey={`patrimonio_${scenario.id}`}
      stroke={scenario.color}
      strokeWidth={2}
      name={scenario.name}
    />
  ))}
</LineChart>
```

### 13.3 Dados Financeiros Históricos

**Controles de Visualização:**
```tsx
{/* Seletor de série */}
<Select value={selectedSerie} onValueChange={setSerie}>
  <SelectTrigger className="w-48 bg-slate-700">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {series.map(s => (
      <SelectItem key={s.code} value={s.code}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}} />
          {s.name}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Período */}
<div className="flex gap-1">
  {['1M', '3M', '6M', '1Y', '2Y', '5Y', 'ALL'].map(period => (
    <Button
      key={period}
      size="sm"
      variant={selected === period ? 'default' : 'outline'}
      onClick={() => setPeriod(period)}
    >
      {period}
    </Button>
  ))}
</div>

{/* Período customizado */}
<div className="flex items-center gap-2 bg-slate-700/20 p-3 rounded">
  <input type="date" value={startDate} onChange={...} />
  <span>até</span>
  <input type="date" value={endDate} onChange={...} />
  <Button size="sm" onClick={applyCustomRange}>Aplicar</Button>
</div>

{/* Estatísticas consolidadas */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <StatCard label="Valor Atual" value={latest} />
  <StatCard label="12 Meses" value={last12M} color="green" />
  <StatCard label="Ano Atual" value={currentYear} color="blue" />
  <StatCard label="Ano Anterior" value={prevYear} color="orange" />
</div>

{/* Análise por IA */}
<div className="bg-slate-800/50 p-4 rounded">
  <h6 className="font-semibold mb-3 flex items-center gap-2">
    <Sparkles className="h-4 w-4 text-blue-400" />
    Análise do Especialista
  </h6>
  {loading ? (
    <Spinner />
  ) : (
    <div className="text-sm text-slate-300 whitespace-pre-line">
      {analysis}
    </div>
  )}
</div>
```

---

## 14. Checklist de Implementação

### 14.1 Para Novos Componentes

- [ ] Seguir estrutura de Card com backdrop-blur
- [ ] Usar cores da paleta definida
- [ ] Implementar estados responsivos (sm, md, lg)
- [ ] Adicionar estados de hover/focus
- [ ] Incluir loading states quando aplicável
- [ ] Implementar empty states
- [ ] Adicionar aria-labels e descrições
- [ ] Testar navegação por teclado
- [ ] Validar contraste de cores (WCAG AA)
- [ ] Adicionar animações sutis (200-300ms)

### 14.2 Para Formulários

- [ ] Label associado ao input (htmlFor + id)
- [ ] Validação com feedback inline
- [ ] Ícone de erro quando inválido
- [ ] Mensagem de erro descritiva
- [ ] Dica contextual quando válido
- [ ] Debouncing de validação (300ms)
- [ ] Estados: default, hover, focus, error, disabled
- [ ] Placeholders informativos
- [ ] Valores padrão sensatos
- [ ] Auto-preenchimento de dados (quando disponível)

### 14.3 Para Visualizações de Dados

- [ ] Tooltip customizado e informativo
- [ ] Cores semânticas (sucesso/erro/neutro)
- [ ] Legendas claras
- [ ] Controles de zoom/período
- [ ] Responsividade (height adapta)
- [ ] Loading skeleton durante fetch
- [ ] Empty state quando sem dados
- [ ] Formatação de valores consistente
- [ ] Acessibilidade (aria-labels)
- [ ] Performance (virtualização se > 1000 pontos)

---

## 15. Glossário de Termos

**Glassmorphism**: Efeito de vidro fosco usando `backdrop-filter: blur()`

**Debouncing**: Técnica para atrasar execução após digitação (300ms padrão)

**Empty State**: Interface exibida quando não há dados

**Toast/Snackbar**: Notificação temporária (não implementada neste sistema, usa Cards de alerta)

**Skeleton Loading**: Placeholder animado durante carregamento

**Progressive Disclosure**: Revelar informações gradualmente conforme necessário

**Semantic Colors**: Cores com significado (verde=sucesso, vermelho=erro)

**Card Elevation**: Profundidade visual via sombras

**Focus Ring**: Indicador visual de foco para navegação por teclado

**Compound Component**: Componente composto (ex: Card + CardHeader + CardContent)

---

## 16. Recursos Adicionais

### 16.1 Bibliotecas Utilizadas

```json
{
  "@radix-ui/*": "latest",
  "recharts": "latest",
  "lucide-react": "^0.454.0",
  "react-hook-form": "latest",
  "zod": "^3.24.1",
  "tailwind-merge": "^2.5.5",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1"
}
```

### 16.2 Ferramentas Recomendadas

- **Figma/Design**: Para prototipar novas interfaces
- **Contrast Checker**: Para validar acessibilidade de cores
- **React DevTools**: Para debugar componentes
- **Tailwind CSS IntelliSense**: Auto-complete de classes

### 16.3 Referências

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Recharts Documentation](https://recharts.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color System](https://m2.material.io/design/color/)

---

## 17. Manutenção e Evolução

### 17.1 Quando Adicionar Nova Cor

1. Adicionar à paleta em `globals.css` com variável CSS
2. Documentar uso semântico
3. Validar contraste WCAG AA
4. Adicionar exemplos de uso
5. Atualizar esta especificação

### 17.2 Quando Criar Novo Padrão

1. Identificar repetição em 3+ locais
2. Extrair para componente reutilizável
3. Documentar props e variantes
4. Adicionar exemplo à especificação
5. Atualizar storybook (se aplicável)

### 17.3 Versionamento desta Especificação

**Formato**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças breaking no design system
- **MINOR**: Novos padrões/componentes
- **PATCH**: Correções e clarificações

**Histórico:**
- v1.0 (2025): Versão inicial baseada no sistema implementado

---

**Fim da Especificação UI/UX v1.0**
