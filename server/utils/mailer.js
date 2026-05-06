import { Container } from 'typedi';
import { SES_FROM_MAIL } from '../config/constants';

/**
 * Functionality used to send mail using sendgrid
 * @param {*} toAddress mail address
 * @returns {Boolean} true or false
 */
export const sendMail = async({toAddress, cc, from, subject, text, html})=>{
  const logger = Container.get('logger');
  const AwsService = Container.get('AwsService');
  try {
    const msg = {
      to: toAddress,
      from: from || `Support <${SES_FROM_MAIL}>`,
      subject,
      cc,
      text,
      html
    };

    const sendEmailLambdaRes = await AwsService.invokeLambdaFunction('send-email-via-ses', msg);
    console.log('Send email lambda response for sending email: ', sendEmailLambdaRes);
    return true;
  } catch (err) {
    logger.error(`Error while sending email (${toAddress}) - ${err.message}`);
    return false;
  }
};

