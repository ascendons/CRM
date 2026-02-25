'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { proposalsService } from '@/lib/proposals';

interface Template {
  type: string;
  displayName: string;
  description: string;
  available: boolean;
}

interface InvoiceTemplateSelectorProps {
  proposalId: string;
  onSelect: (template: string) => void;
  selectedTemplate?: string;
  className?: string;
}

export default function InvoiceTemplateSelector({
  proposalId,
  onSelect,
  selectedTemplate,
  className = ''
}: InvoiceTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [proposalId]);

  const loadTemplates = async () => {
    try {
      const data = await proposalsService.getAvailableTemplates(proposalId);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Select Invoice Template</h3>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => (
          <button
            key={template.type}
            onClick={() => template.available && onSelect(template.type)}
            disabled={!template.available}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all
              ${selectedTemplate === template.type
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
              ${!template.available
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                p-2 rounded-lg
                ${selectedTemplate === template.type
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
                }
              `}>
                <FileText className={`w-5 h-5 ${
                  selectedTemplate === template.type
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{template.displayName}</h4>
                  {selectedTemplate === template.type && (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                {!template.available && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
