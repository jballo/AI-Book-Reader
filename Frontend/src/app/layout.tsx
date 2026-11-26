import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Book Reader",
  description: "Reading made easier by a click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body
        className={`font-sans antialiased`}
      >
        <ClerkProvider
          waitlistUrl="/waitlist"
          appearance={{
            variables: {
              colorPrimary: "#F4F4F5",
              colorPrimaryForeground: "#0B0B0C",
              colorBackground: "#141416",
              colorForeground: "#F4F4F5",
              colorMutedForeground: "#A1A1AA",
              colorNeutral: "#FFFFFF",
              colorInput: "#1C1C1F",
              colorInputForeground: "#F4F4F5",
              colorBorder: "#2A2A2E",
              colorRing: "#C1FF7A",
              fontFamily: "var(--font-inter)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
