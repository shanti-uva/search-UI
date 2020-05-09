/* 	PLACES PAGES ****************************************************************************************************************************

	This module draws the places page based on a kmap from SOLR. Some information comes from the kmap
	passed in and some from the a second query from the child data in the Terms index.  A map pulled from
	arcGIS online is drawn and framed on the area highlighted. The feature	types and summary are drawn below 
	the map.

	[ document map functions ]
	
	The related resources menu is drawn, which pulls data via another SOLR call. If an image is present
	it is drawn there. Below that is a browsable index of places. Clicking on one will bring up that page.
	
	A tabbed menu shows the CONTEXT, where the page fits in the tree. Clicking on one will bring up that page.
	You can drill down further in the tree by clicking on a '+' dot or collapse branches with th '-'. The SUMMARY,
	which lists the related subjects to this page, catagorized by their type and alpabetically sorted.	Clicking 
	on one will bring up that page. Hovering over a blue popover icon will show more information about it. 
	The NAMES tab shows the names and etymoogy and Location the GIS datas

	Requires: 	jQuery 												// Almost any version should work
	Images:		img/basemapicon.gif,
				img/layericon.png
				img/legendicon.gif
				img/sketchicon.gif
				img/bookmarkicon.gif

	ESRI:		https://js.arcgis.com/4.15
				https://js.arcgis.com/4.15/esri/themes/light/main.css (dynamically loaded)
	Dependents:	pages.js, searchui.js								// JS modules called
	opt: 		Bitmapped: 1=Scale | 2=Search| 4=3D | 8=Base | 16=Layers | 32=Legend | 64=Sketch | 128=Bookmarks | 256=Print | 512=Distance | 1024=Area

*******************************************************************************************************************************************/

