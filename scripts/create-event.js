const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Create a test event
  const eventName = "Test Conference 2025";
  const eventDescription = "A blockchain conference showcasing the latest in decentralized technologies.";
  const eventDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
  const eventPrice = hre.ethers.parseEther("0.1"); // 0.1 ETH
  const maxTickets = 100;
  const maxResellPrice = hre.ethers.parseEther("0.15"); // 0.15 ETH (50% markup allowed)
  const transferLocked = false;

  console.log("Creating event...");
  const tx = await eventTicket.createEvent(
    eventName,
    eventDescription,
    eventDate,
    eventPrice,
    maxTickets,
    maxResellPrice,
    transferLocked
  );

  await tx.wait();
  console.log("Event created successfully!");

  // Get the event ID
  const eventId = 0; // First event has ID 0
  const eventDetails = await eventTicket.events(eventId);
  
  console.log("\nEvent Details:");
  console.log(`Name: ${eventDetails.name}`);
  console.log(`Description: ${eventDetails.description}`);
  console.log(`Date: ${new Date(Number(eventDetails.date) * 1000).toLocaleString()}`);
  console.log(`Price: ${hre.ethers.formatEther(eventDetails.price)} ETH`);
  console.log(`Max Tickets: ${eventDetails.maxTickets}`);
  console.log(`Tickets Sold: ${eventDetails.ticketsSold}`);
  console.log(`Active: ${eventDetails.isActive}`);
  console.log(`Organizer: ${eventDetails.organizer}`);
  console.log(`Max Resell Price: ${hre.ethers.formatEther(eventDetails.maxResellPrice)} ETH`);
  console.log(`Transfer Locked: ${eventDetails.transferLocked}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
