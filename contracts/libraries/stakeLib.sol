//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


library StakeLib {


    //-------------------------minter----------------------------------//
    //create a 32byte "constant" mem slot
    bytes32 constant minterSlot = keccak256("minterAddress");

    //declare a struct to store minter contract address 
    struct MinterStore{
        address minterContract;
    }

    //use assembly to assign the minterStore struct to the 32byte mem slot
    //uses storage tag in return so that any changes made are made directly in the mem slot
    function minterStore() internal pure returns(MinterStore storage minter){
        bytes32 slot = minterSlot;
        assembly{
            minter.slot := slot
        }
    }

    //gets struct & sets the address in the "constant" mem slot
    function setMinter(address _minter) internal {
        MinterStore storage store = minterStore();
        store.minterContract = _minter;
    }
    //-------------------------minter----------------------------------//



    function owns(uint256 tokenID) internal view {
        address minter = minterStore().minterContract;
        address owner = IERC721(minter).ownerOf(tokenID);
        require(msg.sender == owner);
    }

    function ownsMul(uint256[] memory tokenIDs) internal {
        
    }

    function getTokensStaked() internal view returns(uint256[] memory tokenIds){
        //get list of tokens that msg.sender holds
        //check which of these tokens are staked
        //add staked tokens to an []
        //return tokens 
    }





}