// Global variables
let provider;
let signer;
let contract;
let userAddress;
let contractAddress;
let isConnecting = false; // Flag to track connection state

// Contract ABI will be loaded from the artifacts
let contractABI;

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet');
const accountInfo = document.getElementById('account-info');
const accountAddress = document.getElementById('account-address');
const accountBalance = document.getElementById('account-balance');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const eventsList = document.getElementById('events-list');
const ticketsList = document.getElementById('tickets-list');
const organizerEvents = document.getElementById('organizer-events');
const createEventForm = document.getElementById('create-event-form');
const validateTicketBtn = document.getElementById('validate-ticket');
const ticketIdInput = document.getElementById('ticket-id');
const ticketOwnerInput = document.getElementById('ticket-owner');
const validationResult = document.getElementById('validation-result');
const startScanBtn = document.getElementById('start-scan');
const qrVideo = document.getElementById('qr-video');
const scanResult = document.getElementById('scan-result');
const eventModal = document.getElementById('event-modal');
const ticketModal = document.getElementById('ticket-modal');
const modalEventName = document.getElementById('modal-event-name');
const modalEventDescription = document.getElementById('modal-event-description');
const modalEventDate = document.getElementById('modal-event-date');
const modalEventPrice = document.getElementById('modal-event-price');
const modalEventAvailable = document.getElementById('modal-event-available');
const buyTicketBtn = document.getElementById('buy-ticket');
const purchaseStatus = document.getElementById('purchase-status');
const modalTicketEvent = document.getElementById('modal-ticket-event');
const modalTicketId = document.getElementById('modal-ticket-id');
const modalTicketStatus = document.getElementById('modal-ticket-status');
const ticketQR = document.getElementById('ticket-qr');
const closeButtons = document.querySelectorAll('.close');

