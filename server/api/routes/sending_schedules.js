import { listSendingSchedules } from '../../controller/sending_schedules/listSendingSchedules';
import { getSendingScheduleById } from '../../controller/sending_schedules/getSendingScheduleById';
import { createSendingSchedule } from '../../controller/sending_schedules/createSendingSchedule';
import { updateSendingSchedule } from '../../controller/sending_schedules/updateSendingSchedule';
import { deleteSendingSchedule } from '../../controller/sending_schedules/deleteSendingSchedule';

export default async function domainsRoutes(fastify) {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Sending Schedules'],
        summary: 'List sending schedules',
        description: 'Fetch all sending schedules for a workspace',
        operationId: 'listSendingSchedules',
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
            is_active: { type: 'boolean' },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
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
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    timezone: { type: 'string' },
                    use_contact_timezone: { type: 'boolean' },
                    skip_holidays: { type: 'boolean' },
                    holiday_country_code: { type: 'string' },
                    is_active: { type: 'boolean' },
                    created_by: { type: 'integer' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                    windows: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          day_of_week: { type: 'integer' },
                          start_time: { type: 'string' },
                          end_time: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    listSendingSchedules
  );
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Sending Schedules'],
        summary: 'Get sending schedule by id',
        description: 'Fetch a single sending schedule with its windows',
        operationId: 'getSendingScheduleById',
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
            id: {
              type: 'integer'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {

              id: { type: 'integer' },
              name: { type: 'string' },
              timezone: { type: 'string' },
              use_contact_timezone: { type: 'boolean' },
              skip_holidays: { type: 'boolean' },
              holiday_country_code: { type: ['string', 'null'] },
              is_active: { type: 'boolean' },
              created_by: { type: ['integer', 'string', 'null'] },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              windows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    schedule_id: { type: 'integer' },
                    day_of_week: { type: 'integer' },
                    start_time: { type: 'string' },
                    end_time: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    getSendingScheduleById
  );
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Sending Schedules'],
        summary: 'Create sending schedule',
        operationId: 'createSendingSchedule',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['name', 'timezone', 'windows'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255
            },
            timezone: {
              type: 'string'
            },
            use_contact_timezone: {
              type: 'boolean',
              default: false
            },
            skip_holidays: {
              type: 'boolean',
              default: false
            },
            holiday_country_code: {
              type: ['string', 'null'],
              minLength: 2,
              maxLength: 2
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            windows: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: [
                  'day_of_week',
                  'start_time',
                  'end_time'
                ],
                properties: {
                  day_of_week: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 6
                  },
                  start_time: {
                    type: 'string'
                  },
                  end_time: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              timezone: { type: 'string' },
              use_contact_timezone: { type: 'boolean' },
              skip_holidays: { type: 'boolean' },
              holiday_country_code: { type: 'string' },
              is_active: { type: 'boolean' },
              created_by: { type: 'integer' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              windows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    day_of_week: { type: 'integer' },
                    start_time: { type: 'string' },
                    end_time: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    createSendingSchedule
  );

  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Sending Schedules'],
        summary: 'Update sending schedule',
        description: 'Update a sending schedule and replace all schedule windows',
        operationId: 'updateSendingSchedule',
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
            id: {
              type: 'integer'
            }
          }
        },
        body: {
          type: 'object',
          required: ['name', 'timezone', 'windows'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255
            },
            timezone: {
              type: 'string'
            },
            use_contact_timezone: {
              type: 'boolean',
              default: false
            },
            skip_holidays: {
              type: 'boolean',
              default: false
            },
            holiday_country_code: {
              type: ['string', 'null'],
              minLength: 2,
              maxLength: 2
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            windows: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['day_of_week', 'start_time', 'end_time'],
                properties: {
                  day_of_week: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 6
                  },
                  start_time: {
                    type: 'string',
                  },
                  end_time: {
                    type: 'string',
                  }
                }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  timezone: { type: 'string' },
                  use_contact_timezone: { type: 'boolean' },
                  skip_holidays: { type: 'boolean' },
                  holiday_country_code: {
                    type: ['string', 'null']
                  },
                  is_active: { type: 'boolean' },
                  created_by: {
                    type: ['integer', 'string', 'null']
                  },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  windows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        schedule_id: { type: 'integer' },
                        day_of_week: { type: 'integer' },
                        start_time: { type: 'string' },
                        end_time: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    updateSendingSchedule
  );
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Sending Schedules'],
        summary: 'Delete sending schedule',
        description: 'Delete a sending schedule by id (cascade deletes windows)',
        operationId: 'deleteSendingSchedule',
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
            id: {
              type: 'integer'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
    deleteSendingSchedule
  );

}
