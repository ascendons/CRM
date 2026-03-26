'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { organizationApi } from '@/lib/api/organization';
import { showToast } from '@/lib/toast';
import InvoiceTemplateSelector from './InvoiceTemplateSelector';
import InvoicePreview from './InvoicePreview';
import { Organization } from '@/types/organization';
import { useReactToPrint } from 'react-to-print';

interface InvoicePreviewModalProps {
  proposalId: string;
  proposalNumber: string;
  onClose: () => void;
  proposal: any;
  parentTaxAmount?: number;
}

export default function InvoicePreviewModal({
  proposalId,
  proposalNumber,
  onClose,
  proposal,
  parentTaxAmount
}: InvoicePreviewModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('PROFORMA');
  const [downloading, setDownloading] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch organization data
  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getCurrent();
      setOrganization(data);
    } catch (error) {
      console.error('Failed to load organization data:', error);
      showToast.error('Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  };

  const reactToPrintFn = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `invoice-${proposalNumber}-${selectedTemplate.toLowerCase()}`,
    onBeforePrint: async () => {
      setDownloading(true);
      showToast.info('Preparing print dialog...');
    },
    onAfterPrint: () => {
      setDownloading(false);
      showToast.success('Print dialog closed');
    },
  });

  const handleDownload = () => {
    if (!previewRef.current) {
      showToast.error('Preview not ready for download');
      return;
    }
    reactToPrintFn();
  };

  const handleTemplateChange = async (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Invoice Preview</h2>
              <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                <span>{proposalNumber}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  {selectedTemplate.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all font-bold text-sm shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${showTemplateSelector ? 'animate-spin' : ''}`} />
              Change Template
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-7 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Processing...' : 'Download PDF'}
            </button>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group"
            >
              <X className="w-5 h-5 text-gray-500 group-hover:text-red-500 group-hover:rotate-90 duration-200" />
            </button>
          </div>
        </div>

        {/* Template Selector (collapsible) */}
        {showTemplateSelector && (
          <div className="border-b border-gray-200 bg-white/50 backdrop-blur-md p-6 animate-in slide-in-from-top duration-300">
            <InvoiceTemplateSelector
              proposalId={proposalId}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateChange}
            />
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-900 font-bold text-lg">Preparing your preview</p>
                <p className="text-gray-500 text-sm mt-1">Fetching latest organization data...</p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InvoicePreview
                ref={previewRef}
                proposal={proposal}
                organization={organization}
                template={selectedTemplate}
                parentTaxAmount={parentTaxAmount}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Reactive Preview
              </div>
              <p className="text-xs text-gray-400 font-medium italic">
                * Note: PDF generation happens securely in your browser.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-blue-600 font-bold text-sm transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
