let createABCIServer = require('abci')
let crypto = require('crypto')
let dbStorage = require('./accessDB')
var decode = require('./txDecoder');

// turn on debug logging
require('debug').enable('abci*')

let state = {
  count: 0
}

async function checkInputs(inputs) {
  uthMap = {};
  let valuesSum = 0;

  for(let i = 0; i < inputs.numInputs; ++i) {
    inputs.inputHash[i];

    const hash = crypto.createHash('sha256').update(inputs.inputPubKey[i]).digest('hex');

    if (!(hash.toUpperCase() === inputs.inputHash[i].toUpperCase())) {
      console.error("Hashed pub key is: " + hash)
      console.error("Received UTH is: " + inputs.inputHash[i])
      console.error("Received pub key is: " + inputs.inputPubKey[i])
      return {result : false, msg: "Hash does not match on input " + i};
    }

    try {
      let value = await dbStorage.getValue(inputs.inputHash[i]);
      valuesSum += value.value;
    } catch (err) {
      console.error(err)
      return {result : false, msg: "Error working with DB"};
    }
  }

  return {result : true, value: valuesSum};
}

async function checkNewTx(request, shouldCommit) {
  var promise = new Promise(function(resolve, reject) {

  decodeResult = decode.decodeTx(request.tx);


  inputResult = decodeResult.inputResult;
  outputResult = decodeResult.outputResult;

  checkInputs(inputResult)
  .then((result) => {
      if(!result.result) {
          resolve( { code: -1, log: result.msg })
      } else {
          return result.value
      }
  })
  .then( async (sumInputs) => {
    let sumOutputs = getSumOutputs(outputResult)
    console.log("Sum of inputs resolved as: " + sumInputs)
    console.log("Sum of outputs resolved as: " + sumOutputs)
    if(sumOutputs >= sumInputs) {
      resolve( { code: -1, log: 'sum of inputs is not sufficient' })
    } else {
      if(shouldCommit) {
        console.log("Transaction fee is " + (sumInputs - sumOutputs))
        for (let i = 0; i < outputResult.numOutputs; i++) {
          let currentValue = await dbStorage.getValue(outputResult.outHash[i])
          console.log("Current value is " + currentValue.value + " type is: " + typeof(currentValue.value))
          if(currentValue) {
            await dbStorage.updateValue(outputResult.outHash[i], currentValue.value + outputResult.outValue[i]);
          } else {
            await dbStorage.insertNew(outputResult.outHash[i], outputResult.outValue[i]);
          }
        }
        for (let i = 0; i < inputResult.numInputs; i++) {
            await dbStorage.updateValue(inputResult.inputHash[i], 0);
        }
      }
      resolve( { code: 0, log: 'tx succeeded' })
    }
  })
  .catch( err => {
    console.error("Catch handled error " + err)
  } )
})
return promise
}

function getSumOutputs(outputResult) {
  let valuesSum = 0;

  for (let i = 0; i < outputResult.numOutputs; i++) {
    valuesSum += outputResult.outValue[i];
  }

  return valuesSum;
}

let handlers = {
  info (request) {
    return {
      data: 'Node.js counter app',
      version: '0.0.0',
      lastBlockHeight: 0,
      lastBlockAppHash: Buffer.alloc(0)
    }
  },
  checkTx (request) {
    return checkNewTx(request, false)
  },
  deliverTx (request) {
    console.log("DeliverTx received input:")
    console.log(JSON.stringify(request))
    return checkNewTx(request, true)
  },
  commit (request) {
    console.log("Commit received: ")
    console.log(JSON.stringify(request))
    let array = new Uint8Array(100);
    array[42] = 10;
    return array
  },
  beginBlock (request) {
    console.log("beginBlock received: ")
    console.log(JSON.stringify(request))
    console.log("Type of header is: " + typeof(request.header))
    return { code: 0, log: 'tx succeeded' }
  }
}

// make sure the transaction data is 4 bytes long
function padTx (tx) {
  let buf = Buffer.alloc(4)
  tx.copy(buf, 4 - tx.length)
  return buf
}

let port = 26658
createABCIServer(handlers).listen(port, () => {
  console.log(`listening on port ${port}`)
})

testObject = {
  address: "address1",
  value: 100
}

/*dbStorage.insertTx(testObject).then(
  function() {
    console.log("Tx inserted")
  }
)

dbStorage.getValue("address").then(
  function(value) {
    console.log(value)
  }
)
*/
