module.exports = (sequelize, DataTypes) => {
  return sequelize.define('partner_sessions', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },

    partner_id: DataTypes.INTEGER,

    refresh_token: DataTypes.TEXT,

    user_agent: DataTypes.TEXT,
    ip_address: DataTypes.TEXT,

    is_active: DataTypes.BOOLEAN,

    expires_at: DataTypes.DATE,

    revoked_at: DataTypes.DATE,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE

  }, {
    tableName: 'partner_sessions',
    timestamps: false
  });
};
