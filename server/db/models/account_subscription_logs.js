module.exports = (sequelize, DataTypes) => {
  return sequelize.define('account_subscription_logs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,

    subscription_id: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    invoice_url: DataTypes.STRING,
    payment_status: DataTypes.STRING,

    subscription_items: DataTypes.JSONB,
    additional_info: DataTypes.JSONB,

    created_at: DataTypes.DATE
  }, {
    tableName: 'account_subscription_logs',
    timestamps: false
  });
};
