// Bootstrap alerts

const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
const appendAlert = (message, type) => {
  alertPlaceholder.innerHTML += `<div class="alert alert-${type} alert-dismissible" role="alert">
       <div>${message}</div>
       <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

// Block Explorer

let blocks = [];
let provider;
let signer;

function shortenAddress(address, chars = 4) {
    const start = address.slice(0, chars + 2); // Keep the '0x' prefix and the first few characters
    const end = address.slice(-chars); // Keep the last few characters
    return `${start}...${end}`;
}

function timeSince(timestamp) {
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp * 1000) / 1000;
    
    if (secondsPast < 60) { // Less than a minute
      return `${Math.round(secondsPast)} seconds ago`;
    }
    if (secondsPast < 3600) { // Less than an hour
      return `${Math.round(secondsPast / 60)} minutes ago`;
    }
    if (secondsPast <= 86400) { // Less than a day
      return `${Math.round(secondsPast / 3600)} hours ago`;
    }
    if (secondsPast > 86400) { // More than a day
      const day = timestamp.getDate();
      const month = timestamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
      const year = timestamp.getFullYear() == now.getFullYear() ? "" : ` ${timestamp.getFullYear()}`;
      return `${day} ${month}${year}`;
    }
  }

document.getElementById('connect-button').addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Create an ethers.js provider using MetaMask's provider
            provider = new ethers.providers.Web3Provider(window.ethereum);

            // Get the signer
            signer = provider.getSigner();
            console.log('Account:', signer);

            // Display block details
            await updateBlocks(5);

            // Hide the connect button after successful connection
            document.getElementById('connect-alert').style.display = 'none';

            appendAlert(`Succefully connected to Metamask!`, 'success');
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            appendAlert('An internal error ocurred...', 'danger');
        }
    } else {
        appendAlert('MetaMask is not installed. Please install it to use this app.', 'warning');
    }
});

document.getElementById('fetch-more').addEventListener('click', async () => {
    await updateBlocks(5, blocks.length, false);
});

// Shows latest blocks
async function updateBlocks(depth, startFrom=0, clear=true) {
    if(provider === null){
        return;
    }
    const latestBlockNumber = await provider.getBlockNumber();
    const blockDetailsDiv = document.getElementById('block-details');
    if(clear){
        blockDetailsDiv.innerHTML = '';
        blocks = [];
    }

    for(let i = startFrom; i < (depth + startFrom); i++){
        // Get block
        let block = await provider.getBlock(latestBlockNumber - i);
        let blockN = blocks.length;
        blocks.push(block.number);

        // Display block
        blockDetailsDiv.innerHTML += `
            <div class="block card shadow-lg p-3 mb-3 mt-3 rounded bg-secondary-subtle" id="block-${blockN}">
                <button class="card-header" id="block-${blockN}-title" onclick="showTransactions(${blockN})"><h5>Block ${block.number}</h5></button>
                <div class="card-body">
                    <p class="card-text"><strong>${block.transactions.length}</strong> txns. <strong>Hash:</strong> ${shortenAddress(block.hash)}.</p>
                    <p class="card-text"><strong>By:</strong> ${shortenAddress(block.miner)}. <strong>At </strong> ${timeSince(block.timestamp)}</li>
                </div>
            </div>
        `;
        
        document.getElementById(`block-${blockN}-title`).addEventListener('click', async () => {
            console.log(blockN);
            await showTransactions(blockN);
        });
    }
}

async function showTransactions(blockN) {
    let blockTxns = document.getElementById('txn-details');
    let blockId = blocks[blockN];
    let updBlock = await provider.getBlockWithTransactions(blockId);
    
    // Clear the transactions
    blockTxns.innerHTML = '';

    for(let i = 0; i < updBlock.transactions.length; i++) {
        let tx = updBlock.transactions[i];
        let content = '';
        
        if(tx.data === '0x' && tx.to !== null){
            content = `
            <p>${ethers.utils.formatEther(tx.value)} ETH.</p>
            <p><strong>From:</strong> ${shortenAddress(tx.from)}.
            <strong>To:</strong> ${shortenAddress(tx.to)}</p>
            `;
        } else {
            // If there's data or address is 0x0, it's a contract interaction/creation
            content = `
            <p>${ethers.utils.formatEther(tx.value)} ETH. <strong>Contract</strong>.</p>
            <p><strong>From:</strong> ${shortenAddress(tx.from)}.
            <strong>To:</strong> ${shortenAddress(tx.to)}</p>
            `;
        }

        blockTxns.innerHTML += `
            <div class="block card shadow-lg mb-2 mt-2 rounded bg-secondary-subtle">
                <div class="card-body">
                    ${content}
                </div>
            </div>
        `;
    }
}