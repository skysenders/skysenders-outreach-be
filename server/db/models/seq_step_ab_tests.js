module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_step_ab_tests', {
    step_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    is_ab_test_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    test_contacts_percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },

    winning_metric: {
      type: DataTypes.ENUM('OPEN_RATE', 'CLICK_RATE', 'REPLY_RATE')
    },

    fallback_variant_id: {
      type: DataTypes.INTEGER
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
    tableName: 'seq_step_ab_tests',
    timestamps: false,
  });
};
