"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  WorkOrder, 
  WorkOrderStatus, 
  WorkOrderPriority,
  WorkOrderType
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Loader2,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkOrdersPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [engineers, setEngineers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, usersData] = await Promise.all([
        fieldService.getAllWorkOrders(),
        usersService.getActiveUsers()
      ]);
      setWorkOrders(ordersData);
      setEngineers(usersData);
    } catch (err) {
      showToast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      await fieldService.updateWorkOrderStatus(id, newStatus);
      showToast.success("Status updated");
      loadData();
    } catch (err) {
      showToast.error("Failed to update status");
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = 
      order.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.symptoms?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.LOW: return "bg-slate-100 text-slate-600 border-slate-200";
      case WorkOrderPriority.MEDIUM: return "bg-blue-100 text-blue-700 border-blue-200";
      case WorkOrderPriority.HIGH: return "bg-orange-100 text-orange-700 border-orange-200";
      case WorkOrderPriority.CRITICAL: return "bg-rose-100 text-rose-700 border-rose-200";
      case WorkOrderPriority.EMERGENCY: return "bg-red-600 text-white border-red-700 animate-pulse";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const statusColumns: WorkOrderStatus[] = [
    WorkOrderStatus.OPEN,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.PENDING_SPARES,
    WorkOrderStatus.COMPLETED
  ];

  const getStatusLabel = (status: WorkOrderStatus) => {
    return status.replace('_', ' ');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner & Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Operations</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Service Fulfillment Hub</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Button 
                  variant={viewMode === 'kanban' ? 'outline' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`rounded-lg h-9 px-4 font-black text-[10px] uppercase tracking-widest ${viewMode === 'kanban' ? 'shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                  Kanban
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'outline' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg h-9 px-4 font-black text-[10px] uppercase tracking-widest ${viewMode === 'list' ? 'shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <ListIcon className="h-3.5 w-3.5 mr-2" />
                  Table
                </Button>
              </div>

              <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

              <Button 
                onClick={() => router.push("/work-orders/new")}
                className="rounded-xl h-11 px-6 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dispatch Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Area */}
        <div className="mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:max-w-xl group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
             </div>
             <Input 
                placeholder="Search by WO Number, symptoms or diagnosis..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus:ring-primary/20 text-md font-medium"
             />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="bg-white px-4 h-14 rounded-2xl shadow-xl flex items-center gap-3 flex-1 lg:flex-none">
                <Filter className="h-4 w-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-sm font-black text-slate-900 focus:ring-0 appearance-none pr-8 cursor-pointer uppercase tracking-tight"
                >
                   <option value="all">Across All Stages</option>
                   {Object.values(WorkOrderStatus).map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                   ))}
                </select>
             </div>
             <div className="bg-white px-6 h-14 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-black text-slate-950 uppercase tracking-tighter border-2 border-primary/5">
                <Inbox className="h-5 w-5 text-primary" />
                {filteredOrders.length} Orders
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
             <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Work Records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-32 text-center shadow-2xl border-2 border-dashed border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="h-28 w-28 bg-slate-50 rounded-[40px] shadow-sm flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <Inbox className="h-12 w-12 text-slate-200" />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Registry is Empty</h2>
             <p className="text-slate-400 font-bold max-w-md mx-auto mb-10 text-lg leading-relaxed">No work orders match your current filters. Adjust your search or dispatch a new order to the field.</p>
             <Button onClick={() => router.push("/work-orders/new")} className="rounded-[2rem] h-16 px-12 font-black shadow-2xl shadow-primary/25 text-lg">
                <Plus className="h-6 w-6 mr-3" />
                Dispatch New Order
             </Button>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar min-h-[70vh] animate-in slide-in-from-right-4 duration-700">
            {statusColumns.map((status) => {
              const columnOrders = filteredOrders.filter(o => o.status === status);
              return (
                <div key={status} className="flex-shrink-0 w-80 lg:w-96 flex flex-col gap-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                       <div className={`h-2.5 w-2.5 rounded-full ${status === WorkOrderStatus.OPEN ? 'bg-slate-300' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'}`}></div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-950">{getStatusLabel(status)}</h3>
                       <Badge className="bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black px-2">{columnOrders.length}</Badge>
                    </div>
                  </div>

                  <div className="bg-slate-200/40 rounded-[2.5rem] p-4 flex-1 space-y-4 border border-slate-200/50 backdrop-blur-sm">
                    {columnOrders.map((order) => {
                      const eng = engineers.find(e => order.assignedEngineerIds?.includes(e.id));
                      return (
                        <Card 
                          key={order.id} 
                          className="rounded-[2rem] border-none shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-white hover:-translate-y-1 active:scale-[0.98]"
                          onClick={() => router.push(`/work-orders/${order.id}`)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5">
                               <Badge className={`${getPriorityColor(order.priority)} rounded-xl text-[9px] font-black uppercase tracking-widest px-3 py-1 border-2`}>
                                 {order.priority}
                               </Badge>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                 {order.woNumber}
                               </p>
                            </div>

                            <div className="min-h-[60px] mb-6">
                               <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                                 {order.symptoms || "Scheduled maintenance visit"}
                               </h4>
                            </div>

                            <div className="space-y-4 pt-5 border-t border-slate-50">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                        <User className="h-4 w-4" />
                                     </div>
                                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[120px]">
                                        {eng ? (eng.profile?.fullName || eng.username) : "Unassigned"}
                                     </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                     <Calendar className="h-3.5 w-3.5" />
                                     <span className="text-[10px] font-bold">{new Date(order.scheduledDate).toLocaleDateString()}</span>
                                  </div>
                               </div>

                               <div className="flex items-center justify-between pt-1">
                                  <div className="flex items-center gap-1.5">
                                     {order.slaBreached ? (
                                        <div className="flex items-center gap-1 text-rose-600">
                                           <AlertTriangle className="h-3.5 w-3.5" />
                                           <span className="text-[10px] font-black uppercase tracking-tighter">SLA BREACHED</span>
                                        </div>
                                     ) : (
                                        <div className="flex items-center gap-1 text-emerald-600">
                                           <Clock className="h-3.5 w-3.5" />
                                           <span className="text-[10px] font-black uppercase tracking-tighter">SLA ON TRACK</span>
                                        </div>
                                     )}
                                  </div>
                                  <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
                                     <ArrowRight className="h-4 w-4" />
                                  </div>
                               </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {columnOrders.length === 0 && (
                       <div className="h-32 rounded-[2rem] border-2 border-dashed border-slate-200/50 flex items-center justify-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Clear Runway</p>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Track ID</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Status & Priority</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Issue Summary</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Field Force</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Schedule</th>
                    <th className="px-8 py-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.sort((a,b) => b.woNumber.localeCompare(a.woNumber)).map((order) => {
                    const eng = engineers.find(e => order.assignedEngineerIds?.includes(e.id));
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/work-orders/${order.id}`)}
                      >
                        <td className="px-8 py-7">
                          <span className="text-sm font-black text-slate-950 tracking-tighter uppercase">{order.woNumber}</span>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">{order.type}</p>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${order.status === WorkOrderStatus.OPEN ? 'bg-slate-300' : 'bg-primary'}`}></div>
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{getStatusLabel(order.status)}</span>
                             </div>
                             <Badge className={`${getPriorityColor(order.priority)} rounded-lg text-[9px] font-black px-2 py-0.5 border w-fit`}>
                                {order.priority}
                             </Badge>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <p className="text-sm font-bold text-slate-900 line-clamp-2 max-w-sm tracking-tight leading-relaxed">
                            {order.symptoms || "Recurring service visit"}
                          </p>
                        </td>
                        <td className="px-8 py-7 text-sm font-black text-slate-700 uppercase tracking-tight">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                               <User className="h-4 w-4" />
                             </div>
                             <span>{eng ? (eng.profile?.fullName || eng.username) : "PENDING"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <p className="text-sm font-black text-slate-950 tracking-tighter">
                            {new Date(order.scheduledDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             {order.slaBreached ? (
                               <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-200 bg-rose-50 rounded-md">BREACHED</Badge>
                             ) : (
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Within SLA</span>
                             )}
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-none">
                              <ChevronRight className="h-5 w-5" />
                           </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
