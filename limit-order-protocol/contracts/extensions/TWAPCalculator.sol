// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IAmountGetter.sol";
import "../interfaces/IOrderMixin.sol";

/// @title TWAPCalculator (Chunk-Based)
/// @notice Calculates fixed-interval unlocked amounts for makerAsset with Chainlink pricing.
contract TWAPCalculator is IAmountGetter {
    error RequestedExceedsUnlocked();
    error InvalidPrice();

    /// @notice Decode parameters from extraData
    function decodeExtraData(bytes calldata extraData)
        external
        pure
        returns (
            uint256 startTime,
            uint256 interval,
            uint256 chunkAmount,
            address priceFeed,
            uint8 makerDecimals,
            uint8 takerDecimals
        )
    {
        return abi.decode(extraData, (uint256, uint256, uint256, address, uint8, uint8));
    }

    /// @notice Called by Fusion to calculate takerAsset required for a given makingAmount
    function getTakingAmount(
        IOrderMixin.Order calldata, // order (unused)
        bytes calldata,             // extension (unused)
        bytes32,                    // orderHash (unused)
        address,                    // taker (unused)
        uint256 makingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256 takerAmount) {
        (
            uint256 startTime,
            uint256 interval,
            uint256 chunkAmount,
            address priceFeed,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, uint256, uint256, address, uint8, uint8));

        uint256 unlocked = _getUnlockedAmount(startTime, interval, chunkAmount, remainingMakingAmount);
        if (makingAmount > unlocked) revert RequestedExceedsUnlocked();

        uint256 price = _getLatestPrice(priceFeed); // 8 decimals from Chainlink
        uint256 scale = 10 ** (makerDecimals + 8 - takerDecimals); // normalize to target decimals
        takerAmount = price * makingAmount / scale;
    }

    /// @notice Called by Fusion to calculate how much makerAsset is given for a takerAsset amount
    function getMakingAmount(
        IOrderMixin.Order calldata, // order (unused)
        bytes calldata,             // extension (unused)
        bytes32,                    // orderHash (unused)
        address,                    // taker (unused)
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256 makerAmount) {
        (
            uint256 startTime,
            uint256 interval,
            uint256 chunkAmount,
            address priceFeed,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, uint256, uint256, address, uint8, uint8));

        uint256 price = _getLatestPrice(priceFeed); // Chainlink: 8 decimals
        uint256 scale = 10 ** (makerDecimals + 8 - takerDecimals);
        makerAmount = takingAmount * scale / price;

        uint256 unlocked = _getUnlockedAmount(startTime, interval, chunkAmount, remainingMakingAmount);
        if (makerAmount > unlocked) revert RequestedExceedsUnlocked();

        // Round down to nearest full chunk
        uint256 chunks = makerAmount / chunkAmount;
        makerAmount = chunks * chunkAmount;
    }

    /// @dev Internal: Calculates how much makerAsset is unlocked at current time
    function _getUnlockedAmount(
        uint256 startTime,
        uint256 interval,
        uint256 chunkAmount,
        uint256 remaining
    ) internal view returns (uint256) {
        if (block.timestamp < startTime) return 0;

        uint256 elapsed = block.timestamp - startTime;
        uint256 chunksUnlocked = elapsed / interval;
        uint256 unlocked = chunksUnlocked * chunkAmount;

        return unlocked > remaining ? remaining : unlocked;
    }

    /// @dev Internal: Fetch latest Chainlink price (8 decimals)
    function _getLatestPrice(address priceFeed) internal view returns (uint256) {
        (, int256 price,,,) = AggregatorV3Interface(priceFeed).latestRoundData();
        if (price <= 0) revert InvalidPrice();
        return uint256(price);
    }
}
