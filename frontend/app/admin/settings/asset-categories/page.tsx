"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AssetCategory, AssetCategoryType } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { 
  ChevronLeft, 
  Plus, 
  Settings2, 
  Trash2, 
  Search,
  Wrench,
  Package,
  CheckCircle2,
  X,
  Loader2,
  Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmModal from "@/components/ConfirmModal";
import { Label } from "@/components/ui/label";

export default function AssetCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AssetCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<AssetCategory>>({
    name: "",
    description: "",
    type: AssetCategoryType.EQUIPMENT,
    maintenanceIntervalDays: 90,
    requiredSkills: []
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fieldService.getAllAssetCategories();
      setCategories(data);
    } catch (err) {
      showToast.error("Failed to load asset categories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: AssetCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        type: category.type,
        maintenanceIntervalDays: category.maintenanceIntervalDays,
        requiredSkills: category.requiredSkills
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        type: AssetCategoryType.EQUIPMENT,
        maintenanceIntervalDays: 90,
        requiredSkills: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await fieldService.updateAssetCategory(editingCategory.id, formData);
        showToast.success("Category updated successfully");
      } else {
        await fieldService.createAssetCategory(formData);
        showToast.success("Category created successfully");
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      showToast.error("Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (category: AssetCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsSubmitting(true);
      await fieldService.deleteAssetCategory(categoryToDelete.id);
      showToast.success("Category deleted successfully");
      setShowDeleteModal(false);
      loadCategories();
    } catch (err) {
      showToast.error("Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (type: AssetCategoryType) => {
    switch (type) {
      case AssetCategoryType.EQUIPMENT: return <Wrench className="h-4 w-4" />;
      case AssetCategoryType.SPARE_PART: return <Package className="h-4 w-4" />;
      case AssetCategoryType.CONSUMABLE: return <Boxes className="h-4 w-4" />;
      default: return <Settings2 className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (type: AssetCategoryType) => {
    switch (type) {
      case AssetCategoryType.EQUIPMENT: return "bg-blue-50 text-blue-700 border-blue-100";
      case AssetCategoryType.SPARE_PART: return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case AssetCategoryType.CONSUMABLE: return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full h-10 w-10 hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Asset Categories</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">System Settings</p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenModal()}
              className="rounded-xl font-bold shadow-lg shadow-primary/20 px-6 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl border-slate-200 bg-white h-12 shadow-sm focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-2xl border border-slate-200 shadow-sm text-sm font-bold text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {categories.length} Total Categories
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="rounded-[2.5rem] border-dashed border-2 bg-slate-50/50 p-20 text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-white rounded-[2rem] shadow-md flex items-center justify-center mb-6">
               <Settings2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Categories Found</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-8">Asset categories help you organize equipment and define standard maintenance checklists.</p>
            <Button onClick={() => handleOpenModal()} className="rounded-2xl px-8 py-6 h-auto font-bold shadow-xl shadow-primary/20">
              Create First Category
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="group rounded-[2.5rem] border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default border-2 hover:border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-3xl ${getCategoryColor(category.type)} shadow-sm`}>
                      {getCategoryIcon(category.type)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(category)} className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-600">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(category)} className="h-10 w-10 rounded-xl hover:bg-rose-50 text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 uppercase">{category.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 font-medium mb-6 min-h-[40px] leading-relaxed">
                    {category.description || "No description provided for this category."}
                  </p>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                     <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <span>Maintenance Interval</span>
                        <span className="text-slate-900">{category.maintenanceIntervalDays} Days</span>
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                        {category.requiredSkills.length > 0 ? (
                           category.requiredSkills.map(skill => (
                              <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 rounded-lg text-[10px] font-bold px-2.5 py-1 uppercase tracking-tight">
                                 {skill}
                              </Badge>
                           ))
                        ) : (
                           <span className="text-[10px] text-slate-400 font-bold uppercase italic">No Skills Required</span>
                        )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Slide-over or Modal for Category Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
                    <Settings2 className="h-5 w-5" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">
                   {editingCategory ? "Update Category" : "New Asset Category"}
                 </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-slate-500">Category Name *</Label>
                       <Input 
                         id="name"
                         placeholder="e.g. HVAC, UPS" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         required
                         className="rounded-2xl border-slate-200 h-12 font-bold focus:ring-primary/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="type" className="text-[11px] font-black uppercase tracking-widest text-slate-500">Asset Type *</Label>
                       <select 
                         id="type"
                         value={formData.type}
                         onChange={(e) => setFormData({...formData, type: e.target.value as AssetCategoryType})}
                         className="w-full h-12 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none text-slate-900"
                        >
                          {Object.values(AssetCategoryType).map(type => (
                            <option key={type} value={type}>{type.replace('_', ' ')}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest text-slate-500">Technical Description</Label>
                    <textarea 
                      id="description"
                      rows={3}
                      placeholder="Brief overview of the assets in this category..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all bg-slate-50/50"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label htmlFor="interval" className="text-[11px] font-black uppercase tracking-widest text-slate-500">Maint. Interval (Days)</Label>
                       <Input 
                         id="interval"
                         type="number"
                         value={formData.maintenanceIntervalDays}
                         onChange={(e) => setFormData({...formData, maintenanceIntervalDays: parseInt(e.target.value)})}
                         className="rounded-2xl border-slate-200 h-12 font-bold focus:ring-primary/20 bg-slate-50/50"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="skills" className="text-[11px] font-black uppercase tracking-widest text-slate-500 font-bold">Skills Required (Comma separated)</Label>
                       <Input 
                         id="skills"
                         placeholder="Electrical, HVAC-Expert..." 
                         value={formData.requiredSkills?.join(", ")}
                         onChange={(e) => setFormData({...formData, requiredSkills: e.target.value.split(",").map(s => s.trim()).filter(s => s)})}
                         className="rounded-2xl border-slate-200 h-12 font-bold focus:ring-primary/20 bg-slate-50/50"
                       />
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button 
                   type="button"
                   variant="outline" 
                   onClick={() => setShowModal(false)}
                   className="flex-1 rounded-[1.25rem] h-14 font-black tracking-tight border-2 border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
                   disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                   type="submit"
                   className="flex-[2] rounded-[1.25rem] h-14 font-black tracking-tight shadow-xl shadow-primary/25 active:scale-95 transition-all"
                   disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />}
                  {editingCategory ? "Update Configuration" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        title="Destroy Category Mapping?"
        message={`This will permanently remove the "${categoryToDelete?.name}" category. Existing assets will lose their classification linkage. This action is irreversible.`}
        confirmLabel="Destroy Mapping"
        cancelLabel="Abort Action"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isSubmitting}
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-12 px-6 font-bold"
      />
    </div>
  );
}
