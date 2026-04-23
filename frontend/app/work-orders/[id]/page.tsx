"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  Asset,
  Contract,
  ChecklistResponse,
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { accountsService } from "@/lib/accounts";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { Account } from "@/types/account";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Settings2,
  ExternalLink,
  Laptop,
  Building2,
  MessageSquare,
  ShieldCheck,
  ClipboardCheck,
  Package,
  History,
  Play,
  Check,
  MoreVertical,
  Loader2,
  MapPin,
  Stethoscope,
  ChevronRight,
  Info,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [engineers, setEngineers] = useState<UserResponse[]>([]);
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
      const orderData = await fieldService.getWorkOrderById(id);
      setOrder(orderData);

      const [accData, usersData] = await Promise.all([
        accountsService.getAccountById(orderData.accountId),
        usersService.getActiveUsers(),
      ]);

      setAccount(accData);
      setEngineers(usersData);

      if (orderData.assetId) {
        fieldService.getAssetById(orderData.assetId).then(setAsset);
      }
      if (orderData.contractId) {
        fieldService.getContractById(orderData.contractId).then(setContract);
      }

      fieldService
        .getChecklistResponse(id)
        .then(setChecklist)
        .catch(() => setChecklist(null));
    } catch (err) {
      console.error("Failed to load work order:", err);
      showToast.error("Failed to load work order details");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: WorkOrderStatus) => {
    try {
      await fieldService.updateWorkOrderStatus(id, newStatus);
      showToast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      loadData();
    } catch (err) {
      showToast.error("Failed to update status. Ensure valid workflow transition.");
    }
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.LOW:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[10px] font-black tracking-widest px-3">
            Low
          </Badge>
        );
      case WorkOrderPriority.MEDIUM:
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-black tracking-widest px-3">
            Medium
          </Badge>
        );
      case WorkOrderPriority.HIGH:
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[10px] font-black tracking-widest px-3">
            High
          </Badge>
        );
      case WorkOrderPriority.CRITICAL:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-black tracking-widest px-3 animate-pulse">
            Critical
          </Badge>
        );
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Syncing field record...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/work-orders")}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {order.woNumber}
                  </h1>
                  {getPriorityBadge(order.priority)}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {order.status.replace("_", " ")}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-2xl h-11 px-6 font-black tracking-tight shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 transition-all active:scale-95">
                    Workflow Stage
                    <ChevronRight className="h-4 w-4 ml-2 rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl p-2 shadow-2xl border-2 border-slate-100"
                >
                  {Object.values(WorkOrderStatus).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => updateStatus(status)}
                      className="rounded-xl font-bold py-3 px-4 text-xs uppercase tracking-widest text-slate-600 focus:bg-primary focus:text-white"
                    >
                      {status.replace("_", " ")}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl h-11 w-11 border-slate-200"
                onClick={() => router.push(`/work-orders/${id}/edit`)}
              >
                <Settings2 className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Primary Content: Details & Diagnostic */}
          <div className="lg:col-span-3 space-y-10">
            {/* Asset & Contract Info Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 group hover:shadow-2xl transition-all">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="h-16 w-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Laptop className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Target Asset
                    </p>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">
                      {asset?.brand} {asset?.model}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">SN: {asset?.serialNo}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/assets/${asset?.id}`)}
                    className="ml-auto rounded-xl hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 group hover:shadow-2xl transition-all">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="h-16 w-16 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Service Level
                    </p>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">
                      {contract?.type || "AD-HOC (BILLABLE)"}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {contract ? `Ref: ${contract.contractNumber}` : "Standard on-demand pricing"}
                    </p>
                  </div>
                  {contract && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      className="ml-auto rounded-xl hover:bg-slate-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Problem Analysis */}
            <Card className="rounded-[3rem] border-none shadow-xl bg-white p-4">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                      Technical Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium">
                      Original complaint and diagnostic findings.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-6 space-y-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black font-bold uppercase tracking-[0.2em] text-slate-400">
                    Reported Symptoms
                  </Label>
                  <div className="bg-slate-50 rounded-[2rem] p-8 text-slate-700 font-medium leading-relaxed border-2 border-slate-100/50">
                    {order.symptoms}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Professional Diagnosis
                    </Label>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                      {order.diagnosis || "Technician has not provided diagnosis yet."}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolution Logic
                    </Label>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                      {order.resolution || "Resolution pending field activity."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Activity Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="rounded-[2.5rem] bg-indigo-600 text-white shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => router.push(`/work-orders/${id}/checklist`)}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-50" />
                  </div>
                  <h5 className="text-lg font-black tracking-tight mb-2 uppercase italic">
                    Safety Checklist
                  </h5>
                  <p className="text-xs font-medium text-white/70 leading-relaxed">
                    {checklist?.completedAt
                      ? "Checklist validated and stored."
                      : "Mandatory inspection required before closure."}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="rounded-[2.5rem] bg-emerald-600 text-white shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => router.push(`/work-orders/${id}/parts`)}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                      <Package className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-50" />
                  </div>
                  <h5 className="text-lg font-black tracking-tight mb-2 uppercase italic">
                    Spare Parts
                  </h5>
                  <p className="text-xs font-medium text-white/70 leading-relaxed">
                    Request new components or track consumed inventory.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] bg-slate-100 text-slate-600 shadow-xl border-none">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="p-3 bg-slate-200 rounded-2xl">
                      <History className="h-6 w-6" />
                    </div>
                  </div>
                  <h5 className="text-lg font-black tracking-tight mb-2 text-slate-900 uppercase italic">
                    Timeline Logs
                  </h5>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">
                    View state transitions and audit logs for this order.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar: Coordination & Metadata */}
          <div className="space-y-10">
            <Card className="rounded-[3rem] border-none shadow-xl bg-white p-2">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  Dispatch Coordination
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-6 space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Field Personnel
                  </Label>
                  {order.assignedEngineerIds?.length ? (
                    order.assignedEngineerIds.map((eId) => {
                      const eng = engineers.find((u) => u.id === eId);
                      return (
                        <div
                          key={eId}
                          className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                            {eng?.profile?.fullName || eng?.username?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">
                              {eng?.profile?.fullName || eng?.username}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              {eng?.roleName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-dashed border-amber-200 text-center">
                      <User className="h-5 w-5 text-amber-500 mx-auto mb-1 opacity-50" />
                      <p className="text-[10px] font-black text-amber-900 uppercase italic">
                        Pending Allocation
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-12 font-bold text-xs uppercase tracking-widest text-slate-600 border-2 border-slate-50"
                  >
                    Re-Assign Team
                  </Button>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Target Location
                  </Label>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                      {account?.billingCity}, {account?.billingState}
                      <br />
                      <span className="text-xs text-slate-400">{account?.billingStreet}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-2">
              <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-between">
                  SLA Engine
                  <Clock className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Deadline</span>
                  <span
                    className={`text-xs font-black italic ${order.slaBreached ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {new Date(order.slaDeadline).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${order.slaBreached ? "bg-rose-600 w-full" : "bg-emerald-500 w-[65%]"}`}
                    ></div>
                  </div>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center">
                    {order.slaBreached ? "SLA VIOLATION DETECTED" : "65% TAT ELAPSED"}
                  </p>
                </div>
                {order.slaBreached && (
                  <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 text-[10px] font-bold leading-relaxed">
                    <AlertTriangle className="h-3.5 w-3.5 mb-1" />
                    Response target was missed. Automated escalation active.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-8 bg-blue-50/50 rounded-[3rem] border-2 border-blue-100/50 space-y-4">
              <Info className="h-6 w-6 text-blue-500" />
              <p className="text-xs font-bold text-blue-900 uppercase tracking-tight">
                System Notice
              </p>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                Closed orders are archived and frozen. Any subsequent issues require a new Re-Opened
                workflow or a fresh Service Request.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
