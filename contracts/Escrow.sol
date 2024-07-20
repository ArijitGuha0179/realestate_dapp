// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow{
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftaddress;

    mapping(uint256=>bool) public isListed;
    mapping(uint256=>uint256)public purchasePrice;
    mapping(uint256=>uint256) public escrowAmount;
    mapping(uint256=>address) public buyer;
    mapping(uint256=>bool) public inspect;
    mapping(uint256=>mapping(address=>bool))public approval;

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    constructor(address _nftaddress,address payable _seller,address _inspector,address _lender) {
        nftaddress=_nftaddress;
        seller=_seller;
        inspector=_inspector;
        lender = _lender;
    }
    //listing properties-nft from users wallet to escrow
    
    
    function list(uint256 _nftID,address _buyer,uint256 _purchasePrice,uint256 _escrowAmount)public payable onlySeller{
        //transfer
        IERC721(nftaddress).transferFrom(msg.sender,address(this) , _nftID);

        isListed[_nftID]=true;
        purchasePrice[_nftID]=_purchasePrice;
        escrowAmount[_nftID]=_escrowAmount;
        buyer[_nftID]=_buyer;

    }
    
    //Put property under contract by depositing earnest
    function depositEarnest(uint256 _nftID)public payable onlyBuyer(_nftID){
        require(msg.value>=escrowAmount[_nftID]);

    }
    //inspection-inspector deems the nft to be true or false
    function inspection(uint256 _nftID,bool _inspection)public onlyInspector{
        inspect[_nftID]=_inspection;
    }
    //approval - msg.sender approves his intenetion to sell
    function approve(uint256 _nftID)public {
        approval[_nftID][msg.sender]=true;
    }
    //Sale
    //->Inspection passed
    //->Authorized Sale
    //->Funds must be correct amount
    //->transfer NFT to buyer 
    //Transfer Funds to seller
    
    function quicksale(uint256 _nftID)public{
        require(inspect[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance>=purchasePrice[_nftID]);
        isListed[_nftID]=false;
        (bool success, )= payable(seller).call{value:address(this).balance}("");
        require(success);
        IERC721(nftaddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }
    //cancelling sale
    //if inspection not approved then refund to buyer else send to seller
    function cancelSale(uint256 _nftID)public{
       if(inspect[_nftID]==false){
        payable(buyer[_nftID]).transfer(address(this).balance);
       }else{
        payable(seller).transfer(address(this).balance);
       }
    }
    
    receive()external payable{}
    
    function getBalance()public view returns(uint256){
        return address(this).balance;
    }
    
}

