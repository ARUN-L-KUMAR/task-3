const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventTicket", function () {
  let EventTicket;
  let eventTicket;
  let owner;
  let organizer;
  let attendee1;
  let attendee2;
  let validator;
  let eventId;
  
  const EVENT_NAME = "Test Event";
  const EVENT_DESCRIPTION = "This is a test event";
  const EVENT_PRICE = ethers.parseEther("0.1");
  const MAX_TICKETS = 100;
  const MAX_RESELL_PRICE = ethers.parseEther("0.15"); // 50% markup allowed
  const TRANSFER_LOCKED = false;
  
  // Set event date to 1 day in the future
  const EVENT_DATE = Math.floor(Date.now() / 1000) + 86400;

  beforeEach(async function () {
    // Get signers
    [owner, organizer, attendee1, attendee2, validator] = await ethers.getSigners();
    
    // Deploy contract
    EventTicket = await ethers.getContractFactory("EventTicket");
    eventTicket = await EventTicket.deploy();
    
    // Create an event
    const tx = await eventTicket.connect(organizer).createEvent(
      EVENT_NAME,
      EVENT_DESCRIPTION,
      EVENT_DATE,
      EVENT_PRICE,
      MAX_TICKETS,
      MAX_RESELL_PRICE,
      TRANSFER_LOCKED
    );
    
    const receipt = await tx.wait();
    const event = receipt.logs[0];
    eventId = event.args[0];
  });

  describe("Event Creation", function () {
    it("Should create an event with correct parameters", async function () {
      const eventDetails = await eventTicket.events(eventId);
      
      expect(eventDetails.name).to.equal(EVENT_NAME);
      expect(eventDetails.description).to.equal(EVENT_DESCRIPTION);
      expect(eventDetails.date).to.equal(EVENT_DATE);
      expect(eventDetails.price).to.equal(EVENT_PRICE);
      expect(eventDetails.maxTickets).to.equal(MAX_TICKETS);
      expect(eventDetails.ticketsSold).to.equal(0);
      expect(eventDetails.isActive).to.equal(true);
      expect(eventDetails.organizer).to.equal(organizer.address);
      expect(eventDetails.maxResellPrice).to.equal(MAX_RESELL_PRICE);
      expect(eventDetails.transferLocked).to.equal(TRANSFER_LOCKED);
    });
    
    it("Should fail to create an event with past date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // 1 day in the past
      
      await expect(
        eventTicket.connect(organizer).createEvent(
          EVENT_NAME,
          EVENT_DESCRIPTION,
          pastDate,
          EVENT_PRICE,
          MAX_TICKETS,
          MAX_RESELL_PRICE,
          TRANSFER_LOCKED
        )
      ).to.be.revertedWith("Event date must be in the future");
    });
  });

  describe("Ticket Minting", function () {
    it("Should mint a ticket successfully", async function () {
      await eventTicket.connect(attendee1).mintTicket(eventId, { value: EVENT_PRICE });
      
      const eventDetails = await eventTicket.events(eventId);
      expect(eventDetails.ticketsSold).to.equal(1);
      
      const balance = await eventTicket.balanceOf(attendee1.address);
      expect(balance).to.equal(1);
      
      const tokenId = 0; // First token ID
      const ticketDetails = await eventTicket.tickets(tokenId);
      expect(ticketDetails.eventId).to.equal(eventId);
      expect(ticketDetails.used).to.equal(false);
    });
    
    it("Should fail to mint a ticket with insufficient payment", async function () {
      const insufficientPayment = ethers.parseEther("0.05"); // Half the required price
      
      await expect(
        eventTicket.connect(attendee1).mintTicket(eventId, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Ticket Validation", function () {
    beforeEach(async function () {
      // Mint a ticket for attendee1
      await eventTicket.connect(attendee1).mintTicket(eventId, { value: EVENT_PRICE });
    });
    
    it("Should add a validator successfully", async function () {
      await eventTicket.connect(organizer).addValidator(eventId, validator.address);
      
      const isValidator = await eventTicket.eventValidators(eventId, validator.address);
      expect(isValidator).to.equal(true);
    });
    
    it("Should mark a ticket as used", async function () {
      const tokenId = 0; // First token ID
      
      // Add validator
      await eventTicket.connect(organizer).addValidator(eventId, validator.address);
      
      // Mark ticket as used
      await eventTicket.connect(validator).useTicket(tokenId);
      
      const ticketDetails = await eventTicket.tickets(tokenId);
      expect(ticketDetails.used).to.equal(true);
    });
    
    it("Should verify a valid ticket", async function () {
      const tokenId = 0; // First token ID
      
      const isValid = await eventTicket.verifyTicket(tokenId, attendee1.address);
      expect(isValid).to.equal(true);
    });
    
    it("Should not verify an invalid ticket", async function () {
      const tokenId = 0; // First token ID
      
      const isValid = await eventTicket.verifyTicket(tokenId, attendee2.address);
      expect(isValid).to.equal(false);
    });
  });

  describe("Anti-Scalping Measures", function () {
    beforeEach(async function () {
      // Create a new event with transfer lock enabled
      const tx = await eventTicket.connect(organizer).createEvent(
        "Locked Event",
        "Event with transfer lock",
        EVENT_DATE,
        EVENT_PRICE,
        MAX_TICKETS,
        MAX_RESELL_PRICE,
        true // Transfer locked
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      lockedEventId = event.args[0];
      
      // Mint a ticket for the locked event
      await eventTicket.connect(attendee1).mintTicket(lockedEventId, { value: EVENT_PRICE });
      
      // Mint a ticket for the unlocked event
      await eventTicket.connect(attendee1).mintTicket(eventId, { value: EVENT_PRICE });
    });
    
    it("Should prevent transfer of locked tickets", async function () {
      const lockedTokenId = 0; // First token ID (locked event)
      
      await expect(
        eventTicket.connect(attendee1).transferFrom(attendee1.address, attendee2.address, lockedTokenId)
      ).to.be.revertedWith("Transfers are locked for this event");
    });
    
    it("Should allow transfer of unlocked tickets", async function () {
      const unlockedTokenId = 1; // Second token ID (unlocked event)
      
      await eventTicket.connect(attendee1).transferFrom(attendee1.address, attendee2.address, unlockedTokenId);
      
      const newOwner = await eventTicket.ownerOf(unlockedTokenId);
      expect(newOwner).to.equal(attendee2.address);
    });
    
    it("Should toggle transfer lock", async function () {
      await eventTicket.connect(organizer).toggleTransferLock(lockedEventId);
      
      const eventDetails = await eventTicket.events(lockedEventId);
      expect(eventDetails.transferLocked).to.equal(false);
      
      // Now transfer should work
      const lockedTokenId = 0;
      await eventTicket.connect(attendee1).transferFrom(attendee1.address, attendee2.address, lockedTokenId);
      
      const newOwner = await eventTicket.ownerOf(lockedTokenId);
      expect(newOwner).to.equal(attendee2.address);
    });
  });
});
