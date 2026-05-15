module.exports = (sequelize, DataTypes) => {
  return sequelize.define('warmup_trigger_details', {
    mailbox_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    daily_target: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },

    sent_today: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    next_send_time: {
      type: DataTypes.DATE
    },

    reply_rate: {
      type: DataTypes.SMALLINT,
      validate: {
        max: 100
      }
    },

    schedule_timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },

    last_sent_at: {
      type: DataTypes.DATE
    },

    last_reset_at: {
      type: DataTypes.DATE
    },

    is_processing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'warmup_trigger_details',
    timestamps: false
  });
};
