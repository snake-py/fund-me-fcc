const { network } = require('hardhat');
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require('../helper-hardhat-config');

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    const chainName = network.name;

    if (developmentChains.includes(chainName)) {
        await deploy('MockV3Aggregator', {
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true,
        });
        log('MockV3Aggregator deployed to:', chainName);
        log(
            '-----------------------------------------------------------------'
        );
    }
};

// npx hardhat deploy --tags mocks will only trigger this script
module.exports.tags = ['all', 'mocks'];
