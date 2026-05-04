"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

function FloatInput({
  label, type = "text", value, onChange, autoFocus,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; autoFocus?: boolean;
}) {
  return (
    <div className="relative pt-5">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        autoFocus={autoFocus}
        required
        className="w-full bg-transparent border-0 border-b border-stone-300 py-2 px-0 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors peer"
      />
      <label className="absolute left-0 top-5 text-stone-400 text-sm transition-all duration-200 pointer-events-none
        peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm
        peer-focus:top-0 peer-focus:text-xs peer-focus:text-espresso
        peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-espresso">
        {label}
      </label>
    </div>
  );
}

export default function AdminLoginPage() {
  const [mode, setMode] = useState<"admin" | "staff">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = mode === "admin"
        ? { password }
        : { username: username.trim(), password };

      const res = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Đảm bảo tối thiểu 500ms loading để user thấy animation
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      const data = await res.json();

      if (data.success) {
        if (data.role === "admin") {
          localStorage.removeItem("admin-password");
          window.location.replace("/admin/dashboard");
        } else {
          // Nhân viên: vào trang đầu tiên được phép
          const quyen: string[] = data.quyen || [];
          const order = ["dashboard", "don-hang", "san-pham", "khach-hang", "ma-giam-gia"];
          const first = order.find((q) => quyen.includes(q)) || quyen[0];
          window.location.replace(first ? `/admin/${first}` : "/admin/dashboard");
        }
      } else {
        setError(data.error || "Đăng nhập thất bại");
        setLoading(false);
      }
    } catch {
      setError("Không thể kết nối đến máy chủ");
      setLoading(false);
    }
  };

  // Full-page loading overlay — hiển thị khi đang chờ đăng nhập
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="full" label="Đang đăng nhập..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-heading text-2xl sm:text-3xl font-light tracking-widest text-espresso uppercase mb-2">
            TRANG ANH STORE
          </h1>
          <p className="text-xs uppercase tracking-widest text-stone-400">Quản trị</p>
        </div>

        {/* Tab chọn loại đăng nhập */}
        <div className="flex mb-6 border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => { setMode("admin"); setError(""); }}
            className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
              mode === "admin" ? "bg-espresso text-cream" : "text-stone-500 hover:text-espresso"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setMode("staff"); setError(""); }}
            className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
              mode === "staff" ? "bg-espresso text-cream" : "text-stone-500 hover:text-espresso"
            }`}
          >
            Nhân viên
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 border border-stone-100 space-y-4 sm:space-y-6">
          {mode === "staff" && (
            <FloatInput
              label="Tên đăng nhập"
              value={username}
              onChange={setUsername}
              autoFocus
            />
          )}
          <FloatInput
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={setPassword}
            autoFocus={mode === "admin"}
          />

          {error && <p className="text-rose text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-espresso text-cream py-3 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
