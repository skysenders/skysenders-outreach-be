module.exports = (sequelize, DataTypes) => {
  return sequelize.define('warmup_profile_details', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING(100)
    },

    start_value: {
      type: DataTypes.SMALLINT,
      defaultValue: 1
    },

    ramp_up_value: {
      type: DataTypes.SMALLINT,
      defaultValue: 1
    },

    max_warmup_value: {
      type: DataTypes.SMALLINT,
      defaultValue: 50
    },

    reply_rate: {
      type: DataTypes.SMALLINT,
      validate: {
        max: 100
      }
    },

    randomise_warmup_value: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    sending_schedule: {
      type: DataTypes.ENUM(
        'INCLUDE_WEEKENDS',
        'EXCLUDE_WEEKENDS'
      ),
      defaultValue: 'INCLUDE_WEEKENDS'
    },

    schedule_timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },

    warmup_identifier: {
      type: DataTypes.STRING(20)
    }

  }, {
    tableName: 'warmup_profile_details',
    timestamps: false,
  });
};
