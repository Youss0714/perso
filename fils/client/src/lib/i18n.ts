// Système de traduction pour l'application
export type Language = 'fr' | 'en';

export interface Translations {
  // Navigation
  dashboard: string;
  clients: string;
  products: string;
  categories: string;
  invoices: string;
  sales: string;
  settings: string;
  export: string;
  logout: string;

  // Actions communes
  create: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  search: string;
  loading: string;
  
  // Dashboard
  revenue: string;
  invoiceCount: string;
  clientCount: string;
  productCount: string;
  recentInvoices: string;
  topProducts: string;
  
  // Clients
  clientName: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  newClient: string;
  editClient: string;
  
  // Products
  productName: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  taxRate: string;
  newProduct: string;
  editProduct: string;
  
  // Invoices
  invoiceNumber: string;
  client: string;
  status: string;
  total: string;
  dueDate: string;
  pending: string;
  paid: string;
  overdue: string;
  newInvoice: string;
  
  // Settings
  language: string;
  currency: string;
  profile: string;
  preferences: string;
  
  // Messages
  success: string;
  error: string;
  confirmDelete: string;
  noData: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    clients: "Clients",
    products: "Produits",
    categories: "Catégories", 
    invoices: "Factures",
    sales: "Ventes",
    settings: "Paramètres",
    export: "Export",
    logout: "Déconnexion",

    // Actions communes
    create: "Créer",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    search: "Rechercher",
    loading: "Chargement...",
    
    // Dashboard
    revenue: "Chiffre d'affaires",
    invoiceCount: "Factures",
    clientCount: "Clients",
    productCount: "Produits",
    recentInvoices: "Factures récentes",
    topProducts: "Produits populaires",
    
    // Clients
    clientName: "Nom du client",
    email: "Email",
    phone: "Téléphone",
    address: "Adresse",
    company: "Entreprise",
    newClient: "Nouveau Client",
    editClient: "Modifier le Client",
    
    // Products
    productName: "Nom du produit",
    description: "Description",
    price: "Prix",
    stock: "Stock",
    category: "Catégorie",
    taxRate: "Taux de TVA",
    newProduct: "Nouveau Produit",
    editProduct: "Modifier le Produit",
    
    // Invoices
    invoiceNumber: "Numéro de facture",
    client: "Client",
    status: "Statut",
    total: "Total",
    dueDate: "Date d'échéance",
    pending: "En attente",
    paid: "Payée",
    overdue: "En retard",
    newInvoice: "Nouvelle Facture",
    
    // Settings
    language: "Langue",
    currency: "Devise",
    profile: "Profil",
    preferences: "Préférences",
    
    // Messages
    success: "Succès",
    error: "Erreur",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
    noData: "Aucune donnée disponible",
  },
  
  en: {
    // Navigation
    dashboard: "Dashboard",
    clients: "Clients",
    products: "Products",
    categories: "Categories",
    invoices: "Invoices",
    sales: "Sales",
    settings: "Settings",
    export: "Export",
    logout: "Logout",

    // Actions communes
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    loading: "Loading...",
    
    // Dashboard
    revenue: "Revenue",
    invoiceCount: "Invoices",
    clientCount: "Clients",
    productCount: "Products",
    recentInvoices: "Recent Invoices",
    topProducts: "Top Products",
    
    // Clients
    clientName: "Client Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    company: "Company",
    newClient: "New Client",
    editClient: "Edit Client",
    
    // Products
    productName: "Product Name",
    description: "Description",
    price: "Price",
    stock: "Stock",
    category: "Category",
    taxRate: "Tax Rate",
    newProduct: "New Product",
    editProduct: "Edit Product",
    
    // Invoices
    invoiceNumber: "Invoice Number",
    client: "Client",
    status: "Status",
    total: "Total",
    dueDate: "Due Date",
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
    newInvoice: "New Invoice",
    
    // Settings
    language: "Language",
    currency: "Currency",
    profile: "Profile",
    preferences: "Preferences",
    
    // Messages
    success: "Success",
    error: "Error",
    confirmDelete: "Are you sure you want to delete this item?",
    noData: "No data available",
  }
};

export const taxRates = [
  { value: "3.00", label: "3%" },
  { value: "5.00", label: "5%" },
  { value: "10.00", label: "10%" },
  { value: "15.00", label: "15%" },
  { value: "18.00", label: "18%" },
  { value: "21.00", label: "21%" },
];

export const currencies = [
  { value: "XOF", label: "XOF - Franc CFA", symbol: "XOF" },
  { value: "GHS", label: "GHS - Cedi ghanéen", symbol: "GH₵" },
];

export const languages = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

// Hook pour utiliser les traductions
export function useTranslation(language: Language = 'fr') {
  return {
    t: (key: keyof Translations) => translations[language][key],
    language,
  };
}

// Fonction pour formater les prix selon la devise
export function formatPrice(amount: number | string, currency: string = 'XOF'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  switch (currency) {
    case 'XOF':
      return `${numAmount.toLocaleString('fr-FR')} XOF`;
    case 'GHS':
      return `GH₵ ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    default:
      return `${numAmount.toLocaleString()} ${currency}`;
  }
}