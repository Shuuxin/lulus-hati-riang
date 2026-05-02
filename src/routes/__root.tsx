import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pengumuman Kelulusan — SMK Arrahmah Papar" },
      { name: "description", content: "Sistem pengumuman kelulusan resmi SMK Arrahmah Papar. Cek status kelulusan dengan NISN dan tanggal lahir." },
      { property: "og:title", content: "Pengumuman Kelulusan — SMK Arrahmah Papar" },
      { property: "og:description", content: "Sistem pengumuman kelulusan resmi SMK Arrahmah Papar. Cek status kelulusan dengan NISN dan tanggal lahir." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Pengumuman Kelulusan — SMK Arrahmah Papar" },
      { name: "twitter:description", content: "Sistem pengumuman kelulusan resmi SMK Arrahmah Papar. Cek status kelulusan dengan NISN dan tanggal lahir." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/y8Lx1MMj6uSJaI0X0ygj6M5h5IY2/social-images/social-1777693778861-fa7fdbca-b178-45ea-98d7-99940ba652b4.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/y8Lx1MMj6uSJaI0X0ygj6M5h5IY2/social-images/social-1777693778861-fa7fdbca-b178-45ea-98d7-99940ba652b4.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
