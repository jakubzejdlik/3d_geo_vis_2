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
        "esri/smartMapping/statistics/summaryStatistics",
        "esri/Viewpoint"
    ], function (Map, SceneView, FeatureLayer, Ground, ElevationLayer, Home, BasemapGallery, Expand, Legend, summaryStatistics, Viewpoint) {

        const commonColorUI = `<h2>Color Ramp</h2><div class="color-pickers-wrapper"><input type="color" id="startColorPicker" value="#4575b4"><input type="color" id="middleColorPicker" value="#ffffbf"><input type="color" id="endColorPicker" value="#d73027"></div><div id="colorRampPreview"></div>`;
        
        const visualizationMethods = {
            horizontal: {
                title: "Horizontal Planes",
                compatibleGeometry: ["polygon"], 
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Height (Elevation)</h2><label for="planeHeightInput">Height Above Ground (m):</label><input type="number" id="planeHeightInput" value="300000" step="10000">`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "polygon-3d", symbolLayers: [{ type: "fill", material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            point_cloud: {
                title: "Point Cloud",
                compatibleGeometry: ["point"], 
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Point Size</h2><label for="sizeInput">Size (m):</label><input type="number" id="sizeInput" value="40000" min="0" step="1000"><h2>Height (Elevation)</h2><label for="minZOffsetInput">Min Z Offset (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Max Z Offset (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Shape</h2><select id="shapeSelect"><option value="sphere">Sphere</option><option value="cube">Cube</option><option value="diamond">Diamond</option></select>`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: uiValues.shape }, width: uiValues.size, depth: uiValues.size, height: uiValues.size, material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => {
                    layer.opacity = uiValues.opacity;
                    const { min, max } = uiValues.stats;
                    layer.elevationInfo = { mode: "relative-to-ground", featureExpressionInfo: { expression: `var t = ($feature.${uiValues.field} - ${min}) / (${max} - ${min}); return ${uiValues.minZ} + t*(${uiValues.maxZ} - ${uiValues.minZ});` } };
                }
            },
            "3D_graduated_points": {
                title: "3D Graduated Symbols - Points", 
                compatibleGeometry: ["point"], 
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Point Size</h2><label for="minSizeInput">Min Size (m):</label><input type="number" id="minSizeInput" value="10000" step="1000"><br><label for="maxSizeInput">Max Size (m):</label><input type="number" id="maxSizeInput" value="100000" step="1000"><h2>Height (Elevation)</h2><label for="minZOffsetInput">Min Z Offset (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Max Z Offset (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Shape</h2><select id="shapeSelect"><option value="sphere">Sphere</option><option value="cube">Cube</option><option value="diamond">Diamond</option></select>`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { primitive: uiValues.shape },
                            material: { color: "white", colorMixMode: "replace" },
                            depth: 1, width: 1, height: 1
                        }]
                    },
                    visualVariables: [
                        { type: "color", field: uiValues.field, stops: uiValues.colorStops },
                        {
                            type: "size",
                            field: uiValues.field,
                            axis: "all",
                            stops: [
                                { value: uiValues.stats.min, size: uiValues.minSize },
                                { value: uiValues.stats.max, size: uiValues.maxSize }
                            ]
                        }
                    ]
                }),
                applyProperties: (layer, uiValues) => {
                    layer.opacity = uiValues.opacity;
                    const { min, max } = uiValues.stats;
                    layer.elevationInfo = { 
                        mode: "relative-to-ground", 
                        featureExpressionInfo: { 
                            expression: `var t = ($feature.${uiValues.field} - ${min}) / (${max} - ${min}); return ${uiValues.minZ} + t*(${uiValues.maxZ} - ${uiValues.minZ});` 
                        } 
                    };
                }
            },
            vertical: {
                title: "Vertical Planes",
                compatibleGeometry: ["polyline"], 
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "line-3d", symbolLayers: [{ type: "path", profile: "quad", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, axis: "height", stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] }, { type: "size", axis: "width", value: 5000 } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            "3D_graduated_columns": {
                title: "3D Graduated Symbols - Columns",
                compatibleGeometry: ["point"], 
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
        
        // Cíl pro tlaèítko Home (oddáleno)
        const homeButtonViewpoint = new Viewpoint({
            camera: { position: { latitude: 48, longitude: 15, z: 25000000 }, tilt: 0, heading: -1 }
        });

        // Cíl pro úvodní animaci (pøiblíženo)
        const animationTargetViewpoint = new Viewpoint({
            camera: { position: { latitude: 48, longitude: 15, z: 15000000 }, tilt: 0, heading: -1 }
        });
        
        const view = new SceneView({ 
            container: "viewDiv", 
            map: map, 
            camera: { position: { latitude: 48, longitude: 15, z: 25000000 }, tilt: 0, heading: -1 }, 
            qualityProfile: "high" 
        });
        
        view.ui.padding = { top: 65, bottom: 35 };
        
        // Tlaèítko Home nyní používá oddálený pohled
        view.ui.add(new Home({ view: view, viewpoint: homeButtonViewpoint }), "top-left");
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
        
        const addThematicLayerBtn = document.getElementById("addThematicLayerBtn");

        const changeElevationBtn = document.getElementById("changeElevationBtn");
        const elevationPanel = document.getElementById("elevationPanel");
        const defaultElevationRadio = document.getElementById("defaultElevationRadio");
        const customElevationRadio = document.getElementById("customElevationRadio");
        const elevationUrlInput = document.getElementById("elevationUrlInput");
        const applyElevationBtn = document.getElementById("applyElevationBtn");
        const elevationLoadingMessage = document.getElementById("elevationLoadingMessage");

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

        // ===== PØEPRACOVANÁ FUNKCE finalizeAddLayer =====
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

            // Zjistíme výchozí pole
            const numericFields = layer.fields.filter(f => ["double", "integer", "single", "small-integer"].includes(f.type)).map(f => f.name);
            const defaultField = numericFields.length > 0 ? numericFields[0] : null;

            // Vytvoøíme doèasný div, abychom mohli pøeèíst výchozí hodnoty z UI
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = config.createUI();
            
            let stats = { min: 0, max: 0, avg: 0 };
            if (defaultField) {
                stats = await summaryStatistics({ layer, field: defaultField });
            }
            
            // Nyní zavoláme getUIValues na tomto doèasném divu
            layer.currentSymbology = getUIValues(tempDiv, defaultField, stats);
            layer.currentSymbology.labelField = "__none__"; // Toto je øádek 269, který selhával
            
            if (defaultField) {
                applySymbology(layer); 
            }
            
            try {
                await view.whenLayerView(layer);
                view.goTo(layer.fullExtent, { duration: 1500 });
            } catch (e) {
                console.error("Failed to zoom to layer extent:", e);
            }
            
            openSymbologyEditor(layer); 
            updateLayerList();
            methodSelectionPanel.style.display = "none";
        }

        function cancelMethodSelection() {
            pendingLayer = null; 
            methodSelectionPanel.style.display = "none";
            addLayerPanel.style.display = "block";
        }
        // ===== KONEC PØEPRACOVANÉ FUNKCE =====


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
            
            let renameHTML = `<h2>Layer Name</h2><input type="text" id="layerNameInput">`;

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

            const allFields = layer.fields.filter(f => f.type !== "oid" && f.type !== "global-id" && f.type !== "geometry");
            let labelingSelectorHTML = `<h2>Labels</h2><select id="labelAttributeSelect">`;
            labelingSelectorHTML += `<option value="__none__">-- No Labels --</option>`;
            allFields.forEach(field => {
                labelingSelectorHTML += `<option value="${field.name}">${field.alias || field.name}</option>`;
            });
            labelingSelectorHTML += `</select>`;

            symbologyControlsContainer.innerHTML = renameHTML + attributeSelectorHTML + labelingSelectorHTML + config.createUI();
            
            const layerNameInput = document.getElementById("layerNameInput");
            if (layerNameInput) {
                layerNameInput.value = layer.title || "Untitled Layer";
            }
            
            addLayerPanel.style.display = "none";
            methodSelectionPanel.style.display = "none";
            elevationPanel.style.display = "none"; 
            symbologyEditorPanel.style.display = "block";
            
            const attributeSelect = document.getElementById("attributeSelect");
            if (attributeSelect && layer.currentSymbology.field) { // Zkontrolujeme, zda pole existuje
                attributeSelect.value = layer.currentSymbology.field;
            }

            // OPRAVA: Tuto funkci už volá `attributeSelect.addEventListener`
            // if (attributeSelect) {
            //     await updateStatsAndSymbology(); 
            // }
            
            addEventListenersToControls(); // Pøidá listenery

            // OPRAVA: Manuálnì nastavíme hodnoty UI z uložené symbologie
            // Toto je klíèové po opravì finalizeAddLayer
            updateUIFromValues(layer.currentSymbology);
            updatePreviewFromInputs(); // Aktualizujeme náhled barev

            const labelAttributeSelect = document.getElementById("labelAttributeSelect");
            if (labelAttributeSelect && layer.currentSymbology.labelField) {
                labelAttributeSelect.value = layer.currentSymbology.labelField;
            }
        }

        function closeSymbologyEditor() {
            focusedLayer = null;
            symbologyEditorPanel.style.display = "none";
        }

        function updateLayerList() {
            if (activeLayers.length === 0) {
                layerListUl.innerHTML = `<p class="placeholder-text">Use the buttons in the top bar to add thematic data, add 3D buildings, or change the elevation layer.</p>`;
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
        
        // ===== PØEPRACOVANÁ FUNKCE updateUIFromValues =====
        function updateUIFromValues(values) {
            if (!values) return;
            
            const setInputValue = (id, value) => {
                const el = document.getElementById(id);
                // Pøidána kontrola, zda prvek existuje v DOM (v panelu symbologie)
                if (el && value !== null && value !== undefined) {
                    el.value = value;
                }
            };
            
            // Nastaví pouze ty hodnoty, které jsou relevantní pro aktuální panel
            setInputValue("labelAttributeSelect", values.labelField);
            setInputValue("startColorPicker", values.rawColors.start);
            setInputValue("middleColorPicker", values.rawColors.middle);
            setInputValue("endColorPicker", values.rawColors.end);
            setInputValue("transparencyInput", values.opacity);
            setInputValue("planeHeightInput", values.height);
            setInputValue("sizeInput", values.size);
            setInputValue("minSizeInput", values.minSize);
            setInputValue("maxSizeInput", values.maxSize);
            setInputValue("minZOffsetInput", values.minZ);
            setInputValue("maxZOffsetInput", values.maxZ);
            setInputValue("shapeSelect", values.shape);
            setInputValue("diameterInput", values.diameter);
            setInputValue("heightAboveGroundInput", values.height);
        }

        // ===== PØEPRACOVANÁ FUNKCE getUIValues =====
        // Nyní správnì ète POUZE z `symbologyControlsContainer`
        function getUIValues(sourceElement = symbologyControlsContainer, field = null, stats = null) {
            const getValue = (id, isFloat = false, defaultValue = null) => {
                const input = sourceElement.querySelector(`#${id}`); if (!input) return defaultValue;
                const val = isFloat ? parseFloat(input.value) : parseInt(input.value);
                return isNaN(val) ? defaultValue : val;
            };
            const getString = (id, defaultValue = null) => {
                 const el = sourceElement.querySelector(`#${id}`);
                 return el ? el.value : defaultValue;
            };

            const startColor = getString("startColorPicker", "#4575b4");
            const middleColor = getString("middleColorPicker", "#ffffbf");
            const endColor = getString("endColorPicker", "#d73027");

            const finalStats = stats || focusedLayer?.currentSymbology.stats || { min: 0, max: 0, avg: 0 };
            
            // OPRAVA: Èteme 'attributeSelect' ze 'sourceElement'
            const attributeSelect = sourceElement.querySelector("#attributeSelect");

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
                minSize: getValue("minSizeInput"),
                maxSize: getValue("maxSizeInput"),
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
            // OPRAVA: Vždy naèteme aktuální hodnoty z UI, pokud je panel otevøený
            const uiValues = (focusedLayer && layerToApply.id === focusedLayer.id && symbologyEditorPanel.style.display === "block") 
                ? getUIValues() 
                : layerToApply.currentSymbology;

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
            // OPRAVA: getUIValues musí èíst z aktuálního panelu
            const uiValues = getUIValues(symbologyControlsContainer); 
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

        
        function hideAllRightPanels() {
            addLayerPanel.style.display = "none";
            methodSelectionPanel.style.display = "none";
            symbologyEditorPanel.style.display = "none";
            elevationPanel.style.display = "none";
        }
        
        addThematicLayerBtn.addEventListener("click", () => {
            const isVisible = addLayerPanel.style.display === "block";
            hideAllRightPanels(); 
            if (!isVisible) {
                addLayerPanel.style.display = "block";
            }
        });

        changeElevationBtn.addEventListener("click", () => {
            const isVisible = elevationPanel.style.display === "block";
            hideAllRightPanels(); 
            if (!isVisible) {
                elevationPanel.style.display = "block";
            }
        });

        defaultElevationRadio.addEventListener("change", () => {
            if (defaultElevationRadio.checked) {
                elevationUrlInput.disabled = true;
            }
        });

        customElevationRadio.addEventListener("change", () => {
            if (customElevationRadio.checked) {
                elevationUrlInput.disabled = false;
            }
        });

        applyElevationBtn.addEventListener("click", async () => {
            elevationLoadingMessage.style.display = "block";
            applyElevationBtn.disabled = true;

            try {
                if (defaultElevationRadio.checked) {
                    map.ground = defaultGround;
                } else if (customElevationRadio.checked) {
                    const url = elevationUrlInput.value;
                    if (!url) {
                        alert("Please enter an Elevation Layer URL.");
                        return;
                    }
                    const newElevationLayer = new ElevationLayer({ url: url });
                    await newElevationLayer.load();
                    map.ground = new Ground({ layers: [newElevationLayer] });
                }
            } catch (error) {
                console.error("Failed to apply elevation:", error);
                alert("Could not load elevation layer. Please check the URL. Reverting to default.");
                map.ground = defaultGround;
            } finally {
                elevationLoadingMessage.style.display = "none";
                applyElevationBtn.disabled = false;
            }
        });

        document.getElementById("home-link").addEventListener("click", (e) => { e.preventDefault(); location.reload(); });
        const helpButton = document.getElementById("helpButton");
        const helpOverlay = document.getElementById("helpModalOverlay");
        const closeHelpModalBtn = document.getElementById("closeHelpModal");
        
        const closeHelp = () => {
            if (helpOverlay) helpOverlay.style.display = "none";
        };
        const openHelp = () => {
            if (helpOverlay) helpOverlay.style.display = "flex";
        };

        helpButton.addEventListener("click", openHelp);
        closeHelpModalBtn.addEventListener("click", closeHelp);
        helpOverlay.addEventListener("click", (e) => { 
            if (e.target === helpOverlay) closeHelp(); 
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeHelp();
                hideAllRightPanels();
            }
        });
        
        function copyToClipboard(text, element) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = element.innerText;
                element.innerText = "Copied!";
                element.style.color = "#FFD54F"; // Použijeme barvu, kterou máme rádi
                
                setTimeout(() => {
                    element.innerText = originalText;
                    element.style.color = "#f0f0f0"; // Vrátíme pùvodní barvu
                }, 1500); // Zpìtná vazba zmizí po 1.5 sekundì
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }

        // Pøiøadíme listenery k prvkùm v nápovìdì
        // Musíme to navázat na 'helpButton', protože prvky existují až po otevøení
        helpButton.addEventListener("click", () => {
            // Tyto listenery se pøiøadí jen jednou, i když se 'openHelp' volá opakovanì
            // Používáme '.onclick' místo 'addEventListener' abychom zabránili vícenásobnému pøiøazení
            
            const demoPoints = document.getElementById("demo-points");
            if (demoPoints) {
                demoPoints.onclick = (e) => copyToClipboard(e.target.innerText, e.target);
            }
            
            const demoLines = document.getElementById("demo-lines");
            if (demoLines) {
                demoLines.onclick = (e) => copyToClipboard(e.target.innerText, e.target);
            }
            
            const demoPolygons = document.getElementById("demo-polygons");
            if (demoPolygons) {
                demoPolygons.onclick = (e) => copyToClipboard(e.target.innerText, e.target);
            }
            
            const demoElevation = document.getElementById("demo-elevation");
            if (demoElevation) {
                demoElevation.onclick = (e) => copyToClipboard(e.target.innerText, e.target);
            }
        });
        
        function debounce(fn, d = 100) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; }

        view.when(async () => {
            updateLayerList();
            try {
                await view.goTo(animationTargetViewpoint, { duration: 5000 });
            } catch (e) {}
        });
    });
});