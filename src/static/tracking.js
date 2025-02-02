const getDeviceInfo = () => {
    const screen = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || navigator.userLanguage;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
    return {
      screen,
      language,
      timezone,
      userAgent: navigator.userAgent,
    };
  };
  
  (async function () {
    "use strict";
    console.log("Tracking script loaded");
    const config = {
      autoTrack: true,
      respectDoNotTrack: true,
      endpoint: "http://localhost:5001/api/v1/track",
      sessionTimeout: 30 * 60 * 1000,
      version: "1.0.0",
      ...window.analyticsConfig,
    };
  
    // Initialize session
    let sessionId = localStorage.getItem("analytics_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("analytics_session", sessionId);
    }
  
    // Send tracking data
    const send = async (type, data = {}) => {
      // navigator.doNotTrack = "0";
      // if (config.respectDoNotTrack && navigator.doNotTrack === "1") {
      //   console.log(navigator.doNotTrack)
  
      //   return;
      // }
      const payload = {
        type,
        sessionId,
        websiteId: config.websiteId,
        referrer: document.referrer,
        ...getDeviceInfo(),
        ...data,
      };
  
      console.log(payload);
      await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((data) => console.log(data))
        .catch((error) => console.log(error));
      // navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
    };
  
    // Track page view
    const trackPageView = () => {
      send("pageview", {
        title: document.title,
      });
    };
  
    // Track custom events
    const trackEvent = (eventType, eventData = {}) => {
      send("event", {
        eventType,
        ...eventData,
      });
    };
  
    // Handle SPA route changes
    const handleSPA = () => {
      let lastURL = window.location.href;
  
      const observer = new MutationObserver(() => {
        if (lastURL !== window.location.href) {
          trackPageView();
          lastURL = window.location.href;
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };
  
    // Auto-start tracking
    if (config.autoTrack) {
      // Initial page view
      trackPageView();
  
      // SPA support
      if (window.history.pushState) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function (state) {
          originalPushState.apply(this, arguments);
          trackPageView();
        };
  
        window.addEventListener("popstate", trackPageView);
      } else {
        handleSPA();
      }
  
      // Track clicks
      document.addEventListener(
        "click",
        function (e) {
          const target = e.target.closest("a, button, [data-track]");
          if (target) {
            trackEvent("click", {
              element: target.tagName,
              id: target.id,
              class: target.className,
              text: target.textContent.trim().slice(0, 50),
              href: target.href || null,
              x: e.x,
              y: e.y,
            });
          }
        },
        { capture: true }
      );
    }
  
    // Expose public API
    window.analytics = {
      track: send,
      event: trackEvent,
      config: (options) => Object.assign(config, options),
      optOut: () => {
        localStorage.removeItem("analytics_session");
        config.autoTrack = false;
      },
    };
  
    // Error tracking
    window.addEventListener("error", (event) => {
      trackEvent("error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  
    // Performance tracking
    if ("performance" in window) {
      window.addEventListener("load", () => {
        const timing = performance.timing;
        trackEvent("performance", {
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          tcp: timing.connectEnd - timing.connectStart,
          ttfb: timing.responseStart - timing.requestStart,
          domLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          pageLoad: timing.loadEventEnd - timing.navigationStart,
        });
      });
    }
  
    // Heartbeat for session tracking
    setInterval(() => {
      localStorage.setItem("analytics_session_heartbeat", Date.now());
    }, 1000);
  })();
  