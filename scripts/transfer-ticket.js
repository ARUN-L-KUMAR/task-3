const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Get signers
  const [owner, buyer, recipient] = await hre.ethers.getSigners();

  // Ticket ID to transfer
  const tokenId = 1; // Second token has ID 1

  // Get ticket details
  const ticket = await eventTicket.tickets(tokenId);
  const event = await eventTicket.events(ticket.eventId);

  console.log(`Transferring ticket for event: ${event.name}`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`Current owner: ${await eventTicket.ownerOf(tokenId)}`);
  console.log(`Recipient: ${recipient.address}`);
  console.log(`Transfer lock status: ${event.transferLocked ? "Enabled" : "Disabled"}`);

  try {
    // Transfer ticket
    console.log("Transferring ticket...");
    const tx = await eventTicket.connect(buyer).transferFrom(buyer.address, recipient.address, tokenId);
    await tx.wait();

    console.log("Ticket transferred successfully!");
    console.log(`New owner: ${await eventTicket.ownerOf(tokenId)}`);
  } catch (error) {
    console.error("Error transferring ticket:");
    if (error.message.includes("Transfers are locked for this event")) {
      console.log("Transfer failed: Transfers are locked for this event");

      // Toggle transfer lock to allow transfer
      console.log("\nToggling transfer lock to allow transfer...");
      const toggleTx = await eventTicket.toggleTransferLock(ticket.eventId);
      await toggleTx.wait();

      console.log("Transfer lock disabled. Trying transfer again...");
      const tx = await eventTicket.connect(buyer).transferFrom(buyer.address, recipient.address, tokenId);
      await tx.wait();

      console.log("Ticket transferred successfully!");
      console.log(`New owner: ${await eventTicket.ownerOf(tokenId)}`);

      // Toggle transfer lock back on
      console.log("\nToggling transfer lock back on...");
      const toggleBackTx = await eventTicket.toggleTransferLock(ticket.eventId);
      await toggleBackTx.wait();
      console.log("Transfer lock enabled again.");
    } else {
      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
