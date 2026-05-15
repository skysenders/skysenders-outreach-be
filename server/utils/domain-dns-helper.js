import dns from 'dns/promises';

/**
 * Unified DNS Health Checker
 * @param {string} domainName - Root domain (e.g., 'example.com')
 * @param {string} dkimSelector - Selector from DB, defaults to 'default'
 * @param {string} trackingHost - Custom domain host (e.g., 'link.example.com')
 * @param {string} expectedTrackingTarget - Your platform's CNAME target
 * @returns {object} Comprehensive health check results for SPF, DKIM, DMARC, MX, and Tracking
 */
export const checkDomainDNSConfig = async(
  domainName,
  dkimSelector = 'default', // Defaulting to 'default' as requested
  trackingHost = null,
  expectedTrackingTarget = null
) => {
  // Clean input
  const cleanDomain = domainName.trim().toLowerCase();
  const selector = (dkimSelector || 'default').trim().toLowerCase();

  const results = {
    domain: cleanDomain,
    spf: { pass: false, records: [], error: null },
    dkim: { pass: false, records: [], error: null },
    dmarc: { pass: false, records: [], error: null },
    mx: { pass: false, records: [], error: null },
    tracking: { pass: false, value: null, error: null },
    lastChecked: new Date().toISOString()
  };

  // Prepare DNS resolution tasks
  const tasks = [
    dns.resolveTxt(cleanDomain).catch(() => []),
    dns.resolveTxt(`_dmarc.${cleanDomain}`).catch(() => []),
    dns.resolveMx(cleanDomain).catch(() => []),
    dns.resolveTxt(`${selector}._domainkey.${cleanDomain}`).catch(() => [])
  ];

  // Optional Tracking CNAME check
  if (trackingHost) {
    tasks.push(dns.resolveCname(trackingHost.trim().toLowerCase()).catch(() => []));
  } else {
    tasks.push(Promise.resolve('SKIP_TRACKING'));
  }

  // Execute all lookups in parallel for speed
  const [txtRes, dmarcRes, mxRes, dkimRes, trackingRes] = await Promise.all(tasks);

  // 1. SPF: Must have exactly one record starting with v=spf1
  const spfRecords = txtRes.map(r => r.join('')).filter(r => r.startsWith('v=spf1'));
  results.spf.records = spfRecords;
  results.spf.pass = spfRecords.length === 1;
  if (spfRecords.length > 1) results.spf.error = 'Multiple SPF records found - this will fail validation.';

  // 2. DMARC: Looking for v=DMARC1
  const dmarcRecords = dmarcRes.map(r => r.join('')).filter(r => r.startsWith('v=DMARC1'));
  results.dmarc.records = dmarcRecords;
  results.dmarc.pass = dmarcRecords.length > 0;

  // 3. MX: Just checking if records exist
  results.mx.records = mxRes;
  results.mx.pass = mxRes.length > 0;

  // 4. DKIM: Check using the provided or default selector
  const dkimRecords = dkimRes.map(r => r.join('')).filter(r => r.startsWith('v=DKIM1'));
  results.dkim.records = dkimRecords;
  results.dkim.pass = dkimRecords.length > 0;

  // 5. Tracking: Verify CNAME points to your platform
  if (trackingRes !== 'SKIP_TRACKING') {
    // Normalize by removing trailing DNS dot
    const foundCname = trackingRes[0]?.toLowerCase().replace(/\.$/, '');
    const target = expectedTrackingTarget?.toLowerCase().replace(/\.$/, '');

    results.tracking.value = foundCname || null;
    results.tracking.pass = !!foundCname && foundCname === target;

    if (foundCname && foundCname !== target) {
      results.tracking.error = `Configured correctly but points to ${foundCname} instead of ${target}`;
    }
  }

  return results;
};
