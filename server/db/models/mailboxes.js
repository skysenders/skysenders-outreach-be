module.exports = (sequelize, DataTypes) => {
  return sequelize.define('mailboxes', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    domain_id: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(255)
    },
    email: {
      type: DataTypes.STRING(320),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'ACTIVE',
        'DISCONNECTED',
        'DELETED',
        'SUSPENDED',
        'DISABLED'
      ),
    },
    provider: {
      type: DataTypes.ENUM(
        'SKY_SENDERS',
        'GMAIL',
        'OUTLOOK',
        'YAHOO',
        'ZOHO',
        'SMTP'
      ),
      allowNull: false
    },
    auth_type: {
      type: DataTypes.ENUM(
        'OAUTH',
        'SMTP_PASSWORD',
        'APP_PASSWORD'
      ),
      defaultValue: 'SMTP_PASSWORD'
    },
    is_authenticated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE
    },
    warmup_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    warmup_first_started_at: {
      type: DataTypes.DATE,
    },
    sending_limit_per_day: {
      type: DataTypes.INTEGER,
      defaultValue: 40
    },
    emails_sent_today: {
      type: DataTypes.INTEGER,
      defaultValue: 40
    },
    minimum_time_gap_mins: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    last_connected_at: {
      type: DataTypes.DATE
    },
    last_sync_at: {
      type: DataTypes.DATE
    },
    disconnect_reason: {
      type: DataTypes.JSONB
    },
    health_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    },
    different_reply_to: {
      type: DataTypes.STRING,
    },
    bcc_to_crm: {
      type: DataTypes.STRING,
    }
  }, {
    tableName: 'mailboxes',
    timestamps: false,
  });
};
