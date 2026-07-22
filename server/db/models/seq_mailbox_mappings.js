module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_mailbox_mappings', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    seq_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    mailbox_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'seq_mailbox_mappings',
    timestamps: false,
  });
};