// Initialize the application
async function init() {
    try {
        console.log('Initializing application...');

        // Load contract ABI from artifacts
        try {
            console.log('Fetching contract ABI...');
            const response = await fetch('./artifacts/contracts/EventTicket.sol/EventTicket.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch ABI: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            contractABI = data.abi;
            console.log('Contract ABI loaded successfully');
        } catch (abiError) {
            console.error('Error loading contract ABI:', abiError);
            document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; bottom: 0; left: 0; right: 0;">
                Error loading contract ABI: ${abiError.message}. Make sure the contract is compiled and deployed.
            </div>`;
        }

        // Check if ethers.js is loaded
        try {
            if (typeof ethers === 'undefined') {
                console.error('ethers.js is not loaded');
                document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; bottom: 0; left: 0; right: 0;">
                    ethers.js is not loaded. Check your internet connection or try refreshing the page.
                    <button onclick="location.reload()">Refresh Page</button>
                </div>`;

                // Try to load ethers.js dynamically as a fallback
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
                script.type = 'application/javascript';
                script.onload = function() {
                    console.log('ethers.js loaded dynamically');
                    document.body.innerHTML += `<div style="color: green; padding: 20px; background: #eeffee; position: fixed; bottom: 0; left: 0; right: 0;">
                        ethers.js loaded successfully. <button onclick="location.reload()">Refresh Page</button>
                    </div>`;
                };
                document.head.appendChild(script);
                return;
            } else {
                console.log('ethers.js loaded, version:', ethers.version);
            }
        } catch (e) {
            console.error('Error checking ethers.js:', e);
            // Try to load ethers.js dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
            script.type = 'application/javascript';
            document.head.appendChild(script);
            return;
        }

        // Check if MetaMask is installed
        if (window.ethereum) {
            console.log('MetaMask detected');
            try {
                // Create provider
                provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                console.log('Provider created');

                // Check if user is already connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                console.log('Accounts:', accounts);
                if (accounts.length > 0 && !isConnecting) {
                    // Set userAddress directly without going through the full connection process
                    userAddress = accounts[0];
                    console.log('Already connected to account:', userAddress);

                    // Update UI to show connected state
                    if (connectWalletBtn) {
                        connectWalletBtn.textContent = 'Connected';
                    }

                    if (accountAddress) {
                        accountAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
                    }

                    // Now connect properly but without triggering another eth_requestAccounts
                    setTimeout(() => {
                        connectWallet();
                    }, 1000); // Delay to ensure we don't have race conditions
                }
            } catch (providerError) {
                console.error('Error setting up provider:', providerError);
                document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; bottom: 0; left: 0; right: 0;">
                    Error setting up provider: ${providerError.message}
                </div>`;
            }
        } else {
            console.warn('MetaMask not detected');
            document.body.innerHTML += `<div style="color: orange; padding: 20px; background: #fffaee; position: fixed; bottom: 0; left: 0; right: 0;">
                MetaMask not detected. Please install MetaMask to use this DApp.
            </div>`;
        }

        // Set up event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; bottom: 0; left: 0; right: 0;">
            Initialization error: ${error.message}
        </div>`;
    }
}

// Connect wallet function
async function connectWallet() {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('Already connecting to wallet, please wait...');
        return;
    }

    // Disable the connect button to prevent multiple clicks
    if (connectWalletBtn) {
        connectWalletBtn.disabled = true;
        connectWalletBtn.textContent = 'Connecting...';
    }

    // Set connecting flag
    isConnecting = true;

    try {
        console.log('Connecting wallet...');

        // Request account access
        try {
            // Check if already connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                console.log('Already connected to account:', accounts[0]);
                // Continue with the connected account
            } else {
                // Request connection
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Account access granted');
            }
        } catch (requestError) {
            console.error('Error requesting accounts:', requestError);
            alert('Failed to connect wallet: ' + (requestError.message || 'User denied account access'));

            // Reset UI
            if (connectWalletBtn) {
                connectWalletBtn.disabled = false;
                connectWalletBtn.textContent = 'Connect Wallet';
            }

            // Reset connecting flag
            isConnecting = false;
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        console.log('Provider created');

        // Get the network
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'chainId:', network.chainId);

        signer = provider.getSigner();
        console.log('Signer created');

        try {
            userAddress = await signer.getAddress();
            console.log('Connected address:', userAddress);

            // Display account info
            accountAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;

            const balance = await provider.getBalance(userAddress);
            accountBalance.textContent = `${ethers.utils.formatEther(balance).substring(0, 6)} ETH`;
            console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');

            connectWalletBtn.classList.add('hidden');
            accountInfo.classList.remove('hidden');
        } catch (addressError) {
            console.error('Error getting address:', addressError);
            alert('Failed to get wallet address');
            return;
        }

        // Load contract
        try {
            contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'; // Replace with actual deployed address
            console.log('Loading contract at address:', contractAddress);

            if (!contractABI) {
                throw new Error('Contract ABI not loaded');
            }

            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log('Contract loaded successfully');
        } catch (contractError) {
            console.error('Error loading contract:', contractError);
            alert('Failed to load contract: ' + contractError.message);
            return;
        }

        // Load data
        console.log('Loading data...');
        try {
            await loadEvents();
            await loadTickets();
            await loadOrganizerEvents();
            console.log('Data loaded successfully');
        } catch (dataError) {
            console.error('Error loading data:', dataError);
        }

        // Listen for account changes
        console.log('Setting up event listeners for wallet changes');
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

        console.log('Wallet connected successfully');

        // Reset UI
        if (connectWalletBtn) {
            connectWalletBtn.textContent = 'Connected';
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet: ' + error.message);

        // Reset UI
        if (connectWalletBtn) {
            connectWalletBtn.disabled = false;
            connectWalletBtn.textContent = 'Connect Wallet';
        }
    } finally {
        // Always reset the connecting flag
        isConnecting = false;
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        resetConnection();
    } else {
        // Account changed, reload the page
        window.location.reload();
    }
}

// Reset connection
function resetConnection() {
    userAddress = null;
    contract = null;
    signer = null;

    connectWalletBtn.classList.remove('hidden');
    accountInfo.classList.add('hidden');

    // Reset UI
    eventsList.innerHTML = '<div class="loading">Connect your wallet to view events</div>';
    ticketsList.innerHTML = '<div class="loading">Connect your wallet to view tickets</div>';
    organizerEvents.innerHTML = '<div class="loading">Connect your wallet to view your events</div>';
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');

    try {
        // Connect wallet button
        if (connectWalletBtn) {
            console.log('Setting up connect wallet button');
            connectWalletBtn.addEventListener('click', connectWallet);
        } else {
            console.error('Connect wallet button not found');
        }

        // Tab navigation
        if (tabButtons.length > 0) {
            console.log('Setting up tab buttons');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabId = button.getAttribute('data-tab');
                    console.log('Tab clicked:', tabId);

                    // Update active tab button
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Show selected tab content
                    tabContents.forEach(content => content.classList.remove('active'));
                    const tabContent = document.getElementById(tabId);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    } else {
                        console.error('Tab content not found:', tabId);
                    }
                });
            });
        } else {
            console.error('No tab buttons found');
        }

        // Create event form
        if (createEventForm) {
            console.log('Setting up create event form');
            createEventForm.addEventListener('submit', createEvent);
        } else {
            console.error('Create event form not found');
        }

        // Validate ticket button
        if (validateTicketBtn) {
            console.log('Setting up validate ticket button');
            validateTicketBtn.addEventListener('click', validateTicket);
        } else {
            console.error('Validate ticket button not found');
        }

        // Start QR scanner button
        if (startScanBtn) {
            console.log('Setting up QR scanner button');
            startScanBtn.addEventListener('click', startQRScanner);
        } else {
            console.error('Start QR scanner button not found');
        }

        // Buy ticket button
        if (buyTicketBtn) {
            console.log('Setting up buy ticket button');
            buyTicketBtn.addEventListener('click', buyTicket);
        } else {
            console.error('Buy ticket button not found');
        }

        // Close modal buttons
        if (closeButtons.length > 0) {
            console.log('Setting up close modal buttons');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    closeModal(eventModal);
                    closeModal(ticketModal);
                });
            });
        } else {
            console.error('No close buttons found');
        }

        // Close modal when clicking outside
        console.log('Setting up modal outside click handler');
        window.addEventListener('click', event => {
            if (event.target === eventModal) {
                closeModal(eventModal);
            }
            if (event.target === ticketModal) {
                closeModal(ticketModal);
            }
        });

        // Function to open modal with animation
        function openModal(modal) {
            modal.style.display = 'block';
            // Trigger reflow to ensure transition works
            modal.offsetHeight;
            modal.classList.add('show');
        }

        // Function to close modal with animation
        function closeModal(modal) {
            modal.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (!modal.classList.contains('show')) {
                    modal.style.display = 'none';
                }
            }, 300); // Match transition duration
        }

        console.log('All event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Load events
async function loadEvents() {
    if (!contract) return;

    try {
        eventsList.innerHTML = '<div class="loading">Loading events...</div>';

        // Get the number of events
        const eventCount = await contract.eventIdCounter();

        if (eventCount == 0) {
            eventsList.innerHTML = '<div class="card">No events available</div>';
            return;
        }

        let eventsHTML = '';

        // Loop through events
        for (let i = 0; i < eventCount; i++) {
            const event = await contract.events(i);

            // Skip inactive events or past events
            if (!event.isActive || event.date * 1000 < Date.now()) continue;

            const availableTickets = event.maxTickets - event.ticketsSold;
            const eventDate = new Date(event.date * 1000).toLocaleString();

            eventsHTML += `
                <div class="card event-card" data-event-id="${i}">
                    <h3>${event.name}</h3>
                    <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                    <p class="event-date">${eventDate}</p>
                    <p class="event-price">${ethers.utils.formatEther(event.price)} ETH</p>
                    <p>Available: ${availableTickets} / ${event.maxTickets}</p>
                </div>
            `;
        }

        if (eventsHTML === '') {
            eventsList.innerHTML = '<div class="card">No active events available</div>';
        } else {
            eventsList.innerHTML = eventsHTML;

            // Add event listeners to event cards
            document.querySelectorAll('.event-card').forEach(card => {
                card.addEventListener('click', () => showEventDetails(card.getAttribute('data-event-id')));
            });
        }
    } catch (error) {
        console.error('Error loading events:', error);
        eventsList.innerHTML = '<div class="card">Error loading events</div>';
    }
}

// Load user's tickets
async function loadTickets() {
    if (!contract || !userAddress) return;

    try {
        ticketsList.innerHTML = '<div class="loading">Loading tickets...</div>';

        // Get the number of tickets owned by the user
        const balance = await contract.balanceOf(userAddress);

        if (balance == 0) {
            ticketsList.innerHTML = '<div class="card">You don\'t have any tickets</div>';
            return;
        }

        let ticketsHTML = '';

        // Loop through tickets
        for (let i = 0; i < balance; i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
            const ticket = await contract.tickets(tokenId);
            const event = await contract.events(ticket.eventId);

            const eventDate = new Date(event.date * 1000).toLocaleString();
            let status = 'Valid';
            let statusClass = 'status-valid';

            if (ticket.used) {
                status = 'Used';
                statusClass = 'status-used';
            } else if (event.date * 1000 < Date.now()) {
                status = 'Expired';
                statusClass = 'status-expired';
            }

            ticketsHTML += `
                <div class="card ticket-card" data-ticket-id="${tokenId}">
                    <span class="ticket-status ${statusClass}">${status}</span>
                    <h3>${event.name}</h3>
                    <p class="event-date">${eventDate}</p>
                    <p>Ticket ID: ${tokenId}</p>
                    <button class="view-ticket-btn">View Ticket</button>
                </div>
            `;
        }

        ticketsList.innerHTML = ticketsHTML;

        // Add event listeners to view ticket buttons
        document.querySelectorAll('.view-ticket-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticketId = button.parentElement.getAttribute('data-ticket-id');
                showTicketDetails(ticketId);
            });
        });
    } catch (error) {
        console.error('Error loading tickets:', error);
        ticketsList.innerHTML = '<div class="card">Error loading tickets</div>';
    }
}

