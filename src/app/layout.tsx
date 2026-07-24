import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BlueCollarHousing · Furnished housing minutes from the job",
    template: "%s · BlueCollarHousing",
  },
  description:
    "Furnished housing built for blue-collar workers. Find a comfortable place near the job site for a turnaround, shutdown, or long-term project. No hotels.",
  openGraph: {
    siteName: "BlueCollarHousing",
    // Shown as the title line under the shared-link preview card. Kept to the
    // brand name so it doesn't repeat the tagline baked into the OG image.
    title: "BlueCollarHousing",
    description: "Hotel alternatives for those working on the road.",
    type: "website",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${barlow.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
