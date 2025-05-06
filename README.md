# Decentralized Event Ticketing DApp

A blockchain-based event ticketing platform that uses NFTs (ERC721 tokens) to represent tickets, with anti-scalping measures and ticket verification functionality.

## Features

- **NFT Tickets**: Each ticket is a unique NFT with ownership tracking
- **Anti-Scalping Measures**: 
  - Transfer lock option to prevent ticket reselling
  - Maximum resell price limits
- **Ticket Verification**: Validators can verify ticket authenticity and mark tickets as used
- **Event Management**: Create events, mint tickets, and manage validators

## Technology Stack

- **Blockchain**: Ethereum
- **Smart Contract**: Solidity
- **Development Framework**: Hardhat
- **Frontend**: HTML/CSS/JavaScript
- **Web3 Library**: ethers.js
- **Token Standard**: ERC721 (NFTs)

## Project Structure

```
├── contracts/             # Smart contracts
│   └── EventTicket.sol    # Main contract for event tickets
├── scripts/               # Deployment and interaction scripts
├── test/                  # Test files
├── frontend/              # Web interface
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main HTML file
└── hardhat.config.js      # Hardhat configuration
```

## Smart Contract

The `EventTicket.sol` contract implements:

1. **Event Creation**: Organizers can create events with customizable parameters
2. **Ticket Minting**: Users can purchase tickets as NFTs
3. **Anti-Scalping Rules**: Custom transfer logic to prevent scalping
4. **Ticket Verification**: Functions to verify ticket authenticity and mark tickets as used
5. **Validator Management**: Add/remove validators for events

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask or another Ethereum wallet

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Start a local Ethereum node:
   ```
   npm run node
   ```

4. Deploy the contract:
   ```
   npm run deploy
   ```

5. Create a test event:
   ```
   npm run create-event
   ```

6. Start the frontend:
   ```
   npm run start
   ```

7. Open your browser at `http://localhost:8080`

## Usage

### For Event Organizers

1. Connect your wallet
2. Navigate to the "Organizer" tab
3. Fill out the event details form and create an event
4. Add validators for your event
5. Toggle transfer lock as needed

### For Attendees

1. Connect your wallet
2. Browse available events in the "Events" tab
3. Purchase tickets
4. View your tickets in the "My Tickets" tab
5. Transfer tickets (if allowed)

### For Validators

1. Connect your wallet (must be added as a validator)
2. Navigate to the "Validator" tab
3. Enter ticket ID and owner address to verify
4. Mark tickets as used after verification

## Scripts

- `npm run test`: Run tests
- `npm run node`: Start a local Ethereum node
- `npm run deploy`: Deploy the contract
- `npm run create-event`: Create a test event
- `npm run mint-ticket`: Mint a test ticket
- `npm run verify-ticket`: Verify a ticket
- `npm run add-validator`: Add a validator
- `npm run toggle-lock`: Toggle transfer lock
- `npm run transfer-ticket`: Transfer a ticket
- `npm run start`: Start the frontend server

## License

This project is licensed under the ISC License.
