"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ServiceRequest, 
  ServiceRequestStatus, 
  Asset,
  Contract,
  WorkOrder
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
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  Laptop,
  Building2,
  MessageSquare,
  ShieldCheck,
  Play,
  ArrowRight,
  Loader2,
  Activity,
  Phone,
  Globe,
  Mail,
  MessageCircle,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [sr, setSr] = useState<ServiceRequest | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [id, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const srData = await fieldService.getServiceRequestById(id);
      setSr(srData);

      const [accData, contactData] = await Promise.all([
        accountsService.getAccountById(srData.accountId),
        srData.contactId ? contactsService.getContactById(srData.contactId) : Promise.resolve(null)
      ]);
      
      setAccount(accData);
      setContact(contactData);

      if (srData.assetId) {
        fieldService.getAssetById(srData.assetId).then(setAsset);
      }
      if (srData.workOrderId) {
        fieldService.getWorkOrderById(srData.workOrderId).then(setWorkOrder);
      }
    } catch (err) {
      showToast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async () => {
    try {
      await fieldService.acknowledgeServiceRequest(id);
      showToast.success("Complaint acknowledged");
      loadData();
    } catch (err) {
      showToast.error("Failed to acknowledge");
    }
  };

  const dispatchWorkOrder = () => {
    router.push(`/work-orders/new?srId=${id}&accountId=${sr?.accountId}&assetId=${sr?.assetId || ""}`);
  };

  const getStatusBadge = (status: ServiceRequestStatus) => {
    switch (status) {
      case ServiceRequestStatus.OPEN:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-black tracking-widest px-4">Unassigned Log</Badge>;
      case ServiceRequestStatus.ACKNOWLEDGED:
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[10px] font-black tracking-widest px-4">Awaiting Dispatch</Badge>;
      case ServiceRequestStatus.RESOLVED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-black tracking-widest px-4">Resolved</Badge>;
      case ServiceRequestStatus.CLOSED:
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 uppercase text-[10px] font-black tracking-widest px-4">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
           <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
           <p className="text-slate-500 font-medium tracking-tight">Syncing ticket record...</p>
        </div>
      </div>
    );
  }

  if (!sr) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/service-requests")}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{sr.srNumber}</h1>
                   {getStatusBadge(sr.status)}
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Logged via {sr.source} • {new Date(sr.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               {sr.status === ServiceRequestStatus.OPEN && (
                  <Button 
                    onClick={acknowledge}
                    className="rounded-2xl h-11 px-8 font-black shadow-xl shadow-primary/20 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
                  >
                     <CheckCircle2 className="h-4 w-4 mr-2" />
                     Acknowledge Intake
                  </Button>
               )}
               {(sr.status === ServiceRequestStatus.OPEN || sr.status === ServiceRequestStatus.ACKNOWLEDGED) && !sr.workOrderId && (
                  <Button 
                    onClick={dispatchWorkOrder}
                    className="rounded-2xl h-11 px-8 font-black shadow-xl shadow-indigo-600/20 bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95"
                  >
                     <Play className="h-4 w-4 mr-2" />
                     Trigger Field Action
                  </Button>
               )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           
           {/* Detailed Request Info */}
           <div className="lg:col-span-3 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 group overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6">
                       <div className="h-20 w-20 bg-indigo-50 rounded-[28px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Building2 className="h-10 w-10" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Claimant Entity</p>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{account?.accountName}</h4>
                          <p className="text-xs font-bold text-slate-500 truncate">{account?.billingCity}, {account?.billingState}</p>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => router.push(`/accounts/${account?.id}`)} className="rounded-xl h-10 w-10">
                          <ExternalLink className="h-4 w-4" />
                       </Button>
                    </CardContent>
                 </Card>

                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 group overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6">
                       <div className="h-20 w-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <User className="h-10 w-10" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reporting Contact</p>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{contact?.firstName} {contact?.lastName}</h4>
                          <p className="text-xs font-bold text-slate-500 truncate">{contact?.email}</p>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => router.push(`/contacts/${contact?.id}`)} className="rounded-xl h-10 w-10">
                          <ExternalLink className="h-4 w-4" />
                       </Button>
                    </CardContent>
                 </Card>
              </div>

              <Card className="rounded-[3rem] border-none shadow-xl bg-white p-4">
                 <CardHeader className="px-10 pt-10 pb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                          <MessageSquare className="h-6 w-6" />
                       </div>
                       <div>
                          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Issue Statement</CardTitle>
                          <CardDescription className="text-slate-400 font-medium">Categorized complaint data as logged by the channel.</CardDescription>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="px-10 pb-10 pt-6 space-y-10">
                    <div className="bg-slate-50 rounded-[2.5rem] p-10 text-lg font-medium text-slate-700 leading-relaxed border-2 border-slate-100/50 italic">
                       "{sr.description}"
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Asset</p>
                          <p className="font-black text-slate-900 flex items-center gap-2">
                             <Laptop className="h-4 w-4 text-indigo-500" />
                             {asset ? `${asset.brand} ${asset.model}` : "General (Non-Asset)"}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Class</p>
                          <p className={`font-black flex items-center gap-2 ${sr.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-900'}`}>
                             <Activity className="h-4 w-4" />
                             {sr.priority}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Deadline</p>
                          <p className="font-black text-slate-900 flex items-center gap-2">
                             <Clock className="h-4 w-4 text-indigo-500" />
                             {new Date(sr.slaDeadline).toLocaleString()}
                          </p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              {/* Linked Work Order Activity */}
              {sr.workOrderId && (
                <Card className="rounded-[3rem] border-none shadow-2xl bg-indigo-600 text-white overflow-hidden p-2">
                   <CardContent className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className="h-20 w-20 bg-white/10 rounded-[28px] flex items-center justify-center">
                            <ShieldCheck className="h-10 w-10" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Execution Linkage</p>
                            <h4 className="text-2xl font-black tracking-tight">{workOrder ? workOrder.woNumber : "Dispatch Active"}</h4>
                            <p className="text-sm font-bold opacity-80">This ticket is currently being handled in the field.</p>
                         </div>
                      </div>
                      <Button onClick={() => router.push(`/work-orders/${sr.workOrderId}`)} className="rounded-[2rem] h-14 px-10 bg-white text-indigo-600 font-black hover:bg-slate-100 shadow-2xl">
                         Go to Operation Hub
                         <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                   </CardContent>
                </Card>
              )}
           </div>

           {/* Sidebar: Diagnostics */}
           <div className="space-y-10">
              <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-2">
                 <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Timeline Progress</CardTitle>
                 </CardHeader>
                 <CardContent className="px-8 py-8 space-y-8">
                    <div className="relative pl-8 border-l-2 border-white/5 space-y-10">
                       <div className="relative">
                          <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                             <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intake</p>
                             <p className="text-sm font-bold">{new Date(sr.createdAt).toLocaleString()}</p>
                          </div>
                       </div>
                       
                       <div className="relative">
                          <div className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${sr.acknowledgedAt ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                             {sr.acknowledgedAt && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acknowledgement</p>
                             <p className="text-sm font-bold">{sr.acknowledgedAt ? new Date(sr.acknowledgedAt).toLocaleString() : "Pending Verification"}</p>
                          </div>
                       </div>

                       <div className="relative">
                          <div className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${sr.workOrderId ? 'bg-emerald-500' : 'bg-slate-700 animate-pulse'}`}>
                             {sr.workOrderId && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Dispatch</p>
                             <p className="text-sm font-bold">{sr.workOrderId ? "Action Released" : "Awaiting Coordination"}</p>
                          </div>
                       </div>

                       <div className="relative opacity-30">
                          <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-slate-700 border-4 border-slate-900"></div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closure</p>
                             <p className="text-sm font-bold">Awaiting Resolution</p>
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <div className="p-8 bg-amber-50 rounded-[3rem] border-2 border-amber-100 flex flex-col gap-4">
                 <AlertTriangle className="h-6 w-6 text-amber-500" />
                 <p className="text-xs font-black text-amber-900 uppercase">SLA Caution</p>
                 <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    SLA targets are binding based on the customer contract. Failure to acknowledge within the first 4 hours impacts system performance metrics.
                 </p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

function CheckIcon(props: any) {
   return (
      <svg
         {...props}
         xmlns="http://www.w3.org/2000/svg"
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="3"
         strokeLinecap="round"
         strokeLinejoin="round"
      >
         <path d="M20 6 9 17l-5-5" />
      </svg>
   )
}
