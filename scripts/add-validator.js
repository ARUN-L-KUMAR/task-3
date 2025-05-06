const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Get signers
  const [owner, buyer, validator] = await hre.ethers.getSigners();

  // Event ID
  const eventId = 0; // First event has ID 0
  
  // Get event details
  const eventDetails = await eventTicket.events(eventId);
  console.log(`Adding validator for event: ${eventDetails.name}`);
  console.log(`Event organizer: ${eventDetails.organizer}`);
  console.log(`Validator address: ${validator.address}`);
  
  // Check if already a validator
  const isAlreadyValidator = await eventTicket.eventValidators(eventId, validator.address);
  if (isAlreadyValidator) {
    console.log("Address is already a validator for this event.");
    return;
  }
  
  // Add validator
  console.log("Adding validator...");
  const tx = await eventTicket.addValidator(eventId, validator.address);
  await tx.wait();
  console.log("Validator added successfully!");
  
  // Verify validator was added
  const isValidator = await eventTicket.eventValidators(eventId, validator.address);
  console.log(`Is validator: ${isValidator}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
