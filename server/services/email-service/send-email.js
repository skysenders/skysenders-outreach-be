import handlebars from 'handlebars';
// mailer service
import * as SendEmailUtils from '../../utils/mailer.js';
// email templates
import * as signupTemplate from './templates/signup.js';
import * as forgotPasswordTemplate from './templates/forgot-password.js';
import * as subscriptionFailureTemplate from './templates/subscription-failure.js';
import * as inviteExistingTeamMemberTemplate from './templates/invite-existing-team-member.js';
import * as inviteNewTeamMemberTemplate from './templates/invite-new-team-member.js';
import { EMAIL_TEMPLATE_NAME } from '../../config/constants';

const templates = {
  [EMAIL_TEMPLATE_NAME.SIGNUP]: signupTemplate,
  [EMAIL_TEMPLATE_NAME.FORGOT_PASSWORD]: forgotPasswordTemplate,
  [EMAIL_TEMPLATE_NAME.SUBSCRIPTION_FAILURE]: subscriptionFailureTemplate,
  [EMAIL_TEMPLATE_NAME.INVITE_EXISTING_TEAM_MEMBER]: inviteExistingTeamMemberTemplate,
  [EMAIL_TEMPLATE_NAME.INVITE_NEW_TEAM_MEMBER]: inviteNewTeamMemberTemplate
};

const getFromAddress = (partnerId) => {
  // skysenders
  if (partnerId === 1) {
    return 'Sky Senders <noreply@skysendershq.com>';
  }
  // all others
  return 'Sky Senders <noreply@skysendershq.com>';
};

export const sendMail = async({
  partnerId,
  type,
  to,
  cc = [],
  data,
}) => {

  const template = templates[type];

  if (!template) {
    throw new Error('Invalid email type');
  }

  const compiledSubject = handlebars.compile(template.subject);
  const compiledBody = handlebars.compile(template.body);

  const subject = compiledSubject(data);
  const html = compiledBody(data);

  const from = getFromAddress(partnerId);

  await SendEmailUtils.sendMail({
    from,
    toAddress: to,
    cc,
    subject,
    html
  });
};
