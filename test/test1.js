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

        //get accounts
        [deployer, user2,user3,user4,user5,user6] = await ethers.getSigners()

        //get & deploy minter
        minter = await ethers.getContractFactory("cryptog4n9nft")
        Minter = await minter.deploy("","","","")
        await Minter.deployed()

        await Minter.connect(deployer).pause(false)
        await Minter.connect(deployer).setmaxMintAmount(20)
        await Minter.connect(deployer).setOnlyWhitelisted(false)

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
        await Mint(10,user2,{value: ethers.utils.parseEther("10")})
        await Mint(10,user2,{value: ethers.utils.parseEther("10")})
        await Mint(10,user3,{value: ethers.utils.parseEther("10")})
        await Mint(10,user4,{value: ethers.utils.parseEther("10")})
        await Mint(10,user5,{value: ethers.utils.parseEther("10")})
        await Mint(10,user6,{value: ethers.utils.parseEther("10")})

        //send tokens to staking contract
        await Token.connect(deployer).approve(Stake.address, ethers.utils.parseEther("10000"))
    })


    it("Should allow a user to stake", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        expect(await Stake.connect(user2).stake(tokens[0]))        
    })

    it("Should not allow a user to stake a token they do not own", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        expect(Stake.connect(user3).stake(tokens[0])).to.be.revertedWith("Err")                
    })

    it("Should allow a user to unstake their staked token", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        await Stake.connect(user2).stake(tokens[0])
        expect(await Stake.connect(user2).unstake(tokens[0]))
    })

    it("Should not allow a user to unstake a token they do not own", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        await Stake.connect(user2).stake(tokens[0])
        expect(Stake.connect(user3).unstake(tokens[0])).to.be.revertedWith("NS")
    })

    it("Should return the correct tokens staked by a user", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        await Stake.connect(user2).stake(tokens[0])
        // console.log(tokens[0])
        let stakedTokens = await Stake.getTokensStaked(user2.address)
        // console.log(stakedTokens.toString())
        expect(stakedTokens[0].toString()).to.be.equal("11")
    })

    //I think claiming stake rewards for alot of NFTs will not work - still to be tested
    it("Should allow the user to claim rewards after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        await Minter.connect(user2).approve(Stake.address, tokens[0])
        await Stake.connect(user2).stake(tokens[0])
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    //this test is null & void as tokens to be claimed from are generated in the contract
    // it("Should not allow a user to claim rewards for a token they do not own", async() => {
        
    // })

    it("Should allow the admin to change the admin", async() => {
        expect(await Stake.connect(deployer).changeAdmin(user2.address))
    })

    it("Should not allow a wallet other than admin to change the admin", async() => {
        expect(Stake.connect(user2).changeAdmin(user2.address)).to.be.revertedWith("NA")
    })

    it("Should allow the admin to withdraw the remaining tokens from the contract", async() => {
        expect(await Stake.connect(deployer).withdraw())
    })

    it("Should not allow a wallet other than admin to withdraw the remaining tokens from the contract", async() => {
        expect(Stake.connect(user2).withdraw()).to.be.revertedWith("NA")
        
    })

    it("Should allow the admin to change the reward amount", async() => {
        expect(await Stake.connect(deployer).changeReward(1273171725402))
    })

    it("Should not allow a wallet other than admin to change the reward amount", async() => {
        expect(Stake.connect(deployer).changeReward(1273171725402)).to.be.revertedWith("NA")
    })

    // it(" ", async() => {
        
    // })

    // describe("Checking what the maximum that can be staked in one transaction", () => {

    //     let tokens = await Minter.walletOfOwner(user2.address) 

    //     for(let i = 1; i<= 20; i++){
    //         let sending = []
    //         for(let j = 0; j< i; j++){
    //             sending.push(tokens[j])
    //         }

    //         await StakeMul(user2,sending)
    //     }


    // })

    // describe("Checking what the maximum that can be unstaked in one transaction", () => {

    //     beforeEach(async() => {
    //         let tokens = await Minter.walletOfOwner(user2.address) 
    //         await StakeMul(user2,tokens)            
    //     })

        

    //     for(let i = 1; i<= 20; i++){
    //         let returning = []
    //         for(let j = 0; j< i; j++){
    //             sending.push(tokens[j])
    //         }

    //         await UnstakeMul(user2,returning)
    //     }


    // })



})