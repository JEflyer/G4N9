const {expect} = require("chai")
const {ethers} = require("hardhat")

let deployer, user2,user3,user4,user5,user6
let stake,Stake
let minter,Minter
let token,Token
let provider


async function Mint(amount, from) {
    await Minter.connect(from).mint(amount,{value: ethers.utils.parseEther((amount * 1).toString())})
}

async function StakeMul(from,ids){
    it("Attemping No."+ids.length, async() => {
        await Stake.connect(from).stakeMul(ids)
    })
}

async function UnstakeMul(from,ids){
    it("Attemping No."+ids.length, async() => {
        await Stake.connect(from).unstakeMul(ids)
    })
}

async function getNFTs(queryWallet){
    return await Minter.walletOfOwner(queryWallet)
}

describe("Testing", () => {

    beforeEach(async() => {
        //assign provider
        provider = ethers.provider

        //get accounts
        [deployer, user2,user3,user4,user5,user6] = await ethers.getSigners()

        //get & deploy minter
        minter = await ethers.getContractFactory("Minter")
        Minter = await minter.deploy("","","","")
        await Minter.deployed()

        //get & deploy token
        token = await ethers.getContractFactory("G4N9TOKEN")
        Token = await token.deploy()
        await Token.deployed()

        //get & deploy staking contract
        stake = await ethers.getContractFactory("Stake")
        Stake = await stake.deploy(
            Minter.address,
            12731717254023,
            Token.address
        )
        await Stake.deployed()

        //mint 10 NFTs for each wallet, 10 extra NFTs to user2 for limit check
        await Mint(10,deployer)
        await Mint(10,user2)
        await Mint(10,user2)
        await Mint(10,user3)
        await Mint(10,user4)
        await Mint(10,user5)
        await Mint(10,user6)

        //send tokens to staking contract
        await Token.connect(deployer).transfer(Stake.address, ethers.utils.parseEther("10000"))
    })


    it("Should allow a user to stake", async() => {
        
    })

    it("Should not allow a user to stake a token they do not own", async() => {
        
    })

    it("Should allow a user to unstake their staked token", async() => {
        
    })

    it("Should not allow a user to unstake a token they do not own", async() => {
        
    })

    it("Should return the correct tokens staked by a user", async() => {
        
    })

    it("Should allow the user to claim rewards after an amount of time", async() => {
        
    })

    it("Should not allow a user to claim rewards for a token they do not own", async() => {
        
    })

    it("Should allow the admin to change the admin", async() => {
        
    })

    it("Should not allow a wallet other than admin to change the admin", async() => {
        
    })

    it("Should allow the admin to withdraw the remaining tokens from the contract", async() => {
        
    })

    it("Should not allow a wallet other than admin to withdraw the remaining tokens from the contract", async() => {
        
    })

    it("Should allow the admin to change the reward amount", async() => {
        
    })

    it("Should not allow a wallet other than admin to change the reward amount", async() => {
        
    })

    // it(" ", async() => {
        
    // })

    describe("Checking what the maximum that can be staked in one transaction", () => {

        let tokens = await Minter.walletOfOwner(user2.address) 

        for(let i = 1; i<= 20; i++){
            let sending = []
            for(let j = 0; j< i; j++){
                sending.push(tokens[j])
            }

            await StakeMul(user2,sending)
        }


    })

    describe("Checking what the maximum that can be unstaked in one transaction", () => {

        beforeEach(async() => {
            let tokens = await Minter.walletOfOwner(user2.address) 
            await StakeMul(user2,tokens)            
        })

        

        for(let i = 1; i<= 20; i++){
            let returning = []
            for(let j = 0; j< i; j++){
                sending.push(tokens[j])
            }

            await UnstakeMul(user2,returning)
        }


    })



})