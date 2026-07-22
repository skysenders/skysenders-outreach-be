module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_step_variants', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    step_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    label: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },

    subject: {
      type: DataTypes.TEXT
    },

    message: {
      type: DataTypes.TEXT
    },

    notes: {
      type: DataTypes.TEXT
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
    },

    deleted_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'seq_step_variants',
    timestamps: false,
  });
};
