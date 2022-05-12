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
        uint32 blockStaked;
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

    //amount of tokens that a wallet has staked in this contract
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

    //stake 1
    function stake (uint16 tokenId) external nonReentrant {
        //check that NFT is not already staked
        require(!currentlyStaked[tokenId]);

        //check that msg.sender == owner of tokenID to be staked
        // StakeLib.owns(tokenId, minter);

        //check that msg.sender == owner of tokenID to be staked
        address owner = IERC721(minter).ownerOf(uint256(tokenId));
        require(msg.sender == owner , "Err");
    
        //transfer token to this address
        // StakeLib.bringHere(tokenId, minter);

        //transfer token to this address
        IERC721(minter).safeTransferFrom(msg.sender, address(this), uint256(tokenId));

        //increment totalStaked
        totalStaked++;

        //insert Tx
        stakeDetails[tokenId].staker = msg.sender;
        stakeDetails[tokenId].blockStaked = uint32(block.number);
        
        //add to currently staked
        currentlyStaked[tokenId] = true;

        //add token to msg.sender's array of staked tokens
        addTokenToStakedList(tokenId);

        emit Staked(msg.sender, tokenId);
    }

    //stake multiple
    function stakeMul(uint16[] memory tokenIds) external nonReentrant{
        //check array size
        require(tokenIds.length <= 40);
        
        //declare counter for the for loops
        uint8 i = 0;

        //check that NFTs are not already staked
        for(i = 0; i< tokenIds.length; i++){
            require(!currentlyStaked[tokenIds[i]]);
        }

        //check that msg.sender == owner of all tokenIDs to be staked
        // StakeLib.ownsMul(tokenIds, minter);

        //check that msg.sender == owner of all tokenIDs to be staked
        for(i =0; i< tokenIds.length; i++){
            require(IERC721(minter).ownerOf(uint256(tokenIds[i])) == msg.sender, "Err");
        }

        //transfer tokens to this address
        // StakeLib.bringHereMul(tokenIds, minter);

        //transfer tokens to this address
        for(i = 0; i< tokenIds.length; i++){
            IERC721(minter).safeTransferFrom(msg.sender, address(this), uint256(tokenIds[i]));
        }

        //add the amount of tokens being staked to the total staked amount 
        totalStaked+=uint16(tokenIds.length);

        //insert Txs
        for(i = 0; i< tokenIds.length; i++){
            stakeDetails[tokenIds[i]] = Tx({
                staker: msg.sender,
                blockStaked: uint32(block.number)
            });
         
            addTokenToStakedList(tokenIds[i]);

            //add to currentlyStaked mapping
            currentlyStaked[tokenIds[i]] = true;
            emit Staked(msg.sender, tokenIds[i]);
        }

    }

    //unstake 1
    function unstake(uint16 tokenId) external nonReentrant{
        //check that NFT is staked
        require(currentlyStaked[tokenId], "Not Staked");

        //check that msg.sender == owner of tokenID to be unstaked
        require(msg.sender == stakeDetails[tokenId].staker,"NS");

        //remove from currently staked
        currentlyStaked[tokenId] = false;

        //transfer token from this address
        // StakeLib.sendBack(tokenId, minter, stakeDetails[tokenId].staker);
        IERC721(minter).safeTransferFrom(address(this), msg.sender, uint256(tokenId));

        //decrement totalStaked
        totalStaked--;

  
        //payout
        uint256 amount = StakeLib.calculate(rewardAmountPerBlock, block.number - stakeDetails[tokenId].blockStaked); 
        IERC20(g4n9).transferFrom(
            admin, 
            msg.sender, 
            amount
        ); 
        emit Rewarded(msg.sender, amount);

        //remove Tx
        delete stakeDetails[tokenId];

        //remove tokenID from msg.sender's array of staked tokens
        removeTokenFromStakedList(tokenId);

        emit Unstaked(msg.sender, tokenId);
    }

    //unstake multiple
    function unstakeMul(uint16[] memory tokenIds) external nonReentrant{
        require(tokenIds.length <= 40);

        //setting reusable counter here
        uint8 i = 0;

        //check that NFTs are staked
        for(; i< tokenIds.length; i++){
            require(currentlyStaked[tokenIds[i]]);
        }

        //check that msg.sender == owner of all tokenIDs to be unstaked
        require(staked(msg.sender, tokenIds));

        //remove from currently staked
        for(i = 0; i< tokenIds.length; i ++){
            currentlyStaked[tokenIds[i]] = false;
        }

        //transfer tokens from this address
        // StakeLib.sendBackMul(tokenIds, minter, stakeDetails[tokenIds[0]].staker);
        for(i = 0; i< tokenIds.length; i++){
            IERC721(minter).safeTransferFrom(address(this), msg.sender, uint256(tokenIds[i]));
        }

        //reduce totalStaked by the amount of tokens being unstaked
        totalStaked-=uint16(tokenIds.length);

        //payout
        // StakeLib.payout(stakeDetails[tokenIds[0]].staker, StakeLib.calculate(rewardAmountPerBlock, calculateTotal(tokenIds)), g4n9, admin);
        //payout
        uint256 amount = StakeLib.calculate(rewardAmountPerBlock, calculateTotal(tokenIds)); 
        IERC20(g4n9).transferFrom(
            admin, 
            msg.sender, 
            amount
        ); 
        emit Rewarded(msg.sender, amount);


        //remove Txs
        for(i = 0; i< tokenIds.length; i++){
            //delete the stakeDetails for tokens being unstaked 
            //this also refunds upto 15k gas
            delete stakeDetails[tokenIds[i]];

            //remove token from msg.senders array of staked tokens
            removeTokenFromStakedList(tokenIds[i]);

            emit Unstaked(msg.sender, tokenIds[i]);
        }
    }

    //for checking if all of the tokens given are staked by msg.sender
    function staked(address query, uint16[] memory tokens) internal view returns(bool){
        for(uint8 i =0; i< tokens.length; i++){
            if(stakeDetails[tokens[i]].staker != query){
                return false;
            }
        }
        return true;
    }

    //calculate the total blocks that an array of tokens has been staked
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
            stakeDetails[tokens[i]].blockStaked = uint32(block.number);
        }

        //payout to msg.sender
        IERC20(g4n9).transferFrom(
            admin, 
            msg.sender, 
            amount
        ); 
        emit Rewarded(msg.sender, amount);

    }

    //get tokens staked by a given address
    function getTokensStaked(address query) public view returns(uint16[] memory){
        return tokensOwned[query];
    }

    //add a token to a given addresses array of staked tokens
    function addTokenToStakedList(uint16 token) internal {
        uint16[] storage arr = tokensOwned[msg.sender];

        arr.push(token);
    }

    //remove a token to a given addresses array of staked tokens
    function removeTokenFromStakedList(uint16 token) internal {
        uint16[] storage arr = tokensOwned[msg.sender];

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

    //external view requires no gas iff all the logic is in one function
    //returns the total payout amount of $G4N9 in wei value
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
    
    //returns the total amount of tokens staked
    function getTotalStaked() external view returns(uint16){
        return totalStaked;
    }

}