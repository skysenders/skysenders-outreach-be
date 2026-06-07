import dns from 'dns/promises';

// Provider-to-selectors mapping (Unified Outlook & Gmail)
const PROVIDER_SELECTORS = {
  GMAIL: ['google'],
  OUTLOOK: ['selector1', 'selector2'], // Handles OUTLOOK inputs
  ZOHO: ['zoho', 'zmail'],
};

// Global fallback array if provider is unknown or default
const GLOBAL_DEFAULT_SELECTORS = ['default', 'google', 'selector1', 's1', 'selector2', 's2', 'zoho', 'zmail', 'microsoft'];

// 1. SPF Record Checker
export const checkSPF = async(domainName) => {
  const result = { pass: false, values: [], error: null };
  try {
    const txtRes = await dns.resolveTxt(domainName).catch(() => []);
    const spfRecords = txtRes.map(r => r.join('')).filter(r => r.startsWith('v=spf1'));

    result.values = spfRecords;
    result.pass = spfRecords.length === 1;
    if (!result.pass) {
      if (spfRecords.length > 1) {
        result.error = 'Multiple SPF records found - this will fail validation.';
      } else {
        result.error = 'No SPF record found.';
      }
    }
  } catch (err) {
    result.error = err.message;
  }
  return result;
};

// 2. DMARC Record Checker
export const checkDMARC = async(domainName) => {
  const result = { pass: false, values: [], error: null };
  try {
    const dmarcRes = await dns.resolveTxt(`_dmarc.${domainName}`).catch(() => []);
    const dmarcRecords = dmarcRes.map(r => r.join('')).filter(r => r.startsWith('v=DMARC1'));

    result.values = dmarcRecords;
    result.pass = dmarcRecords.length > 0;
    result.error = dmarcRecords.length === 0 ? 'No DMARC record found.' : null;
  } catch (err) {
    result.error = err.message;
  }
  return result;
};

// 3. MX Record Checker
export const checkMX = async(domainName) => {
  const result = { pass: false, values: [], error: null };
  try {
    const mxRes = await dns.resolveMx(domainName).catch(() => []);
    result.values = mxRes;
    result.pass = mxRes.length > 0;
    result.error = mxRes.length === 0 ? 'No MX records found.' : null;
  } catch (err) {
    result.error = err.message;
  }
  return result;
};

// 4. Custom Tracking Domain CNAME Checker
export const checkTracking = async(trackingHost, expectedTrackingTarget) => {
  const result = { pass: false, values: null, error: 'Tracking url is not configured.' };
  if (!trackingHost) return result;

  try {
    const trackingRes = await dns.resolveCname(trackingHost.trim().toLowerCase()).catch(() => []);
    if (trackingRes.length > 0) {
      const foundCname = trackingRes[0].toLowerCase().replace(/\.$/, '');
      const target = expectedTrackingTarget?.toLowerCase().replace(/\.$/, '');

      result.values = [foundCname];
      result.pass = foundCname === target;
      if (foundCname !== target) {
        result.error = `Configured correctly but points to ${foundCname} instead of ${target}`;
      }
    } else {
      result.error = `No CNAME record found for ${trackingHost}.`;
    }
  } catch (err) {
    result.error = err.message;
  }
  return result;
};

// Helper to query a single DKIM selector
const queryDkimSelector = async(selector, domainName) => {
  const res = await dns.resolveTxt(`${selector}._domainkey.${domainName}`).catch(() => []);
  return res.map(r => r.join('')).filter(r => r.startsWith('v=DKIM1'));
};

// 5. DKIM Record Checker with Smart Selector Fallbacks
export const checkDKIM = async(domainName, domainProvider, dkimSelector) => {
  let provider = domainProvider ? domainProvider.trim().toUpperCase() : '';

  const result = { pass: false, records: [], error: 'No DKIM record found.' };
  const cleanSelector = dkimSelector?.trim().toLowerCase();

  // Determine selectors to loop over based on rules
  let selectorsToTest = [];
  if (cleanSelector) {
    selectorsToTest = [cleanSelector];
  } else if (PROVIDER_SELECTORS[provider]) {
    selectorsToTest = PROVIDER_SELECTORS[provider]; // e.g. ['selector1', 'selector2']
  } else {
    selectorsToTest = GLOBAL_DEFAULT_SELECTORS; // Use general broad array fallback
  }

  try {
    // Fire all dynamic selector queries concurrently
    const lookups = selectorsToTest.map(sel =>
      queryDkimSelector(sel, domainName).then(records => ({ selector: sel, values: records }))
    );

    const lookupResults = await Promise.all(lookups);

    // Snag the first match that yielded records
    const validResult = lookupResults.find(r => r.values.length > 0);

    if (validResult) {
      result.pass = true;
      result.values = validResult.values;
      result.matchedSelector = validResult.selector; // Optional debugging metadata
      result.error = null;
    }
    // Rule: Skip check entirely if using native GMAIL or OUTLOOK infrastructure
    // const skipDkim = provider === 'GMAIL' || provider === 'OUTLOOK';
    // if (skipDkim) {
    //   return { pass: true, values: [], error: `Skipped validation for managed provider: ${provider}` };
    // }
  } catch (err) {
    result.error = err.message;
  }

  return result;
};

// Main Orchestrator Function
export const checkDomainDNSConfig = async(
  domainName,
  domainProvider,
  dkimSelector = 'default',
  trackingHost = null,
  expectedTrackingTarget = null
) => {
  const cleanDomain = domainName.trim().toLowerCase();

  // Fire all core individual domain checkers concurrently
  const [spf, dmarc, mx, dkim, tracking] = await Promise.all([
    checkSPF(cleanDomain),
    checkDMARC(cleanDomain),
    checkMX(cleanDomain),
    checkDKIM(cleanDomain, domainProvider, dkimSelector),
    checkTracking(trackingHost, expectedTrackingTarget)
  ]);

  return {
    domain: cleanDomain,
    spf,
    dkim,
    dmarc,
    mx,
    tracking,
    lastChecked: new Date().toISOString()
  };
};
