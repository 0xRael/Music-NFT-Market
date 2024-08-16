/*
    This File contains Functions widely used in the app, such as checking we're in
    the correct network, shorten addresses, or connecting to Metamask's wallet

*/

const useState = React.useState;
const useRef = React.useRef;
const useEffect = React.useEffect;

//
//  Utility Functions
//

// Check user has Metamask installed and is in the correct Network
// DEV: It auto shows alerts by itself, I suggest just using {if(!await checkNetwork()) return;}
async function checkNetwork(){
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111) { // Sepolia TestNet chain ID
            alert("Please connect to the Sepolia TestNet");
            return false;
        } else {
            return true;
        }
    } else {
        alert('MetaMask not detected');
        return false;
    }
}

// Shortens the address returning: 0x123456...123456
function shortenAddress(address, chars = 6) {
    const start = address.slice(0, chars + 2); // Keep the '0x' prefix and the first few characters
    const end = address.slice(-chars); // Keep the last few characters
    return `${start}...${end}`;
}

// Returns True if {address} is selected at user's wallet
async function isLoggedAs(address) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = await provider.listAccounts();
    
    return(address.toLowerCase() == accounts[0].toLowerCase());
}


//
//  Connect to Wallet button
//

// This is used as we need to call {eth_requestAccounts} in Metamask first before being able to access the signer
function ConnectWallet({ onConnect }) {
    const [account, setAccount] = useState(null);
    
    const connectWallet = async () => {
        if (!await checkNetwork()) return;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            onConnect(accounts[0]);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    };

    React.useEffect( async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
                onConnect(accounts[0]);
            } catch (error) {
                console.error('Error connecting to MetaMask:', error);
            }
        }
    });

    return (
        <div>
            {account ? (
                <p>Connected as {account}</p>
                ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
}