const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Get signers
  const [owner, buyer] = await hre.ethers.getSigners();

  // Event ID
  const eventId = 0; // First event has ID 0

  // Get event details
  const eventDetails = await eventTicket.events(eventId);
  console.log(`Minting ticket for event: ${eventDetails.name}`);
  console.log(`Price: ${hre.ethers.formatEther(eventDetails.price)} ETH`);

  // Mint a ticket as the buyer
  console.log(`Buyer address: ${buyer.address}`);
  console.log("Minting ticket...");

  const tx = await eventTicket.connect(buyer).mintTicket(eventId, {
    value: eventDetails.price
  });

  await tx.wait();
  console.log("Ticket minted successfully!");

  // Get the ticket details
  const tokenId = 1; // Second token has ID 1
  const ticketDetails = await eventTicket.tickets(tokenId);

  console.log("\nTicket Details:");
  console.log(`Token ID: ${tokenId}`);
  console.log(`Event ID: ${ticketDetails.eventId}`);
  console.log(`Used: ${ticketDetails.used}`);
  console.log(`Purchase Price: ${hre.ethers.formatEther(ticketDetails.purchasePrice)} ETH`);
  console.log(`Purchase Time: ${new Date(Number(ticketDetails.purchaseTime) * 1000).toLocaleString()}`);

  // Check ownership
  const owner1 = await eventTicket.ownerOf(tokenId);
  console.log(`Owner: ${owner1}`);

  // Verify the ticket
  const isValid = await eventTicket.verifyTicket(tokenId, buyer.address);
  console.log(`Ticket Valid: ${isValid}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
