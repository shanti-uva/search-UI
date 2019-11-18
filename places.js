/* 	PLACES PAGES ****************************************************************************************************************************

	Requires: 	jQuery 												// Almost any version should work
	Images:		img/basemapicon.gif,
				img/layericon.png
				img/legendicon.gif
				img/sketchicon.gif
				img/bookmarkicon.gif

	ESRI:		https://js.arcgis.com/4.12
				https://js.arcgis.com/4.12/esri/themes/light/main.css (dynamically loaded)
	Dependents:	pages.js, searchui.js								// JS modules called
	opt: 		Bitmapped: 1=Scale | 2=Search| 4=3D | 8=Base | 16=Layers | 32=Legend | 64=Sketch | 128=Bookmarks

*******************************************************************************************************************************************/

class Places  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.app=null;
		this.kmap=null;
		this.extent=null;
		this.showing=false;
		$("<link/>", { rel:"stylesheet", type:"text/css", href:"https://js.arcgis.com/4.12/esri/themes/light/main.css" }).appendTo("head");
		this.div=sui.pages.div;	
		this.content=["...loading","...loading","TBD","TBD"];
	}

	Draw(kmap)
	{
		var _this=this;																			// Save context
		this.kmap=kmap;																			// Save kmap
		this.GeoLocate();																		// Get extent
		sui.LoadingIcon(true,64);																// Show loading icon
		var app={ container:"plc-main",															// Holds startup parameters													
			map:null, baseMap:"hybrid", kml:null, 								
			mapView: null,  sceneView: null, activeView:null, opt:4|8|64,
			bookmarks:null, legend:null, layers:null, basePick:null, sketch:null,				
			  center: [91.1721, 29.6524], zoom:12, tilt:80,
			reqs:["esri/Map","esri/WebMap", "esri/views/MapView", "esri/views/SceneView", "esri/layers/KMLLayer", "esri/core/watchUtils","esri/geometry/Extent"],
			div: this.div								
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
			app.kml="https://viseyes.org/visualeyes/projects/test.kml"
*/

		this.app=app;	   
		if (app.opt&1)	 app.reqs.push("esri/widgets/ScaleBar");								// Scalebar if spec'd
		if (app.opt&2)	 app.reqs.push("esri/widgets/Search");									// Search
		if (app.opt&8)	 app.reqs.push("esri/widgets/BasemapGallery");							// Basepicker 
		if (app.opt&16)	 app.reqs.push("esri/widgets/LayerList");								// Layerlist 
		if (app.opt&32)  app.reqs.push("esri/widgets/Legend");									// Legend
		if (app.opt&64)	 app.reqs.push("esri/widgets/Sketch"),app.reqs.push("esri/layers/GraphicsLayer");	// Sketch
		if (app.opt&128) app.reqs.push("esri/widgets/Bookmarks");								// Bookmarks 

		require(app.reqs, function() {														// LOAD ArcGIS MODULES
			var i,key;
			var Map,WebMap,MapView,SceneView,KMLLayer,Extent;
			var ScaleBar,Search,BasemapGallery,LayerList,Legend,Sketch,GraphicsLayer,Bookmarks,watchUtils;
			for (i=0;i<app.reqs.length;++i)	{													// For each required module
				key=app.reqs[i].match(/([^\/]+)$/i)[1];											// Extract variable name
				if (key == "Map") 					Map=arguments[i];							// Set variable
				else if (key == "WebMap")			WebMap=arguments[i];
				else if (key == "MapView")			MapView=arguments[i];
				else if (key == "SceneView")		SceneView=arguments[i];
				else if (key == "KMLLayer")			KMLLayer=arguments[i];
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
				}

			_this.DrawMetadata();																	// Draw metadata

			if (!$("#plc-switch-btn").length) {														// If not initted yet
			var str=`<div id="plc-infoDiv">
				<input class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-switch-btn" value="3D"             title="Change view" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-base-btn"   src="basemapicon.gif"  title="Change base map"/>
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-layer-btn"  src="layericon.png"    title="Show list of layers" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-legend-btn" src="legendicon.gif"   title="Show legend" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-sketch-btn" src="sketchicon.gif"   title="Show sketch" />
				<img   class="esri-component esri-widget--button esri-widget esri-interactive" type="button" style="display:none" id="plc-book-btn"   src="bookmarkicon.gif" title="Show bookmarks" />		
				</div>`;
				$("#plc-main").append(str);
			}

		app.ShowOptions=function() {															// SHOW ACTIVE OPTIONS
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
		app.map=new Map({ basemap:app.baseMap, ground:"world-elevation" });							// Make new map
		app.sceneView=new SceneView( { 	container:null,	map: app.map });							// 3D view (hidden)
		app.activeView=app.mapView=new MapView({													// 2D view
			container: app.container, map: app.map 													// Primary view
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
			if (_this.extent)				app.GoToExtent(_this.extent);							// If an extent given			
			else if (!app.map.portalItem) 	app.mapView.goTo({ center:app.center, zoom:app.zoom });	// Center	
			sui.LoadingIcon(false);																	// Hide loading icon
			_this.showing=true;																		// Been shown	
			});
		app.sceneView.when(function() { app.sceneView.goTo({ tilt:80 }); });						// When 3D loads, tilt

		app.DrawFooter=function()																	// DRAW MAP FOOTER
		{
			var i;
			str=`<div style='float:left;font-size:18px'>
				<div id='plc-customMap' class='sui-resDisplay' title='Custom/normal map'>&#xe625</div></div>				
				<div style='float:right;font-size:14px;margin-right:16px'>PLACE ID: ${kmap.id}</div>`;
			$("#sui-footer").html(str);
			$("#plc-customMap").on("click", ()=> {
				if ($("#plc-infoDiv").length) {
					$("#plc-infoDiv").remove();
					var h=$(app.div).height()-4;
					var link="https://www.thlib.org/places/maps/interactive_ajax/#fid:"+sui.places.id;
					$(app.div).html("<iframe frameborder='0' src='"+link+"' style='height:"+h+"px;width:100%'></iframe>");
					}
				else sui.places.Draw(sui.places.id);
				});
		}

	app.DrawFooter();																				// Draw footer
		
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
			let url="http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=pjson&SingleLine="+loc;
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

	DrawMetadata()																				// SHOW PLACES METADATA
	{
		let i;
		let _this=this;
		let str="<div style='position:absolute;text-align:center'>";											
		str+="</div><div style='width:calc(100% - 192px);margin-left:192px;height:75%' id='plc-main'></div>";
		if (this.kmap.feature_types_ss && this.kmap.feature_types_ss.length) {						// If features
			str+="<div style='margin: 12px 0 6px 192px'><b>FEATURE TYPE:</b>";						// Add header
			for (i=0;i<this.kmap.feature_types_ss.length;++i) 										// For each type
				str+=" <i>"+this.kmap.feature_types_idfacet[i].split("|")[0]+"</i>"+sui.pages.AddPop(this.kmap.feature_types_idfacet[i].split("|")[1]);  // Add
			str+="</div>";
			}
		if (this.kmap.caption) str+="<div class='sui-sourceText' style='margin-left:192px'>"+this.kmap.caption+"</div>";
		str+=`</div><br>																
		<div style='display:inline-block;width:calc(100% - 192px);margin-left:192px'>
		<div class='sui-textTop' id='sui-textTop' style='border-top:1px solid #999'>
			<div class='sui-textTab' id='sui-textTab0' style='color:#fff;width:25%'>
				<div style='display:inline-block;padding-top:10px'>CONTEXT &nbsp;&#xe609</div></div>
			<div class='sui-textTab' id='sui-textTab1' style='border-left:1px solid #ccc;border-right:1px solid #ccc;color:#fff;width:25%'>
				<div style='display:inline-block;padding-top:10px'>SUMMARY &nbsp;&#xe609</div></div>
			<div class='sui-textTab' id='sui-textTab2' style='border-left:1px solid #ccc;border-right:1px solid #ccc;color:#fff;width:25%'>
				<div style='display:inline-block;padding-top:10px'>NAMES  &nbsp;&#xe609</div></div>
			<div class='sui-textTab' id='sui-textTab3' style='color:#fff;width:25%'>
				<div style='display:inline-block;padding-top:10px'>LOCATION &nbsp;&#xe609</div></div>
		</div>
		<div class='sui-textSide' id='sui-textSide' style='display:none'></div></div>`;
		$(this.app.div).html(str.replace(/\t|\n|\r|/g,""));										// Add to div
		sui.pages.DrawRelatedAssets(this.kmap);													// Draw related assets menu

		$("[id^=sui-textTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(11);											// Get index of tab	
				showTab(id);																	// Draw it
			});

		function showTab(which) {
			$("[id^=sui-textTab]").css({ "background-color":"#999",color:"#fff" });
			$("#sui-textSide").css({display:"inline-block","background-color":"#f8f8f8"});
			$("#sui-textTab"+which).css({"background-color":"#eee",color:"#666"});
			$("#sui-textSide").html(_this.content[which]);										// Set content
			
			$("[id^=sui-spLab-]").off("click");													// Kill handler
			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spItem-]").off("click");												// Kill handler
			$("[id^=sui-togCat-]").off("click");												// Kill handler
			$("[id^=sui-spCatUL-]").off("click");												// Kill handler
			$("[id^=sui-textTab]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-textSide").css({display:"inline-block","background-color":"#eee"});			// Show text
			$("#sui-textTab"+which).css({"background-color":"#eee",color:"#000"});				// Active tab
			$("#sui-textSide").html(_this.content[which]);										// Set content
			if (which == 0)	{																	// If summary, add events
				$("[id^=sui-spLab-]").on("click", (e)=> {										// ON RELATIONSHIP TREE ITEM CLICK
					let id=e.currentTarget.id.substring(10);									// Get id
					sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });				// Get kmap and show page
					});
				$("[id^=sui-spDot-]").on("click", function(e) {									// ON RELATIONSHIP TREE DOT CLICK
					let firstChild=$(this).parent().find("ul")[0];								// Get first child
					let path=e.currentTarget.id.substring(10);									// Get id
					if (path != "null") _this.AddBranch(_this.kmap.asset_type,path,$(this));	// Lazy load branch
					$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 	// Change label
					$(this).parent().find('ul').slideToggle();            						// Slide into place
					});
				$("#sui-spLab-"+_this.kmap.uid).css({ "border-bottom":"1px solid #999" });		// Highlight current one	
				}
			else if (which == 1) {																// If summary, add events
				$("[id^=sui-spCatUL-]").slideDown();											// All down
				$("[id^=sui-spCat-]").on("click", (e)=> {										// ON CATEGORY CLICK
					let id=e.currentTarget.id.substring(9);										// Get id
						if ($("#sui-spCatUL"+id).css("display") == "none")							// If hidden
						$("#sui-spCatUL"+id).slideDown();										// Show
					else																		// If showing
						$("#sui-spCatUL"+id).slideUp();											// Hide
					});
				$("[id^=sui-spSub-]").on("click", (e)=> {										// ON SUB-CATEGORY CLICK
					let id=e.currentTarget.id.substring(9);										// Get id
					if ($("#sui-spSubUL"+id).css("display") == "none")							// If hidden
						$("#sui-spSubUL"+id).slideDown();										// Show
					else																		// If showing
						$("#sui-spSubUL"+id).slideUp();											// Hide
					});

				$("[id^=sui-spItem-]").on("click", (e)=> {										// ON SUMMARY ITEM CLICK
					let id=e.currentTarget.id.substring(11);									// Get id
					sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });				// Get kmap and show page
					});
				$("#sui-togCatA").on("click", ()=> {											// ON EXPAND ALL
					$("[id^=sui-spCatUL-]").slideDown();										// All down
					});
				$("#sui-togCatN").on("click", ()=> {											// ON COLLAPSE ALL
					$("[id^=sui-spCatUL-]").slideUp();											// All down
					});
				}
		}

		sui.GetRelatedFromID(this.kmap.uid,(data)=> { 											// Load data
			if (data.illustration_external_url && data.illustration_external_url[0]) {			// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data.illustration_external_url[0]);				// Show it
				}
			else if (data.illustration_mms_url && data.illustration_mms_url[0]) {				// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data.illustration_mms_url[0]);					// Show it
				}
			this.AddSummary(this.kmap,data._childDocuments_);									// Add summary html
			this.AddContext(this.kmap,data);													// Add context html
			});
		
		str=`<div style='display:inline-block;width:50%'>
		<div style='font-weight:bold;color:#6faaf1;margin-bottom:8px'>NAMES</div>`;
		if (this.kmap.names_txt)	for (i=0;i<this.kmap.names_txt.length;++i) str+=this.kmap.names_txt[i]+"<br>";
		str+=`</div><div style='display:inline-block;width:calc(50% - 24px);vertical-align:top;border-left:1px solid #ccc; padding-left:12px'>
		<div style='font-weight:bold;color:#6faaf1;margin-bottom:8px'>ETYMOLOGY</div>
		...to be added
		</div>`;
		this.content[2]=str;											
	}	
	
	AddSummary(o,c)																			// ADD SUMMARY TAB CONTENTS 	
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
		let str=`<b>${o.title[0]}</b> has <b>${n}</b> other subject${(n > 1) ? "s": ""} directly related to it, which is presented here. 
		See the CONTEXT tab if you instead prefer to browse all subordinate and superordinate categories for ${o.title[0]}.
		<p><a style='cursor:pointer' id='sui-togCatA'>Expand all</a> / <a style='cursor:pointer' id='sui-togCatN'>Collapse all</a></p><div style='width:100%'><div style='width:50%;display:inline-block'>`;
		str+=drawCat(biggest)+"</div><div style='display:inline-block;width:50%;vertical-align:top'>";	// Add biggest to 1st column, set up 2nd	 
		for (f in s) if (f != biggest)	str+=drawCat(f);										// For each other category, draw it in 2nd column
		str+="</div></div>";
		this.content[1]=str;																	// Set summary tab

		function drawCat(f) {																	// DRAW CATEGORY
			let sub="xxx";
			s[f]=s[f].sort((a,b)=>{ return a.sub < b.sub ? -1 : 1;});							// Sort by sub category
			let str=`<div id='sui-spCat-${f.replace(/ /g,"_")}' 
			class='sui-spCat' style='background-color:#6faaf1;margin:0 0 4px 32px'> ${o.title} ${f}</div>
			<ul id='sui-spCatUL-${f.replace(/ /g,"_")}'><ul>`;
			for (i=0;i<s[f].length;++i)	{														// For each item
				if (sub != s[f][i].sub) {														// A new sub category
					sub=s[f][i].sub;															// New sub
					str+="</ul><div class='sui-spSubCat'>";										// End last sub container ul, add sub container div
					str+="<div style='background-color:#999' class='sui-spDot' id='sui-spSub-"+s[f][i].id+"'>&ndash;</div>";	// Add folding dot
					str+="<b>"+sub+"</b></div>";												// Add sub title
					str+="<ul id='sui-spSubUL-"+s[f][i].id+"' style='list-style-type:none'>";	// Add new container ul
					}
				str+="<li style='list-style-type:none'><a style='cursor:pointer' id='sui-spItem-"+s[f][i].id+"'>"+s[f][i].title+"</a>"+sui.pages.AddPop(s[f][i].id)+"</li>";	// Show it with popover
				}
			return str+"</ul></ul>";															// Close category and sub container ul
			}
	}

	AddContext(o,d)																			// ADD CONTEXT TAB CONTENTS 	
	{	
		let n=0;
		let str=`<b>${o.title[0]}</b> has <b> ~~ </b> immediate subordinate places. 
		You can browse this subordinate places as well as its superordinate categories with the tree below. 
		See the SUMMARY tab if you instead prefer to view only its immediately subordinate places grouped together in useful ways, as well as placess non-hierarchically related to it.<br><br>
		<ul class='sui-spLin' id='sui-spRows'>`;
		for (n=0;n<d.ancestors.length-1;++n) {													// For each ancestor (skipping Earth)
			str+="<ul style='list-style-type:none'>";											// Add header
			str+=this.AddTreeLine(d.ancestors[n+1],d.ancestor_uids_generic[n+1],"&ndash;",null); // Add it 
			}
		sui.GetTreeChildren(o.asset_type,d.ancestor_id_path,(res)=>{							// Get children
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
				str+=this.AddTreeLine(res[i].header,res[i].id,m,path)+"</li></ul>"; 			// Add it
				}
			
			str=str.replace(/~~/,n+res.length);													// Set total count
			for (i=0;i<d.ancestors.length;++i) str+="</li></ul>";								// Close chain
			this.content[0]=str.replace(/\t|\n|\r/g,"")+"</ul>";								// Set context tab
			});
	}

	AddTreeLine(lab, id, marker, path) 														// ADD LINE TO TREE
	{	
		let s=`<li style='margin:2px 0 2px ${-32}px'>`;											// Header
		if (marker)	s+=`<div class='sui-spDot' id='sui-spDot-${path}'>${marker}</div>`;			// If a dot, add it
		else		s+="<div class='sui-spDot' style='background:none;color:#5b66cb'><b>&bull;</b></div>";	// If a loner
		s+=`<a style='cursor:pointer' id='sui-spLab-${id}'>${lab}</a>`;							// Add name
		return s;																				// Return line
	}

	AddBranch(facet, path, dot)																// LAZY LOAD BRANCH
	{
		let _this=this;
		sui.GetTreeChildren(facet,path,(res)=>{													// Get children
			let str="";
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
				str+=this.AddTreeLine(res[i].header,res[i].id,m,path)+"</li></ul>"; 			// Add it
				}
			$(dot).prop("id","sui-spDot-null");													// Inhibit reloading
			dot.parent().append(str);															// Append branch

			$("[id^=sui-spLab-]").off("click");													// Kill handler
			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spLab-]").on("click", (e)=> {											// ON RELATIONSHIP TREE ITEM CLICK
				let id=e.currentTarget.id.substring(10);										// Get id
				sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });					// Get kmap and show page
				});
			$("[id^=sui-spDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				let firstChild=$(this).parent().find("ul")[0];									// Get first child
				let path=e.currentTarget.id.substring(10);										// Get id
				if (path != "null") _this.AddBranch(facet,path,$(this));						// Lazy load branch
				$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 		// Change label
				$(this).parent().find('ul').slideToggle();            							// Slide into place
				});
		});
		}

} // Places class closure
