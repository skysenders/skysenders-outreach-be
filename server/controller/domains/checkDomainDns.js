import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { TRACKING_DOMAIN_CNAME_TARGET } from '../../config/constants';
import { Op } from 'sequelize';
import { db } from '../../db';
/*
--------------------------------------------------
CHECK DOMAIN DNS CONFIG
--------------------------------------------------
*/
export const checkDomainDns = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');
  const DomainDNSConfigHelper = Container.get('DomainDNSConfigHelper');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  const { id } = req.params;

  if (!workspaceId) {
    logger.warn('Workspace not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace not found.'
    });
  }

  try {

    const domain = await DomainsModelHandler.getDomainByWhere({
      id,
      workspace_id: workspaceId,
      partner_id: partnerId
    });

    if (!domain) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Domain not found'
      });
    }

    const dnsResult = await DomainDNSConfigHelper.checkDomainDNSConfig(domain.domain_name, domain.provider,
      domain.dkim_selector, domain.tracking_domain_url, TRACKING_DOMAIN_CNAME_TARGET);

    /*
    -------------------------
    3. Compute DB update payload
    -------------------------
    */
    const updatePayload = {
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
    };

    // udpate tracking_domain_url pass/fail and error if tracking domain is configured
    if (domain.tracking_domain_url) {
      updatePayload.tracking_domain_pass = dnsResult.tracking.pass;
      if (!dnsResult.tracking.pass) {
        updatePayload.dns_errors.tracking = dnsResult.tracking.error;
      }
    }

    const updatedDomain = await DomainsModelHandler.updateDomain(
      updatePayload,
      {
        id,
        workspace_id: workspaceId,
        partner_id: partnerId
      }
    );

    return res.status(StatusCodes.OK).send({
      domain: updatedDomain,
      dns_result: dnsResult
    });

  } catch (error) {
    logger.error(`DNS check failed: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};

// Controller for checking bulk domain dns
export const bulkCheckDomainDns = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');
  const DomainDNSConfigHelper = Container.get('DomainDNSConfigHelper');

  const workspaceId = req.workspace.id;

  const { ids, search_text: searchText, provider, select_all: selectAll } = req.body;

  if (!workspaceId) {
    logger.warn('Workspace not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace not found.'
    });
  }

  try {

    const whereClause = {
      partner_id: req.user.tenant_id,
      workspace_id: workspaceId,
    };

    let isFilterSelected = false;

    if (searchText) {
      whereClause.domain_name = { [Op.iLike]: `%${searchText}%` };
      isFilterSelected = true;
    }

    if (provider) {
      whereClause.provider = provider;
      isFilterSelected = true;
    }

    if (ids && ids.length > 0) {
      whereClause.id = { [Op.in]: ids };
      isFilterSelected = true;
    }

    if (!isFilterSelected && !selectAll) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'At least one filter (ids, search_text, provider) must be provided unless select_all is true.'
      });
    }

    const domains = await DomainsModelHandler.getAllDomainsByWhere(whereClause);

    // send abck the response with dns_check_domains_count and message
    res.status(StatusCodes.OK).send({
      message: `Bulk DNS check in progress. Results will be updated shortly for ${domains.length} domains.`,
      dns_check_domains_count: domains.length
    });

    const BATCH_SIZE = 5;

    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
      // 1. Get the current batch of up to 5 domains
      const batch = domains.slice(i, i + BATCH_SIZE);

      // 2. Map each domain in the batch to a Promise
      const batchPromises = batch.map(async(domain) => {
        try {
          // Perform DNS check
          const dnsResult = await DomainDNSConfigHelper.checkDomainDNSConfig(
            domain.domain_name,
            domain.provider,
            domain.dkim_selector,
            domain.tracking_domain_url,
            TRACKING_DOMAIN_CNAME_TARGET
          );

          // Perform DB Update
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
        } catch (error) {
          // Handle or log error for an individual domain so it doesn't crash the whole batch
          console.error(`Error processing domain ${domain.domain_name}:`, error);
        }
      });

      // 3. Wait for all 5 operations in the current batch to complete before moving to the next batch
      await Promise.all(batchPromises);
    }

  } catch (error) {
    logger.error(`Bulk DNS check failed: ${error.message}`);
    if (!res.sent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: error.message
      });
    }
  }
};
