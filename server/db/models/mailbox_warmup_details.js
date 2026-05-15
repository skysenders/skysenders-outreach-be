module.exports = (sequelize, DataTypes) => {
  return sequelize.define('mailbox_warmup_details', {
    mailbox_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    status: {
      type: DataTypes.ENUM(
        'INACTIVE',
        'ACTIVE',
        'PAUSED',
        'BLOCKED',
        'COMPLETED'
      ),
      defaultValue: 'INACTIVE'
    },

    status_message: {
      type: DataTypes.TEXT
    },

    warmup_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    first_started_at: {
      type: DataTypes.DATE
    },

    created_at: {
      type: DataTypes.DATE
    },

    warmup_identifier: {
      type: DataTypes.STRING(20)
    },

    block_stage: {
      type: DataTypes.INTEGER
    },

    block_reason: {
      type: DataTypes.TEXT
    }

  }, {
    tableName: 'mailbox_warmup_details',
    timestamps: false,
  });
};
