import type { Metadata } from "next";
import { Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

/** Canva Sans is proprietary; Nunito Sans is the app-wide UI typeface. */
const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HopHacks — Baltimore disposal guide",
  description:
    "Describe or photograph an item to learn how to dispose of it and find recycling centers in Baltimore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
