module.exports = (sequelize, DataTypes) => {
  return sequelize.define('lists', {
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

    total_contacts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    description: {
      type: DataTypes.STRING(512)
    },

    custom_fields_map: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    created_by: {
      type: DataTypes.INTEGER
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    },

    deleted_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'lists',
    timestamps: false
  });
};
