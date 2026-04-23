"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreateContractRequest,
  ContractType,
  ContractStatus,
  BillingCycle,
  Asset,
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import { Account } from "@/types/account";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Save,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  Laptop,
  Coins,
  BadgeInfo,
  ExternalLink,
  History,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewContractPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateContractRequest>({
    type: ContractType.AMC,
    accountId: "",
    assetIds: [],
    startDate: "",
    endDate: "",
    billingCycle: BillingCycle.QUARTERLY,
    visitFrequencyPerYear: 4,
    contractValue: 0,
    slaConfig: {
      responseHrs: 4,
      resolutionHrs: 24,
    },
    penaltyConfig: {
      perHourBreachPenalty: 0,
      maxPenaltyCap: 0,
    },
    status: ContractStatus.DRAFT,
    notes: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAccounts();
  }, [router]);

  const loadAccounts = async () => {
    try {
      setFetchingData(true);
      const accountsData = await accountsService.getAllAccounts();
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      setError("Failed to load accounts. Please refresh.");
    } finally {
      setFetchingData(false);
    }
  };

  const loadAssetsForAccount = async (accountId: string) => {
    if (!accountId) {
      setAvailableAssets([]);
      return;
    }
    try {
      const assets = await fieldService.getAllAssets({ accountId });
      setAvailableAssets(assets);
    } catch (err) {
      showToast.error("Failed to load assets for this customer");
    }
  };

  useEffect(() => {
    if (formData.accountId) {
      loadAssetsForAccount(formData.accountId);
    }
  }, [formData.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assetIds.length === 0) {
      setError("Please select at least one asset for this contract.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = await fieldService.createContract(formData);
      showToast.success("Contract created successfully");
      router.push(`/contracts/${contract.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contract");
      showToast.error("Failed to create contract");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === "number" ? parseFloat(value) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) : value,
      }));
    }
  };

  const toggleAsset = (assetId: string) => {
    setFormData((prev) => ({
      ...prev,
      assetIds: prev.assetIds.includes(assetId)
        ? prev.assetIds.filter((id) => id !== assetId)
        : [...prev.assetIds, assetId],
    }));
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-tight">
            Initializing contract builder...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Draft Service Contract
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Phase 1: Structure & Assets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-2xl font-bold px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl px-8 font-black shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Create Contract"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-10 p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700 animate-in shake-in">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-12 animate-in fade-in zoom-in duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Selection */}
            <div className="lg:col-span-2 space-y-10">
              {/* Customer Selection */}
              <Card className="rounded-[32px] border-slate-200 shadow-xl overflow-hidden overflow-visible border-none bg-white p-2">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-2xl">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                        Account Selection
                      </CardTitle>
                      <CardDescription className="font-medium text-slate-400">
                        Choose the customer for this service commitment.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="accountId"
                        className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]"
                      >
                        Primary Customer *
                      </Label>
                      <select
                        id="accountId"
                        name="accountId"
                        required
                        value={formData.accountId}
                        onChange={handleChange}
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-2 text-md font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Select a Customer...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.accountId && (
                      <div className="pt-6 border-t border-slate-50">
                        <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em] block mb-4">
                          Link Assets to Contract ({formData.assetIds.length} Selected)
                        </Label>
                        {availableAssets.length === 0 ? (
                          <div className="bg-amber-50 rounded-2xl p-6 text-center border-2 border-amber-100">
                            <Laptop className="h-8 w-8 text-amber-500 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-bold text-amber-900 tracking-tight">
                              No assets found for this customer.
                            </p>
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Please add equipment to the customer's registry first.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableAssets.map((asset) => (
                              <div
                                key={asset.id}
                                onClick={() => toggleAsset(asset.id)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 hover:shadow-md ${
                                  formData.assetIds.includes(asset.id)
                                    ? "border-primary bg-primary/5 shadow-inner"
                                    : "border-slate-100 bg-white"
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-xl ${formData.assetIds.includes(asset.id) ? "bg-primary text-white" : "bg-slate-50 text-slate-400"}`}
                                >
                                  <Laptop className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 tracking-tight">
                                    {asset.brand} {asset.model}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {asset.serialNo}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Terms */}
              <Card className="rounded-[32px] border-none shadow-xl bg-white p-2">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-2xl">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                        Service Terms & SLA
                      </CardTitle>
                      <CardDescription className="font-medium text-slate-400">
                        Define your performance commitments and billing.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">
                        Contract Type
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(ContractType).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type }))}
                            className={`h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                              formData.type === type
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="billingCycle"
                        className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]"
                      >
                        Billing Cycle
                      </Label>
                      <select
                        id="billingCycle"
                        name="billingCycle"
                        value={formData.billingCycle}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                      >
                        {Object.values(BillingCycle).map((cycle) => (
                          <option key={cycle} value={cycle}>
                            {cycle.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-3">
                      <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-between">
                        Response Time (Hrs)
                        <Clock className="h-3 w-3 text-slate-300" />
                      </Label>
                      <Input
                        type="number"
                        name="slaConfig.responseHrs"
                        value={formData.slaConfig.responseHrs}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-between">
                        Resolution Target (Hrs)
                        <Clock className="h-3 w-3 text-slate-300" />
                      </Label>
                      <Input
                        type="number"
                        name="slaConfig.resolutionHrs"
                        value={formData.slaConfig.resolutionHrs}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Timeline & Value */}
            <div className="space-y-10">
              <Card className="rounded-[32px] border-none shadow-xl bg-slate-900 text-white p-2">
                <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                  <CardTitle className="text-xl font-black flex items-center justify-between">
                    Validity Period
                    <Calendar className="h-5 w-5 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.15em]">
                      Effective Start Date
                    </Label>
                    <Input
                      type="date"
                      name="startDate"
                      required
                      value={formData.startDate}
                      onChange={handleChange}
                      className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-bold focus:ring-0"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.15em]">
                      Expiry Date
                    </Label>
                    <Input
                      type="date"
                      name="endDate"
                      required
                      value={formData.endDate}
                      onChange={handleChange}
                      className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-bold focus:ring-0"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-xl bg-white p-2 border-2 border-primary/10">
                <CardHeader className="px-8 pt-8 pb-4">
                  <CardTitle className="text-xl font-black flex items-center justify-between text-slate-900">
                    Contract Value
                    <Coins className="h-5 w-5 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">
                      Total Amount (INR)
                    </Label>
                    <Input
                      type="number"
                      name="contractValue"
                      value={formData.contractValue}
                      onChange={handleChange}
                      className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-xl font-black text-primary px-5 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">
                      PM Visits Per Year
                    </Label>
                    <Input
                      type="number"
                      name="visitFrequencyPerYear"
                      value={formData.visitFrequencyPerYear}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 flex items-start gap-4">
                <BadgeInfo className="h-6 w-6 text-blue-500 mt-1 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">
                    Drafting Phase
                  </p>
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Contracts are created in DRAFT status. You must ACTIVATE the contract after the
                    first payment or authorization is received.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
