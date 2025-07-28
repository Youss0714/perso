import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Eye,
  Download,
  Minus
} from "lucide-react";
import { insertInvoiceSchema, insertInvoiceItemSchema, TAX_RATES, INVOICE_STATUS, type Invoice, type InsertInvoice, type Client, type Product } from "@shared/schema";
import { SimpleProductSelect } from "@/components/simple-product-select";
import { ClientSearch } from "@/components/client-search";
import { ProductSearch } from "@/components/product-search";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import InvoicePDF from "@/components/invoice-pdf";

const createInvoiceFormSchema = z.object({
  clientId: z.number().min(1, "Veuillez sélectionner un client"),
  status: z.string().min(1, "Veuillez sélectionner un statut"),
  tvaRate: z.string().min(1, "Veuillez sélectionner un taux de TVA"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number().optional(),
    productName: z.string().min(1, "Nom du produit requis"),
    quantity: z.number().min(1, "Quantité doit être supérieure à 0"),
    priceHT: z.string().min(1, "Prix HT requis"),
  })).min(1, "Au moins un article est requis"),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceFormSchema>;

export default function Invoices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Get user data for invoice header
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const form = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      clientId: undefined as any,
      status: "en_attente",
      tvaRate: "18.00",
      dueDate: "",
      notes: "",
      items: [{ productId: undefined, productName: "", quantity: 1, priceHT: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const invoiceCount = invoices.length + 1;
    return `FAC-${year}-${invoiceCount.toString().padStart(3, '0')}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateInvoiceForm) => {
      // Calculate totals with new tax logic
      const totalHT = data.items.reduce((sum, item) => 
        sum + (item.quantity * parseFloat(item.priceHT)), 0
      );
      const tvaRateNum = parseFloat(data.tvaRate);
      const totalTVA = totalHT * (tvaRateNum / 100);
      const totalTTC = totalHT + totalTVA;

      const invoiceData: InsertInvoice = {
        number: generateInvoiceNumber(),
        clientId: data.clientId,
        status: data.status,
        totalHT: totalHT.toFixed(2),
        tvaRate: data.tvaRate,
        totalTVA: totalTVA.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        userId: "", // Will be set by backend
      };

      const items = data.items.map(item => ({
        productId: item.productId || null,
        productName: item.productName,
        quantity: item.quantity,
        priceHT: item.priceHT,
        totalHT: (item.quantity * parseFloat(item.priceHT)).toFixed(2),
      }));

      await apiRequest("POST", "/api/invoices", { invoice: invoiceData, items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Facture créée",
        description: "La facture a été créée avec succès.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Invoice creation error:", error);
      toast({
        title: "Erreur",
        description: (error as any)?.message || "Impossible de créer la facture.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la facture a été mis à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInvoiceForm) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = INVOICE_STATUS.find(s => s.value === status);
    if (statusInfo) {
      return (
        <Badge className={statusInfo.color}>
          {statusInfo.icon} {statusInfo.label}
        </Badge>
      );
    }
    // Fallback for old statuses
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">✅ Payée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ En attente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">⚠️ En retard</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getClientName = (clientId: number) => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Client inconnu';
  };

  const getProductPrice = (productId: number) => {
    const product = products.find((p: Product) => p.id === productId);
    return product?.priceHT || "0";
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: Product) => p.id === productId);
    return product?.name || "";
  };

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(invoice.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const watchedItems = form.watch("items");
  
  // Tax rates for the selector
  const TAX_RATES = [
    { value: "3.00", label: "3%" },
    { value: "5.00", label: "5%" },
    { value: "10.00", label: "10%" },
    { value: "15.00", label: "15%" },
    { value: "18.00", label: "18%" },
    { value: "21.00", label: "21%" },
  ];
  const watchedTvaRate = form.watch("tvaRate");
  const subtotal = watchedItems.reduce((sum, item) => 
    sum + (item.quantity * parseFloat(item.priceHT || "0")), 0
  );
  const tvaRateNum = parseFloat(watchedTvaRate || "18.00");
  const tax = subtotal * (tvaRateNum / 100);
  const total = subtotal + tax;

  if (isLoading || invoicesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Factures" subtitle="Gérez vos factures et paiements" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-24" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Factures" 
        subtitle="Gérez vos factures et paiements"
        action={{
          label: "Nouvelle Facture",
          onClick: () => setIsDialogOpen(true)
        }}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Factures</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all" ? "Aucune facture trouvée" : "Aucune facture"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres."
                    : "Commencez par créer votre première facture."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Facture
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Facture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Échéance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice: Invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getClientName(invoice.clientId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.totalTTC)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={invoice.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: invoice.id, status })}
                          >
                            <SelectTrigger className="w-44">
                              {getStatusBadge(invoice.status)}
                            </SelectTrigger>
                            <SelectContent>
                              {INVOICE_STATUS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.icon} {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.createdAt && formatDate(invoice.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Fetch full invoice with items
                              fetch(`/api/invoices/${invoice.id}`, {
                                credentials: 'include'
                              })
                              .then(res => res.json())
                              .then(data => setViewingInvoice(data))
                              .catch(() => toast({
                                title: "Erreur",
                                description: "Impossible de charger la facture.",
                                variant: "destructive",
                              }));
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(invoice.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle Facture</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <FormControl>
                          <ClientSearch
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Rechercher ou créer un client..."
                            onCreateNew={(name) => {
                              // TODO: Implement quick client creation
                              toast({
                                title: "Fonction à venir",
                                description: `Création rapide de "${name}" sera bientôt disponible.`,
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || "en_attente"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INVOICE_STATUS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.icon} {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tvaRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de TVA *</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || "18.00"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner TVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TAX_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={rate.value}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'échéance</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Items */}
                <div>
                  <FormLabel className="text-base font-medium">Produits/Services *</FormLabel>
                  <div className="border border-gray-200 rounded-lg mt-2">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Produit</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantité</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prix HT</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((field, index) => (
                            <tr key={field.id}>
                              <td className="px-4 py-2">
                                <div className="space-y-2">
                                  <ProductSearch
                                    value={form.watch(`items.${index}.productId`)}
                                    onChange={(productId) => {
                                      form.setValue(`items.${index}.productId`, productId);
                                    }}
                                    onProductSelect={(product) => {
                                      form.setValue(`items.${index}.productName`, product.name);
                                      form.setValue(`items.${index}.priceHT`, product.priceHT);
                                      form.trigger([`items.${index}.productName`, `items.${index}.priceHT`]);
                                    }}
                                    placeholder="Rechercher un produit..."
                                    onCreateNew={(name) => {
                                      form.setValue(`items.${index}.productName`, name);
                                      form.setValue(`items.${index}.productId`, undefined);
                                    }}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.productName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input placeholder="Nom du produit/service" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.priceHT`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.01"
                                          placeholder="0.00"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-2 text-gray-900">
                                {formatCurrency(
                                  watchedItems[index]?.quantity * parseFloat(watchedItems[index]?.priceHT || "0") || 0
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => append({ productId: undefined, productName: "", quantity: 1, priceHT: "" })}
                      >
                        <Plus className="mr-1 w-4 h-4" />
                        Ajouter une ligne
                      </Button>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes additionnelles"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Totals */}
                <div className="grid grid-cols-2 gap-6">
                  <div></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total HT:</span>
                      <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">TVA ({tvaRateNum}%):</span>
                      <span className="text-sm font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base font-semibold">Total TTC:</span>
                      <span className="text-base font-semibold">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    Créer la Facture
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        {viewingInvoice && (
          <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Facture {viewingInvoice.number}</DialogTitle>
              </DialogHeader>
              <InvoicePDF invoice={viewingInvoice} user={user} />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
