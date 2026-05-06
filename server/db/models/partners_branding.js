module.exports = (sequelize, DataTypes) => {
  return sequelize.define('partners_branding', {
    partner_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    brand_name: DataTypes.STRING,
    customer_portal_domain_url: DataTypes.STRING,
    primary_color: DataTypes.STRING,
    secondary_color: DataTypes.STRING,
    light_text_color: DataTypes.STRING,
    dark_text_color: DataTypes.STRING,
    fav_icon_url: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'partners_branding',
    timestamps: false
  });
};
