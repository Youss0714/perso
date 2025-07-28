import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type Product } from "@shared/schema";

interface ProductSearchProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: (name: string) => void;
  onProductSelect?: (product: Product) => void;
}

export function ProductSearch({ 
  value, 
  onChange, 
  placeholder = "Rechercher un produit...",
  disabled = false,
  onCreateNew,
  onProductSelect
}: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch products with search
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", debouncedQuery ? { search: debouncedQuery } : {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.append('search', debouncedQuery);
      }
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    retry: false,
  });

  // Fetch selected product separately to ensure it's always available for display
  const { data: selectedProduct } = useQuery<Product>({
    queryKey: ["/api/products", value],
    queryFn: async () => {
      const response = await fetch(`/api/products/${value}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: !!value,
    retry: false,
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toLocaleString('fr-FR')} F CFA`;
  };

  const handleSelect = (productId: string) => {
    if (productId === "create-new" && onCreateNew && searchQuery) {
      onCreateNew(searchQuery);
      setOpen(false);
      setSearchQuery("");
      return;
    }

    const id = productId && productId !== "" ? parseInt(productId) : undefined;
    const product = products.find(p => p.id === id);
    
    onChange(id);
    if (product && onProductSelect) {
      onProductSelect(product);
    }
    
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>{selectedProduct.name}</span>
              <span className="text-sm text-muted-foreground">
                • {formatCurrency(selectedProduct.priceHT)} HT
                {selectedProduct.stock !== undefined && ` • Stock: ${selectedProduct.stock}`}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Tapez pour rechercher..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Recherche en cours...</CommandEmpty>
            ) : products.length === 0 ? (
              <CommandEmpty>
                {searchQuery ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Aucun produit trouvé pour "{searchQuery}"
                    </p>
                    {onCreateNew && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelect("create-new")}
                        className="text-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer "{searchQuery}"
                      </Button>
                    )}
                  </div>
                ) : (
                  "Aucun produit trouvé"
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id.toString()}
                    onSelect={(currentValue) => {
                      handleSelect(currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(product.priceHT)} HT
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.description && `${product.description} • `}
                        {product.stock !== undefined && `Stock: ${product.stock}`}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {searchQuery && onCreateNew && !products.some(p => 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase())
                ) && (
                  <CommandItem
                    value="create-new"
                    onSelect={handleSelect}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer "{searchQuery}"
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}