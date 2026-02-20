// Variables for simulation control
let isSimulating = false;
let isPaused = false;
let simulationInterval = null;
let currentWaypointIndex = 0;
let simulatedRobot = null;
let progressValue = 0;
let progressStep = 0;
let currentRobotAngle = 0;
let lastUpdateTime = 0;
// Add turning state tracking
let isTurning = false;
let targetPathAngle = 0;

// Function to open the simulation panel
function openSimulation() {
    if (path.length < 2) {
        showToast("Need at least 2 waypoints to simulate");
        return;
    }
    
    document.getElementById('simulation-panel').style.display = 'block';
    
    // Set up progress slider event listeners
    const progressSlider = document.getElementById('simulation-progress');
    progressSlider.addEventListener('input', handleProgressChange);
    progressSlider.addEventListener('change', handleProgressChange);
    
    resetSimulation();
    calculateTotalTime(); // Calculate and display the total time
}

// Function to close the simulation panel
function closeSimulation() {
    document.getElementById('simulation-panel').style.display = 'none';
    stopSimulation();
}

// Calculate and display total time to complete the path
function calculateTotalTime() {
    // Check if the elements exist before trying to update them
    const timeDisplay = document.getElementById('path-total-time');
    const distanceDisplay = document.getElementById('path-total-distance');
    
    if (!timeDisplay || !distanceDisplay) {
        // If the elements don't exist, don't try to update them
        return;
    }
    
    if (path.length < 2) {
        timeDisplay.textContent = "--";
        distanceDisplay.textContent = "--";
        return;
    }
    
    // Get speeds
    const movementSpeed = parseFloat(document.getElementById('movement-speed').value); // in/s
    const turningSpeed = parseFloat(document.getElementById('turning-speed').value); // deg/s
    
    let totalTime = 0;
    let totalDistance = 0;
    let currentAngle = path[0].angle;
    
    // Calculate time for each segment
    for (let i = 1; i < path.length; i++) {
        const prevPoint = path[i-1];
        const point = path[i];
        
        // Calculate distance between points in pixels
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const distancePixels = Math.sqrt(dx*dx + dy*dy);
        
        // Convert to inches
        const distanceInches = distancePixels / canvasSize * conversionFactor;
        
        // Add to total distance
        totalDistance += distanceInches;
        
        // Calculate movement time
        const moveTime = distanceInches / movementSpeed;
        
        // Calculate angle for turning
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let angleDiff = ((targetAngle - currentAngle + 540) % 360) - 180;
        angleDiff = Math.abs(angleDiff);
        
        // Calculate turning time
        const turnTime = angleDiff / turningSpeed;
        
        // Add to total
        totalTime += moveTime + turnTime;
        
        // Update current angle
        currentAngle = targetAngle;
    }
    
    // Format time nicely
    if (totalTime < 60) {
        // Less than a minute, show seconds
        timeDisplay.textContent = `${totalTime.toFixed(1)} seconds`;
    } else {
        // Show minutes and seconds
        const minutes = Math.floor(totalTime / 60);
        const seconds = Math.round((totalTime % 60) * 10) / 10;
        timeDisplay.textContent = `${minutes}m ${seconds.toFixed(1)}s`;
    }
    
    // Format distance in inches only
    distanceDisplay.textContent = `${totalDistance.toFixed(1)} inches`;
}

