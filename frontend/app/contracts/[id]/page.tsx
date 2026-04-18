"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Contract, ContractStatus, Asset } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { 
  ChevronLeft, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  Clock, 
  FileText, 
  AlertCircle,
  Laptop,
  Coins,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ExternalLink,
  History,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "@/lib/toast";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadContract();
  }, [id, router]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await fieldService.getContractById(id);
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'activate' | 'cancel' | 'renew') => {
    if (!contract) return;
    
    try {
      setActionLoading(true);
      let updated;
      switch (action) {
        case 'activate':
          updated = await fieldService.activateContract(id);
          showToast.success("Contract activated successfully");
          break;
        case 'cancel':
          if (!confirm("Are you sure you want to cancel this contract?")) return;
          updated = await fieldService.cancelContract(id);
          showToast.success("Contract cancelled");
          break;
        case 'renew':
          router.push(`/contracts/${id}/renew`);
          return;
      }
      if (updated) setContract(updated);
    } catch (err) {
      showToast.error("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px]">Active</Badge>;
      case ContractStatus.DRAFT:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold uppercase text-[10px]">Draft</Badge>;
      case ContractStatus.EXPIRED:
      case ContractStatus.CANCELLED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-bold uppercase text-[10px]">{status}</Badge>;
      case ContractStatus.RENEWED:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-bold uppercase text-[10px]">Renewed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-tight">Accessing contract vault...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Unavailable</h2>
          <p className="text-slate-500 mb-8 font-medium">{error || "This contract record might have been archived or deleted."}</p>
          <Button onClick={() => router.push("/contracts")} className="rounded-xl w-full">
            Back to Contracts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-6">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/contracts")}
                className="rounded-full hover:bg-slate-100 h-11 w-11 border border-slate-100 shadow-sm"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono uppercase">{contract.contractNumber}</h1>
                  {getStatusBadge(contract.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {contract.accountName}
                  </span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {contract.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {contract.status === ContractStatus.DRAFT && (
                <Button 
                  onClick={() => handleAction('activate')}
                  disabled={actionLoading}
                  className="rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activate Contract
                </Button>
              )}
              {contract.status === ContractStatus.ACTIVE && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleAction('renew')}
                    className="rounded-2xl font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Renew
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => handleAction('cancel')}
                    className="rounded-2xl font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-white p-1 rounded-[20px] border border-slate-200 shadow-sm h-14 inline-flex w-full md:w-auto">
                <TabsTrigger value="details" className="rounded-2xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                   Contract Details
                </TabsTrigger>
                <TabsTrigger value="assets" className="rounded-2xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                   Covered Assets ({contract.assetIds?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-2xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                   Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
                       <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Commitment Metrics</CardTitle>
                       </CardHeader>
                       <CardContent className="p-8 space-y-8">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                   <Clock className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Response SLA</span>
                             </div>
                             <span className="text-lg font-black text-slate-900">{contract.slaConfig?.responseHrs} Hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 underline-offset-4">
                                   <Clock className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Resolution SLA</span>
                             </div>
                             <span className="text-lg font-black text-slate-900">{contract.slaConfig?.resolutionHrs} Hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                                   <Calendar className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">PM Visits / Year</span>
                             </div>
                             <span className="text-lg font-black text-slate-900">{contract.visitFrequencyPerYear} Visits</span>
                          </div>
                       </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
                       <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Financial Summary</CardTitle>
                       </CardHeader>
                       <CardContent className="p-8 space-y-8">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                   <FileText className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Billing Cycle</span>
                             </div>
                             <span className="text-lg font-black text-slate-900 uppercase">{contract.billingCycle?.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                   <AlertCircle className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Hourly Breach Penalty</span>
                             </div>
                             <span className="text-lg font-black text-rose-600">₹{contract.penaltyConfig?.perHourBreachPenalty?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                             <span className="text-sm font-bold text-slate-400">Total Contract Value</span>
                             <span className="text-2xl font-black text-primary">₹{contract.contractValue?.toLocaleString()}</span>
                          </div>
                       </CardContent>
                    </Card>
                 </div>

                 <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                       <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 font-mono">Notes & Special Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 font-medium text-slate-600 leading-relaxed italic bg-slate-50/30">
                       {contract.notes || "No additional specific operational instructions registered for this contract."}
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="assets" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.assets ? contract.assets.map(asset => (
                       <Card 
                         key={asset.id} 
                         onClick={() => router.push(`/assets/${asset.id}`)}
                         className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/20"
                       >
                          <CardContent className="p-6 flex items-center gap-5">
                             <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Laptop className="h-6 w-6" />
                             </div>
                             <div className="flex-1">
                                <p className="font-black text-slate-900 tracking-tight">{asset.brand} {asset.model}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{asset.serialNo}</p>
                             </div>
                             <ExternalLink className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                          </CardContent>
                       </Card>
                    )) : (
                       <div className="md:col-span-2 p-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                          <Laptop className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                          <p className="font-bold text-slate-500">No assets linked to this contract.</p>
                       </div>
                    )}
                 </div>
              </TabsContent>

              <TabsContent value="history" className="mt-8 outline-none">
                 <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <History className="h-5 w-5 text-slate-500" />
                       </div>
                       <h3 className="text-lg font-black text-slate-900 tracking-tight">Contract Lifecycle</h3>
                    </div>
                    
                    <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                       <div className="relative pl-12">
                          <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center z-10">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900">Contract Activated</p>
                             <p className="text-xs font-bold text-slate-400">{new Date(contract.startDate).toLocaleDateString()} — SYSTEM</p>
                          </div>
                       </div>
                       <div className="relative pl-12">
                          <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-4 border-slate-100 shadow-sm flex items-center justify-center z-10">
                              <Calendar className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-600 italic">Scheduled Expiry</p>
                             <p className="text-xs font-bold text-slate-400">{new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-10">
              <Card className="rounded-[40px] border-none bg-slate-900 shadow-2xl p-4 overflow-hidden relative">
                 <div className="absolute -right-10 -top-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl"></div>
                 <CardHeader className="border-b border-white/5 space-y-1 pb-6 pt-6 px-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">Validity Timeline</p>
                    <div className="flex items-center justify-between text-white">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Date</p>
                          <p className="text-md font-black italic">{new Date(contract.startDate).toLocaleDateString()}</p>
                       </div>
                       <div className="h-8 w-px bg-white/5 mx-2"></div>
                       <div className="space-y-1 text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Date</p>
                          <p className="text-md font-black italic">{new Date(contract.endDate).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="pt-8 space-y-6 px-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Remaining</span>
                           <span className="text-xs font-black text-primary uppercase">Active Coverage</span>
                        </div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter">
                          {Math.max(0, Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                        </h2>
                    </div>
                    {contract.status === ContractStatus.ACTIVE && (
                       <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                             <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                             <p className="text-sm font-black text-emerald-500 uppercase tracking-tighter">Protection Live</p>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Underwritten by policy {contract.contractNumber}. All parts and labor covered as per AMC norms.
                          </p>
                       </div>
                    )}
                 </CardContent>
              </Card>

              <Card className="rounded-[40px] border-slate-200 shadow-sm bg-white p-2">
                 <CardHeader className="px-6 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Owner Account</CardTitle>
                    <Building2 className="h-4 w-4 text-slate-300" />
                 </CardHeader>
                 <CardContent className="p-8">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-7 mb-6">{contract.accountName}</h3>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-12 font-bold group border-slate-100 hover:border-primary/20"
                      onClick={() => router.push(`/accounts/${contract.accountId}`)}
                    >
                      View Account Profile
                      <ChevronRight className="h-4 w-4 ml-2 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Button>
                 </CardContent>
              </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
