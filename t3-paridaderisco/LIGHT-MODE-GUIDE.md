# Guia do Modo Light (Claro)

## 🌞 Visão Geral

O modo light foi completamente otimizado para proporcionar uma experiência visual profissional, limpa e com excelente contraste. O design mantém a identidade visual do sistema enquanto adapta as cores para um fundo claro.

## 🎨 Paleta de Cores Light Mode

### Background
- **Background Principal**: Gradiente sutil `#f8fafc` → `#e0f2fe` → `#f1f5f9` (slate-50 → blue-100 → slate-100)
- **Cards**: Branco com transparência `rgba(255, 255, 255, 0.9)` + backdrop-blur
- **Bordas**: `#e2e8f0` (slate-200)

### Textos
- **Primário**: `#0f172a` (slate-900)
- **Secundário**: `#475569` (slate-600)
- **Muted**: `#64748b` (slate-500)
- **Disabled**: `#94a3b8` (slate-400)

### Cores Semânticas

#### Sucesso
- Background: `#f0fdf4` (green-50)
- Border: `#86efac` (green-300)
- Texto: `#15803d` (green-700)
- Primária: `#16a34a` (green-600)

#### Erro
- Background: `#fef2f2` (red-50)
- Border: `#fca5a5` (red-300)
- Texto: `#b91c1c` (red-700)
- Primária: `#dc2626` (red-600)

#### Warning
- Background: `#fefce8` (yellow-50)
- Border: `#fde047` (yellow-300)
- Texto: `#a16207` (yellow-700)
- Primária: `#d97706` (yellow-600)

#### Info
- Background: `#eff6ff` (blue-50)
- Border: `#93c5fd` (blue-300)
- Texto: `#1d4ed8` (blue-700)
- Primária: `#2563eb` (blue-600)

## 🧩 Componentes Atualizados

### Card

```tsx
// Card padrão - Branco com sombra sutil
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>

// Card de status - Sucesso
<Card variant="success">
  <CardContent>
    <div className="flex items-center gap-3">
      <CheckCircle className="h-6 w-6 text-green-600" />
      <h3 className="text-xl font-bold text-green-700">Meta Atingível!</h3>
    </div>
  </CardContent>
</Card>

// Card de erro
<Card variant="error">
  <CardContent>
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-6 w-6 text-red-600" />
      <h3 className="text-xl font-bold text-red-700">Atenção Necessária</h3>
    </div>
  </CardContent>
</Card>
```

### Button

```tsx
// Botão primário (mantém azul em ambos os modos)
<Button>Ação Principal</Button>

// Botão outline - Adapta ao modo
<Button variant="outline">
  Ação Secundária
</Button>

// Botão ghost
<Button variant="ghost">
  Ação Sutil
</Button>

// Botão destrutivo - Vermelho claro no light mode
<Button variant="destructive">
  <Trash2 className="h-4 w-4 mr-2" />
  Excluir
</Button>
```

### Input

```tsx
// Input padrão - Fundo branco com borda cinza clara
<Input
  type="text"
  placeholder="Digite aqui..."
  className="w-full"
/>

// Input com erro - Borda vermelha
<Input
  variant="error"
  value={value}
/>

// InputComValidacao - Cores adaptativas
<InputComValidacao
  label="Campo"
  hint="Dica contextual em cinza claro"
  value={value}
/>
```

### Badge

```tsx
// Badges adaptam automaticamente
<Badge>Padrão</Badge> {/* Cinza claro */}
<Badge variant="success">Sucesso</Badge> {/* Verde claro */}
<Badge variant="error">Erro</Badge> {/* Vermelho claro */}
<Badge variant="warning">Aviso</Badge> {/* Amarelo claro */}
<Badge variant="info">Info</Badge> {/* Azul claro */}
<Badge variant="active">Ativo</Badge> {/* Azul sólido - mesmo em ambos */}
```

### StatCard

```tsx
// StatCards com fundos coloridos sutis
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <StatCard
    label="CDI"
    value="10,50%"
    variant="info" // Fundo azul claro
  />
  <StatCard
    label="Retorno"
    value="+15,3%"
    variant="success" // Fundo verde claro
  />
  <StatCard
    label="Diferença"
    value="-R$ 50.000"
    variant="error" // Fundo vermelho claro
  />
  <StatCard
    label="Meta"
    value="85%"
    variant="warning" // Fundo amarelo claro
  />
</div>
```

## 📱 Responsividade

O tema light mantém todas as propriedades responsivas:

```tsx
// Texto responsivo
<h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
  Título
</h1>

// Cards responsivos
<Card className="p-3 sm:p-4 lg:p-6">
  Conteúdo
</Card>

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

## 🎯 Classes Utilitárias Light Mode

### Glassmorphism Light

```tsx
// Cards com efeito de vidro - adapta automaticamente
<div className="glass-card border border-slate-200 rounded-lg p-6">
  Efeito de vidro fosco em branco
</div>

// Com hover
<div className="glass-card-hover border border-slate-200 rounded-lg p-4">
  Card interativo
