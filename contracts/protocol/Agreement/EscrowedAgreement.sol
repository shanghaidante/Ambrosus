pragma solidity ^0.4.11;

import "./Agreement.sol";
import "../../dependencies/ERC20Protocol.sol";
import "../Measurements/MeasurementsOnChain.sol";
import "../Requirements/Requirements.sol";
import "../Validator/Validator.sol";
import "../Market/Offer.sol";
import "../Profile/Profile.sol";
import "../Utils/Ownable.sol";

contract EscrowedAgreement is Agreement, Ownable {

    address public buyer;
    address public seller;
    uint public amount;
    uint public quantity;
    Offer public offer;
    ERC20Protocol token;

    modifier onlyBuyer() {
        require(msg.sender == buyer);
        _;
    }

    modifier onlyStage(Stages _stage) {
        require(stage == _stage);
        _;
    }

    enum Stages {
        New,
        InProgress,
        Complete,
        Canceled,
        Reimbursed
    }

    Stages public stage;

    function EscrowedAgreement(ERC20Protocol _token, Offer _offer, uint _quantity, address _buyer) {
        buyer = _buyer;
        token = _token;
        amount = _offer.priceFor(_quantity);
        seller = _offer.seller();
        offer = _offer;
        quantity = _quantity;
        stage = Stages.InProgress;
    }

    function approve() onlyBuyer onlyStage(Stages.InProgress){
        assert(token.transfer(seller, amount));
        stage = Stages.Complete;
    }

    function reimburse() onlyBuyer onlyStage(Stages.InProgress){
        assert(token.transfer(buyer, amount));
        stage = Stages.Reimbursed;
    }
}
