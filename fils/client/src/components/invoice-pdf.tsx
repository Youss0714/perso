import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";

interface InvoicePDFProps {
  invoice: any; // Full invoice with items and client
  user?: any; // User information for company details
}

export default function InvoicePDF({ invoice, user }: InvoicePDFProps) {
  const formatCurrency = (amount: string | number) => {
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{"currency":"XOF"}');
    const currency = userSettings.currency || 'XOF';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currency === 'XOF') {
      return `${numAmount.toLocaleString('fr-FR')} F CFA`;
    } else if (currency === 'GHS') {
      return `GHS ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import jsPDF and html2canvas to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      // Get the invoice content element
      const element = document.querySelector('.invoice-content') as HTMLElement;
      if (!element) {
        console.error("Invoice content element not found");
        alert("Erreur: Contenu de la facture non trouvé");
        return;
      }

      // Hide action buttons temporarily for cleaner PDF
      const actionButtons = element.parentElement?.querySelector('.print\\:hidden') as HTMLElement;
      const originalDisplay = actionButtons?.style.display;
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate canvas from HTML with better options
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Remove any remaining print-hidden elements in the clone
          const printHiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
          printHiddenElements.forEach(el => el.remove());
        }
      });
      
      // Restore action buttons
      if (actionButtons && originalDisplay !== undefined) {
        actionButtons.style.display = originalDisplay;
      }
      
      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (2 * margin);
      
      // Calculate dimensions
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to PDF
      const imgData = canvas.toDataURL('image/png', 0.95);
      
      if (imgHeight <= pageHeight - (2 * margin)) {
        // Single page
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Multiple pages - use a simpler approach
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        // If content is too long, it will be cut off, but this is simpler and more reliable
        // For very long invoices, users can use the print function instead
      }
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('fr-FR').replace(/:/g, '-');
      const filename = `Facture_${invoice.number}_${dateStr}_${timeStr}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      console.log('PDF généré avec succès:', filename);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}. Veuillez réessayer.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mb-6 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          Télécharger PDF
        </Button>
      </div>

      {/* Invoice Content */}
      <Card className="print:shadow-none print:border-none invoice-content">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h1>
              <p className="text-lg text-gray-600">{invoice.number}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-2">
                {user?.company || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Mon Entreprise'}
              </div>
              <div className="text-sm text-gray-600">
                {user?.address && (
                  <p className="whitespace-pre-line">{user.address}</p>
                )}
                {user?.email && <p>Email: {user.email}</p>}
                {user?.phone && <p>Tél: {user.phone}</p>}
                {user?.businessType && <p>Activité: {user.businessType}</p>}
              </div>
            </div>
          </div>

          {/* Invoice Info and Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Facturé à :</h3>
              <div className="text-gray-700">
                <p className="font-medium">{invoice.client?.name}</p>
                {invoice.client?.company && <p>{invoice.client.company}</p>}
                {invoice.client?.email && <p>{invoice.client.email}</p>}
                {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                {invoice.client?.address && (
                  <p className="whitespace-pre-line">{invoice.client.address}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Détails de la facture :</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Date d'émission :</span>
                  <span>{invoice.createdAt && formatDate(invoice.createdAt)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between">
                    <span>Date d'échéance :</span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Statut :</span>
                  <span className={`font-medium ${
                    invoice.status === 'payee' ? 'text-green-600' :
                    invoice.status === 'en_attente' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {invoice.status === 'payee' ? 'Payée' :
                     invoice.status === 'en_attente' ? 'En attente' :
                     invoice.status === 'en_retard' ? 'En retard' :
                     invoice.status === 'annulee' ? 'Annulée' :
                     invoice.status === 'brouillon' ? 'Brouillon' :
                     invoice.status === 'envoyee' ? 'Envoyée' :
                     'Statut inconnu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Articles</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">
                      Description
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                      Quantité
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                      Prix unitaire
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {item.productName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                        {formatCurrency(item.priceHT)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.totalHT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Sous-total :</span>
                <span>{formatCurrency(invoice.totalHT)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>TVA ({invoice.tvaRate}%) :</span>
                <span>{formatCurrency(invoice.totalTVA)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total :</span>
                <span>{formatCurrency(invoice.totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Notes :</h3>
              <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <Separator className="mb-6" />
          <div className="text-center text-sm text-gray-500">
            <p>Merci pour votre confiance !</p>
            <p className="mt-2">
              Pour toute question concernant cette facture, contactez-nous à contact@gestionpro.fr
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
