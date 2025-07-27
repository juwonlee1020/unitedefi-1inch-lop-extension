const { expect, time } = require('@1inch/solidity-utils');
const { ethers } = require('hardhat');
const { ether } = require('./helpers/utils');
const { BigNumber } = ethers;
describe('TWAPCalculator', function () {
    let TWAPCalculator, twap, deployer;
    const interval = 300; // 5 minutes
    const chunk = ether('1');
    const price = ether('3200');
    const total = ether('10');
    let start;

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();
        TWAPCalculator = await ethers.getContractFactory('TWAPCalculator');

        start = (await time.latest()) + 60; // start 1 minute from now
        twap = await TWAPCalculator.deploy(start, interval, chunk, price, total);
        await twap.waitForDeployment();
    });

    it('reverts before start time', async function () {
        await time.increaseTo(start - 10);
        await expect(twap.getTakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, chunk))
            .to.be.revertedWith('Requested maker amount exceeds unlocked');
    });

    it('unlocks 1 chunk after 1 interval', async function () {
        await time.increaseTo(start + interval);
        const takerAmount = await twap.getTakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, chunk);
        expect(takerAmount).to.equal(price);

        const makerAmount = await twap.getMakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, price);
        expect(makerAmount).to.equal(chunk);
    });

    it('reverts if requesting more than unlocked', async function () {
        await time.increaseTo(start + interval);
        await expect(twap.getTakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, ether('2')))
            .to.be.revertedWith('Requested maker amount exceeds unlocked');
    });

    it('rounds down getMakerAmount to nearest chunk', async function () {
        await time.increaseTo(start + interval * 2);
        const partialPrice = (price * 15n) / 10n; // ✅ ethers v6 + BigInt
        const makerAmount = await twap.getMakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, partialPrice);
        expect(makerAmount).to.equal(chunk); // rounds down to 1 chunk
    });

    it('unlocks full amount after enough time', async function () {
        await time.increaseTo(start + interval * 10); // full unlock
        const takerAmount = await twap.getTakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, total);
        expect(takerAmount).to.equal((price * total) / ether('1'));
    });

    it('caps unlocked amount at totalAmount', async function () {
        await time.increaseTo(start + interval * 100); // way past total
        const takerAmount = await twap.getTakerAmount(ethers.ZeroAddress, ethers.ZeroAddress, total);
        expect(takerAmount).to.equal((price * total) / ether('1'));
    });
});
