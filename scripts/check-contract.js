const hre = require("hardhat");

async function main() {
  try {
    // Get the deployed contract address
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log("Checking contract at address:", contractAddress);

    // Get contract factory
    const EventTicket = await hre.ethers.getContractFactory("EventTicket");

    // Attach to the deployed contract
    const eventTicket = await EventTicket.attach(contractAddress);
    console.log("Contract attached successfully");

    // Check if the contract exists by calling a view function
    try {
      const name = await eventTicket.name();
      const symbol = await eventTicket.symbol();
      console.log("Contract name:", name);
      console.log("Contract symbol:", symbol);
      console.log("Contract exists and is accessible");
    } catch (error) {
      console.error("Error calling contract functions:", error.message);
      console.log("Contract may not exist at the specified address");
    }

    // Check events
    try {
      // Let's just try to get the first event
      try {
        const event = await eventTicket.events(0);
        console.log("Found at least one event");

        // If we get here, we have at least one event
        const eventCount = 1;
        console.log("Number of events:", eventCount);

        if (eventCount > 0) {
          console.log("\nEvent details:");
          for (let i = 0; i < eventCount; i++) {
            const event = await eventTicket.events(i);
            console.log(`Event ${i}:`);
            console.log(`  Name: ${event.name}`);
            console.log(`  Description: ${event.description}`);
            console.log(`  Date: ${new Date(Number(event.date) * 1000).toLocaleString()}`);
            console.log(`  Price: ${hre.ethers.formatEther(event.price)} ETH`);
            console.log(`  Tickets sold: ${event.ticketsSold} / ${event.maxTickets}`);
            console.log(`  Active: ${event.isActive}`);
            console.log(`  Organizer: ${event.organizer}`);
            console.log(`  Transfer locked: ${event.transferLocked}`);
          }
        }
      } catch (eventError) {
        console.log("No events found");
      }
    } catch (error) {
      console.error("Error checking events:", error.message);
    }

    // Check network
    const network = await hre.ethers.provider.getNetwork();
    console.log("\nNetwork information:");
    console.log("  Name:", network.name);
    console.log("  Chain ID:", network.chainId);

    console.log("\nContract check completed successfully");
  } catch (error) {
    console.error("Error checking contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
