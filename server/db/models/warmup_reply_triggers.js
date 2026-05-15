module.exports = (sequelize, DataTypes) => {
  return sequelize.define('warmup_reply_triggers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    from_mailbox_id: {
      type: DataTypes.INTEGER
    },

    from_mailbox_email: {
      type: DataTypes.STRING(255)
    },

    to_mailbox_id: {
      type: DataTypes.INTEGER
    },

    to_mailbox_email: {
      type: DataTypes.STRING(255)
    },

    message_id: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    reply_time: {
      type: DataTypes.DATE
    },

    message_ref_id: {
      type: DataTypes.INTEGER
    },

    is_processing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    reply_count: {
      type: DataTypes.SMALLINT,
      defaultValue: 1
    }

  }, {
    tableName: 'warmup_reply_triggers',
    timestamps: false
  });
};
