const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Get signers
  const [owner, buyer] = await hre.ethers.getSigners();

  // Ticket ID to verify
  const tokenId = 0; // First token has ID 0
  
  console.log("Verifying ticket...");
  console.log(`Token ID: ${tokenId}`);
  console.log(`Owner Address: ${buyer.address}`);
  
  // Verify the ticket
  const isValid = await eventTicket.verifyTicket(tokenId, buyer.address);
  console.log(`Ticket Valid: ${isValid}`);
  
  if (isValid) {
    // Get ticket details
    const ticket = await eventTicket.tickets(tokenId);
    const event = await eventTicket.events(ticket.eventId);
    
    console.log("\nTicket Details:");
    console.log(`Event: ${event.name}`);
    console.log(`Event Date: ${new Date(Number(event.date) * 1000).toLocaleString()}`);
    console.log(`Used: ${ticket.used}`);
    
    // Check if the user is a validator for this event
    const isValidator = await eventTicket.eventValidators(ticket.eventId, owner.address);
    console.log(`Current user is validator: ${isValidator}`);
    
    if (isValidator) {
      console.log("\nMarking ticket as used...");
      const tx = await eventTicket.useTicket(tokenId);
      await tx.wait();
      console.log("Ticket marked as used successfully!");
      
      // Verify again
      const isStillValid = await eventTicket.verifyTicket(tokenId, buyer.address);
      console.log(`Ticket still valid: ${isStillValid}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
