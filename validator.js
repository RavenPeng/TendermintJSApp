let createABCIServer = require('abci')
let crypto = require('crypto')
let dbStorage = require('./accessDB')
var decode = require('./txDecoder');

// turn on debug logging
require('debug').enable('abci*')

let state = {
  count: 0
}

function checkInputs(inputs) {
  uthMap = {};
  let valuesSum = 0;

  for(let i = 0; i < inputs.numInputs; ++i) {
    inputs.inputHash[i];

    const hash = crypto.createHash('sha256').update(inputs.inputPubKey[i]).digest('hex');

    if (!(hash.toUpperCase() === inputs.inputHash[i])) {
      return false;
    }

    dbStorage.getValue(inputs.inputHash[i]).then(
      (value) => {
        valuesSum += value.value
      },
      (reason) => {
        console.error("Problem accessing DB: " + reason)// rejection
      })
  }

  return valuesSum;
}

function getSumOutputs(outputResult) {
  let valuesSum = 0;

  for (let i = 0; i < outputResult.numOutputs; i++) {
    valueSum += outputResult.outValue[i];
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

    let sumInputs = checkInputs(inputResult);
    if(!sumInputs) {
        return { code: -1, log: 'public key hash does not match address' }
    }

    let sumOutputs = getSumOutputs(outputResult)
    if(sumOutputs >= sumInputs) {
      return { code: -1, log: 'sum of inputs is not sufficient' }
    }

    return { code: 0, log: 'tx succeeded' }
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
