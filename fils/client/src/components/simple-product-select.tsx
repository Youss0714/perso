import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Product } from "@shared/schema";

interface SimpleProductSelectProps {
  products: Product[];
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SimpleProductSelect({ 
  products, 
  value, 
  onChange, 
  placeholder = "Sélectionner un produit...",
  disabled = false 
}: SimpleProductSelectProps) {
  const selectedProduct = products.find((product) => product.id === value);

  return (
    <Select 
      onValueChange={(selectedValue) => {
        if (selectedValue === "") {
          onChange(undefined);
        } else {
          onChange(parseInt(selectedValue));
        }
      }}
      value={value ? value.toString() : ""}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id.toString()}>
            <div className="flex flex-col">
              <span>{product.name}</span>
              <span className="text-sm text-muted-foreground">
                {Number(product.priceHT).toLocaleString('fr-FR')} XOF HT
                {product.stock !== undefined && ` • Stock: ${product.stock}`}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}