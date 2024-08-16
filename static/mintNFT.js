/*

    NFT MINTING MENU

    This menu allows user to mint their NFTs in {contracts/NFT.sol}.
    Check {static/NFTAbi.js} to see the contract's address.

*/

function MintNFT() {
    const [formInput, setFormInput] = useState({ name: '', description: '', audio: '', image: '', artist: '', genre: '', releaseDate: '' });

    const handleInputChange = (e) => {
        setFormInput({ ...formInput, [e.target.name]: e.target.value });
    }

    const mintNFT = async () => {
        const { name, description, audio, image, artist, genre, releaseDate } = formInput;
        if (!name || !audio || !artist) return;
        if (!await checkNetwork()) return;

        // This is the metadata we need to save to NFT's URI
        // Following the standard format supported by OpenSea or Rarible
        const metadata = {
            name: name,
            description: description,
            image: image,
            audio: audio,
            attributes: [
                {
                    trait_type: "Genre",
                    value: genre
                },
                {
                    trait_type: "Artist",
                    value: artist
                },
                {
                    trait_type: "Release Date",
                    value: releaseDate
                }
            ]
        };
        
        // Uploading metadata to local server
        // TODO: Upload to IPFS instead
        const response = await fetch('http://localhost:5000/upload-metadata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        console.log(response);
        
        const result = await response.json();
        if (response.status !== 200) {
            alert(`Error: ${result.error}`);
            return;
        }
        
        const metadataUrl = result.url;
        console.log(metadataUrl);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' }); // So we can access the signer
        const signer = provider.getSigner();
        const contract = new ethers.Contract(NFTAddress, NFTAbi, signer);
        
        // We call the minting function in the NFT's contract
        const transaction = await contract.mint(metadataUrl);
        await transaction.wait();
        
        alert('NFT minted successfully!');
    };
    
    return (
    <div>
        <h1>Mint a New NFT</h1>

        <div className="row g-3">
            <div className="col-md-6">
                <input type="text" className="form-control" name="name" placeholder="Song Title" onChange={handleInputChange} />
            </div>
            <div className="col-md-6">
                <input type="text" className="form-control" name="artist" placeholder="Artist" onChange={handleInputChange} />
            </div>
            
            <div className="col-md-12">
                <input type="text" className="form-control" name="description" placeholder="Description" onChange={handleInputChange} />
            </div>
            <div className="col-md-6">
                <input type="text" className="form-control" name="audio" placeholder="Audio URL" onChange={handleInputChange} />
            </div>
            <div className="col-md-6">
                <input type="text" className="form-control" name="image" placeholder="Image URL" onChange={handleInputChange} />
            </div>
            <div className="col-md-6">
                <input type="text" className="form-control" name="genre" placeholder="Genre" onChange={handleInputChange} />
            </div>
            <div className="col-md-6">
                <input type="date" className="form-control" name="releaseDate" placeholder="Release Date" onChange={handleInputChange} />
            </div> 

            <button className="btn btn-primary" onClick={mintNFT}>Mint NFT</button>
        </div>
    </div>
    );
}