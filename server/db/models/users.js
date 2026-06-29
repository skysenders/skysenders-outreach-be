module.exports = (sequelize, DataTypes) => {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    uuid: DataTypes.UUID,
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,
    email: DataTypes.STRING,
    name: DataTypes.STRING,
    password: DataTypes.TEXT,
    auth_provider: DataTypes.ENUM('email', 'google', 'microsoft'),
    role: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER', 'CLIENT'),
    status: DataTypes.ENUM('active', 'inactive', 'deleted', 'invited'),
    profile_url: DataTypes.STRING,

    last_reset_password_date: DataTypes.DATE,
    last_sent_password_link_date: DataTypes.DATE,
    signup_otp: DataTypes.STRING,

    trigger_product_tour: DataTypes.BOOLEAN,

    created_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,

    is_client: DataTypes.BOOLEAN
  }, {
    tableName: 'users',
    timestamps: false
  });
};
