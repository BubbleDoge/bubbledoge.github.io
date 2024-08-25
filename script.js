// ABI y dirección del contrato
const contractABI = [
	{
		"inputs": [],
		"name": "openBox",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	}, ];
const contractAddress = '0x2f7C60D396655409142225E2EEe64dE4D3B543e1';

let web3;
let contract;
let userAccount;

// Conexión a MetaMask
window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            document.getElementById('walletAddress').innerText = `Connected: ${userAccount}`;

            // Inicializar el contrato
            contract = new web3.eth.Contract(contractABI, contractAddress);
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        alert("MetaMask not detected! Please install MetaMask.");
    }
});

// Función para ver el balance de un usuario
document.getElementById('checkBalanceButton').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value;
    if (contract && address) {
        try {
            const balance = await contract.methods.balanceOf(address).call();
            document.getElementById('balanceOutput').innerText = `Balance: ${balance}`;
        } catch (error) {
            console.error(error);
            document.getElementById('balanceOutput').innerText = "Error fetching balance.";
        }
    } else {
        alert("Please provide a valid address.");
    }
});

// Función para abrir la caja (openBox)
document.getElementById('openBoxButton').addEventListener('click', async () => {
    if (contract && userAccount) {
        try {
            await contract.methods.openBox().send({ from: userAccount, value: web3.utils.toWei('0.05', 'ether'), gas: 283514949 });
            alert("Box opened successfully!");
        } catch (error) {
            console.error(error);
            alert("Error opening box.");
        }
    } else {
        alert("Contract not initialized or user not connected.");
    }
});
