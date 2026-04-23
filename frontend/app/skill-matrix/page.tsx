"use client";

import { useState, useCallback } from "react";
import {
  Award,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import {
  dispatchService,
  TechnicianSkill,
  TrainingRecord,
  CreateSkillRequest,
  CreateTrainingRequest,
} from "@/lib/dispatch";
import { showToast } from "@/lib/toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function proficiencyBadge(level: TechnicianSkill["proficiencyLevel"]) {
  const map = {
    TRAINEE: "bg-slate-100 text-slate-600",
    COMPETENT: "bg-blue-100 text-blue-700",
    EXPERT: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[level] ?? "bg-slate-100 text-slate-600"}`}
    >
      {level}
    </span>
  );
}

function trainingTypeBadge(type: TrainingRecord["trainingType"]) {
  const map = {
    INTERNAL: "bg-slate-100 text-slate-600",
    EXTERNAL: "bg-blue-100 text-blue-700",
    OEM: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[type] ?? "bg-slate-100 text-slate-600"}`}
    >
      {type}
    </span>
  );
}

function fmt(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

// ─── Add Skill Modal ──────────────────────────────────────────────────────────

interface AddSkillModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddSkillModal({ userId, onClose, onSuccess }: AddSkillModalProps) {
  const [form, setForm] = useState<Omit<CreateSkillRequest, "userId">>({
    skillName: "",
    certificationBody: "",
    certNumber: "",
    issueDate: "",
    expiryDate: "",
    proficiencyLevel: "COMPETENT",
  });
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.skillName.trim()) {
      showToast.error("Skill name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await dispatchService.addSkill({ ...form, userId });
      showToast.success("Skill added successfully.");
      onSuccess();
    } catch {
      showToast.error("Failed to add skill.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Add Skill</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.skillName}
              onChange={(e) => setField("skillName", e.target.value)}
              placeholder="e.g. HVAC Installation"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Certification Body
            </label>
            <input
              value={form.certificationBody}
              onChange={(e) => setField("certificationBody", e.target.value)}
              placeholder="e.g. ASHRAE"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cert Number</label>
            <input
              value={form.certNumber}
              onChange={(e) => setField("certNumber", e.target.value)}
              placeholder="e.g. CERT-12345"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setField("issueDate", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setField("expiryDate", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Proficiency Level
            </label>
            <select
              value={form.proficiencyLevel}
              onChange={(e) =>
                setField("proficiencyLevel", e.target.value as TechnicianSkill["proficiencyLevel"])
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TRAINEE">Trainee</option>
              <option value="COMPETENT">Competent</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Skill
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Training Modal ───────────────────────────────────────────────────────

interface AddTrainingModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddTrainingModal({ userId, onClose, onSuccess }: AddTrainingModalProps) {
  const [form, setForm] = useState<Omit<CreateTrainingRequest, "userId">>({
    trainingName: "",
    trainingType: "INTERNAL",
    completedDate: "",
    trainerName: "",
    score: 0,
    passed: false,
  });
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.trainingName.trim()) {
      showToast.error("Training name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await dispatchService.addTraining({ ...form, userId });
      showToast.success("Training record added.");
      onSuccess();
    } catch {
      showToast.error("Failed to add training record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Add Training Record</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Training Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.trainingName}
              onChange={(e) => setField("trainingName", e.target.value)}
              placeholder="e.g. Refrigerant Handling Certification"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Training Type</label>
            <select
              value={form.trainingType}
              onChange={(e) =>
                setField("trainingType", e.target.value as TrainingRecord["trainingType"])
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
              <option value="OEM">OEM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Completed Date</label>
            <input
              type="date"
              value={form.completedDate}
              onChange={(e) => setField("completedDate", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trainer Name</label>
            <input
              value={form.trainerName}
              onChange={(e) => setField("trainerName", e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.score}
              onChange={(e) => setField("score", Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="passed"
              checked={form.passed}
              onChange={(e) => setField("passed", e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="passed" className="text-sm font-medium text-slate-700">
              Passed
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkillMatrixPage() {
  const [userId, setUserId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<"skills" | "training">("skills");
  const [skills, setSkills] = useState<TechnicianSkill[]>([]);
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        dispatchService.getSkills(uid),
        dispatchService.getTraining(uid),
      ]);
      setSkills(s || []);
      setTraining(t || []);
    } catch {
      showToast.error("Failed to load skill matrix data.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      showToast.error("Please enter a User ID.");
      return;
    }
    setUserId(trimmed);
    loadData(trimmed);
  }

  async function handleDeleteSkill(id: string) {
    setDeletingId(id);
    try {
      await dispatchService.deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      showToast.success("Skill removed.");
    } catch {
      showToast.error("Failed to remove skill.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">Skill Matrix</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage technician skills and training records
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* User ID Search */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Search by User ID</label>
          <div className="flex gap-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter User ID to view skills and training..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Search size={15} />
              Search
            </button>
          </div>
        </div>

        {!userId ? (
          <div className="bg-white rounded-xl border border-slate-100 p-16 flex flex-col items-center text-slate-400">
            <Award size={48} className="mb-4 opacity-30" />
            <p className="text-sm">Enter a User ID above to view their skill matrix</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab("skills")}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "skills"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Award size={15} />
                Skills
                <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {skills.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("training")}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "training"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <BookOpen size={15} />
                Training Records
                <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {training.length}
                </span>
              </button>
            </div>

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                  <p className="text-sm text-slate-500">
                    Showing skills for user:{" "}
                    <span className="font-mono font-medium text-slate-700">{userId}</span>
                  </p>
                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
                  >
                    <Plus size={13} />
                    Add Skill
                  </button>
                </div>
                {skills.length === 0 ? (
                  <div className="p-12 flex flex-col items-center text-slate-400">
                    <Award size={36} className="mb-3 opacity-30" />
                    <p className="text-sm">No skills found for this user</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left">
                        <tr>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Skill
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Cert Body
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Cert #
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Issue Date
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Expiry Date
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Level
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {skills.map((skill) => (
                          <tr key={skill.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-medium text-slate-800">
                              {skill.skillName}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {skill.certificationBody || "—"}
                            </td>
                            <td className="px-5 py-3 font-mono text-slate-600 text-xs">
                              {skill.certNumber || "—"}
                            </td>
                            <td className="px-5 py-3 text-slate-600">{fmt(skill.issueDate)}</td>
                            <td className="px-5 py-3 text-slate-600">{fmt(skill.expiryDate)}</td>
                            <td className="px-5 py-3">
                              {proficiencyBadge(skill.proficiencyLevel)}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                disabled={deletingId === skill.id}
                                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                              >
                                {deletingId === skill.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Training Tab */}
            {activeTab === "training" && (
              <div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                  <p className="text-sm text-slate-500">
                    Showing training for user:{" "}
                    <span className="font-mono font-medium text-slate-700">{userId}</span>
                  </p>
                  <button
                    onClick={() => setShowAddTraining(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
                  >
                    <Plus size={13} />
                    Add Training Record
                  </button>
                </div>
                {training.length === 0 ? (
                  <div className="p-12 flex flex-col items-center text-slate-400">
                    <BookOpen size={36} className="mb-3 opacity-30" />
                    <p className="text-sm">No training records found for this user</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left">
                        <tr>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Training Name
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Type
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Completed
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Trainer
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Score
                          </th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Passed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {training.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-medium text-slate-800">
                              {rec.trainingName}
                            </td>
                            <td className="px-5 py-3">{trainingTypeBadge(rec.trainingType)}</td>
                            <td className="px-5 py-3 text-slate-600">{fmt(rec.completedDate)}</td>
                            <td className="px-5 py-3 text-slate-600">{rec.trainerName || "—"}</td>
                            <td className="px-5 py-3 text-slate-600">{rec.score ?? "—"}</td>
                            <td className="px-5 py-3">
                              {rec.passed ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-red-400" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddSkill && (
        <AddSkillModal
          userId={userId}
          onClose={() => setShowAddSkill(false)}
          onSuccess={() => {
            setShowAddSkill(false);
            loadData(userId);
          }}
        />
      )}
      {showAddTraining && (
        <AddTrainingModal
          userId={userId}
          onClose={() => setShowAddTraining(false)}
          onSuccess={() => {
            setShowAddTraining(false);
            loadData(userId);
          }}
        />
      )}
    </div>
  );
}
