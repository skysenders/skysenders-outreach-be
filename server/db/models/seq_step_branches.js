module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_step_branches', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    step_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    branch_key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'seq_step_branches',
    timestamps: false,
  });
};
