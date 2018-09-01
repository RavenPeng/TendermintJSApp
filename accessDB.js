const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

async function getDB() {
  // Connection URL
  const url = 'mongodb://localhost:27017';
  // Database Name
  const dbName = 'dcoin';

  try {
    // Use connect method to connect to the Server
    let client = await MongoClient.connect(url);

    let db = client.db(dbName);

    return {client : client, db : db};
  } catch (err) {
    console.log(err.stack);
  }
}

function closeConnection(client) {
  if (client) {
    client.close();
  }
}

async function insertTx(tx) {
  let result = await getDB();
  // Get the documents collection
  const collection = result.db.collection('valuerecords');
  // Insert some documents
  await collection.insert(tx);
  closeConnection(result.client);
}

async function getValue(userAddress) {
  let resultDB = await getDB();
  const collection = resultDB.db.collection('valuerecords');
  // Find some documents
  let resultFind = await collection.findOne({address: userAddress},
    {projection : { "_id": 0, "value": 1}});
  closeConnection(resultDB.client);
  return resultFind;
}

module.exports = {
  insertTx: insertTx,
  getValue: getValue
};
