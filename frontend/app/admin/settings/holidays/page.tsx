"use client";

import { useEffect, useState } from "react";
import { holidaysApi, HolidayResponse, CreateHolidayRequest } from "@/lib/api/holidays";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function HolidaysManagementPage() {
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<CreateHolidayRequest>({
    date: "",
    name: "",
    description: "",
    type: "NATIONAL",
    isOptional: false,
  });

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysApi.getHolidaysByYear(selectedYear);
      setHolidays(data || []);
    } catch (error) {
      console.error("Failed to load holidays:", error);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingHoliday) {
        await holidaysApi.updateHoliday(editingHoliday.id, formData);
        toast.success("Holiday updated successfully!");
      } else {
        await holidaysApi.createHoliday(formData);
        toast.success("Holiday created successfully!");
      }
      loadHolidays();
      resetForm();
    } catch (error: any) {
      console.error("Failed to save holiday:", error);
      toast.error(error.message || "Failed to save holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (holidayId: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      await holidaysApi.deleteHoliday(holidayId);
      toast.success("Holiday deleted successfully!");
      loadHolidays();
    } catch (error: any) {
      console.error("Failed to delete holiday:", error);
      toast.error(error.message || "Failed to delete holiday");
    }
  };

  const handleEdit = (holiday: HolidayResponse) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      name: holiday.name,
      description: holiday.description || "",
      type: holiday.type as any,
      isOptional: holiday.isOptional,
      maxOptionalAllowed: holiday.maxOptionalAllowed,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: "",
      name: "",
      description: "",
      type: "NATIONAL",
      isOptional: false,
    });
    setEditingHoliday(null);
    setShowForm(false);
  };

  const addCommonHolidays = async () => {
    if (
      !confirm(
        `Add common holidays for ${selectedYear}? This will add Independence Day, Republic Day, Gandhi Jayanti, Diwali, and Holi.`
      )
    ) {
      return;
    }

    const commonHolidays: CreateHolidayRequest[] = [
      {
        date: `${selectedYear}-01-26`,
        name: "Republic Day",
        description: "Republic Day of India",
        type: "NATIONAL",
        isOptional: false,
      },
      {
        date: `${selectedYear}-08-15`,
        name: "Independence Day",
        description: "Independence Day of India",
        type: "NATIONAL",
        isOptional: false,
      },
      {
        date: `${selectedYear}-10-02`,
        name: "Gandhi Jayanti",
        description: "Birth anniversary of Mahatma Gandhi",
        type: "NATIONAL",
        isOptional: false,
      },
      {
        date: `${selectedYear}-12-25`,
        name: "Christmas",
        description: "Christmas Day",
        type: "NATIONAL",
        isOptional: false,
      },
    ];

    try {
      for (const holiday of commonHolidays) {
        await holidaysApi.createHoliday(holiday);
      }
      toast.success(`Added ${commonHolidays.length} common holidays!`);
      loadHolidays();
    } catch (error: any) {
      console.error("Failed to add common holidays:", error);
      toast.error("Failed to add some holidays");
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      NATIONAL: "bg-blue-100 text-blue-800",
      REGIONAL: "bg-green-100 text-green-800",
      OPTIONAL: "bg-yellow-100 text-yellow-800",
      COMPANY_SPECIFIC: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Filter holidays based on search
  const filteredHolidays = holidays.filter(
    (holiday) =>
      holiday.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holiday.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort holidays by date
  const sortedHolidays = [...filteredHolidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (loading && holidays.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Management</h1>
          <p className="text-gray-600 mt-1">Manage company holidays and observances</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/settings"
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Settings
          </Link>
          <button
            onClick={addCommonHolidays}
            className="px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Add Common Holidays
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "Add Holiday"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="text-sm text-gray-600">
            {sortedHolidays.length} {sortedHolidays.length === 1 ? "holiday" : "holidays"}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Independence Day"
                  minLength={3}
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the holiday"
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                  <option value="OPTIONAL">Optional Holiday</option>
                  <option value="COMPANY_SPECIFIC">Company Specific</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={formData.isOptional || false}
                  onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isOptional" className="ml-2 text-sm text-gray-700">
                  Optional Holiday (employees can choose to observe)
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? "Saving..." : editingHoliday ? "Update Holiday" : "Create Holiday"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holidays List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Holidays in {selectedYear}</h2>
        </div>

        {sortedHolidays.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl mb-4 block">🎉</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No holidays configured</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "No holidays match your search."
                : "Add holidays for this year to get started."}
            </p>
            {!searchQuery && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={addCommonHolidays}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add Common Holidays
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Add Custom Holiday
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedHolidays.map((holiday) => (
              <div key={holiday.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-3 min-w-[80px]">
                      <span className="text-xs font-medium text-blue-600 uppercase">
                        {getDayOfWeek(holiday.date)}
                      </span>
                      <span className="text-2xl font-bold text-blue-900">
                        {new Date(holiday.date).getDate()}
                      </span>
                      <span className="text-xs text-blue-600">
                        {new Date(holiday.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{holiday.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(holiday.type)}`}
                        >
                          {holiday.type.replace("_", " ")}
                        </span>
                        {holiday.isOptional && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{formatDate(holiday.date)}</p>
                      {holiday.description && (
                        <p className="text-sm text-gray-700 mt-2">{holiday.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
