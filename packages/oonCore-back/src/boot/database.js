const mongoose = require("mongoose");

/**
 * Conexão com o MongoDB a partir das envs padrão da Central.
 * Extraído de `config/db.js`, sem acoplamento ao domínio.
 */
function buildMongoUri() {
  const cfg = {
    dbServer: process.env.DB_SERVER,
    dbName: process.env.DB_NAME,
    dbAuthSource: process.env.DB_AUTH_SOURCE,
    dbReplicaSet: process.env.DB_REPLICA_SET,
    dbTsl: process.env.DB_TSL,
  };

  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  let uri = `${cfg.dbServer}/${cfg.dbName}?`;
  if (cfg.dbAuthSource) uri += `authSource=${cfg.dbAuthSource}&`;
  if (cfg.dbTsl) uri += `tls=true&`;
  if (cfg.dbReplicaSet) uri += `replicaSet=${cfg.dbReplicaSet}`;
  return uri;
}

async function connectDB() {
  const uri = buildMongoUri();
  await mongoose.connect(uri, {
    user: process.env.DB_USER,
    pass: process.env.DB_PASSWORD,
  });
  console.log(`Conectado ao MongoDB (${process.env.DB_NAME || uri})`);
  return mongoose.connection;
}

module.exports = { connectDB, buildMongoUri };
