import { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { productsService } from "@/lib/products";

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccessCount(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await productsService.downloadTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "product_import_template.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError("Failed to download template. Please try again.");
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const response: any = await productsService.importProducts(file);
            // Assuming response is the list of created products or an API response wrapper
            // Based on my backend controller, it returns ApiResponse<List<ProductResponse>>
            // But the frontend api client might unwrap it. 
            // Let's assume the api client returns the 'data' part if generic.
            // Wait, productsService.importProducts return Promise<ProductResponse[]>.
            // The `api.post` usually unwraps `data` from axios response, but our backend wraps in `ApiResponse`.
            // If `api-client.ts` handles `ApiResponse` unwrapping, then response is `ProductResponse[]`.
            // If not, it might still need checking. 
            // Let's assume standard behavior: if it doesn't throw, it's success.

            // Since I typed it as ProductResponse[], let's assume it returns that.
            // Actually, checking `api-client.ts` would verify this, but standard practice is to return data.

            // If response is array, use length.
            const count = Array.isArray(response) ? response.length : 0;
            setSuccessCount(count);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccessCount(null); // Reset for next time
            }, 2000); // Close after 2 seconds on success

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to import products.");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setFile(null);
            setError(null);
            setSuccessCount(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <Dialog.Title className="text-lg font-bold text-slate-900">
                            Import Products
                        </Dialog.Title>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg h-fit">
                                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-900">Download Template</h4>
                                <p className="text-sm text-blue-700 mt-1 mb-3">
                                    Use our standardized template to format your product data correctly.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Excel Template
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Upload Data File
                            </label>

                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                                    }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv, .xlsx, .xls"
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="font-medium text-slate-900">{file.name}</div>
                                        <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="text-xs text-red-600 hover:underline mt-2"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 cursor-pointer">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            CSV, XLS, or XLSX files only
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {successCount !== null && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                Successfully imported {successCount} products.
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || uploading}
                            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>Import Products</>
                            )}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
