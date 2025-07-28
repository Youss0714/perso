import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import StatsCard from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Euro, 
  FileText, 
  Users, 
  Package, 
  Eye, 
  Download, 
  Edit,
  UserPlus,
  Plus,
  BarChart3,
  FolderOutput,
  AlertTriangle,
  CircleAlert
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Tableau de Bord" 
          subtitle="Vue d'ensemble de votre activité commerciale"
          action={{
            label: "Nouvelle Facture",
            onClick: () => {}
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Tableau de Bord" 
          subtitle="Vue d'ensemble de votre activité commerciale"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Impossible de charger les statistiques</p>
          </div>
        </main>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    const currency = (userSettings as any)?.currency || 'XOF';
    
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' F CFA';
    } else if (currency === 'GHS') {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Payée</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">En retard</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Tableau de Bord" 
        subtitle="Vue d'ensemble de votre activité commerciale"
        action={{
          label: "Nouvelle Facture",
          onClick: () => window.location.href = "/invoices"
        }}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Chiffre d'Affaires"
            value={formatCurrency((stats as any)?.revenue || 0)}
            change="+12% ce mois"
            changeType="positive"
            icon={Euro}
            iconColor="bg-green-50 text-green-500"
          />
          <StatsCard
            title="Factures"
            value={(stats as any)?.invoiceCount || 0}
            change="+8 cette semaine"
            changeType="positive"
            icon={FileText}
            iconColor="bg-blue-50 text-blue-500"
          />
          <StatsCard
            title="Clients Actifs"
            value={(stats as any)?.clientCount || 0}
            change="+5 nouveaux"
            changeType="positive"
            icon={Users}
            iconColor="bg-purple-50 text-purple-500"
          />
          <StatsCard
            title="Produits"
            value={(stats as any)?.productCount || 0}
            change={`${((stats as any)?.lowStockProducts || []).length} ruptures de stock`}
            changeType={((stats as any)?.lowStockProducts || []).length > 0 ? "negative" : "neutral"}
            icon={Package}
            iconColor="bg-orange-50 text-orange-500"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Factures Récentes</CardTitle>
                  <Link href="/invoices">
                    <Button variant="ghost" size="sm">
                      Voir toutes
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {((stats as any)?.recentInvoices || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Aucune facture trouvée
                          </td>
                        </tr>
                      ) : (
                        ((stats as any)?.recentInvoices || []).map((invoice: any) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {invoice.client?.name || 'Client inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(parseFloat(invoice.totalTTC || invoice.total || "0"))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.createdAt && formatDate(invoice.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Link href={`/invoices/${invoice.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/clients">
                  <Button variant="ghost" className="w-full justify-start bg-primary-50 hover:bg-primary-100">
                    <UserPlus className="mr-3 w-4 h-4 text-primary" />
                    Nouveau Client
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="ghost" className="w-full justify-start bg-green-50 hover:bg-green-100">
                    <Plus className="mr-3 w-4 h-4 text-green-500" />
                    Nouveau Produit
                  </Button>
                </Link>
                <Link href="/sales">
                  <Button variant="ghost" className="w-full justify-start bg-blue-50 hover:bg-blue-100">
                    <BarChart3 className="mr-3 w-4 h-4 text-blue-500" />
                    Générer Rapport
                  </Button>
                </Link>
                <Link href="/export">
                  <Button variant="ghost" className="w-full justify-start bg-purple-50 hover:bg-purple-100">
                    <FolderOutput className="mr-3 w-4 h-4 text-purple-500" />
                    Exporter Données
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produits les Plus Vendus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {((stats as any)?.topProducts || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aucune vente enregistrée</p>
                ) : (
                  ((stats as any)?.topProducts || []).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">#{index + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{product.salesCount}</p>
                        <p className="text-xs text-gray-500">vendus</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            {((stats as any)?.lowStockProducts || []).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alertes Stock</CardTitle>
                    <Badge variant="destructive">
                      {((stats as any)?.lowStockProducts || []).length} alertes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {((stats as any)?.lowStockProducts || []).slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock} unités</p>
                        </div>
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                          Réapprovisionner
                        </Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
