(function createSnapshotPanel(thisObj) {
    // Create panel
    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Viewport Snapshot", undefined);
    panel.orientation = "column";
    panel.alignChildren = "fill";
    panel.spacing = 10;
    panel.margins = 16;
    
    // Preview Group
    var previewGroup = panel.add("group");
    previewGroup.orientation = "column";
    previewGroup.alignChildren = "center";
    
    // Status text
    var statusText = previewGroup.add("statictext", undefined, "No snapshot taken");
    statusText.characters = 20;

    // Aspect ratio text
    var aspectRatioText = previewGroup.add("statictext", undefined, "Aspect Ratio: N/A");
    aspectRatioText.characters = 25;
    
    // Preview Panel
    var previewPanel = previewGroup.add("panel", undefined, "Preview");
    previewPanel.size = [400, 300]; // Adjusted width and height for better display
    var previewImage = previewPanel.add("image", [10, 10, 390, 290], undefined); // Adjust size dynamically
    previewImage.visible = false;
    
    // Buttons Group
    var btnGroup = panel.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = "center";
    btnGroup.spacing = 5;
    
    var takeSnapshotBtn = btnGroup.add("button", undefined, "Take Snapshot");
    var saveBtn = btnGroup.add("button", undefined, "Save");
    saveBtn.enabled = false;
    var settingsBtn = btnGroup.add("button", undefined, "Settings");
    
    // Settings Variables
    var saveFormat = "PNG";
    var snapshotFile = null;
    
    // Settings Dialog
    function showSettings() {
        var settingsDialog = new Window("dialog", "Settings");
        settingsDialog.orientation = "column";
        settingsDialog.alignChildren = "fill";
        
        var formatGroup = settingsDialog.add("panel", undefined, "Save Format");
        formatGroup.orientation = "column";
        formatGroup.alignChildren = "left";
        formatGroup.margins = 16;
        
        var pngOption = formatGroup.add("radiobutton", undefined, "PNG");
        var jpegOption = formatGroup.add("radiobutton", undefined, "JPEG");
        
        if (saveFormat === "PNG") pngOption.value = true;
        else jpegOption.value = true;
        
        var btnGroup = settingsDialog.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = "center";
        var okBtn = btnGroup.add("button", undefined, "OK");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");
        
        okBtn.onClick = function() {
            saveFormat = pngOption.value ? "PNG" : "JPEG";
            settingsDialog.close();
        }
        
        cancelBtn.onClick = function() {
            settingsDialog.close();
        }
        
        settingsDialog.show();
    }
    
    // Take Snapshot Function
    function takeSnapshot() {
        try {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            statusText.text = "Taking snapshot...";
            aspectRatioText.text = "Aspect Ratio: " + (comp.width / comp.height).toFixed(2) + " (" + comp.width + " x " + comp.height + ")";
            
            // Create temp folder if it doesn't exist
            var tempFolder = new Folder(Folder.temp.fsName + "/AE_Snapshots");
            if (!tempFolder.exists) {
                tempFolder.create();
            }

            // Generate temp file path
            var tempFile = new File(tempFolder.fsName + "/temp_snapshot." + saveFormat.toLowerCase());
            
            // Save current frame
            if (saveFormat === "PNG") {
                comp.saveFrameToPng(comp.time, tempFile);
            } else if (saveFormat === "JPEG") {
                comp.saveFrameToJpeg(comp.time, tempFile, 8); // 8 is quality for JPEG
            }
            
            // Wait a brief moment to ensure file is written
            $.sleep(100);
            
            // Update preview
            if (tempFile.exists) {
                snapshotFile = tempFile;
                var scaleFactor = Math.min(390 / comp.width, 290 / comp.height);
                previewImage.image = tempFile;
                previewImage.size = [comp.width * scaleFactor, comp.height * scaleFactor]; // Scale preview proportionally
                previewImage.visible = true;
                statusText.text = "Snapshot captured!";
                saveBtn.enabled = true;
                
                // Force layout update
                if (panel.layout) {
                    panel.layout.layout(true);
                }
            } else {
                statusText.text = "Failed to capture snapshot.";
            }
        } catch (e) {
            alert("Error: " + e.toString());
        }
    }

    // Save Function
    saveBtn.onClick = function() {
        if (snapshotFile && snapshotFile.exists) {
            var saveDialog = File.saveDialog("Save Snapshot As", (saveFormat === "PNG") ? "*.png" : "*.jpg");
            if (saveDialog) {
                if (saveFormat === "PNG" && !/\.png$/i.test(saveDialog.fsName)) {
                    saveDialog = new File(saveDialog.fsName + ".png");
                } else if (saveFormat === "JPEG" && !/\.jpg$/i.test(saveDialog.fsName)) {
                    saveDialog = new File(saveDialog.fsName + ".jpg");
                }
                
                snapshotFile.copy(saveDialog.fsName);
                alert("Snapshot saved successfully.");
            }
        } else {
            alert("No snapshot to save.");
        }
    };
    
    // Button Actions
    takeSnapshotBtn.onClick = takeSnapshot;
    settingsBtn.onClick = showSettings;
    
    if (panel instanceof Window) {
        panel.center();
        panel.show();
    } else {
        panel.layout.layout(true);
    }
})(this);