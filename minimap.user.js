// ==UserScript==
// @name         PixelCanvas Minimap NEW
// @namespace    http://tampermonkey.net/
// @version      2.4 "Freedom Edition"
// @description  PixelCanvas Minimap for all templates.
// @author       Some Anons
// @match        https://pixelcanvas.io/*
// @match        http://pixelcanvas.io/*
// @connect      files.catbox.moe
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==

// This userscript is licensed under CC BY-NC-SA (https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode) by EMF - We are Aweseome (http://mlpixel.org/emf)
// Licence Informations:
// This userscript is distributed under the CC BY-NC-SA
// You are free to copy and redistribute the material in any medium or format and to
// remix, transform and build upon the material under the terms that you must give
// appropriate credit, it is non-commercial and that you distribute your contributions
// under the same license as the orginial.
// Keep in mind that just mentioning the license and creator in the source code is not appropriate credit, because it is
// not visible by users. Appropriate credits are putting the license, creater, disclaimer and other by the CC BY-NC-SA required
// attributions visible under the minimap. Use the licensing informations that are already provided.

cssStyle = `
#minimapbg {
  position: absolute;
  right: 1em;
  bottom: 1em;
}

#posyt {
  background-color: rgba(0, 0, 0, 0.75);
  color: rgb(250, 250, 250);
  text-align: center;
  line-height: 42px;
  vertical-align: middle;
  width: auto;
  height: auto;
  border-radius: 21px;
  padding: 6px;
}

#minimap-text {
  display: none;
}

#minimap-box {
  position: relative;
  width:420px;
  height:300px;
}

#minimap, #minimap-board, #minimap-cursor {
  width: 100%;
  height: 100%;
  position:absolute;
  top:0;
  left:0;
}

#minimap {
  z-index:1;
}

#minimap-board {
  z-index:2;
}

#minimap-cursor {
  z-index:3;
}

#minimap-config {
  line-height:20px;
}

.map-clickable {
  cursor: pointer;
}

.map-zoom {
  font-weight:bold;
}

/*#colors {
  margin-left: 0.333em !important;
}

#app > div:nth-child(1) > div:nth-child(9) {
  position: absolute;
  bottom: 6em;
  left: 0.3333em;

}

#app > div:nth-child(1) > div:nth-child(9) > div:nth-child(2) {
  bottom: initial !important;
  left: initial !important;
  position: initial !important;
  display: inline-block !important;
}

#app > div:nth-child(1) > div:nth-child(9) > div:nth-child(1) {
  bottom: initial !important;
  left: initial !important;
  position: initial !important;
  display: inline-block !important;
}*/`;

htmlFragment = `
<div id="minimapbg">
  <div class="posy" id="posyt">
    <div id="minimap-text"></div>
    <div id="minimap-box">
      <canvas id="minimap"></canvas>
      <canvas id="minimap-board"></canvas>
      <canvas id="minimap-cursor"></canvas>
    </div>
    <div id="minimap-config">
      <span class="map-clickable" id="hide-map">Hide Map</span>
      |
      <span class="map-clickable" id="follow-mouse">Follow Mouse</span>
      |
	  <span class="map-clickable" id="config">Config</span>
	  |
      <span class="map-clickable" id="toggle-grid">Toggle Grid</span>
      |
      Zoom:
      <span class="map-clickable map-zoom" id="zoom-plus">+</span>
      /
      <span class="map-clickable map-zoom" id="zoom-minus">-</span>
    </div>
  </div>
</div>`;

