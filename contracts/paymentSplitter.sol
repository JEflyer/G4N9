//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Splitter {

    address[] private paymentsTo;
    address[] private proposedPaymentsTo;

    uint16[] private shares;
    uint16[] private proposedShares;

    //for keeping track of the signs for amending addresses being paid to & how much each address is being paid
    uint8 psCurrentVotes;
    mapping(address => bool) psSignBook;

    //for keeping track of the signs for funds to be paid out
    uint8 currentSigns;
    mapping(address => bool) signBook;

    constructor(
        address[] memory _to,
        uint16[] memory _shares
    ){
        paymentsTo = _to;
        shares = _shares;
        psCurrentVotes = 0;
        currentSigns = 0;
    }

    modifier isApproved{
        require(isInApproved());
        _;
    }

    function isInApproved() internal view returns (bool){
        for(uint8 i = 0; i< paymentsTo.length; i++){
            if(msg.sender == paymentsTo[i]){
                return true;
            }
        }
        return false;
    }

    function splitFunds() external isApproved{
        //check that msg.sender is authorised & hasn't already signed
        require(!signBook[msg.sender]);

        //sign transaction
        signBook[msg.sender] = true;
        currentSigns +=1;

        //if all 4 signatures have been met split funds
        if()
    }

    function proposeANewSplit(
        address[] memory _to,
        uint16[] memory _shares
    ) external isApproved {

    }

    function approveNewSplit() external isApproved {
        
    }

    function declineNewSplit() external isApproved {

    }

}