// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IAmountGetter.sol";

contract PrenegotiatedCalculator is IAmountGetter {
    error NotAllowedTaker();

    function getMakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata,
        bytes32,
        address taker,
        uint256 takingAmount,
        uint256,
        bytes calldata extraData
    ) external view override returns (uint256) {
        (
            uint256 fixedPrice,           // scaled to 1e18
            address[] memory allowedTakers,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, address[], uint8, uint8));

        if (!_isAllowedTaker(allowedTakers, taker)) revert NotAllowedTaker();

        // Normalize to 1e18-based fixed point math
        uint256 normalizedTakingAmount = takingAmount * (10 ** (18 - takerDecimals));
        uint256 normalizedMakingAmount = (normalizedTakingAmount * 1e18) / fixedPrice;

        return normalizedMakingAmount / (10 ** (18 - makerDecimals));  // de-normalize
    }

    function getTakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata,
        bytes32,
        address taker,
        uint256 makingAmount,
        uint256,
        bytes calldata extraData
    ) external view override returns (uint256) {
        (
            uint256 fixedPrice,
            address[] memory allowedTakers,
            uint8 makerDecimals,
            uint8 takerDecimals
        ) = abi.decode(extraData, (uint256, address[], uint8, uint8));

        if (!_isAllowedTaker(allowedTakers, taker)) revert NotAllowedTaker();

        uint256 normalizedMakingAmount = makingAmount * (10 ** (18 - makerDecimals));
        uint256 normalizedTakingAmount = (normalizedMakingAmount * fixedPrice) / 1e18;

        return normalizedTakingAmount / (10 ** (18 - takerDecimals));  // de-normalize
    }

    function _isAllowedTaker(address[] memory allowedTakers, address taker) private pure returns (bool) {
        for (uint256 i = 0; i < allowedTakers.length; i++) {
            if (allowedTakers[i] == taker) {
                return true;
            }
        }
        return false;
    }

}
