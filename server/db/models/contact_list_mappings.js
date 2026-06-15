module.exports = (sequelize, DataTypes) => {
  return sequelize.define('contact_list_mappings', {
    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    list_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },

    contact_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },

    created_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'contact_list_mappings',
    timestamps: false
  });
};
