import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Agent Hub",
  description: "Scaffold for the Insurance Agent Hub. Full build lands via KAN-44b.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
