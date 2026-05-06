module.exports = (sequelize, DataTypes) => {
  return sequelize.define('partners', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    uuid: {
      type: DataTypes.UUID
    },
    email: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.TEXT
    },
    company_name: {
      type: DataTypes.STRING
    },
    company_url: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended')
    },
    created_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_deleted: DataTypes.BOOLEAN
  }, {
    tableName: 'partners',
    timestamps: false
  });
};
