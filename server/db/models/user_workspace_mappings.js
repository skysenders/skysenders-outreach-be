module.exports = (sequelize, DataTypes) => {
  return sequelize.define('user_workspace_mappings', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    workspace_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,

    role: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER', 'CLIENT'),
    status: DataTypes.ENUM(
      'invitation_pending',
      'invitation_accepted',
      'invitation_expired',
      'deleted'
    ),

    invited_by: DataTypes.INTEGER,
    invited_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN,

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_deleted: DataTypes.BOOLEAN
  }, {
    tableName: 'user_workspace_mappings',
    timestamps: false
  });
};
