import { Container } from 'typedi';

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
      from: from,
      subject,
      cc,
      text,
      html
    };

    const sendEmailLambdaRes = await AwsService.invokeLambdaFunction('send-email-via-ses', msg);
    logger.info(`Email sent to ${toAddress} with response: ${JSON.stringify(sendEmailLambdaRes)}`);
    return true;
  } catch (err) {
    logger.error(`Error while sending email (${toAddress}) - ${err.message}`);
    return false;
  }
};

