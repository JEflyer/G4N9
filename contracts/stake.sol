//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Stake is IERC721Receiver {

    event Staked(address staker, uint256 tokenId);
    event Unstaked(address staker, uint256 tokenId);
    event Rewarded(address staker, uint256 amount);
    event NewAdmin(address newAdmin);
    
    struct Tx {
        address staker;
        uint256 blockStaked;
    }

    mapping(uint256 => Tx) private stakeDetails;

    mapping(address => mapping(uint256 => bool)) private currentlyStaked;

    uint256 private rewardAmountPerBlock = 12731717254023;

    address private minter;
    address private g4n9;
    address private admin;

    constructor(
        address _minter,
        uint256 _reward,
        address _g4n9
    ) {
        g4n9 = _g4n9;
        minter = _minter;
        rewardAmountPerBlock = _reward;
    }

    modifier onlyAdmin{
        require(msg.sender == admin);
        _;
    }

    //change reward amount
    function changeReward(uint256 _reward) external onlyAdmin {
        rewardAmountPerBlock = _reward;
    }

    //change admin address
    function changeAdmin(address _new) external onlyAdmin {
        admin = _new;
    }

    //withdraw remaining $g4n9 from contract
    function withdraw() external onlyAdmin {
        uint256 bal = IERC20(g4n9).balanceOf(address(this));
        IERC20(g4n9).transferFrom(address(this), admin, bal);
    } 


    //stake 1
    function stake (uint256 tokenId) external {

        //check that NFT is not already staked
        //check that msg.sender == owner of tokenID to be staked
        //get approval of NFT
        //transfer token to this address
        //insert Tx
        //add to currently staked



    }

    //stake multiple
    function stakemul(uint256[] memory tokenIds) external {
        require(tokenIds.length <= 10);
        //check that NFTs are not already staked

        //check that msg.sender == owner of all tokenIDs to be staked
        //get approval of all NFTs
        //transfer tokens to this address
        //insert Txs
        //add to currently staked
    }

    //unstake 1
    function unstake(uint256 tokenId) external {

        //check that NFT is staked
        //check that msg.sender == owner of tokenID to be unstaked
        //remove Tx
        //remove from currently staked
        //transfer token from this address
        //remove approval of NFT
        //payout

    }

    //unstake multiple
    function unstakeMul(uint256[] memory tokenIds) external {
        require(tokenIds.length <= 10);//not sure if 10 is too many will have to check
        //check that NFTs are staked
        //check that msg.sender == owner of all tokenIDs to be unstaked
        //remove Txs
        //remove from currently staked
        //transfer token from this address
        //remove approval of NFT
        //payout
    }

    //claim
    function claim() external {
        //get list of tokens msg.sender has staked
        //calculate the total reward due
        //set the tokens blockStaked to now
        //payout to msg.sender
    }

    //get tokens staked
    function getTokensStaked(address query) public returns(uint256[] memory tokens) {
        
    }

}