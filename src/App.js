import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [escrow, setEscrow] = useState(null)

  const [account, setAccount] = useState(null)

  const [homes, setHomes] = useState([])
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    try {
      console.log('Loading blockchain data...')
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)
      console.log('Provider set:', provider)

      const network = await provider.getNetwork()
      console.log('Network:', network.chainId)

      const latestBlock = await provider.getBlockNumber()
      console.log('Latest block number:', latestBlock)

      console.log('Config:', config)
      console.log('RealEstate address:', config[network.chainId]?.realEstate?.address)

      if (!config[network.chainId] || !config[network.chainId].realEstate || !config[network.chainId].realEstate.address) {
        throw new Error(`Contract address not found for chain ID ${network.chainId}`)
      }

      const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, provider)
      console.log('RealEstate contract:', realEstate)

      try {
        console.log('Calling totalSupply...')
        const totalSupply = await realEstate.totalsupply()
        console.log('Total supply:', totalSupply.toString())

        const homes = []

        for (var i = 1; i <= totalSupply; i++) {
          console.log(`Fetching token ${i} URI...`)
          const uri = await realEstate.tokenURI(i)
          console.log(`Token ${i} URI:`, uri)
          
          try {
            const response = await fetch(uri)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const metadata = await response.json()
            console.log(`Token ${i} metadata:`, metadata)
            homes.push(metadata)
          } catch (error) {
            console.error(`Error fetching metadata for token ${i}:`, error)
          }
        }

        setHomes(homes)
        console.log('Homes set:', homes)

      } catch (error) {
        console.error('Error in contract interactions:', error)
      }

      const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider)
      setEscrow(escrow)
      console.log('Escrow contract set:', escrow)

      window.ethereum.on('accountsChanged', async () => {
        console.log('Account changed, updating...')
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = ethers.getAddress(accounts[0])
        setAccount(account);
        console.log('New account set:', account)
      })
    } catch (error) {
      console.error("Error in loadBlockchainData:", error)
    }
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>

        <h3>Homes For You</h3>

        <hr />

        <div className='cards'>
          {homes.map((home, index) => (
            <div className='card' key={index} onClick={() => togglePop(home)}>
              <div className='card__image'>
                <img src={home.image} alt="Home" />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}

    </div>
  );
}

export default App;