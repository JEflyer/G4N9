//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract G4N9TOKEN is ERC20 {
    using SafeMath for uint256;

    uint256 BURN_FEE = 1;
    uint256 TAX_FEE = 1;

    bool isBurnable = false;
    address public owner;
    event OperationResult(bool result,string message);
    mapping(address=>bool) public exclidedFromTax; 

    constructor()  ERC20("G4N9 TOKEN", "G4N9") {
        _mint(msg.sender,100000*10**18);
        owner = msg.sender;
        exclidedFromTax[msg.sender] = true;
    }
        
    modifier onlyOwner {
        require(owner == msg.sender); 
        _;
    }

    function setBurnFee(uint256 newBurnFee) public onlyOwner returns (bool success) {
        BURN_FEE = newBurnFee;
        return true;
    }
    function setTaxFee(uint256 newTaxFee) public onlyOwner returns (bool success) {
        TAX_FEE = newTaxFee;
        return true;
    }
    
    function mintToken(uint256 unit) public onlyOwner returns (bool success) {
        _mint(msg.sender,unit*10**18);
        return true;
    }

    function transfer(address recipient, uint amount) public override returns(bool success)
    {
        require(balanceOf(_msgSender()) >= amount);

        uint burnAmount = 0;
        uint taxAmount = 0;
        
        if(exclidedFromTax[_msgSender()] == false)
        {
         taxAmount = amount.mul(TAX_FEE) / 100;
        }

        if(isBurnable)
        {
          burnAmount = amount.mul(BURN_FEE) / 100;
         _burn(_msgSender(),burnAmount);
        }

         _transfer(_msgSender(),recipient,amount.sub(burnAmount).sub(taxAmount));

         exclidedFromTax[_msgSender()] = true;
        return true;
    }

    function setBurnable(bool _isBurnable) public onlyOwner returns (bool success) {
        isBurnable = _isBurnable;
        return true;
    }   
}