// Start the simulation
function playSimulation() {
    if (isSimulating && isPaused) {
        // Resume from pause
        isPaused = false;
        document.getElementById('simulation-status').textContent = "Simulating...";
        startInterval();
        return;
    }
    
    if (isSimulating) return; // Already running
    
    isSimulating = true;
    isPaused = false;
    
    // Reset simulation state
    currentWaypointIndex = 0;
    progressValue = 0;
    lastUpdateTime = Date.now();
    isTurning = true; // Start with turning phase
    
    // Get current and next waypoint to calculate initial target angle
    if (path.length >= 2) {
        const dx = path[1].x - path[0].x;
        const dy = path[1].y - path[0].y;
        targetPathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
    
    // Get movement speed
    const movementSpeed = parseFloat(document.getElementById('movement-speed').value);
    
    // Fix the calculation of movement speed:
    // Convert inches per second to pixels per millisecond with proper scaling
    // The canvas size in pixels divided by conversion factor gives pixels per inch
    
    const inchesToPixels = canvasSize / conversionFactor;
    
    // Calculate how much to move each step (pixels per ms)
    // We multiply by delta time in the update function
    progressStep = movementSpeed * inchesToPixels / 1000; // Adjusted for reasonable visualization
    
    document.getElementById('simulation-status').textContent = "Simulating...";
    
    // Initialize robot position and angle
    if (path.length > 0) {
        const startWaypoint = path[0];
        
        // Calculate initial angle to face toward the next waypoint (index 1)
        if (path.length >= 2) {
            const nextWaypoint = path[1];
            const dx = nextWaypoint.x - startWaypoint.x;
            const dy = nextWaypoint.y - startWaypoint.y;
            currentRobotAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        } else {
            // If there's only one waypoint, use its angle
            currentRobotAngle = startWaypoint.angle;
        }
        
        simulatedRobot = {
            x: startWaypoint.x + gridSize/2,
            y: startWaypoint.y + gridSize/2,
            angle: currentRobotAngle
        };
    }
    
    // Update progress display
    updateProgressUI(0);
    
    // Start interval for updates
    startInterval();
}

// Start update interval
function startInterval() {
    if (simulationInterval) clearInterval(simulationInterval);
    simulationInterval = setInterval(updateSimulation, 1); // Update every 1ms for smoother animation
}

// Pause the simulation
function pauseSimulation() {
    if (!isSimulating || isPaused) return;
    
    isPaused = true;
    clearInterval(simulationInterval);
    document.getElementById('simulation-status').textContent = "Paused";
}

// Stop the simulation
function stopSimulation() {
    if (!isSimulating) return;
    
    isSimulating = false;
    isPaused = false;
    clearInterval(simulationInterval);
    simulationInterval = null;
    simulatedRobot = null;
    updateProgressUI(0);
    document.getElementById('simulation-status').textContent = "Ready to simulate";
    document.getElementById('current-waypoint').textContent = "No active waypoint";
}

// Update simulation state
function updateSimulation() {
    if (!isSimulating || isPaused || path.length < 2) return;
    
    // Calculate elapsed time since last update (in seconds)
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;
    
    // Get turning speed from input (deg/sec)
    const turningSpeed = parseFloat(document.getElementById('turning-speed').value);
    
    // Get current and next waypoint
    const currentWaypoint = path[currentWaypointIndex];
    const nextWaypoint = path[currentWaypointIndex + 1];
    
    if (!currentWaypoint || !nextWaypoint) {
        stopSimulation();
        return;
    }
    
    // Calculate straight-line distance between waypoints
    const dx = nextWaypoint.x - currentWaypoint.x;
    const dy = nextWaypoint.y - currentWaypoint.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // If we're turning, handle rotation first before moving
    if (isTurning) {
        // Calculate target angle based on path direction if not already set
        if (targetPathAngle === undefined) {
            targetPathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        }
        
        // Gradually update the robot angle based on turning speed
        const angleDiff = ((targetPathAngle - currentRobotAngle + 540) % 360) - 180; // Find shortest direction
        const maxAngleChange = turningSpeed * deltaTime; // Max angle change in this time
        
        // Apply angle change, limited by turning speed
        if (Math.abs(angleDiff) <= maxAngleChange) {
            // We've reached the target angle
            currentRobotAngle = targetPathAngle;
            isTurning = false; // Switch to movement phase
        } else {
            // Apply partial rotation in the appropriate direction
            currentRobotAngle += Math.sign(angleDiff) * maxAngleChange;
            currentRobotAngle = (currentRobotAngle + 360) % 360; // Normalize to 0-360
        }
        
        // Update robot with new angle but same position
        simulatedRobot = {
            x: currentWaypoint.x + gridSize/2,
            y: currentWaypoint.y + gridSize/2,
            angle: currentRobotAngle
        };
        
        return; // Skip position update until turning is complete
    }
    
    // Handle normal movement once turning is complete
    if (!isTurning) {
        // Update progress based on elapsed time (convert to milliseconds)
        progressValue += progressStep * (deltaTime * 1000);
        
        // Calculate how far along the segment we are (0 to 1)
        const segmentProgress = Math.min(progressValue / distance, 1);
        
        // If we completed this segment
        if (segmentProgress >= 1) {
            // Move to next segment
            currentWaypointIndex++;
            progressValue = 0;
            
            // Update waypoint display
            document.getElementById('current-waypoint').textContent = 
                `Current: Waypoint ${currentWaypointIndex + 1} → ${currentWaypointIndex + 2}`;
            
            // If we reached the end of the path
            if (currentWaypointIndex >= path.length - 1) {
                isSimulating = false;
                document.getElementById('simulation-status').textContent = "Simulation completed";
                clearInterval(simulationInterval);
                
                // Set robot to final position
                const finalWaypoint = path[path.length - 1];
                currentRobotAngle = finalWaypoint.angle;
                simulatedRobot = {
                    x: finalWaypoint.x + gridSize/2,
                    y: finalWaypoint.y + gridSize/2,
                    angle: currentRobotAngle
                };
                
                return;
            }
            
            // Start turning phase for next segment
            isTurning = true;
            
            // Calculate new target angle for next segment
            const nextDx = path[currentWaypointIndex + 1].x - path[currentWaypointIndex].x;
            const nextDy = path[currentWaypointIndex + 1].y - path[currentWaypointIndex].y;
            targetPathAngle = Math.atan2(nextDy, nextDx) * (180 / Math.PI);
            
            // Update robot position to new waypoint (but don't start moving yet)
            simulatedRobot = {
                x: path[currentWaypointIndex].x + gridSize/2,
                y: path[currentWaypointIndex].y + gridSize/2,
                angle: currentRobotAngle
            };
        } else {
            // Linear interpolation between waypoints for position
            simulatedRobot = {
                x: currentWaypoint.x + dx * segmentProgress + gridSize/2,
                y: currentWaypoint.y + dy * segmentProgress + gridSize/2,
                angle: currentRobotAngle
            };
            
            // Update progress UI
            const overallProgress = (currentWaypointIndex + segmentProgress) / (path.length - 1);
            updateProgressUI(overallProgress);
        }
    }
}

// Handle manual progress change from slider
function handleProgressChange() {
    if (path.length < 2) return;
    
    // If simulation is running, pause it first
    if (isSimulating && !isPaused) {
        pauseSimulation();
    }
    
    const slider = document.getElementById('simulation-progress');
    const newProgress = slider.value / 100;
    
    // Find the appropriate waypoint for this progress
    const targetIndex = Math.floor(newProgress * (path.length - 1));
    const waypointProgress = (newProgress * (path.length - 1)) % 1;
    
    // Update current waypoint index
    currentWaypointIndex = targetIndex;
    
    // Ensure we're within bounds
    if (targetIndex < path.length - 1) {
        const currentWaypoint = path[targetIndex];
        const nextWaypoint = path[targetIndex + 1];
        
        // Linear interpolation between waypoints
        const dx = nextWaypoint.x - currentWaypoint.x;
        const dy = nextWaypoint.y - currentWaypoint.y;
        
        // Calculate angle based on path direction
        const pathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // When dragging the slider, just set the angle directly
        currentRobotAngle = pathAngle;
        
        // When manually setting position, turn off the turning phase
        isTurning = false;
        
        // Update robot position
        simulatedRobot = {
            x: currentWaypoint.x + dx * waypointProgress + gridSize/2,
            y: currentWaypoint.y + dy * waypointProgress + gridSize/2,
            angle: currentRobotAngle
        };
        
        // Set progress value for when simulation resumes
        progressValue = waypointProgress * Math.sqrt(dx*dx + dy*dy);
        
        // Update waypoint display
        document.getElementById('current-waypoint').textContent = 
            `Current: Waypoint ${targetIndex + 1} → ${targetIndex + 2}`;
    } else if (path.length > 0) {
        // If at the end, show the final waypoint
        const finalWaypoint = path[path.length - 1];
        currentRobotAngle = finalWaypoint.angle;
        simulatedRobot = {
            x: finalWaypoint.x + gridSize/2,
            y: finalWaypoint.y + gridSize/2,
            angle: currentRobotAngle
        };
        
        document.getElementById('current-waypoint').textContent = 
            `Current: Final Waypoint ${path.length}`;
    }
    
    // Update progress UI text to match slider
    document.getElementById('progress-value').textContent = `${Math.round(newProgress * 100)}%`;
}

// Update the progress UI elements
function updateProgressUI(progress) {
    document.getElementById('simulation-progress').value = progress * 100;
    document.getElementById('progress-value').textContent = `${Math.round(progress * 100)}%`;
}

// Reset the simulation to the starting state
function resetSimulation() {
    stopSimulation();
    currentRobotAngle = path.length > 0 ? path[0].angle : 0;
    isTurning = true; // Reset to turning phase
    targetPathAngle = undefined;
    document.getElementById('simulation-status').textContent = "Ready to simulate";
    document.getElementById('current-waypoint').textContent = "No active waypoint";
    updateProgressUI(0);
}

// Calibration functions
function openCalibrationModal(event) {
    event.preventDefault(); // Prevent default right-click menu
    document.getElementById('calibration-modal').style.display = 'block';
}

function closeCalibrationModal() {
    document.getElementById('calibration-modal').style.display = 'none';
}

function applyCalibration() {
    // Get the time values entered by the user
    const timeToTravel = parseFloat(document.getElementById('time-to-travel').value);
    const timeToTurn = parseFloat(document.getElementById('time-to-turn').value);
    
    // Validate inputs
    if (isNaN(timeToTravel) || isNaN(timeToTurn) || timeToTravel <= 0 || timeToTurn <= 0) {
        alert("Please enter valid positive numbers for both time values.");
        return;
    }
    
    // Calculate speeds
    const movementSpeed = 24.0 / timeToTravel; // 24 inches divided by time = inches per second
    const turningSpeed = 90.0 / timeToTurn; // 90 degrees divided by time = degrees per second
    
    // Round to 1 decimal place for display
    const movementSpeedRounded = Math.round(movementSpeed * 10) / 10;
    const turningSpeedRounded = Math.round(turningSpeed * 10) / 10;
    
    // Update the simulation settings
    document.getElementById('movement-speed').value = movementSpeedRounded;
    document.getElementById('turning-speed').value = turningSpeedRounded;
    
    // Display the results
    document.getElementById('calibration-result').innerHTML = `
        <p>Calibration applied successfully:</p>
        <ul>
            <li>Movement Speed: ${movementSpeedRounded} in/s</li>
            <li>Turning Speed: ${turningSpeedRounded} deg/s</li>
        </ul>
    `;
    
    // Show a toast notification
    showToast("Simulation speeds calibrated successfully!");
    
    // Calculate the new total time
    calculateTotalTime();
}

// Add listeners to update the time when speeds change
document.addEventListener('DOMContentLoaded', function() {
    const movementSpeedInput = document.getElementById('movement-speed');
    const turningSpeedInput = document.getElementById('turning-speed');
    
    if (movementSpeedInput) {
        movementSpeedInput.addEventListener('input', calculateTotalTime);
        movementSpeedInput.addEventListener('change', calculateTotalTime);
    }
    
    if (turningSpeedInput) {
        turningSpeedInput.addEventListener('input', calculateTotalTime);
        turningSpeedInput.addEventListener('change', calculateTotalTime);
    }
});
