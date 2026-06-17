import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface PixelConfig {
  id: string;
  userId: string;
  platform: "FACEBOOK" | "TIKTOK" | "GOOGLE_ADS";
  pixelId: string;
  name: string | null;
  accessToken: string | null;
  isActive: boolean;
  events: string[];
  config: Record<string, any>;
}

interface PixelEventData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  num_items?: number;
  transaction_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  [key: string]: any;
}

export function usePixelTracking(userId: string | null) {
  const [pixels, setPixels] = useState<PixelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Rastrear quais pixelIds já foram inicializados para suportar múltiplos da mesma plataforma
  const initializedPixels = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadPixels();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPixels = async () => {
    try {
      const { data, error } = await supabase
        .from("PixelConfig")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true);

      if (error) throw error;

      setPixels(data || []);

      if (data && data.length > 0) {
        initializePixels(data);
      } else {
        setInitialized(true);
      }
    } catch (error) {
      console.error("Erro ao carregar pixels:", error);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar scripts dos pixels — suporta múltiplos por plataforma
  const initializePixels = (pixelsData: PixelConfig[]) => {
    pixelsData.forEach((pixel) => {
      if (!pixel.isActive) return;
      if (initializedPixels.current.has(pixel.pixelId)) return;

      switch (pixel.platform) {
        case "FACEBOOK":
          initializeFacebookPixel(pixel.pixelId);
          break;
        case "TIKTOK":
          initializeTikTokPixel(pixel.pixelId);
          break;
        case "GOOGLE_ADS":
          initializeGoogleAds(pixel.pixelId);
          break;
      }

      initializedPixels.current.add(pixel.pixelId);
    });
    setInitialized(true);
  };

  // ─── Meta Pixel (Facebook) ────────────────────────────────────────────────
  const initializeFacebookPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const win = window as any;

    // Garantir que o loader do fbq exista
    if (!win.fbq) {
      const script = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      const el = document.createElement("script");
      el.innerHTML = script;
      document.head.appendChild(el);
    }

    // Inicializar este pixel específico
    const initScript = document.createElement("script");
    initScript.innerHTML = `fbq('init', '${pixelId}');`;
    document.head.appendChild(initScript);

    console.log("✅ Meta Pixel inicializado:", pixelId);
  };

  // ─── TikTok Pixel ─────────────────────────────────────────────────────────
  const initializeTikTokPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const win = window as any;

    if (!win.ttq) {
      const script = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
          ttq._o=ttq._o||{};ttq._o[e]=n||{};
          var o=document.createElement("script");o.type="text/javascript";o.async=!0;
          o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(o,a)};
        }(window, document, 'ttq');
      `;
      const el = document.createElement("script");
      el.innerHTML = script;
      document.head.appendChild(el);
    }

    // Carregar este pixel específico
    const loadScript = document.createElement("script");
    loadScript.innerHTML = `ttq.load('${pixelId}');`;
    document.head.appendChild(loadScript);

    console.log("✅ TikTok Pixel inicializado:", pixelId);
  };

  // ─── Google Ads ──────────────────────────────────────────────────────────
  const initializeGoogleAds = (conversionId: string) => {
    if (typeof window === "undefined") return;

    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    // Inserir gtag.js se ainda não foi inserido para este ID
    const existingScript = document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${conversionId}"]`
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
      document.head.appendChild(script);
    }

    if (!win.gtag) {
      const initScript = document.createElement("script");
      initScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      `;
      document.head.appendChild(initScript);
    }

    const configScript = document.createElement("script");
    configScript.innerHTML = `gtag('config', '${conversionId}');`;
    document.head.appendChild(configScript);

    console.log("✅ Google Ads inicializado:", conversionId);
  };

  // ─── Disparar evento genérico ────────────────────────────────────────────
  const firePixelEvent = useCallback(
    (eventName: string, eventData: PixelEventData = {}) => {
      if (!initialized || pixels.length === 0) return;

      const firedPixelIds = new Set<string>();

      pixels.forEach((pixel) => {
        if (!pixel.events.includes(eventName)) return;
        if (firedPixelIds.has(pixel.pixelId)) return; // evitar duplicatas

        try {
          switch (pixel.platform) {
            case "FACEBOOK":
              fireMetaPixelEvent(eventName, eventData, pixel.pixelId);
              break;
            case "TIKTOK":
              fireTikTokPixelEvent(eventName, eventData);
              break;
            case "GOOGLE_ADS":
              fireGoogleAdsEvent(eventName, eventData);
              break;
          }
          firedPixelIds.add(pixel.pixelId);

          // Incrementar contador no banco (fire-and-forget)
          supabase
            .rpc("increment_pixel_event_count", { p_pixel_id: pixel.id })
            .then(() => {})
            .catch(() => {});
        } catch (err) {
          console.error(`Erro ao disparar evento ${eventName} em ${pixel.platform}:`, err);
        }
      });
    },
    [initialized, pixels]
  );

  // ─── Meta Pixel Events ────────────────────────────────────────────────────
  const fireMetaPixelEvent = (eventName: string, data: PixelEventData, pixelId?: string) => {
    if (typeof window === "undefined" || !(window as any).fbq) return;

    const fbq = (window as any).fbq;
    const eventMap: Record<string, string> = {
      page_view: "PageView",
      add_to_cart: "AddToCart",
      initiate_checkout: "InitiateCheckout",
      add_payment_info: "AddPaymentInfo",
      purchase: "Purchase",
      view_content: "ViewContent",
      complete_registration: "CompleteRegistration",
      search: "Search",
    };

    const fbEventName = eventMap[eventName] || eventName;

    if (pixelId) {
      fbq("trackSingle", pixelId, fbEventName, data);
    } else {
      fbq("track", fbEventName, data);
    }
    console.log("📊 Meta Pixel:", fbEventName, data);
  };

  // ─── TikTok Pixel Events ─────────────────────────────────────────────────
  const fireTikTokPixelEvent = (eventName: string, data: PixelEventData) => {
    if (typeof window === "undefined" || !(window as any).ttq) return;

    const ttq = (window as any).ttq;
    const eventMap: Record<string, string> = {
      page_view: "ViewContent",
      add_to_cart: "AddToCart",
      initiate_checkout: "InitiateCheckout",
      add_payment_info: "AddPaymentInfo",
      purchase: "CompletePayment",
      view_content: "ViewContent",
      complete_registration: "CompleteRegistration",
      search: "Search",
    };

    const ttEventName = eventMap[eventName] || eventName;
    ttq.track(ttEventName, data);
    console.log("📊 TikTok Pixel:", ttEventName, data);
  };

  // ─── Google Ads Events ────────────────────────────────────────────────────
  const fireGoogleAdsEvent = (eventName: string, data: PixelEventData) => {
    if (typeof window === "undefined" || !(window as any).gtag) return;

    const gtag = (window as any).gtag;
    const eventMap: Record<string, string> = {
      page_view: "page_view",
      add_to_cart: "add_to_cart",
      initiate_checkout: "begin_checkout",
      add_payment_info: "add_payment_info",
      purchase: "purchase",
      view_content: "view_item",
      begin_checkout: "begin_checkout",
      sign_up: "sign_up",
      search: "search",
    };

    const gtagEventName = eventMap[eventName] || eventName;
    gtag("event", gtagEventName, data);
    console.log("📊 Google Ads:", gtagEventName, data);
  };

  // ─── Eventos tipados ──────────────────────────────────────────────────────

  const trackPageView = useCallback(() => {
    firePixelEvent("page_view", {});
  }, [firePixelEvent]);

  const trackAddToCart = useCallback(
    (product: any, value: number) => {
      firePixelEvent("add_to_cart", {
        content_ids: [product.id],
        content_type: "product",
        content_name: product.name,
        value,
        currency: "BRL",
        num_items: 1,
      });
    },
    [firePixelEvent]
  );

  const trackInitiateCheckout = useCallback(
    (value: number, items: any[]) => {
      firePixelEvent("initiate_checkout", {
        content_ids: items.map((item) => item.id || item.productId || ""),
        content_type: "product",
        value,
        currency: "BRL",
        num_items: items.length,
      });
    },
    [firePixelEvent]
  );

  const trackAddPaymentInfo = useCallback(
    (value: number, paymentMethod: string) => {
      firePixelEvent("add_payment_info", {
        value,
        currency: "BRL",
        payment_type: paymentMethod,
      });
    },
    [firePixelEvent]
  );

  const trackPurchase = useCallback(
    (orderId: string, value: number, items: any[], customerData?: any) => {
      const eventData: PixelEventData = {
        transaction_id: orderId,
        value,
        currency: "BRL",
        content_ids: items.map((item) => item.id || item.productId || ""),
        content_type: "product",
        num_items: items.length,
      };

      if (customerData) {
        eventData.email = customerData.email;
        eventData.phone = customerData.phone;
        eventData.first_name = customerData.firstName || customerData.name?.split(" ")[0];
        eventData.last_name = customerData.lastName || customerData.name?.split(" ").slice(1).join(" ");
        eventData.city = customerData.city;
        eventData.state = customerData.state;
        eventData.zip = customerData.zipCode || customerData.zip;
        eventData.country = customerData.country || "BR";
      }

      firePixelEvent("purchase", eventData);
    },
    [firePixelEvent]
  );

  const trackViewContent = useCallback(
    (product: any, value: number) => {
      firePixelEvent("view_content", {
        content_ids: [product.id],
        content_type: "product",
        content_name: product.name,
        value,
        currency: "BRL",
      });
    },
    [firePixelEvent]
  );

  return {
    loading,
    initialized,
    pixels,
    trackPageView,
    trackAddToCart,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackViewContent,
    firePixelEvent,
  };
}
