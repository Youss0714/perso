import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Package, FileText, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            GestionPro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Application complète de gestion commerciale pour optimiser vos ventes, 
            gérer vos clients et suivre votre activité en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/auth'}
            >
              Se connecter
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/auth'}
            >
              Créer un compte
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Nouveau sur GestionPro ? Créez votre compte et complétez votre profil pour commencer.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gestion des Clients</h3>
              <p className="text-sm text-gray-600">
                Centralisez toutes les informations de vos clients et leur historique d'achat.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Catalogue Produits</h3>
              <p className="text-sm text-gray-600">
                Organisez vos produits par catégories et suivez vos stocks en temps réel.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Facturation</h3>
              <p className="text-sm text-gray-600">
                Créez et gérez vos factures facilement avec génération PDF automatique.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reporting</h3>
              <p className="text-sm text-gray-600">
                Analysez vos performances avec des rapports détaillés et des exports CSV.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Pourquoi choisir GestionPro ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Interface Moderne</h3>
              <p className="text-gray-600">
                Interface intuitive et responsive, accessible depuis n'importe quel appareil.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Sécurisé</h3>
              <p className="text-gray-600">
                Authentification sécurisée et données protégées avec chiffrement.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Tableau de Bord</h3>
              <p className="text-gray-600">
                Visualisez vos KPIs et suivez l'évolution de votre activité en temps réel.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à optimiser votre gestion commerciale ?
          </h2>
          <p className="text-gray-600 mb-8">
            Rejoignez les entreprises qui font confiance à GestionPro pour leur croissance.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Démarrer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}
