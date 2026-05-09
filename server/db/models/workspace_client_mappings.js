module.exports = (sequelize, DataTypes) => {
  return sequelize.define('workspace_client_mappings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    password: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'workspace_client_mappings',
    timestamps: false,
  });
};
