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
        await Minter.connect(deployer).setmaxMintAmount(50)
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

    it("Testing Staking:1", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 1

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    
    it("Testing Staking:2", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 2

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:3", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 3

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    it("Testing Staking:4", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 4

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:5", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 5

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:6", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 6

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    it("Testing Staking:7", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 7

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    
    it("Testing Staking:8", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 8

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    
    it("Testing Staking:9", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 9

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })

    it("Testing Staking:10", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 10

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:11", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 11

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:12", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 12

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:13", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 13

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:14", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 14

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:15", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 15

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:16", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 16

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:17", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 17

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:18", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 18

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:19", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 19

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    it("Testing Staking:20", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 20

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:21", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 21

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:22", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 22

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:23", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 23

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:24", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 24

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:25", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 25

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:26", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 26

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:27", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 27

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:28", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 28

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:29", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 29

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
    
    
    it("Testing Staking:30", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 30

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:31", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 31

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:32", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 32

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:33", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 33

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:34", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 34

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:35", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 35

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:36", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 36

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:37", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 37

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:38", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 38

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:39", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 39

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        
    it("Testing Staking:40", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 40

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        expect(await Stake.connect(user2).stakeMul(sending))
    })
        

    
    it("Testing unStaking:1", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 1

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    
    it("Testing unStaking:2", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 2

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:3", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 3

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    it("Testing unStaking:4", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 4

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:5", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 5

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:6", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 6

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    it("Testing unStaking:7", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 7

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    
    it("Testing unStaking:8", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 8

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    
    it("Testing unStaking:9", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 9

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    it("Testing unStaking:10", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 10

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:11", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 11

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:12", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 12

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:13", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 13

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:14", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 14

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:15", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 15

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:16", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 16

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
            await Minter.connect(user2).approve(Stake.address,tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:17", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 17

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:18", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 18

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:19", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 19

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    it("Testing unStaking:20", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 20

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:21", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 21

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:22", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 22

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:23", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 23

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:24", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 24

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:25", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 25

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:26", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 26

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:27", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 27

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:28", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 28

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:29", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 29

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
    
    
    it("Testing unStaking:30", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 30

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:31", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 31

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:32", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 32

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:33", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 33

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:34", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 34

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:35", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 35

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:36", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 36

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:37", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 37

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:38", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 38

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:39", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 39

        for(let i = 0; i< x; i++){
            await Minter.connect(user2).approve(Stake.address,tokens[i])
            sending.push(tokens[i])
        }
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })
        
    it("Testing unStaking:40", async() => {
        let tokens = await Minter.walletOfOwner(user2.address) 
        let sending = []
        let x = 40

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)

        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])

        expect(await Stake.connect(user2).unstakeMul(sending))
    })

    //--------------------------- claim test---------------//
    it("Should allow the user to claim rewards for 2 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 2

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 3 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 3

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 4 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 4

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 5 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 5

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 6 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 6

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 7 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 7

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 8 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 8

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 9 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 9

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 10 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 10

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 11 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 11

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 12 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 12

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 13 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 13

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 14 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 14

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 15 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 15

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 16 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 16

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 17 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 17

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 18 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 18

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 19 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 19

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 20 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 20

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 21 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 21

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 22 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 22

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 23 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 23

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 24 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 24

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 25 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 25

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })

    it("Should allow the user to claim rewards for 26 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 26

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 27 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 27

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 28 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 28

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 29 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 29

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 30 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 30

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 31 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 31

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 32 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 32

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 33 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 33

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 34 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 34

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 35 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 35

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 36 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 36

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 37 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 37

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 38 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 38

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 39 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 39

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
    it("Should allow the user to claim rewards for 40 tokens, after an amount of time", async() => {
        let tokens = await Minter.walletOfOwner(user2.address)
        let sending = []
        let x = 40

        for(let i = 0; i< x; i++){
            sending.push(tokens[i])
        }
        await Minter.connect(user2).setApprovalForAll(Stake.address,true)
        
        await Stake.connect(user2).stakeMul(sending)
            
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 2])
    
        expect(await Stake.connect(user2).claim())
    })
    
})