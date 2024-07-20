// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    uint256 private _TokenIds;

    constructor()ERC721("Estate","REAL"){
        _TokenIds=0;
    }

    function safeMint(string memory tokenURI) public returns(uint256){
        _TokenIds++;
       uint256 newItemId=_TokenIds;
       _mint(msg.sender, newItemId);
       _setTokenURI(newItemId, tokenURI);
       return newItemId;
    }

    function totalsupply()public view returns(uint256){
        return _TokenIds;
    }
}