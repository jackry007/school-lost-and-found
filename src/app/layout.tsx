// src/app/layout.tsx
import "./globals.css";
import Nav from "@/components/Nav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Nav />
        <main className="p-6 max-w-5xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
