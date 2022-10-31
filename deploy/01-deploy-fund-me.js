const { network } = require('hardhat');
const {
    networkConfig,
    developmentChains,
} = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

// gets passed the hre from hardhat
module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    log('Deploying FundMe...');
    if (!chainId in networkConfig) {
        throw new Error('ChainId not supported');
    }

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get('MockV3Aggregator');
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }

    // what happens it we want to change chains?
    // when going to deploy to localhost or hardhat network we want to use a mock
    const fundMe = await deploy('FundMe', {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // we want to verify the contract on etherscan
        await verify(fundMe.address, [ethUsdPriceFeedAddress]);
    }

    log('FundMe deployed to:', fundMe.address);
    log('-----------------------------------------------------------------');
};
module.exports.tags = ['all', 'fundme'];
