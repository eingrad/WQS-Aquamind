import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSrc from "../../assets/petronas-logo-dark-whiteText.svg";
import { login } from "../../services/auth.service";

export default function PetronasLogin() {
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
      const res = await login({ email, password });

      // Login successful - tokens stored automatically by auth service
      console.log("Login successful:", res.data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#0f1a1a] w-full min-h-screen text-gray-100">
      {/* Left brand / hero side */}
      <div className="hidden relative lg:flex justify-center items-center bg-linear-to-br from-[#0d2f2e] to-[#0a201f] p-12 lg:w-1/2 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(800px 300px at 20% 10%, #23c1b522, transparent), radial-gradient(600px 400px at 80% 90%, #15a79f33, transparent)",
          }}
        />
        <div className="relative max-w-md">
          <div className="flex items-center gap-4 mb-6">
            {/*<img src={logoSrc} alt="Petronas Logo" className="w-12 h-12" />*/}
            <div>
              <h1 className="font-semibold text-2xl tracking-wide">PETRONAS</h1>
              <p className="text-teal-300/80 text-sm">
                Air Monitoring Dashboard
              </p>
            </div>
          </div>
          <p className="text-teal-100/80 leading-relaxed">
            Monitor SO₂, H₂S, NO₂, BTEX and met data across sites in real time.
          </p>
        </div>
      </div>

      {/* Right pa
      nel: login form */}
      <div className="flex flex-1 justify-center items-center p-6 sm:p-10">
        <div className="bg-[#142223]/70 shadow-xl backdrop-blur p-8 border border-white/5 rounded-2xl w-full max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <img src={logoSrc} alt="Petronas Logo" className="w-50 h-30" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 text-md">Email</label>
              <input
                type="email"
                autoFocus
                className="bg-[#0d1717] px-4 py-3 border border-white/10 focus:border-teal-500/60 rounded-xl outline-none w-full"
                placeholder="email@petronas.com"
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
                  className="text-teal-300 text-xs hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="bg-[#0d1717] px-4 py-3 border border-white/10 focus:border-teal-500/60 rounded-xl outline-none w-full"
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
                  className="accent-teal-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="text-teal-300 text-sm hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="bg-rose-500/10 p-3 border border-rose-500/40 rounded-lg text-rose-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-60 py-3 rounded-xl w-full font-semibold text-black transition disabled:cursor-not-allowed"
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