// Load organizer's events
async function loadOrganizerEvents() {
    if (!contract || !userAddress) return;

    try {
        organizerEvents.innerHTML = '<div class="loading">Loading your events...</div>';

        // Get the number of events
        const eventCount = await contract.eventIdCounter();

        if (eventCount == 0) {
            organizerEvents.innerHTML = '<div class="card">You haven\'t created any events</div>';
            return;
        }

        let eventsHTML = '';
        let hasEvents = false;

        // Loop through events
        for (let i = 0; i < eventCount; i++) {
            const event = await contract.events(i);

            // Only show events created by the user
            if (event.organizer.toLowerCase() !== userAddress.toLowerCase()) continue;

            hasEvents = true;
            const eventDate = new Date(event.date * 1000).toLocaleString();
            const isPast = event.date * 1000 < Date.now();

            eventsHTML += `
                <div class="card">
                    <h3>${event.name}</h3>
                    <p class="event-date">${eventDate}</p>
                    <p>Tickets Sold: ${event.ticketsSold} / ${event.maxTickets}</p>
                    <p>Status: ${event.isActive ? 'Active' : 'Inactive'} ${isPast ? '(Past)' : ''}</p>
                    <p>Transfer Lock: ${event.transferLocked ? 'Enabled' : 'Disabled'}</p>
                    <button class="toggle-lock-btn" data-event-id="${i}" ${isPast ? 'disabled' : ''}>
                        ${event.transferLocked ? 'Disable' : 'Enable'} Transfer Lock
                    </button>
                </div>
            `;
        }

        if (!hasEvents) {
            organizerEvents.innerHTML = '<div class="card">You haven\'t created any events</div>';
        } else {
            organizerEvents.innerHTML = eventsHTML;

            // Add event listeners to toggle lock buttons
            document.querySelectorAll('.toggle-lock-btn').forEach(button => {
                button.addEventListener('click', () => toggleTransferLock(button.getAttribute('data-event-id')));
            });
        }
    } catch (error) {
        console.error('Error loading organizer events:', error);
        organizerEvents.innerHTML = '<div class="card">Error loading your events</div>';
    }
}

