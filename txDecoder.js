function getInputs(buffer, offset) {
    let inputResult = {};
    inputResult.inputHash = [];
    inputResult.inputPubKey = [];
    inputResult.numInputs = buffer.readUInt8(offset.value);
    offset.value += 1;

    for (let i = 0; i < inputResult.numInputs; i++) {
        let inputHashLength = buffer.readUInt16BE(offset.value);
        offset.value += 2;
        inputResult.inputHash[i] = buffer.toString('utf8', offset.value, offset.value + inputHashLength);
        offset.value += inputHashLength;
        let inputPubKeyLength = buffer.readUInt16BE(offset.value);
        offset.value += 2;
        inputResult.inputPubKey[i] = buffer.toString('utf8', offset.value, offset.value + inputPubKeyLength);
        offset.value += inputPubKeyLength;

      };

    return inputResult;
}

function getOutputs(buffer, offset) {
  let outputResult = {};
  outputResult.outHash = [];
  outputResult.outValue = [];

console.log("Offset is " + offset.value)
  outputResult.numOutputs = buffer.readUInt8(offset.value);
  offset.value += 1;

  for (let i = 0; i < outputResult.numOutputs; i++) {
      let outputHashLength = buffer.readUInt16BE(offset.value);
      offset.value += 2;
      outputResult.outHash[i] = buffer.toString('utf8', offset.value, offset.value + outputHashLength);
      offset.value += outputHashLength;
      outputResult.outValue[i] = buffer.readUInt32BE(offset.value);
      offset.value += 4;
  }

  return outputResult;
}

function decodeTx(encodedTx) {
  offset = {};
  offset.value = 0;

  let inputResult = getInputs(encodedTx, offset);
  let outputResult = getOutputs(encodedTx, offset);

  //printTx(inputResult, outputResult);
}

function printTx(inputResult, outputResult) {
  console.log(inputResult.numInputs);
  console.log(inputResult.inputHash[0]);
  console.log(inputResult.inputPubKey[0]);
  console.log(outputResult.numOutputs);
  console.log(outputResult.outHash[0]);
  console.log(outputResult.outValue[0]);
}

module.exports = {
  decodeTx: decodeTx
};
