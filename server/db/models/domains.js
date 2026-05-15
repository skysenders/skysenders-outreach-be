module.exports = (sequelize, DataTypes) => {
  return sequelize.define('domains', {
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

    domain_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    provider: {
      type: DataTypes.ENUM(
        'SKY_SENDERS',
        'GMAIL',
        'OUTLOOK',
        'YAHOO',
        'ZOHO',
        'SMTP'
      )
    },

    health_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100
    },

    dkim_selector: {
      type: DataTypes.STRING(50)
    },

    tracking_domain_url: {
      type: DataTypes.STRING(100)
    },

    spf_pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    dkim_pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    dmarc_pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    mx_pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    tracking_domain_pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    dns_last_checked_at: {
      type: DataTypes.DATE
    },

    dns_errors: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'domains',
    timestamps: false,
  });
};
