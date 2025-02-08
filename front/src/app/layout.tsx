import "@styles/global.css";
import { QueryClientProvider } from "@providers/QueryClientProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
