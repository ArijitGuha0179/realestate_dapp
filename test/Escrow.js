const { expect } = require('chai');
const {ethers}=require('hardhat');

//converts currency to token
const tokens=(n)=>{
   return ethers.parseUnits(n.toString(),'ether');
}

describe('Escrow',()=>{
  let buyer,seller,inspector,lender;
  let realEstate,escrow;
  beforeEach(async()=>{
    [buyer,seller,inspector,lender]=await ethers.getSigners()
    
    //deploy contracts
    const RealEstate=await ethers.getContractFactory('RealEstate');
    realEstate=await RealEstate.deploy();
    
    //console.log(realEstate.target);
    //console.log(realEstate.address);
    //mint NFT
    let transaction = await realEstate.connect(seller).safeMint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
    await transaction.wait()
    // console.log("RealEstate address:", realEstate.address);
    // console.log("Seller address:", seller.address);
    // console.log("Inspector address:", inspector.address);
    // console.log("Lender address:", lender.address);

    const Escrow=await ethers.getContractFactory('Escrow');
    escrow=await Escrow.deploy(realEstate.target,seller.address,inspector.address,lender.address);
    //console.log(escrow) 
    
    // Approve Property
    transaction = await realEstate.connect(seller).approve(escrow.target, 1)
    await transaction.wait()

    // List Property
    transaction = await escrow.connect(seller).list(1,buyer.address,tokens(10),tokens(5));
    await transaction.wait()

  })
  it('Deployment',async()=>{
    //setup accounts
    const result=await escrow.nftaddress();
    expect(result).to.be.equal(realEstate.target)
    const result1=await escrow.seller();
    expect(result1).to.be.equal(seller.address);
    const result2=await escrow.inspector();
    expect(result2).to.be.equal(inspector.address);
    const result3=await escrow.lender();
    expect(result3).to.be.equal(lender.address);
  })

  describe('Listing',()=>{
    it('Updated listed',async()=>{
       const temp=await escrow.isListed(1);
       expect(temp).to.be.equal(true);
    })
    it('Buyer',async()=>{
      const temp=await escrow.buyer(1);
      expect(temp).to.be.equal(buyer.address);
   })
   
   it('return purchase price',async()=>{
    const temp=await escrow.purchasePrice(1);
    expect(temp).to.be.equal(tokens(10));
    })

    it('Escrow Amount',async()=>{
      const temp=await escrow.escrowAmount(1);
      expect(temp).to.be.equal(tokens(5));
    })
    it('Update Ownership',async()=>{
      console.log(realEstate.ownerOf(1));
      const owner = await realEstate.ownerOf(1);
      // console.log(owner);
      // console.log(realEstate);
      // console.log("lol")
      // console.log(escrow)
      expect(owner).to.be.equal(escrow.target);
    })
  })

  describe('Deposists',()=>{
    beforeEach(async()=>{
      const amount=await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)});
      await amount.wait()

    })
    it('Updates Contract balance',async()=>{
      const bal=await escrow.getBalance();
      expect(bal).to.be.equal(tokens(5));
    })
  })
  describe('Inspection',()=>{
    beforeEach(async()=>{
      const amount=await escrow.connect(inspector).inspection(1,true);
      await amount.wait()

    })
    it('Inspection status',async()=>{
      const bal=await escrow.inspect(1);
      expect(bal).to.be.equal(true);
    })
  })
  describe('Approval Status',()=>{
    beforeEach(async()=>{
      const amount=await escrow.connect(buyer).approve(1);
      await amount.wait()
      const amount1=await escrow.connect(seller).approve(1);
      await amount1.wait()
      const amount2=await escrow.connect(lender).approve(1);
      await amount2.wait()
    })
    it('Approval Buyer',async()=>{
      const bal=await escrow.approval(1,buyer.address);
      expect(bal).to.be.equal(true);
    })
    it('Approval Seller',async()=>{
      const bal=await escrow.approval(1,seller.address);
      expect(bal).to.be.equal(true);
    })
    it('Approval lender',async()=>{
      const bal=await escrow.approval(1,lender.address);
      expect(bal).to.be.equal(true);
    })
  })
  describe('Sale',()=>{
    beforeEach(async()=>{
      let amount=await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)});
      await amount.wait()
      amount=await escrow.connect(inspector).inspection(1,true);
      await amount.wait()
      amount=await escrow.connect(buyer).approve(1);
      await amount.wait()
      amount=await escrow.connect(seller).approve(1);
      await amount.wait()
      amount=await escrow.connect(lender).approve(1);
      await amount.wait()

      await lender.sendTransaction({to:escrow.target,value:tokens(5)})
      amount=await escrow.connect(seller).quicksale(1);
      await amount.wait()
     
    })

    it('Sale Status',async()=>{
      const owner=await realEstate.ownerOf(1);
      expect(owner).to.be.equal(buyer.address);
    })
    it('Paisaa kaha gaya',async()=>{
      const bal=await escrow.getBalance();
      expect(bal).to.be.equal(0);
    })
  })
  describe('Cancel Sale', () => {
    describe('If inspection is not approved', () => {
      beforeEach(async () => {
        // Buyer deposits earnest
        let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
        await transaction.wait();
  
        // Inspector fails the inspection
        transaction = await escrow.connect(inspector).inspection(1, false);
        await transaction.wait();
  
        // Cancel the sale
        transaction = await escrow.connect(seller).cancelSale(1);
        await transaction.wait();
      });
  
      it('Refunds buyer', async () => {
        const balance = await ethers.provider.getBalance(buyer.address);
        expect(balance).to.be.above(tokens(10));
      });
  
      it('Updates ownership', async () => {
        const owner = await realEstate.ownerOf(1);
        expect(owner).to.equal(escrow.target);
      });
    });
  
    describe('If inspection is approved', () => {
      beforeEach(async () => {
        // Buyer deposits earnest
        let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
        await transaction.wait();
  
        // Inspector approves the inspection
        transaction = await escrow.connect(inspector).inspection(1, true);
        await transaction.wait();
  
        // Cancel the sale
        transaction = await escrow.connect(seller).cancelSale(1);
        await transaction.wait();
      });
  
      it('Pays seller', async () => {
        const balance = await ethers.provider.getBalance(seller.address);
        expect(balance).to.be.above(tokens(10));
      });
  
      it('Updates ownership', async () => {
        const owner = await realEstate.ownerOf(1);
        expect(owner).to.equal(escrow.target);
      });
    });
  });
  
})
