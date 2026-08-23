import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "谁是卧底 · 简易联网电子身份牌",
  description: "和朋友快速开一局，无需下载，手机浏览器直接玩",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
