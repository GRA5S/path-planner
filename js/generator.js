// Generate the autonomous path code and display it in the output box
function generateCode() {
    if (path.length === 0) {
        document.getElementById('code-output').textContent = "// No waypoints set.";
        return;
    }
    
    if (loadedSlotIndex !== null) {
        saveSlots[loadedSlotIndex].waypoints = [...path]; // Overwrite waypoints
        saveSlots[loadedSlotIndex].modified = new Date().toLocaleString(); // Update modified date
        saveSlotsToLocalStorage(); // Save to local storage
        renderSaveSlots(); // Re-render save slots
    }

    const formatSelect = document.getElementById('format-select');
    const selectedConfig = formatSelect.value;

    if (selectedConfig === 'libks-mtpoint') {
        let firstWaypoint = path[0];
        // convert to trig bearing
        let originAngle = ((360 - firstWaypoint.angle) + 90) % 360;

        let code = "// libKW MTPoint v0.1\n";
        code += `// Starting point: (${((firstWaypoint.x - (canvasSize / 2)) / canvasSize * 144).toFixed(2)} in, ${((firstWaypoint.y  - (canvasSize / 2)) / canvasSize * -144).toFixed(2)} in)\n`;

        for (let i = 0; i < path.length; i++) {
            let waypoint = path[i];
            let translatedX = (waypoint.x - firstWaypoint.x) / canvasSize * conversionFactor;
            let translatedY = (waypoint.y - firstWaypoint.y) / canvasSize * conversionFactor;

            // Rotate point (x and y flip here for complicated reasons)
            const rotatedX = (translatedX * Math.sin(degreesToRadians(originAngle)) + 
                            translatedY * Math.cos(degreesToRadians(originAngle)));
            const rotatedY = (translatedX * Math.cos(degreesToRadians(originAngle)) - 
                             translatedY * Math.sin(degreesToRadians(originAngle)));

            code += `chassis.moveToPoint(${rotatedX.toFixed(2)}, ${rotatedY.toFixed(2)}, ${path[i].timeout}, {.forwards = ${path[i].forwards}, .maxSpeed = ${path[i].maxSpeed}, .minSpeed = ${path[i].minSpeed}}); // Point ${i + 1}\n`;

            if (waypoint.includeTurn === true) {
                // Convert angle to be relative to the path
                let relativeAngle = (waypoint.angle - firstWaypoint.angle) % 360;
                if (relativeAngle < 0) relativeAngle += 360;

                if (path[i].angularDirection === "auto") {
                    code += `chassis.turnToHeading(${relativeAngle}, ${path[i].timeout}); // Point ${i + 1}\n`;
                } else if (path[i].angularDirection === "clockwise" && i != 0) {
                    code += `chassis.turnToHeading(${relativeAngle}, ${path[i].timeout}, {.direction = AngularDirection::CW_CLOCKWISE}); // Point ${i + 1}\n`;
                } else if (path[i].angularDirection === "counter-clockwise" && i != 0) {
                    code += `chassis.turnToHeading(${relativeAngle}, ${path[i].timeout}, {.direction = AngularDirection::CCW_COUNTERCLOCKWISE}); // Point ${i + 1}\n`;
                }
            }

            document.getElementById('code-output').textContent = code;
        }
    }

    if (selectedConfig === 'libks-pid') {
        let firstWaypoint = path[0];
        // convert to trig bearing
        let originAngle = ((360 - firstWaypoint.angle) + 90) % 360;

        let prevX = 0;
        let prevY = 0;
        prevAngle = 0;

        let code = "// libKW PID\n";
        code += `// Starting point: (${((firstWaypoint.x - (canvasSize / 2)) / canvasSize * 144).toFixed(2)} in, ${((firstWaypoint.y  - (canvasSize / 2)) / canvasSize * -144).toFixed(2)} in)\n`;

        for (let i = 1; i < path.length; i++) {
            let waypoint = path[i];

            let translatedX = (waypoint.x - firstWaypoint.x) / canvasSize * conversionFactor;
            let translatedY = (waypoint.y - firstWaypoint.y) / canvasSize * conversionFactor;

            // Rotate point (x and y flip here for complicated reasons)
            const rotatedX = (translatedX * Math.sin(degreesToRadians(originAngle)) + 
                            translatedY * Math.cos(degreesToRadians(originAngle)));
            const rotatedY = (translatedX * Math.cos(degreesToRadians(originAngle)) - 
                            translatedY * Math.sin(degreesToRadians(originAngle)));

            let dx = rotatedX - prevX;
            let dy = rotatedY - prevY;

            let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            // let turnAngle = radianstoDegrees(Math.atan2(dy, dx)) - prevAngle;
            // let trigBearingAngle = ((360 - turnAngle) + 90) % 360

            if (i != 1) {
                code += `kw::turnToAngle( , ${path[i].timeout}); // Point ${i + 1}\n`;
            } else {
                turnAngle = 0;
            }
            code += `kw::driveTo(${distance.toFixed(2)}, ${path[i].timeout}); // Point ${i + 1}\n`;

            // console.log(`dx: ${dx}, dy: ${dy}, angle: ${trigBearingAngle}`);

            prevX = rotatedX;
            prevY = rotatedY;
            // prevAngle = trigBearingAngle;

            document.getElementById('code-output').textContent = code;
        }
    }

    // Update total time if simulation panel is visible
    if (document.getElementById('simulation-panel').style.display === 'block' && typeof calculateTotalTime === 'function') {
        calculateTotalTime();
    }

    //console.log(path);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radianstoDegrees(radians) {
    return radians * (180 / Math.PI);
}
