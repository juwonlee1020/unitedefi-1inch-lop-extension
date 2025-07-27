// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IAmountGetter.sol";
import "../interfaces/IOrderMixin.sol";

/// @title TWAPCalculator
/// @notice Calculates time-unlocked makerAsset amounts with real-time pricing via Chainlink.
///         Fully Fusion-compatible and supports arbitrary token decimals via extraData.
contract TWAPCalculator is IAmountGetter {
    error RequestedExceedsUnlocked();
    error InvalidPrice();

    /// @notice Called by Fusion to calculate the takerAsset amount required for a given makerAsset amount
    function getTakingAmount(
        IOrderMixin.Order calldata,     // order (unused)
        bytes calldata,                 // extension (unused)
        bytes32,                        // orderHash (unused)
        address,                        // taker (unused)
        uint256 makingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256 takerAmount) {
        (
            uint256 startTime,
            uint256 interval,
            uint256 chunkAmount,
            uint256 totalAmount,
            address priceFeed,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, uint256, uint256, uint256, address, uint8, uint8));

        uint256 unlocked = _getUnlockedAmount(startTime, interval, chunkAmount, totalAmount);
        uint256 available = _min(unlocked, remainingMakingAmount);
        if (makingAmount > available) revert RequestedExceedsUnlocked();

        uint256 price = _getLatestPrice(priceFeed); // 8 decimals from Chainlink
        uint256 scale = 10 ** (makerDecimals + 8 - takerDecimals); // normalize output
        takerAmount = price * makingAmount / scale;
    }

    /// @notice Called by Fusion to calculate how much makerAsset can be bought for a given takerAsset amount
    function getMakingAmount(
        IOrderMixin.Order calldata,     // order (unused)
        bytes calldata,                 // extension (unused)
        bytes32,                        // orderHash (unused)
        address,                        // taker (unused)
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256 makerAmount) {
        (
            uint256 startTime,
            uint256 interval,
            uint256 chunkAmount,
            uint256 totalAmount,
            address priceFeed,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, uint256, uint256, uint256, address, uint8, uint8));

        uint256 price = _getLatestPrice(priceFeed); // 8 decimals
        uint256 scale = 10 ** (makerDecimals + 8 - takerDecimals);
        makerAmount = takingAmount * scale / price;

        uint256 unlocked = _getUnlockedAmount(startTime, interval, chunkAmount, totalAmount);
        uint256 available = _min(unlocked, remainingMakingAmount);
        if (makerAmount > available) revert RequestedExceedsUnlocked();

        // Round down to nearest chunk
        uint256 chunks = makerAmount / chunkAmount;
        makerAmount = chunks * chunkAmount;
    }

    /// @dev Internal helper to get how much makerAsset is currently unlocked
    function _getUnlockedAmount(
        uint256 startTime,
        uint256 interval,
        uint256 chunkAmount,
        uint256 totalAmount
    ) internal view returns (uint256) {
        if (block.timestamp < startTime) return 0;

        uint256 elapsed = block.timestamp - startTime;
        uint256 chunksUnlocked = elapsed / interval;
        uint256 unlocked = chunksUnlocked * chunkAmount;

        return unlocked > totalAmount ? totalAmount : unlocked;
    }

    /// @dev Internal helper to fetch the latest price from Chainlink
    function _getLatestPrice(address priceFeed) internal view returns (uint256) {
        (, int256 price,,,) = AggregatorV3Interface(priceFeed).latestRoundData();
        if (price <= 0) revert InvalidPrice();
        return uint256(price);
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

}
