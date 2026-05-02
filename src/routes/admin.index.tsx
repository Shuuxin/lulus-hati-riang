import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Plus, Search, Trash2, CalendarClock, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Siswa = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  jurusan: string;
  tanggal_lahir: string;
  status_lulus: boolean;
  catatan: string | null;
};

const empty: Omit<Siswa, "id"> = {
  nama: "", nisn: "", kelas: "", jurusan: "",
  tanggal_lahir: "", status_lulus: true, catatan: "",
};

function AdminDashboard() {
  const [list, setList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Siswa | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Siswa | null>(null);

  const [release, setRelease] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("siswa").select("*").order("nama");
    setList((data as Siswa[]) ?? []);
    setLoading(false);
  }

  async function loadSettings() {
    const { data } = await supabase.from("app_settings").select("tanggal_pengumuman").eq("id", 1).maybeSingle();
    if (data?.tanggal_pengumuman) {
      // datetime-local format YYYY-MM-DDTHH:mm in local time
      const d = new Date(data.tanggal_pengumuman);
      const pad = (n: number) => String(n).padStart(2, "0");
      setRelease(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  }

  useEffect(() => { load(); loadSettings(); }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  }
  function openEdit(s: Siswa) {
    setEditing(s);
    setForm({
      nama: s.nama, nisn: s.nisn, kelas: s.kelas, jurusan: s.jurusan,
      tanggal_lahir: s.tanggal_lahir, status_lulus: s.status_lulus,
      catatan: s.catatan ?? "",
    });
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, catatan: form.catatan?.trim() || null };
    const res = editing
      ? await supabase.from("siswa").update(payload).eq("id", editing.id)
      : await supabase.from("siswa").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "Data diperbarui" : "Siswa ditambahkan");
    setDialogOpen(false);
    load();
  }

  async function doDelete() {
    if (!confirmDel) return;
    const { error } = await supabase.from("siswa").delete().eq("id", confirmDel.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Data dihapus");
    setConfirmDel(null);
    load();
  }

  async function saveSettings() {
    if (!release) return;
    setSavingSettings(true);
    const iso = new Date(release).toISOString();
    const { error } = await supabase.from("app_settings")
      .update({ tanggal_pengumuman: iso, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingSettings(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tanggal pengumuman diperbarui");
  }

  const filtered = list.filter((s) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return s.nama.toLowerCase().includes(t) || s.nisn.includes(t) || s.kelas.toLowerCase().includes(t) || s.jurusan.toLowerCase().includes(t);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <CalendarClock className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h2 className="font-semibold">Tanggal Pengumuman</h2>
            <p className="text-sm text-muted-foreground">Sebelum waktu ini, hasil tidak dapat dilihat publik.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input type="datetime-local" value={release} onChange={(e) => setRelease(e.target.value)} className="sm:max-w-xs" />
          <Button onClick={saveSettings} disabled={savingSettings || !release}>
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <h2 className="font-semibold">Data Siswa</h2>
            <p className="text-sm text-muted-foreground">{list.length} siswa terdaftar</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari nama / NISN..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 sm:w-64" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={save} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nama Lengkap</Label>
                      <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>NISN</Label>
                      <Input required value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value.replace(/\D/g, "") })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tanggal Lahir</Label>
                      <Input required type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kelas</Label>
                      <Input required value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} placeholder="XII TKJ 1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Jurusan</Label>
                      <Input required value={form.jurusan} onChange={(e) => setForm({ ...form, jurusan: e.target.value })} placeholder="Teknik Komputer & Jaringan" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label className="cursor-pointer">Status Lulus</Label>
                      <p className="text-xs text-muted-foreground">Aktif = LULUS, nonaktif = TIDAK LULUS</p>
                    </div>
                    <Switch checked={form.status_lulus} onCheckedChange={(v) => setForm({ ...form, status_lulus: v })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Catatan (opsional)</Label>
                    <Textarea rows={3} value={form.catatan ?? ""} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin inline" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Belum ada data siswa.</div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2 px-5 font-medium">Nama</th>
                  <th className="py-2 px-3 font-medium">NISN</th>
                  <th className="py-2 px-3 font-medium">Kelas</th>
                  <th className="py-2 px-3 font-medium">Jurusan</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-5 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 px-5 font-medium">{s.nama}</td>
                    <td className="py-2.5 px-3 tabular-nums">{s.nisn}</td>
                    <td className="py-2.5 px-3">{s.kelas}</td>
                    <td className="py-2.5 px-3">{s.jurusan}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${s.status_lulus ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {s.status_lulus ? "Lulus" : "Tidak Lulus"}
                      </span>
                    </td>
                    <td className="py-2.5 px-5 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDel(s)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{confirmDel?.nama}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
