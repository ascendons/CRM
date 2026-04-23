"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { esignatureApi } from "@/lib/esignature";
import { CheckCircle, XCircle, PenLine, Eraser } from "lucide-react";

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    loadRequest();
  }, [token]);

  const loadRequest = async () => {
    try {
      const data = await esignatureApi.getByToken(token);
      setRequest(data);
    } catch (e: any) {
      setError("This signature link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const handleSubmit = async () => {
    if (!hasSig || !canvasRef.current) return;
    const base64 = canvasRef.current.toDataURL("image/png");
    try {
      setSubmitting(true);
      await esignatureApi.submitSignature(token, base64);
      setSubmitted(true);
    } catch {
      setError("Failed to submit signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline signing this document?")) return;
    try {
      await esignatureApi.decline(token);
      setDeclined(true);
    } catch {
      setError("Failed to decline.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Signed</h2>
          <p className="text-gray-500">Your signature has been submitted successfully.</p>
        </div>
      </div>
    );

  if (declined)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Signature Declined</h2>
          <p className="text-gray-500">You have declined to sign this document.</p>
        </div>
      </div>
    );

  if (request?.status !== "PENDING")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <p className="text-gray-700">
            This signature request is {request?.status?.toLowerCase()}.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <PenLine className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Sign Document</h1>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm space-y-1">
            <p>
              <span className="font-medium">Document:</span> {request.documentType}
            </p>
            <p>
              <span className="font-medium">Signer:</span> {request.signerName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {request.signerEmail}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Draw your signature below</label>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={450}
              height={150}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!hasSig || submitting}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Sign Document"}
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
