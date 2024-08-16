/*
    NFT Display Card

    This contains all the functions to interact with the NFTs, highly reusable in purpose

    PARAMS

    - keyProp: In case NFT is listed on the marketplace, specify listingId here (ONLY ADD IF LISTED)
    - contractAddressProp: Specify NFT's contract address here
    - tokenIdProp: Specify NFT's id here
    - priceProp: Thec NFT's cost here
    - seller: The one selling the NFT (ONLY ADD IF LISTED)
    - config: Wether the value's can be modificable or not

*/

function NFTDisplay({ keyProp='', contractAddressProp='', tokenIdProp='', priceProp='', seller='', config="true"}) {
    const [contractAddress, setContractAddress] = useState(contractAddressProp);
    const [tokenId, setTokenId] = useState(tokenIdProp);
    const [nft, setNft] = useState(null);
    const [price, setPrice] = useState(priceProp);
    const [isOwner, setIsOwner] = useState(false);


    // Reads data about the NFT from the blockchain
    // Checks if user owns the NFT
    // Updates data and display accordingly
    const fetchNFT = async () => {
        if (!contractAddress || !tokenId) return;
        //if (!await checkNetwork()) return;
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const contract = new ethers.Contract(contractAddress, [
            'function tokenURI(uint256 tokenId) external view returns (string memory)',
            'function ownerOf(uint256 tokenId) external view returns (address)'
        ], provider);
        
        try {
            const tokenUri = await contract.tokenURI(tokenId);
            const ownerAddress = await contract.ownerOf(tokenId);
            const cacheBuster = new Date().getTime(); // Only during debug
            const meta = await fetch(`${tokenUri}?cb=${cacheBuster}`).then(res => res.json());

            console.log(tokenUri, meta);

            setNft({
                tokenId: tokenId,
                name: meta.name,
                description: meta.description,
                image: meta.image,
                audio: meta.audio,
                artist: meta.artist,
                attributes: meta.attributes,
                owner: ownerAddress
            });

            setIsOwner(await isLoggedAs(ownerAddress) || await isLoggedAs(seller));
        } catch (error) {
        }
    };

    // When first loaded, auto fetch NFT if data specified
    useEffect( async () => {
        fetchNFT();
    }, [contractAddress, tokenId]);
    

    // Adds the token to the marketplace
    // Checks user is the owner to not lose gas doing a transaction that will revert
    // First, approves market to move the user's NFTs at NFT's address
    // Then, places a listing in Market's contract
    const addToMarketplace = async () => {
        if (!await checkNetwork()) return;
        if (!price) {
            alert("Please enter a price for the NFT.");
            return;
        }
            
    
        try {
            // Connect to the Ethereum network
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            // Check they're the owner
            const ownerAddress = nft.owner;
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await provider.listAccounts();
            if(!accounts.includes(ownerAddress)){ // They don't own the NFT!
                alert("You don't own this NFT!");
                return
            }

            const signer = provider.getSigner(); // Get the signer to sign transactions
            const userAddress = ownerAddress;
        
            const NFTContract = new ethers.Contract(contractAddress, NFTAbi, signer);

            // Check if Token's approved, if it's not, get approval
            const isApproved = await NFTContract.isApprovedForAll(userAddress, marketplaceAddress);

            if(!isApproved) {
                const transaction = await NFTContract.setApprovalForAll(marketplaceAddress, true);
                alert("Waiting for approval to be mined, we'll prompt for listing soon.");
                // Wait for the transaction to be mined
                await transaction.wait();
            }

            // Create a contract instance of the marketplace
            const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
            console.log(marketplaceContract);

            const priceInWei = ethers.utils.parseEther(price);
            const transaction = await marketplaceContract["listToken(address,uint256,uint256)"](contractAddress, tokenId, priceInWei);
            // Wait for the transaction to be mined
            await transaction.wait();
        
            alert("NFT added to the marketplace successfully!");
            console.log("listingId:", await marketplaceContract.listingIdCounter()-1);
        } catch (error) {
            console.error("Failed to add NFT to the marketplace:", error);
            alert("Failed to add NFT to the marketplace. See console for details.");
        }
    };
    
    // Buys an NFT from the marketplace
    // TODO: Check displayed NFT is the listed one!
    const buyNFT = async () => {
        if (!await checkNetwork()) return;
        //if (!keyProp) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Request access to wallet
            const signer = provider.getSigner(); // Get the signer to sign transactions
            
            const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
            
            // Convert the price to Wei (assuming the price is in Ether)
            const priceInWei = ethers.utils.parseEther(price);
            
            // Call the function to buy the NFT
            const transaction = await marketplaceContract.buyToken(keyProp, {
            value: priceInWei
            });
            
            // Wait for the transaction to be mined
            await transaction.wait();
            
            alert("NFT purchased successfully!");
        } catch (error) {
            console.error("Failed to buy NFT:", error);
            alert("Failed to buy NFT. See console for details.");
        }
    };

    // Cancels a listing
    // TODO: check user is the seller!
    const cancelListing = async () => {
        if (!await checkNetwork()) return;
        //if (!keyProp) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Request access to wallet
            const signer = provider.getSigner(); // Get the signer to sign transactions
            
            const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
            
            // Call the function to buy the NFT
            const transaction = await marketplaceContract.cancelListing(keyProp);
            
            // Wait for the transaction to be mined
            await transaction.wait();
            
            alert("NFT unlisted successfully!");
        } catch (error) {
            console.error("Failed to cancel listing:", error);
            alert("Failed to cancel listing. See console for details.");
        }
    };

    return (
        <div>
        { config == "true" && (
            <div className="card row p-5 m-3">
                <input
                type="text"
                className="form-control col"
                placeholder="Contract Address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                />
                <input
                type="text"
                className="form-control col"
                placeholder="NFT Id"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                />
            </div>
        )}
        {nft ? (
            <div className="d-flex align-items-center p-3" style={{
                position: 'relative', borderRadius: '30px', color: '#fff',  overflow: 'hidden',
            }}>
                <img src={nft.image} alt={nft.name} style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(8px) brightness(0.4)',
                    zIndex: 0,
                }} />

                <div className="me-3" style={{ zIndex: 1 }}>
                    <img src={nft.image} alt={nft.name} style={{ width: '200px', height: '200px', borderRadius: '8%' }} />
                </div>
                <div className="flex-grow-1 me-3" style={{ zIndex: 1 }}>
                    <div className="row">
                        {/* Title and desc, aligned to the left */}
                        <div className="col-md-8">
                            <h5>{nft.name}</h5>
                            <p className="mb-1">{nft.description}</p>
                        </div>
                        {/* Timestamp and Genre, aligned to the right */}
                        <div className="col-md-4 text-end">
                            {nft.attributes.map((attr, index) => {
                                return <p key={index} className="mb-0"><strong>{attr.trait_type}:</strong> {attr.value}</p>;
                            })}
                        </div>
                    </div>
                    {/* <audio controls className="w-100 mt-2">
                        <source src={nft.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio> */}
                    <Waveform audioUrl={nft.audio} />

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        {nft.owner != marketplaceAddress ? (
                            <div>
                                <strong>Owner:</strong>{shortenAddress(nft.owner)}
                            </div>
                        ) : (
                            <div>
                                <p className="mb-0"><strong>Price:</strong> {price} ETH</p>
                                <p className="mb-0"><strong>Seller:</strong> {shortenAddress(seller)}</p>
                            </div>
                        )}

                        <div className="d-flex">
                            {isOwner && config == "true" && (
                                <div className="row">
                                    <input
                                    type="text"
                                    className="form-control col"
                                    placeholder="Price in ETH"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    />
                                    <button className="btn btn-primary col" onClick={addToMarketplace}>Add to Marketplace</button>
                                </div>
                            )}
                            {seller != '' && (
                                <button className="btn btn-success me-2" onClick={buyNFT}>Buy</button>
                            )}
                            {isOwner && seller != '' && (
                                <button className="btn btn-danger" onClick={cancelListing}>Cancel Listing</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <p>LOADING NFT...</p>
        )}
        </div>
    );
}

// Uses waveform.js to generate a playable waveform from the {audioUrl}
function Waveform({ audioUrl }) {
    const waveformRef = useRef(null);
    const [wavesurfer, setWaveSurfer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    useEffect(() => {
        if (audioUrl) {
            const ws = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: "#bbbbbbbb",
                progressColor: "#ae74cddd",
                url: audioUrl,

                barWidth: 3,
                barGap: 0.5,
                barRadius: 0,
            });
        
            ws.on('interaction', () => {
                ws.play();
                setIsPlaying(true);
            });
            
            setWaveSurfer(ws);
            return () => ws.destroy();
        }
    }, [audioUrl]);

    const toggle = async () => {
        if (!wavesurfer) return;

        if (wavesurfer.isPlaying()) {
            wavesurfer.pause();
            setIsPlaying(false);
        } else {
            wavesurfer.play();
            setIsPlaying(true);
        }
    }
    
    return <div id="waveform" ref={waveformRef} className="mt-2" style={{ position: 'relative' }}>
        <button onClick={toggle} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 10 // Ensure the button stays on top
        }}>
            {isPlaying ? 'Pause' : 'Play'}
        </button>
    </div>;
};