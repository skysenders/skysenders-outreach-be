import { QueryTypes } from 'sequelize';
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

export const getDomainWithAttribute = async(where, attributes) => {
  try {
    return await db.domains.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domain: ${err.message}`);
    throw err;
  }
};

export const getAllDomainsByWhere = async(where, offset = 0, limit = 1000) => {
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
    const dnsResult = await DomainDNSConfigHelper.checkDomainDNSConfig(domain.domain_name, domain.provider);
    await db.domains.update({
      spf_pass: dnsResult.spf.pass,
      dmarc_pass: dnsResult.dmarc.pass,
      mx_pass: dnsResult.mx.pass,
      dkim_pass: dnsResult.dkim.pass,
      tracking_domain_pass: dnsResult.tracking.pass,
      dns_errors: {
        spf: dnsResult.spf.error,
        dmarc: dnsResult.dmarc.error,
        mx: dnsResult.mx.error,
        dkim: dnsResult.dkim.error,
        tracking: dnsResult.tracking.error
      },
      dns_value: {
        spf: dnsResult.spf.values,
        dmarc: dnsResult.dmarc.values,
        mx: dnsResult.mx.values,
        dkim: dnsResult.dkim.values,
        tracking: dnsResult.tracking.values
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

export const softDeleteDomain = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.domains.update(
      {
        is_deleted: true,
        deleted_at: new Date(),
        updated_at: new Date()
      },
      { where, returning: ['id', 'domain_name'], }
    );
    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting domain: ${err.message}`);
    throw err;
  }
};

export const getDomainOverallStatus = async(partnerId, workspaceId) => {
  try {
    const domains = await db.sequelize.query(
      `SELECT 
        count(id) AS connected_count,
        count(CASE WHEN mx_pass = false OR dkim_pass = false OR spf_pass = false OR dmarc_pass = false THEN 1 END) AS authentication_error_count
      FROM domains
      WHERE partner_id = :partner_id AND workspace_id = :workspace_id`,
      {
        replacements: { partner_id: partnerId, workspace_id: workspaceId },
        type: QueryTypes.SELECT,
        raw: true
      }
    );
    return domains[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domain overall status: ${err.message}`);
    throw err;
  }
};
