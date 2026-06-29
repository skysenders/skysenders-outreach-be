module.exports = (sequelize, DataTypes) => {
  return sequelize.define('workspaces', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    uuid: DataTypes.UUID,
    partner_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,

    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    logo_bg_color: DataTypes.STRING,
    theme_color: DataTypes.STRING,
    timezone: DataTypes.STRING,
    team_size: DataTypes.INTEGER,
    goals: DataTypes.JSONB,

    description: DataTypes.STRING,
    workspace_settings: DataTypes.JSONB,

    custom_domain_url: DataTypes.TEXT,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'workspaces',
    timestamps: false
  });
};
