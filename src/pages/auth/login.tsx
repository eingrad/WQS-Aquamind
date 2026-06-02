import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import aquamindLogo from "../../assets/aquamind-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password }, remember);

      // Login successful - tokens stored automatically by auth service
      console.log("Login successful:", res.data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      // Backend auth errors use { error: "..." }; other endpoints use { message: "..." }
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#ffffff] w-full min-h-screen text-slate-700">
      {/* Left brand / hero side */}
      <div className="hidden relative lg:flex justify-center items-center bg-linear-to-br from-[#bfdbfe] to-[#dbeafe] p-12 lg:w-1/2 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(800px 300px at 20% 10%, #3b82f622, transparent), radial-gradient(600px 400px at 80% 90%, #2563eb33, transparent)",
          }}
        />
        <div className="relative max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <img src={aquamindLogo} alt="AquaMind" className="h-20 w-auto" />
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Monitor pH, DO, NH₃-N, COD, BOD, TSS and depth across water monitoring stations in real time.
          </p>
        </div>
      </div>

      {/* Right pa
      nel: login form */}
      <div className="flex flex-1 justify-center items-center p-6 sm:p-10">
        <div className="bg-[#ffffff]/70 shadow-xl backdrop-blur p-8 border border-slate-200 rounded-2xl w-full max-w-lg">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 text-md">Email</label>
              <input
                type="email"
                autoFocus
                className="bg-[#ffffff] px-4 py-3 border border-slate-200 focus:border-blue-500/60 rounded-xl outline-none w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-md">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-blue-600 text-xs hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="bg-[#ffffff] px-4 py-3 border border-slate-200 focus:border-blue-500/60 rounded-xl outline-none w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="text-blue-600 text-sm hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="bg-rose-500/10 p-3 border border-rose-500/40 rounded-lg text-rose-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 py-3 rounded-xl w-full font-semibold text-black transition disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="pt-2 text-gray-500 text-xs">
              By signing in you agree to the terms of use. This application may
              log access for security audits.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
