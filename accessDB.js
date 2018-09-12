const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

async function getDB() {
  // Connection URL
  const url = 'mongodb://127.0.0.1:27017';
  // Database Name
  const dbName = 'dcoin';

  try {
    // Use connect method to connect to the Server
    let client = await MongoClient.connect(url);

    let db = client.db(dbName);

    return {client : client, db : db};
  } catch (err) {
    console.error(err.stack);
  }
}

function closeConnection(client) {
  if (client) {
    client.close();
  }
}

async function insertNew(newAddress, newValue) {
  let result = await getDB();
  // Get the documents collection
  const collection = result.db.collection('valuerecords');
  // Insert some documents
  await collection.insert({address: newAddress, value : newValue});
  console.log("Inserted new address " + newAddress + " with balance " + newValue)
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

async function updateValue(userAddress, newValue) {
  let resultDB = await getDB();
  const collection = resultDB.db.collection('valuerecords');

  console.log("Value on updateValue is: " + typeof newValue);
  await collection.updateOne({address: userAddress},  { $set: {value: newValue} } )
  console.log("Updated " + userAddress + " to value " + newValue)
  closeConnection(resultDB.client);
  console.log("end of update value")
}

module.exports = {
  insertNew: insertNew,
  getValue: getValue,
  updateValue: updateValue
};
