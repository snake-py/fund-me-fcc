// this will run after we have deployed to a test net so right before we are going to deploy to a main net
const { getNamedAccounts, ethers, network } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { expect } = require('chai');

developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async () => {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther('1');
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract('FundMe', deployer);
          });
          it('allows people to fund and withdraw', async () => {
              await fundMe.fund({
                  value: sendValue,
              });
              await fundMe.withdraw();
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.address
              );
              expect(endingBalance.toString()).to.equal(0);
          });
      });
