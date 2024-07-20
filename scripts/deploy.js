const hre=require("hardhat");

//converts currency to token
const tokens=(n)=>{
    return ethers.parseUnits(n.toString(),'ether');
 }

async function main(){
    [buyer,seller,inspector,lender]=await ethers.getSigners();

    const RealEstate=await hre.ethers.getContractFactory('RealEstate');
    const realEstate=await RealEstate.deploy();
    await realEstate.waitForDeployment();

    console.log(`Deployed Real Estate Contract at:${realEstate.target}`);
    console.log(`Minting 3 properties...\n`);
    for(let i=0;i<3;i++){
        let transaction = await realEstate.connect(seller).safeMint(`https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS/${i+1}.json`);
        await transaction.wait()
    }
    const Escrow=await ethers.getContractFactory('Escrow');
    escrow=await Escrow.deploy(realEstate.target,seller.address,inspector.address,lender.address);
    await escrow.waitForDeployment();

    console.log(`Deployed Escrow Contract at:${escrow.target}`);
    for(let i=0;i<3;i++){
        let transaction = await realEstate.connect(seller).approve(escrow.target, i+1)
        await transaction.wait()
    }

    transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
    await transaction.wait()

    console.log(`Done`)

    
}

main().catch((error)=>{
    console.error(error);
    process.exitCode = 1;

})