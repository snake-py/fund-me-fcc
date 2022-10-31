const { deployments, ethers, getNamedAccounts, network } = require('hardhat');
const { assert, expect } = require('chai');
const { developmentChains } = require('../../helper-hardhat-config');

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async () => {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther('1');
          let { log } = deployments;
          beforeEach(async () => {
              // Deploy Fund Me Contract
              // const accounts = await ethers.getSigners(); // get all the accounts
              deployer = (await getNamedAccounts()).deployer; // get the deployer account
              await deployments.fixture(['all']);
              fundMe = await ethers.getContract('FundMe', deployer); // get the contract and connect it to the deployer
              // (all calls will then be made as the deployer)
              mockV3Aggregator = await ethers.getContract(
                  'MockV3Aggregator',
                  deployer
              );
          });

          describe('constructor', async () => {
              it('sets the aggregator address correctly', async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe('fund', async () => {
              it("fails if you don't send enough eth", async () => {
                  // await expect(fundMe.fund()).to.be.reverted(); // or be more sepecific
                  await expect(fundMe.fund()).to.be.revertedWith(
                      'You need to spend more ETH!'
                  );
              });

              it('updated the amount funded data structure', async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it('Adds funder to array of getFunder', async () => {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe('Withdraw', async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it('withdraw ETH from a single founder', async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = transactionReceipt;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const totalGasCost = effectiveGasPrice.mul(gasUsed);
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  );
              });

              it('allows us to withdraw with multiple getFunder', async () => {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      // i = 0 is the deployer
                      // needs to be called because in the setup function we connected
                      // the contract to the deployer
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = transactionReceipt;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const totalGasCost = effectiveGasPrice.mul(gasUsed);
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  );

                  // // Make sure the getFunder array is reset
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it('only allows the owner to withdraw', async () => {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith('FundMe__NotOwner');
              });

              it('cheaperWithDraw Testsing', async () => {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      // i = 0 is the deployer
                      // needs to be called because in the setup function we connected
                      // the contract to the deployer
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.cheaperWithDraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = transactionReceipt;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const totalGasCost = effectiveGasPrice.mul(gasUsed);
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  );

                  // // Make sure the getFunder array is reset
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it('withdraw ETH from a single founder cheaper withdraw', async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithDraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = transactionReceipt;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const totalGasCost = effectiveGasPrice.mul(gasUsed);
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  );
              });
          });
      });
