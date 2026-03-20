import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduManager - School Management System",
  description: "Comprehensive school management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
