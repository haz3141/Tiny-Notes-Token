// Fetch and parse the ABI JSON file
async function getContractABI() {
    const response = await fetch('./abis/TinyNotesTokenABI.json');
    const data = await response.json();
    return data;
}

async function getFaucetContractABI() {
    const response = await fetch('./abis/TinyNotesTokenFaucetABI.json');
    const data = await response.json();
    return data;
}

async function displayNotes(tokenContract) {
    const notesContainer = document.getElementById("notes");
    notesContainer.innerHTML = ""; // Clear the container before adding new notes

    const noteCount = await tokenContract.methods.noteIds().call();
    
    for (let noteId = 0; noteId < noteCount; noteId++) {
        try {
            const noteData = await tokenContract.methods.readNote(noteId).call();
            if (noteData.title !== "") {
                const noteElement = document.createElement("div");
                noteElement.className = "note";
                noteElement.innerHTML = `
                  <h3>${noteData.title}</h3>
                  <p>${noteData.content}</p>
                  <p>Created by: ${noteData.creator}</p>
                  <button onclick="updateNote(${noteId})">Update</button>
                  <button onclick="deleteNote(${noteId})">Delete</button>
                `;

                notesContainer.appendChild(noteElement);
            }
        } catch (error) {
            console.error("Error while fetching note", noteId, error);
        }
    }
}


window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        // Hide the "no-metamask" message
        document.getElementById('no-metamask').style.display = 'none';
    } else {
        console.error('No web3 detected.');
        // Show the "no-metamask" message
        document.getElementById('no-metamask').style.display = 'block';
    }

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    document.getElementById('account').innerText = `Account: ${account}`;

    const tokenContractABI = await getContractABI();
    const tokenContractAddress = '0x476011Dc7fa97C9C44B64C2bf2c75C0e5A9591f5';

    const tokenContract = new web3.eth.Contract(tokenContractABI, tokenContractAddress);

    const faucetContractABI = await getFaucetContractABI();
    const faucetContractAddress = '0x1E6EE46a4D508B4f4BA5A4B1A1088F28B6fBca1c';

    const faucetContract = new web3.eth.Contract(faucetContractABI, faucetContractAddress);

    document.getElementById('create-note').addEventListener('click', async () => {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        
        await tokenContract.methods.createNote(title, content).send({ from: account });
        alert('Note created!');

        await displayNotes(tokenContract);
    });

    document.getElementById('request-tokens').addEventListener('click', async () => {
        await faucetContract.methods.requestTokens().send({ from: account });
        alert('Tokens requested!');
    });    

    // Add event listeners for other contract functions (e.g., readNote, updateNote, deleteNote)

    await displayNotes(tokenContract);
});
