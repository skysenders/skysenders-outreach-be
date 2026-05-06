module.exports = (sequelize, DataTypes) => {
  return sequelize.define('partners_custom_scripts', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    partner_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    placement: DataTypes.STRING,
    script: DataTypes.TEXT,
    status: DataTypes.ENUM('active', 'inactive'),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'partners_custom_scripts',
    timestamps: false
  });
};
