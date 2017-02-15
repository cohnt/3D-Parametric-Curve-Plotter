//Constants
var zoomPowerConstant = 1.1; //This is used when calculating the zoom factor when scrolling.
var mouseWheelCalibrationConstant = 53; //This is the value given when the mouse is scrolled one notch.
var defaults = { //The defaults that the page loads when you first open it.
	x: "cos{t}",
	y: "sin{t}",
	z: "0.5*t",
	tmin: "-4*pi",
	tmax: "4*pi",
	tstep: "pi/64",
	center: function() { return [0, 0, 0]; },
	viewVector: function() { return [1, 1, 1]; },
	viewBasis: function() {
		var foo = Math.sqrt(2);
		var bar = Math.sqrt(1.5);
		return [[-1/foo, 1/foo, 0], [-0.5/bar, -0.5/bar, 1/bar]];
	},
	zoom: 50,
	viewRotation: 0,
	maxPoints: 5
};
var axisColors = ["#ff0000", "#00cc00", "#0000ff"];
var lightAxisColors = ["#ffaaaa", "#aaccaa", "#aaaaff"];
var canvasBackgroundColor = "#dddddd";
var showNegativeAxes = true;
var dragRotatingConstant = 1/100; //This constant slows down the rate that dragging rotates the graph.
var axesStrokeConstant = 2; //Make the axis lines thicker than default.
var debugModeAreaLineBreaks = 1; //The number of line breaks above the debug area.
var mouseDeltasToKeep = 8; //How many of the last mouse movements to keep recorded for panning/rotating.
var debugMode = true;

//Global Variables
var page = {};
var keys = {};
var mouseButtons = {};
var context;
var xFunction;
var yFunction;
var zFunction;
var mouseLocation = [];
var oldMouseLocation = [];
var zoom;
var currentlyPanning = false;
var currentlyRotating = false;
var viewVector = [];
var viewBasis = [];
var viewRotation;
var center = [];
var front; //True if looking from the front, false if looking from the back.
var userFunction = []; //Array of length 3, which each entry being a function you can call.
var keptMouseDeltas = [];

//Classes


