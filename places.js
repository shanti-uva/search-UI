/* PLACES

	Requires: 	jQuery 												// Almost any version should work
	Images:		img/basemapicon.gif,
				img/layericon.png
				img/legendicon.gif
				img/sketchicon.gif
				img/bookmarkicon.gif

	ESRI:		https://js.arcgis.com/4.12
				https://js.arcgis.com/4.12/esri/themes/light/main.css

	opt: 		Bitmapped: 1=Scale | 2=Search| 4=3D | 8=Base | 16=Layers | 32=Legend | 64=Sketch | 128=Bookmarks

*/

class Places  {																					

	constructor(mode)   																		// CONSTRUCTOR
	{
		this.app=null;
		this.id=null;
		$("<link/>", { rel:"stylesheet", type:"text/css", href:"https://js.arcgis.com/4.12/esri/themes/light/main.css" }).appendTo("head");
		$.ajax(		 { url:"https://js.arcgis.com/4.12", dataType: "script"  }); 
	}

	Draw(id)
	{
		this.id=id;
		sui.LoadingIcon(true,64);																	// Show loading icon
		var app={ container:"plc-main",																// Holds startup parameters													
			map:null, baseMap:"topo-vector", kml:null, 								
			mapView: null,  sceneView: null, activeView:null, opt:4|8|64,
			bookmarks:null, legend:null, layers:null, basePick:null, sketch:null,				
			  center: [91.1721, 29.6524], zoom:12, tilt:80,
			reqs:["esri/Map","esri/WebMap", "esri/views/MapView", "esri/views/SceneView", "esri/layers/KMLLayer", "esri/core/watchUtils"]
	   		};
	
/*		app.kml=`http://www.thlib.org:8080/thdl-geoserver/wms
			?LAYERS=thl:roman_popular_poly,thl:roman_popular_pt,thl:roman_popular_line
			&TRANSPARENT=TRUE&SPHERICALMERCATOR=true&PROJECTION=EPSG:900913&UNITS=m
			&GEOSERVERURL=http://www.thlib.org:8080/thdl-geoserver
			&STYLES=thl_noscale,thl_noscale,thl_noscale
			&CQL_FILTER=fid=${id};fid=${id};fid==${id}
			&SERVICE=WMS&SRS=EPSG:900913&FORMAT=kml&VERSION=1.1.1
			&BBOX=3159514.209965,-1447629.9642176,20066161.87184,9001617.5490246
			&WIDTH=864&HEIGHT=53
			&REQUEST=GetMap`.replace(/\t|\n|\r|/g,"")
*/		
		this.app=app;	   
		if (app.opt&1)	 app.reqs.push("esri/widgets/ScaleBar");									// Scalebar if spec'd
		if (app.opt&2)	 app.reqs.push("esri/widgets/Search");										// Search
		if (app.opt&8)	 app.reqs.push("esri/widgets/BasemapGallery");								// Basepicker 
		if (app.opt&16)	 app.reqs.push("esri/widgets/LayerList");									// Layerlist 
		if (app.opt&32)  app.reqs.push("esri/widgets/Legend");										// Legend
		if (app.opt&64)	 app.reqs.push("esri/widgets/Sketch"),app.reqs.push("esri/layers/GraphicsLayer");	// Sketch
		if (app.opt&128) app.reqs.push("esri/widgets/Bookmarks");									// Bookmarks 
	
		require(app.reqs, function() {															// LOAD ArcGIS MODULES
			var i,key;
			var Map,WebMap,MapView,SceneView,KMLLayer;
			var ScaleBar,Search,BasemapGallery,LayerList,Legend,Sketch,GraphicsLayer,Bookmarks,watchUtils;
			for (i=0;i<app.reqs.length;++i)	{														// For each required module
				key=app.reqs[i].match(/([^\/]+)$/i)[1];												// Extract variable name
				if (key == "Map") 					Map=arguments[i];								// Set variable
				else if (key == "WebMap")			WebMap=arguments[i];
				else if (key == "MapView")			MapView=arguments[i];
				else if (key == "SceneView")		SceneView=arguments[i];
				else if (key == "KMLLayer")			KMLLayer=arguments[i];
				else if (key == "watchUtils")		watchUtils=arguments[i];
				else if (key == "ScaleBar")			ScaleBar=arguments[i];
				else if (key == "Search")			Search=arguments[i];
				else if (key == "BasemapGallery")	BasemapGallery=arguments[i];
				else if (key == "LayerList")		LayerList=arguments[i];
				else if (key == "Legend")			Legend=arguments[i];
				else if (key == "Sketch")			Sketch=arguments[i];
				else if (key == "GraphicsLayer")	GraphicsLayer=arguments[i];
				else if (key == "Bookmarks")		Bookmarks=arguments[i];
				}
					
		if (!$("#plc-switch-btn").length) {															// If not initted yet
			var str=`<div id="plc-infoDiv">
				<input class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-switch-btn" value="3D"             title="Change view" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-base-btn"   src="basemapicon.gif"  title="Change base map"/>
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-layer-btn"  src="layericon.png"    title="Show list of layers" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-legend-btn" src="legendicon.gif"   title="Show legend" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-sketch-btn" src="sketchicon.gif"   title="Show sketch" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-book-btn"   src="bookmarkicon.gif" title="Show bookmarks" />		
				</div>`;
			$("#sui-main").append(str);
			}
	
		var str="<div style='position:absolute;text-align:center'>";											
		str+="<div style='margin-bottom:8px'>RELATED ASSETS</div>";									// Title
		str+="<div id='plc-typeList' class='plc-typeList'>";										// Enclosing div for list
		for (var k in sui.assets) {																	// For each asset type														
			var n=sui.assets[k].n;																	// Get number of items
			if (n > 1000)	n=Math.floor(n/1000)+"K";												// Shorten
			str+="<div class='sui-typeItem' id='sui-tl-"+k+"'><span style='font-size:18px;line-height:24px; vertical-align:-3px; color:"+sui.assets[k].c+"'>"+sui.assets[k].g+" </span> "+k+" ("+n+")</div>";
			}
		str+="</div><div style='margin:8px'>PLACES</div>";									// Title
		str+="<div class='sui-advEdit' id='sui-advEdit-map' style='margin:0;width:146px'></div>";
		str+="</div><div style='width:calc(100% - 177px);height:75%;margin-left:177px' id='plc-main'></div>";
		str+=`<br><img src='https://staging-mms.thlib.org/images/0050/8753/63691_essay.jpg' style='float:left;height:100px;margin:0 12px 0 177px'>
		<b>FEATURE TYPE:</b> <i>City &#xe613 ADM3 &#xe613 Capital of a 1st order administrative division</i>
		<p style='font-family:serif;max-width:900px'>Lhasa is the most important city in modern and historical Tibet, both religiously and politically; located in the geographical center of central Tibet, it is home to the sacred center of Tibet in the Jokhang Temple and the famed Potala Palace, from which the Dalai Lamas ruled over Tibet.</p>`;
		$("#sui-results").html(str.replace(/\t|\n|\r|/g,""));
		sui.DrawFacetTree("map",1);	
		$("[id^=sui-tl-]").on("click", (e)=> {														// ON CLICK ON ASSET 
			sui.ss.type=e.currentTarget.id.substring(7);											// Get asset name		
			$("#sui-typeList").remove();															// Remove type list
			sui.ss.page=0;																			// Start at beginning
			sui.Query(); 																			// Get new results
			});	

		app.ShowOptions=function() {																// SHOW ACTIVE OPTIONS
			document.getElementById("plc-switch-btn").style.display=(app.opt&4) ? "block" : "none";	// Hide/show icons
			document.getElementById("plc-base-btn").style.display=(app.opt&8) ? "block" : "none";							
			document.getElementById("plc-layer-btn").style.display=(app.opt&16 && (app.map.portalItem || app.kml)) ? "block" : "none";							
			document.getElementById("plc-legend-btn").style.display=(app.opt&32 && app.map.portalItem)  ? "block" : "none";						
			document.getElementById("plc-sketch-btn").style.display=(app.opt&64) ? "block" : "none";						
			document.getElementById("plc-book-btn").style.display=(app.opt&128 && app.map.bookmarks) ? "block" : "none";							
			if (app.opt&16  && app.show&16) 	setOption(app.layers);								// Layers
			if (app.opt&32  && app.show&32) 	setOption(app.legend);								// Legend
			if (app.opt&64  && app.show&64) 	setOption(app.sketch);								// Sketch
			if (app.opt&128 && app.show&128) 	setOption(app.bookmarks);							// Bookmarks
			
			function setOption(option) {															// SET OPTION ON
				app.mapView.ui.add(option,"top-right");												// Show
				option.visible=true;																// Show it's on
				}
			}
		app.map=new Map({ basemap:app.baseMap});													// Make new map
		app.sceneView=new SceneView( { 	container:null,	map: app.map });							// 3D view (hidden)
		app.activeView=app.mapView=new MapView({													// 2D view
			container: app.container, map: app.map, 												// Primary view
			ground: "world-elevation"
			});
		app.ShowOptions();																			// Hide/show options		
		
		if (app.kml) {																				// Add KML/KMZ if spec'd	
			app.kml=new KMLLayer({ url:app.kml });													// Make new layer
			app.map.add(app.kml);																	// Add it to map
			app.mapView.whenLayerView(app.kml).then(function(layerView) {
				watchUtils.whenFalseOnce(layerView, "updating", function() {
					var polygons=layerView.allVisiblePolygons;
					var lines=layerView.allVisiblePolylines;
					var points=layerView.allVisiblePoints;
					var images=layerView.allVisibleMapImages;
					var kmlFullExtent=polygons.concat(lines).concat(points).concat(images)
					.map(graphic => (graphic.extent ? graphic.extent : graphic.geometry.extent))
					.reduce((previous, current) => previous.union(current));
					trace(kmlFullExtent)
					app.mapView.goTo({ extent: kmlFullExtent });
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
			var gl=new GraphicsLayer();  app.map.add(gl);											// Add new graphics layer to map
			app.sketch=new Sketch({ view:app.mapView, visible:false, layer:gl });					// Add widget
			document.getElementById("plc-sketch-btn").addEventListener("click", function() { app.ToggleOption(app.sketch); });	// Add button handler
			}
		if (app.opt&128) {  																		// Bookmarks
			app.bookmarks=new Bookmarks({ view:app.mapView, visible:false });						// Add widget
			document.getElementById("plc-book-btn").addEventListener("click", function() { app.ToggleOption(app.bookmarks); });	 // Add button handler
			}
			
// POSITION

		app.mapView.when(function() { 																// When 2D map loads
			if (!app.map.portalItem) app.mapView.goTo({ center:app.center, zoom:app.zoom });		// Center	
			sui.LoadingIcon(false);																	// Hide loading icon
		});
		app.sceneView.when(function() { app.sceneView.goTo({ tilt:80 }); });						// When 3D loads, tilt

		app.DrawHeader=function()																	// DRAW MAP HEADER
		{
			var n=123;
			var str=`
				<span id='sui-resClose' class='sui-resClose'>&#xe60f</span>
				LHASA&nbsp;&nbsp;<span style='font-size:12px'> Asia > China > Tibet Autonomous Region</span>
				`;
			
			$("#sui-headLeft").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
			$("#sui-headRight").html("");
			$("#sui-header").css("background-color","#6faaf1");										// Color header
			$("#sui-footer").css("background-color","#6faaf1");										// Color header
			$("#sui-main").append(str);																// Add to main div
									
			str=`<div style='float:left;font-size:18px'>
				<div id='plc-viewInfoBut' class='sui-resDisplay' title='See names'>&#xe67f</div>
				<div id='plc-customMap' class='sui-resDisplay' title='Custom/normal map'>&#xe625</div>
				</div>				
				<div style='float:right;font-size:12px'>Place id: F317 | Geocode Name: THL Extended GB Code | Code: gb.ext&nbsp;&nbsp;&nbsp;&nbsp;</div>`;
			$("#sui-footer").html(str);
			
			$("#plc-customMap").on("click", ()=> {
				if ($("#plc-infoDiv").length) {
					$("#plc-infoDiv").remove();
					var h=$("#sui-results").height()-4;
					var link="https://www.thlib.org/places/maps/interactive_ajax/#fid:"+sui.places.id;
					$("#sui-results").html("<iframe frameborder='0' src='"+link+"' style='height:"+h+"px;width:100%'></iframe>");
					}
				else sui.places.Draw(sui.places.id);
				});
	
			$("#plc-viewInfoBut").on("click", ()=> {
				$("#plc-viewInfo").remove();
				str=`<div id='plc-viewInfo' class='sui-infoBottom'>
				<div id='plc-viewInfoCancel' style='float:right;cursor:pointer;margin-top:12px'>&#xe60f</div>
				<p style='color:#668eec'><b>NAMES</p></b><span style=font-size:12px> ལྷ་ས། (Tibetan, Tibetan script, Original)<br>
				Lhasa (Tibetan, Latin script, THL Simplified Tibetan Transcription)<br>
				lha sa (Tibetan, Latin script, THL Extended Wylie Transliteration)<br>
				拉薩 (Tibetan, Traditional Chinese Characters, Tibetan-to-Chinese Transcription)<br>
				Lasa (Tibetan, Latin script, Pinyin Transcription)<br>
				拉萨 (Tibetan, Simplified Chinese Characters, Traditional-to-Simplified Chinese Transliteration)<br>
				Lhasa (Tibetan, Latin script, Ethnic Pinyin Tibetan Transcription)<br>
				ར་ས། (Tibetan, Tibetan script, Original)<br>
				Rasa (Tibetan, Latin script, THL Simplified Tibetan Transcription)<br>
				ra sa (Tibetan, Latin script, THL Extended Wylie Transliteration)</span><br>
				<p style='color:#668eec'><b>ETYMOLOGY</p></b> <span style=font-size:12px>
				Etymology for ལྷ་ས།:<br>
				Lit. "god-place," referring especially to the presence of the two famous Buddha statues traditionally housed in the Jokhang and Ramoché temples respectively, but also more generally to the location of important shrines, temples, and monasteries within the city of Lhasa.
				</span><br>
				<p style='color:#668eec'><b>LOCATION</b></p><span style=font-size:12px>103.5964, 34.0343</span>
				</div>`;
				$("#sui-results").append(str);
				$("#plc-viewInfo").slideDown();
				$("#plc-viewInfoCancel").on("click", ()=> { $("#plc-viewInfo").slideUp(); });
			});

		}

	app.DrawHeader();
		
		
// HELPER FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		app.ToggleOption=function(option)														// HIDE/SHOW WIDGET OPTION
		{
			if (option.visible)	app.activeView.ui.remove(option);									// If visible, hide
			else				app.activeView.ui.add(option,"top-right");							// Else show
			option.visible=!option.visible;															// Toggle flag (why?)
		}

		app.SwitchView=function() 																// SWITCH 2D/3D MODE
		{
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
		}		

	});	// REQUIRE() CLOSURE
	}

} // Places class closure
