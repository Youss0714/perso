import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
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
import { type Client } from "@shared/schema";

interface ClientSearchProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: (name: string) => void;
}

export function ClientSearch({ 
  value, 
  onChange, 
  placeholder = "Rechercher un client...",
  disabled = false,
  onCreateNew
}: ClientSearchProps) {
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

  // Fetch clients with search
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", debouncedQuery ? { search: debouncedQuery } : {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.append('search', debouncedQuery);
      }
      const response = await fetch(`/api/clients?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    retry: false,
  });

  // Fetch selected client separately to ensure it's always available for display
  const { data: selectedClient } = useQuery<Client>({
    queryKey: ["/api/clients", value],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${value}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch client');
      return response.json();
    },
    enabled: !!value,
    retry: false,
  });

  const handleSelect = (clientId: string) => {
    if (clientId === "create-new" && onCreateNew && searchQuery) {
      onCreateNew(searchQuery);
      setOpen(false);
      setSearchQuery("");
      return;
    }

    const id = clientId && clientId !== "" ? parseInt(clientId) : undefined;
    onChange(id);
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
          {selectedClient ? (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{selectedClient.name}</span>
              {selectedClient.company && (
                <span className="text-sm text-muted-foreground">- {selectedClient.company}</span>
              )}
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
            ) : clients.length === 0 ? (
              <CommandEmpty>
                {searchQuery ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Aucun client trouvé pour "{searchQuery}"
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
                  "Aucun client trouvé"
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id.toString()}
                    onSelect={(currentValue) => {
                      handleSelect(currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {client.company && `${client.company} • `}
                        {client.email}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {searchQuery && onCreateNew && !clients.some(c => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
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