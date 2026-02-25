'use client';

import { useState, useEffect } from 'react';
import { Download, X, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { proposalsService } from '@/lib/proposals';
import { showToast } from '@/lib/toast';
import InvoiceTemplateSelector from './InvoiceTemplateSelector';

interface InvoicePreviewModalProps {
  proposalId: string;
  proposalNumber: string;
  onClose: () => void;
}

export default function InvoicePreviewModal({
  proposalId,
  proposalNumber,
  onClose
}: InvoicePreviewModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('PROFORMA');
  const [downloading, setDownloading] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch invoice HTML with authentication
  useEffect(() => {
    loadInvoicePreview();
  }, [selectedTemplate, proposalId]);

  const loadInvoicePreview = async () => {
    try {
      setLoading(true);
      const html = await proposalsService.getInvoicePreviewHtml(proposalId, selectedTemplate);
      setInvoiceHtml(html);
    } catch (error) {
      console.error('Failed to load invoice preview:', error);
      showToast.error('Failed to load invoice preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await proposalsService.downloadInvoiceWithTemplate(proposalId, selectedTemplate);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${proposalNumber}-${selectedTemplate.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      showToast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleTemplateChange = async (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {proposalNumber} • {selectedTemplate.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Change Template
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Template Selector (collapsible) */}
        {showTemplateSelector && (
          <div className="border-b border-gray-200 bg-gray-50 p-6">
            <InvoiceTemplateSelector
              proposalId={proposalId}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateChange}
            />
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-6">
          <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-600">Loading invoice preview...</p>
                </div>
              </div>
            ) : (
              <iframe
                key={selectedTemplate}
                srcDoc={invoiceHtml}
                className="w-full h-full border-0"
                title="Invoice Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live Preview
              </span>
              <span>•</span>
              <span>Press Ctrl+P to print directly from preview</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
