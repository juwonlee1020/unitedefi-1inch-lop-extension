// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IAmountGetter } from "../interfaces/IAmountGetter.sol";
import { IOrderMixin } from "../interfaces/IOrderMixin.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MultiPhaseAmountCalculator is IAmountGetter {
    struct Phase {
        uint256 start;
        uint256 end;
        address calculator;
        bytes extraData;
    }

    function decodeExtraData(bytes calldata extraData) internal pure returns (bool, address, Phase[] memory) {
        (bool useTime, address oracle, Phase[] memory phases) = abi.decode(extraData, (bool, address, Phase[]));
        return (useTime, oracle, phases);
    }

    function getLatestPrice(address oracle) public view returns (uint256) {
        (, int256 answer,,,) = AggregatorV3Interface(oracle).latestRoundData();
        require(answer > 0, "Invalid price");
        return uint256(answer) * 1e10;
    }

    function getCurrentPhase(bool useTime, address oracle, Phase[] memory phases) internal view returns (Phase memory) {
        uint256 metric = useTime ? block.timestamp : getLatestPrice(oracle);
        for (uint256 i = 0; i < phases.length; i++) {
            if (metric >= phases[i].start && metric < phases[i].end) {
                return phases[i];
            }
        }
        revert("No active phase");
    }

    function getTakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256) {
        (bool useTime, address oracle, Phase[] memory phases) = decodeExtraData(extraData);
        Phase memory p = getCurrentPhase(useTime, oracle, phases);
        return IAmountGetter(p.calculator).getTakingAmount(
            order,
            extension,
            orderHash,
            taker,
            makingAmount,
            remainingMakingAmount,
            p.extraData
        );
    }

    function getMakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view override returns (uint256) {
        (bool useTime, address oracle, Phase[] memory phases) = decodeExtraData(extraData);
        Phase memory p = getCurrentPhase(useTime, oracle, phases);
        return IAmountGetter(p.calculator).getMakingAmount(
            order,
            extension,
            orderHash,
            taker,
            takingAmount,
            remainingMakingAmount,
            p.extraData
        );
    }
}
