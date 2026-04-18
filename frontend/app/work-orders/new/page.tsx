"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  WorkOrderType, 
  WorkOrderPriority, 
  WorkOrderStatus,
  Asset,
  Contract,
  ServiceRequest
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { accountsService } from "@/lib/accounts";
import { contactsService } from "@/lib/contacts";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { Account } from "@/types/account";
import { Contact } from "@/types/contact";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import { 
  ChevronLeft, 
  Save, 
  Settings2, 
  Building2, 
  Calendar,
  Clock,
  AlertCircle,
  Laptop,
  User,
  MessageSquare,
  ShieldCheck,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialAssetId = searchParams.get("assetId") || "";
  const initialSrId = searchParams.get("srId") || "";
  const initialAccountId = searchParams.get("accountId") || "";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [engineers, setEngineers] = useState<UserResponse[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: WorkOrderType.BREAKDOWN,
    priority: WorkOrderPriority.MEDIUM,
    status: WorkOrderStatus.OPEN,
    accountId: initialAccountId,
    contactId: "",
    assetId: initialAssetId,
    contractId: "",
    serviceRequestId: initialSrId,
    assignedEngineerIds: [] as string[],
    scheduledDate: new Date().toISOString().split('T')[0],
    symptoms: "",
    checklistTemplateId: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
    try {
      setFetchingData(true);
      const [accountsData, engineersData] = await Promise.all([
        accountsService.getAllAccounts(),
        usersService.getActiveUsers()
      ]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setEngineers(engineersData.filter(u => u.roleName?.includes("Engineer") || u.roleName?.includes("Technician")));
      
      if (initialAccountId) {
        await handleAccountChange(initialAccountId, false);
      }
    } catch (err) {
      setError("Failed to load dependency data. Please refresh.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleAccountChange = async (accountId: string, clearRefs = true) => {
    if (!accountId) {
      setAssets([]);
      setContracts([]);
      setContacts([]);
      return;
    }

    try {
      const [assetsData, contractsData, contactsData] = await Promise.all([
        fieldService.getAllAssets({ accountId }),
        fieldService.getAllContracts({ accountId }),
        contactsService.getContactsByAccount(accountId)
      ]);
      setAssets(assetsData);
      setContracts(contractsData.filter(c => c.status === 'ACTIVE'));
      setContacts(contactsData);
      
      if (clearRefs) {
        setFormData(prev => ({ 
          ...prev, 
          accountId, 
          assetId: "", 
          contractId: "", 
          contactId: "" 
        }));
      }
    } catch (err) {
      showToast.error("Failed to load customer details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const wo = await fieldService.createWorkOrder(formData);
      showToast.success("Work order dispatched successfully");
      router.push(`/work-orders/${wo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create work order");
      showToast.error("Dispatch failure");
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
        <div className="text-center space-y-4">
           <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
           <p className="text-slate-500 font-medium tracking-tight">Initializing dispatch console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dispatch New Order</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Technician Allocation & Scheduling</p>
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
                className="rounded-2xl px-8 font-black shadow-xl shadow-primary/25 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {loading ? "Dispatching..." : "Release Order"}
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

        <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left Column: Context & Identity */}
            <div className="lg:col-span-2 space-y-10">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 overflow-hidden overflow-visible">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-2xl">
                       <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black tracking-tight text-slate-900">Customer Linkage</CardTitle>
                       <CardDescription className="font-medium text-slate-400">Specify the location and contact for this order.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="accountId" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Account / Customer *</Label>
                      <select
                        id="accountId"
                        name="accountId"
                        required
                        value={formData.accountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Select Customer...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="contactId" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">On-Site Contact</Label>
                      <select
                        id="contactId"
                        name="contactId"
                        value={formData.contactId}
                        onChange={handleChange}
                        className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                        disabled={!formData.accountId}
                      >
                        <option value="">Select Contact...</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-3">
                      <Label htmlFor="assetId" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Linked Asset / Equipment</Label>
                      <select
                        id="assetId"
                        name="assetId"
                        value={formData.assetId}
                        onChange={handleChange}
                        className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                        disabled={!formData.accountId}
                      >
                        <option value="">Select Equipment...</option>
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>{a.brand} {a.model} ({a.serialNo})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="contractId" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Service Entitlement (AMC)</Label>
                      <select
                        id="contractId"
                        name="contractId"
                        value={formData.contractId}
                        onChange={handleChange}
                        className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                        disabled={!formData.accountId}
                      >
                        <option value="">Billable / On-Demand</option>
                        {contracts.map((c) => (
                          <option key={c.id} value={c.id}>{c.contractNumber} ({c.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2">
                <CardHeader className="px-8 pt-8 pb-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-500">
                       <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black tracking-tight text-slate-900">Technical Details</CardTitle>
                       <CardDescription className="font-medium text-slate-400">Document the symptoms or requirements.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="symptoms" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Symptoms / Fault Description *</Label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      required
                      rows={5}
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="Explain the reported issue in detail..."
                      className="w-full rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 p-6 text-md font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Execution */}
            <div className="space-y-10">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-2 overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                   <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-between">
                      Workflow Control
                      <Settings2 className="h-5 w-5 text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                   <div className="space-y-4">
                      <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Assignment Type</Label>
                      <div className="grid grid-cols-1 gap-2">
                         {Object.values(WorkOrderType).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, type }))}
                              className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left px-5 ${
                                formData.type === type 
                                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                  : "bg-white/5 text-slate-400 hover:bg-white/10"
                              }`}
                            >
                               {type.replace('_', ' ')}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Dispatch Priority</Label>
                      <div className="grid grid-cols-2 gap-2">
                         {Object.values(WorkOrderPriority).slice(0, 4).map(priority => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, priority }))}
                              className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                formData.priority === priority 
                                  ? "bg-white text-slate-900 shadow-xl" 
                                  : "bg-white/5 text-slate-500 hover:bg-white/10"
                              }`}
                            >
                               {priority}
                            </button>
                         ))}
                      </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 border-2 border-primary/5">
                <CardHeader className="px-8 pt-8 pb-4">
                   <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center justify-between">
                      Field Execution
                      <User className="h-5 w-5 text-emerald-500" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                   <div className="space-y-3">
                      <Label htmlFor="engineerId" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Lead Field Engineer</Label>
                      <select
                        id="engineerId"
                        name="assignedEngineerIds"
                        value={formData.assignedEngineerIds[0] || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedEngineerIds: e.target.value ? [e.target.value] : [] }))}
                        className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                      >
                         <option value="">Keep in Open Pool</option>
                         {engineers.map(e => (
                            <option key={e.id} value={e.id}>{e.profile?.fullName || e.username} ({e.roleName})</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <Label htmlFor="scheduledDate" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">Scheduled Visit Date</Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        name="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={handleChange}
                        className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0 px-5"
                      />
                   </div>
                </CardContent>
              </Card>

              <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-4">
                 <ShieldCheck className="h-6 w-6 text-amber-500 mt-1 shrink-0" />
                 <div className="space-y-2">
                    <p className="text-sm font-black text-amber-900 uppercase tracking-tighter">SLA Compliance</p>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                       SLA timers start immediately upon release. Response target will be calculated based on the linked Contract or system defaults.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
