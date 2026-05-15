module.exports = (sequelize, DataTypes) => {
  return sequelize.define('warmup_messages', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    subject: {
      type: DataTypes.TEXT
    },

    email_body: {
      type: DataTypes.TEXT
    },

    reply_body_1: {
      type: DataTypes.TEXT
    },

    reply_body_2: {
      type: DataTypes.TEXT
    },

    reply_body_3: {
      type: DataTypes.TEXT
    },

    reply_body_4: {
      type: DataTypes.TEXT
    },

    sector: {
      type: DataTypes.TEXT
    },

    industry: {
      type: DataTypes.TEXT
    },

    subindustry: {
      type: DataTypes.TEXT
    },

    prompt_version: {
      type: DataTypes.TEXT
    },

    model_name: {
      type: DataTypes.TEXT
    },

    created_at: {
      type: DataTypes.DATE
    }

  }, {
    tableName: 'warmup_messages',
    timestamps: false,
  });
};
