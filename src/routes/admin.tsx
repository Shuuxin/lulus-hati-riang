import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setEmail(session?.user.email ?? null);
      if (session) {
        // check role
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data }) => {
            setIsAdmin(!!data);
            setLoading(false);
          });
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setAuthed(!!session);
      setEmail(session?.user.email ?? null);
      if (!session) setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin" });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authed) return <LoginScreen />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Akun ini tidak memiliki hak akses admin.
          </p>
          <Button onClick={logout} variant="outline" className="mt-4">Keluar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>Admin · SMK Arrahmah</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Lihat Situs
            </Link>
            <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1.5" /> Keluar
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Pengumuman</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Masuk ke panel admin" : "Daftar admin baru"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Masuk" : "Daftar"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-4">
          {mode === "login" ? (
            <>Belum punya akun?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline">
                Daftar (admin pertama)
              </button>
            </>
          ) : (
            <>Sudah punya akun?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                Masuk
              </button>
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Kembali ke beranda</Link>
        </p>
      </div>
    </div>
  );
}
