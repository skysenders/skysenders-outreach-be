module.exports = (sequelize, DataTypes) => {
  return sequelize.define('mailbox_block_history', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    created_at: {
      type: DataTypes.DATE
    },

    mailbox_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    message_id: {
      type: DataTypes.TEXT
    },

    status: {
      type: DataTypes.TEXT
    },

    message: {
      type: DataTypes.TEXT
    },

    error_details: {
      type: DataTypes.JSONB
    }

  }, {
    tableName: 'mailbox_block_history',
    timestamps: false
  });
};
