import { get, join, split } from 'lodash';

export const getFormattedEmail = (email) => {
  /** Here, we remove dot and + if added in the email and re-use it
   * in the signup process to confirm if the user is not using the same
   * email to signup.
   */
  // split the name and domain
  const splittedEmail = split(email, '@');

  // extract name and replace all the dots with an empty string
  const noDotName = (splittedEmail[0] || '').replace(/\./g, '');

  splittedEmail[0] = get(split(noDotName, '+'), '[0]', '');

  // The formatted email has no dot and +, join with @
  const formattedEmail = join(splittedEmail, '@');

  return formattedEmail;
};
