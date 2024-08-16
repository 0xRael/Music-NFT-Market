Basically, a platform where musicians can mint NFTs with their music, put them to sell, and users can easily buy these NFTs, with all the Market logic happening on-chain

## My Music NFT Marketplace

You need Metamask to use this.
Contracts were deployed to Sepolia testnet, but for now, due to data being stored locally, NFT's metadata can't be accessed by third-parties, I plan to upload the NFT's metadata to IPFS, but that would require an IPFS node, smthing I can't host with my actual resources.

### Front-End

Front-end uses ethers.js to access and interact with the contracts, using the Metamask's injected provider.
Also uses wavesurfer.js and bootstrap to generate the NFT's audio visualizer.

### Server
Server runs using Python's flask module. But it only serves pages and stores the metadata. All market and NFT logic happens on-chain.
