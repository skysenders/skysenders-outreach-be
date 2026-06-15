module.exports = (sequelize, DataTypes) => {
  return sequelize.define('list_import_jobs', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },

    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    list_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    source: {
      type: DataTypes.ENUM(
        'CSV_UPLOAD',
        'API',
        'MANUAL'
      ),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
      ),
      defaultValue: 'PENDING'
    },

    source_file_name: {
      type: DataTypes.TEXT
    },

    import_settings: {
      type: DataTypes.JSONB,
    },

    total_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    valid_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    duplicate_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    already_existing_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    unsubscribed_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    bounced_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    blocked_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    invalid_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    processed_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    error_message: {
      type: DataTypes.TEXT
    },

    created_by: {
      type: DataTypes.BIGINT
    },

    started_at: {
      type: DataTypes.DATE
    },

    completed_at: {
      type: DataTypes.DATE
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'list_import_jobs',
    timestamps: false
  });
};