// Create a new event
async function createEvent(e) {
    e.preventDefault();

    if (!contract) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        const name = document.getElementById('event-name').value;
        const description = document.getElementById('event-description').value;
        const dateInput = document.getElementById('event-date').value;
        const price = ethers.utils.parseEther(document.getElementById('event-price').value);
        const maxTickets = document.getElementById('max-tickets').value;
        const maxResellPrice = ethers.utils.parseEther(document.getElementById('max-resell-price').value);
        const transferLocked = document.getElementById('transfer-locked').checked;

        // Convert date to Unix timestamp
        const date = Math.floor(new Date(dateInput).getTime() / 1000);

        // Create event
        const tx = await contract.createEvent(
            name,
            description,
            date,
            price,
            maxTickets,
            maxResellPrice,
            transferLocked
        );

        // Wait for transaction to be mined
        await tx.wait();

        // Reset form
        createEventForm.reset();

        // Reload events
        loadEvents();
        loadOrganizerEvents();

        alert('Event created successfully!');
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Error creating event. See console for details.');
    }
}

// Show event details in modal
async function showEventDetails(eventId) {
    if (!contract) return;

    try {
        const event = await contract.events(eventId);
        const availableTickets = event.maxTickets - event.ticketsSold;

        modalEventName.textContent = event.name;
        modalEventDescription.textContent = event.description;
        modalEventDate.textContent = new Date(event.date * 1000).toLocaleString();
        modalEventPrice.textContent = ethers.utils.formatEther(event.price);
        modalEventAvailable.textContent = `${availableTickets} / ${event.maxTickets}`;

        // Store event ID for purchase
        buyTicketBtn.setAttribute('data-event-id', eventId);

        // Disable buy button if sold out or past event
        if (availableTickets === 0 || event.date * 1000 < Date.now()) {
            buyTicketBtn.disabled = true;
            buyTicketBtn.textContent = availableTickets === 0 ? 'Sold Out' : 'Event Ended';
        } else {
            buyTicketBtn.disabled = false;
            buyTicketBtn.textContent = 'Buy Ticket';
        }

        // Reset purchase status
        purchaseStatus.classList.add('hidden');

        // Show modal
        openModal(eventModal);
    } catch (error) {
        console.error('Error showing event details:', error);
    }
}

