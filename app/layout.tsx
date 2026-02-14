import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConnectionStatus } from "@/components/connection-status";
import { Sidebar } from "@/components/sidebar";
import { GatewayProvider } from "@/components/gateway-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "CLAWDIS Dashboard",
  description:
    "Admin dashboard for CLAWDIS WhatsApp/Telegram AI gateway",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="font-sans antialiased">
        <GatewayProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="flex h-14 items-center justify-end border-b border-border px-6">
                <ConnectionStatus />
              </header>
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
        </GatewayProvider>
      </body>
    </html>
  );
}
