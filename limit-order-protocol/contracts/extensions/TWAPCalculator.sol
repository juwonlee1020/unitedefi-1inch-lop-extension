// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TWAPCalculator
/// @notice A Fusion-compatible IAmountGetter that unlocks makerAsset in time-based chunks
///         and quotes a fixed takerAsset per unit of makerAsset.
///         Use case: TWAP-style execution with optional solver-side batching.

contract TWAPCalculator {
    uint256 public immutable startTime;
    uint256 public immutable interval;       // in seconds
    uint256 public immutable chunkAmount;    // in makerAsset units (e.g., 1e18 = 1 ETH)
    uint256 public immutable pricePerUnit;   // takerAsset per 1e18 of makerAsset
    uint256 public immutable totalAmount;    // total makerAsset for the order

    constructor(
        uint256 _startTime,
        uint256 _interval,
        uint256 _chunkAmount,
        uint256 _pricePerUnit,
        uint256 _totalAmount
    ) {
        require(_interval > 0, "Interval must be > 0");
        require(_chunkAmount > 0, "Chunk must be > 0");
        require(_pricePerUnit > 0, "Price must be > 0");
        require(_totalAmount > 0, "Total amount must be > 0");

        startTime = _startTime;
        interval = _interval;
        chunkAmount = _chunkAmount;
        pricePerUnit = _pricePerUnit;
        totalAmount = _totalAmount;
    }

    /// @notice Get how much takerAsset is required for given makerAmount
    /// @dev Checks if the requested makerAmount is within the unlocked quota
    function getTakerAmount(
        address, address, uint256 makerAmount
    ) external view returns (uint256 takerAmount) {
        uint256 unlocked = _getUnlockedAmount();
        require(makerAmount <= unlocked, "Requested maker amount exceeds unlocked");

        takerAmount = pricePerUnit * makerAmount / 1e18;
    }

    /// @notice Optional reverse calculation: how much makerAsset can be bought for takerAmount
    /// @dev Ensures the implied makerAmount is within current unlocked quota
    function getMakerAmount(
        address, address, uint256 takerAmount
    ) external view returns (uint256 makerAmount) {
        makerAmount = takerAmount * 1e18 / pricePerUnit;

        uint256 unlocked = _getUnlockedAmount();
        require(makerAmount <= unlocked, "Requested maker amount exceeds unlocked");

        // Optional: Round down to nearest chunkAmount to avoid weird decimals
        uint256 chunks = makerAmount / chunkAmount;
        makerAmount = chunks * chunkAmount;
    }

    /// @dev Internal helper: computes unlocked makerAsset amount based on time
    function _getUnlockedAmount() internal view returns (uint256) {
        if (block.timestamp < startTime) return 0;

        uint256 elapsed = block.timestamp - startTime;
        uint256 chunksUnlocked = elapsed / interval;
        uint256 unlocked = chunksUnlocked * chunkAmount;

        if (unlocked > totalAmount) {
            unlocked = totalAmount;
        }

        return unlocked;
    }
}
