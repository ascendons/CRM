"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ServiceRequestSource, 
  ServiceRequestStatus, 
  Asset
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { accountsService } from "@/lib/accounts";
import { contactsService } from "@/lib/contacts";
import { authService } from "@/lib/auth";
import { Account } from "@/types/account";
import { Contact } from "@/types/contact";
import { showToast } from "@/lib/toast";
import { 
  ChevronLeft, 
  Save, 
  Phone, 
  Mail, 
  Globe, 
  MessageCircle,
  Building2,
  Calendar,
  AlertCircle,
  Laptop,
  User,
  History,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewServiceRequestPage() {
  const router = useRouter();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    source: ServiceRequestSource.PHONE,
    accountId: "",
    contactId: "",
    assetId: "",
    description: "",
    priority: "MEDIUM",
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
      const accountsData = await accountsService.getAllAccounts();
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      setError("Failed to load customer registry. Please refresh.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleAccountChange = async (accountId: string) => {
    setFormData(prev => ({ ...prev, accountId, contactId: "", assetId: "" }));
    if (!accountId) {
      setContacts([]);
      setAssets([]);
      return;
    }
    try {
      const [contactsData, assetsData] = await Promise.all([
        contactsService.getContactsByAccount(accountId),
        fieldService.getAllAssets({ accountId })
      ]);
      setContacts(contactsData);
      setAssets(assetsData);
    } catch (err) {
      showToast.error("Failed to load customer details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sr = await fieldService.createServiceRequest(formData);
      showToast.success("Complaint recorded successfully");
      router.push(`/service-requests/${sr.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log request");
      showToast.error("Recording failure");
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
           <p className="text-slate-500 font-medium tracking-tight">Initializing intake console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Log New Complaint</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-1">Intake Verification Stage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-2xl font-bold px-6 border-slate-200"
              >
                Discard
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl px-8 font-black shadow-xl shadow-indigo-600/20 bg-indigo-600 text-white transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Register Ticket
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
              
              {/* Left Column: Context Area */}
              <div className="lg:col-span-2 space-y-10">
                 {/* Intake Source */}
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2">
                    <CardHeader className="px-8 pt-8 pb-4 border-b border-slate-50">
                       <CardTitle className="text-lg font-black uppercase tracking-tight">Transmission Channel</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 py-8">
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {Object.values(ServiceRequestSource).map(source => (
                             <button
                               key={source}
                               type="button"
                               onClick={() => setFormData(prev => ({ ...prev, source }))}
                               className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group ${
                                 formData.source === source 
                                   ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                                   : "bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200"
                               }`}
                             >
                                {source === ServiceRequestSource.PHONE && <Phone className="h-6 w-6" />}
                                {source === ServiceRequestSource.EMAIL && <Mail className="h-6 w-6" />}
                                {source === ServiceRequestSource.PORTAL && <Globe className="h-6 w-6" />}
                                {source === ServiceRequestSource.WHATSAPP && <MessageCircle className="h-6 w-6" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{source}</span>
                             </button>
                          ))}
                       </div>
                    </CardContent>
                 </Card>

                 {/* Customer Selection */}
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 overflow-hidden overflow-visible">
                    <CardHeader className="px-8 pt-8 pb-4">
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                             <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                             <CardTitle className="text-xl font-black tracking-tight text-slate-900">Entity Linkage</CardTitle>
                             <CardDescription className="text-slate-400 font-medium">Identify the customer and specific equipment.</CardDescription>
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-4 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Primary Account *</Label>
                             <select
                               required
                               value={formData.accountId}
                               onChange={(e) => handleAccountChange(e.target.value)}
                               className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition-all appearance-none"
                             >
                                <option value="">Select Account...</option>
                                {accounts.map(acc => (
                                   <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                                ))}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Contact Person</Label>
                             <select
                               value={formData.contactId}
                               onChange={handleChange}
                               name="contactId"
                               className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition-all appearance-none"
                               disabled={!formData.accountId}
                             >
                                <option value="">Select Contact...</option>
                                {contacts.map(c => (
                                   <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                             </select>
                          </div>
                       </div>

                       <div className="space-y-3 pt-6 border-t border-slate-50">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Affected Asset / Serial No</Label>
                          <select
                            value={formData.assetId}
                            onChange={handleChange}
                            name="assetId"
                            className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition-all appearance-none"
                            disabled={!formData.accountId}
                          >
                             <option value="">No Specific Asset (General Query)</option>
                             {assets.map(a => (
                                <option key={a.id} value={a.id}>{a.brand} {a.model} ({a.serialNo})</option>
                             ))}
                          </select>
                       </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Right Column: Content Area */}
              <div className="space-y-10">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-2">
                    <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                       <CardTitle className="text-lg font-black uppercase tracking-tight">Intelligence Log</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 py-8 space-y-8">
                       <div className="space-y-3 text-slate-900">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity Index</Label>
                          <select 
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full h-12 rounded-xl bg-white/5 border-2 border-white/10 text-white font-bold px-4 focus:outline-none focus:border-indigo-400 transition-all"
                          >
                             <option value="LOW">Low (Non-Critical)</option>
                             <option value="MEDIUM">Medium (Standard)</option>
                             <option value="HIGH">High (Urgent)</option>
                             <option value="CRITICAL">Critical (System Down)</option>
                          </select>
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Description *</Label>
                          <textarea 
                            required
                            rows={8}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Detailed explanation of the issue as reported by the customer..."
                            className="w-full rounded-2xl bg-white/5 border-2 border-white/10 text-white p-6 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all"
                          />
                       </div>
                    </CardContent>
                 </Card>

                 <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border-2 border-indigo-100 flex items-start gap-4">
                    <History className="h-6 w-6 text-indigo-500 mt-1 shrink-0" />
                    <div className="space-y-2">
                       <p className="text-sm font-black text-indigo-900 uppercase italic tracking-tight">Audit Visibility</p>
                       <p className="text-[11px] text-indigo-700 font-medium leading-relaxed opacity-80">
                          This entry is permanent. All subsequent work orders and communications will be linked to this unique ticket identifier.
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
