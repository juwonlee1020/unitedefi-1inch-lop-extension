const hre = require('hardhat');
const { getChainId, network, ethers } = hre;

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log('Deploying TWAPCalculator...');
    console.log('Network:', network.name, 'Chain ID:', await getChainId());

    // Deploy the TWAPCalculator (no constructor args)
    const result = await deploy('TWAPCalculator', {
        from: deployer,
        args: [], // no constructor args for IAmountGetter style
        log: true,
    });

    console.log('✅ TWAPCalculator deployed to:', result.address);

    if ((await getChainId()) !== '31337') {
        await hre.run('verify:verify', {
            address: result.address,
            constructorArguments: [],
        });
    }
};
module.exports.tags = ['TWAP'];
module.exports.skip = async () => false; // set to false to include this script
