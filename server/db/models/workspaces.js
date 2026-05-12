module.exports = (sequelize, DataTypes) => {
  return sequelize.define('workspaces', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    uuid: DataTypes.UUID,
    partner_id: DataTypes.INTEGER,
    owner_user_id: DataTypes.INTEGER,

    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    logo_bg_color: DataTypes.STRING,
    timezone: DataTypes.STRING,
    team_size: DataTypes.INTEGER,
    goals: DataTypes.JSONB,

    description: DataTypes.STRING,
    workspace_settings: DataTypes.JSONB,

    api_key: DataTypes.TEXT,
    api_key_created_at: DataTypes.DATE,
    custom_api_rate_limit: DataTypes.INTEGER,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_deleted: DataTypes.BOOLEAN
  }, {
    tableName: 'workspaces',
    timestamps: false
  });
};