//Functions
function setup() {
	console.log("FUNCTION CALL: setup()");

	page.xInputField = document.getElementById("xFunction");
	page.yInputField = document.getElementById("yFunction");
	page.zInputField = document.getElementById("zFunction");
	page.plotButton = document.getElementById("plotButton");
	page.tminInputField = document.getElementById("tmin");
	page.tmaxInputField = document.getElementById("tmax");
	page.tstepInputField = document.getElementById("tstep");
	page.recenterButton = document.getElementById("returnToCenter");
	page.xValid = document.getElementById("xValid");
	page.yValid = document.getElementById("yValid");
	page.zValid = document.getElementById("zValid");
	page.canvas = document.getElementById("graph");

	context = page.canvas.getContext("2d");

	page.xInputField.addEventListener("change", processFunctions);
	page.yInputField.addEventListener("change", processFunctions);
	page.zInputField.addEventListener("change", processFunctions);
	page.plotButton.addEventListener("click", updateGraphComputations);
	page.tminInputField.addEventListener("change", updateGraphComputations);
	page.tmaxInputField.addEventListener("change", updateGraphComputations);
	page.tstepInputField.addEventListener("change", updateGraphComputations);
	page.recenterButton.addEventListener("click", recenter);

	if(debugMode) {
		debugSetup();
	}

	mouseAndKeyboardInputSetup();

	loadInitialAndDefaults();
	window.setTimeout(updateGraphComputations, 0);
}
function debugSetup() {
	console.log("FUNCTION CALL: debugSetup()");

	var lineBreak;
	for(var i=0; i<debugModeAreaLineBreaks; ++i) {
		lineBreak = document.createElement("br");
		document.body.appendChild(lineBreak);
	}

	var debugArea = document.createElement("div");
	debugArea.setAttribute("id", "debugArea");
	var mouseDelta = document.createElement("div");
	mouseDelta.setAttribute("id", "mouseDeltaCont");
	debugArea.appendChild(mouseDelta);
	document.body.appendChild(debugArea);

	page.debugArea = document.getElementById("debugArea");
	page.mouseDeltaCont = document.getElementById("mouseDeltaCont");
}
function mouseAndKeyboardInputSetup() {
	console.log("FUNCTION CALL: mouseAndKeyboardInputSetup()");

	document.addEventListener("keydown", function(event) { keydown(event); });
	document.addEventListener("keyup", function(event) { keyup(event); });
	document.addEventListener("mousemove", function(event) { mouseMoved(event); });
	page.canvas.addEventListener("mousedown", function(event) { mousedown(event); });
	document.addEventListener("mouseup", function(event) { mouseup(event); });
	page.canvas.addEventListener("wheel", function(event) { wheel(event); });
}
function loadInitialAndDefaults() {
	console.log("FUNCTION CALL: loadInitialAndDefaults()");
	page.xInputField.value = defaults.x;
	page.yInputField.value = defaults.y;
	page.zInputField.value = defaults.z
	page.tminInputField.value = defaults.tmin;
	page.tmaxInputField.value = defaults.tmax;
	page.tstepInputField.value = defaults.tstep;
	center = defaults.center();
	viewVector = defaults.viewVector();
	viewBasis = defaults.viewBasis();
	zoom = defaults.zoom;
	viewRotation = defaults.viewRotation;
}
function updateGraphComputations() {
	console.log("FUNCTION CALL: updateGraphComputations()");

	processFunctions();

	updateGraphDisplay();
}
function updateGraphDisplay() {
	console.log("FUNCTION CALL: updateGraphDisplay()");

	clearCanvas();
	setConstantContextTransforms();
	orthonormalizeViewBasis();

	var axisPoints = getAxisPoints();
	TEMP = axisPoints.slice(0);
	drawAxes(axisPoints);

	//drawViewVector(); //This is used for debugging purposes. Furthermore, you should never see this vector, as it should be perfectly edge-on.
	drawBasisVectors(); //This is used for debugging purposes.

	updateDebugDisplay();
}
function updateDebugDisplay() {
	console.log("FUNCTION CALL: updateDebugDisplay()");

	if(page.mouseDeltaCont.childNodes.length >= 2*mouseDeltasToKeep) {
		page.mouseDeltaCont.removeChild(page.mouseDeltaCont.childNodes[page.mouseDeltaCont.childNodes.length-1]);
		page.mouseDeltaCont.removeChild(page.mouseDeltaCont.childNodes[page.mouseDeltaCont.childNodes.length-1]);
	}

	var lastMouseDelta = document.createElement("pre");
	var data = document.createTextNode(String(keptMouseDeltas[keptMouseDeltas.length-1]));
	lastMouseDelta.appendChild(data);
	var lineBreak = document.createElement("br");

	page.mouseDeltaCont.insertBefore(lineBreak, page.mouseDeltaCont.childNodes[0]);
	page.mouseDeltaCont.insertBefore(lastMouseDelta, page.mouseDeltaCont.childNodes[0]);
}
function clearCanvas() {
	console.log("FUNCTION CALL: clearCanvas()");

	context.setTransform(1, 0, 0, 1, 0, 0); //Reset all context transforms
	context.clearRect(0, 0, page.canvas.width, page.canvas.height); //Clear the entire canvas
	context.fillStyle = canvasBackgroundColor;
	context.fillRect(0, 0, page.canvas.width, page.canvas.height);
	context.beginPath(); //Start a new line path.
}
function setConstantContextTransforms() {
	console.log("FUNCTION CALL: setConstantContextTransforms()");

	context.transform(1, 0, 0, 1, page.canvas.width/2, page.canvas.height/2); //Put 0,0 in the center of the canvas
	context.transform(zoom, 0, 0, zoom, 0, 0); //Scale the canvas
	context.transform(1, 0, 0, -1, 0, 0); //Flip the canvas vertically.
	context.lineWidth = 1/zoom; //Keep the lines the same thickness.
}
function processFunctions() {
	console.log("FUNCTION CALL: processFunctions()");
	
	//This is the hard part XD
	xFunction = processFunction(page.xInputField.value);
	yFunction = processFunction(page.yInputField.value);
	zFunction = processFunction(page.zInputField.value);
}
function processFunction(functionString) {
	console.log("FUNCTION CALL: processFunction("+functionString+")");

	var evalString = functionString.slice(0);
}
function recenter() {
	console.log("FUNCTION CALL: recenter()");

	zoom = defaults.zoom;
	viewVector = defaults.viewVector();
	viewBasis = defaults.viewBasis();

	updateGraphDisplay();
}
function makeUnitVector(vec) {
	//
	return scalarVec(Math.sqrt(dot(vec, vec)), vec);
}
function orthonormalizeViewBasis() {
	console.log("FUNCTION CALL: orthonormalizeViewBasis()");

	//Graham-Schmidt process, as explained here: https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process
	//Actually sort done with QR decomposition.
	//This is really nice for testing if this function worked: https://academo.org/demos/3d-vector-plotter/

	var v1 = viewVector.slice(0);
	var v2 = viewBasis[0].slice(0);
	var v3 = viewBasis[1].slice(0);

	var r11 = magnitude(v1);
	var u1 = scalarVec(1/r11, v1);

	var r12 = dot(u1, v2);
	var v2Perp = addVec(v2, scalarVec(-1, scalarVec(r12, u1)));
	console.log(scalarVec(-1, scalarVec(r12, u1)));
	var r22 = magnitude(v2Perp);
	var u2 = scalarVec(1/r22, v2Perp);

	var r13 = dot(u1, v3);
	var r23 = dot(u2, v3);
	var v3Perp = addVec(v3, addVec(scalarVec(-1, scalarVec(r13, u1)), scalarVec(-1, scalarVec(r23, u2))));
	var r33 = magnitude(v3Perp);
	var u3 = scalarVec(1/r33, v3Perp);

	viewVector = u1.slice(0);
	viewBasis[0] = u2.slice(0);
	viewBasis[1] = u3.slice(0);
}
function projUV(u, v) {
	//The vector projection of v onto u
	var output = u.slice(0);
	var factor = dot(u, v)/dot(u, u);
	for(var i=0; i<output.length; ++i) {
		output[i] *= factor;
	}
	return output.slice(0);
}
function compUV(u, v) {
	//The component projection of v onto u
	//https://en.wikipedia.org/wiki/Scalar_projection
	return dot(u, v)/Math.sqrt(dot(u, u));
}
function dot(a, b) {
	var total = 0;
	for(var i=0; i<a.length; ++i) {
		total += a[i]*b[i];
	}
	return total;
}
function magnitude(v) {
	var sum = 0;
	for(var i=0; i<v.length; ++i) {
		sum += Math.pow(v[i], 2);
	}
	return Math.sqrt(sum);
}
function scalarVec(s, v) {
	var newVec = [0, 0, 0];
	for(var i=0; i<v.length; ++i) {
		newVec[i] = v[i] * s;
	}
	return newVec.slice(0);
}
function addVec(v1, v2) {
	var newV = [0, 0, 0];
	for(var i=0; i<v1.length; ++i) {
		newV[i] = v1[i] + v2[i];
	}
	return newV.slice(0);
}
function getAxisPoints() {
	console.log("FUNCTION CALL: getAxisPoints()");

	var projCenterXY = projectOntoScreen(center);

	var xMin = projCenterXY[0] - ((page.canvas.width/2)/zoom);
	var xMax = projCenterXY[0] + ((page.canvas.width/2)/zoom);
	var yMin = projCenterXY[1] - ((page.canvas.height/2)/zoom);
	var yMax = projCenterXY[1] + ((page.canvas.height/2)/zoom);

	var points = [[], [], []];
	var origin = [0, 0, 0];
	var projOrigin = projectOntoScreen(origin);
	var xRelativeLocation; //-1 if it's less than the minimum, 0 if it's good, 1 if it's greater than the maximum.
	var yRelativeLocation; //Ditto above. These are done with the screen location, to see where to draw the axes.

	if(projOrigin[0] > xMax) {
		xRelativeLocation = 1;
	}
	else if(projOrigin[0] < xMin) {
		xRelativeLocation = -1;
	}
	else {
		xRelativeLocation = 0;
	}
	if(projOrigin[1] > yMax) {
		yRelativeLocation = 1;
	}
	else if(projOrigin[1] < yMin) {
		yRelativeLocation = -1;
	}
	else {
		yRelativeLocation = 0;
	}

	var finished = false;
	var currentPoint = [];
	var currentScreenPoint = [];
	var nextPoint = [];
	var nextScreenPoint = [];
	var difference = [];
	var maxPointCount = defaults.maxPoints * (defaults.zoom / zoom);
	var currentPointCount;
	var jEndVal = showNegativeAxes ? -1 : 1;
	for(var i=0; i<3; ++i) { //Iterating over each axis
		for(var j=1; j>=jEndVal; j-=2) { //Go in both the positive and negative direction
			currentPoint = origin.slice(0);
			currentScreenPoint = projectOntoScreen(currentPoint);
			points[i].push(currentScreenPoint);
			finished = false;
			currentPointCount = 0;
			while((!finished) && (currentPointCount <= maxPointCount)) {
				nextPoint = currentPoint.slice(0);
				nextPoint[i] += j;
				nextScreenPoint = projectOntoScreen(nextPoint);
				points[i].push(nextScreenPoint);

				difference[0] = nextScreenPoint[0] - currentScreenPoint[0];
				difference[1] = nextScreenPoint[1] - currentScreenPoint[1];

				if((nextScreenPoint[0] > xMax) && (difference[0] >= 0)) {
					finished = true;
				}
				else if((nextScreenPoint[0] < xMin) && (difference[0] <= 0)) {
					finished = true;
				}
				else if((nextScreenPoint[1] > yMax) && (difference[1] >= 0)) {
					finished = true;
				}
				else if((nextScreenPoint[1] < yMin) && (difference[1] <= 0)) {
					finished = true;
				}
				currentPoint = nextPoint.slice(0);
				currentScreenPoint = projectOntoScreen(currentPoint);

				++currentPointCount;
			}
			if(j == 1) {
				points[i].push("FLIP");
			}
		}
	}

	return points;
}
function projectOntoScreen(vec) {
	//
	return [compUV(viewBasis[0], vec), compUV(viewBasis[1], vec)];
}
function drawAxes(axes) {
	console.log("FUNCTION CALL: drawAxes("+axes+")");

	context.lineWidth *= axesStrokeConstant;

	for(var i=0; i<3; ++i) {
		context.strokeStyle = axisColors[i];
		context.beginPath();
		context.moveTo(axes[i][0][0], axes[i][0][1]);
		for(var j=1; j<axes[i].length; ++j) {
			if(axes[i][j] == "FLIP") {
				context.strokeStyle = lightAxisColors[i];
				context.beginPath();
			}
			else {
				context.lineTo(axes[i][j][0], axes[i][j][1]);
				context.stroke();
			}
		}
		context.beginPath();
	}
	context.strokeStyle = "#000000";
	context.lineWidth /= axesStrokeConstant;
}
function drawViewVector() {
	console.log("FUNCTION CALL: drawViewVector()");

	var startPoint = projectOntoScreen(center);

	var vec = [];
	for(var i=0; i<center.length; ++i) {
		vec.push(center[i] + viewVector[i]);
	}
	var endPoint = projectOntoScreen(vec);

	context.beginPath();
	context.moveTo(startPoint[0], startPoint[1]);
	context.lineTo(endPoint[0], endPoint[1]);
	context.stroke();
}
function drawBasisVectors() {
	console.log("FUNCTION CALL: drawBasisVectors()");

	var startPoint = projectOntoScreen(center);

	var vecs = [];
	for(var i=0; i<viewBasis.length; ++i) {
		vecs.push(viewBasis[i].slice(0));
		for(var j=0; j<center.length; ++j) {
			vecs[i][j] += center[j];
		}
		vecs[i] = projectOntoScreen(vecs[i]);
	}

	context.beginPath();
	context.moveTo(startPoint[0], startPoint[1]);
	context.lineTo(vecs[0][0], vecs[0][1]);
	context.stroke();

	context.beginPath();
	context.moveTo(startPoint[0], startPoint[1]);
	context.lineTo(vecs[1][0], vecs[1][1]);
	context.stroke();
}

