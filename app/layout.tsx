import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="max-w-4xl mx-auto py-10 px-4">{children}</main>
      </body>
    </html>
  );
}