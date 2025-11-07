document.addEventListener("DOMContentLoaded", function () {
    require([
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/FeatureLayer",
        "esri/Ground",
        "esri/layers/ElevationLayer",
        "esri/widgets/Home",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Expand",
        "esri/widgets/Legend",
        "esri/smartMapping/statistics/summaryStatistics"
    ], function (Map, SceneView, FeatureLayer, Ground, ElevationLayer, Home, BasemapGallery, Expand, Legend, summaryStatistics) {

        // ZMÌNA: Odebráno <hr> z konce øetìzce
        const commonColorUI = `<h2>Color Ramp</h2><div class="color-pickers-wrapper"><input type="color" id="startColorPicker" value="#4575b4"><input type="color" id="middleColorPicker" value="#ffffbf"><input type="color" id="endColorPicker" value="#d73027"></div><div id="colorRampPreview"></div>`;
        
        const visualizationMethods = {
            horizontal: {
                title: "Horizontal Planes",
                compatibleGeometry: ["polygon"], 
                // ZMÌNA: Odebráno <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Height (Elevation)</h2><label for="planeHeightInput">Height Above Ground (m):</label><input type="number" id="planeHeightInput" value="300000" step="10000">`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "polygon-3d", symbolLayers: [{ type: "fill", material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            point_cloud: {
                title: "Point Cloud",
                compatibleGeometry: ["point"], 
                // ZMÌNA: Odebrány 3x <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Point Size</h2><label for="sizeInput">Size (m):</label><input type="number" id="sizeInput" value="40000" min="0" step="1000"><h2>Height (Elevation)</h2><label for="minZOffsetInput">Min Z Offset (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Max Z Offset (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Shape</h2><select id="shapeSelect"><option value="sphere">Sphere</option><option value="cube">Cube</option><option value="diamond">Diamond</option></select>`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: uiValues.shape }, width: uiValues.size, depth: uiValues.size, height: uiValues.size, material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => {
                    layer.opacity = uiValues.opacity;
                    const { min, max } = uiValues.stats;
                    layer.elevationInfo = { mode: "relative-to-ground", featureExpressionInfo: { expression: `var t = ($feature.${uiValues.field} - ${min}) / (${max} - ${min}); return ${uiValues.minZ} + t*(${uiValues.maxZ} - ${uiValues.minZ});` } };
                }
            },
            vertical: {
                title: "Vertical Planes",
                compatibleGeometry: ["polyline"], 
                // ZMÌNA: Odebrány 3x <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "line-3d", symbolLayers: [{ type: "path", profile: "quad", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, axis: "height", stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] }, { type: "size", axis: "width", value: 5000 } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            "3D_graduated": {
                title: "3D Graduated Symbols",
                compatibleGeometry: ["point"], 
                // ZMÌNA: Odebrány 4x <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Diameter</h2><label for="diameterInput">Diameter (m):</label><input type="number" id="diameterInput" value="80000" step="1000"><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="500000" step="1000"><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000"><h2>Shape</h2><select id="shapeSelect"><option value="cylinder">Cylinder</option><option value="cone">Cone</option><option value="inverted-cone">Inverted Cone</option><option value="tetrahedron">Tetrahedron</option></select>`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: uiValues.shape }, width: uiValues.diameter, material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, axis: "height", stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] }, { type: "size", axis: "width-and-depth", useSymbolValue: true } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            prism: {
                title: "Prism Map",
                compatibleGeometry: ["polygon"], 
                // ZMÌNA: Odebrány 3x <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "polygon-3d", symbolLayers: [{ type: "extrude", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            voxels: {
                title: "Voxels",
                compatibleGeometry: ["polygon"], 
                // ZMÌNA: Odebrány 3x <hr>
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "polygon-3d", symbolLayers: [{ type: "extrude", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            }
        };

        let activeLayers = [];
        let focusedLayer = null;
        let pendingLayer = null; 
        
        const defaultGround = new Ground({ layers: [new ElevationLayer({ url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer" })] });
        const map = new Map({ basemap: "topo-vector", ground: defaultGround });
        const view = new SceneView({ container: "viewDiv", map: map, camera: { position: { latitude: 48, longitude: 15, z: 15000000 }, tilt: 0, heading: -1 }, qualityProfile: "high" });
        
        view.ui.padding = { top: 65, bottom: 35 };

        view.ui.add(new Home({ view }), "top-left");
        view.ui.add(new Expand({ view, content: new BasemapGallery({ view }), expandIconClass: "esri-icon-basemap" }), "top-left");
        view.ui.add(new Expand({ view: view, content: new Legend({ view }), expandIconClass: "esri-icon-legend" }), "bottom-left");

        // Reference na panely
        const addLayerPanel = document.getElementById("addLayerPanel");
        const methodSelectionPanel = document.getElementById("methodSelectionPanel");
        const symbologyEditorPanel = document.getElementById("symbologyEditorPanel");
        const layerListUl = document.getElementById("layer-list");
        
        // Reference na ovládací prvky
        const layerUrlInput = document.getElementById("layerUrlInput");
        const loadLayerBtn = document.getElementById("loadLayerBtn");
        const loadingMessage = document.getElementById("loadingMessage");
        const methodButtonsContainer = document.getElementById("method-buttons-container");
        const cancelMethodBtn = document.getElementById("cancelMethodBtn");
        const symbologyControlsContainer = document.getElementById("symbology-controls-container");
        const symbologyPanelTitle = document.getElementById("symbologyPanelTitle");
        
        // ===== LOGIKA PRO NAÈTENÍ VRSTVY =====

        async function handleLoadLayer() {
            const url = layerUrlInput.value;
            if (!url) {
                alert("Please enter a Feature Layer URL.");
                return;
            }

            loadingMessage.style.display = "block";
            loadLayerBtn.disabled = true;
            pendingLayer = null; 

            try {
                pendingLayer = new FeatureLayer({
                    url: url,
                    outFields: ["*"] 
                });

                await pendingLayer.load();
                
                if (!pendingLayer.title) {
                    pendingLayer.title = "New Layer";
                }
                
                const geomType = pendingLayer.geometryType; 
                showMethodSelection(geomType);

            } catch (error) {
                console.error("Failed to load layer:", error);
                alert("Could not load layer. Please check the URL and ensure it is a valid ArcGIS Feature Layer.");
                pendingLayer = null;
            } finally {
                loadingMessage.style.display = "none";
                loadLayerBtn.disabled = false;
            }
        }

        function showMethodSelection(geometryType) {
            methodButtonsContainer.innerHTML = ""; 
            
            const compatibleMethods = Object.keys(visualizationMethods).filter(key => {
                const config = visualizationMethods[key];
                return config.compatibleGeometry.includes(geometryType);
            });

            if (compatibleMethods.length === 0) {
                alert(`No compatible visualization methods found for this geometry type (${geometryType}).`);
                pendingLayer = null;
                return;
            }

            compatibleMethods.forEach(key => {
                const config = visualizationMethods[key];
                const btn = document.createElement("button");
                btn.className = "method-btn";
                btn.innerText = config.title;
                btn.onclick = () => finalizeAddLayer(key);
                methodButtonsContainer.appendChild(btn);
            });

            addLayerPanel.style.display = "none";
            methodSelectionPanel.style.display = "block";
        }

        async function finalizeAddLayer(methodKey) {
            if (!pendingLayer) return;

            const layer = pendingLayer;
            pendingLayer = null; 

            const config = visualizationMethods[methodKey];
            
            const allFieldInfos = layer.fields
                .filter(field => field.type !== "oid" && field.type !== "global-id" && field.type !== "geometry")
                .map(field => ({
                    fieldName: field.name,
                    label: field.alias || field.name
                }));
            
            layer.popupTemplate = {
                title: config.title, 
                content: [{ type: "fields", fieldInfos: allFieldInfos }]
            };

            layer.methodKey = methodKey;
            map.add(layer);
            activeLayers.push(layer);

            const numericFields = layer.fields.filter(f => ["double", "integer", "single", "small-integer"].includes(f.type)).map(f => f.name);
            const defaultField = numericFields.length > 0 ? numericFields[0] : null;

            if (defaultField) {
                const stats = await summaryStatistics({ layer, field: defaultField });
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = config.createUI();
                layer.currentSymbology = getUIValues(tempDiv, defaultField, stats);
                layer.currentSymbology.labelField = "__none__";
                applySymbology(layer); 
            } else {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = config.createUI();
                layer.currentSymbology = getUIValues(tempDiv, null, {min: 0, max: 0, avg: 0});
                layer.currentSymbology.labelField = "__none__";
            }
            
            // ===== NOVÉ: ZOOM NA VRSTVU =====
            try {
                // Poèkáme, až bude vrstva pøipravena ve view
                await view.whenLayerView(layer);
                // Pøesuneme kameru na plný rozsah vrstvy s animací 1.5 sekundy
                view.goTo(layer.fullExtent, { duration: 1500 });
            } catch (e) {
                console.error("Failed to zoom to layer extent:", e);
                // Pokraèujeme dál, i kdyby zoom selhal
            }
            // ===== KONEC ZOOMU NA VRSTVU =====

            openSymbologyEditor(layer);
            updateLayerList();
            methodSelectionPanel.style.display = "none";
        }

        function cancelMethodSelection() {
            pendingLayer = null; 
            methodSelectionPanel.style.display = "none";
            addLayerPanel.style.display = "block";
        }

        // ===== KONEC LOGIKY NAÈTENÍ VRSTVY =====


        function removeLayer(layerId) {
            const layerToRemove = activeLayers.find(l => l.id === layerId);
            if (!layerToRemove) return;
            map.remove(layerToRemove);
            activeLayers = activeLayers.filter(l => l.id !== layerId);
            if (focusedLayer && focusedLayer.id === layerId) {
                closeSymbologyEditor();
            }
            updateLayerList();
        }

        async function openSymbologyEditor(layer) {
            focusedLayer = layer;
            if (!layer) { closeSymbologyEditor(); return; }
            
            const config = visualizationMethods[layer.methodKey];
            symbologyPanelTitle.innerText = `Symbology (${config.title})`;
            
            // ZMÌNA: Odebráno <hr>
            let renameHTML = `<h2>Layer Name</h2><input type="text" id="layerNameInput">`;

            // ZMÌNA: Odebráno <hr>
            const numericFields = layer.fields.filter(f => ["double", "integer", "single", "small-integer"].includes(f.type));
            let attributeSelectorHTML = `<h2>Attribute to Visualize</h2>`;
            if (numericFields.length > 0) {
                attributeSelectorHTML += `<select id="attributeSelect">`;
                numericFields.forEach(field => {
                    attributeSelectorHTML += `<option value="${field.name}">${field.alias || field.name}</option>`;
                });
                attributeSelectorHTML += `</select>`;
            } else {
                attributeSelectorHTML += `<p style="color: var(--text-muted); font-size: 13px;">No numeric fields found in this layer.</p>`;
            }

            // ZMÌNA: Odebráno <hr>
            const allFields = layer.fields.filter(f => f.type !== "oid" && f.type !== "global-id" && f.type !== "geometry");
            let labelingSelectorHTML = `<h2>Labels</h2><select id="labelAttributeSelect">`;
            labelingSelectorHTML += `<option value="__none__">-- No Labels --</option>`;
            allFields.forEach(field => {
                labelingSelectorHTML += `<option value="${field.name}">${field.alias || field.name}</option>`;
            });
            labelingSelectorHTML += `</select>`;

            // Sestavení UI panelu
            symbologyControlsContainer.innerHTML = renameHTML + attributeSelectorHTML + labelingSelectorHTML + config.createUI();
            
            const layerNameInput = document.getElementById("layerNameInput");
            if (layerNameInput) {
                layerNameInput.value = layer.title || "Untitled Layer";
            }
            
            addLayerPanel.style.display = "none";
            methodSelectionPanel.style.display = "none";
            symbologyEditorPanel.style.display = "block";
            
            const attributeSelect = document.getElementById("attributeSelect");
            if (attributeSelect) {
                attributeSelect.value = layer.currentSymbology.field;
            }

            if (attributeSelect) {
                await updateStatsAndSymbology(); 
            }
            
            addEventListenersToControls();

            const labelAttributeSelect = document.getElementById("labelAttributeSelect");
            if (labelAttributeSelect && layer.currentSymbology.labelField) {
                labelAttributeSelect.value = layer.currentSymbology.labelField;
            }
        }

        function closeSymbologyEditor() {
            focusedLayer = null;
            symbologyEditorPanel.style.display = "none";
            addLayerPanel.style.display = "block";
        }

        function updateLayerList() {
            if (activeLayers.length === 0) {
                layerListUl.innerHTML = `<p class="placeholder-text">No active layers.</p>`;
                return;
            }
            layerListUl.innerHTML = "";
            [...activeLayers].reverse().forEach(layer => {
                const config = visualizationMethods[layer.methodKey];
                const li = document.createElement("li");
                const visibilityIcon = layer.visible ? "esri-icon-visible" : "esri-icon-non-visible";
                const visibilityTitle = layer.visible ? "Hide Layer" : "Show Layer";
                
                li.innerHTML = `
                    <span title="${layer.title || 'Layer'} (${config.title})">
                        ${layer.title || 'Layer'} <span class="method-name">(${config.title})</span>
                    </span>
                    <div class="layer-controls">
                        <button class="toggle-visibility-btn ${visibilityIcon}" data-layer-id="${layer.id}" title="${visibilityTitle}"></button>
                        <button class="edit-symbology-btn esri-icon-edit" data-layer-id="${layer.id}" title="Edit Symbology"></button>
                        <button class="remove-layer-btn esri-icon-trash" data-layer-id="${layer.id}" title="Remove Layer"></button>
                    </div>
                `;
                layerListUl.appendChild(li);
            });
        }
        
        function updateUIFromValues(values) {
            if (!values) return;
            
            const setInputValue = (id, value) => {
                const el = document.getElementById(id);
                if (el && value !== null && value !== undefined) el.value = value;
            };

            setInputValue("labelAttributeSelect", values.labelField);
            setInputValue("startColorPicker", values.rawColors.start);
            setInputValue("middleColorPicker", values.rawColors.middle);
            setInputValue("endColorPicker", values.rawColors.end);
            setInputValue("transparencyInput", values.opacity);
            setInputValue("planeHeightInput", values.height);
            setInputValue("sizeInput", values.size);
            setInputValue("minZOffsetInput", values.minZ);
            setInputValue("maxZOffsetInput", values.maxZ);
            setInputValue("shapeSelect", values.shape);
            setInputValue("diameterInput", values.diameter);
            setInputValue("heightAboveGroundInput", values.height);
        }

        function getUIValues(sourceElement = symbologyControlsContainer, field = null, stats = null) {
            const getValue = (id, isFloat = false, defaultValue = null) => {
                const input = sourceElement.querySelector(`#${id}`); if (!input) return defaultValue;
                const val = isFloat ? parseFloat(input.value) : parseInt(input.value);
                return isNaN(val) ? defaultValue : val;
            };
            const getString = (id, defaultValue = null) => sourceElement.querySelector(`#${id}`)?.value || defaultValue;

            const startColor = getString("startColorPicker", "#4575b4");
            const middleColor = getString("middleColorPicker", "#ffffbf");
            const endColor = getString("endColorPicker", "#d73027");

            const finalStats = stats || focusedLayer?.currentSymbology.stats || { min: 0, max: 0, avg: 0 };
            
            const attributeSelect = document.getElementById("attributeSelect");

            return {
                field: field || (attributeSelect ? attributeSelect.value : null), 
                labelField: getString("labelAttributeSelect", "__none__"), 
                stats: finalStats,
                rawColors: { start: startColor, middle: middleColor, end: endColor },
                colorStops: [ { value: finalStats.min, color: startColor }, { value: finalStats.avg, color: middleColor }, { value: finalStats.max, color: endColor } ],
                opacity: getValue("transparencyInput", true, 1),
                height: getValue("heightAboveGroundInput") ?? getValue("planeHeightInput") ?? 0,
                minZ: getValue("minZOffsetInput") ?? 0,
                maxZ: getValue("maxZOffsetInput") ?? 0,
                size: getValue("sizeInput"),
                diameter: getValue("diameterInput"),
                shape: getString("shapeSelect"),
            };
        }

        async function updateStatsAndSymbology() {
            if (!focusedLayer) return;

            const attributeSelect = document.getElementById("attributeSelect");
            if (!attributeSelect) { 
                handleInputChange();
                return;
            }

            const selectedField = attributeSelect.value;
            
            const stats = await summaryStatistics({ layer: focusedLayer, field: selectedField });
            
            focusedLayer.currentSymbology.field = selectedField;
            focusedLayer.currentSymbology.stats = stats;
            
            const labelField = document.getElementById("labelAttributeSelect")?.value;
            if (labelField) {
                focusedLayer.currentSymbology.labelField = labelField;
            }

            updateUIFromValues(focusedLayer.currentSymbology);
            handleInputChange(); 
        }

        function applySymbology(layerToApply = focusedLayer) {
            if (!layerToApply) return;
            
            const config = visualizationMethods[layerToApply.methodKey];
            const uiValues = (focusedLayer && layerToApply.id === focusedLayer.id) ? getUIValues() : layerToApply.currentSymbology;

            if (!uiValues) return; 

            if (focusedLayer && layerToApply.id === focusedLayer.id) {
                layerToApply.currentSymbology = uiValues;
            }

            if (uiValues.field) {
                 if(config.createRenderer) layerToApply.renderer = config.createRenderer(uiValues);
            }
           
            if(config.applyProperties) config.applyProperties(layerToApply, uiValues);
            
            if (uiValues.labelField && uiValues.labelField !== "__none__") {
                const field = layerToApply.fields.find(f => f.name === uiValues.labelField);
                const fieldType = field ? field.type : "string"; 
                
                let labelExpression;
                if (["double", "integer", "single", "small-integer"].includes(fieldType)) {
                    labelExpression = `Text($feature.${uiValues.labelField}, '#,###')`;
                } else {
                    labelExpression = `$feature.${uiValues.labelField}`;
                }

                layerToApply.labelingInfo = [{
                    labelExpressionInfo: { expression: labelExpression },
                    symbol: {
                        type: "label-3d",
                        symbolLayers: [{
                            type: "text",
                            material: { color: "#E0E0E0" },
                            halo: { color: [0, 0, 0, 0.7], size: 1 },
                            font: { size: 10, family: "Open Sans" },
                        }]
                    }
                }];
            } else {
                layerToApply.labelingInfo = null; 
            }
        }
        
        function handleLayerNameChange() {
            if (!focusedLayer) return;
            const nameInput = document.getElementById("layerNameInput");
            if (nameInput) {
                focusedLayer.title = nameInput.value || "Untitled Layer";
                updateLayerList(); 
            }
        }

        function handleInputChange() {
            updatePreviewFromInputs();
            applySymbology();        
        }

        function updatePreviewFromInputs() {
            const colorRampPreview = document.getElementById("colorRampPreview");
            if (!colorRampPreview) return;
            const uiValues = getUIValues();
            if (!uiValues || !uiValues.colorStops) return;
            const colors = uiValues.colorStops.map(stop => stop.color);
            colorRampPreview.style.background = `linear-gradient(to right, ${colors.join(", ")})`;
        }

        const debouncedInputChangeHandler = debounce(handleInputChange, 50);
        const debouncedNameChangeHandler = debounce(handleLayerNameChange, 250); 

        function addEventListenersToControls() {
            const layerNameInput = document.getElementById("layerNameInput");
            if (layerNameInput) {
                layerNameInput.addEventListener("input", debouncedNameChangeHandler);
            }

            document.querySelectorAll('#symbology-controls-container input:not(#layerNameInput)').forEach(input => {
                input.addEventListener("input", debouncedInputChangeHandler);
            });
            
            document.querySelectorAll('#symbology-controls-container select:not(#attributeSelect):not(#labelAttributeSelect)').forEach(select => {
                 select.addEventListener("change", handleInputChange);
            });

            const attributeSelect = document.getElementById("attributeSelect");
            if (attributeSelect) {
                attributeSelect.addEventListener("change", updateStatsAndSymbology);
            }
            const labelAttributeSelect = document.getElementById("labelAttributeSelect");
            if (labelAttributeSelect) {
                labelAttributeSelect.addEventListener("change", handleInputChange); 
            }
        }
        
        loadLayerBtn.addEventListener("click", handleLoadLayer);
        cancelMethodBtn.addEventListener("click", cancelMethodSelection);
        document.getElementById("closeSymbologyBtn").addEventListener("click", closeSymbologyEditor);

        layerListUl.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) return;

            const layerId = button.dataset.layerId;
            const layer = activeLayers.find(l => l.id === layerId);
            if (!layer) return;

            if (button.classList.contains("remove-layer-btn")) {
                removeLayer(layerId);
            } else if (button.classList.contains("edit-symbology-btn")) {
                openSymbologyEditor(layer);
            } else if (button.classList.contains("toggle-visibility-btn")) { 
                layer.visible = !layer.visible;
                updateLayerList(); 
            }
        });

        document.getElementById("home-link").addEventListener("click", (e) => { e.preventDefault(); location.reload(); });
        const helpButton = document.getElementById("helpButton");
        const helpOverlay = document.getElementById("helpModalOverlay");
        const closeHelpModalBtn = document.getElementById("closeHelpModal");
        helpButton.addEventListener("click", () => helpOverlay.style.display = "flex");
        closeHelpModalBtn.addEventListener("click", () => helpOverlay.style.display = "none");
        helpOverlay.addEventListener("click", (e) => { if (e.target === helpOverlay) helpOverlay.style.display = "none"; });
        
        function debounce(fn, d = 100) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; }

        view.when(async () => {
            updateLayerList();
            try {
                await view.goTo({ position: { latitude: 48, longitude: 15, z: 6000000 }, tilt: 0, heading: -1 }, { duration: 5000 });
            } catch (e) {}
        });
    });
});