const dns = require('dns').promises;

const TTL = 2 * 60 * 60 * 1000; // 2 hours

const espDomainCache = new Map();
// domain -> { value: 'GMAIL', expiresAt: number }

const getCachedESP = (domain) => {
  const cached = espDomainCache.get(domain);

  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    espDomainCache.delete(domain);
    return null;
  }

  return cached.value;
};

const setCachedESP = (domain, value) => {
  espDomainCache.set(domain, {
    value,
    expiresAt: Date.now() + TTL
  });
};

const findEspFromHosts = (hosts) => {
  let esp = 'OTHERS';

  if (hosts.some(h =>
    h.includes('google.com') ||
      h.includes('googlemail.com')
  )) {
    esp = 'GMAIL';

  } else if (hosts.some(h =>
    h.includes('outlook.com') ||
      h.includes('protection.outlook.com') ||
      h.includes('office365.com')
  )) {
    esp = 'OUTLOOK';

  } else if (hosts.some(h => h.includes('zoho.'))) {
    esp = 'ZOHO';

  } else if (hosts.some(h => h.includes('yahoodns.net'))) {
    esp = 'YAHOO';
  }

  return esp;
};

export const detectESP = async(input) => {
  if (!input) return 'OTHERS';

  const domain = input.includes('@')
    ? input.split('@').pop().toLowerCase()
    : input.toLowerCase();

  // 1. check cache
  const cached = getCachedESP(domain);
  if (cached) return cached;

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`DNS timeout for domain: ${domain}`));
        }, 10000);
      })
    ]);

    const hosts = mxRecords.map(mx => mx.exchange.toLowerCase());
    const esp = findEspFromHosts(hosts);

    setCachedESP(domain, esp);
    return esp;

  } catch (err) {
    setCachedESP(domain, 'OTHERS');
    return 'OTHERS';
  }
};

const extractDomain = (email) => {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed.split('@').pop() : null;
};

export const detectBulkESP = async(emails = []) => {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      return {};
    }

    // 1. Extract domains
    const emailToDomain = new Map();
    const uniqueDomains = new Set();

    for (const email of emails) {
      const domain = extractDomain(email);
      if (!domain) continue;

      emailToDomain.set(email, domain);
      uniqueDomains.add(domain);
    }

    // 2. Resolve ESP for UNIQUE domains only
    const domainResults = new Map();

    await Promise.all(
      Array.from(uniqueDomains).map(async(domain) => {
        try {
        // check cache first
          const cached = getCachedESP(domain);
          if (cached) {
            domainResults.set(domain, cached);
            return;
          }

          const mxRecords = await Promise.race([
            dns.resolveMx(domain),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('DNS timeout')), 10000)
            )
          ]);

          const hosts = mxRecords.map(mx => mx.exchange.toLowerCase());
          const esp = findEspFromHosts(hosts);

          setCachedESP(domain, esp);
          domainResults.set(domain, esp);

        } catch (err) {
          setCachedESP(domain, 'OTHERS');
          domainResults.set(domain, 'OTHERS');
        }
      })
    );

    // 3. Map back to emails
    const result = {};

    for (const email of emails) {
      const domain = emailToDomain.get(email);
      if (!domain) {
        result[email] = 'OTHERS';
        continue;
      }

      result[email] = domainResults.get(domain) || 'OTHERS';
    }

    return result;
  } catch (err) {
    console.error('Error in detectBulkESP:', err);
    return {};
  }
};
