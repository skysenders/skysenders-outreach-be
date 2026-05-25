import { db } from '../index';
import { Container } from 'typedi';

export const getDomainByWhere = async(where) => {
  try {
    return await db.domains.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domain: ${err.message}`);
    throw err;
  }
};

export const getAllDomainsByWhere = async(where, offset, limit) => {
  try {
    return await db.domains.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domains: ${err.message}`);
    throw err;
  }
};

export const countDomainsByWhere = async(where) => {
  try {
    return await db.domains.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting domains: ${err.message}`);
    throw err;
  }
};

export const createDomain = async(data) => {
  try {
    return await db.domains.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating domain: ${err.message}`);
    throw err;
  }
};

export const updateDomain = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.domains.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating domain: ${err.message}`);
    throw err;
  }
};

export const deleteDomain = async(where) => {
  try {
    return await db.domains.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting domain: ${err.message}`);
    throw err;
  }
};

export const updateDomainDNSConfig = async(domain) => {
  try {
    const DomainDNSConfigHelper = Container.get('DomainDNSConfigHelper');
    const dnsResult = await DomainDNSConfigHelper.checkDomainDNSConfig(domain.domain_name);
    await db.domains.update({
      spf_pass: dnsResult.spf.pass,
      dmarc_pass: dnsResult.dmarc.pass,
      mx_pass: dnsResult.mx.pass,
      dkim_pass: dnsResult.dkim.pass,

      dns_errors: {
        spf: dnsResult.spf.error,
        dmarc: dnsResult.dmarc.error,
        mx: dnsResult.mx.error,
        dkim: dnsResult.dkim.error
      },

      dns_last_checked_at: new Date(),

      updated_at: new Date()
    }, {
      where: { id: domain.id }
    });
    return true;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating domain DNS config: ${err.message}`);
    return false;
  }
};

// create a new domain but on conflict do nothing and return the existing domain
export const createNewDomain = async(domain) => {
  try {
    const [newDomain, created] = await db.domains.findOrCreate({
      where: domain,
      defaults: domain,
      raw: true,
    });

    // if domain is created for the first time
    // then check for its DNS config and update the record
    //  otherwise return the existing record
    if (created) {
      updateDomainDNSConfig(newDomain);
    }

    return newDomain;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating new domain: ${err.message}`);
    throw err;
  }
};
