"use client";

import React, { useMemo } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import type { AssetOption } from "../types/charts";

interface AssetSelectorProps {
  assets: AssetOption[];
  selectedAssets: string[];
  onSelectionChange: (assetIds: string[]) => void;
  maxSelection?: number;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const AssetTypeColors: Record<string, string> = {
  "ETF": "bg-blue-100 text-blue-800 border-blue-300",
  "STOCK": "bg-green-100 text-green-800 border-green-300",
  "INDEX": "bg-purple-100 text-purple-800 border-purple-300",
  "Index": "bg-purple-100 text-purple-800 border-purple-300",
  "CDI": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "FUND": "bg-orange-100 text-orange-800 border-orange-300",
  "Currency": "bg-teal-100 text-teal-800 border-teal-300",
};

const AssetTypeLabels: Record<string, string> = {
  "ETF": "ETF",
  "STOCK": "Ação",
  "INDEX": "Índice",
  "Index": "Índice",
  "CDI": "CDI",
  "FUND": "Fundo",
  "Currency": "Moeda",
};

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedAssets,
  onSelectionChange,
  maxSelection = 5,
  isLoading = false,
  placeholder = "Selecione ativos...",
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTypeFilters, setActiveTypeFilters] = React.useState<string[]>([]);
  
  // Filtrar e agrupar assets por tipo
  const filteredAndGroupedAssets = useMemo(() => {
    let filteredAssets = assets;
    
    // Aplicar filtros de tipo se houver
    if (activeTypeFilters.length > 0) {
      filteredAssets = assets.filter(asset => 
        activeTypeFilters.includes(asset.type || 'OTHER')
      );
    }
    
    // Aplicar busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredAssets = filteredAssets.filter(asset => 
        asset.ticker.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query)
      );
    }
    
    // Agrupar por tipo
    const groups: Record<string, AssetOption[]> = {};
    
    filteredAssets.forEach(asset => {
      const type = asset.type || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type]!.push(asset);
    });
    
    // Ordenar assets dentro de cada grupo por ticker
    Object.keys(groups).forEach(type => {
      groups[type]!.sort((a, b) => a.ticker.localeCompare(b.ticker));
    });
    
    return groups;
  }, [assets, activeTypeFilters, searchQuery]);

  // Tipos únicos disponíveis
  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(assets.map(asset => asset.type || 'OTHER')));
    return types.sort();
  }, [assets]);

  // Assets selecionados para display
  const selectedAssetsData = useMemo(() => {
    return assets.filter(asset => selectedAssets.includes(asset.id));
  }, [assets, selectedAssets]);

  const handleSelect = (assetId: string) => {
    if (selectedAssets.includes(assetId)) {
      // Remover asset
      onSelectionChange(selectedAssets.filter(id => id !== assetId));
    } else {
      // Adicionar asset (respeitando limite)
      if (selectedAssets.length < maxSelection) {
        onSelectionChange([...selectedAssets, assetId]);
      }
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setActiveTypeFilters([]);
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando ativos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Seleção de Ativos</label>
          {(activeTypeFilters.length > 0 || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>
        
        {/* Filtros por tipo */}
        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {availableTypes.map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  "h-6 text-xs transition-all duration-200",
                  activeTypeFilters.includes(type)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                )}
              >
                {AssetTypeLabels[type] || type}
                {activeTypeFilters.includes(type) && " ✓"}
              </Button>
            ))}
          </div>
        )}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between hover-grow transition-all duration-200 bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <span className="truncate">
                {selectedAssets.length > 0
                  ? `${selectedAssets.length} ativo${selectedAssets.length > 1 ? 's' : ''} selecionado${selectedAssets.length > 1 ? 's' : ''}`
                  : placeholder
                }
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[450px] p-0 border shadow-lg" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por ticker ou nome..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-none focus:ring-0"
              />
              <CommandEmpty>
                <div className="py-6 text-center">
                  <div className="text-sm text-gray-600">
                    Nenhum ativo encontrado
                  </div>
                  {(activeTypeFilters.length > 0 || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="mt-2"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </CommandEmpty>

              <CommandList className="max-h-64">
                {Object.entries(filteredAndGroupedAssets).map(([type, typeAssets]) => (
                  <CommandGroup 
                    key={type} 
                    heading={
                      <div className="flex items-center justify-between">
                        <span>{AssetTypeLabels[type] || type}</span>
                        <Badge variant="secondary" className="text-xs">
                          {typeAssets.length}
                        </Badge>
                      </div>
                    }
                  >
                    {typeAssets.map((asset) => (
                      <CommandItem
                        key={asset.id}
                        value={`${asset.ticker} ${asset.name}`}
                        onSelect={() => handleSelect(asset.id)}
                        className="flex items-center justify-between hover:bg-accent transition-colors p-3 cursor-pointer data-[selected=true]:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedAssets.includes(asset.id) 
                                ? "opacity-100 text-primary" 
                                : "opacity-0"
                            )}
                          />
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {asset.ticker}
                            </span>
                            <span className="text-xs text-gray-600 truncate max-w-[280px]">
                              {asset.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-xs whitespace-nowrap",
                              AssetTypeColors[asset.type] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {AssetTypeLabels[asset.type] || asset.type}
                          </Badge>
                          
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {asset.dataPoints} pts
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Limite de seleção */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {selectedAssets.length}/{maxSelection} ativos selecionados
          </span>
          
          {selectedAssets.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearSelection}
              className="h-auto p-1 text-xs"
            >
              Limpar seleção
            </Button>
          )}
        </div>
      </div>

      {/* Lista de assets selecionados */}
      {selectedAssetsData.length > 0 && (
        <div className="space-y-2 animate-fade-in-up">
          <label className="text-sm font-medium">Ativos Selecionados</label>
          
          <div className="flex flex-wrap gap-2">
            {selectedAssetsData.map((asset, index) => (
              <Badge
                key={asset.id}
                variant="secondary"
                className={cn(
                  "flex items-center gap-2 py-1 px-2 transition-all duration-200 hover:scale-105",
                  index === 0 && "animate-fade-in-up-delay-100",
                  index === 1 && "animate-fade-in-up-delay-200", 
                  index >= 2 && "animate-fade-in-up-delay-300"
                )}
              >
                <span className="text-xs font-medium">{asset.ticker}</span>
                
                <button
                  onClick={() => handleSelect(asset.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors duration-150"
                  aria-label={`Remover ${asset.ticker}`}
                >
                  <span className="text-xs">×</span>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};