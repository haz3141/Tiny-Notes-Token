// Fetch and parse the ABI JSON file
async function getContractABI() {
  const response = await fetch("./abis/TinyNotesTokenABI.json");
  const data = await response.json();
  return data;
}

async function getFaucetContractABI() {
  const response = await fetch("./abis/TinyNotesTokenFaucetABI.json");
  const data = await response.json();
  return data;
}

async function displayNotes(tokenContract, account) {
  const notesContainer = document.getElementById("notes");
  notesContainer.innerHTML = ""; // Clear the container before adding new notes

  const noteCount = await tokenContract.methods.noteIds().call();

  for (let noteId = 0; noteId <= noteCount; noteId++) {
    try {
      const noteData = await tokenContract.methods.readNote(noteId).call();
      if (noteData.title !== "") {
        const noteElement = document.createElement("div");
        noteElement.className = "note";
        noteElement.innerHTML = `
            <div id="note-content-container-${noteId}" class="note-content-container">
                <h3>${noteData.title}</h3>
                <p>${noteData.content}</p>
                <p>Created by: ${noteData.creator}</p>
                <button id="update-${noteId}" class="update-button">Update</button>
                <button id="delete-${noteId}" class="delete-button">Delete</button>
            </div>
        `;

        notesContainer.appendChild(noteElement);

        const updateFormContainer = document.createElement("div");
        updateFormContainer.className = "update-form-container";
        updateFormContainer.style.display = "none";
        updateFormContainer.setAttribute("data-noteid", noteId);
        updateFormContainer.innerHTML = `
            <input id="update-title-${noteId}" type="text" placeholder="Title">
            <textarea id="update-content-${noteId}" rows="4" placeholder="Content"></textarea>
            <button id="save-updated-note-${noteId}" class="save-updated-note">Save</button>
            <button id="cancel-update-${noteId}" class="cancel-update">Cancel</button>
        `;

        noteElement.appendChild(updateFormContainer);

        // Check if the connected account is the note author
        if (account.toLowerCase() !== noteData.creator.toLowerCase()) {
          noteElement.querySelector(".update-button").style.display = "none";
          noteElement.querySelector(".delete-button").style.display = "none";
        } else {
          document
            .getElementById(`update-${noteId}`)
            .addEventListener("click", () => {
              updateNote(noteId, tokenContract);
            });

          document
            .getElementById(`delete-${noteId}`)
            .addEventListener("click", () => {
              deleteNote(noteId, tokenContract);
            });
        }
      }
    } catch (error) {
      console.error("Error while fetching note", noteId, error);
    }
  }
}

async function updateNote(noteId, tokenContract) {
  // Fetch the existing note data
  const noteData = await tokenContract.methods.readNote(noteId).call();

  // Populate the update form with the existing note data
  document.getElementById(`update-title-${noteId}`).value = noteData.title;
  document.getElementById(`update-content-${noteId}`).value = noteData.content;

  // Hide the note content container
  document.getElementById(`note-content-container-${noteId}`).style.display =
    "none";

  // Show the update form
  document.querySelector(
    `.update-form-container[data-noteid="${noteId}"]`
  ).style.display = "block";
}

async function saveUpdatedNote(noteId, tokenContract) {
  const updatedTitle = document.getElementById(`update-title-${noteId}`).value;
  const updatedContent = document.getElementById(
    `update-content-${noteId}`
  ).value;

  // Call the smart contract function to update the note on the blockchain
  await tokenContract.methods
    .updateNote(noteId, updatedTitle, updatedContent)
    .send({ from: account });

  // Refresh the notes display
  await displayNotes(tokenContract, account);

  // Hide the update form
  cancelUpdate(noteId);
}

function cancelUpdate(noteId) {
  document.querySelector(
    `.update-form-container[data-noteid="${noteId}"]`
  ).style.display = "none";
}

window.addEventListener("load", async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();

    // Hide the "no-metamask" message
    document.getElementById("no-metamask").style.display = "none";
  } else {
    console.error("No web3 detected.");
    // Show the "no-metamask" message
    document.getElementById("no-metamask").style.display = "block";
  }

  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  document.getElementById("account").innerText = `Account: ${account}`;

  const tokenContractABI = await getContractABI();
  const tokenContractAddress = "0x476011Dc7fa97C9C44B64C2bf2c75C0e5A9591f5";

  const tokenContract = new web3.eth.Contract(
    tokenContractABI,
    tokenContractAddress
  );

  const faucetContractABI = await getFaucetContractABI();
  const faucetContractAddress = "0x1E6EE46a4D508B4f4BA5A4B1A1088F28B6fBca1c";

  const faucetContract = new web3.eth.Contract(
    faucetContractABI,
    faucetContractAddress
  );

  document.getElementById("create-note").addEventListener("click", async () => {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;

    await tokenContract.methods
      .createNote(title, content)
      .send({ from: account });
    alert("Note created!");

    await displayNotes(tokenContract, account);
  });

  document
    .getElementById("request-tokens")
    .addEventListener("click", async () => {
      await faucetContract.methods.requestTokens().send({ from: account });
      alert("Tokens requested!");
    });

  // Add event listeners for other contract functions (e.g., readNote, updateNote, deleteNote)

  await displayNotes(tokenContract, account);
});
