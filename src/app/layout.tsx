import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Dating App",
  description: "Will you go on a date with me?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
