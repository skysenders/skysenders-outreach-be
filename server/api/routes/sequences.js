import { createSequence } from '../../controller/sequences/createSequence';
import { renameSequence } from '../../controller/sequences/renameSequence';
import { getSequenceById } from '../../controller/sequences/getSequenceById';
import { listSequences } from '../../controller/sequences/listSequences';
import { pauseSequence } from '../../controller/sequences/pauseSequence';
import { archiveSequence } from '../../controller/sequences/archiveSequence';
import { cloneSequence } from '../../controller/sequences/cloneSequence';
import { saveSequenceSteps } from '../../controller/sequences/saveSequenceSteps';
import { getSequenceSteps } from '../../controller/sequences/getSequenceSteps';
import { saveStepById } from '../../controller/sequences/saveStepById';
import { saveVariantById } from '../../controller/sequences/saveVariantById';
import { associateListToSequence } from '../../controller/sequences/associateListToSequence';
import { saveSequenceMailboxes } from '../../controller/sequences/saveSequenceMailboxes';
import { saveSequenceSettings } from '../../controller/sequences/saveSequenceSettings';
import { getSequenceContacts, getSequenceContactById } from '../../controller/sequences/getSequenceContacts';
import { getSequenceMailboxes } from '../../controller/sequences/getSequenceMailboxes';
import { getSequenceSettings } from '../../controller/sequences/getSequenceSettings';

// constants
import { SEQUENCE_STATUS, SEQUENCE_STEP_TYPES,
  SEQUENCE_STEP_DELAY_UNITS, SEQUENCE_STEP_CONDITION_TYPES,
  SEQUENCE_STEP_BRANCH_WINNING_METRICS } from '../../config/constants';

