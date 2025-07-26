// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IAmountGetter.sol";

/// @title Hybrid TWAP/Dutch Auction Amount Calculator for 1inch Limit Orders
/// @notice Uses increasing price (TWAP-style) before switchTime, and decreasing price (Dutch-style) after
contract HybridTWAPDutchCalculator is IAmountGetter {
    error InvalidTimeRange();

    function getTakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata, // extension unused
        bytes32,        // orderHash unused
        address,        // taker unused
        uint256 makingAmount,
        uint256,        // remainingMakingAmount unused
        bytes calldata extraData
    ) external view override returns (uint256) {
        (
            uint256 switchTime,
            uint256 twapStartPrice,
            uint256 twapEndPrice,
            uint256 twapStartTime,
            uint256 twapEndTime,
            uint256 dutchStartPrice,
            uint256 dutchEndPrice,
            uint256 dutchStartTime,
            uint256 dutchEndTime
        ) = abi.decode(extraData, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256));

        uint256 nowTime = block.timestamp;

        if (nowTime <= switchTime) {
            uint256 clampedTime = _clamp(nowTime, twapStartTime, twapEndTime);
            uint256 twapPrice = twapStartPrice + (twapEndPrice - twapStartPrice) * (clampedTime - twapStartTime) / (twapEndTime - twapStartTime);
            return makingAmount * twapPrice / 1e18;
        } else {
            uint256 clampedTime = _clamp(nowTime, dutchStartTime, dutchEndTime);
            uint256 dutchPrice = (dutchStartPrice * (dutchEndTime - clampedTime) + dutchEndPrice * (clampedTime - dutchStartTime)) / (dutchEndTime - dutchStartTime);
            return makingAmount * dutchPrice / 1e18;
        }
    }

    function getMakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata, // extension unused
        bytes32,        // orderHash unused
        address,        // taker unused
        uint256 takingAmount,
        uint256,        // remainingMakingAmount unused
        bytes calldata extraData
    ) external view override returns (uint256) {
        (
            uint256 switchTime,
            uint256 twapStartPrice,
            uint256 twapEndPrice,
            uint256 twapStartTime,
            uint256 twapEndTime,
            uint256 dutchStartPrice,
            uint256 dutchEndPrice,
            uint256 dutchStartTime,
            uint256 dutchEndTime
        ) = abi.decode(extraData, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256));

        uint256 nowTime = block.timestamp;

        if (nowTime <= switchTime) {
            uint256 clampedTime = _clamp(nowTime, twapStartTime, twapEndTime);
            uint256 twapPrice = twapStartPrice + (twapEndPrice - twapStartPrice) * (clampedTime - twapStartTime) / (twapEndTime - twapStartTime);
            return takingAmount * 1e18 / twapPrice;
        } else {
            uint256 clampedTime = _clamp(nowTime, dutchStartTime, dutchEndTime);
            uint256 dutchPrice = (dutchStartPrice * (dutchEndTime - clampedTime) + dutchEndPrice * (clampedTime - dutchStartTime)) / (dutchEndTime - dutchStartTime);
            return takingAmount * 1e18 / dutchPrice;
        }
    }

    function _clamp(uint256 x, uint256 minVal, uint256 maxVal) internal pure returns (uint256) {
        if (x < minVal) return minVal;
        if (x > maxVal) return maxVal;
        return x;
    }
}