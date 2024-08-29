const contractAddress = "0xC57D4C64EF90ae9cC03AAbd069FdcD39367a8316";
const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "de",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "para",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "mensaje",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "valor",
				"type": "uint256"
			}
		],
		"name": "MensajeEnviado",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_direccion",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_nombre",
				"type": "string"
			}
		],
		"name": "agregarContacto",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_para",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_mensaje",
				"type": "string"
			}
		],
		"name": "enviarMensaje",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_de",
				"type": "address"
			}
		],
		"name": "marcarLeido",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_otroUsuario",
				"type": "address"
			}
		],
		"name": "obtenerConversacion",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "de",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "para",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "mensaje",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "valor",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "leido",
						"type": "bool"
					}
				],
				"internalType": "struct MensajeriaBlockchainWhatsApp.Mensaje[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "obtenerMisContactos",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "nombre",
						"type": "string"
					},
					{
						"internalType": "address",
						"name": "direccion",
						"type": "address"
					}
				],
				"internalType": "struct MensajeriaBlockchainWhatsApp.Contacto[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let web3;
let contract;
let userAccount;
let currentContact = "";
let newMessages = {};

// Inicialización de Web3 y conexión con MetaMask
document.getElementById('connectBtn').addEventListener('click', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainPage').style.display = 'flex';
            contract = new web3.eth.Contract(contractABI, contractAddress);
            loadContactList();
        } catch (error) {
            console.error("Error al conectar con MetaMask", error);
        }
    } else {
        alert("Por favor, instala MetaMask para usar esta aplicación.");
    }
});


// Mostrar el formulario de contacto
document.getElementById('addContactBtn').addEventListener('click', () => {
    document.getElementById('contactForm').style.display = 'block';
    document.getElementById('contactList').style.display = 'none';
});

// Ocultar el formulario de contacto
document.getElementById('cancelContactBtn').addEventListener('click', () => {
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('contactList').style.display = 'block';
});

// Agregar un nuevo contacto
document.getElementById('submitContactBtn').addEventListener('click', async () => {
    const contactName = document.getElementById('contactName').value;
    const contactAddress = document.getElementById('contactAddress').value;

    if (contactName && contactAddress) {
        if (!contract) {
            alert("El contrato no está inicializado correctamente.");
            return;
        }

        try {
            document.getElementById('loading').style.display = 'flex';
            await contract.methods.agregarContacto(contactAddress, contactName).send({ from: userAccount });
            document.getElementById('loading').style.display = 'none';
            document.getElementById('contactForm').style.display = 'none';
            document.getElementById('contactList').style.display = 'block';
            loadContactList();
        } catch (error) {
            console.error("Error al agregar el contacto", error);
            document.getElementById('loading').style.display = 'none';
        }
    } else {
        alert("Por favor, completa ambos campos.");
    }
});

// Cargar la lista de contactos
async function loadContactList() {
    if (!contract) {
        console.error("El contrato no está inicializado.");
        return;
    }

    try {
        const contactListDiv = document.getElementById('contactList');
        contactListDiv.innerHTML = '';

        const contacts = await contract.methods.obtenerMisContactos().call({ from: userAccount });

        contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'contact';
            contactElement.innerText = contact.nombre;
            contactElement.addEventListener('click', () => {
                currentContact = contact.direccion;
                showChatPage(contact.nombre, contact.direccion);
                loadMessages();
            });
            contactListDiv.appendChild(contactElement);
        });
    } catch (error) {
        console.error("Error al cargar la lista de contactos", error);
    }
}

// Mostrar la página de chat y actualizar el encabezado
function showChatPage(name, address) {
    const contactListElement = document.querySelector('.contact-list');
    const chatPageElement = document.querySelector('.chat-page');

    // Comprobar si los elementos existen antes de intentar acceder a ellos
    if (contactListElement && chatPageElement) {
        contactListElement.style.display = 'none';
        chatPageElement.style.display = 'flex';

        // Actualizar el encabezado del chat
        document.getElementById('contactNameHeader').innerText = name;
        document.getElementById('contactAddressHeader').innerText = address;
    } else {
        console.error("Elementos no encontrados en el DOM.");
    }
}


// Volver a la lista de contactos
document.getElementById('backBtn').addEventListener('click', () => {
    document.querySelector('.chat-page').style.display = 'none';
    document.querySelector('.contact-list').style.display = 'block';
});

// Cargar mensajes en la conversación actual
async function loadMessages() {
    if (userAccount && currentContact) {
        try {
            const messages = await contract.methods.obtenerConversacion(currentContact).call({ from: userAccount });
            const chatMessagesDiv = document.getElementById('chatMessages');
            chatMessagesDiv.innerHTML = '';

            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';

                if (msg.de.toLowerCase() === userAccount.toLowerCase()) {
                    messageElement.classList.add('enviado');
                } else {
                    messageElement.classList.add('recibido');
                }

                messageElement.innerHTML = `${msg.mensaje}<div class="timestamp">${new Date(msg.timestamp * 1000).toLocaleString()}</div>`;
                chatMessagesDiv.appendChild(messageElement);
            });

            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll al último mensaje
        } catch (error) {
            console.error("Error al cargar los mensajes", error);
        }
    }
}

