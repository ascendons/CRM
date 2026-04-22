"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formsService, LandingPage, WebForm } from "@/lib/forms";

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [form, setForm] = useState<WebForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      formsService.getLandingPageBySlug(slug as string)
        .then(async landingPage => {
          setPage(landingPage);
          if (landingPage.formId) {
            try {
              // Use public form endpoint - no auth needed for rendering
              const f = await formsService.getFormById(landingPage.formId);
              setForm(f);
            } catch {}
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page?.formId) return;
    try {
      setSubmitting(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/forms/${page.formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responses),
      });
      setSubmitted(true);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This landing page does not exist or has been unpublished.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-500">{form?.thankYouMessage || "Your submission has been received."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-20 px-6 text-center">
        {page.heroImageUrl && (
          <img src={page.heroImageUrl} alt={page.title} className="w-full max-w-2xl mx-auto rounded-xl mb-8 object-cover max-h-64" />
        )}
        <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
        {page.heroText && <p className="text-xl text-blue-100 max-w-2xl mx-auto">{page.heroText}</p>}
        {!form && page.ctaText && (
          <a href="#form" className="inline-block mt-8 bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition">
            {page.ctaText}
          </a>
        )}
      </div>

      {/* Form Section */}
      {form && (
        <div id="form" className="max-w-lg mx-auto py-16 px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{page.ctaText || "Get Started"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {form.fields?.map(field => (
                <div key={field.fieldId}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "TEXTAREA" ? (
                    <textarea
                      rows={3}
                      required={field.required}
                      value={responses[field.fieldId || field.label] || ""}
                      onChange={e => setResponses(r => ({ ...r, [field.fieldId || field.label]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : field.type === "CHECKBOX" ? (
                    <input
                      type="checkbox"
                      required={field.required}
                      onChange={e => setResponses(r => ({ ...r, [field.fieldId || field.label]: e.target.checked ? "true" : "false" }))}
                      className="rounded"
                    />
                  ) : (
                    <input
                      type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                      required={field.required}
                      value={responses[field.fieldId || field.label] || ""}
                      onChange={e => setResponses(r => ({ ...r, [field.fieldId || field.label]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? "Submitting..." : page.ctaText || "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
