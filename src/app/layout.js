
import ContextProvider from "@/component/helper/Context";
import HotToast from "@/component/helper/HotToast";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/secret";
import "./globals.css";


export const metadata = {
  title: `${STORE_NAME} | ${STORE_TAGLINE}`,
  description: `${STORE_NAME} | ${STORE_TAGLINE}`,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`overflow-x-hidden h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ContextProvider>
          <HotToast />
          <main>{children}</main>
        </ContextProvider>
      </body>
    </html>
  );
}

