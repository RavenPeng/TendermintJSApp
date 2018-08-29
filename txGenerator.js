var readline = require('readline');
const Buffer = require('buffer').Buffer;
var fs = require('fs');
const os = require('os');
var decode = require('./txDecoder');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var numInputs;
var numOutputs;
var inputHash = [];
// Stores the numbers of the num keys, keys themselves should be available in .dcoin directory
var inputPubKeyNum = [];
var outHash = [];
var outValue = [];

function getDataUserInputTx() {
  var promise = new Promise(function(resolve, reject) {
    rl.question("Please provide number of inputs: ", function(numInputsUsr) {
      numInputs = numInputsUsr;

      for (let i = 0; i < numInputs; i++) {
        rl.question("Please provide unspent tx hash " + (i + 1).toString() + ": ", function(txHash) {
          inputHash[i] = txHash;

          rl.question("Please provide input public key number " + (i + 1).toString() + ": ", function(pubKeyNum) {
            inputPubKeyNum[i] = pubKeyNum;
            resolve();
          })
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
          rl.question("Please provide output address " + (i + 1).toString() + ": ", function(outAddress) {
            outHash[i] = outAddress;

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

function getKeyFromFile(num, type) {
  var promise = new Promise(function(resolve, reject) {
    console.log("Openning file: " + os.homedir() + "/.dcoin/rsa" + type + "key" + num + ".pem");
    fs.readFile(os.homedir() + "/.dcoin/rsa" + type + "key" + num + ".pem",  'utf8', function(err, data) {
        let splitArray = data.split('\n');
        var concatenatedKey = "";

        // Skip the first and last sentence as they do not contain data
        for(let i=1; i < splitArray.length -2; ++i) {
          concatenatedKey += splitArray[i];


        }
        resolve(concatenatedKey);
      });
    });
  return promise;
}

function addInputs(buffer, offset) {
  var promise = new Promise(function(resolve, reject) {
    buffer.writeUInt8(numInputs, offset.value);
    offset.value += 1;

    for (let i = 0; i < numInputs; i++) {
      getKeyFromFile(inputPubKeyNum[i], "pub")
      .then(function (pubKey)  {
        buffer.writeUInt16BE(inputHash[i].length, offset.value);
        offset.value += 2;
        buffer.write(inputHash[i], offset.value);
        offset.value += inputHash[i].length;
        buffer.writeUInt16BE(pubKey.length, offset.value);
        offset.value += 2;
        buffer.write(pubKey, offset.value);
        offset.value += pubKey.length;

        if(i == numInputs -1) {
            resolve();
        }
      });
    }
  })
  return promise;
}

function addOutputs(buffer, offset) {
  buffer.writeUInt8(numOutputs, offset.value);
  offset.value += 1;
  console.log("wrote num output as " + numOutputs)

  for (let i = 0; i < numOutputs; i++) {
      buffer.writeUInt16BE(outHash[i].length, offset.value);
      offset.value += 2;
      buffer.write(outHash[i], offset.value);
      offset.value += outHash[i].length;
      buffer.writeUInt32BE(outValue[i], offset.value);
      offset.value += 4;
  }
}

function buildString() {
    var promise = new Promise(function(resolve, reject) {
    // Pre-reserver a huge buffer. TODO shrink it if possible
    var buffer = Buffer.alloc(10000);
    var offset = { value: 0 };

    addInputs(buffer, offset)
    .then(function() {
        addOutputs(buffer, offset);
    })
    .then(function() {
        resolve({buffer: buffer, offset: offset});
    })
  });
  return promise;
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
  fs.writeFile("preparedMsg2.txt", result.buffer.toString('hex', 0, result.offset.value), function(err) {
    console.log("File is written")
  });
  //decode.decodeTx(result.buffer);
})

  /*setTimeout(function(str1, str2) {
    console.log("timeout");
  }, 1000);*/
