function openWaypointEditor(index) {
    selectedWaypointIndex = index;
    let waypoint = path[index];

    // Update the editor title with the waypoint number
    document.getElementById('editor-title').textContent = `Edit Waypoint ${index + 1}`;

    // Populate the form with the current waypoint properties
    document.getElementById('angle-input').value = waypoint.angle;
    document.getElementById('include-turn-input').value = waypoint.includeTurn;
    document.getElementById('forwards-input').value = waypoint.forwards;
	document.getElementById('angular-direction-input').value = waypoint.angularDirection || "auto";
    document.getElementById('min-speed-input').value = waypoint.minSpeed;
    document.getElementById('max-speed-input').value = waypoint.maxSpeed;
    document.getElementById('timeout-input').value = waypoint.timeout;

    // Show the side panel
    document.getElementById('waypoint-editor').style.display = 'block';
}

function saveWaypointChanges() {
    if (selectedWaypointIndex !== -1) {
        let waypoint = path[selectedWaypointIndex];

        // Update waypoint properties with form values
        waypoint.angle = parseInt(document.getElementById('angle-input').value);
        waypoint.includeTurn = document.getElementById('include-turn-input').value === 'true';
        waypoint.forwards = document.getElementById('forwards-input').value === 'true';
		waypoint.angularDirection = document.getElementById('angular-direction-input').value;
        waypoint.minSpeed = parseInt(document.getElementById('min-speed-input').value);
        waypoint.maxSpeed = parseInt(document.getElementById('max-speed-input').value);
        waypoint.timeout = parseInt(document.getElementById('timeout-input').value);

        // Update and redraw the path
        generateCode();
        closeWaypointEditor();
    }
}

function closeWaypointEditor() {
    document.getElementById('waypoint-editor').style.display = 'none';
	saveWaypointChanges();
}
