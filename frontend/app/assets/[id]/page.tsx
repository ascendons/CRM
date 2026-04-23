"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Asset, WorkOrder, AssetStatus } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import {
  ChevronLeft,
  Settings2,
  Laptop,
  Calendar,
  Building2,
  Activity,
  FileText,
  History,
  ShieldCheck,
  MapPin,
  BadgeInfo,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAssetData();
  }, [id, router]);

  const loadAssetData = async () => {
    try {
      setLoading(true);
      const [assetData, woData] = await Promise.all([
        fieldService.getAssetById(id),
        fieldService.getAllWorkOrders({ assetId: id }),
      ]);
      setAsset(assetData);
      setWorkOrders(woData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load asset details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.ACTIVE:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px]">
            Active
          </Badge>
        );
      case AssetStatus.UNDER_REPAIR:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold uppercase text-[10px]">
            Under Repair
          </Badge>
        );
      case AssetStatus.DECOMMISSIONED:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold uppercase text-[10px]">
            Decommissioned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-tight">Retrieving asset 360° view...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <BadgeInfo className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Asset Not Found</h2>
          <p className="text-slate-500 mb-8 font-medium">
            {error || "The requested equipment record could not be found."}
          </p>
          <Button onClick={() => router.push("/assets")} className="rounded-xl w-full">
            Back to Registry
          </Button>
        </div>
      </div>
    );
  }

  const DetailItem = ({ label, value, icon: Icon, colorClass = "text-slate-400" }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className={`p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-900">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-6">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/assets")}
                className="rounded-full hover:bg-slate-100 h-10 w-10 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {asset.assetCode}
                  </h1>
                  {getStatusBadge(asset.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="h-4 w-4" />
                    {asset.brand} {asset.model}
                  </span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    SN: {asset.serialNo}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                onClick={() => router.push(`/assets/${asset.id}/edit`)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Edit Record
              </Button>
              <Button className="rounded-xl font-bold shadow-lg shadow-primary/20">
                Create Work Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm inline-flex h-14 w-full md:w-auto">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-8 font-bold data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-8 font-bold data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all"
            >
              <History className="h-4 w-4 mr-2" />
              Service History
              {workOrders.length > 0 && (
                <span className="ml-2 bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">
                  {workOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="contract"
              className="rounded-xl px-8 font-bold data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Contract Info
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus:outline-none outline-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Asset Identity Card */}
              <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                  <CardTitle className="text-lg font-bold">Registration Data</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    <DetailItem
                      label="Asset Category"
                      value={asset.categoryName}
                      icon={Settings2}
                      colorClass="text-primary"
                    />
                    <DetailItem
                      label="Registration Date"
                      value={new Date(asset.createdAt).toLocaleDateString()}
                      icon={Calendar}
                    />
                    <DetailItem
                      label="Installation Date"
                      value={
                        asset.installDate
                          ? new Date(asset.installDate).toLocaleDateString()
                          : "Pending Installation"
                      }
                      icon={Calendar}
                      colorClass="text-emerald-500"
                    />
                    <DetailItem
                      label="Warranty Status"
                      value={
                        asset.warrantyExpiry
                          ? `Expires ${new Date(asset.warrantyExpiry).toLocaleDateString()}`
                          : "No Active Warranty"
                      }
                      icon={ShieldCheck}
                      colorClass={
                        asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date()
                          ? "text-rose-500"
                          : "text-blue-500"
                      }
                    />
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 px-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Internal Notes
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl italic">
                      {asset.notes || "No technical notes registered for this unit."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account & Location Sidebar */}
              <div className="space-y-8">
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 px-6 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Customer / Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary border border-slate-200 font-black text-lg">
                        {asset.accountName?.[0] || "C"}
                      </div>
                      <div>
                        <p className="text-md font-bold text-slate-900 tracking-tight">
                          {asset.accountName || "Global Customer"}
                        </p>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary font-bold text-xs"
                          onClick={() => router.push(`/accounts/${asset.accountId}`)}
                        >
                          View Profile <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                          {asset.siteAddress || "Primary Billing Address"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow bg-slate-900 border-none text-white">
                  <CardContent className="p-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Assigned Engineer
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {asset.assignedEngineerName?.[0] || "E"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">
                          {asset.assignedEngineerName || "Unassigned"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">Service Technician</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="focus:outline-none outline-none">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-0">
                {workOrders.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Service History</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8">
                      This unit hasn't had any service calls or PM visits registered yet.
                    </p>
                    <Button variant="outline" className="rounded-xl font-bold">
                      Create First Service Call
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            WO Number
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Type
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Date
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Status
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {workOrders.map((wo) => (
                          <tr
                            key={wo.id}
                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                            onClick={() => router.push(`/work-orders/${wo.id}`)}
                          >
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 font-mono tracking-tight group-hover:text-primary">
                              {wo.woNumber}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase"
                              >
                                {wo.type.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {new Date(wo.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`rounded-lg text-[10px] font-bold uppercase ${wo.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {wo.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="focus:outline-none outline-none">
            <div className="max-w-3xl">
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-12 text-center bg-slate-50/50">
                  <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
                    Contract Protection
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    This asset is currently in its initial setup phase. Once linked to an active AMC
                    or Service Contract, its protection details, SLA metrics, and billing cycles
                    will appear here.
                  </p>
                  <Button
                    onClick={() => router.push("/contracts/new")}
                    className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
                  >
                    Link to New Contract
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
