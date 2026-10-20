import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERBM Frontend",
  description: "Frontend for the ERBM capstone project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
