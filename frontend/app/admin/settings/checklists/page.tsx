"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Checklist, 
  ChecklistItem, 
  WorkOrderType,
  AssetCategory
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  ListChecks, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Inbox,
  LayoutGrid,
  ShieldCheck,
  Info,
  X,
  GripVertical,
  Settings2,
  Save,
  Ban,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ChecklistManagementPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Checklist[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Partial<Checklist> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const [templatesData, categoriesData] = await Promise.all([
        fieldService.getAllChecklistTemplates(),
        fieldService.getAllAssetCategories()
      ]);
      setTemplates(templatesData);
      setAssetCategories(categoriesData);
    } catch (err) {
      showToast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate({
      name: "",
      assetCategoryId: "",
      jobType: WorkOrderType.PREVENTIVE_MAINTENANCE,
      items: []
    });
  };

  const handleEdit = (template: Checklist) => {
    setEditingTemplate({ ...template });
  };

  const handleAddItem = () => {
    if (!editingTemplate) return;
    const newItem: ChecklistItem = {
      itemCode: `ITEM-${(editingTemplate.items?.length || 0) + 1}`,
      description: "",
      inputType: 'PASS_FAIL',
      isMandatory: true,
      failureAction: 'BLOCK'
    };
    setEditingTemplate({
      ...editingTemplate,
      items: [...(editingTemplate.items || []), newItem]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingTemplate || !editingTemplate.items) return;
    const newItems = [...editingTemplate.items];
    newItems.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, items: newItems });
  };

  const handleItemChange = (index: number, updates: Partial<ChecklistItem>) => {
    if (!editingTemplate || !editingTemplate.items) return;
    const newItems = [...editingTemplate.items];
    newItems[index] = { ...newItems[index], ...updates };
    setEditingTemplate({ ...editingTemplate, items: newItems });
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setIsSubmitting(true);
    try {
      if (editingTemplate.id) {
        await fieldService.updateChecklistTemplate(editingTemplate.id, editingTemplate);
        showToast.success("Protocol updated");
      } else {
        await fieldService.createChecklistTemplate(editingTemplate);
        showToast.success("New protocol released");
      }
      setEditingTemplate(null);
      loadData();
    } catch (err) {
      showToast.error("Failed to save protocol");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirm decommissioning of this protocol? This will not affect existing work records.")) return;
    try {
      await fieldService.deleteChecklistTemplate(id);
      showToast.success("Protocol decommissioned");
      loadData();
    } catch (err) {
      showToast.error("Failed to delete protocol");
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
           <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
           <p className="text-slate-500 font-medium tracking-tight">Syncing compliance registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/admin/settings")}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Protocols</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-1">Checklist Template Management</p>
              </div>
            </div>
            
            <Button 
              onClick={handleCreate}
              className="rounded-2xl h-11 px-6 font-black shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Define New Protocol
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 gap-8">
           {/* Filters */}
           <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="relative w-full lg:max-w-lg">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search protocols by name..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-11 h-12 rounded-2xl border-none shadow-sm bg-white focus:ring-primary/20"
                 />
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
                 <ListChecks className="h-4 w-4 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-tighter text-slate-950">{templates.length} Protocols Loaded</span>
              </div>
           </div>

           {/* Grid of Templates */}
           {filteredTemplates.length === 0 ? (
             <div className="bg-white rounded-[3rem] p-32 text-center shadow-xl border-2 border-dashed border-slate-100 flex flex-col items-center">
                <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8">
                   <Inbox className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">No Protocols Found</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">Define your service standards by creating checklist templates for different equipment categories.</p>
                <Button onClick={handleCreate} className="rounded-[2rem] h-14 px-10 font-black shadow-2xl shadow-primary/20">
                   Create First Protocol
                </Button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(t => (
                  <Card key={t.id} className="rounded-[2.5rem] border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group overflow-hidden">
                     <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                           <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                              <ShieldCheck className="h-6 w-6" />
                           </div>
                           <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-9 w-9 rounded-xl hover:bg-slate-100">
                                 <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-9 w-9 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{t.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 For {assetCategories.find(c => c.id === t.assetCategoryId)?.name || "All Equipment"}
                              </p>
                           </div>

                           <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                              <Badge className="bg-slate-900 text-white rounded-lg text-[10px] font-black p-2">{t.jobType}</Badge>
                              <Badge variant="outline" className="rounded-lg text-[10px] font-black p-2 border-slate-200 text-slate-500">{t.items?.length || 0} Steps</Badge>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
           )}
        </div>
      </main>

      {/* Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-white flex flex-col">
              <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                       <Settings2 className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Protocol Editor</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{editingTemplate.id ? 'Modify Existing Standard' : 'Establish New Standard'}</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingTemplate(null)} className="h-12 w-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <X className="h-6 w-6 text-slate-300" />
                 </button>
              </div>

              <form onSubmit={saveTemplate} className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-8 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Protocol Display Name *</Label>
                       <Input 
                         value={editingTemplate.name}
                         onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                         required
                         placeholder="e.g. Laser Printer Q3 Maintenance"
                         className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0 focus:border-primary px-4"
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Equipment Category</Label>
                       <select 
                         value={editingTemplate.assetCategoryId}
                         onChange={(e) => setEditingTemplate({...editingTemplate, assetCategoryId: e.target.value})}
                         className="w-full h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 px-4 text-sm font-bold focus:outline-none focus:border-primary appearance-none transition-all"
                       >
                          <option value="">Across All Categories</option>
                          {assetCategories.map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Triggering Job Type</Label>
                       <select 
                         value={editingTemplate.jobType}
                         onChange={(e) => setEditingTemplate({...editingTemplate, jobType: e.target.value as any})}
                         className="w-full h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 px-4 text-sm font-bold focus:outline-none focus:border-primary appearance-none transition-all"
                       >
                          {Object.values(WorkOrderType).map(t => (
                             <option key={t} value={t}>{t.replace('_', ' ')}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                       <Label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-primary" />
                          Inspection Sequence
                       </Label>
                       <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl h-9 px-4 font-black text-[10px] uppercase border-2 border-slate-100 hover:bg-slate-50">
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Add Step
                       </Button>
                    </div>

                    <div className="space-y-4">
                       {editingTemplate.items?.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 flex items-start gap-4 animate-in slide-in-from-right-4">
                             <div className="flex-shrink-0 pt-2">
                                <GripVertical className="h-5 w-5 text-slate-300" />
                             </div>
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-5 space-y-2">
                                   <Label className="text-[9px] font-black text-slate-400 uppercase">Instruction / Criterion</Label>
                                   <Input 
                                      value={item.description}
                                      onChange={(e) => handleItemChange(idx, { description: e.target.value })}
                                      className="h-10 rounded-lg border-none shadow-sm bg-white font-medium text-xs"
                                      placeholder="e.g. Check optical sensor for debris"
                                   />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                   <Label className="text-[9px] font-black text-slate-400 uppercase">Response Type</Label>
                                   <select
                                      value={item.inputType}
                                      onChange={(e) => handleItemChange(idx, { inputType: e.target.value as any })}
                                      className="w-full h-10 rounded-lg border-none shadow-sm bg-white text-[11px] font-bold px-3 focus:outline-none"
                                   >
                                      <option value="PASS_FAIL">Pass / Fail</option>
                                      <option value="TEXT">Descriptive Text</option>
                                      <option value="NUMERIC">Numeric Value</option>
                                   </select>
                                </div>
                                <div className="md:col-span-2 space-y-2 pt-8">
                                   <label className="flex items-center gap-3 cursor-pointer group">
                                      <div className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${item.isMandatory ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                                         {item.isMandatory && <Plus className="h-3.5 w-3.5 text-white rotate-45" />}
                                      </div>
                                      <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={item.isMandatory} 
                                        onChange={(e) => handleItemChange(idx, { isMandatory: e.target.checked })} 
                                      />
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Required</span>
                                   </label>
                                </div>
                                <div className="md:col-span-2 flex justify-end pt-6">
                                   <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                             </div>
                          </div>
                       ))}
                       
                       {(!editingTemplate.items || editingTemplate.items.length === 0) && (
                          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No inspection steps defined yet.</p>
                          </div>
                       )}
                    </div>
                 </div>
              </form>

              <div className="p-10 border-t border-slate-50 flex items-center justify-end gap-4 bg-slate-50/50">
                 <Button variant="ghost" onClick={() => setEditingTemplate(null)} className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest text-slate-400">
                    Discard Changes
                 </Button>
                 <Button 
                   onClick={saveTemplate}
                   disabled={isSubmitting}
                   className="rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 bg-slate-900 border-none"
                 >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Relase Standard
                 </Button>
              </div>
           </div>
        </div>
      )}

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
