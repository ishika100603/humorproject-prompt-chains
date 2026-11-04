import type { Metadata } from "next";
import { Archivo, Patrick_Hand_SC } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const hand = Patrick_Hand_SC({ variable: "--font-hand-sc", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Prompt chains | At 116 & Broadway",
  description: "Build, edit and test the prompt chains behind At 116 & Broadway's captions. Superadmins only.",
  robots: { index: false, follow: false },
};

// Runs before paint so there's no flash of the wrong theme
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${hand.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
