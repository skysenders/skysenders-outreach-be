module.exports = (sequelize, DataTypes) => {
  return sequelize.define('account_plan_details', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,

    plan_name: DataTypes.STRING,

    trial_start_date: DataTypes.DATE,
    trial_end_date: DataTypes.DATE,

    plan_start_date: DataTypes.DATE,
    plan_end_date: DataTypes.DATE,

    max_leads_count: DataTypes.INTEGER,
    max_mailbox_count: DataTypes.INTEGER,

    email_credits: DataTypes.INTEGER,
    email_credits_used: DataTypes.INTEGER,

    last_reset_date: DataTypes.DATE,

    has_api_access: DataTypes.BOOLEAN,
    is_sub_active: DataTypes.BOOLEAN,
    is_payment_failed: DataTypes.BOOLEAN,

    reason_for_unsubscribe: DataTypes.TEXT,

    billing_details: DataTypes.JSONB,
    custom_plan_details: DataTypes.JSONB,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'account_plan_details',
    timestamps: false
  });
};
