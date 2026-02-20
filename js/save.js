isModalOpen = false; // Track if the modal is open

let saveSlots = JSON.parse(localStorage.getItem('saveSlots')) || []; // Load from local storage or initialize as an empty array
let loadedSlotIndex = null; // Track the currently loaded slot

// Automatically load the last modified save slot on startup
function loadLastModifiedSlot() {
    if (saveSlots.length > 0) {
        // Find the slot that was last modified
        let lastModifiedIndex = saveSlots.reduce((latestIndex, slot, index) => {
            return new Date(slot.modified) > new Date(saveSlots[latestIndex].modified) ? index : latestIndex;
        }, 0);

        loadSaveSlot(lastModifiedIndex);
		showToast("Last used save slot loaded successfully!");
    }
}

function openSaveOptionsModal() {
    isModalOpen = true;
    document.getElementById('save-options-modal').style.display = 'block';
    renderSaveSlots();
}

function closeSaveOptionsModal() {
    isModalOpen = false;
    document.getElementById('save-options-modal').style.display = 'none';
}

function exportPath() {
    const normalizedWaypoints = path.map(wp => ({
        x: wp.x / canvasSize, // Convert pixel x to normalized value (0.0 to 1.0)
        y: wp.y / canvasSize, // Convert pixel y to normalized value (0.0 to 1.0)
        angle: wp.angle,
        includeTurn: wp.includeTurn,
        forwards: wp.forwards,
        minSpeed: wp.minSpeed,
        maxSpeed: wp.maxSpeed,
        timeout: wp.timeout
    }));

    const pathData = JSON.stringify(normalizedWaypoints, null, 2); // Convert path array to a JSON string
    const blob = new Blob([pathData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'path.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importPath() {
    try {
        // Check if the Clipboard API is available
        if (!navigator.clipboard) {
            throw new Error("Clipboard API not available");
        }

        // Read from clipboard
        const clipboardText = navigator.clipboard.readText();
        clipboardText.then((text) => {
            try {
                const importedPath = JSON.parse(text); // Parse the JSON file
                if (Array.isArray(importedPath)) {
                    path = importedPath.map(wp => ({  // Replace the current path with the imported one
                        x: wp.x * canvasSize, // Convert normalized x to canvas pixel value
                        y: wp.y * canvasSize, // Convert normalized y to canvas pixel value
                        angle: wp.angle,
                        includeTurn: wp.includeTurn,
                        forwards: wp.forwards,
                        minSpeed: wp.minSpeed,
                        maxSpeed: wp.maxSpeed,
                        timeout: wp.timeout
                    }));
                    generateCode(); // Render the path with the new coordinates
                    undoStack = []; // Clear the undo stack
                } else {
                    alert('Invalid path format');
                }
            } catch (error) {
                alert('Error parsing the file');
                console.log(error);
            }
        });
    } catch (error) {
        console.error("Error reading clipboard:", error);
        // If there's an error reading the clipboard, fall back to file dialog
        openFileDialog();
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedPath = JSON.parse(e.target.result); // Parse the JSON file
                if (Array.isArray(importedPath)) {
                    path = importedPath.map(wp => ({  // Replace the current path with the imported one
                        x: wp.x * canvasSize, // Convert normalized x to canvas pixel value
                        y: wp.y * canvasSize, // Convert normalized y to canvas pixel value
                        angle: wp.angle,
                        includeTurn: wp.includeTurn,
                        forwards: wp.forwards,
                        minSpeed: wp.minSpeed,
                        maxSpeed: wp.maxSpeed,
                        timeout: wp.timeout
                    }));
                    generateCode(); // Render the path with the new coordinates
                    undoStack = []; // Clear the undo stack
                } else {
                    alert('Invalid path format');
                }
            } catch (error) {
                alert('Error parsing the file');
                console.log(error);
            }
        };
        reader.readAsText(file);
    }
}

function copyPathString() {
    //const pathData = JSON.stringify(path, null, 2); // Convert path array to a JSON string
    pathData = saveNormalizedWaypoints();
    const textArea = document.createElement('textarea');
    textArea.value = pathData;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    // Show a toast notification or alert
    showToast('Path string copied to clipboard!');
}

