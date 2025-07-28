import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import InvoicePDF from "@/components/invoice-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { type Invoice, type Client, type InvoiceItem, INVOICE_STATUS } from "@shared/schema";

export default function InvoiceDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const invoiceId = params.id;

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

  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice & { items: InvoiceItem[]; client: Client }>({
    queryKey: ["/api/invoices", invoiceId, "details"],
    retry: false,
    enabled: !!invoiceId,
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
      setLocation("/invoices");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    const currency = (userSettings as any)?.currency || 'XOF';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount) + ' F CFA';
    } else if (currency === 'GHS') {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
      }).format(numAmount);
    } else {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(numAmount);
    }
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
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (isLoading || invoiceLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Détail de la Facture" 
          subtitle="Chargement..."
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Facture non trouvée" 
          subtitle="Cette facture n'existe pas ou vous n'avez pas l'autorisation de la voir"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Facture non trouvée</p>
            <Link href="/invoices">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux Factures
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title={`Facture ${invoice.number}`}
        subtitle={`Client: ${invoice.client?.name || 'Client inconnu'}`}
        action={{
          label: "Retour",
          onClick: () => setLocation("/invoices")
        }}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Status and Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              {getStatusBadge(invoice.status)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Total TTC</p>
              <p className="text-lg font-semibold">{formatCurrency(invoice.totalTTC)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date d'échéance</p>
              <p className="text-sm">{invoice.dueDate ? formatDate(invoice.dueDate) : 'Non définie'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {invoice.status !== 'payee' && (
              <Button
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'payee' })}
                disabled={updateStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marquer comme Payée
              </Button>
            )}
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
            
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                  deleteMutation.mutate(invoice.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Invoice PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de la Facture</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoicePDF invoice={invoice} user={user} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}