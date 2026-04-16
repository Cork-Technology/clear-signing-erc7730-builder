import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { QueryProvider } from "~/lib/query-provider";
import { Erc7730StoreProvider } from "~/store/erc7730Provider";
import { Toaster } from "~/components/ui/toaster";
import { ThemeProvider } from "~/components/ui/theme-provider";
import GoogleTagManager from "~/components/scripts/googleTagManager";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Create Erc7730 Json",
  description: "Clear sign all the things",
  icons: [{ rel: "icon", url: "/ledger-logo-short-black.svg" }],
  openGraph: {
    title: "Create Erc7730 Json",
    description: "Clear sign all the things",
    images: [
      {
        url: "/openGraphImage.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM;
const ONETRUST_ID = process.env.NEXT_PUBLIC_ONETRUST;
const ONETRUST_ENVIROMENT_ID =
  process.env.NODE_ENV === "production" ? ONETRUST_ID : ONETRUST_ID ? `${ONETRUST_ID}-test` : undefined;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <QueryProvider>
          <Erc7730StoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </Erc7730StoreProvider>
        </QueryProvider>
        {ONETRUST_ENVIROMENT_ID && (
          <Script
            strategy="beforeInteractive"
            src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
            data-domain-script={`${ONETRUST_ENVIROMENT_ID}`}
            data-document-language="true"
            data-testid="one-trust-script-sdk"
          />
        )}
        {GTM_ID && <GoogleTagManager id={GTM_ID} />}
      </body>
    </html>
  );
}
