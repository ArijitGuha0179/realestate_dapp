const hre = require("hardhat");

// Converts currency to token
const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether');
}

async function main() {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    const RealEstate = await hre.ethers.getContractFactory('RealEstate');
    const realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();

    console.log(`Deployed Real Estate Contract at: ${realEstate.target}`);
    console.log(`Minting 3 properties...\n`);

    // Use the correct IPFS URIs for each token
    const uris = [
        "https://ipfs.io/ipfs/QmdGJNJwL9aN1E25iAc8L2aR33SFQ8e2qDrnc7V26WJm2d?filename=1.json",
        "https://ipfs.io/ipfs/QmfE2vGSwXs49wMCshSRRu9LN5a43brFPN583bzeNmHG9Z?filename=2.json",
        "https://ipfs.io/ipfs/QmaHGmXSQ2dpuJL3nLgMpS1a9LVEM9aLHaMGJS1NziYGpv?filename=3.json"
    ];

    for (let i = 0; i < uris.length; i++) {
        let transaction = await realEstate.connect(seller).safeMint(uris[i]);
        await transaction.wait();
        console.log(`Minted property ${i + 1} with URI: ${uris[i]}`);
    }

    const Escrow = await hre.ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy(realEstate.target, seller.address, inspector.address, lender.address);
    await escrow.waitForDeployment();

    console.log(`Deployed Escrow Contract at: ${escrow.target}`);

    for (let i = 0; i < uris.length; i++) {
        let transaction = await realEstate.connect(seller).approve(escrow.target, i + 1);
        await transaction.wait();
    }

    transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10));
    await transaction.wait();

    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5));
    await transaction.wait();

    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5));
    await transaction.wait();

    console.log(`Done`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
