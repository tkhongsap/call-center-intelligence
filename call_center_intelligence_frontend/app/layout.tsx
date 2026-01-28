// Root layout - redirects are handled by middleware
// The actual app layout is in app/[locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
