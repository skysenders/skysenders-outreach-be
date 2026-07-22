module.exports = (sequelize, DataTypes) => {
  return sequelize.define('sequences', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true
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
      type: DataTypes.STRING(255),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM(
        'DRAFTED',
        'ACTIVE',
        'STOPPED',
        'COMPLETED',
        'ARCHIVED',
        'PAUSED',
        'AUTO_PAUSED',
        'PAUSED_SUB_FAILED'
      ),
      allowNull: false,
      defaultValue: 'DRAFTED'
    },

    last_status_details: {
      type: DataTypes.TEXT
    },

    total_no_of_seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    total_no_contacts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    current_seq_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    total_no_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    first_started_at: {
      type: DataTypes.DATE
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
    tableName: 'sequences',
    timestamps: false,
  });
};
