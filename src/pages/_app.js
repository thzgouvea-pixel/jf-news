// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";

const GA_ID = "G-J5CD56E1VX";

export default function App({ Component, pageProps }) {
  var router = useRouter();

  useEffect(function() {
    // Load GA script
    var script = document.createElement("script");
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID);
  }, []);

  useEffect(function() {
    var handleRouteChange = function(url) {
      if (window.gtag) window.gtag("config", GA_ID, { page_path: url });
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return function() { router.events.off("routeChangeComplete", handleRouteChange); };
  }, [router.events]);

  return <Component {...pageProps} />;
}
