module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_settings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    seq_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    new_contacts_per_day: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },

    sending_schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    stop_contact_when: {
      type: DataTypes.ENUM('ON_REPLY', 'ON_CLICK', 'ON_OPEN')
    },

    variant_spintax_distribution: {
      type: DataTypes.ENUM('RANDOM', 'PATTERN')
    },

    stop_contact_on_company_level_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    follow_up_percent: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },

    ai_categorisation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    categories: {
      type: DataTypes.JSONB
    },

    ignore_ooo_category_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    delay_reactivation_ooo_contact: {
      type: DataTypes.INTEGER
    },

    send_plain_text: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    match_esp_contact: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    block_previously_bounced_contact: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    auto_optimize_ab_test: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    pause_campaign_when_bounce_rate_at: {
      type: DataTypes.INTEGER
    },

    include_unsubscribe_message: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'seq_settings',
    timestamps: false,
  });
};
