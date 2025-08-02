

const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');


async function main() {


    const ts = BigInt(await time.latest());
    const startEndTs = (ts << 128n) | (ts + 86400n);

    console.log(startEndTs.toString());


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
