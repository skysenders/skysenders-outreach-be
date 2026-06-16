module.exports = (sequelize, DataTypes) => {
  return sequelize.define('sending_schedule_windows', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    schedule_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },

    day_of_week: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'sending_schedule_windows',
    timestamps: false
  });
};
