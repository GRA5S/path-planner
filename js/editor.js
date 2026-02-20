function openWaypointEditor(index) {
    selectedWaypointIndex = index;
    let waypoint = path[index];

    // Update the editor title with the waypoint number
    document.getElementById('editor-title').textContent = `Edit Waypoint ${index + 1}`;

    // Populate the form with the current waypoint properties
    document.getElementById('angle-input').value = waypoint.angle;
    // document.getElementById('include-turn-input').value = waypoint.includeTurn;
    document.getElementById('forwards-input').value = waypoint.forwards;
	// document.getElementById('angular-direction-input').value = waypoint.angularDirection || "auto";
    // document.getElementById('min-speed-input').value = waypoint.minSpeed;
    // document.getElementById('max-speed-input').value = waypoint.maxSpeed;
    document.getElementById('speed-input').value = waypoint.speed || 1;
    document.getElementById('timeout-input').value = waypoint.timeout;

    // Populate action checkboxes
    const actions = waypoint.actions || {};
    document.getElementById('action-hoard').checked = actions.hoard || false;
    document.getElementById('action-outtake').checked = actions.outtake || false;
    document.getElementById('action-matchload').checked = actions.matchload || false;
    document.getElementById('action-midgoal').checked = actions.midgoal || false;
    document.getElementById('action-midgoal-skills').checked = actions.midgoalSkills || false;
    document.getElementById('action-score').checked = actions.score || false;
    document.getElementById('action-wing').checked = actions.wing || false;
    document.getElementById('action-intake-stop').checked = actions.intakeStop || false;

    // Show the side panel
    document.getElementById('waypoint-editor').style.display = 'block';
}

function saveWaypointChanges() {
    if (selectedWaypointIndex !== -1) {
        let waypoint = path[selectedWaypointIndex];

        // Update waypoint properties with form values
        waypoint.angle = parseInt(document.getElementById('angle-input').value);
        // waypoint.includeTurn = document.getElementById('include-turn-input').value === 'true';
        waypoint.forwards = document.getElementById('forwards-input').value === 'true';
		// waypoint.angularDirection = document.getElementById('angular-direction-input').value;
        // waypoint.minSpeed = parseInt(document.getElementById('min-speed-input').value);
        // waypoint.maxSpeed = parseInt(document.getElementById('max-speed-input').value);
        waypoint.speed = parseFloat(document.getElementById('speed-input').value);
        waypoint.timeout = parseInt(document.getElementById('timeout-input').value);

        // Update action checkboxes
        waypoint.actions = {
            hoard: document.getElementById('action-hoard').checked,
            outtake: document.getElementById('action-outtake').checked,
            matchload: document.getElementById('action-matchload').checked,
            midgoal: document.getElementById('action-midgoal').checked,
            midgoalSkills: document.getElementById('action-midgoal-skills').checked,
            score: document.getElementById('action-score').checked,
            wing: document.getElementById('action-wing').checked,
            intakeStop: document.getElementById('action-intake-stop').checked
        };

        // Update and redraw the path
        generateCode();
        closeWaypointEditor();
    }
}

function closeWaypointEditor() {
    document.getElementById('waypoint-editor').style.display = 'none';
    selectedWaypointIndex = -1;
}
