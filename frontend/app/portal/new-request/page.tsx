"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceRequestSource, Asset } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Send,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Laptop,
  MessageSquare,
  Globe,
  Loader2,
  HeadphonesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CustomerPortalPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const [formData, setFormData] = useState({
    source: ServiceRequestSource.PORTAL,
    accountId: "PUBLIC_DEMO", // In a real app, this would be derived from the portal URL/Auth
    contactId: "",
    assetId: "",
    description: "",
    priority: "MEDIUM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For the public portal, we might use a special "anonymous" or "portal" endpoint
      // but here we'll use the existing create method for demo purposes
      const sr = await fieldService.createServiceRequest(formData);
      setTicketId(sr.srNumber);
      setSubmitted(true);
      showToast.success("Complaint registered successfully");
    } catch (err) {
      showToast.error("Registration failure. Please try again or call support.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full rounded-[3rem] border-none shadow-2xl bg-white p-12 text-center animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-100/50">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">
            Ticket Registered
          </h2>
          <p className="text-slate-500 font-bold mb-8 text-lg">
            Your complaint has been logged under ID:{" "}
            <span className="text-indigo-600 underline decoration-indigo-200 decoration-4 underline-offset-4">
              {ticketId}
            </span>
          </p>
          <div className="bg-slate-50 rounded-3xl p-6 text-sm font-medium text-slate-600 mb-10 leading-relaxed border border-slate-100">
            Our technical team has been notified. You will receive an email confirmation with
            tracking details shortly.
          </div>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="rounded-2xl h-14 px-10 font-black border-2 border-slate-100"
          >
            Submit Another Request
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Branding Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 shadow-lg shadow-indigo-600/30 rounded-xl flex items-center justify-center text-white">
              <HeadphonesIcon className="h-6 w-6" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">
              Service<span className="text-indigo-600">Portal</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 font-bold uppercase tracking-widest">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Support Systems Online
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase italic leading-none">
            Log a Technical Issue
          </h1>
          <p className="text-slate-400 font-bold text-lg max-w-lg mx-auto leading-relaxed">
            Describe the equipment problem you're experiencing and our field force will mobilize in
            accordance with your SLA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white p-6 overflow-hidden overflow-visible">
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Customer Identifier / Account
                  </Label>
                  <Input
                    placeholder="Enter Account Name or ID"
                    className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-6 text-md font-bold focus:ring-0 focus:border-indigo-600 transition-all"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Equipment Serial No
                  </Label>
                  <Input
                    placeholder="e.g. SN-8829-X"
                    className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-6 text-md font-bold focus:ring-0 focus:border-indigo-600 transition-all"
                    name="assetId"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Detailed Description of Defect *
                </Label>
                <textarea
                  required
                  name="description"
                  onChange={handleChange}
                  rows={6}
                  placeholder="What's not working? Is there an error code? When did it start?"
                  className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50/50 p-8 text-md font-medium text-slate-900 focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-20 rounded-[2.5rem] font-black text-xl tracking-tight shadow-2xl shadow-indigo-600/30 bg-indigo-600 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Send className="h-7 w-7" />
                  )}
                  {loading ? "Mobilizing Forces..." : "Submit Support Request"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-slate-400 pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                SLA Protected Channel
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Global Field Dispatch
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-300" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                24/7 Intake Sync
              </span>
            </div>
          </div>
        </form>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">
          Powered by Ultron Field Systems
        </p>
        <div className="h-[1px] w-12 bg-slate-200 mx-auto"></div>
      </footer>
    </div>
  );
}
