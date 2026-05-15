module.exports = (sequelize, DataTypes) => {
  return sequelize.define('mailbox_credentials', {
    mailbox_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    email: {
      type: DataTypes.STRING(320),
      allowNull: false
    },

    access_token: {
      type: DataTypes.TEXT
    },

    refresh_token: {
      type: DataTypes.TEXT
    },

    token_expiry: {
      type: DataTypes.DATE
    },

    last_token_refresh_at: {
      type: DataTypes.DATE
    },

    smtp_host: {
      type: DataTypes.STRING(255)
    },

    smtp_port: {
      type: DataTypes.INTEGER
    },

    smtp_username: {
      type: DataTypes.STRING(320)
    },

    smtp_password: {
      type: DataTypes.TEXT
    },

    smtp_secure: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    imap_host: {
      type: DataTypes.STRING(255)
    },

    imap_port: {
      type: DataTypes.INTEGER
    },

    imap_username: {
      type: DataTypes.STRING(320)
    },

    imap_password: {
      type: DataTypes.TEXT
    },

    imap_secure: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'mailbox_credentials',
    timestamps: false
  });
};
