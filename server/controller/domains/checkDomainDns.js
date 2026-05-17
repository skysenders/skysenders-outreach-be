import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { TRACKING_DOMAIN_CNAME_TARGET } from '../../config/constants';
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

    const dnsResult = await DomainDNSConfigHelper.checkDomainDNSConfig(domain.domain_name,
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

      dns_errors: {
        spf: dnsResult.spf.error,
        dmarc: dnsResult.dmarc.error,
        mx: dnsResult.mx.error,
        dkim: dnsResult.dkim.error
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