// Buy a ticket
async function buyTicket() {
    if (!contract) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        const eventId = buyTicketBtn.getAttribute('data-event-id');
        const event = await contract.events(eventId);

        // Disable button during transaction
        buyTicketBtn.disabled = true;
        buyTicketBtn.textContent = 'Processing...';

        // Show status
        purchaseStatus.textContent = 'Transaction in progress...';
        purchaseStatus.className = '';
        purchaseStatus.classList.remove('hidden');

        // Purchase ticket
        const tx = await contract.mintTicket(eventId, { value: event.price });

        // Wait for transaction to be mined
        await tx.wait();

        // Update UI
        purchaseStatus.textContent = 'Ticket purchased successfully!';
        purchaseStatus.classList.add('result-valid');
        buyTicketBtn.textContent = 'Purchased';

        // Reload tickets
        loadTickets();
        loadEvents();
    } catch (error) {
        console.error('Error buying ticket:', error);
        purchaseStatus.textContent = 'Error purchasing ticket. See console for details.';
        purchaseStatus.classList.add('result-invalid');
        buyTicketBtn.disabled = false;
        buyTicketBtn.textContent = 'Buy Ticket';
    }
}

// Show ticket details in modal
async function showTicketDetails(ticketId) {
    if (!contract) return;

    try {
        const ticket = await contract.tickets(ticketId);
        const event = await contract.events(ticket.eventId);

        modalTicketEvent.textContent = event.name;
        modalTicketId.textContent = ticketId;

        let status = 'Valid';
        if (ticket.used) {
            status = 'Used';
        } else if (event.date * 1000 < Date.now()) {
            status = 'Expired';
        }

        modalTicketStatus.textContent = status;

        // Generate QR code with ticket data
        const ticketData = JSON.stringify({
            tokenId: ticketId,
            owner: userAddress,
            eventId: ticket.eventId.toString(),
            eventName: event.name
        });

        ticketQR.innerHTML = '';
        QRCode.toCanvas(ticketQR, ticketData, { width: 200 }, function (error) {
            if (error) console.error(error);
        });

        // Show modal
        openModal(ticketModal);
    } catch (error) {
        console.error('Error showing ticket details:', error);
    }
}

