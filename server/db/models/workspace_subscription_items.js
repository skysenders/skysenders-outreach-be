module.exports = (sequelize, DataTypes) => {
  return sequelize.define('workspace_subscription_items', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    workspace_id: DataTypes.INTEGER,

    subscription_id: DataTypes.STRING,
    subscription_item_id: DataTypes.STRING,

    item_plan_name: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    quantity: DataTypes.INTEGER,
    interval: DataTypes.STRING,

    created_at: DataTypes.DATE
  }, {
    tableName: 'workspace_subscription_items',
    timestamps: false
  });
};
