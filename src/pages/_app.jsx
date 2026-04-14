import '../styles/globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  var router = useRouter();
  var canonical = "https://fonsecanews.com.br" + (router.asPath === "/" ? "" : router.asPath.split("?")[0]);
  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-J5CD56E1VX" strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-J5CD56E1VX');
      `}</Script>
      <Head>
        <link rel="canonical" href={canonical} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
