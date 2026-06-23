import "./globals.css";

export const metadata = {
  title: "Sales Pipeline CRM",
  description: "Commercial CRM Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
