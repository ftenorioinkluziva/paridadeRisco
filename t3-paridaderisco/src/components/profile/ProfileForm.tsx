"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/lib/api";
import { Loader2, Edit, X, Check } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { calcularIdade, formatDateForInput } from "~/lib/utils/date";

export function ProfileForm() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dataNascimento: "",
    currentPassword: "",
    newPassword: "",
  });

  // Fetch user profile
  const { data: user, isLoading, refetch } = api.user.getUserProfile.useQuery();

  // Update mutation
  const updateMutation = api.user.updateUserProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
      setIsEditing(false);
      setShowPasswordFields(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });

  // Load user data when fetched
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        dataNascimento: user.dataNascimento ? formatDateForInput(user.dataNascimento) : "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", { isEditing, formData });

    // Only submit if in editing mode
    if (!isEditing) {
      console.log("Not in editing mode, ignoring submit");
      return;
    }

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dataNascimento: formData.dataNascimento || null,
    };

    if (showPasswordFields && formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    console.log("Submitting update", updateData);
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        dataNascimento: user.dataNascimento ? formatDateForInput(user.dataNascimento) : "",
        currentPassword: "",
        newPassword: "",
      });
    }
    setIsEditing(false);
    setShowPasswordFields(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            required
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            required
          />
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input
            id="dataNascimento"
            type="date"
            value={formData.dataNascimento}
            onChange={(e) => setFormData({
              ...formData,
              dataNascimento: e.target.value
            })}
            disabled={!isEditing}
            placeholder="dd/mm/aaaa"
          />
          {formData.dataNascimento && (
            <p className="text-sm text-muted-foreground">
              Idade atual: {calcularIdade(formData.dataNascimento)} anos
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Sua idade será calculada automaticamente nas simulações de aposentadoria
          </p>
        </div>

        {/* Alterar Senha */}
        {isEditing && (
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              {showPasswordFields ? "Cancelar alteração de senha" : "Alterar senha"}
            </Button>

            {showPasswordFields && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required={showPasswordFields}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    minLength={8}
                    required={showPasswordFields}
                  />
                  <p className="text-sm text-muted-foreground">
                    Mínimo de 8 caracteres
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-4">
        {!isEditing ? (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      {/* Info sobre data de criação */}
      {user && (
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p>Conta criada em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
          <p>Última atualização: {new Date(user.updatedAt).toLocaleDateString('pt-BR')}</p>
        </div>
      )}
    </form>
  );
}
