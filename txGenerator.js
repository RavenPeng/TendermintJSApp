var readline = require('readline');
const Buffer = require('buffer').Buffer;
var fs = require('fs');
const os = require('os');
var decode = require('./txDecoder');
let crypto = require('crypto')

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var numInputs;
// Stores the numbers of the num keys, keys themselves should be available in .dcoin directory
var inputPubKeyNum = [];

var numOutputs;
var outputPubKeyNum = [];
var outValue = [];

function getDataUserInputTx() {
  var promise = new Promise(function(resolve, reject) {
    rl.question("Please provide number of inputs: ", function(numInputsUsr) {
      numInputs = numInputsUsr;

      for (let i = 0; i < numInputs; i++) {
          rl.question("Please provide input public key number " + (i + 1).toString() + ": ", function(pubKeyNum) {
            inputPubKeyNum[i] = pubKeyNum;
            resolve();
          })
      }
    })
  })
  return promise;
}

function getDataUser() {
  var promise = new Promise(function(resolve, reject) {

    getDataUserInputTx().then(function() {
      rl.question("Please provide number of outputs: ", function(numOutputsUsr) {

        numOutputs = numOutputsUsr;

        for (let i = 0; i < numOutputs; i++) {
          rl.question("Please provide output public key number " + (i + 1).toString() + ": ", function(outAddress) {
            outputPubKeyNum[i] = outAddress;

            rl.question("Please provide output value " + (i + 1).toString() + ": ", function(outValueI) {
              outValue[i] = outValueI;

              rl.close();
              resolve();
            })
          })
        }
      });
    });
  })
  return promise;
}

async function getKeyFromFile(num, type) {
  console.log("Openning file: " + os.homedir() + "/.dcoin/rsa" + type + "key" + num + ".pem");
  let concatenatedKey = "";

  fs.readFile(os.homedir() + "/.dcoin/rsa" + type + "key" + num + ".pem",  'utf8', function(err, data) {
    if(err) {
      throw err;
    }
    let splitArray = data.split('\n');

    // Skip the first and last sentence as they do not contain data
    for(let i=1; i < splitArray.length -2; ++i) {
      concatenatedKey += splitArray[i];
    }

  });

  return concatenatedKey;
}

async function addInputs(buffer, offset) {
  buffer.writeUInt8(numInputs, offset.value);
  offset.value += 1;

  for (let i = 0; i < numInputs; i++) {
    let pubKey = await getKeyFromFile(inputPubKeyNum[i], "pub")

    const txHash = crypto.createHash('sha256').update(pubKey).digest('hex');
    buffer.writeUInt16BE(txHash.length, offset.value);
    offset.value += 2;
    buffer.write(txHash, offset.value);
    console.log("txHash saved as" + txHash.length)
    offset.value += txHash.length;
    buffer.writeUInt16BE(pubKey.length, offset.value);
    console.log("pubkey length written as " + pubKey.length)
    offset.value += 2;
    buffer.write(pubKey, offset.value);
    offset.value += pubKey.length;
  }
}

async function addOutputs(buffer, offset) {
  buffer.writeUInt8(numOutputs, offset.value);
  offset.value += 1;
  console.log("Before loop ")
  for (let i = 0; i < numOutputs; i++) {
    let pubKey = await getKeyFromFile(outputPubKeyNum[i], "pub")

    const txHashOut = crypto.createHash('sha256').update(pubKey).digest('hex');
    console.log("inside loop ");
    buffer.writeUInt16BE(txHashOut.length, offset.value);
    offset.value += 2;
    buffer.write(txHashOut, offset.value);
    offset.value += txHashOut.length;
    buffer.writeUInt32BE(outValue[i], offset.value);
    offset.value += 4;
  }
}

async function buildString() {
  // Pre-reserver a huge buffer. TODO shrink it if possible
  var buffer = Buffer.alloc(10000);
  var offset = { value: 0 };

  await addInputs(buffer, offset)
  await addOutputs(buffer, offset)

  return {buffer: buffer, offset: offset};
}

getDataUser()
.then(function () {
  var promise = new Promise(function(resolve, reject) {
    buildString()
    .then(function(result) {
      resolve(result)
    })
  })
  return promise;
})
.then(function (result) {
  outMsg = {
    "method": "broadcast_tx_sync",
    "jsonrpc": "2.0",
    "id": "dontcare2"
  }
  console.log("Offset at last is " + result.offset.value)
  outMsg.params = [result.buffer.toString('base64', 0, result.offset.value)];

  fs.writeFile("preparedMsg.txt", JSON.stringify(outMsg), function(err) {
    console.log("File is written")
  });
  //decode.decodeTx(result.buffer);
})

  /*setTimeout(function(str1, str2) {
    console.log("timeout");
  }, 1000);*/
