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
	viewVector: function() { return eval(prompt("viewVector")); },
	zoom: 50,
	viewRotation: 0,
	maxPoints: 100
};
var axisColors = ["#ff0000", "#00ff00", "#0000ff"];
var lightAxisColors = ["#ffaaaa", "#aaffaa", "#aaaaff"];
var canvasBackgroundColor = "#dddddd";
var showNegativeAxes = false;
var dragRotatingConstant = 1/100; //This constant slows down the rate that dragging rotates the graph.

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

	mouseAndKeyboardInputSetup();

	loadInitialAndDefaults();
	window.setTimeout(updateGraphComputations, 0);
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
	calculateViewBasis();
	orthonormalizeViewBasis();
	checkPlaneSide();

	var axisPoints = getAxisPoints();
	TEMP = axisPoints.slice(0);
	drawAxes(axisPoints);

	//drawViewVector(); //This is used for debugging purposes. Furthermore, you should never see this vector, as it should be perfectly edge-on.
	drawBasisVectors(); //This is used for debugging purposes.
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

	zoom = 1;
	//
}
function makeUnitVector(vec) {
	console.log("FUNCTION CALL: makeUnitVector("+vec+")");

	var squareSum = 0;
	for(var i=0; i<vec.length; ++i) {
		squareSum += Math.pow(vec[i], 2);
	}
	var divide = Math.sqrt(squareSum);
	for(var i=0; i<vec.length; ++i) {
		vec[i] *= (1/divide);
	}
	return vec;
}
function calculateViewBasis() {
	console.log("FUNCTION CALL: calculateViewBasis()");

	var basisVec1 = [];
	var basisVec2 = [];
	
	//If viewVector = [a, b, c], then the plane equation is ax+by+cz=0.
	//This simplifies to x=-(by+cz)/a, giving the points (-(by+cz)/a, y, z), therefore giving the spanning vectors (-b/a, 1, 0) and (-c/a, 0, 1)
	//                or y=-(ax+cz)/b                    (x, -(ax+cz)/b, z)                                        (1, -a/b, 0) and (0, -c/b, 1)
	//                or z=-(ax+by)/c                    (x, y, -(ax+by)/c)                                        (1, 0, -a/c) and (0, 1, -b/c)
	//http://math.stackexchange.com/questions/1702572/how-to-find-the-basis-of-a-plane-or-a-line

	var a = viewVector[0];
	var b = viewVector[1];
	var c = viewVector[2];

	if(a != 0) {
		basisVec1 = [-b/a, 1, 0];
		basisVec2 = [-c/a, 0, 1];
	}
	else if(b != 0) {
		basisVec1 = [1, -a/b, 0];
		basisVec2 = [0, -c/b, 1];
	}
	else if(c != 0) {
		basisVec1 = [1, 0, -a/c];
		basisVec2 = [0, 1, -b/c];
	}
	else {
		throw "viewVector cannot be the zero vector!";
	}

	console.log(viewVector);
	console.log(basisVec1);
	console.log(basisVec2);

	viewBasis[0] = basisVec1.slice(0);
	viewBasis[1] = basisVec2.slice(0);
}
function orthonormalizeViewBasis() {
	console.log("FUNCTION CALL: orthonormalizeViewBasis()");

	//Graham-Schmidt process, as explained here: https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process
	//This is really nice for testing if this function worked: https://academo.org/demos/3d-vector-plotter/

	var v1 = viewBasis[0];
	var v2 = viewBasis[1];

	var u1 = v1.slice(0);
	var e1 = makeUnitVector(u1);

	var u2 = [];
	var proju1v2 = projUV(u1, v2);
	for(var i=0; i<v2.length; ++i) {
		u2[i] = v2[i] - proju1v2[i];
	}
	var e2 = makeUnitVector(u2);

	viewBasis[0] = e1.slice(0);
	viewBasis[1] = e2.slice(0);
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
function getAxisPoints() {
	console.log("FUNCTION CALL: getAxisPoints()");

	var projCenterXY = getScreenCoords(center);

	var xMin = projCenterXY[0] - ((page.canvas.width/2)/zoom);
	var xMax = projCenterXY[0] + ((page.canvas.width/2)/zoom);
	var yMin = projCenterXY[1] - ((page.canvas.height/2)/zoom);
	var yMax = projCenterXY[1] + ((page.canvas.height/2)/zoom);

	var points = [[], [], []];
	var origin = [0, 0, 0];
	var projOrigin = getScreenCoords(origin);
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
			currentScreenPoint = getScreenCoords(currentPoint);
			points[i].push(currentScreenPoint);
			finished = false;
			currentPointCount = 0;
			while((!finished) && (currentPointCount <= maxPointCount)) {
				nextPoint = currentPoint.slice(0);
				nextPoint[i] += j;
				nextScreenPoint = getScreenCoords(nextPoint);
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
				currentScreenPoint = getScreenCoords(currentPoint);

				++currentPointCount;
			}
			if(j == 1) {
				points[i].push("FLIP");
			}
		}
	}

	return points;
}
function getScreenCoords(vec) {
	//
	return [compUV(viewBasis[0], vec), compUV(viewBasis[1], vec)];
}
function drawAxes(axes) {
	console.log("FUNCTION CALL: drawAxes("+axes+")");

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
}
function drawViewVector() {
	console.log("FUNCTION CALL: drawViewVector()");

	var startPoint = getScreenCoords(center);

	var vec = [];
	for(var i=0; i<center.length; ++i) {
		vec.push(center[i] + viewVector[i]);
	}
	var endPoint = getScreenCoords(vec);

	context.beginPath();
	context.moveTo(startPoint[0], startPoint[1]);
	context.lineTo(endPoint[0], endPoint[1]);
	context.stroke();
}
function drawBasisVectors() {
	console.log("FUNCTION CALL: drawBasisVectors()");

	var startPoint = getScreenCoords(center);

	var vecs = [];
	for(var i=0; i<viewBasis.length; ++i) {
		vecs.push(viewBasis[i].slice(0));
		for(var j=0; j<center.length; ++j) {
			vecs[i][j] += center[j];
		}
		vecs[i] = getScreenCoords(vecs[i]);
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

	viewVector[0] += d[0]*viewBasis[0][0]*dragRotatingConstant*-1;
	viewVector[0] += d[1]*viewBasis[1][0]*dragRotatingConstant;
	viewVector[1] += d[0]*viewBasis[0][1]*dragRotatingConstant*-1;
	viewVector[1] += d[1]*viewBasis[1][1]*dragRotatingConstant;
	viewVector[2] += d[0]*viewBasis[0][2]*dragRotatingConstant*-1;
	viewVector[2] += d[1]*viewBasis[1][2]*dragRotatingConstant;

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