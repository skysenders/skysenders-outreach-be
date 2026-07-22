module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_contact_mappings', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    seq_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    contact_email: {
      type: DataTypes.STRING(320)
    },

    mailbox_email: {
      type: DataTypes.STRING(320)
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    current_step_id: {
      type: DataTypes.INTEGER
    },

    current_step_number: {
      type: DataTypes.INTEGER
    },

    status: {
      type: DataTypes.ENUM(
        'NOT_STARTED',
        'ACTIVE',
        'STOPPED',
        'COMPLETED',
        'FAILED',
        'UNSUBSCRIBED',
        'BOUNCED',
        'REPLIED'
      ),
      allowNull: false,
      defaultValue: 'NOT_STARTED'
    },

    status_details: {
      type: DataTypes.TEXT
    },

    next_execution_at: {
      type: DataTypes.DATE
    },

    last_executed_at: {
      type: DataTypes.DATE
    },

    last_sent_at: {
      type: DataTypes.DATE
    },

    last_reply_at: {
      type: DataTypes.DATE
    },

    last_sent_subject: {
      type: DataTypes.TEXT
    },

    last_sent_message: {
      type: DataTypes.TEXT
    },

    sent_message_ids: {
      type: DataTypes.JSONB
    }

  }, {
    tableName: 'seq_contact_mappings',
    timestamps: false,
  });
};
