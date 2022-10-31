const { getNamedAccounts, ethers } = require('hardhat');

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract('FundMe', deployer);
    console.log('Funding contracts ...');
    const transactionReceipt = await fundMe.fund({
        value: ethers.utils.parseEther('0.1'),
    });
    await transactionReceipt.wait(1);
    console.log('Funded!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