// Enviar un mensaje
document.getElementById('sendMessageBtn').addEventListener('click', async () => {
    const messageContent = document.getElementById('message').value;

    if (messageContent) {
        try {
            document.getElementById('loading').style.display = 'flex'; // Mostrar loading
            await contract.methods.enviarMensaje(currentContact, messageContent).send({ from: userAccount, value: web3.utils.toWei('0.005', 'ether') });
            document.getElementById('loading').style.display = 'none'; // Ocultar loading
            document.getElementById('message').value = ''; // Limpiar el campo de entrada
            loadMessages(); // Recargar los mensajes
        } catch (error) {
            console.error("Error al enviar el mensaje", error);
            document.getElementById('loading').style.display = 'none'; // Ocultar loading
        }
    } else {
        alert("Por favor, escribe un mensaje.");
    }
});

// Mostrar la página de chat (corregida para evitar duplicación)
function showChatPage(name, address) {
    document.querySelector('.contact-list').style.display = 'none';
    document.querySelector('.chat-page').style.display = 'flex';

    // Actualizar el encabezado del chat
    document.getElementById('contactNameHeader').innerText = name;
    document.getElementById('contactAddressHeader').innerText = address;
}

// Volver a la lista de contactos
document.getElementById('backBtn').addEventListener('click', () => {
    document.querySelector('.chat-page').style.display = 'none';
    document.querySelector('.contact-list').style.display = 'block';
});

// Cargar mensajes en la conversación actual
async function loadMessages() {
    if (userAccount && currentContact) {
        try {
            const messages = await contract.methods.obtenerConversacion(currentContact).call({ from: userAccount });
            const chatMessagesDiv = document.getElementById('chatMessages');
            chatMessagesDiv.innerHTML = '';

            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';

                if (msg.de.toLowerCase() === userAccount.toLowerCase()) {
                    messageElement.classList.add('enviado');
                } else {
                    messageElement.classList.add('recibido');
                }

                messageElement.innerHTML = `${msg.mensaje}<div class="timestamp">${new Date(msg.timestamp * 1000).toLocaleString()}</div>`;
                chatMessagesDiv.appendChild(messageElement);
            });

            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll al último mensaje
        } catch (error) {
            console.error("Error al cargar los mensajes", error);
        }
    }
}

// Mostrar una notificación de mensaje nuevo
function showNotification(name) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = `Nuevo mensaje de ${name}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000); // Remover notificación después de 3 segundos
}

// Actualizar la lista de contactos
async function loadContactList() {
    if (!contract) {
        console.error("El contrato no está inicializado.");
        return;
    }

    try {
        const contactListDiv = document.getElementById('contactList');
        contactListDiv.innerHTML = '';

        const contacts = await contract.methods.obtenerMisContactos().call({ from: userAccount });

        contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'contact';
            contactElement.innerHTML = `
                ${contact.nombre}
                <div class="message-count">${newMessages[contact.direccion] || 0}</div>
            `;
            contactElement.addEventListener('click', () => {
                currentContact = contact.direccion;
                showChatPage(contact.nombre, contact.direccion); // Pasar nombre y dirección
                loadMessages();
                newMessages[contact.direccion] = 0; // Resetear contador al abrir chat
                loadContactList(); // Actualizar lista para remover contador de mensajes
            });
            contactListDiv.appendChild(contactElement);
        });
    } catch (error) {
        console.error("Error al cargar la lista de contactos", error);
    }
}

// Escuchar eventos de nuevos mensajes
web3.eth.subscribe('logs', {
    address: contractAddress,
    topics: [web3.utils.sha3('MensajeEnviado(address,address,string,uint256,uint256)')]
}, (error, result) => {
    if (error) {
        console.error("Error al suscribirse a eventos", error);
        return;
    }
    
    const decoded = web3.eth.abi.decodeLog(
        [
            { type: 'address', name: 'de' },
            { type: 'address', name: 'para' },
            { type: 'string', name: 'mensaje' },
            { type: 'uint256', name: 'timestamp' },
            { type: 'uint256', name: 'valor' }
        ],
        result.data,
        result.topics.slice(1)
    );

    if (decoded.para.toLowerCase() === userAccount.toLowerCase()) {
        showNotification(decoded.de);
        newMessages[decoded.de] = (newMessages[decoded.de] || 0) + 1;
        loadContactList();
    }
});

// Enviar un mensaje
document.getElementById('sendMessageBtn').addEventListener('click', async () => {
    const messageContent = document.getElementById('message').value;

    if (messageContent) {
        try {
            document.getElementById('loading').style.display = 'flex'; // Mostrar loading
            await contract.methods.enviarMensaje(currentContact, messageContent).send({ from: userAccount, value: web3.utils.toWei('0.005', 'ether') });
            document.getElementById('loading').style.display = 'none'; // Ocultar loading
            document.getElementById('message').value = ''; // Limpiar el campo de entrada
            loadMessages(); // Recargar los mensajes
        } catch (error) {
            console.error("Error al enviar el mensaje", error);
            document.getElementById('loading').style.display = 'none'; // Ocultar loading
        }
    } else {
        alert("Por favor, escribe un mensaje.");
    }
});

