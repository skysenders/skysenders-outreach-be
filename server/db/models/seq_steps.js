module.exports = (sequelize, DataTypes) => {
  return sequelize.define('seq_steps', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    seq_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    step_type: {
      type: DataTypes.ENUM(
        'EMAIL',
        'LINKEDIN_VISIT_PROFILE',
        'LINKEDIN_CONNECTION_REQUEST',
        'LINKEDIN_MESSAGE',
        'LINKEDIN_INMAIL',
        'LINKEDIN_LIKE_POST',
        'CONDITION',
        'STOP_CONTACT',
        'MARK_CONTACT_COMPLETED',
        'PUSH_TO_SUB_SEQUENCE'
      ),
      allowNull: false
    },

    parent_branch_id: {
      type: DataTypes.INTEGER
    },

    delay_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    delay_unit: {
      type: DataTypes.ENUM('MINUTES', 'HOURS', 'DAYS'),
      defaultValue: 'DAYS'
    },

    condition_type: {
      type: DataTypes.ENUM(
        'EMAIL_OPENED',
        'EMAIL_CLICKED',
        'SPECIFIC_LINK_CLICKED',
        'EMAIL_REPLIED',
        'LINKEDIN_CONNECTION_ACCEPTED'
      )
    },

    step_used_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    timeout_value: {
      type: DataTypes.INTEGER
    },

    timeout_unit: {
      type: DataTypes.ENUM('MINUTES', 'HOURS', 'DAYS')
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    deleted_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'seq_steps',
    timestamps: false,
  });
};
