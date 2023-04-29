const tokenAddress = "0x476011Dc7fa97C9C44B64C2bf2c75C0e5A9591f5";
const faucetAddress = "0x1E6EE46a4D508B4f4BA5A4B1A1088F28B6fBca1c";
const defaultChainId = "0xaa36a7"; // Sepolia testnet

let web3, accounts, tokenContract, faucetContract;

async function initWeb3() {
  if (typeof window.ethereum !== "undefined") {
    web3 = new Web3(window.ethereum);
    accounts = await web3.eth.getAccounts();

    // Load ABIs
    const tokenABI = await loadABI("TinyNotesTokenABI.json");
    const faucetABI = await loadABI("TinyNotesTokenFaucetABI.json");

    // Initialize contracts
    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    faucetContract = new web3.eth.Contract(faucetABI, faucetAddress);

    // Event listeners
    document
      .getElementById("request-tokens")
      .addEventListener("click", requestTokens);
    document
      .getElementById("create-note")
      .addEventListener("click", createNote);

    // Event listener for account and network changes
    window.ethereum.on("accountsChanged", () => { location.reload() });
    window.ethereum.on("chainChanged", () => { location.reload() });

    if (!isValidEthereumAddress(accounts[0])) {
      showError("Connecting to MetaMask. Please unlock your wallet.");
      document.getElementById("address").textContent =
        "Connecting to MetaMask...";
      document.getElementById("create-note").textContent =
        "Must hold TNT to post";
      window.ethereum.request({ method: "eth_requestAccounts" });
      return;
    } else {
      document.getElementById(
        "address"
      ).textContent = `Connected: ${truncateAddress(accounts[0])}`;
    }

    if (checkNetwork()) {
      displayBalance();
      loadNotes();
    }
  } else {
    showError("Please install MetaMask to use this dApp!");
  }
}

async function requestTokens() {
  const requestButton = document.getElementById("request-tokens");
  try {
    requestButton.disabled = true;
    requestButton.textContent = "Requesting...";

    await faucetContract.methods.requestTokens().send({ from: accounts[0] });
    alert("Tokens successfully requested!");

    requestButton.textContent = "TNT Faucet";
    requestButton.disabled = false;

    await displayBalance();
  } catch (error) {
    console.error(error);
    alert("Error requesting tokens. Check the console for more information.");
  }
}

async function createNote() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const createButton = document.getElementById("create-note");
  const noteForm = document.getElementById("note-form");

  try {
    createButton.disabled = true;
    createButton.textContent = "Posting...";

    await tokenContract.methods
      .createNote(title, content)
      .send({ from: accounts[0] });
    alert("Note successfully created!");

    noteForm.reset();
    createButton.textContent = "Create Note";
    createButton.disabled = false;

    await loadNotes();
  } catch (error) {
    console.error(error);
    alert("Error creating note. Check the console for more information.");
  }
}

async function loadNotes() {
  const notesDiv = document.getElementById("notes");
  notesDiv.innerHTML = "";

  const totalNotes = await tokenContract.methods.noteIds().call();

  for (let noteId = totalNotes; noteId >= 0; noteId--) {
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

async function displayBalance() {
  const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
  const formattedBalance = web3.utils.fromWei(balance, "ether");
  document.getElementById("tnt-balance").textContent = formattedBalance;
  toggleCreateNoteButton(formattedBalance);
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
  if (chainId !== defaultChainId) {
    showError(
      "Please connect to the Sepolia test network to interact with this dApp."
    );
    document.getElementById("address").textContent =
      "Please connect to MetaMask...";
  } else {
    return true;
  }
}

function toggleCreateNoteButton(balance) {
  const createNoteButton = document.getElementById("create-note");
  if (balance > 0) {
    createNoteButton.disabled = false;
    createNoteButton.textContent = "Create Note";
  } else {
    createNoteButton.disabled = true;
    createNoteButton.textContent = "Must hold TNT to post";
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

function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function showError(message) {
  document.getElementById("error-message").textContent = message;
  document.getElementById("no-metamask").style.display = "block";
}

// Initialize
initWeb3();