// Function to save the slots to local storage
function saveSlotsToLocalStorage() {
    localStorage.setItem('saveSlots', JSON.stringify(saveSlots));
}

// Function to render the save slots list
function renderSaveSlots() {
    const container = document.getElementById('save-slots-container');
    container.innerHTML = ''; // Clear the container

    saveSlots.forEach((slot, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('save-slot');

        const slotInfo = document.createElement('div');
        slotInfo.classList.add('slot-info');
        slotInfo.innerHTML = `
            <h4>${slot.name}</h4>
            <p>${slot.waypoints.length} waypoints, last modified: ${slot.modified}</p>
        `;

        const slotButtons = document.createElement('div');
        slotButtons.classList.add('slot-buttons');

        const renameButton = document.createElement('button');
        renameButton.classList.add('rename-button');
        renameButton.textContent = 'Rename';
        renameButton.onclick = () => renameSaveSlot(index);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteSaveSlot(index);

        const loadButton = document.createElement('button');
        loadButton.textContent = loadedSlotIndex === index ? 'Loaded' : 'Load';
        loadButton.classList.add(loadedSlotIndex === index ? 'loaded-button' : 'load-button');
        loadButton.disabled = loadedSlotIndex === index;
        loadButton.onclick = () => loadSaveSlot(index);

        slotButtons.appendChild(renameButton);
        slotButtons.appendChild(deleteButton);
        slotButtons.appendChild(loadButton);

        slotDiv.appendChild(slotInfo);
        slotDiv.appendChild(slotButtons);

        container.appendChild(slotDiv);
    });
}

// Function to create a new save slot
function createNewSaveSlot() {
    // Clear the path array before anything else is done
    path = [];

    const name = prompt('Enter a name for this save slot:');
    if (name) {
        const newSlot = {
            name: name,
            waypoints: [...path], // Clone the current (cleared) path
            modified: new Date().toLocaleString()
        };
        saveSlots.push(newSlot);
        saveSlotsToLocalStorage(); // Save to local storage
        renderSaveSlots();
    }
}

// Function to rename a save slot
function renameSaveSlot(index) {
    const newName = prompt('Enter a new name for this save slot:', saveSlots[index].name);
    if (newName) {
        saveSlots[index].name = newName;
        saveSlots[index].modified = new Date().toLocaleString(); // Update the modified date
        saveSlotsToLocalStorage(); // Save to local storage
        renderSaveSlots();
    }
}

// Function to delete a save slot
function deleteSaveSlot(index) {
    if (confirm('Are you sure you want to delete this save slot?')) {
        saveSlots.splice(index, 1);
        if (loadedSlotIndex === index) loadedSlotIndex = null; // Clear loaded slot if it was deleted
        saveSlotsToLocalStorage(); // Save to local storage
        renderSaveSlots();
    }
}

// Function to load a save slot
function loadSaveSlot(index) {
    path = saveSlots[index].waypoints.length > 0 ? [...saveSlots[index].waypoints] : []; // Load the waypoints or clear path if empty
    loadedSlotIndex = index; // Mark this slot as loaded
    saveSlotsToLocalStorage(); // Save to local storage
    renderSaveSlots(); // Re-render to update the loaded status

	showToast("Save slot loaded successfully!");
}

// Automatically load the last modified save slot when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadLastModifiedSlot();
});

function saveNormalizedWaypoints() {
    const normalizedWaypoints = path.map(wp => ({
        x: wp.x / canvasSize, // Convert pixel x to normalized value (0.0 to 1.0)
        y: wp.y / canvasSize, // Convert pixel y to normalized value (0.0 to 1.0)
        angle: wp.angle,
        includeTurn: wp.includeTurn,
        forwards: wp.forwards,
        minSpeed: wp.minSpeed,
        maxSpeed: wp.maxSpeed,
        timeout: wp.timeout
    }));

    const pathData = JSON.stringify(normalizedWaypoints, null, 2); // Convert path array to a JSON string
    return pathData;
}