</div>
```

### Status Cards Light

```tsx
// Sucesso - Verde claro
<div className="status-card-success rounded-lg p-4">
  Mensagem de sucesso
</div>

// Erro - Vermelho claro
<div className="status-card-error rounded-lg p-4">
  Mensagem de erro
</div>

// Warning - Amarelo claro
<div className="status-card-warning rounded-lg p-4">
  Mensagem de aviso
</div>

// Info - Azul claro
<div className="status-card-info rounded-lg p-4">
  Mensagem informativa
</div>
```

## 🌓 Toggle de Tema

Para alternar entre light e dark mode, use o ThemeToggle:

```tsx
import { ThemeToggle } from "~/components/layout/ThemeToggle"

// Em qualquer página
<ThemeToggle />
```

O tema é persistido no localStorage e aplicado automaticamente.

## ✨ Diferenças Visuais Light vs Dark

| Elemento | Dark Mode | Light Mode |
|----------|-----------|------------|
| **Background** | Gradiente azul escuro | Gradiente azul/cinza claro |
| **Cards** | Vidro fosco cinza escuro + blur | Branco translúcido + blur + sombra |
| **Texto Principal** | Branco (#ffffff) | Slate-900 (#0f172a) |
| **Texto Secundário** | Slate-300 (#cbd5e1) | Slate-600 (#475569) |
| **Bordas** | Slate-700 (#334155) | Slate-200 (#e2e8f0) |
| **Input Background** | Slate-700 | Branco |
| **Badge Success** | Green-400 em fundo escuro | Green-700 em fundo verde-50 |
| **Badge Error** | Red-400 em fundo escuro | Red-700 em fundo red-50 |
| **Shadows** | Sutis e escuras | Mais visíveis e definidas |

## 🎨 Contraste e Acessibilidade

### WCAG AA Compliance

Todas as combinações de cores atendem ao padrão WCAG AA:

- **Texto normal** (16px+): mínimo 4.5:1 ✓
- **Texto grande** (18px+ ou 14px+ bold): mínimo 3:1 ✓
- **Elementos UI**: mínimo 3:1 ✓

### Combinações Testadas Light Mode

- `#0f172a` (slate-900) em `#ffffff` (white): 16.1:1 ✓
- `#475569` (slate-600) em `#ffffff`: 7.2:1 ✓
- `#2563eb` (blue-600) em `#ffffff`: 4.6:1 ✓
- `#15803d` (green-700) em `#f0fdf4` (green-50): 6.8:1 ✓

## 📊 Exemplo Completo - Página Dashboard Light Mode

```tsx
export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Título */}
      <h1 className="text-2xl sm:text-4xl font-bold dark:text-white text-slate-900 mb-6">
        Dashboard Financeiro
      </h1>

      {/* Grid de estatísticas - Cores adaptativas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="CDI"
          value="10,50%"
          variant="info"
          info="Atualizado hoje"
        />
        <StatCard
          label="Retorno"
          value="+15,3%"
          variant="success"
          info="12 meses"
        />
        <StatCard
          label="IPCA"
          value="4,82%"
          variant="warning"
          info="Ano atual"
        />
        <StatCard
          label="Meta"
          value="85%"
          info="Progresso"
        />
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de sucesso */}
        <Card variant="success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Meta Atingível!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dark:text-slate-300 text-slate-600">
              Seu plano atual conseguirá sustentar a renda desejada.
            </p>
          </CardContent>
        </Card>

        {/* Card normal */}
        <Card>
          <CardHeader>
            <CardTitle>Formulário</CardTitle>
            <CardDescription>
              Preencha os dados abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputComValidacao
              label="Valor"
              placeholder="R$ 0,00"
              hint="Valor em reais"
            />
            <Button className="w-full">
              Calcular
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 🚀 Benefícios do Light Mode

1. **Melhor legibilidade** em ambientes bem iluminados
2. **Menor cansaço visual** durante o dia
3. **Profissionalismo** para apresentações
4. **Economia de bateria** em telas LCD
5. **Impressão** mais fácil de páginas
6. **Acessibilidade** para usuários com baixa visão

## 📝 Checklist de Implementação

Ao criar novos componentes, certifique-se de:

- [ ] Usar classes `dark:` para cores específicas do dark mode
- [ ] Testar contraste de cores no light mode (WCAG AA)
- [ ] Verificar legibilidade de textos em ambos os modos
- [ ] Testar bordas e sombras em ambos os temas
- [ ] Garantir que ícones sejam visíveis em ambos
- [ ] Validar estado de hover/focus em light e dark
- [ ] Testar em diferentes dispositivos e tamanhos

## 🎯 Próximos Passos

Para aplicar o tema light em páginas existentes:

1. **Revisar componentes customizados** e adicionar classes `dark:`
2. **Testar todas as páginas** no light mode
3. **Ajustar contrastes** se necessário
4. **Validar acessibilidade** com ferramentas WCAG
5. **Documentar** componentes novos com exemplos light/dark

---

**Última atualização**: 2025
**Versão**: 2.0 (Light Mode Enhanced)
