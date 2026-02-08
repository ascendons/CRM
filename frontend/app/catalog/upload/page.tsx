'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);

    const { uploadProducts, error: uploadError } = useDynamicCatalog();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
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
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);
        try {
            const uploadResult = await uploadProducts(file);
            setResult(uploadResult);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8">
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

                        {uploadError && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Upload failed</p>
                                    <p>{uploadError}</p>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-sm text-green-700">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Import successful!</p>
                                    <p>{result.message || `Successfully processing ${result.fileName}`}</p>
                                    {result.totalProducts && <p className="mt-1">Products found: {result.totalProducts}</p>}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
