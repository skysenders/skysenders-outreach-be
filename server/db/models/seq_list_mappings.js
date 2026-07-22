module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_list_mappings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    seq_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    list_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    total_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    new_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    existing_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    blocked_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    skipped_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'seq_list_mappings',
    timestamps: false,
  });
};
