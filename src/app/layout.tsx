import type { Metadata } from "next";
import { Noto_Sans_Thai, Roboto, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ERBM",
  description: "Expense Reimbursement and Bill Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${roboto.variable} ${thai.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
