"use client";

import { useState } from "react";
import { api } from "~/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { BookOpen, Plus, Trash2, Eye, Loader2, TrendingUp, FileUp, FileText } from "lucide-react";
import { ResourceCategory } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  STRATEGY: "Estratégia",
  MARKET_ANALYSIS: "Análise de Mercado",
  INVESTMENT_GUIDE: "Guia de Investimento",
  RISK_PARITY: "Paridade de Risco",
  ASSET_INFO: "Info. de Ativos",
  ECONOMIC_SCENARIO: "Cenário Econômico",
};

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  STRATEGY: "bg-blue-500/20 text-blue-700",
  MARKET_ANALYSIS: "bg-green-500/20 text-green-700",
  INVESTMENT_GUIDE: "bg-purple-500/20 text-purple-700",
  RISK_PARITY: "bg-orange-500/20 text-orange-700",
  ASSET_INFO: "bg-cyan-500/20 text-cyan-700",
  ECONOMIC_SCENARIO: "bg-pink-500/20 text-pink-700",
};

export function KnowledgeManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | "ALL">("ALL");
  const [viewResource, setViewResource] = useState<string | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("RISK_PARITY");

  // PDF upload state
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const utils = api.useUtils();
  const { toast } = useToast();

  // Queries
  const { data: resourcesData, isLoading } = api.knowledge.list.useQuery({
    category: selectedCategory === "ALL" ? undefined : selectedCategory,
  });

  const { data: stats } = api.knowledge.stats.useQuery();

  const { data: viewData } = api.knowledge.get.useQuery(
    { id: viewResource! },
    { enabled: !!viewResource }
  );

  // Mutations
  const addMutation = api.knowledge.add.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.stats.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = api.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.stats.invalidate();
      setResourceToDelete(null);
      toast({
        title: "Sucesso",
        description: "Recurso deletado com sucesso.",
      });
    },
    onError: (error) => {
      setResourceToDelete(null);
      toast({
        title: "Erro",
        description: `Erro ao deletar recurso: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("RISK_PARITY");
    setPdfFile(null);
    setPdfError(null);
  };

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;

    addMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
    });
  };

  const handleDelete = (id: string) => {
    setResourceToDelete(id);
  };

  const confirmDelete = () => {
    if (resourceToDelete) {
      deleteMutation.mutate({ id: resourceToDelete });
    }
  };

  const handlePDFUpload = async (file: File) => {
    setPdfFile(file);
    setPdfError(null);
    setIsUploadingPDF(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/knowledge/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar PDF');
      }

      // Preencher os campos com os dados extraídos
      setTitle(data.data.title);
      setCategory(data.data.category);
      setContent(data.data.content);
      setPdfError(null);
    } catch (error) {
      console.error('[PDF Upload] Error:', error);
      setPdfError(error instanceof Error ? error.message : 'Erro ao processar PDF');
      setPdfFile(null);
    } finally {
      setIsUploadingPDF(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Base de Conhecimento RAG</CardTitle>
              <CardDescription>
                Gerenciar recursos para o assistente de investimentos
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Recurso
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total de Recursos</div>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total de Embeddings</div>
              <div className="text-2xl font-bold">{stats.totalEmbeddings}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Média por Recurso</div>
              <div className="text-2xl font-bold">{stats.avgEmbeddingsPerResource}</div>
            </div>
          </div>
        )}

        {/* Filtro de Categoria */}
        <div className="flex items-center gap-2">
          <Label>Filtrar por categoria:</Label>
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Recursos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resourcesData && resourcesData.resources.length > 0 ? (
          <div className="space-y-3">
            {resourcesData.resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{resource.title}</h3>
                    <Badge className={CATEGORY_COLORS[resource.category]}>
                      {CATEGORY_LABELS[resource.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {resource.content.substring(0, 150)}...
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {resource._count.embeddings} chunks • Criado em{" "}
                    {new Date(resource.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewResource(resource.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum recurso encontrado</p>
            <p className="text-sm mt-1">Adicione recursos para alimentar a base de conhecimento</p>
          </div>
        )}
      </CardContent>

      {/* Dialog: Adicionar Recurso */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Recurso</DialogTitle>
            <DialogDescription>
              Escolha entre digitar manualmente ou fazer upload de um PDF
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <FileText className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <FileUp className="h-4 w-4 mr-2" />
                Upload PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Estratégia de Paridade de Risco Brasileira"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cole aqui o conteúdo completo do artigo, guia ou análise..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {content.length} caracteres • ~{Math.ceil(content.length / 1000)} chunks esperados
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePDFUpload(file);
                    }}
                    disabled={isUploadingPDF}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {isUploadingPDF ? (
                      <>
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                        <p className="text-sm font-medium">Processando PDF...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Extraindo texto e identificando informações com IA
                        </p>
                      </>
                    ) : pdfFile ? (
                      <>
                        <FileUp className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-sm font-medium text-green-600">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Arquivo processado com sucesso
                        </p>
                      </>
                    ) : (
                      <>
                        <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Clique para fazer upload do PDF</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Máximo 10MB • O sistema extrairá automaticamente o título, categoria e conteúdo
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {pdfError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
                    <p className="text-sm text-destructive">{pdfError}</p>
                  </div>
                )}

                {/* Mostrar campos preenchidos após processamento */}
                {pdfFile && !pdfError && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title-pdf">Título (Extraído)</Label>
                      <Input
                        id="title-pdf"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título extraído do PDF"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-pdf">Categoria (Identificada)</Label>
                      <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
                        <SelectTrigger id="category-pdf">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content-pdf">Conteúdo (Extraído)</Label>
                      <Textarea
                        id="content-pdf"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Conteúdo extraído do PDF"
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {content.length} caracteres • ~{Math.ceil(content.length / 1000)} chunks esperados
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!title.trim() || !content.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Adicionar e Processar
                </>
              )}
            </Button>
          </DialogFooter>

          {addMutation.error && (
            <div className="text-sm text-destructive mt-2">
              Erro: {addMutation.error.message}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Visualizar Recurso */}
      <Dialog open={!!viewResource} onOpenChange={() => setViewResource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewData && (
            <>
              <DialogHeader>
                <DialogTitle>{viewData.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={CATEGORY_COLORS[viewData.category]}>
                    {CATEGORY_LABELS[viewData.category]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {viewData.embeddings.length} chunks
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold mb-2">Conteúdo Original:</h3>
                  <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                    {viewData.content}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Chunks Gerados ({viewData.embeddings.length}):</h3>
                  <div className="space-y-2">
                    {viewData.embeddings.map((embedding, index) => (
                      <div key={embedding.id} className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground mb-1">Chunk {index + 1}</div>
                        <div className="text-sm">{embedding.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Deleção */}
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o recurso
              e todos os chunks de embeddings associados da base de conhecimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Sim, deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </Card >
  );
}
