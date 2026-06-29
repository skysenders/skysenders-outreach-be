module.exports = (sequelize, DataTypes) => {
  return sequelize.define('account_subscriptions', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,

    customer_id: DataTypes.STRING,
    subscription_id: DataTypes.STRING,
    plan_name: DataTypes.STRING,

    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,

    is_active: DataTypes.BOOLEAN,
    is_inr_payment: DataTypes.BOOLEAN,

    payment_method_id: DataTypes.STRING,
    payment_status: DataTypes.JSONB,
    payment_card_details: DataTypes.JSONB,
    last_invoice_url: DataTypes.STRING,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'account_subscriptions',
    timestamps: false
  });
};