export default async function sequencesRoutes(fastify) {
  /*
  CREATE SEQUENCE
  */
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Create a new sequence',
        description: 'Initialize a new campaign sequence with a name',
        operationId: 'createSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              workspace_id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              total_no_of_seq: { type: 'number' },
              total_no_contacts: { type: 'number' },
              current_seq_no: { type: 'number' },
              total_no_days: { type: 'number' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          }
        }
      }
    },
    createSequence
  );

  /*
  RENAME SEQUENCE
  */
  fastify.patch(
    '/:id/rename',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Rename a sequence',
        description: 'Update the name of a specific sequence inside a workspace',
        operationId: 'renameSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              partner_id: { type: 'number' },
              workspace_id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    renameSequence
  );
  /*
  GET SEQUENCE BY ID
  */
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Get sequence by ID',
        description: 'Fetch complete details of a specific sequence for a workspace',
        operationId: 'getSequenceById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              partner_id: { type: 'number' },
              workspace_id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              last_status_details: { type: 'string' },
              total_no_of_seq: { type: 'number' },
              total_no_contacts: { type: 'number' },
              current_seq_no: { type: 'number' },
              total_no_days: { type: 'number' },
              first_started_at: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    getSequenceById
  );
  /*
  LIST SEQUENCES
  */
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'List sequences',
        description: 'Fetch all sequences for a workspace with search and pagination support',
        operationId: 'listSequences',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string' },
            status: {
              type: 'string',
              enum: Object.values(SEQUENCE_STATUS),
            },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', maximum: 100, default: 20 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_prev: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    uuid: { type: 'string' },
                    partner_id: { type: 'number' },
                    workspace_id: { type: 'number' },
                    name: { type: 'string' },
                    status: { type: 'string' },
                    total_no_of_seq: { type: 'number' },
                    total_no_contacts: { type: 'number' },
                    current_seq_no: { type: 'number' },
                    total_no_days: { type: 'number' },
                    first_started_at: { type: 'string' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    listSequences
  );
  /*
  PAUSE SEQUENCE
  */
  fastify.patch(
    '/:id/pause',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Pause a sequence',
        description: 'Transition an active sequence status to PAUSED',
        operationId: 'pauseSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    pauseSequence
  );
  /*
  ARCHIVE SEQUENCE
  */
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Archive a sequence',
        description: 'Soft delete a sequence from the workspace',
        operationId: 'archiveSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    archiveSequence
  );
  /*
  CLONE SEQUENCE
  */
  fastify.post(
    '/:id/clone',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Clone a sequence',
        description: 'Create a duplicate copy of an existing sequence with reset counters',
        operationId: 'cloneSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              partner_id: { type: 'number' },
              workspace_id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              total_no_of_seq: { type: 'number' },
              total_no_contacts: { type: 'number' },
              current_seq_no: { type: 'number' },
              total_no_days: { type: 'number' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    cloneSequence
  );

  /*
  SAVE SEQUENCE STEPS WITH RECURSIVE BRANCHING, VARIANTS & A/B TESTING
  */
  fastify.post(
    '/:id/steps',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Save sequence steps recursively',
        description: 'Orchestrates step ordering, recursive layout branching paths, variants mapping, and testing constraints.',
        operationId: 'saveSequenceSteps',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          required: ['steps'],
          properties: {
            archived_steps_id: {
              type: 'array',
              items: { type: 'integer' },
              default: []
            },
            steps: {
              type: 'array',
              items: {
                $ref: '#/definitions/stepSchema'
              }
            }
          },
          definitions: {
            stepSchema: {
              type: 'object',
              required: ['step_type'],
              properties: {
                id: { type: 'integer' },
                step_type: {
                  type: 'string',
                  enum: Object.values(SEQUENCE_STEP_TYPES)
                },

                // Variants Processing Config Array
                variants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      weight: { type: 'integer', default: 100 },
                      subject: { type: 'string' },
                      message: { type: 'string' },
                      notes: { type: 'string' }
                    }
                  }
                },

                archived_variants_id: { type: 'array', items: { type: 'integer' }, default: [] },

                delay_value: { type: 'integer', default: 0 },
                delay_unit: { type: 'string', enum: Object.values(SEQUENCE_STEP_DELAY_UNITS), default: SEQUENCE_STEP_DELAY_UNITS.DAYS },

                condition_type: { type: 'string', enum: Object.values(SEQUENCE_STEP_CONDITION_TYPES) },
                timeout_value: { type: 'integer' },
                timeout_unit: { type: 'string', enum: Object.values(SEQUENCE_STEP_DELAY_UNITS) },

                // A/B Testing Configuration Settings
                ab_test: {
                  type: 'object',
                  properties: {
                    is_ab_test_enabled: { type: 'boolean', default: false },
                    test_contacts_percentage: { type: 'integer', default: 100 },
                    winning_metric: { type: 'string', enum: Object.values(SEQUENCE_STEP_BRANCH_WINNING_METRICS) },
                    fallback_variant_id: { type: 'integer' }
                  }
                },

                // Nested Branch Tracking Payload Structure
                branches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['branch_key', 'steps'],
                    properties: {
                      branch_key: { type: 'string' },
                      steps: {
                        type: 'array',
                        items: { $ref: '#/definitions/stepSchema' }
                      }
                    }
                  }
                },
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    saveSequenceSteps
  );
  /*
  GET SEQUENCE STEPS WITH VARIANTS, BRANCHES AND A/B TESTS
  */
  fastify.get(
    '/:id/steps',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Get sequence steps',
        description: 'Fetch the complete recursive step tree for a sequence, including variants, branches, and A/B test configurations.',
        operationId: 'getSequenceSteps',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              $ref: '#/definitions/getStepSchema'
            },
            definitions: {
              getStepSchema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  seq_id: { type: 'integer' },
                  step_order: { type: 'integer' },
                  step_type: { type: 'string' },
                  parent_branch_id: { type: 'integer', nullable: true },
                  delay_value: { type: 'integer' },
                  delay_unit: { type: 'string' },
                  condition_type: { type: 'string', nullable: true },
                  timeout_value: { type: 'integer', nullable: true },
                  timeout_unit: { type: 'string', nullable: true },
                  variants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        label: { type: 'string' },
                        weight: { type: 'integer' },
                        subject: { type: 'string', nullable: true },
                        message: { type: 'string', nullable: true },
                        notes: { type: 'string', nullable: true }
                      }
                    }
                  },
                  ab_test: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      is_ab_test_enabled: { type: 'boolean' },
                      test_contacts_percentage: { type: 'integer' },
                      winning_metric: { type: 'string', nullable: true },
                      fallback_variant_id: { type: 'integer', nullable: true }
                    }
                  },
                  branches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        step_id: { type: 'integer' },
                        branch_key: { type: 'string' },
                        steps: {
                          type: 'array',
                          items: {
                            $ref: '#/definitions/getStepSchema'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        },
      }
    },
    getSequenceSteps
  );
  /*
  SAVE STEP BY ID WITH VARIANTS
  */
  fastify.put(
    '/:id/steps/:stepId',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Save step by ID with variants',
        description: 'Update metadata and upsert/archive variants for a specific sequence step.',
        operationId: 'saveStepById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id', 'stepId'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' },
            stepId: { type: 'integer', description: 'Step ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            delay_value: { type: 'integer' },
            delay_unit: { type: 'string', enum: Object.values(SEQUENCE_STEP_DELAY_UNITS), default: SEQUENCE_STEP_DELAY_UNITS.DAYS },
            condition_type: { type: 'string', enum: Object.values(SEQUENCE_STEP_CONDITION_TYPES) },
            timeout_value: { type: 'integer' },
            timeout_unit: { type: 'string', enum: Object.values(SEQUENCE_STEP_DELAY_UNITS), default: SEQUENCE_STEP_DELAY_UNITS.DAYS },
            archived_variants_id: {
              type: 'array',
              items: { type: 'integer' },
              default: []
            },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  weight: { type: 'integer', default: 100 },
                  subject: { type: 'string' },
                  message: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    saveStepById
  );
  /*
  SAVE VARIANT BY ID
  */
  fastify.put(
    '/:id/steps/:stepId/variants/:variantId',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Save variant by ID',
        description: 'Update text, subject line, or weight configurations for an individual template step variant.',
        operationId: 'saveVariantById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id', 'stepId', 'variantId'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' },
            stepId: { type: 'integer', description: 'Step ID' },
            variantId: { type: 'integer', description: 'Variant ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            weight: { type: 'integer', default: 100 },
            subject: { type: 'string' },
            message: { type: 'string' },
            notes: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    saveVariantById
  );
  /*
  ASSOCIATE LIST TO SEQUENCE
  */
  fastify.post(
    '/:id/lists',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Associate list and enroll contacts',
        description: 'Binds an existing contact list to a campaign sequence and enrolls all active contacts.',
        operationId: 'associateListToSequence',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        body: {
          type: 'object',
          required: ['list_ids'],
          properties: {
            list_ids: {
              type: 'array',
              items: { type: 'integer' },
              description: 'The source List IDs'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              enrolled_count: { type: 'integer' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            additionalProperties: true,
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    associateListToSequence
  );
  /*
  SAVE MAILBOXES TO SEQUENCE
  */
  fastify.post(
    '/:id/mailboxes',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Save mailboxes to sequence',
        description: 'Associates mailboxes with a sequence and handles soft-deletion of removed mailboxes.',
        operationId: 'saveSequenceMailboxes',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        body: {
          type: 'object',
          required: ['mailbox_ids'],
          properties: {
            mailbox_ids: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Array of Mailbox IDs to associate with the sequence'
            },
            archived_mailbox_ids: {
              type: 'array',
              items: { type: 'integer' },
              default: [],
              description: 'Array of Mailbox Mapping IDs or Mailbox IDs to soft delete'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              associated_count: { type: 'integer' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            additionalProperties: true,
            properties: {
              message: { type: 'string' },
            }
          }
        }
      }
    },
    saveSequenceMailboxes
  );
  /*
  SAVE SEQUENCE SETTINGS
  */
  fastify.put(
    '/:id/settings',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Save sequence settings',
        description: 'Flexibly updates sequence settings in seq_settings. Only fields provided in the body are updated.',
        operationId: 'saveSequenceSettings',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            new_contacts_per_day: { type: 'integer', description: 'Max new contacts to enter per day' },
            sending_schedule_id: { type: 'integer', description: 'Associated sending schedule ID' },
            stop_contact_when: {
              type: 'string',
              enum: ['ON_REPLY', 'ON_CLICK', 'ON_OPEN'],
              description: 'Condition to stop further step outreach'
            },
            variant_spintax_distribution: {
              type: 'string',
              enum: ['RANDOM', 'PATTERN'],
              description: 'Distribution strategy for variants and spintax'
            },
            stop_contact_on_company_level_reply: { type: 'boolean', description: 'Stop sequence if anyone from the same company replies' },
            follow_up_percent: { type: 'integer', description: 'Percentage of contacts to receive follow ups' },
            ai_categorisation: { type: 'boolean', description: 'Enable AI reply categorisation' },
            categories: { type: 'object', description: 'JSONB settings for AI categories' },
            ignore_ooo_category_reply: { type: 'boolean', description: 'Ignore out-of-office replies' },
            delay_reactivation_ooo_contact: { type: 'integer', description: 'Days to delay reactivation for OOO contacts' },
            send_plain_text: { type: 'boolean', description: 'Send emails in plain text format' },
            match_esp_contact: { type: 'boolean', description: 'Match ESP provider before sending' },
            block_previously_bounced_contact: { type: 'boolean', description: 'Block contacts that bounced in previous campaigns' },
            auto_optimize_ab_test: { type: 'boolean', description: 'Auto optimize winning A/B test variants' },
            pause_campaign_when_bounce_rate_at: { type: 'integer', description: 'Bounce rate percentage threshold to pause campaign' },
            include_unsubscribe_message: { type: 'boolean', description: 'Include unsubscribe message in emails' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    saveSequenceSettings
  );

  /*
  LIST CONTACTS BY SEQUENCE ID
  */
  fastify.get(
    '/:id/contacts',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'List sequence contacts',
        description: 'Fetch all contacts enrolled in a sequence with search and offset/limit pagination support',
        operationId: 'getSequenceContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string' },
            status: { type: 'string' },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', maximum: 100, default: 20 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_prev: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    contact_id: { type: 'number' },
                    contact_email: { type: 'string' },
                    status: { type: 'string' },
                    uuid: { type: 'string' },
                    seq_id: { type: 'number' },
                    list_id: { type: 'number' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' }
                  }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    getSequenceContacts
  );

  /*
  GET SINGLE SEQUENCE CONTACT BY ID
  */
  fastify.get(
    '/:id/contacts/:contactId',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Get single sequence contact by ID',
        description: 'Fetch details for a specific contact enrolled in a sequence.',
        operationId: 'getSequenceContactById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id', 'contactId'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' },
            contactId: { type: 'integer', description: 'Contact ID or Mapping ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              contact_id: { type: 'integer' },
              contact_email: { type: 'string' },
              first_name: { type: 'string', nullable: true },
              last_name: { type: 'string', nullable: true },
              status: { type: 'string' },
              seq_id: { type: 'integer' },
              list_id: { type: 'integer' },
              current_step_order: { type: 'integer', nullable: true },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    getSequenceContactById
  );
  /*
  LIST MAILBOXES BY SEQUENCE ID
  */
  fastify.get(
    '/:id/mailboxes',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'List sequence mailboxes',
        description: 'Fetch all mailboxes associated with a sequence with search and offset/limit pagination support',
        operationId: 'getSequenceMailboxes',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string' },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', maximum: 100, default: 20 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_prev: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    workspace_id: { type: 'number' },
                    seq_id: { type: 'number' },
                    mailbox_id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string', nullable: true },
                    status: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' }
                  }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    getSequenceMailboxes
  );
  /*
  GET SEQUENCE SETTINGS BY SEQUENCE ID
  */
  fastify.get(
    '/:id/settings',
    {
      schema: {
        tags: ['Sequences'],
        summary: 'Get sequence settings',
        description: 'Fetch configuration settings for a specific sequence from seq_settings.',
        operationId: 'getSequenceSettings',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Sequence ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              seq_id: { type: 'number' },
              new_contacts_per_day: { type: 'number' },
              sending_schedule_id: { type: 'number', nullable: true },
              stop_contact_when: { type: 'string', nullable: true },
              variant_spintax_distribution: { type: 'string', nullable: true },
              stop_contact_on_company_level_reply: { type: 'boolean' },
              follow_up_percent: { type: 'number' },
              ai_categorisation: { type: 'boolean' },
              categories: { type: 'object', nullable: true },
              ignore_ooo_category_reply: { type: 'boolean' },
              delay_reactivation_ooo_contact: { type: 'number', nullable: true },
              send_plain_text: { type: 'boolean' },
              match_esp_contact: { type: 'boolean' },
              block_previously_bounced_contact: { type: 'boolean' },
              auto_optimize_ab_test: { type: 'boolean' },
              pause_campaign_when_bounce_rate_at: { type: 'number', nullable: true },
              include_unsubscribe_message: { type: 'boolean' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } }
          }
        }
      }
    },
    getSequenceSettings
  );
}
