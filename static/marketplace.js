/*
    NFT MarketPlace's Listings

    This just fetches the listings from the Marketplace's contract and displays them as <NFTDisplay />

    PARAMS

    - deepness: Specifies how much listings to fetch.

*/

function MarketListings({ deepness=5 }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchListings = async () => {
        if(!await checkNetwork()) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(marketplaceAddress, marketplaceAbi, provider);
            
            const listingIdCounter = await contract.listingIdCounter()-1;
            const latestListings = [];
            
            for (let i = listingIdCounter; i > listingIdCounter - deepness && i >= 0; i--) {
                console.log("Deepness:", deepness);
                console.log("fetching Listing:", i);
                const listing = await contract.listings(i);
                console.log(listing);
                if(listing.tokenType != 0){ // Check that it exists
                    latestListings.push({
                        id: i,
                        seller: listing.seller,
                        tokenContract: listing.tokenContract,
                        tokenId: listing.tokenId.toString(),
                        amount: listing.amount.toString(),
                        price: ethers.utils.formatEther(listing.price),
                        tokenType: listing.tokenType
                    });
                }
            }
            
            setListings(latestListings);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchListings();
    }, [deepness]);
    
    return (
        <div>
            {loading ? (
                <p className="d-flex justify-content-center">Loading...</p>
            ) : (
                listings.map(listing => (
                    <NFTDisplay
                    key={listing.id}
                    keyProp={listing.id}
                    contractAddressProp={listing.tokenContract}
                    tokenIdProp={listing.tokenId}
                    priceProp={listing.price}
                    seller={listing.seller}
                    config="false"
                    />
                ))
            )}
        </div>
    );
    };