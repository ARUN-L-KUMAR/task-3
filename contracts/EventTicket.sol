// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventTicket
 * @dev A contract for creating and managing event tickets as NFTs with anti-scalping measures
 */
contract EventTicket is ERC721Enumerable, Ownable {
    // Counter variables
    uint256 private _tokenIdCounter;
    uint256 private _eventIdCounter;

    // Event struct to store event details
    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 date;
        uint256 price;
        uint256 maxTickets;
        uint256 ticketsSold;
        bool isActive;
        address organizer;
        uint256 maxResellPrice; // Maximum allowed resell price (anti-scalping)
        bool transferLocked;    // If true, tickets can't be transferred (anti-scalping)
    }

    // Ticket struct to store ticket details
    struct Ticket {
        uint256 tokenId;
        uint256 eventId;
        bool used;
        uint256 purchasePrice;
        uint256 purchaseTime;
    }

    // Mapping from event ID to Event
    mapping(uint256 => Event) public events;

    // Mapping from token ID to Ticket
    mapping(uint256 => Ticket) public tickets;

    // Mapping from event ID to array of token IDs
    mapping(uint256 => uint256[]) private _eventTickets;

    // Mapping from event ID to mapping of address to validator status
    mapping(uint256 => mapping(address => bool)) public eventValidators;

    // Events
    event EventCreated(uint256 indexed eventId, string name, uint256 date, uint256 price, uint256 maxTickets, address organizer);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId);
    event ValidatorAdded(uint256 indexed eventId, address validator);
    event ValidatorRemoved(uint256 indexed eventId, address validator);
    event TransferLockToggled(uint256 indexed eventId, bool locked);

    constructor() ERC721("EventTicket", "ETIX") Ownable(msg.sender) {}

    /**
     * @dev Creates a new event
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 date,
        uint256 price,
        uint256 maxTickets,
        uint256 maxResellPrice,
        bool transferLocked
    ) public returns (uint256) {
        require(date > block.timestamp, "Event date must be in the future");
        require(maxTickets > 0, "Maximum tickets must be greater than zero");
        require(maxResellPrice >= price, "Max resell price must be >= original price");

        uint256 eventId = _eventIdCounter;
        _eventIdCounter++;

        events[eventId] = Event({
            eventId: eventId,
            name: name,
            description: description,
            date: date,
            price: price,
            maxTickets: maxTickets,
            ticketsSold: 0,
            isActive: true,
            organizer: msg.sender,
            maxResellPrice: maxResellPrice,
            transferLocked: transferLocked
        });

        // Add the event creator as a validator by default
        eventValidators[eventId][msg.sender] = true;

        emit EventCreated(eventId, name, date, price, maxTickets, msg.sender);

        return eventId;
    }

    /**
     * @dev Mints a new ticket for an event
     */
    function mintTicket(uint256 eventId) public payable returns (uint256) {
        Event storage eventDetails = events[eventId];

        require(eventDetails.isActive, "Event is not active");
        require(block.timestamp < eventDetails.date, "Event has already occurred");
        require(eventDetails.ticketsSold < eventDetails.maxTickets, "Event is sold out");
        require(msg.value >= eventDetails.price, "Insufficient payment");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        tickets[tokenId] = Ticket({
            tokenId: tokenId,
            eventId: eventId,
            used: false,
            purchasePrice: msg.value,
            purchaseTime: block.timestamp
        });

        _eventTickets[eventId].push(tokenId);
        eventDetails.ticketsSold++;

        // Refund excess payment
        if (msg.value > eventDetails.price) {
            payable(msg.sender).transfer(msg.value - eventDetails.price);
        }

        // Transfer payment to event organizer
        payable(eventDetails.organizer).transfer(eventDetails.price);

        emit TicketMinted(tokenId, eventId, msg.sender);

        return tokenId;
    }

    /**
     * @dev Getter for eventIdCounter
     */
    function eventIdCounter() public view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @dev Override transfer function to implement anti-scalping measures
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0)) {
            Ticket storage ticket = tickets[tokenId];
            Event storage eventDetails = events[ticket.eventId];

            // Check if transfers are locked for this event
            require(!eventDetails.transferLocked, "Transfers are locked for this event");

            // Check if the event has already occurred
            require(block.timestamp < eventDetails.date, "Event has already occurred");

            // Check if the ticket has been used
            require(!ticket.used, "Ticket has already been used");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Allows a validator to mark a ticket as used
     */
    function useTicket(uint256 tokenId) public {
        Ticket storage ticket = tickets[tokenId];
        require(!ticket.used, "Ticket has already been used");

        Event storage eventDetails = events[ticket.eventId];
        require(eventValidators[ticket.eventId][msg.sender], "Not authorized as validator");

        ticket.used = true;

        emit TicketUsed(tokenId, ticket.eventId);
    }

    /**
     * @dev Adds a validator for an event
     */
    function addValidator(uint256 eventId, address validator) public {
        require(events[eventId].organizer == msg.sender, "Only event organizer can add validators");
        require(validator != address(0), "Invalid validator address");

        eventValidators[eventId][validator] = true;

        emit ValidatorAdded(eventId, validator);
    }

    /**
     * @dev Removes a validator for an event
     */
    function removeValidator(uint256 eventId, address validator) public {
        require(events[eventId].organizer == msg.sender, "Only event organizer can remove validators");
        require(validator != events[eventId].organizer, "Cannot remove event organizer as validator");

        eventValidators[eventId][validator] = false;

        emit ValidatorRemoved(eventId, validator);
    }

    /**
     * @dev Toggles the transfer lock for an event
     */
    function toggleTransferLock(uint256 eventId) public {
        require(events[eventId].organizer == msg.sender, "Only event organizer can toggle transfer lock");

        events[eventId].transferLocked = !events[eventId].transferLocked;

        emit TransferLockToggled(eventId, events[eventId].transferLocked);
    }

    /**
     * @dev Returns all tickets for an event
     */
    function getEventTickets(uint256 eventId) public view returns (uint256[] memory) {
        return _eventTickets[eventId];
    }

    /**
     * @dev Verifies if a ticket is valid
     */
    function verifyTicket(uint256 tokenId, address owner) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        if (_ownerOf(tokenId) != owner) return false;

        Ticket storage ticket = tickets[tokenId];
        if (ticket.used) return false;

        Event storage eventDetails = events[ticket.eventId];
        if (block.timestamp > eventDetails.date) return false;
        if (!eventDetails.isActive) return false;

        return true;
    }

    /**
     * @dev Checks if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
