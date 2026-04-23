"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  WorkOrder,
  Checklist,
  ChecklistResponse,
  ChecklistItemStatus,
  ChecklistItemResponse,
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Camera,
  MessageSquare,
  Save,
  Loader2,
  ListChecks,
  Info,
  ChevronRight,
  ShieldCheck,
  Ban,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkOrderChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [template, setTemplate] = useState<Checklist | null>(null);
  const [response, setResponse] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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

      if (!orderData.checklistTemplateId) {
        showToast.error("No checklist template assigned to this work order");
        router.back();
        return;
      }

      const templateData = await fieldService.getChecklistTemplateById(
        orderData.checklistTemplateId
      );
      setTemplate(templateData);

      // Try to load existing response
      try {
        const responseData = await fieldService.getChecklistResponse(id);
        if (responseData) {
          setResponse(responseData);
          setIsCompleted(!!responseData.completedAt);
        } else {
          await startNewChecklist(orderData);
        }
      } catch (err) {
        await startNewChecklist(orderData);
      }
    } catch (err) {
      console.error("Failed to load checklist data:", err);
      showToast.error("Failed to load checklist");
    } finally {
      setLoading(false);
    }
  };

  const startNewChecklist = async (orderData: WorkOrder) => {
    try {
      const newResponse = await fieldService.startChecklist(id, {
        templateId: orderData.checklistTemplateId!,
        engineerId: orderData.assignedEngineerIds?.[0] || "",
      });
      setResponse(newResponse);
    } catch (err) {
      console.error("Failed to start checklist:", err);
      showToast.error("Failed to initialize checklist responses");
    }
  };

  const handleItemUpdate = (itemCode: string, updates: Partial<ChecklistItemResponse>) => {
    if (!response || isCompleted) return;

    const newResponses = [...(response.responses || [])];
    const index = newResponses.findIndex((r) => r.itemCode === itemCode);

    if (index >= 0) {
      newResponses[index] = { ...newResponses[index], ...updates };
    } else {
      newResponses.push({
        itemCode,
        status: updates.status || ChecklistItemStatus.OBSERVED,
        ...updates,
      });
    }

    setResponse({ ...response, responses: newResponses });
  };

  const saveChecklist = async (complete: boolean = false) => {
    if (!response) return;

    setSaving(true);
    try {
      await fieldService.saveChecklistResponses(id, response.responses || []);
      if (complete) {
        await fieldService.completeChecklist(id);
        setIsCompleted(true);
        showToast.success("Checklist submitted and locked");
        router.push(`/work-orders/${id}`);
      } else {
        showToast.success("Progress saved locally");
      }
    } catch (err) {
      showToast.error("Failed to sync with server");
    } finally {
      setSaving(false);
    }
  };

  const currentResponse = (itemCode: string) => {
    return response?.responses?.find((r) => r.itemCode === itemCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Syncing inspection logs...</p>
        </div>
      </div>
    );
  }

  if (!template || !order) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Mobile-Friendly Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full h-10 w-10 hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase line-clamp-1">
                  {template.name}
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {order.woNumber} • Inspection
                </p>
              </div>
            </div>

            {!isCompleted && (
              <Button
                onClick={() => saveChecklist(false)}
                disabled={saving}
                variant="outline"
                className="rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest border-2 border-slate-100"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                Save
              </Button>
            )}

            {isCompleted && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 py-1.5 px-4 rounded-xl uppercase text-[10px] font-black tracking-widest border-2">
                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                Locked
              </Badge>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className="border-white/20 text-white/60 font-black uppercase text-[9px] tracking-[0.2em] rounded-lg"
                >
                  {template.jobType}
                </Badge>
              </div>
              <h2 className="text-xl font-black tracking-tight mb-2 uppercase italic">
                Safety & Compliance Protocol
              </h2>
              <p className="text-sm font-medium text-white/60 leading-relaxed max-w-md">
                Perform each step meticulously. Field data is audited for compliance and quality
                assurance.
              </p>
            </CardContent>
          </Card>

          {/* Checklist Items */}
          <div className="space-y-5">
            {template.items.map((item, index) => {
              const res = currentResponse(item.itemCode);
              return (
                <Card
                  key={item.itemCode}
                  className={`rounded-[2rem] border-none shadow-lg transition-all duration-300 bg-white ${isCompleted ? "opacity-80" : "hover:shadow-2xl"}`}
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-shrink-0 flex items-start gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 font-black text-sm border border-slate-200">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-md font-black text-slate-900 tracking-tight leading-tight uppercase">
                              {item.description}
                            </h4>
                            {item.isMandatory && (
                              <span className="text-rose-500 font-black text-lg leading-none mt-1">
                                *
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {item.itemCode}
                          </p>
                        </div>
                      </div>

                      <div className="sm:ml-auto w-full sm:w-auto flex flex-col gap-4">
                        {/* Input Selector */}
                        {item.inputType === "PASS_FAIL" ? (
                          <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] border-2 border-slate-50 gap-1">
                            <button
                              type="button"
                              disabled={isCompleted}
                              onClick={() =>
                                handleItemUpdate(item.itemCode, {
                                  status: ChecklistItemStatus.PASS,
                                })
                              }
                              className={`flex-1 h-11 px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                res?.status === ChecklistItemStatus.PASS
                                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                  : "bg-transparent text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Pass
                            </button>
                            <button
                              type="button"
                              disabled={isCompleted}
                              onClick={() =>
                                handleItemUpdate(item.itemCode, {
                                  status: ChecklistItemStatus.FAIL,
                                })
                              }
                              className={`flex-1 h-11 px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                res?.status === ChecklistItemStatus.FAIL
                                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                  : "bg-transparent text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Fail
                            </button>
                          </div>
                        ) : (
                          <Input
                            placeholder={item.inputType === "NUMERIC" ? "0.00" : "Observations..."}
                            type={item.inputType === "NUMERIC" ? "number" : "text"}
                            disabled={isCompleted}
                            value={res?.value || ""}
                            onChange={(e) =>
                              handleItemUpdate(item.itemCode, { value: e.target.value })
                            }
                            className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold px-5 focus:ring-primary/20 focus:border-primary"
                          />
                        )}
                      </div>
                    </div>

                    {/* Footer Section for Photo/Notes */}
                    <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap gap-4">
                      <button
                        type="button"
                        disabled={isCompleted}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Evidence
                        </span>
                      </button>
                      <div className="flex-1 relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                        <input
                          placeholder="Add situational note..."
                          disabled={isCompleted}
                          value={res?.note || ""}
                          onChange={(e) =>
                            handleItemUpdate(item.itemCode, { note: e.target.value })
                          }
                          className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium pl-10 text-slate-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!isCompleted && (
            <div className="pt-10">
              <Button
                onClick={() => saveChecklist(true)}
                disabled={saving}
                className="w-full h-16 rounded-[2rem] font-black text-lg tracking-tight shadow-2xl shadow-primary/25 bg-slate-900 hover:bg-slate-950 transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 mr-3" />
                )}
                Submit Inspection Record
              </Button>
              <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-10 leading-relaxed italic">
                By submitting, you certify that all safety checks were performed according to
                protocol and standard operating procedures.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
