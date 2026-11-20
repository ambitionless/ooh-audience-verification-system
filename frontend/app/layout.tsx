import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OOH Audience Verification | SaaS Measurement",
  description: "Enterprise SaaS for OOH Audience Measurement and Campaign Verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