window.addEventListener('load', function() {
  // Regular Expression to get coordinates out of URL
  re = /(.*)@(.*),(.*)/g;
  // Regular Expression to get coordinates from cursor
  rec = /\((.*), (.*)\)/g;
  gameWindow = document.getElementById("gameWindow");
  // DOM element of the displayed X, Y variables
  coorDOM = null;
  findCoor();
  // coordinates of the middle of the window
  x_window = 0;
  y_window = 0;
  // coordinates of cursor
  x = 0;
  y = 0;
  // list of all available templates
  template_list = null;
  zoomlevel = 9;
  // toggle options
  toggle_show = true;
  toggle_follow = true; //if minimap is following window, x_window = x and y_window = y;
  toggle_grid = true;
  config = false;

  zoom_state = 0;
  zoom_time = 100;
  // array with all loaded template-images
  image_list = [];
  counter = 0;
  // templates which are needed in the current area
  needed_templates = null;
  // Cachebreaker to force refresh
  cachebreaker = null;

  // Set style
  addGlobalStyle(cssStyle);

  // Add minimap
  var div = document.createElement('div');
  div.setAttribute('class', 'post block bc2');
  div.innerHTML = htmlFragment;
  document.body.appendChild(div);

  // Setup canvas
  minimap = document.getElementById("minimap");
  minimap_board = document.getElementById("minimap-board");
  minimap_cursor = document.getElementById("minimap-cursor");
  minimap.width  = minimap.offsetWidth;
  minimap_board.width  = minimap_board.offsetWidth;
  minimap_cursor.width  = minimap_cursor.offsetWidth;
  minimap.height = minimap.offsetHeight;
  minimap_board.height = minimap_board.offsetHeight;
  minimap_cursor.height = minimap_cursor.offsetHeight;
  ctx_minimap = minimap.getContext("2d");
  ctx_minimap_board = minimap_board.getContext("2d");
  ctx_minimap_cursor = minimap_cursor.getContext("2d");

  // No Antialiasing when scaling!
  ctx_minimap.mozImageSmoothingEnabled = false;
  ctx_minimap.webkitImageSmoothingEnabled = false;
  ctx_minimap.msImageSmoothingEnabled = false;
  ctx_minimap.imageSmoothingEnabled = false;

  ctx_minimap_board.mozImageSmoothingEnabled = false;
  ctx_minimap_board.webkitImageSmoothingEnabled = false;
  ctx_minimap_board.msImageSmoothingEnabled = false;
  ctx_minimap_board.imageSmoothingEnabled = false;

  drawBoard();
  drawCursor();

  // Setup events
  document.getElementById("hide-map").onclick = function(){
    console.log("This should do something, but it doesn't");
    toggle_show = false;
    document.getElementById("minimap-box").style.display = "none";
    document.getElementById("minimap-config").style.display = "none";
    document.getElementById("minimap-text").style.display = "block";
    document.getElementById("minimap-text").innerHTML = "Show Minimap";
    document.getElementById("minimap-text").style.cursor = "pointer";
  };

  document.getElementById("minimap-text").onclick = function(){
    toggle_show = true;
    document.getElementById("minimap-box").style.display = "block";
    document.getElementById("minimap-config").style.display = "block";
    document.getElementById("minimap-text").style.display = "none";
    document.getElementById("minimap-text").style.cursor = "default";
    loadTemplates();
  };

  document.getElementById("zoom-plus").addEventListener('mousedown', function(e){
    e.preventDefault();
    zoom_state = +1;
    zoom();
  }, false);
  document.getElementById("zoom-minus").addEventListener('mousedown', function(e){
    e.preventDefault();
    zoom_state = -1;
    zoom();
  }, false);
  document.getElementById("zoom-plus").addEventListener('mouseup', function(e){ zoom_state = 0;}, false);
  document.getElementById("zoom-minus").addEventListener('mouseup', function(e){ zoom_state = 0;}, false);

  document.getElementById("follow-mouse").onclick = function(){
    toggle_follow = !toggle_follow;
    if(toggle_follow){
      this.innerHTML = "Follow Mouse";
      loadTemplates();
      x_window = x;
      y_window = y;
      drawCursor();
    } else {
      this.innerHTML = "Follow Window";
      getCenter();
    }
  };

  document.getElementById("toggle-grid").onclick = function(){
    toggle_grid = !toggle_grid;
    drawBoard();
  };
  
  document.getElementById("config").onclick = function(){
    config = !config;
    if(config)
		GM_config.open();
	else
		GM_config.close();
  };

  gameWindow.addEventListener('mouseup',function(evt){
    if(!toggle_show)
      return;
    if(!toggle_follow)
      setTimeout(getCenter, 100);
  },false);

  gameWindow.addEventListener('mousemove',function(evt){
    if(!toggle_show)
      return;
    x_new = coorDOM.innerHTML.replace(rec, '$1');
    y_new = coorDOM.innerHTML.replace(rec, '$2');
    if (x != x_new || y != y_new){
      x = x_new;
      y = y_new;
      if(toggle_follow){
        x_window = x;
        y_window = y;
      } else {
        drawCursor();
      }
      loadTemplates();
    }
  },false);
  
  // Setting up config
  // TODO: Custom field types?
  GM_config.init(
  {
	'id': 'minimap',
	'fields':
	{
		'templates':
		{
			'label': 'Templates - YOU WILL NEED TO REFRESH AFTER YOU ADD A TEMPLATE',
			'type': 'textarea',
			'default': '[\n{"filename":"uk7uvv.png","height":360,"width":360,"x":3059,"y":-15374}\n]'
		}
	}
  });
  
  //GM_config.open();
  
  updateloop();
}, false);

