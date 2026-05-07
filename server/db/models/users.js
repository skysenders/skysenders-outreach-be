module.exports = (sequelize, DataTypes) => {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    uuid: DataTypes.UUID,
    partner_id: DataTypes.INTEGER,
    email: DataTypes.STRING,
    name: DataTypes.STRING,
    password: DataTypes.TEXT,
    status: DataTypes.ENUM('active', 'inactive', 'deleted', 'invited'),
    profile_url: DataTypes.STRING,
    timezone: DataTypes.STRING,

    last_reset_password_date: DataTypes.DATE,
    last_sent_password_link_date: DataTypes.DATE,
    signup_otp: DataTypes.STRING,

    trigger_product_tour: DataTypes.BOOLEAN,
    magic_link_expiry_date: DataTypes.DATE,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_deleted: DataTypes.BOOLEAN
  }, {
    tableName: 'users',
    timestamps: false
  });
};
