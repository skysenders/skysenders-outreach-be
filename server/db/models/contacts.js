module.exports = (sequelize, DataTypes) => {
  return sequelize.define('contacts', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },

    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(320),
      allowNull: false
    },

    esp_provider: {
      type: DataTypes.ENUM(
        'GMAIL',
        'OUTLOOK',
        'ZOHO',
        'YAHOO',
        'OTHERS'
      ),
      defaultValue: 'OTHERS'
    },

    first_name: {
      type: DataTypes.STRING(255)
    },

    last_name: {
      type: DataTypes.STRING(255)
    },

    phone: {
      type: DataTypes.STRING(50)
    },

    job_title: {
      type: DataTypes.STRING(255)
    },

    linkedin_url: {
      type: DataTypes.TEXT
    },

    company_name: {
      type: DataTypes.STRING(255)
    },

    city: {
      type: DataTypes.STRING(255)
    },

    state: {
      type: DataTypes.STRING(255)
    },

    country: {
      type: DataTypes.STRING(255)
    },

    custom_fields: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    unsubscribed_at: {
      type: DataTypes.DATE
    },

    bounced_at: {
      type: DataTypes.DATE
    },

    blocked_at: {
      type: DataTypes.DATE
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    },

    deleted_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'contacts',
    timestamps: false
  });
};
