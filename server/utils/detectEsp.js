const dns = require('dns').promises;

export const detectESP = async(input) => {
  if (!input) return 'OTHERS';

  // Extract domain
  const domain = input.includes('@') ? input.split('@').pop() : input;

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      // Promise that rejects after 5 seconds
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after 10 seconds: DNS lookup took too long for domain: ${domain}`));
        }, 10000); // 10 seconds
      })
    ]);

    const hosts = mxRecords.map(mx => mx.exchange.toLowerCase());

    if (hosts.some(h => h.includes('google.com') || h.includes('googlemail.com'))) {
      return 'GMAIL';
    } else if (hosts.some(h => h.includes('outlook.com') || h.includes('protection.outlook.com') || h.includes('office365.com'))) {
      return 'OUTLOOK';
    } else if (hosts.some(h => h.includes('zoho.'))) {
      return 'ZOHO';
    } else if (hosts.some(h => h.includes('yahoodns.net'))) {
      return 'YAHOO';
    } else {
      return 'OTHERS';
    }
  } catch (err) {
    return 'OTHERS';
  }
};

export const parseAndDetectESP = async(to) => {
  const pattern = /(?:"?([^"<]*)"?\s*)?<([^<>]+)>|([^,\s]+@[^,\s]+)/g;
  let results = [];
  let match;

  while ((match = pattern.exec(to)) !== null) {
    let name = '';
    let email = '';

    if (match[2]) {
      // Case: Name <email>
      name = match[1] ? match[1].trim() : '';
      email = match[2].trim();
    } else {
      // Case: just email
      email = match[3].trim();
    }

    const esp = await detectESP(email);
    results.push(`${name ? `${name} <${email}>` : email} | ${esp}`);
  }

  return results.join(', ');
};
