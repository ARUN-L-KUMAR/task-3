const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Event ID
  const eventId = 0; // First event has ID 0
  
  // Get event details
  const eventDetails = await eventTicket.events(eventId);
  console.log(`Toggling transfer lock for event: ${eventDetails.name}`);
  console.log(`Current transfer lock status: ${eventDetails.transferLocked ? "Enabled" : "Disabled"}`);
  
  // Toggle transfer lock
  console.log("Toggling transfer lock...");
  const tx = await eventTicket.toggleTransferLock(eventId);
  await tx.wait();
  
  // Get updated event details
  const updatedEventDetails = await eventTicket.events(eventId);
  console.log(`New transfer lock status: ${updatedEventDetails.transferLocked ? "Enabled" : "Disabled"}`);
  console.log("Transfer lock toggled successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
