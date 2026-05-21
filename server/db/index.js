/*eslint-disable-line*/
/* eslint-disable no-undef */

import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { Container } from 'typedi';
import { DB, READ_REPLICA_DB } from '../config/constants';

export const db = {};

/**
 * Functionality used to import all the required models
 * under the models directory and sync the sequlize database
 * @returns {sequlizeInstance} returns synced instance data
 */
export const connect = async() => {
  const Logger = Container.get('logger');
  const basename = path.basename(module.filename);

  let sequelize = new Sequelize(
    DB.NAME,
    null,
    null,
    {
      replication: {
        read: READ_REPLICA_DB,
        write: {
          host: DB.HOST,
          port: DB.PORT,
          username: DB.USER_NAME,
          password: DB.PASSWORD,
        }
      },
      dialect: DB.DIALECT,
      pool: {
        max: 5,
        min: 0,
        idle: 10000,
      },
      ssl: true,
      hooks: {
        afterConnect: (connection, config) => {
          Logger.info(`[CONNECTED TO] ${config.host}:${config.port}`);
        }
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
      },
      define: {
        timestamps: false
      }
    }
  );

  sequelize.options.transactionType = DB.TRANSACTION_TYPE;
  fs.readdirSync(`${__dirname}/models`)
    .filter(file =>
      (file.indexOf('.') !== 0) &&
      (file !== basename) &&
      (file.slice(-3) === '.js'))
    .forEach(file => {
      const model = require(path.join(`${__dirname}/models`, file))(sequelize, DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;

  sequelize
    .authenticate()
    .then(() => {
      Logger.info(`${DB.CONNECTED}`);
      return db;
    })
    .catch((err) => {
      Logger.error(`Error in Database connection ${err.message}`);
    });
};
