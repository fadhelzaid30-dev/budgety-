import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/toast";
import { clerkLocalization } from "@/lib/clerk-localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Budgety — Your AI Financial Growth Assistant",
  description:
    "Budgety is an affordable AI CFO for small businesses. Track cash, spot risks, and get clear advice on what to do next — grounded in your real numbers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/" localization={clerkLocalization}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
