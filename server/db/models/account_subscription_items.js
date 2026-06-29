module.exports = (sequelize, DataTypes) => {
  return sequelize.define('account_subscription_items', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,

    subscription_id: DataTypes.STRING,
    subscription_item_id: DataTypes.STRING,
    item_plan_name: DataTypes.STRING,

    amount: DataTypes.DECIMAL(10, 2),
    quantity: DataTypes.INTEGER,
    interval: DataTypes.STRING,

    created_at: DataTypes.DATE
  }, {
    tableName: 'account_subscription_items',
    timestamps: false
  });
};
