"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (document.cookie.includes("admin-auth=true")) router.push("/admin/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("admin-password", password);
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Sai mật khẩu");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-light tracking-widest text-espresso uppercase mb-2">
            TRANH ANH STORE
          </h1>
          <p className="text-xs uppercase tracking-widest text-stone-400">Quản trị viên</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-stone-100 space-y-6">
          <div className="relative pt-5">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoFocus
              className="w-full bg-transparent border-0 border-b border-stone-300 py-2 px-0 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors peer"
            />
            <label className="absolute left-0 top-5 text-stone-400 text-sm transition-all duration-200 pointer-events-none
              peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm
              peer-focus:top-0 peer-focus:text-xs peer-focus:text-espresso
              peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-espresso">
              Mật khẩu
            </label>
          </div>

          {error && <p className="text-rose text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-espresso text-cream py-3 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
