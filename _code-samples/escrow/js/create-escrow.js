'use strict'
const xrpl = require('xrpl');
const cc = require('five-bells-condition');
const crypto = require('crypto');

// Useful Documentation:-
// 1. five-bells-condition: https://www.npmjs.com/package/five-bells-condition
// 2. Crypto module: https://nodejs.org/api/crypto.html

// Your seed value, for testing purposes you can make one with the faucet:
// https://xrpl.org/resources/dev-tools/xrp-faucets
const seed = "sEd7jfWyNG6J71dEojB3W9YdHp2KCjy";

async function main() {
  try {

    // Connect ----------------------------------------------------------------
    const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();

    // Prepare wallet to sign the transaction ---------------------------------
    const wallet = await xrpl.Wallet.fromSeed(seed);
    console.log("Wallet Address: ", wallet.address);
    console.log("Seed: ", seed);

    // Set the escrow finish time ---------------------------------------------
    let finishAfter = new Date((new Date().getTime() / 1000) + 120); // 2 minutes from now
    finishAfter = new Date(finishAfter * 1000);
    console.log("This escrow will finish after: ", finishAfter);

    // Construct condition and fulfillment ------------------------------------
    const preimageData = crypto.randomBytes(32);
    const myFulfillment = new cc.PreimageSha256();
    myFulfillment.setPreimage(preimageData);
    const conditionHex = myFulfillment.getConditionBinary().toString('hex').toUpperCase();

    console.log('Condition:', conditionHex);
    console.log('Fulfillment:', myFulfillment.serializeBinary().toString('hex').toUpperCase());

    // Prepare EscrowCreate transaction ------------------------------------
    const escrowCreateTransaction = {
      "TransactionType": "EscrowCreate",
      "Account": wallet.address,
      "Destination": wallet.address,
      "Amount": "6000000", //drops XRP
      "DestinationTag": 2023,
      "Condition": conditionHex, // Omit this for time-held escrows
      "Fee": "12",
      "FinishAfter": xrpl.isoTimeToRippleTime(finishAfter.toISOString()),
    };

    xrpl.validate(escrowCreateTransaction);

    // Sign and submit the transaction ----------------------------------------
    console.log('Signing and submitting the transaction:',
                JSON.stringify(escrowCreateTransaction, null,  "\t"), "\n"
    );
    const response = await client.submitAndWait(escrowCreateTransaction, { wallet });
    console.log(`Sequence number: ${response.result.tx_json.Sequence}`);
    console.log(`Finished submitting! ${JSON.stringify(response.result, null, "\t")}`);

    await client.disconnect();

  } catch (error) {
    console.log(error);
  }
}

main()