function pannedGraph(d) {
	console.log("FUNCTION CALL: pannedGraph("+d+")");

	updateGraphDisplay();
}
function rotatedGraph(d) {
	console.log("FUNCTION CALL: rotatedGraph("+d+")");

	var d3 = [0, 0, 0];
	for(var i=0; i<d3.length; ++i) {
		d3[i] += -1*d[0]*viewBasis[0][i];
		d3[i] += d[1]*viewBasis[1][i];
		d3[i] *= dragRotatingConstant;
	}

	for(var i=0; i<d3.length; ++i) {
		viewVector[i] += d3[i];
	}

	updateGraphDisplay();
}
function mouseMoved(event) {
	mouseLocation[0] = event.clientX;
	mouseLocation[1] = event.clientY;

	var delta = [0, 0];
	delta[0] += (mouseLocation[0] - oldMouseLocation[0]);
	delta[1] += (mouseLocation[1] - oldMouseLocation[1]);

	currentlyPanning = mouseButtons["1"];
	currentlyRotating = keys["16"];

	//Panning takes precedence over rotating.
	if(currentlyPanning) {
		pannedGraph(delta);
	}
	else if(currentlyRotating) {
		rotatedGraph(delta);
	}

	if(currentlyRotating || currentlyPanning) {
		keptMouseDeltas.push(delta);
		if(keptMouseDeltas.length > mouseDeltasToKeep) {
			keptMouseDeltas.splice(0, 1);
		}
	}

	oldMouseLocation[0] = mouseLocation[0];
	oldMouseLocation[1] = mouseLocation[1];
}
function keydown(event) {
	//
	keys[String(event.which)] = true;
}
function keyup(event) {
	//
	keys[String(event.which)] = false;
}
function mousedown(event) {
	//
	mouseButtons[String(event.which)] = true;
}
function mouseup(event) {
	//
	mouseButtons[String(event.which)] = false;
}
function wheel(event) {
	var wheelChange = event.deltaY;
	var zoomMultiplier = Math.pow(zoomPowerConstant, wheelChange*(1/mouseWheelCalibrationConstant)); //I may want to change how this zoom works later.
	zoom *= zoomMultiplier;
	console.log(zoom);
	updateGraphDisplay();
}

//Executed Code
window.setTimeout(setup, 0);