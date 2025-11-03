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

        const commonColorUI = `<h2>Color Ramp</h2><div class="color-pickers-wrapper"><input type="color" id="startColorPicker" value="#4575b4"><input type="color" id="middleColorPicker" value="#ffffbf"><input type="color" id="endColorPicker" value="#d73027"></div><div id="colorRampPreview"></div><hr>`;
        
        const visualizationMethods = {
            horizontal: {
                title: "Horizontal Planes", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_horizontal/FeatureServer/0",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Height (Elevation)</h2><label for="planeHeightInput">Height Above Ground (m):</label><input type="number" id="planeHeightInput" value="300000" step="10000">`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "polygon-3d", symbolLayers: [{ type: "fill", material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            point_cloud: {
                title: "Point Cloud", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_point_cloud_irregular2/FeatureServer",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Point Size</h2><label for="sizeInput">Size (m):</label><input type="number" id="sizeInput" value="40000" min="0" step="1000"><hr><h2>Height (Elevation)</h2><label for="minZOffsetInput">Min Z Offset (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Max Z Offset (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><hr><h2>Shape</h2><select id="shapeSelect"><option value="sphere">Sphere</option><option value="cube">Cube</option><option value="diamond">Diamond</option></select>`,
                createRenderer: (uiValues) => ({ type: "simple", symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: uiValues.shape }, width: uiValues.size, depth: uiValues.size, height: uiValues.size, material: { color: "white", colorMixMode: "replace" } }] }, visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] }),
                applyProperties: (layer, uiValues) => {
                    layer.opacity = uiValues.opacity;
                    const { min, max } = uiValues.stats;
                    layer.elevationInfo = { mode: "relative-to-ground", featureExpressionInfo: { expression: `var t = ($feature.${uiValues.field} - ${min}) / (${max} - ${min}); return ${uiValues.minZ} + t*(${uiValues.maxZ} - ${uiValues.minZ});` } };
                }
            },
            "3D_surface": {
                 title: "3D Surface", isSpecialCase: true,
                 createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01">`
            },
            vertical: {
                title: "Vertical Planes", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_vertical/FeatureServer/1",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><hr><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "line-3d", symbolLayers: [{ type: "path", profile: "quad", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, axis: "height", stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] }, { type: "size", axis: "width", value: 5000 } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            "3D_graduated": {
                title: "3D Graduated Symbols", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_3D_graduated/FeatureServer/0",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Diameter</h2><label for="diameterInput">Diameter (m):</label><input type="number" id="diameterInput" value="80000" step="1000"><hr><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="500000" step="1000"><hr><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000"><hr><h2>Shape</h2><select id="shapeSelect"><option value="cylinder">Cylinder</option><option value="cone">Cone</option><option value="inverted-cone">Inverted Cone</option><option value="tetrahedron">Tetrahedron</option></select>`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: uiValues.shape }, width: uiValues.diameter, material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, axis: "height", stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] }, { type: "size", axis: "width-and-depth", useSymbolValue: true } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            prism: {
                title: "Prism Map", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_prism/FeatureServer/0",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><hr><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
                createRenderer: (uiValues) => ({
                    type: "simple",
                    symbol: { type: "polygon-3d", symbolLayers: [{ type: "extrude", material: { color: "white", colorMixMode: "replace" } }] },
                    visualVariables: [ { type: "color", field: uiValues.field, stops: uiValues.colorStops }, { type: "size", field: uiValues.field, stops: [{ value: uiValues.stats.min, size: uiValues.minZ }, { value: uiValues.stats.max, size: uiValues.maxZ }] } ]
                }),
                applyProperties: (layer, uiValues) => { layer.opacity = uiValues.opacity; layer.elevationInfo = { mode: "relative-to-ground", offset: uiValues.height }; }
            },
            voxels: {
                title: "Voxels", layerUrl: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_voxels/FeatureServer/1",
                createUI: () => `${commonColorUI}<h2>Transparency</h2><input type="range" id="transparencyInput" value="1" min="0" max="1" step="0.01"><hr><h2>Extrusion</h2><label for="minZOffsetInput">Base Height (m):</label><input type="number" id="minZOffsetInput" value="0" step="1000"><br><label for="maxZOffsetInput">Extrusion (m):</label><input type="number" id="maxZOffsetInput" value="200000" step="1000"><hr><h2>Height (Elevation)</h2><label for="heightAboveGroundInput">Height Above Ground (m):</label><input type="number" id="heightAboveGroundInput" value="0" step="1000">`,
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
        
        const defaultGround = new Ground({ layers: [new ElevationLayer({ url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer" })] });
        const map = new Map({ basemap: "topo-vector", ground: defaultGround });
        const view = new SceneView({ container: "viewDiv", map: map, camera: { position: { latitude: 48, longitude: 15, z: 15000000 }, tilt: 0, heading: -1 }, qualityProfile: "high" });
        
        view.ui.padding = { top: 65, bottom: 35 };

        view.ui.add(new Home({ view }), "top-left");
        view.ui.add(new Expand({ view, content: new BasemapGallery({ view }), expandIconClass: "esri-icon-basemap" }), "top-left");
        view.ui.add(new Expand({ view: view, content: new Legend({ view }), expandIconClass: "esri-icon-legend" }), "bottom-left");

        const addLayerPanel = document.getElementById("addLayerPanel");
        const symbologyEditorPanel = document.getElementById("symbologyEditorPanel");
        const symbologyControlsContainer = document.getElementById("symbology-controls-container");
        const symbologyPanelTitle = document.getElementById("symbologyPanelTitle");
        const layerListUl = document.getElementById("layer-list");
        
        async function addLayer(methodKey) {
            const config = visualizationMethods[methodKey];
            if (!config) return;

            if (methodKey === "3D_surface" && activeLayers.some(l => l.methodKey === "3D_surface")) { return; }

            let newLayer;
            
            let dynamicPopupTemplate = { 
                title: config.title 
            }; 

            if (config.isSpecialCase && methodKey === "3D_surface") {
                const customElevation = new ElevationLayer({ url: "https://tiles.arcgis.com/tiles/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_3Dsurface_proj/ImageServer" });
                map.ground = new Ground({ layers: [customElevation] });
                newLayer = new FeatureLayer({ 
                    url: "https://services1.arcgis.com/AGrMjSBR7fxJYLfU/arcgis/rest/services/EU_horizontal/FeatureServer/0", 
                    elevationInfo: { mode: "on-the-ground" }, 
                });
            } else {
                newLayer = new FeatureLayer({ 
                    url: config.layerUrl, 
                    outFields: ["*"], 
                });
            }

            newLayer.methodKey = methodKey;
            
            map.add(newLayer);
            activeLayers.push(newLayer);
            
            await newLayer.load(); 

            const allFieldInfos = newLayer.fields
                .filter(field => field.type !== "oid" && field.type !== "global-id" && field.type !== "geometry") // Vynecháme systémová pole
                .map(field => ({
                    fieldName: field.name,
                    label: field.alias || field.name
                }));

            dynamicPopupTemplate.content = [{
                type: "fields",
                fieldInfos: allFieldInfos
            }];

            newLayer.popupTemplate = dynamicPopupTemplate;
            

            const numericFields = newLayer.fields.filter(f => ["double", "integer", "single", "small-integer"].includes(f.type)).map(f => f.name);
            const defaultField = numericFields.includes("Temperature") ? "Temperature" : numericFields[0];
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = config.createUI();
            newLayer.currentSymbology = getUIValues(tempDiv, defaultField, {min: 0, max: 0}); 
            newLayer.currentSymbology.labelField = "__none__"; 
            
            openSymbologyEditor(newLayer); 
            updateLayerList();
        }

        function removeLayer(layerId) {
            const layerToRemove = activeLayers.find(l => l.id === layerId);
            if (!layerToRemove) return;

            map.remove(layerToRemove);
            if (layerToRemove.methodKey === "3D_surface") {
                map.ground = defaultGround;
            }
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
            
            // Seznam pro VIZUALIZACI (èíselné atributy)
            const numericFields = layer.fields.filter(f => ["double", "integer", "single", "small-integer"].includes(f.type));
            let attributeSelectorHTML = `<h2>Attribute to Visualize</h2><select id="attributeSelect">`;
            numericFields.forEach(field => {
                attributeSelectorHTML += `<option value="${field.name}">${field.alias || field.name}</option>`;
            });
            attributeSelectorHTML += `</select><hr>`;

            // Seznam pro POPISKY (všechny textové/obecné atributy)
            const allFields = layer.fields.filter(f => f.type !== "oid" && f.type !== "global-id" && f.type !== "geometry");
            let labelingSelectorHTML = `<h2>Labels</h2><select id="labelAttributeSelect">`;
            labelingSelectorHTML += `<option value="__none__">-- No Labels --</option>`;
            allFields.forEach(field => {
                labelingSelectorHTML += `<option value="${field.name}">${field.alias || field.name}</option>`;
            });
            labelingSelectorHTML += `</select><hr>`;

            // Sestavení UI panelu
            symbologyControlsContainer.innerHTML = attributeSelectorHTML + labelingSelectorHTML + config.createUI();
            
            addLayerPanel.style.display = "none";
            symbologyEditorPanel.style.display = "block";
            
            const attributeSelect = document.getElementById("attributeSelect");
            attributeSelect.value = layer.currentSymbology.field;

            await updateStatsAndSymbology(); 
            
            addEventListenersToControls();

            // Nastavíme aktuální hodnotu v novém dropdownu
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
                    <span>${config.title}</span>
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
            
            return {
                field: field || document.getElementById("attributeSelect")?.value,
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

            const selectedField = document.getElementById("attributeSelect").value;
            
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

            if(config.createRenderer) layerToApply.renderer = config.createRenderer(uiValues);
            if(config.applyProperties) config.applyProperties(layerToApply, uiValues);
            
            if(layerToApply.methodKey === "3D_surface") {
                layerToApply.renderer = { 
                    type: "simple", 
                    symbol: { type: "simple-fill", material: { color: "white", colorMixMode: "replace"}, outline: null }, 
                    visualVariables: [{ type: "color", field: uiValues.field, stops: uiValues.colorStops }] 
                };
                layerToApply.opacity = uiValues.opacity;
            }
            
            // NOVÉ: Aplikace nastavení popiskù s formátováním
            if (uiValues.labelField && uiValues.labelField !== "__none__") {
                
                // Zjistíme typ pole, abychom vìdìli, zda formátovat èíslo
                const field = layerToApply.fields.find(f => f.name === uiValues.labelField);
                const fieldType = field ? field.type : "string"; // Výchozí je string
                
                let labelExpression;
                if (["double", "integer", "single", "small-integer"].includes(fieldType)) {
                    // Je to èíslo, použijeme Arcade formátování
                    labelExpression = `Text($feature.${uiValues.labelField}, '#,###')`;
                } else {
                    // Je to text nebo datum, necháme ho tak, jak je
                    labelExpression = `$feature.${uiValues.labelField}`;
                }

                layerToApply.labelingInfo = [{
                    labelExpressionInfo: { expression: labelExpression },
                    symbol: {
                        type: "label-3d",
                        symbolLayers: [{
                            type: "text",
                            material: { color: "#E0E0E0" }, // Barva textu (z vaší CSS)
                            halo: { color: [0, 0, 0, 0.7], size: 1 }, // Tmavé halo
                            font: { size: 10, family: "Open Sans" },
                        }]
                    }
                }];
            } else {
                // Pokud je vybráno "No Labels", popisky vypneme
                layerToApply.labelingInfo = null; 
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

        function addEventListenersToControls() {
            document.querySelectorAll('#symbology-controls-container input').forEach(input => {
                input.addEventListener("input", debouncedInputChangeHandler);
            });
            
            document.querySelectorAll('#symbology-controls-container select:not(#attributeSelect):not(#labelAttributeSelect)').forEach(select => {
                 select.addEventListener("change", handleInputChange);
            });

            document.getElementById("attributeSelect").addEventListener("change", updateStatsAndSymbology);

            document.getElementById("labelAttributeSelect").addEventListener("change", handleInputChange);
        }
        
        document.getElementById("addLayerBtn").addEventListener("click", () => {
            const selectedMethod = document.getElementById("layerSelect").value;
            addLayer(selectedMethod);
        });

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