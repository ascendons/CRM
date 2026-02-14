"use client";

import { useState } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization, InvoiceConfig } from "@/types/organization";
import { ApiError } from "@/lib/api-client";
import {
    FileText,
    Building,
    CreditCard,
    Info,
    CheckCircle,
    AlertCircle,
    Loader2,
    Save,
    Image as ImageIcon,
} from "lucide-react";

interface InvoiceSettingsFormProps {
    organization: Organization;
    onUpdate: () => void;
}

export default function InvoiceSettingsForm({
    organization,
    onUpdate,
}: InvoiceSettingsFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<InvoiceConfig>({
        logoUrl: organization.invoiceConfig?.logoUrl || "",
        companyName: organization.invoiceConfig?.companyName || organization.organizationName,
        companyAddress: organization.invoiceConfig?.companyAddress || "",
        gstNumber: organization.invoiceConfig?.gstNumber || "",
        cinNumber: organization.invoiceConfig?.cinNumber || "",
        bankName: organization.invoiceConfig?.bankName || "",
        accountName: organization.invoiceConfig?.accountName || "",
        accountNumber: organization.invoiceConfig?.accountNumber || "",
        ifscCode: organization.invoiceConfig?.ifscCode || "",
        branchName: organization.invoiceConfig?.branchName || "",
        micrCode: organization.invoiceConfig?.micrCode || "",
        authorizedSignatoryLabel: organization.invoiceConfig?.authorizedSignatoryLabel || "Authorized Signatory",
        authorizedSignatorySealUrl: organization.invoiceConfig?.authorizedSignatorySealUrl || "",
        termsAndConditions: organization.invoiceConfig?.termsAndConditions || "",
        footerText: organization.invoiceConfig?.footerText || "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            await organizationApi.updateInvoiceConfig(formData);
            setSuccess("Invoice settings updated successfully");
            onUpdate();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to update invoice settings");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Invoice Customization
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Configure fixed details that will appear on your generated invoices
                </p>
            </div>

            {/* Messages */}
            {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Company Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Legal Entity Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name (as on Invoice)
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Enter legal company name"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Address
                            </label>
                            <textarea
                                name="companyAddress"
                                value={formData.companyAddress}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter full address with City, State, ZIP"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GSTIN Number
                            </label>
                            <input
                                type="text"
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleChange}
                                placeholder="e.g. 24AADCW7262N1ZU"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CIN Number
                            </label>
                            <input
                                type="text"
                                name="cinNumber"
                                value={formData.cinNumber}
                                onChange={handleChange}
                                placeholder="e.g. U35105RJ2024PTC092139"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Account Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Bank Account Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                placeholder="e.g. HDFC Bank"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                placeholder="Account Holder Name"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                placeholder="Enter Account Number"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IFSC Code
                            </label>
                            <input
                                type="text"
                                name="ifscCode"
                                value={formData.ifscCode}
                                onChange={handleChange}
                                placeholder="e.g. HDFC0000167"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch Name
                            </label>
                            <input
                                type="text"
                                name="branchName"
                                value={formData.branchName}
                                onChange={handleChange}
                                placeholder="e.g. Main Branch"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* PDF Configuration */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Branding & Assets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL
                            </label>
                            <input
                                type="text"
                                name="logoUrl"
                                value={formData.logoUrl}
                                onChange={handleChange}
                                placeholder="https://example.com/logo.png"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                            {formData.logoUrl && (
                                <div className="mt-2 p-2 bg-white border rounded inline-block">
                                    <img src={formData.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Signatory Label
                            </label>
                            <input
                                type="text"
                                name="authorizedSignatoryLabel"
                                value={formData.authorizedSignatoryLabel}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Signatory Seal URL
                            </label>
                            <input
                                type="text"
                                name="authorizedSignatorySealUrl"
                                value={formData.authorizedSignatorySealUrl}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                            {formData.authorizedSignatorySealUrl && (
                                <div className="mt-2 p-2 bg-white border rounded inline-block">
                                    <img src={formData.authorizedSignatorySealUrl} alt="Seal Preview" className="h-10 object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Terms & Conditions
                            </label>
                            <textarea
                                name="termsAndConditions"
                                value={formData.termsAndConditions}
                                onChange={handleChange}
                                rows={4}
                                placeholder="1. Validity: Offer Valid Only for 1 Days\n2. Delivery: 1-2 Weeks"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Footer Text
                            </label>
                            <input
                                type="text"
                                name="footerText"
                                value={formData.footerText}
                                onChange={handleChange}
                                placeholder="e.g. www.yourcompany.com | info@yourcompany.com"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Configuration
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
