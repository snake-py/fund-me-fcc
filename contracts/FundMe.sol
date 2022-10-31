// Note you can import hardhat console.log to print to console for debugging and testing

// SPDX-License-Identifier: MIT
// 1. pragme
pragma solidity ^0.8.7;
// 2. import
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';
// 3. errors
error FundMe__NotOwner();

/**
 * @title FundMe
 * @notice This contract allows users to send ETH to the contract to fund the owner.
 * @author Fabio during the course of FCC by Patrick Collins
 * @dev This is just an example to lean Solidity and Chainlink
 */
contract FundMe {
    // 4. Type declarations
    // none in this contract

    // 5. State variables
    using PriceConverter for uint256;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10**18;

    AggregatorV3Interface private s_priceFeed;

    // 6. Events

    // 7. Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // 8. Functions
    // 8.1. Constructor
    // 8.2 receive function
    // 8.3 fallback function
    // 8.4. External functions
    // 8.5. Public functions
    // 8.6. Internal functions
    // 8.7. Private functions
    // 8.8. View / purefunctions

    constructor(address priceFeedAdress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAdress);
    }

    // wil not be tested currently
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function allows users to send ETH to the contract to fund the owner.
     * @dev This is just an example to lean Solidity and Chainlink
     */
    function fund() public payable {
        require( // require is mor eexpensive than reverts! Something to keep in mind
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            'You need to spend more ETH!'
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }('');
        require(callSuccess, 'Call failed');
    }

    function cheaperWithDraw() public onlyOwner {
        // switched s_funders with a memory variable, so we do not read so often from storage
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }('');
        require(callSuccess, 'Call failed');
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
