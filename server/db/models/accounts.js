module.exports = (sequelize, DataTypes) => {
  return sequelize.define('accounts', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    status: {
      type: DataTypes.ENUM(
        'active',
        'trial',
        'deleted',
        'suspended',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'active'
    },

    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    },
    uuid: DataTypes.UUID,
    api_key: DataTypes.TEXT,
    api_key_created_at: DataTypes.DATE,
    custom_api_rate_limit: DataTypes.INTEGER,
  }, {
    tableName: 'accounts',
    timestamps: false
  });
};
