import Container from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { VALID_EMAIL_REGEX } from '../../config/constants';

export const importContacts = async(req, reply) => {
  const logger = Container.get('logger');
  const ListImportJobsModelHandler = Container.get('ListImportJobsModelHandler');
  const GlobalSuppressionsModelHandler = Container.get('GlobalSuppressionsModelHandler');
  const DetectESPHelper = Container.get('DetectESPHelper');
  const ContactsModelHandler = Container.get('ContactsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.workspace.partner_id;

  const {
    list_id: listId,
    source,
    merge_strategy: mergeStrategy,
    contacts = []
  } = req.body;

  try {
    // 1. Create Import Job (ONLY metadata, no processing)
    const job = await ListImportJobsModelHandler.createListImportJob({
      partner_id: partnerId,
      workspace_id: workspaceId,
      list_id: listId,
      source,
      import_settings: { mergeStrategy },
      total_rows: contacts.length,
      created_by: req.user.id,
      started_at: new Date().toISOString()
    });

    // return the response with job id
    reply.status(StatusCodes.OK).send({
      job_id: job.id,
      status: job.status,
      total_rows: contacts.length
    });

    const resultSummary = {
      total_rows: contacts.length,
      processed_rows: 0,
      valid_count: 0,
      unsubscribed_count: 0,
      bounced_count: 0,
      blocked_count: 0,
      invalid_count: 0,
      duplicate_count: 0,
      already_existing_count: 0
    };

    const inputEmailMaps = new Set();

    for (let i = 0; i < contacts.length; i += 1000) {
      // split contacts into batches of 1000 to avoid memory issues and for better performance
      const batch = contacts.slice(i, i + 1000);
      const globalSuppressionsEmailList = [];

      // normalize emails in batch and skip invalid or duplicate emails
      batch.forEach(contact => {
        // check email is not empty
        if (contact.email) {
          contact.email = contact.email.trim().toLowerCase();
          // check if the email is valid or not. If not valid, mark as invalid and skip further processing
          if (!VALID_EMAIL_REGEX.test(contact.email)) {
            resultSummary.invalid_count += 1;
            contact.skip = true; // mark as invalid to skip later
            // check duplicate emails
          } else if (inputEmailMaps.has(contact.email)) {
            resultSummary.duplicate_count += 1;
            contact.skip = true;
          } else {
            inputEmailMaps.add(contact.email);
            globalSuppressionsEmailList.push(contact.email);
          }
        } else {
          resultSummary.invalid_count += 1;
          contact.skip = true; // mark as invalid to skip later
        }
      });

      // check for these emails in global_suppressions and filter out
      const [ globalSuppressions, espProviderEmailMap ] = await Promise.all([
        GlobalSuppressionsModelHandler.getGlobalSuppressionByWhere({
          workspace_id: workspaceId,
          email: globalSuppressionsEmailList
        }),
        DetectESPHelper.detectBulkESP(globalSuppressionsEmailList)
      ]);

      // frame a map for quick lookup
      const globalSuppressionMap = {};
      globalSuppressions.forEach(suppression => {
        if (globalSuppressionMap[suppression.email]) {
          globalSuppressionMap[suppression.email][suppression.suppression_type] = suppression.created_at;
        } else {
          globalSuppressionMap[suppression.email] = { [suppression.suppression_type]: suppression.created_at };
        }
      });

      // frame the bulk insert contact objects based on merge strategy and suppression check
      const contactsToUpsert = [];

      await Promise.all(batch.map((contact) => {
        // skip invalid emails
        if (contact.skip) {
          return;
        }

        const suppressionInfo = globalSuppressionMap[contact.email];

        const contactObj = {
          partner_id: partnerId,
          workspace_id: workspaceId,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone,
          job_title: contact.job_title,
          linkedin_url: contact.linkedin_url,
          company_name: contact.company_name,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          custom_fields: contact.custom_fields,
          unsubscribed_at: suppressionInfo?.UNSUBSCRIBE || null,
          bounced_at: suppressionInfo?.HARD_BOUNCE || suppressionInfo?.SOFT_BOUNCE || null,
          blocked_at: suppressionInfo?.MANUAL_BLOCK || suppressionInfo?.SPAM_COMPLAINT || null,
          esp_provider: espProviderEmailMap[contact.email] || 'OTHERS',
          list_id: listId
        };

        // increment the result count
        resultSummary.processed_rows += 1;
        if (suppressionInfo?.UNSUBSCRIBE) {
          resultSummary.unsubscribed_count += 1;
        } else if (suppressionInfo?.HARD_BOUNCE || suppressionInfo?.SOFT_BOUNCE) {
          resultSummary.bounced_count += 1;
        } else if (suppressionInfo?.MANUAL_BLOCK || suppressionInfo?.SPAM_COMPLAINT) {
          resultSummary.blocked_count += 1;
        } else if (suppressionInfo?.INVALID_EMAIL) {
          resultSummary.invalid_count += 1;
        } else {
          resultSummary.valid_count += 1;
        }
        contactsToUpsert.push(contactObj);
      }));

      const bulkCreateResult = await ContactsModelHandler.bulkCreateContacts(contactsToUpsert);
      // check if the contact was newly created or updated
      // if updated then update already_existing_count
      for (const eachContact of bulkCreateResult[0]) {
        if (eachContact?.xmax > 0) {
          resultSummary.already_existing_count += 1;
        }
      }

      // update the job summary after every batch
      await ListImportJobsModelHandler.updateListImportJob(
        {
          ...resultSummary,
          status: i + 1000 >= contacts.length ? 'COMPLETED' : 'PROCESSING',
          updated_at: new Date()
        },
        { id: job.id }
      );
    }

  } catch (err) {
    logger.error('Import Contacts Failed', {
      error: err.message,
      stack: err.stack
    });
    if (!reply.sent) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: 'Failed to start import job'
      });
    }
  }
};
