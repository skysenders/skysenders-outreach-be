module.exports = (sequelize, DataTypes) => {
  return sequelize.define('warmup_sent_logs', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    workspace_id: {
      type: DataTypes.INTEGER
    },

    log_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    from_email: {
      type: DataTypes.STRING(255)
    },

    to_email: {
      type: DataTypes.STRING(255)
    },

    sent_time: {
      type: DataTypes.DATE
    },

    message_id: {
      type: DataTypes.TEXT
    },

    message_ref_id: {
      type: DataTypes.INTEGER
    }

  }, {
    tableName: 'warmup_sent_logs',
    timestamps: false
  });
};
