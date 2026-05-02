import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Search, CheckCircle2, XCircle, Loader2, ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Countdown } from "@/components/pengumuman/Countdown";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

type Result = {
  nama: string;
  nisn: string;
  kelas: string;
  jurusan: string;
  tanggal_lahir: string;
  status_lulus: boolean;
  catatan: string | null;
};

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function Index() {
  const [release, setRelease] = useState<Date | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [nisn, setNisn] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("tanggal_pengumuman").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (data?.tanggal_pengumuman) setRelease(new Date(data.tanggal_pengumuman));
        setLoadingSettings(false);
      });
  }, []);

  const isReleased = release ? Date.now() >= release.getTime() : false;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!nisn.trim() || !tanggal) {
      toast.error("Mohon lengkapi NISN dan tanggal lahir");
      return;
    }
    setSearching(true);
    setNotFound(false);
    setResult(null);
    const { data, error } = await supabase.rpc("cek_kelulusan", {
      _nisn: nisn.trim(),
      _tanggal_lahir: tanggal,
    });
    setSearching(false);
    if (error) {
      toast.error("Terjadi kesalahan. Coba lagi.");
      return;
    }
    if (!data || data.length === 0) {
      setNotFound(true);
      return;
    }
    setResult(data[0] as Result);
  }

  function reset() {
    setResult(null);
    setNotFound(false);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-hero text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur mb-5">
            <GraduationCap className="w-9 h-9" />
          </div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-80 mb-3">
            Pengumuman Resmi
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            Kelulusan Siswa
          </h1>
          <p className="text-lg sm:text-2xl mt-2 font-medium opacity-95">
            SMK Arrahmah Papar
          </p>
          <p className="mt-4 text-sm sm:text-base opacity-80 max-w-xl mx-auto">
            Tahun Pelajaran {new Date().getFullYear() - 1}/{new Date().getFullYear()}
          </p>
        </div>
      </header>

      <section className="flex-1 -mt-10 sm:-mt-12 px-4 sm:px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          {loadingSettings ? (
            <Card className="p-8 text-center shadow-elegant">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </Card>
          ) : !isReleased && release ? (
            <Card className="p-6 sm:p-10 shadow-elegant bg-gradient-card">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 mb-4">
                  <Lock className="w-6 h-6 text-accent-foreground" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Pengumuman Belum Dibuka
                </h2>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Hasil kelulusan akan dapat dilihat pada
                </p>
                <p className="font-semibold text-primary mt-1 text-base sm:text-lg">
                  {release.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })} WIB
                </p>
              </div>
              <div className="mt-8">
                <Countdown target={release} />
              </div>
            </Card>
          ) : result ? (
            <ResultCard result={result} onReset={reset} />
          ) : (
            <Card className="p-6 sm:p-8 shadow-elegant bg-gradient-card">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Cek Status Kelulusan
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan NISN dan tanggal lahir Anda
                </p>
              </div>
              <form onSubmit={onSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nisn">NISN</Label>
                  <Input
                    id="nisn"
                    inputMode="numeric"
                    placeholder="Contoh: 0051234567"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, "").slice(0, 20))}
                    maxLength={20}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tgl">Tanggal Lahir</Label>
                  <Input
                    id="tgl"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={searching} className="w-full h-11 text-base">
                  {searching ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mencari...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" /> Cari Hasil</>
                  )}
                </Button>
                {notFound && (
                  <div className="text-sm text-center text-destructive bg-destructive/10 rounded-md py-3 px-4">
                    Data tidak ditemukan. Pastikan NISN dan tanggal lahir benar.
                  </div>
                )}
              </form>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Pengumuman ini bersifat resmi dari panitia kelulusan SMK Arrahmah Papar.
          </p>
        </div>
      </section>

      <footer className="border-t bg-card/50 py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SMK Arrahmah Papar ·{" "}
          <Link to="/admin" className="hover:text-primary underline-offset-4 hover:underline">
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}

function ResultCard({ result, onReset }: { result: Result; onReset: () => void }) {
  const lulus = result.status_lulus;
  return (
    <Card className={`overflow-hidden shadow-elegant ${lulus ? "border-success/40" : "border-destructive/40"}`}>
      <div className={`p-6 sm:p-8 text-center text-primary-foreground ${lulus ? "bg-gradient-hero" : "bg-destructive"}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur mb-3">
          {lulus ? <CheckCircle2 className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
        </div>
        <p className="text-xs uppercase tracking-widest opacity-80">Status Kelulusan</p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-1">
          {lulus ? "LULUS" : "TIDAK LULUS"}
        </h2>
        <p className="mt-3 text-sm sm:text-base opacity-95">
          {lulus
            ? "Selamat! Anda dinyatakan LULUS dari SMK Arrahmah Papar."
            : "Mohon maaf, Anda dinyatakan belum lulus. Silakan hubungi pihak sekolah."}
        </p>
      </div>
      <div className="p-6 sm:p-8 bg-card">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="Nama" value={result.nama} />
          <Field label="NISN" value={result.nisn} />
          <Field label="Kelas" value={result.kelas} />
          <Field label="Jurusan" value={result.jurusan} />
          <Field label="Tanggal Lahir" value={formatTanggal(result.tanggal_lahir)} />
        </dl>
        {result.catatan && (
          <div className="mt-5 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium text-foreground mb-1">Catatan</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{result.catatan}</p>
          </div>
        )}
        <Button variant="outline" onClick={onReset} className="w-full mt-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Cek Data Lain
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground mt-0.5">{value}</dd>
    </div>
  );
}
