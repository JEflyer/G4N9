//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./libraries/stakeLib.sol";

contract Stake is ERC721Holder, ReentrancyGuard {

    event Staked(address staker, uint256 tokenId);
    event Unstaked(address staker, uint256 tokenId);
    event Rewarded(address staker, uint256 amount);
    event NewAdmin(address newAdmin);
    
    struct Tx {
        address staker;
        uint256 blockStaked;
    }

    mapping(uint16 => Tx) private stakeDetails;

    mapping(uint16 => bool) private currentlyStaked;

    uint256 private rewardAmountPerBlock = 12731717254023;

    address private minter;
    address private g4n9;
    address private admin;

    mapping(address => uint16[]) private tokensOwned;

    uint16 private totalStaked;

    constructor(
        address _minter,
        uint256 _reward,
        address _g4n9
    ) {
        index=0;
        g4n9 = _g4n9;
        minter = _minter;
        rewardAmountPerBlock = _reward;
        totalStaked = 0;
        admin = msg.sender;
    }

    modifier onlyAdmin{
        require(msg.sender == admin, "NA");
        _;
    }

    function getNoStaked(address query) external view returns(uint16){
        return uint16(tokensOwned[query].length);
    }

    //change reward amount
    function changeReward(uint256 _reward) external onlyAdmin {
        rewardAmountPerBlock = _reward;
    }

    //change admin address
    function changeAdmin(address _new) external onlyAdmin {
        admin = _new;
        emit NewAdmin(_new);
    }

    //withdraw remaining $g4n9 from contract
    function withdraw() external onlyAdmin {
        uint256 bal = IERC20(g4n9).balanceOf(address(this));
        IERC20(g4n9).transferFrom(address(this), admin, bal);
    } 


    //stake 1
    function stake (uint16 tokenId) external nonReentrant {
        //check that NFT is not already staked
        require(!currentlyStaked[tokenId]);

        //check that msg.sender == owner of tokenID to be staked
        StakeLib.owns(tokenId, minter);
    
        //transfer token to this address
        StakeLib.bringHere(tokenId, minter);
        totalStaked++;

        //insert Tx
        stakeDetails[tokenId].staker = msg.sender;
        stakeDetails[tokenId].blockStaked = block.number;
        
        //add to currently staked
        currentlyStaked[tokenId] = true;

        addTokenToStakedList(msg.sender, tokenId);

        noStaked[msg.sender]+=1;

        emit Staked(msg.sender, tokenId);
    }

    //stake multiple
    function stakeMul(uint16[] memory tokenIds) external nonReentrant{
        //check array size
        require(tokenIds.length <= 50);
        
        //check that NFTs are not already staked
        for(uint8 i = 0; i< tokenIds.length; i++){
            require(!currentlyStaked[tokenIds[i]]);
        }

        //check that msg.sender == owner of all tokenIDs to be staked
        StakeLib.ownsMul(tokenIds, minter);

        //transfer tokens to this address
        StakeLib.bringHereMul(tokenIds, minter);

        totalStaked+=uint16(tokenIds.length);


        //insert Txs
        for(uint8 i = 0; i< tokenIds.length; i++){
            stakeDetails[tokenIds[i]].staker = msg.sender;
            stakeDetails[tokenIds[i]].blockStaked = block.number;
         
            addTokenToStakedList(msg.sender, tokenIds[i]);


            //add to currentlyStaked map
            currentlyStaked[tokenIds[i]] = true;
            emit Staked(msg.sender, tokenIds[i]);
        }

        noStaked[msg.sender]+=uint16(tokenIds.length);

    }

    //unstake 1
    function unstake(uint16 tokenId) external nonReentrant{
        //check that NFT is staked
        require(currentlyStaked[tokenId], "Not Staked");

        //check that msg.sender == owner of tokenID to be unstaked
        // StakeLib.owns(tokenId, minter);
        require(msg.sender == stakeDetails[tokenId].staker,"NS");


        //remove from currently staked
        currentlyStaked[tokenId] = false;

        //transfer token from this address
        StakeLib.sendBack(tokenId, minter, stakeDetails[tokenId].staker);

        totalStaked--;

        //payout
        StakeLib.payout(stakeDetails[tokenId].staker, StakeLib.calculate(rewardAmountPerBlock, block.number - stakeDetails[tokenId].blockStaked), g4n9, admin);

        //remove Tx
        delete stakeDetails[tokenId];

        removeTokenFromStakedList(msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId);

    }

    //unstake multiple
    function unstakeMul(uint16[] memory tokenIds) external nonReentrant{
        require(tokenIds.length <= 50);//not sure if 10 is too many will have to check

        //setting reusable counter here
        uint8 i = 0;

        //check that NFTs are staked
        for(; i< tokenIds.length; i++){
            require(currentlyStaked[tokenIds[i]]);
        }

        //check that msg.sender == owner of all tokenIDs to be unstaked
        require(staked(msg.sender, tokenIds));

        //reset counter
        i = 0;

        //remove from currently staked
        for(; i< tokenIds.length; i ++){
            currentlyStaked[tokenIds[i]] = false;
        }

        //transfer tokens from this address
        StakeLib.sendBackMul(tokenIds, minter, stakeDetails[tokenIds[0]].staker);

        totalStaked-=uint16(tokenIds.length);

        //payout
        StakeLib.payout(stakeDetails[tokenIds[0]].staker, StakeLib.calculate(rewardAmountPerBlock, calculateTotal(tokenIds)), g4n9, admin);

        //reset counter
        i = 0;

        //remove Txs
        for(; i< tokenIds.length; i++){
            delete stakeDetails[tokenIds[i]];
            
            removeTokenFromStakedList(msg.sender, tokenIds[i]);

            emit Unstaked(msg.sender, tokenIds[i]);
        }
    }

    function staked(address query, uint16[] memory tokens) internal view returns(bool){
        for(uint8 i =0; i< tokens.length; i++){
            if(stakeDetails[tokens[i]].staker != query){
                return false;
            }
        }
        return true;
    }

    function calculateTotal(uint16[] memory tokenIds) internal view returns(uint256 total) {
        for(uint8 i = 0; i<tokenIds.length; i++){
            total += (block.number - stakeDetails[tokenIds[i]].blockStaked);
        }
    }

    //claim
    function claim() external nonReentrant{
        //get list of tokens msg.sender has staked
        uint16[] memory tokens = getTokensStaked(msg.sender);

        //check that msg.sender is a staker
        require(tokens.length != 0,"ERR:NS");

        //calculate the total reward due
        uint256 amount = rewardAmountPerBlock * calculateTotal(tokens);

        //set the tokens blockStaked to now
        for(uint16 i = 0; i < tokens.length; i++){
            stakeDetails[tokens[i]].blockStaked = block.number;
        }

        //payout to msg.sender
        StakeLib.payout(msg.sender, amount, g4n9, admin);
    }

    function getTokensStaked(address query) public view returns(uint16[] memory){
        return tokensOwned[query];
    }

    function addTokenToStakedList(address addr, uint16 token) internal {
        uint16[] storage arr = tokensOwned[addr];

        arr.push(token);
    }

    function removeTokenFromStakedList(address addr, uint16 token) internal {
        uint16[] storage arr = tokensOwned[addr];

        uint16 arrIndex =0;
        for(uint16 i =0; i< arr.length; i++){
            if(arr[i] == token){
                arrIndex = i;
            }
        }
        delete arr[arrIndex];
        arr[arrIndex] = arr[arr.length-1];
        delete arr[arr.length-1];
        arr.pop();
    }

    function getTotalPayout(address query) external view returns(uint256){
        uint16 counter =0;
        uint16[] memory tokens;
        for(uint16 i =1; i<=10000; i++){
            if(stakeDetails[i].staker == query){
                tokens[counter] = i;
                counter ++;
            }
        }
        uint256 result;
        for(uint16 i = 0; i< tokens.length; i++){
            result += (block.number - stakeDetails[tokens[i]].blockStaked) * rewardAmountPerBlock;
        }
        return result;
    }
    
    function getTotalStaked() external view returns(uint16){
        return totalStaked;
    }



}