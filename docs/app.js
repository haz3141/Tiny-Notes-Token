const tokenAddress = "0x476011Dc7fa97C9C44B64C2bf2c75C0e5A9591f5";
const faucetAddress = "0x1E6EE46a4D508B4f4BA5A4B1A1088F28B6fBca1c";

let web3, accounts, tntBalance, tokenContract, faucetContract;

async function initWeb3() {
  if (typeof window.ethereum !== "undefined") {
    ethereum.autoRefreshOnNetworkChange = false;
    ethereum.request({ method: "eth_requestAccounts" });
    web3 = new Web3(window.ethereum);
    accounts = await web3.eth.getAccounts();

    // Event listener for account changes
    window.ethereum.on("accountsChanged", () => {
      location.reload();
    });

    // Event listener for network changes
    window.ethereum.on("chainChanged", () => {
      location.reload();
    });

    // Load ABIs
    const tokenABI = await loadABI("TinyNotesTokenABI.json");
    const faucetABI = await loadABI("TinyNotesTokenFaucetABI.json");

    // Initialize contracts
    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    faucetContract = new web3.eth.Contract(faucetABI, faucetAddress);

    if (!isValidEthereumAddress(accounts[0])) {
      showError("Connecting to MetaMask. Please unlock your wallet.");
      document.getElementById("address").textContent =
        "Connecting to MetaMask...";
      document.getElementById("create-note").textContent =
        "Must hold TNT to post";
      return;
    }

    document.getElementById(
      "address"
    ).textContent = `Connected: ${truncateAddress(accounts[0])}`;

    // Event listeners
    document
      .getElementById("request-tokens")
      .addEventListener("click", requestTokens);
    document
      .getElementById("create-note")
      .addEventListener("click", createNote);

    // Toggle create note button
    balance = await displayBalance();
    await toggleCreateNoteButton(balance);

    checkNetwork();

    // Load existing notes
    loadNotes();
  } else {
    showError("Please install MetaMask to use this dApp!");
  }
}

async function requestTokens() {
  try {
    await faucetContract.methods.requestTokens().send({ from: accounts[0] });
    alert("Tokens successfully requested!");
    // Toggle create note button
    balance = displayBalance();
    toggleCreateNoteButton(balance);
  } catch (error) {
    console.error(error);
    alert("Error requesting tokens. Check the console for more information.");
  }
}

async function createNote() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  try {
    await tokenContract.methods
      .createNote(title, content)
      .send({ from: accounts[0] });
    alert("Note successfully created!");
    loadNotes();
  } catch (error) {
    console.error(error);
    alert("Error creating note. Check the console for more information.");
  }
}

async function updateNote(noteId, newTitle, newContent) {
  try {
    await tokenContract.methods
      .updateNote(noteId, newTitle, newContent)
      .send({ from: accounts[0] });
    alert("Note updated successfully");
    location.reload();
  } catch (err) {
    alert("Error updating note: " + err.message);
  }
}

async function deleteNote(noteId) {
  try {
    await tokenContract.methods.deleteNote(noteId).send({ from: accounts[0] });
    alert("Note deleted successfully");
    location.reload();
  } catch (err) {
    alert("Error deleting note: " + err.message);
  }
}

async function loadNotes() {
  const notesDiv = document.getElementById("notes");
  notesDiv.innerHTML = "";

  const totalNotes = await tokenContract.methods.noteIds().call();

  for (let noteId = 0; noteId <= totalNotes; noteId++) {
    const noteData = await tokenContract.methods.readNote(noteId).call();

    if (noteData.title !== "") {
      const noteElement = document.createElement("div");
      noteElement.className = "note";
      noteElement.innerHTML = `
            <h2 class="note-title">${noteData.title}</h2>
            <p class="note-content">${noteData.content}</p>
            <p class="note-creator">Posted by: ${noteData.creator}</p>
    `;

      if (noteData.creator.toLowerCase() === accounts[0].toLowerCase()) {
        const updateButton = document.createElement("button");
        updateButton.className = "update-button";
        updateButton.textContent = "Update";
        updateButton.addEventListener("click", () => {
          openUpdateNoteModal(noteId, noteData.title, noteData.content);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
          await deleteNote(noteId);
        });

        noteElement.appendChild(updateButton);
        noteElement.appendChild(deleteButton);
      }

      notesDiv.appendChild(noteElement);
    }
  }
}

function openUpdateNoteModal(noteId, currentTitle, currentContent) {
  const newTitle = prompt("Enter the new title:", currentTitle);
  const newContent = prompt("Enter the new content:", currentContent);

  if (newTitle || newContent) {
    updateNote(noteId, newTitle, newContent);
  }
}

function truncateAddress(address) {
  if (address !== undefined) {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4,
      address.length
    )}`;
  } else {
    showError("Please connect MetaMask to use this dApp!");
  }
}

async function displayBalance() {
  const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
  const formattedBalance = web3.utils.fromWei(balance, "ether");
  document.getElementById("tnt-balance").textContent = formattedBalance;
  return formattedBalance;
}

async function toggleCreateNoteButton(balance) {
  const createNoteButton = document.getElementById("create-note");
  if (balance > 0) {
    createNoteButton.disabled = false;
    createNoteButton.textContent = "Create Note";
  } else {
    createNoteButton.disabled = true;
    createNoteButton.textContent = "Must hold TNT to post";
  }
}

async function loadABI(filename) {
  try {
    const response = await fetch(`./abis/${filename}`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`Error loading ABI: ${filename}`, error);
  }
}

async function checkNetwork() {
  const chainId = await ethereum.request({ method: "eth_chainId" });
  if (chainId !== "0xaa36a7") {
    showError(
      "Please connect to the Sepolia test network to interact with this dApp."
    );
  } else {
    return true;
  }
}

function showError(message) {
  document.getElementById("error-message").textContent = message;
  document.getElementById("no-metamask").style.display = "block";
}

function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Initialize web3 and app
initWeb3();
