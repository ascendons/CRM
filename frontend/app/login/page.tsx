"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Interactive gradient follows mouse
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (leftPanelRef.current) {
      const rect = leftPanelRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    try {
      await authService.login(formData);
      window.location.href = "/dashboard";
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          setFieldErrors(err.errors);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        [e.target.name]: "",
      });
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/30">

      {/* ===== LEFT PANEL: Interactive Brand Showcase ===== */}
      <div
        ref={leftPanelRef}
        onMouseMove={handleMouseMove}
        className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden cursor-default"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(6,182,212,0.12) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(14,165,233,0.08) 0%, transparent 40%),
            linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 30%, #ecfeff 60%, #f8fafc 100%)
          `,
          transition: 'background 0.3s ease',
        }}
      >
        {/* Animated gradient mesh blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[450px] h-[450px] rounded-full opacity-25 animate-blob-1"
            style={{ background: 'radial-gradient(circle, #67e8f9 0%, transparent 70%)', filter: 'blur(80px)', top: '10%', left: '10%' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-20 animate-blob-2"
            style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', filter: 'blur(80px)', bottom: '10%', right: '5%' }} />
          <div className="absolute w-[350px] h-[350px] rounded-full opacity-15 animate-blob-3"
            style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)', filter: 'blur(60px)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* Interactive mouse-follow spotlight */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            background: `radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)`,
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #0891b2 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Main content */}
        <div className={`relative z-10 text-center max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Logo with glow effect */}
          <div className="relative mx-auto w-44 h-44 mb-8">
            {/* Glowing rings */}
            <div className="absolute inset-[-20px] rounded-full border-2 border-cyan-300/10 animate-logo-ring-1" />
            <div className="absolute inset-[-40px] rounded-full border border-cyan-300/5 animate-logo-ring-2" />

            {/* Glow behind logo */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 60%)', filter: 'blur(25px)' }} />

            {/* Actual Logo Image */}
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center animate-logo-float">
              <Image
                src="/ascendons-logo.png"
                alt="Ascendons Logo"
                width={176}
                height={176}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-5xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              Ascendons
            </span>
            <span className="text-slate-600 font-light ml-2">CRM</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-400/40" />
            <p className="text-cyan-600/40 text-sm font-medium tracking-[0.25em] uppercase">
              Enterprise Edition
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-400/40" />
          </div>

          {/* Feature cards with hover gradients */}
          <div className="space-y-3 text-left">
            {[
              { icon: "🚀", title: "Accelerate Growth", desc: "Streamline your sales pipeline end-to-end", gradient: "from-cyan-50 to-sky-50", border: "hover:border-cyan-300", glow: "group-hover:shadow-cyan-100/50" },
              { icon: "🔒", title: "Enterprise Security", desc: "Role-based access with granular permissions", gradient: "from-violet-50 to-indigo-50", border: "hover:border-violet-300", glow: "group-hover:shadow-violet-100/50" },
              { icon: "📊", title: "Real-Time Analytics", desc: "Data-driven insights for smarter decisions", gradient: "from-emerald-50 to-teal-50", border: "hover:border-emerald-300", glow: "group-hover:shadow-emerald-100/50" },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r ${feature.gradient} border border-white/80 shadow-sm transition-all duration-500 ${feature.border} ${feature.glow} hover:shadow-lg hover:-translate-y-0.5 cursor-default ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                style={{ transitionDelay: `${0.5 + i * 0.15}s` }}
              >
                <span className="text-2xl mt-0.5 group-hover:scale-125 transition-transform duration-300">{feature.icon}</span>
                <div>
                  <p className="text-slate-800 font-semibold text-sm group-hover:text-slate-900 transition-colors">{feature.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 relative">

        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(80px)' }} />

        <div className={`w-full max-w-md relative z-10 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Image
              src="/ascendons-logo.png"
              alt="Ascendons Logo"
              width={80}
              height={80}
              className="mx-auto mb-4 drop-shadow-lg"
              priority
            />
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">Ascendons</span>
              <span className="text-slate-600 font-light ml-1.5">CRM</span>
            </h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form Card with animated gradient border */}
          <div className="relative group/card">
            {/* Animated gradient border */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-200/0 via-cyan-300/40 to-violet-300/0 animate-gradient-border opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/30">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 text-sm font-bold">!</span>
                      </div>
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email address
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-cyan-400/30 ring-offset-1' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={`h-4 w-4 transition-colors duration-300 ${fieldErrors.email ? 'text-red-400' :
                            focusedField === 'email' ? 'text-cyan-500' : 'text-slate-400'
                          }`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`block w-full pl-11 pr-4 py-3 border ${fieldErrors.email
                            ? "border-red-300 text-red-900 placeholder-red-300"
                            : "border-slate-200 text-slate-900 placeholder-slate-400"
                          } rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-cyan-400 sm:text-sm transition-all duration-300`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-2 text-sm text-red-500 animate-fadeIn">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-cyan-400/30 ring-offset-1' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`h-4 w-4 transition-colors duration-300 ${fieldErrors.password ? 'text-red-400' :
                            focusedField === 'password' ? 'text-cyan-500' : 'text-slate-400'
                          }`} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`block w-full pl-11 pr-11 py-3 border ${fieldErrors.password
                            ? "border-red-300 text-red-900 placeholder-red-300"
                            : "border-slate-200 text-slate-900 placeholder-slate-400"
                          } rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-cyan-400 sm:text-sm transition-all duration-300`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-2 text-sm text-red-500 animate-fadeIn">{fieldErrors.password}</p>
                    )}
                    <div className="text-right mt-2.5">
                      <Link href="/forgot-password" className="text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold rounded-xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: isLoading ? 'rgba(6,182,212,0.5)' : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0e7490 100%)',
                    boxShadow: isLoading ? 'none' : '0 8px 24px rgba(6,182,212,0.25), 0 2px 8px rgba(6,182,212,0.15)',
                  }}
                >
                  {/* Hover shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                  )}
                  <span className="relative">{isLoading ? "Signing in..." : "Sign in"}</span>
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              {/* Registration link */}
              <div className="mt-6">
                <Link
                  href="/register-organization"
                  className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-cyan-600 rounded-xl border border-cyan-200/50 bg-cyan-50/30 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 transition-all duration-300"
                >
                  Register your Organization →
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Ascendons Technologies. All rights reserved.
          </p>
        </div>
      </div>

      {/* ===== Animations ===== */}
      <style jsx global>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 40px) scale(0.95); }
          75% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-30px, 40px) scale(1.05); }
          50% { transform: translate(40px, -20px) scale(0.9); }
          75% { transform: translate(-20px, -30px) scale(1.1); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        .animate-blob-1 { animation: blob1 14s ease-in-out infinite; }
        .animate-blob-2 { animation: blob2 18s ease-in-out infinite; }
        .animate-blob-3 { animation: blob3 12s ease-in-out infinite; }

        @keyframes logo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-logo-float { animation: logo-float 4s ease-in-out infinite; }

        @keyframes logo-ring-1 {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.05); opacity: 0.2; }
        }
        @keyframes logo-ring-2 {
          0%, 100% { transform: scale(1); opacity: 0.05; }
          50% { transform: scale(1.08); opacity: 0.12; }
        }
        .animate-logo-ring-1 { animation: logo-ring-1 3s ease-in-out infinite; }
        .animate-logo-ring-2 { animation: logo-ring-2 4s ease-in-out infinite 0.5s; }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift { animation: gradient-shift 4s ease-in-out infinite; }

        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-border {
          background-size: 200% 200%;
          animation: gradient-border 3s ease infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
