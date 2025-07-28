import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Users, 
  Package, 
  Database,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Export() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [exportStatus, setExportStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

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

  const handleExport = async (type: 'clients' | 'products' | 'invoices') => {
    setExportStatus(prev => ({ ...prev, [type]: 'loading' }));
    
    try {
      const response = await fetch(`/api/export/${type}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportStatus(prev => ({ ...prev, [type]: 'success' }));
      toast({
        title: "Export réussi",
        description: `Les données ${type} ont été exportées avec succès.`,
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
      
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      setExportStatus(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Erreur d'export",
        description: `Impossible d'exporter les données ${type}.`,
        variant: "destructive",
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getButtonText = (type: string, status: string) => {
    switch (status) {
      case 'loading':
        return 'Export en cours...';
      case 'success':
        return 'Exporté avec succès';
      case 'error':
        return 'Erreur - Réessayer';
      default:
        return `Exporter ${type}`;
    }
  };

  const isButtonDisabled = (status: string) => {
    return status === 'loading' || status === 'success';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Export & Sauvegarde" 
          subtitle="Exportez vos données en format CSV"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Export & Sauvegarde" 
        subtitle="Exportez vos données en format CSV"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Database className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">À propos des exports</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Exportez vos données au format CSV pour les sauvegarder ou les importer dans d'autres applications.
                    Les fichiers incluent toutes les informations disponibles pour chaque type de données.
                  </p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Les exports incluent toutes vos données</li>
                    <li>• Format CSV compatible avec Excel et autres tableurs</li>
                    <li>• Encodage UTF-8 pour les caractères spéciaux</li>
                    <li>• Données à jour au moment de l'export</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Clients Export */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Clients</CardTitle>
                    <p className="text-sm text-gray-500">Export de la base clients</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Exporte tous vos clients avec leurs informations complètes : nom, email, téléphone, adresse, entreprise.
                  </p>
                  <Badge variant="outline" className="mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    Inclut les dates de création
                  </Badge>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleExport('clients')}
                  disabled={isButtonDisabled(exportStatus.clients || 'idle')}
                  variant={exportStatus.clients === 'error' ? 'destructive' : 'default'}
                >
                  {getStatusIcon(exportStatus.clients || 'idle')}
                  <span className="ml-2">
                    {getButtonText('Clients', exportStatus.clients || 'idle')}
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Products Export */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Produits</CardTitle>
                    <p className="text-sm text-gray-500">Export du catalogue</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Exporte tous vos produits avec les détails : nom, description, prix, stock, catégorie.
                  </p>
                  <Badge variant="outline" className="mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    Inclut les niveaux de stock
                  </Badge>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleExport('products')}
                  disabled={isButtonDisabled(exportStatus.products || 'idle')}
                  variant={exportStatus.products === 'error' ? 'destructive' : 'default'}
                >
                  {getStatusIcon(exportStatus.products || 'idle')}
                  <span className="ml-2">
                    {getButtonText('Produits', exportStatus.products || 'idle')}
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Invoices Export */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Factures</CardTitle>
                    <p className="text-sm text-gray-500">Export des factures</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Exporte toutes vos factures avec les montants, statuts, clients et dates d'échéance.
                  </p>
                  <Badge variant="outline" className="mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    Inclut les statuts de paiement
                  </Badge>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleExport('invoices')}
                  disabled={isButtonDisabled(exportStatus.invoices || 'idle')}
                  variant={exportStatus.invoices === 'error' ? 'destructive' : 'default'}
                >
                  {getStatusIcon(exportStatus.invoices || 'idle')}
                  <span className="ml-2">
                    {getButtonText('Factures', exportStatus.invoices || 'idle')}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle>Recommandations de sauvegarde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fréquence recommandée</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Quotidienne :</strong> Pour les données critiques</li>
                      <li>• <strong>Hebdomadaire :</strong> Export complet de sécurité</li>
                      <li>• <strong>Mensuelle :</strong> Archive de fin de mois</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bonnes pratiques</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Stockez les exports en lieu sûr</li>
                      <li>• Vérifiez l'intégrité des fichiers</li>
                      <li>• Conservez plusieurs versions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
