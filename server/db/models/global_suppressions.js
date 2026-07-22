module.exports = (sequelize, DataTypes) => {
  return sequelize.define('global_suppressions', {
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

    value: {
      type: DataTypes.STRING(320),
      allowNull: false
    },

    suppression_type: {
      type: DataTypes.ENUM(
        'UNSUBSCRIBE',
        'HARD_BOUNCE',
        'SOFT_BOUNCE',
        'MANUAL_BLOCK',
        'SPAM_COMPLAINT',
        'INVALID_EMAIL'
      ),
      allowNull: false
    },

    reason: {
      type: DataTypes.TEXT
    },

    seq_id: {
      type: DataTypes.BIGINT
    },

    step_id: {
      type: DataTypes.BIGINT
    },

    mailbox_id: {
      type: DataTypes.INTEGER
    },

    message_id: {
      type: DataTypes.TEXT
    },

    created_by: {
      type: DataTypes.INTEGER
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'global_suppressions',
    timestamps: false
  });
};
