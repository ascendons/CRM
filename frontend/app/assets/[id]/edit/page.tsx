"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { UpdateAssetRequest, AssetStatus, AssetCategory, Asset } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { accountsService } from "@/lib/accounts";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { Account } from "@/types/account";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Save,
  Laptop,
  Settings2,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [engineers, setEngineers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateAssetRequest>({
    serialNo: "",
    model: "",
    brand: "",
    categoryId: "",
    accountId: "",
    contactId: "",
    assignedEngineerId: "",
    siteAddress: "",
    installDate: "",
    warrantyExpiry: "",
    status: AssetStatus.ACTIVE,
    notes: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [id, router]);

  const loadData = async () => {
    try {
      setFetchingData(true);
      const [assetData, accountsData, categoriesData, usersData] = await Promise.all([
        fieldService.getAssetById(id),
        accountsService.getAllAccounts(),
        fieldService.getAllAssetCategories(),
        usersService.getActiveUsers(),
      ]);

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setCategories(categoriesData);
      setEngineers(usersData);

      setFormData({
        serialNo: assetData.serialNo,
        model: assetData.model,
        brand: assetData.brand,
        categoryId: assetData.categoryId,
        accountId: assetData.accountId,
        contactId: assetData.contactId || "",
        assignedEngineerId: assetData.assignedEngineerId || "",
        siteAddress: assetData.siteAddress || "",
        installDate: assetData.installDate ? assetData.installDate.split("T")[0] : "",
        warrantyExpiry: assetData.warrantyExpiry ? assetData.warrantyExpiry.split("T")[0] : "",
        status: assetData.status,
        notes: assetData.notes || "",
      });
    } catch (err) {
      console.error("Failed to load asset data:", err);
      setError("Failed to load required data. Please refresh.");
      showToast.error("Failed to load asset details");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fieldService.updateAsset(id, formData);
      showToast.success("Asset updated successfully");
      router.push(`/assets/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update asset");
      showToast.error("Failed to update asset");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="relative text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Loading asset record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Edit Asset Record
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Update equipment specifications and location
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="hidden sm:flex rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl px-6 font-bold shadow-lg shadow-primary/25 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? "Saving Changes..." : "Update Asset"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 shadow-sm animate-in shake-in">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Core Identity */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden overflow-visible transition-shadow hover:shadow-md bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Equipment Specifications
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">
                    Technical identification and branding of the asset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="brand"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Brand / Make *
                      </Label>
                      <Input
                        id="brand"
                        name="brand"
                        required
                        value={formData.brand}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:ring-primary/20 bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="model"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Model Number *
                      </Label>
                      <Input
                        id="model"
                        name="model"
                        required
                        value={formData.model}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:ring-primary/20 bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="serialNo"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Serial Number *
                      </Label>
                      <Input
                        id="serialNo"
                        name="serialNo"
                        required
                        value={formData.serialNo}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:ring-primary/20 font-mono bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="categoryId"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Equipment Category *
                      </Label>
                      <div className="relative">
                        <select
                          id="categoryId"
                          name="categoryId"
                          required
                          value={formData.categoryId}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none font-medium"
                        >
                          <option value="">Select Category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <Settings2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-shadow hover:shadow-md bg-white text-slate-900">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg font-bold">Ownership & Site Location</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500 text-sm">
                    Where this asset is currently installed and managed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="accountId"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Customer / Account *
                      </Label>
                      <select
                        id="accountId"
                        name="accountId"
                        required
                        value={formData.accountId}
                        onChange={handleChange}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                      >
                        <option value="">Select Customer...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="siteAddress"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Installation Address
                      </Label>
                      <textarea
                        id="siteAddress"
                        name="siteAddress"
                        value={formData.siteAddress}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Detailed site location..."
                        className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="assignedEngineerId"
                        className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Primary Field Engineer
                      </Label>
                      <select
                        id="assignedEngineerId"
                        name="assignedEngineerId"
                        value={formData.assignedEngineerId}
                        onChange={handleChange}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      >
                        <option value="">Select Engineer...</option>
                        {engineers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.profile?.fullName || user.username} ({user.roleName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Status & Timeline */}
            <div className="space-y-8">
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-shadow hover:shadow-md bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg font-bold">Operational Lifecycle</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="status"
                      className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                    >
                      Operating Status
                    </Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-primary"
                    >
                      {Object.values(AssetStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="installDate"
                      className="text-slate-700 font-bold text-xs uppercase tracking-wider font-bold"
                    >
                      Installation Date
                    </Label>
                    <Input
                      id="installDate"
                      type="date"
                      name="installDate"
                      value={formData.installDate}
                      onChange={handleChange}
                      className="rounded-xl border-slate-200 bg-slate-50/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="warrantyExpiry"
                      className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                    >
                      Warranty Expiry Date
                    </Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      name="warrantyExpiry"
                      value={formData.warrantyExpiry}
                      onChange={handleChange}
                      className={`rounded-xl border-slate-200 bg-slate-50/30 focus:ring-rose-500/20 ${formData.warrantyExpiry && new Date(formData.warrantyExpiry) < new Date() ? "text-rose-600 font-bold border-rose-200" : ""}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-shadow hover:shadow-md bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg font-bold">Service Notes</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Technical comments, historical issues..."
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
                  />
                </CardContent>
              </Card>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[11px] text-primary font-bold uppercase tracking-widest">
                    Technical Update
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Modifying technical specifications like Serial No or Model may affect active
                  service contracts and maintenance schedules.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