function addGlobalStyle(css) {
  var head, style;
  head = document.getElementsByTagName('head')[0];
  if (!head) { return; }
  style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  head.appendChild(style);
}

function updateloop(){
  console.log("Updating Template List");
  // Get JSON of available templates
  
  /*GM.xmlHttpRequest({
    method: "GET",
    url: `https://raw.githubusercontent.com/kekw-420/TestRepo420/master/templates.json`,
    onload: function(response) {
      template_list = JSON.parse(response.responseText);
      if(!toggle_follow)
        getCenter();
    }
  });*/
  
template_list = JSON.parse(GM_config.get('templates'));
if(!toggle_follow)
	getCenter();

  setTimeout(updateloop, 600000);
}

function toggleShow(){
  toggle_show = !toggle_show;
  if (toggle_show){
    document.getElementById("minimap-box").style.display = "block";
    document.getElementById("minimap-config").style.display = "block";
    document.getElementById("minimap-text").style.display = "none";
    document.getElementById("minimapbg").onclick = function(){};
    loadTemplates();
  } else {
    document.getElementById("minimap-box").style.display = "none";
    document.getElementById("minimap-config").style.display = "none";
    document.getElementById("minimap-text").style.display = "block";
    document.getElementById("minimap-text").innerHTML = "Show Minimap";
    document.getElementById("minimapbg").onclick = function(){toggleShow();};
  }
}

function clampZoom(zoom) {
  return Math.min(45, Math.max(1,zoom));
}

function zoom() {
  if(!zoom_state)
    return;

  zoomlevel = clampZoom(zoomlevel * Math.pow(1.1, zoom_state));

  drawBoard();
  drawCursor();
  loadTemplates();
  setTimeout(zoom, zoom_time);
}


function loadTemplates(){
  if(!toggle_show)
    return;
  if(template_list == null)
    return;

  var x_left   = x_window*1 - minimap.width  / zoomlevel / 2;
  var x_right  = x_window*1 + minimap.width  / zoomlevel / 2;
  var y_top    = y_window*1 - minimap.height / zoomlevel / 2;
  var y_bottom = y_window*1 + minimap.height / zoomlevel / 2;

  needed_templates = [];

  for(var i = 0; i < template_list.length; i++) {
    var temp_x  = template_list[i]["x"]*1;
    var temp_y  = template_list[i]["y"]*1;
    var temp_xr = template_list[i]["x"]*1 + template_list[i]["width"]*1;
    var temp_yb = template_list[i]["y"]*1 + template_list[i]["height"]*1;
    if ( temp_xr < x_left || temp_yb < y_top || temp_x >= x_right || temp_y >= y_bottom)
      continue;
    //console.log(" Template " + template_list[i]["filename"] + " is in range!");
    needed_templates.push(template_list[i]);
  }

  if(needed_templates.length == 0){
    if(zoom_state == false){
      document.getElementById("minimap-box").style.display = "none";
      document.getElementById("minimap-text").style.display = "block";
      document.getElementById("minimap-text").innerHTML = "No Template in this area";
    }
  } else {
    document.getElementById("minimap-box").style.display = "block";
    document.getElementById("minimap-text").style.display = "none";
    counter = 0;

    for(var i = 0; i < needed_templates.length; i++){
      if(image_list[needed_templates[i]["filename"]] == null){
        loadImage(needed_templates[i]);
      } else {
        counter += 1;
        //if last needed image loaded, start drawing
        if (counter == needed_templates.length)
          drawTemplates();
      }
    }
  }
}

