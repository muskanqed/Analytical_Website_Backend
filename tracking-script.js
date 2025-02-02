(function () {
  "use strict";

  const config = {
    autoTrack: true,
    respectDoNotTrack: true,
    endpoint: "http://localhost:5001/api/v1/track",
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    version: "1.0.0",
    websiteId: undefined, // Added missing required field
  };

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

  // Initialize session
  let sessionId = localStorage.getItem("analytics_session");
  let lastActivity = Date.now();

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("analytics_session", sessionId);
  }

  // Send tracking data
  const send = (type, data = {}) => {
    if (config.respectDoNotTrack && navigator.doNotTrack === "1") return;

    const payload = {
      type,
      sessionId,
      timestamp: new Date().toISOString(), // Added timestamp
      websiteId: config.websiteId,
      url: window.location.href,
      referrer: document.referrer,
      ...getDeviceInfo(),
      ...data,
    };

    // Use fetch with keepalive for more reliable data transmission
    fetch(config.endpoint, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(console.error); // Added error handling
  };

  // Track page view
  const trackPageView = () => {
    send("pageview", {
      title: document.title,
      path: window.location.pathname // Added path tracking
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

  // Session management
  const checkSession = () => {
    const currentTime = Date.now();
    if (currentTime - lastActivity > config.sessionTimeout) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("analytics_session", sessionId);
    }
    lastActivity = currentTime;
  };

  // Auto-start tracking
  if (config.autoTrack) {
    // Initial page view
    trackPageView();

    // SPA support
    if (window.history.pushState) {
      const originalPushState = history.pushState;
      history.pushState = function () {
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
  setInterval(checkSession, config.sessionTimeout / 2);
})();