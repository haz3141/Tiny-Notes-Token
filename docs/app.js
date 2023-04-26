// Fetch and parse the ABI JSON file
async function getContractABI() {
    const response = await fetch('./abis/TinyNotesTokenABI.json');
    const data = await response.json();
    return data;
}

async function displayNotes(contract) {
    const notesContainer = document.getElementById("notes");
    notesContainer.innerHTML = ""; // Clear the container before adding new notes

    const noteIds = await contract.methods.noteIds().call(); // Use the public noteIds getter

    for (const noteId of noteIds) {
        const noteData = await contract.methods.readNote(noteId).call();
        const noteElement = document.createElement("div");
        noteElement.className = "note";
        noteElement.innerHTML = `
            <h3>${noteData.title}</h3>
            <p>${noteData.content}</p>
            <button onclick="updateNote(${noteId})">Update</button>
            <button onclick="deleteNote(${noteId})">Delete</button>
        `;
        notesContainer.appendChild(noteElement);
    }
}


window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
    } else {
        console.error('No web3 detected.');
    }

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    document.getElementById('account').innerText = `Account: ${account}`;

    const contractABI = await getContractABI();
    const contractAddress = '0x829eA7CE136c24Dfc2A792AbeD4c71dF0047391b';

    const contract = new web3.eth.Contract(contractABI, contractAddress);

    document.getElementById('create-note').addEventListener('click', async () => {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        
        await contract.methods.createNote(title, content).send({ from: account });
        alert('Note created!');
        await displayNotes(contract);
    });

    // Add event listeners for other contract functions (e.g., readNote, updateNote, deleteNote)

    await displayNotes(contract);
});
