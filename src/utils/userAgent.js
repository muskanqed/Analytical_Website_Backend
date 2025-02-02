const UAParser = require('ua-parser-js');

const parseUserAgent = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  
  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || 'Unknown'
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || 'Unknown'
    },
    device: {
      type: result.device.type || 'desktop',
      model: result.device.model || 'Unknown',
      vendor: result.device.vendor || 'Unknown'
    },
    engine: {
      name: result.engine.name || 'Unknown',
      version: result.engine.version || 'Unknown'
    },
    isMobile: result.device.type === 'mobile',
    isTablet: result.device.type === 'tablet',
    isBot: result.device.type === 'bot' || /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgentString)
  };
};

module.exports = { parseUserAgent };