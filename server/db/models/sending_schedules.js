module.exports = (sequelize, DataTypes) => {
  return sequelize.define('sending_schedules', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    partner_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    workspace_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    timezone: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    use_contact_timezone: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    skip_holidays: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    holiday_country_code: {
      type: DataTypes.STRING(2)
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    created_by: {
      type: DataTypes.INTEGER
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    },

    deleted_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'sending_schedules',
    timestamps: false
  });
};
