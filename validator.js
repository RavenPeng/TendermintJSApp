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
    var promise = new Promise(function(resolve, reject) {
    //let tx = padTx(request.tx)
    //let number = tx.readUInt32BE(0)
		//console.log("Transaction is " + request.tx)
    //console.log("Type is " + typeof(request.tx))
    /*if (number !== state.count) {
      return { code: 1, log: 'tx does not match count' }
    }*/
        console.log("Buffer length checkTx is " + request.tx.length)
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
        return { code: -1, log: 'sum of inputs is not sufficient' }
      } else {
        console.log("Transaction fee is " + (sumInputs - sumOutputs))
        for (let i = 0; i < outputResult.numOutputs; i++) {
          let currentValue = await dbStorage.getValue(outputResult.outHash[i])
          if(currentValue) {
            await dbStorage.updateValue(outputResult.outHash[i], currentValue + outputResult.outValue[i]);
          } else {
            await dbStorage.insertNew(outputResult.outHash[i], outputResult.outValue[i]);
          }
        }
        for (let i = 0; i < inputResult.numInputs; i++) {
            await dbStorage.updateValue(inputResult.inputHash[i], 0);
        }
      }
      console.log("Before resolve")
      resolve( { code: 0, log: 'tx succeeded' })
    })
  })
  return promise
  },

  deliverTx (request) {
    let tx = padTx(request.tx)
    let number = tx.readUInt32BE(0)
    if (number !== state.count) {
      return { code: 1, log: 'tx does not match count' }
    }

    // update state
    state.count += 1

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
