'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Mandatory fields that are auto-selected as searchable
const MANDATORY_SEARCHABLE_KEYS = ['productname', 'product_name', 'name'];

interface HeaderInfo {
    key: string;
    originalKey: string;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);

    // Two-step flow state
    const [step, setStep] = useState<'select-file' | 'select-fields'>('select-file');
    const [headers, setHeaders] = useState<HeaderInfo[]>([]);
    const [searchableFields, setSearchableFields] = useState<Set<string>>(new Set());
    const [previewing, setPreviewing] = useState(false);

    const { uploadProducts, previewHeaders, error: uploadError } = useDynamicCatalog();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setStep('select-file');
            setHeaders([]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
            setStep('select-file');
            setHeaders([]);
        }
    };

    // Step 1: Preview headers
    const handlePreviewHeaders = async () => {
        if (!file) return;
        setPreviewing(true);
        try {
            const detected = await previewHeaders(file);
            setHeaders(detected);

            // Auto-select only mandatory fields
            const autoSelected = new Set<string>();
            detected.forEach(h => {
                if (MANDATORY_SEARCHABLE_KEYS.includes(h.key.toLowerCase())) {
                    autoSelected.add(h.key);
                }
            });
            setSearchableFields(autoSelected);
            setStep('select-fields');
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setPreviewing(false);
        }
    };

    // Step 2: Upload with selected fields
    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);
        try {
            const selectedFields = Array.from(searchableFields);
            const uploadResult = await uploadProducts(file, selectedFields.length > 0 ? selectedFields : undefined);
            setResult(uploadResult);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const toggleField = (key: string) => {
        setSearchableFields(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const selectAll = () => setSearchableFields(new Set(headers.map(h => h.key)));
    const deselectAll = () => setSearchableFields(new Set());

    const isMandatory = (key: string) => MANDATORY_SEARCHABLE_KEYS.includes(key.toLowerCase());

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <Link href="/catalog" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Catalog
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Upload Product Catalog</h1>
                    <p className="mt-2 text-slate-600">
                        Upload your Excel or CSV file to import products dynamically. The system will automatically detect columns.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${step === 'select-file' ? 'bg-primary text-white' : 'bg-green-100 text-green-700'}`}>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
                        Select File
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${step === 'select-fields' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
                        Select Searchable Fields
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8">
                        {/* Step 1: File Selection */}
                        {step === 'select-file' && (
                            <>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out ${dragActive
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : file
                                            ? 'border-emerald-500/50 bg-emerald-50/50'
                                            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />

                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                                    >
                                        {file ? (
                                            <>
                                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                                    <FileSpreadsheet className="w-8 h-8" />
                                                </div>
                                                <span className="text-lg font-semibold text-slate-900 mb-1">{file.name}</span>
                                                <span className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFile(null);
                                                        setHeaders([]);
                                                    }}
                                                    className="mt-4 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                                                >
                                                    Remove file
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <span className="text-lg font-medium text-slate-900 mb-2">Click to upload</span>
                                                <span className="text-sm text-slate-500">or drag and drop Excel/CSV file here</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handlePreviewHeaders}
                                        disabled={!file || previewing}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {previewing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Detecting Columns...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4" />
                                                Next: Select Searchable Fields
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 2: Searchable Field Selection */}
                        {step === 'select-fields' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Select Searchable Fields</h2>
                                    <p className="text-sm text-slate-500">
                                        Choose which columns should be searchable when finding products on the proposal page.
                                        Mandatory fields are pre-selected.
                                    </p>
                                </div>

                                {/* Quick actions */}
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={selectAll} className="text-xs font-medium text-primary hover:underline">Select All</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={deselectAll} className="text-xs font-medium text-slate-500 hover:underline">Deselect All</button>
                                    <span className="ml-auto text-xs text-slate-400">
                                        {searchableFields.size} of {headers.length} selected
                                    </span>
                                </div>

                                {/* Field checkboxes */}
                                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto">
                                    {headers.map((header) => {
                                        const checked = searchableFields.has(header.key);
                                        const mandatory = isMandatory(header.key);
                                        return (
                                            <label
                                                key={header.key}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${checked ? 'bg-primary/5' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleField(header.key)}
                                                    className="w-4 h-4 accent-primary rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-slate-900">{header.originalKey}</span>
                                                    {header.key !== header.originalKey && (
                                                        <span className="ml-2 text-xs text-slate-400 font-mono">({header.key})</span>
                                                    )}
                                                </div>
                                                {mandatory && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                        Mandatory
                                                    </span>
                                                )}
                                                {checked && (
                                                    <Search className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* File info reminder */}
                                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span className="font-medium">{file?.name}</span>
                                    <span>• {(file?.size || 0 / 1024).toFixed(1)} KB</span>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <button
                                        onClick={() => setStep('select-file')}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Start Import</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Error */}
                        {uploadError && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Upload failed</p>
                                    <p>{uploadError}</p>
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {result && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-sm text-green-700">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Import successful!</p>
                                    <p>{result.message || `Successfully processing ${result.fileName}`}</p>
                                    {result.totalProducts && <p className="mt-1">Products found: {result.totalProducts}</p>}
                                    <p className="mt-1 text-xs text-green-600">
                                        Searchable fields: {searchableFields.size > 0 ? Array.from(searchableFields).join(', ') : 'All fields'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
