import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Nexus – Managed Device",
  manifest: "/child-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#450a0a",
};

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No max-w-md constraint — lock screen needs full viewport
  return <div className="min-h-screen w-full">{children}</div>;
}
