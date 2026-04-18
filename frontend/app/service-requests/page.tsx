"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ServiceRequest, 
  ServiceRequestStatus, 
  ServiceRequestSource
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  MoreVertical,
  ChevronRight,
  Loader2,
  Inbox,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ServiceRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | "all">("all");

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
      const data = await fieldService.getAllServiceRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast.error("Failed to load service requests");
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: ServiceRequestSource) => {
    switch (source) {
      case ServiceRequestSource.PHONE: return <Phone className="h-3.5 w-3.5" />;
      case ServiceRequestSource.EMAIL: return <Mail className="h-3.5 w-3.5" />;
      case ServiceRequestSource.PORTAL: return <Globe className="h-3.5 w-3.5" />;
      case ServiceRequestSource.WHATSAPP: return <MessageCircle className="h-3.5 w-3.5" />;
      default: return <Plus className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: ServiceRequestStatus) => {
    switch (status) {
      case ServiceRequestStatus.OPEN:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-black tracking-widest px-3">New</Badge>;
      case ServiceRequestStatus.ACKNOWLEDGED:
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[9px] font-black tracking-widest px-3">Acked</Badge>;
      case ServiceRequestStatus.RESOLVED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-black tracking-widest px-3">Resolved</Badge>;
      case ServiceRequestStatus.CLOSED:
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 uppercase text-[9px] font-black tracking-widest px-3">Closed</Badge>;
      case ServiceRequestStatus.CANCELLED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[9px] font-black tracking-widest px-3">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(sr => {
    const matchesSearch = 
      sr.srNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sr.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Desk</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Ticketing & Complaint Management</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push("/service-requests/new")}
              className="rounded-2xl h-12 px-6 font-black shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-slate-900 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Complaint
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Intelligence Filters Area */}
        <div className="mb-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:max-w-2xl group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
             <Input 
                placeholder="Search by ticket ID, description or customer context..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 h-16 rounded-[2.5rem] border-none shadow-xl bg-white focus:ring-indigo-600/10 text-md font-medium"
             />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="bg-white px-6 h-16 rounded-[2.5rem] shadow-xl flex items-center gap-4 flex-1 lg:flex-none">
                <Filter className="h-4 w-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-[11px] font-black text-slate-900 focus:ring-0 uppercase tracking-widest"
                >
                   <option value="all">Pipeline Status</option>
                   {Object.values(ServiceRequestStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                   ))}
                </select>
             </div>
             <div className="bg-slate-900 px-8 h-16 rounded-[2.5rem] shadow-2xl flex items-center gap-4 text-xs font-black text-white uppercase tracking-widest active:scale-95 transition-all">
                <Inbox className="h-5 w-5 text-indigo-400" />
                {filteredRequests.length} Active Tickets
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
             <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Registry...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-[4rem] p-32 text-center shadow-2xl border-2 border-dashed border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="h-32 w-32 bg-slate-50 rounded-[48px] flex items-center justify-center mb-10 border border-slate-100/50">
                <Inbox className="h-12 w-12 text-slate-200" />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Desk Cleared</h2>
             <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed italic opacity-80">All service requests have been processed or no entries match your search parameters.</p>
             <Button onClick={() => router.push("/service-requests/new")} className="rounded-[2.5rem] h-16 px-12 font-black shadow-2xl shadow-indigo-600/30 bg-indigo-600">
                <Plus className="h-6 w-6 mr-3" />
                Log Initial Request
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredRequests.sort((a,b) => b.srNumber.localeCompare(a.srNumber)).map((sr) => (
              <Card 
                key={sr.id} 
                className="rounded-[2.5rem] border-none shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-white hover:-translate-y-1 active:scale-[0.99] overflow-hidden"
                onClick={() => router.push(`/service-requests/${sr.id}`)}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                    <div className="flex-shrink-0 flex items-center gap-6">
                       <div className="h-16 w-16 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border-2 border-slate-100 group-hover:border-indigo-600/20 transition-colors">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID</span>
                          <span className="text-sm font-black text-slate-900 tracking-tight uppercase">{sr.srNumber.split('-')[1] || sr.srNumber}</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                             {getSourceIcon(sr.source)}
                             Via {sr.source}
                          </p>
                          <div className="flex items-center gap-3">
                             {getStatusBadge(sr.status)}
                             <Badge variant="outline" className={`rounded-xl text-[9px] font-black uppercase tracking-widest px-2.5 py-1 ${sr.priority === 'HIGH' || sr.priority === 'CRITICAL' ? 'text-rose-600 border-rose-100 bg-rose-50' : 'text-slate-500 border-slate-200'}`}>
                                {sr.priority}
                             </Badge>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 min-w-0">
                       <h4 className="text-xl font-black text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors mb-2">
                         {sr.description}
                       </h4>
                       <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5" />
                             Logged {new Date(sr.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5" />
                             SLA Target: {new Date(sr.slaDeadline).toLocaleDateString()}
                          </div>
                       </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-4 lg:ml-auto">
                       {sr.workOrderId && (
                          <div className="hidden lg:flex flex-col items-end px-6 border-r border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase italic">Linked Action</p>
                             <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{sr.workOrderId.split('-')[1] || "Released"}</p>
                          </div>
                       )}
                       <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-none">
                          <ArrowUpRight className="h-6 w-6" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