// Validate a ticket
async function validateTicket() {
    if (!contract) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        const ticketId = ticketIdInput.value;
        const ticketOwner = ticketOwnerInput.value;

        if (!ticketId || !ticketOwner) {
            alert('Please enter both ticket ID and owner address');
            return;
        }

        // Validate ticket
        const isValid = await contract.verifyTicket(ticketId, ticketOwner);

        // Show result
        validationResult.textContent = isValid ? 'Ticket is valid!' : 'Ticket is invalid!';
        validationResult.className = isValid ? 'result-valid' : 'result-invalid';
        validationResult.classList.remove('hidden');

        // If valid, show option to mark as used
        if (isValid) {
            validationResult.innerHTML += `
                <div style="margin-top: 1rem;">
                    <button id="mark-used-btn">Mark as Used</button>
                </div>
            `;

            document.getElementById('mark-used-btn').addEventListener('click', () => markTicketAsUsed(ticketId));
        }
    } catch (error) {
        console.error('Error validating ticket:', error);
        validationResult.textContent = 'Error validating ticket. See console for details.';
        validationResult.className = 'result-invalid';
        validationResult.classList.remove('hidden');
    }
}

// Mark a ticket as used
async function markTicketAsUsed(ticketId) {
    if (!contract) return;

    try {
        // Mark ticket as used
        const tx = await contract.useTicket(ticketId);

        // Wait for transaction to be mined
        await tx.wait();

        validationResult.textContent = 'Ticket marked as used successfully!';
        validationResult.className = 'result-valid';
    } catch (error) {
        console.error('Error marking ticket as used:', error);
        validationResult.textContent = 'Error marking ticket as used. You may not be authorized as a validator.';
        validationResult.className = 'result-invalid';
    }
}

// Toggle transfer lock for an event
async function toggleTransferLock(eventId) {
    if (!contract) return;

    try {
        // Toggle transfer lock
        const tx = await contract.toggleTransferLock(eventId);

        // Wait for transaction to be mined
        await tx.wait();

        // Reload organizer events
        loadOrganizerEvents();
    } catch (error) {
        console.error('Error toggling transfer lock:', error);
        alert('Error toggling transfer lock. See console for details.');
    }
}

// Start QR scanner
function startQRScanner() {
    // This is a placeholder for QR scanning functionality
    // In a real application, you would use a library like jsQR or a dedicated QR scanner
    alert('QR scanning functionality would be implemented here');
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', init);