function loadImage(templatearray){
  var imagepath = templatearray["filename"];
  console.log("    Load image " + imagepath);
  image_list[imagepath] = new Image();
  image_list[imagepath].src = "https://files.catbox.moe/" + imagepath;
  image_list[imagepath].onload = function() {
    counter += 1;
    // if last needed image loaded, start drawing
    if (counter == needed_templates.length)
      drawTemplates();
  };
}

function drawTemplates(){
  ctx_minimap.clearRect(0,0,minimap.width,minimap.height);
  var x_left = x_window*1 - minimap.width / zoomlevel / 2;
  var y_top = y_window*1 - minimap.height / zoomlevel / 2;
  var i;
  for(i = 0; i < needed_templates.length; i++){
    var template = needed_templates[i];
    var filename = template["filename"];
    var xoff = (template["x"]*1 - x_left*1) * zoomlevel;
    var yoff = (template["y"]*1 - y_top*1) * zoomlevel;
    var newwidth = zoomlevel * image_list[filename].width;
    var newheight = zoomlevel * image_list[filename].height;
    var img = image_list[filename];
    ctx_minimap.drawImage(img, xoff, yoff, newwidth, newheight);
  }
}

function drawBoard(){
  ctx_minimap_board.clearRect(0,0,minimap_board.width,minimap_board.height);

  if (zoomlevel <= 4.6 || !toggle_grid)
    return;

  ctx_minimap_board.beginPath();
  var bw = minimap_board.width + zoomlevel;
  var bh = minimap_board.height + zoomlevel;
  var xoff_m = (minimap.width / 2) % zoomlevel - zoomlevel;
  var yoff_m = (minimap.height / 2) % zoomlevel - zoomlevel;
  var z = zoomlevel;

  ctx_minimap_board.fillStyle = "rgba(0,0,0,0.75)";

  for (var x = 0; x <= bw; x += z) {
    ctx_minimap_board.fillRect(x +  xoff_m, yoff_m, 1, bh);
  }

  for (var y = 0; y <= bh; y += z) {
    ctx_minimap_board.fillRect(xoff_m, y + yoff_m, bw, 1);
  }
}


function drawCursor(){
  var x_left = x_window*1 - minimap.width / zoomlevel / 2;
  var x_right = x_window*1 + minimap.width / zoomlevel / 2;
  var y_top = y_window*1 - minimap.height / zoomlevel / 2;
  var y_bottom = y_window*1 + minimap.height / zoomlevel / 2;
  ctx_minimap_cursor.clearRect(0,0,minimap_cursor.width,minimap_cursor.height);
  if( x < x_left || x > x_right || y < y_top || y > y_bottom)
    return;
  xoff_c = x - x_left;
  yoff_c = y - y_top;

  ctx_minimap_cursor.beginPath();
  ctx_minimap_cursor.lineWidth = Math.min(4, zoomlevel / 3);
  ctx_minimap_cursor.strokeStyle = "red";
  ctx_minimap_cursor.rect(zoomlevel * xoff_c, zoomlevel * yoff_c, zoomlevel, zoomlevel);
  ctx_minimap_cursor.stroke();

}

function getCenter(){
  var url = window.location.href;
  x_window = url.replace(re, '$2');
  y_window = url.replace(re, '$3');
  if(x_window == url || y_window == url){
    x_window = 0;
    y_window = 0;
  }
  loadTemplates();
}

function findCoor(){
  //all elements with style attributes
  var elms = document.querySelectorAll("*[style]");
  // Loop and find the element with the right style attributes
  Array.prototype.forEach.call(elms, function(elm) {
    var style = elm.style.cssText;
    if (style == "position: absolute; left: 1em; bottom: 1em;"){
      console.log("Found It!");
      coorDOM = elm.firstChild;
      console.log(coorDOM.innerHTML);
    }
  });
}