class Places  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.app=null;
		this.kmap=null;
		this.extent=null;
		this.geoJSON=null
		this.showing=false;
		$("<link/>", { rel:"stylesheet", type:"text/css", href:"https://js.arcgis.com/4.15/esri/themes/light/main.css" }).appendTo("head");
		this.div=sui.pages.div;	
		this.content=["","...loading","...loading"];
		this.content2=["<br>","<br>"];
		this.popovers=null;
	}

	Draw(kmap, related, popovers)															// DRAW MAP PAGE
	{
		var _this=this;																			// Save context
		this.popovers=popovers;																	// Add data for any popovers
		$("#sui-results").css({ "padding-left":"12px", width:"calc(100% - 24px"});				// Reset to normal size
		this.kmap=kmap;																			// Save kmap
		this.showing=false;																		// Map isn't up yet
		this.geoJSON=null;																		// Assume no geoJSON
		this.extent=null;																		// Clear extent
		this.DrawMetadata(related);																// Draw metadata
		sui.LoadingIcon(true,64);																// Show loading icon
			
		var app={ container:"plc-main",															// Holds startup parameters													
			map:null, baseMap:"hybrid", geoJSON:null, 								
			mapView: null,  sceneView: null, activeView:null, opt:4|8|64|512|1024,
			bookmarks:null, legend:null, layers:null, basePick:null, sketch:null,measurement:null,				
			center: [91.1721, 29.6524], zoom:12, tilt:80,
			reqs:["esri/Map","esri/WebMap", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", "esri/layers/FeatureLayer", "esri/layers/GeoJSONLayer", "esri/core/watchUtils","esri/geometry/Extent"],
			div: this.div								
	   		};
	
		this.app=app;	   
		
		if (app.opt&1)	 		app.reqs.push("esri/widgets/ScaleBar");							// Scalebar if spec'd
		if (app.opt&2)	 		app.reqs.push("esri/widgets/Search");							// Search
		if (app.opt&8)	 		app.reqs.push("esri/widgets/BasemapGallery");					// Basepicker 
		if (app.opt&16)	 		app.reqs.push("esri/widgets/LayerList");						// Layerlist 
		if (app.opt&32)  		app.reqs.push("esri/widgets/Legend");							// Legend
		if (app.opt&64)	 		app.reqs.push("esri/widgets/Sketch"),app.reqs.push("esri/layers/GraphicsLayer");	// Sketch
		if (app.opt&128) 		app.reqs.push("esri/widgets/Bookmarks");						// Bookmarks 
		if (app.opt&256) 		app.reqs.push("esri/widgets/Print");							// Print 
		if (app.opt&(512|1024))	app.reqs.push("esri/widgets/Measurement");						// Measure 

		require(app.reqs, function() {														// LOAD ArcGIS MODULES
			var i,key;
			var Map,WebMap,MapView,SceneView,Graphic,FeatureLayer,GeoJSONLayer,Extent;
			var ScaleBar,Search,BasemapGallery,LayerList,Legend,Sketch,GraphicsLayer,Bookmarks,watchUtils,Print,Measurement;
			for (i=0;i<app.reqs.length;++i)	{													// For each required module
				key=app.reqs[i].match(/([^\/]+)$/i)[1];											// Extract variable name
				if (key == "Map") 					Map=arguments[i];							// Set variable
				else if (key == "WebMap")			WebMap=arguments[i];
				else if (key == "MapView")			MapView=arguments[i];
				else if (key == "SceneView")		SceneView=arguments[i];
				else if (key == "Graphic")			Graphic=arguments[i];
				else if (key == "FeatureLayer")		FeatureLayer=arguments[i];
				else if (key == "GeoJSONLayer")		GeoJSONLayer=arguments[i];
				else if (key == "watchUtils")		watchUtils=arguments[i];
				else if (key == "Extent")			Extent=arguments[i];
				else if (key == "ScaleBar")			ScaleBar=arguments[i];
				else if (key == "Search")			Search=arguments[i];
				else if (key == "BasemapGallery")	BasemapGallery=arguments[i];
				else if (key == "LayerList")		LayerList=arguments[i];
				else if (key == "Legend")			Legend=arguments[i];
				else if (key == "Sketch")			Sketch=arguments[i];
				else if (key == "GraphicsLayer")	GraphicsLayer=arguments[i];
				else if (key == "Bookmarks")		Bookmarks=arguments[i];
				else if (key == "Print")			Print=arguments[i];
				else if (key == "Measurement")		Measurement=arguments[i];
			}

			var str=`<div id="plc-infoDiv">
				<input class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-switch-btn" value="3D"             title="Change view" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-base-btn"   src="basemapicon.gif"  title="Change base map"/>
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-layer-btn"  src="layericon.png"    title="Show list of layers" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-legend-btn" src="legendicon.gif"   title="Show legend" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-book-btn"   src="bookmarkicon.gif" title="Show bookmarks" />		
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-print-btn"  src="printicon.gif" 	 title="Print menu" />		
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-sketch-btn" src="sketchicon.gif"   title="Show sketch" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-dist-btn"   src="disticon.png" 	 title="Measure distance" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-area-btn"   src="areaicon.png" 	 title="Measure area" />
				</div>`;
			$("#plc-main").append(str);

		app.ShowOptions=function() {															// SHOW ACTIVE OPTIONS
			document.getElementById("plc-switch-btn").style.display=(app.opt&4) ? "block" : "none";	// Hide/show icons
			document.getElementById("plc-base-btn").style.display=(app.opt&8) ? "block" : "none";							
			document.getElementById("plc-layer-btn").style.display=(app.opt&16 && (app.map.portalItem || app.geoJSON)) ? "block" : "none";							
			document.getElementById("plc-legend-btn").style.display=(app.opt&32 && app.map.portalItem)  ? "block" : "none";						
			document.getElementById("plc-sketch-btn").style.display=(app.opt&64) ? "block" : "none";						
			document.getElementById("plc-book-btn").style.display=(app.opt&128 && app.map.bookmarks) ? "block" : "none";							
			document.getElementById("plc-print-btn").style.display=(app.opt&256) ? "block" : "none";							
			document.getElementById("plc-dist-btn").style.display=(app.opt&512) ? "block" : "none";							
			document.getElementById("plc-area-btn").style.display=(app.opt&1024) ? "block" : "none";							
			if (app.opt&16  && app.show&16) 	setOption(app.layers);								// Layers
			if (app.opt&32  && app.show&32) 	setOption(app.legend);								// Legend
			if (app.opt&64  && app.show&64) 	setOption(app.sketch);								// Sketch
			if (app.opt&128 && app.show&128) 	setOption(app.bookmarks);							// Bookmarks
			if (app.opt&256 && app.show&256) 	setOption(app.printer);								// Bookmarks
			function setOption(option) {															// SET OPTION ON
				app.mapView.ui.add(option,"top-right");												// Show
				option.visible=true;																// Show it's on
				}

		}
		app.map=new Map({ basemap:app.baseMap, ground:"world-elevation" });							// Make new map
		app.sceneView=new SceneView( { 	container:null,	map: app.map });							// 3D view (hidden)
		app.activeView=app.mapView=new MapView({													// 2D view
			container: app.container, map: app.map 													// Primary view
			});
		app.ShowOptions();																			// Hide/show options		
			
// POPOVERS			

		function AddPopovers(data) 																	// ADD POPOVERS
		{
			$("#sui-headLeft").html("<div style='margin-top:12px'>&#xe61a&nbsp;&nbspGeo-Locate</div>")	// Header text
			$("#sui-footer").html("");																// Footer text
			$("#sui-header").css("background-color","#6faaf1");										// Color header
			$("#sui-footer").css("background-color","#6faaf1");										// Color footer
			$("#plc-infoDiv").css("left","25px");	

			let i,graphic;
			let minLat=999999,minLon=999999,maxLat=-999999,maxLon=-999999;
	
			for (i=0;i<data.length;i++) {															// For each element
				if (data[i].lat < minLat)	minLat=data[i].lat;										// Get min lat
				if (data[i].lat > maxLat)	maxLat=data[i].lat;										// Get max lat
				if (data[i].lon < minLon)	minLon=data[i].lon;										// Get min lon
				if (data[i].lon > maxLon)	maxLon=data[i].lon;										// Get max lom
				graphic=new Graphic({																// Addloc new graphic
					geometry:{ type: "point", latitude:data[i].lat, longitude:data[i].lon },		// Position
					symbol:{ type: "picture-marker", url:"popover.png", width:19, height:13 },		// Shape
					attributes:data[i]																// Raw data
				});
				app.gl.add(graphic);																// Add to layer
				}	
			
			_this.extent={ 																			// Set extent based on minimax of popovers
				spatialReference:4326, 																// In lat/lon coord space
				xmax:maxLon, xmin:minLon,															// Longitude
				ymax:maxLat, ymin:minLat															// Latitude
				}	

			app.mapView.on("pointer-move", function(event) {										// HANDLE HOVER
				var screenPoint={ x: event.x, y: event.y };											// Format pos
				app.mapView.hitTest(screenPoint).then(function(response) {							// Search for graphics at the clicked location
					if (response.results.length) {													// Found at least one
						let id=response.results[0].graphic.attributes.ui;							// Get id
						event.type="mousemove";														// Make event compatible
						sui.pages.ShowPopover(id, event)
				 		}
					});
			   });		
			}
	
// ADD WIDGETS 

		if (app.opt&1)  app.mapView.ui.add(new ScaleBar({ view:app.mapView }), "bottom-left");		// Add scale widget
		if (app.opt&2)  app.mapView.ui.add(new Search({ view:app.mapView }), "top-right");			// Add Search widget
		if (app.opt&4)	document.getElementById("plc-switch-btn").addEventListener("click", function() { app.SwitchView();  });// 3D
		if (app.opt&8) {																			// Add basemap picker
			app.basePick=new BasemapGallery({ view:app.mapView, source: { portal: { url:"https://www.arcgis.com", useVectorBasemaps: true } }, visible:false }); 
			document.getElementById("plc-base-btn").addEventListener("click", function() { app.ToggleOption(app.basePick); });	 // Add button handler
			}
		if (app.opt&16) {																			// Layer list
			app.layers=new LayerList({ view:app.mapView, visible:false });							// Add widget							
				document.getElementById("plc-layer-btn").addEventListener("click", function() { app.ToggleOption(app.layers);  });	// Add button handler
			}
		if (app.opt&32) {																			// Legend
			app.legend=new Legend({ view:app.mapView, visible:false });								// Add widget					
			document.getElementById("plc-legend-btn").addEventListener("click", function() { app.ToggleOption(app.legend); });	// Add button handler
			}
		if (app.opt&64) {																			// Sketch 
			app.gl=new GraphicsLayer();  app.map.add(app.gl);										// Add new graphics layer to map
			app.sketch=new Sketch({ view:app.mapView, visible:false, layer:app.gl });				// Add widget
			document.getElementById("plc-sketch-btn").addEventListener("click", function() { app.ToggleOption(app.sketch); });	// Add button handler
			}
		if (app.opt&128) {  																		// Bookmarks
			app.bookmarks=new Bookmarks({ view:app.mapView, visible:false });						// Add widget
			document.getElementById("plc-book-btn").addEventListener("click", function() { app.ToggleOption(app.bookmarks); });	 // Add button handler
			}
		if (app.opt&(512|1024)) {  																	// Measurement
			app.measurement=new Measurement();														// Add widget
			app.mapView.set({ container: "plc-main" });												// Holder for measuring dialog
				app.mapView.ui.add(app.measurement, "bottom-right");								// Set bottom right
				app.measurement.view=app.mapView;													// Tie to view
			document.getElementById("plc-dist-btn").addEventListener("click", ()=>{ 				// HANDLE DISTANCE CLICK
				if (app.measurement.activeTool == "distance") app.measurement.clear();				// Clear
				else										  app.measurement.activeTool="distance"; // Start measurinng
				});
			document.getElementById("plc-area-btn").addEventListener("click", ()=>{ 				// HANDLE AREA CLICK
				if (app.measurement.activeTool == "area")	app.measurement.clear();				// Clear
				else										app.measurement.activeTool="area"; 		// Start measurinng
				});
			}
	


		// POSITION

		app.mapView.when(function() { 																// When 2D map loads
			if (_this.popovers)				AddPopovers(_this.popovers);							// Add popovers if any
			if (_this.geoJSON)				app.AddGeoJSON(_this.geoJSON);							// Add GeoJSON to map and go there
			else if (_this.extent)			app.GoToExtent(_this.extent);							// If an extent given			
			else if (!app.map.portalItem) 	app.mapView.goTo({ center:app.center, zoom:app.zoom });	// Center	
			sui.LoadingIcon(false);																	// Hide loading icon
			_this.showing=true;																		// Been shown	
			});
		app.sceneView.when(function() { app.sceneView.goTo({ tilt:80 }); });						// When 3D loads, tilt

// HELPER FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		app.ToggleOption=function(option) {															// HIDE/SHOW WIDGET OPTION
			if (option.visible)	app.activeView.ui.remove(option);									// If visible, hide
			else				app.activeView.ui.add(option,"top-right");							// Else show
			option.visible=!option.visible;															// Toggle flag (why?)
			};

		app.GoToExtent=function(extent) {															// SET NEW EXTENT
			app.mapView.goTo({ extent:new Extent(extent) });										// Set view to extent
			};

		app.SwitchView=function() { 																// SWITCH 2D/3D MODE
			var is3D=app.activeView.type === "3d";													// Current mode												
			var activeViewpoint=app.activeView.viewpoint.clone();									// Clone viewport
			app.activeView.container=null;															// Hide current one
			
			if (is3D) {																				// If 3D now
				app.activeView=app.mapView;															// Use 2D view
				document.getElementById("plc-switch-btn").value="3D";								// Set button
				} 
			else{																					// If 2D now
				app.activeView=app.sceneView;														// Use 2D view
				document.getElementById("plc-switch-btn").value="2D";								// Set button
				}
			app.activeView.viewpoint=activeViewpoint;												// Set viewport
			app.activeView.container=app.container;													// Set container
			};		

		app.AddGeoJSON=function(data) {																// ADD GEOJSON TO MAP
			data=URL.createObjectURL(new Blob([data], {type: "text"}));								// Make into URL
			app.geoJSON=new GeoJSONLayer({ url:data });												// Make new layer
			app.map.add(app.geoJSON);																// Add it to map
			app.mapView.whenLayerView(_this.app.geoJSON).then(function() {							// When layer is ready
				app.geoJSON.queryExtent().then(function(response) {									// Get extent
					_this.extent=response.extent;													// Save in case o view is not up yet
					app.mapView.goTo(response.extent);												// Zoom to extent
					});
				});
			}
		
		
		});																							// Require closure
	}																								// End Draw()

	GeoLocate()																				// GET EXTENT FROM PLACE PATH TREE IN KMAP
	{
		let loc="";
		this.extent=null;																		// Assume not found
		var _this=this;																			// Save context
		try{
			for (let i=this.kmap.ancestors_txt.length-1;i>0;--i)								// For each ancestor backwards
			loc+=this.kmap.ancestors_txt[i]+"%20";												// Add name
			if (this.kmap.ancestors_txt.length == 1) loc=this.kmap.ancestors_txt[0];			// Top level places
			let url="//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=pjson&SingleLine="+loc;
			$.ajax( { url: url, dataType: 'jsonp' } ).done(function(res) {						// Run query
				_this.extent=res.candidates[0].extent;											// Extract extent
				_this.extent.spatialReference=res.spatialReference.wkid;						// Set ref
				if (_this.showing) _this.app.GoToExtent(_this.extent);							// If already showing a map, go there
			});	
		} catch(e) {};	
	}

