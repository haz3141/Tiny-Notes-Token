// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TinyNotesToken is ERC20 {
    using Counters for Counters.Counter;
    Counters.Counter private _noteIds;

    struct Note {
        address creator;
        string title;
        string content;
    }

    mapping(uint256 => Note) private idToNote;

    constructor() ERC20("Tiny Notes Token", "TNT") {
        _mint(msg.sender, 47000000 * 10 ** decimals());
    }

    function createNote(string memory _title, string memory _content) public {
        require(balanceOf(address(msg.sender)) > 0, "Must hold TNT to create a Note.");
        _noteIds.increment();
        uint256 newNoteId = _noteIds.current();
        idToNote[newNoteId] = Note(
            msg.sender,
            _title,
            _content
        );
    }

    function readNote(uint256 _noteId) public view returns (string memory title, string memory content) {
        Note memory note = idToNote[_noteId];
        return (note.title, note.content);
    }
}