/////////////////////////////////////////////////////////////////////////////////////////////////
// META DATA
/////////////////////////////////////////////////////////////////////////////////////////////////

	DrawContent()																		// DRAW TABS AND CAPTION INFO
	{
		let str="<div id='sui-topCon' style='margin-left:192px'>";								// Top content div
		if (this.kmap.caption) str+="<div style='margin:5px 0 13px 0' class='sui-sourceText'>"+this.kmap.caption+"</div>";	// Add caption
		str+=sui.pages.DrawTabMenu(["MAP","NAMES","LOCATION"]);									// Add tab menu
		str+="</div><div class='plc-main' id='plc-main' ></div>";								// Map holder
		$(this.div).html(str.replace(/\t|\n|\r|/g,""));											// Add to div
		$("#plc-main").css("height",$("#sui-main").height()*.667+"px");							// Fill 2/3rds
		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			this.ShowTab(e.currentTarget.id.substring(10));										// Get index of tab	and draw it
			});
		}

	DrawMetadata(related)																	// SHOW PLACES METADATA
	{
		if (this.popovers) {																	// Has popovers
			$(this.div).html("<div class='plc-main' id='plc-main'></div>");						// Add to div
			$("#plc-main").css({ "margin":0, "width":"100%", "height":$("#sui-results").height()+"px"});	// Resize map area															
			return;																				// Don't need any metadata or tabs
			}
		this.GeoLocate();																		// Get extent
		this.DrawContent();																		// Draw tabset and captions is not related subject/places
		this.ShowTab(related ? related : 0);													// Show tab contents
		sui.pages.DrawRelatedAssets(this.kmap);													// Draw related assets menu
		sui.GetChildNamesFromID("places", this.kmap.id, (d)=> {									// Get name from children
			let i,o,oo,l=[];
			let str=`<div style='display:inline-block;width:50%'><br>
			<div style='font-weight:bold;color:#6faaf1;margin-bottom:8px'>NAMES</div>`;
			if (d && d[0] && d[0]._childDocuments_ && d[0]._childDocuments_.length) {			// If docs
				for (i=0;i<d[0]._childDocuments_.length;++i) {									// For each one
					o=d[0]._childDocuments_[i];													// Point at it
					oo={};																		// Clear obj
					oo.lab=o.related_names_header_s;											// Label
					oo.lang=o.related_names_language_s;											// Language
					oo.rel=o.related_names_relationship_s;										// Relationship
					oo.write=o.related_names_writing_system_s;									// Writing system
					oo.ety=o.related_names_etymology_s;											// Etymology
					oo.path=o.related_names_path_s;												// Path
					oo.tab=o.related_names_level_i-1;
					l.push(oo);																	// Add to array
					}
				l.sort(function(a, b) {															// Sort by path								
						if (a.path > b.path) 		return 1;									// Higher
						else if (a.path < b.path) 	return -1;									// Lower
						else						return 0;									// The same
						});
					}
			for (i=0;i<l.length;++i) {															// For each one
				str+=`<div style='margin-left:${l[i].tab*16}px'>`;								// Header
				if (i) str+="&bull; ";															// Add bullet
				str+=`<b>${l[i].lab} </b>&nbsp; (${l[i].lang}, ${l[i].write}, ${l[i].rel})</div>`;	// Text
				}
			str+=`<br></div><div style='display:inline-block;width:calc(50% - 24px);vertical-align:top;border-left:1px solid #ccc; padding-left:12px;margin-top:22px'>
			<div style='font-weight:bold;color:#6faaf1;margin-bottom:8px'>ETYMOLOGY</div>`;
			for (i=0;i<l.length;++i) 															// For each one
				if (l[i].ety)	str+=`<div>Etymology for <b>${l[i].lab}</b>: &nbsp; ${l[i].ety}</div>`; // Text
			str+="</div><br>";
			this.content[1]=str.replace(/\t|\n|\r|/g,"");										// Set tab											
			});
	
		sui.GetRelatedFromID(this.kmap.uid,(data)=> { 											// Load data
			let i;
			if (data[0].illustration_external_url && data.illustration_external_url[0]) {		// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data[0].illustration_external_url[0]);			// Show it
				}
			else if (data[0].illustration_mms_url && data[0].illustration_mms_url[0]) {			// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data[0].illustration_mms_url[0]);				// Show it
				}
			this.AddRelatedTabs();																// Add related places/context tab controls
			this.AddRelatedPlaces(this.kmap,data,this.content2,0);								// Add related place context html
			this.AddRelatedSubjects(this.kmap,data);											// Add related subjects html
			this.geoJSON=`{"type":"FeatureCollection", "features": [
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-116.51433,33.10683,9.01]},"properties":{"mag":0.85,"place":"9km ENE of Julian, CA","time":1560962164830,"title":"M 0.9 - 9km ENE of Julian, CA","depth":9.01}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-119.7572,39.6002,8.3]},"properties":{"mag":0.9,"place":"1km ENE of Sun Valley, Nevada","time":1560960042110,"title":"M 0.9 - 1km ENE of Sun Valley, Nevada","depth":8.3}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-149.7198,62.885,74.5]},"properties":{"mag":1.3,"place":"65km NNE of Talkeetna, Alaska","time":1560959595205,"title":"M 1.3 - 65km NNE of Talkeetna, Alaska","depth":74.5}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-149.3776,62.9519,66.2]},"properties":{"mag":1.1,"place":"53km SSW of Cantwell, Alaska","time":1560959262391,"title":"M 1.1 - 53km SSW of Cantwell, Alaska","depth":66.2}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-115.4425,36.6505,6.9]},"properties":{"mag":1.1,"place":"56km NW of Nellis Air Force Base, Nevada","time":1560959154530,"title":"M 1.1 - 56km NW of Nellis Air Force Base, Nevada","depth":6.9}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-149.4757,60.7773,14]},"properties":{"mag":1.4,"place":"43km W of Whittier, Alaska","time":1560958496752,"title":"M 1.4 - 43km W of Whittier, Alaska","depth":14}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-154.2321,57.7775,62.2]},"properties":{"mag":1.5,"place":"30km NNW of Larsen Bay, Alaska","time":1560957405745,"title":"M 1.5 - 30km NNW of Larsen Bay, Alaska","depth":62.2}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-119.7658,39.6,9.5]},"properties":{"mag":0.9,"place":"0km ENE of Sun Valley, Nevada","time":1560957112840,"title":"M 0.9 - 0km ENE of Sun Valley, Nevada","depth":9.5}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-140.7342,60.5606,18.9]},"properties":{"mag":1.3,"place":"108km ENE of Cape Yakataga, Alaska","time":1560956892229,"title":"M 1.3 - 108km ENE of Cape Yakataga, Alaska","depth":18.9}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-148.6673,60.8276,18.5]},"properties":{"mag":1.3,"place":"6km N of Whittier, Alaska","time":1560956487970,"title":"M 1.3 - 6km N of Whittier, Alaska","depth":18.5}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-122.85183,38.82817,2.03]},"properties":{"mag":0.9,"place":"10km NW of The Geysers, CA","time":1560955795230,"title":"M 0.9 - 10km NW of The Geysers, CA","depth":2.03}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-123.06333,39.03217,3.31]},"properties":{"mag":3.16,"place":"13km W of Lakeport, CA","time":1560954977080,"title":"M 3.2 - 13km W of Lakeport, CA","depth":3.31}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-119.7648,39.6023,9.3]},"properties":{"mag":1,"place":"1km NE of Sun Valley, Nevada","time":1560954850870,"title":"M 1.0 - 1km NE of Sun Valley, Nevada","depth":9.3}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-119.7567,39.5923,1.5]},"properties":{"mag":1.6,"place":"1km ESE of Sun Valley, Nevada","time":1560954720260,"title":"M 1.6 - 1km ESE of Sun Valley, Nevada","depth":1.5}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-147.3933,63.666,75.6]},"properties":{"mag":1.4,"place":"80km ESE of Healy, Alaska","time":1560953957416,"title":"M 1.4 - 80km ESE of Healy, Alaska","depth":75.6}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-120.56133,36.00517,3.28]},"properties":{"mag":1.12,"place":"17km NW of Parkfield, CA","time":1560953939420,"title":"M 1.1 - 17km NW of Parkfield, CA","depth":3.28}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-117.66883,36.11733,3.62]},"properties":{"mag":0.65,"place":"26km ENE of Coso Junction, CA","time":1560952795020,"title":"M 0.7 - 26km ENE of Coso Junction, CA","depth":3.62}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-119.7332,39.6033,0]},"properties":{"mag":1.8,"place":"3km ENE of Sun Valley, Nevada","time":1560952611730,"title":"M 1.8 - 3km ENE of Sun Valley, Nevada","depth":0}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-141.2967,60.1453,3.8]},"properties":{"mag":1.4,"place":"63km E of Cape Yakataga, Alaska","time":1560952497532,"title":"M 1.4 - 63km E of Cape Yakataga, Alaska","depth":3.8}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-155.2915,19.4175,-0.15]},"properties":{"mag":1.8,"place":"5km WSW of Volcano, Hawaii","time":1560951948410,"title":"M 1.8 - 5km WSW of Volcano, Hawaii","depth":-0.15}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-112.55833,46.912,12.49]},"properties":{"mag":2.23,"place":"10km ESE of Lincoln, Montana","time":1560951912930,"title":"M 2.2 - 10km ESE of Lincoln, Montana","depth":12.49}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-157.2126,66.3306,0]},"properties":{"mag":0.8,"place":"65km SSW of Kobuk, Alaska","time":1560951540390,"title":"M 0.8 - 65km SSW of Kobuk, Alaska","depth":0}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-116.52717,33.10483,7.68]},"properties":{"mag":2.76,"place":"8km ENE of Julian, CA","time":1560951254500,"title":"M 2.8 - 8km ENE of Julian, CA","depth":7.68}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-117.91533,36.111,3.8]},"properties":{"mag":0.8,"place":"8km NNE of Coso Junction, CA","time":1560951089350,"title":"M 0.8 - 8km NNE of Coso Junction, CA","depth":3.8}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-143.7007,69.7073,10.4]},"properties":{"mag":1.7,"place":"47km S of Kaktovik, Alaska","time":1560950971062,"title":"M 1.7 - 47km S of Kaktovik, Alaska","depth":10.4}},
				{"type":"Feature","geometry":{"type":"Point","coordinates":[-120.47667,35.92283,2.94]},"properties":{"mag":1.07,"place":"5km NW of Parkfield, CA","time":1560950439360,"title":"M 1.1 - 5km NW of Parkfield, CA","depth":2.94}}
				]}`;
				for (i=0;i<data.length;++i) {
					if (data[i].block_child_type == "places_altitude")	trace(data[i].estimate_s+" "+data[i].unit_s)	
//					if (data[i].block_child_type == "places_shape")		this.geoJSON='{"type":"FeatureCollection", "features": ['+data[i].geometry_grptgeom[0]+']}';	
					}
					
//				this.geoJSON=null
				});
	}	

	ShowTab(which)																			// OPEN TAB
	{	
		let _this=this;
		$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });					// Reset all tabs
		$("#sui-tabContent").css({display:"block","background-color":"#eee"});					// Show content
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		if (which == 0)		$("#plc-main").slideDown();											// Show map
		else				$("#plc-main").slideUp();											// Hide map
		if (which > 2)		$("#sui-topCon").html(this.content[which]);							// If related subjects/places
		else				$("#sui-tabContent").html(this.content[which]);						// Set content
		if (which == 4) {																		// Related places
			$("#sui-tabContent").css({display:"block","background-color":"#eee"});				// Show content
			$("#sui-tabTabB0").css({"background-color":"#eee",color:"#000"});					// Active tab
			$("#sui-tabTabB0").css({"background-color":"#eee",color:"#000"});					// Active tab
			$("#sui-tabContent").html(this.content2[0]);										// Set content
			$("[id^=sui-spLab-]").on("click", function(e) {return false;	});					// ON CONTEXT LINE CLICK, INHIBIT
			$("[id^=sui-spDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				let path=e.currentTarget.id.substring(10);										// Get id
				if (path != "null") sui.pages.AddRelBranch(_this.kmap.asset_type,path,$(this));	// Lazy load branch
				$(this).html("&ndash;"); 														// Change label
				$(this).parent().find('ul').slideToggle();            							// Slide into place
				});
			}
		$("#sui-spLab-"+this.kmap.uid).css({ "font-weight":"bold", "text-decoration": "underline" });	// Highlight current one	
	}

	AddRelatedTabs()																		// ADD TAB CONTROLS FOR RELATED PLACES/SUBJECTS
	{
		let str=drawTabB(["PLACE CONTEXT","RELATED PLACES"]);									// Add tab menu
		this.content[4]=str.replace(/\t|\n|\r|/g,"");											// Set content for related places
		$("[id^=sui-tabTabB]").on("click", (e)=> {												// ON TAB CLICK
			let which=e.currentTarget.id.substring(11);											// Get index of tab	and draw it
			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spItem-]").off("click");												// Kill handler
			$("[id^=sui-togCat-]").off("click");												// Kill handler
			$("[id^=sui-spCatUL-]").off("click");												// Kill handler
			$("[id^=sui-tabTabB]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-tabContent").css({display:"block","background-color":"#eee"});				// Show content
			$("#sui-tabTabB"+which).css({"background-color":"#eee",color:"#000"});				// Active tab
			$("#sui-tabTabB"+which).css({"background-color":"#eee",color:"#000"});				// Active tab
			$("#sui-tabContent").html(this.content2[which]);									// Set content
		
			$("[id^=sui-spDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				let firstChild=$(this).parent().find("ul")[0];									// Get first child
				let path=e.currentTarget.id.substring(10);										// Get id
				if (path != "null") sui.pages.AddRelBranch(_this.kmap.asset_type,path,$(this));	// Lazy load branch
				$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 		// Change label
				$(this).parent().find('ul').slideToggle();            							// Slide into place
				});
			$("[id^=sui-spLab-]").on("click",  function(e) {	return false;		});			// ON CONTEXT LINE CLICK, INHIBIT
			$("[id^=sui-spItem-]").on("click", function(e) {	return false;		});			// ON LINE CLICK, INHIBIT
			$("[id^=sui-spCatUL-]").slideDown();												// All down
			$("[id^=sui-spCat-]").on("click", (e)=> {											// ON CATEGORY CLICK
				let id=e.currentTarget.id.substring(9);											// Get id
					if ($("#sui-spCatUL"+id).css("display") == "none")							// If hidden
					$("#sui-spCatUL"+id).slideDown();											// Show
				else																			// If showing
					$("#sui-spCatUL"+id).slideUp();												// Hide
				});
			$("[id^=sui-spSub-]").on("click", (e)=> {											// ON SUB-CATEGORY CLICK
				let id=e.currentTarget.id.substring(9);											// Get id
				if ($("#sui-spSubUL"+id).css("display") == "none")								// If hidden
					$("#sui-spSubUL"+id).slideDown();											// Show
				else																			// If showing
					$("#sui-spSubUL"+id).slideUp();												// Hide
				});
			$("#sui-togCatA").on("click", ()=> {												// ON EXPAND ALL
				$("[id^=sui-spCatUL-]").slideDown();											// All down
				});
			$("#sui-togCatN").on("click", ()=> {												// ON COLLAPSE ALL
				$("[id^=sui-spCatUL-]").slideUp();												// All down
				});
		});

		function drawTabB(tabs)	{																// DRAW TAB MENU
			let i, str="";														
			for (i=0;i<tabs.length;++i) 														// For each tab	
				str+=`<div class='sui-tabTab' id='sui-tabTabB${i}' style='width:calc(${100/tabs.length}% - 2px)'>${tabs[i]}&nbsp;&#xe609</div>`;
			str+="<div class='sui-tabContent' id='sui-tabContent'></div>";						// Tab contents
			return str.replace(/\t|\n|\r|/g,"");												// Return tab markup
			}		
		}

	AddRelatedPlaces(o, d, content)																// ADD RELATED PLACES CONTENTS 
	{	
		let n=0,sups=0;
		if (d[0].ancestors && d[0].ancestors.length > 2) sups=d[0].ancestors.length-2;
		let str=`<br><div class='sui-spHead'>Places related to ${o.title}</div>
		<div style='max-width:900px'>
		<b>${o.title[0]}</b> has <b>${sups}</b> superordinate places and<b> TBD </b> immediately subordinate places. 
		You can browse these subordinate places as well as its superordinate categories with the tree below. 
		See the RELATED PLACES tab if you instead prefer to view only its immediately subordinate places grouped together in useful ways, 
		as well as places non-hierarchically related to it.</div><br>
		<ul class='sui-spLin' id='sui-spRows'>`;
		if (o.asset_type == "subjects") {														// If subjects assets
			content[0]=str.replace(/\t|\n|\r/g,"")+"</ul><br>";									// Set 1st content array member with html
			return;		
			}
		if (!d[0].ancestors)	return;															// No ancestors
		for (n=0;n<d[0].ancestors.length-1;++n) {												// For each ancestor (skipping Earth)
			str+="<ul style='list-style-type:none'>";											// Add header
			str+=sui.pages.AddRelTreeLine(d[0].ancestors[n+1],d[0].ancestor_uids_generic[n+1],"&ndash;",null); // Add it 
			}
	
		sui.GetTreeChildren(o.asset_type,d[0].ancestor_id_path,(res)=>{							// Get children
			let i,j,re,m,path;
			let counts=[];
			try { counts=res.facets.child_counts.buckets; } catch(e) {}							// Get child counts
			res=res.response.docs;																// Point at docs
			for (i=0;i<res.length;++i) {														// For each child
				path="";	m=null;																// Assume a loner												
				re=new RegExp(res[i].id.split("-")[1]);											// Get id to search on
				for (j=0;j<counts.length;++j) {													// For each count
					if (counts[j].val.match(re)) {												// In this one
						m="+";																	// Got kids
						path=counts[j].val;														// Add path
						}
					}												
				str+="<ul style='list-style-type:none'>";										// Header
				str+=sui.pages.AddRelTreeLine(res[i].header,res[i].id,m,path)+"</li></ul>"; 	// Add it
				}
			
			for (i=0;i<d[0].ancestors.length;++i) str+="</li></ul>";							// Close chain
			content[0]=str.replace(/\t|\n|\r/g,"")+"</ul><br>";									// Set 1st content array member with html
			});
		
		this.AddRelatedContext(o,d,content);													// Get context
		}

	AddRelatedContext(o, c, content)															// ADD PLACE CONTEXT CONTENT 	
	{	
			let f,i,s=[],n=0;
			for (i=0;i<c.length;++i) {																// For each subject get data as 's=[category[{title,id}]]' 
				if (c[i].block_child_type != "related_places") continue;							// Add only related places
				if (c[i].related_places_header_s == "Earth")   continue;							// Skip earth
				++n;																				// Add to count
				if (!s[c[i].related_places_relation_label_s])										// If first one of this category 
						s[c[i].related_places_relation_label_s]=[];									// Alloc category array
				s[c[i].related_places_relation_label_s].push({										// Add subject to category 
					title:c[i].related_places_header_s,												// Add title
					sub:c[i].related_places_feature_type_s,											// Sub category
					id:c[i].related_uid_s });														// Add id
				}											
			
			let biggest=Object.keys(s).sort((a,b)=>{return a.length > b.length ? -1 : 1;})[0];		// Find category with most elements	 
			let str=`<br><div class='sui-spHead'>Places related to ${o.title}</div>
			<div style='max-width:900px'>
			<b>${o.title[0]}</b> has <b>${"TBD"}</b> other place${(n > 1) ? "s": ""} directly related to it, which is presented here. 
			See the PLACE CONTEXT tab if you instead prefer to browse all subordinate and superordinate places for ${o.title[0]}.</div>
			<p><a class='sui-advEditBut' id='sui-togCatA'>Expand all</a> / <a class='sui-advEditBut' id='sui-togCatN'>Collapse all</a>
			</p><div style='width:100%'><div style='width:50%;display:inline-block'>`;
			str+=drawCat(biggest)+"</div><div style='display:inline-block;width:50%;vertical-align:top'>";	// Add biggest to 1st column, set up 2nd	 
			for (f in s) if (f != biggest)	str+=drawCat(f);										// For each other category, draw it in 2nd column
			str+="</div></div>";
			content[1]=str.replace(/\t|\n|\r/g,"")+"</ul><br>";										// Set 2nd content array member with html

			function drawCat(f) {																	// DRAW CATEGORY
				let sub="xxx";
				s[f]=s[f].sort((a,b)=>{ return a.sub < b.sub ? -1 : 1;});							// Sort by sub category
				let str=`<div id='sui-spCat-${f.replace(/ /g,"_")}' 
				class='sui-spCat' style='background-color:${sui.assets[o.asset_type].c}'> ${o.title} ${f}</div>
				<ul id='sui-spCatUL-${f.replace(/ /g,"_")}'><ul>`;
				for (i=0;i<s[f].length;++i)	{														// For each item
					if (sub != s[f][i].sub) {														// A new sub category
						sub=s[f][i].sub;															// New sub
						str+="</ul><div class='sui-spSubCat'>";										// End last sub container ul, add sub container div
						str+="<div style='background-color:#999' class='sui-spDot' id='sui-spSub-"+s[f][i].id+"'>&ndash;</div>";	// Add folding dot
						str+="<b>"+sub+"</b></div>";												// Add sub title
						str+="<ul id='sui-spSubUL-"+s[f][i].id+"' style='list-style-type:none'>";	// Add new container ul
						}
					str+="<li style='list-style-type:none'><a class='sui-noA' id='sui-spItem-"+s[f][i].id;
					str+="' href='#p="+s[f][i].id+"'>";												// Add url
					str+=s[f][i].title+"</a>"+sui.pages.AddPop(s[f][i].id)+"</li>";					//Add title it with popover
					}
				return str+"</ul></ul>";															// Close category and sub container ul
				}
		}
	

	AddRelatedSubjects(o,c)																		// ADD RELATED SUBJECTS CONTENT 	
	{	
		let i,s=[],ss;
		let str=`<div style='width:50%;vertical-align:top'>
			<div class='sui-spHead'>Subjects related to ${o.title}</div>`;
		if (o.feature_types_ss && o.feature_types_ss.length) {									// If feature types
			str+=`<div class='sui-spCat' style='background-color:#6faaf1'>
			Feature Types</div>
			<div style='margin-left:24px'>`;													// Header
			for (i=0;i<o.feature_types_ss.length;++i) 											// For each feature
				str+="<li>"+o.feature_types_idfacet[i].split("|")[0]+sui.pages.AddPop(o.feature_types_idfacet[i].split("|")[1])+"</li>";  // Add
			str+="</div><br>"
			}
		for (i=0;i<c.length;++i) {																// For each subject get data  
			if (c[i].block_child_type != "related_subjects") continue;							// Add only related subjects
			ss=c[i].related_subjects_display_string_s;											// Add title
			if (c[i].related_subjects_time_units_t && c[i].related_subjects_time_units_t[0])	// If a time
				ss+=` (${c[i].related_subjects_time_units_t[0]})`;								// Add it to title
			s.push({ title:ss, id:c[i].related_subjects_id_s });								// Add title and id
			}											
		if (s.length) {																			// If subjects
			str+=`<div class='sui-spCat' style='background-color:#6faaf1'>
				Related subjects</div>
				<div style='margin-left:24px'>`;												// Header
			for (i=0;i<s.length;++i) 															// For each subject  
				str+="<li>"+s[i].title+sui.pages.AddPop(s[i].id)+"</li>";						// Add it
			}
		str+="</div>";																			// End half div
		this.content[3]=str.replace(/\t|\n|\r|/g,"");											// Set summary tab
	}

} // Places class closure
