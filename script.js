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
	viewVector: function() { return [1/Math.sqrt(3), 1/Math.sqrt(3), 1/Math.sqrt(3)]; },
	zoom: 1
};

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
var zoom = defaults.zoom;
var currentlyPanning = false;
var currentlyRotating = false;
var viewVector = [];
var viewBasis = [];
var center = [];

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

	page.canvas.style.transform = "matrix(0, -1, 1, 0, 0, 0)"; //Flip the entire canvas, so an increase in y is up instead of down.
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
}
function clearCanvas() {
	console.log("FUNCTION CALL: clearCanvas()");

	context.setTransform(1, 0, 0, 1, 0, 0); //Reset all context transforms
	context.clearRect(0, 0, page.canvas.width, page.canvas.height); //Clear the entire canvas
	context.beginPath(); //Start a new line path.

}
function setConstantContextTransforms() {
	console.log("FUNCTION CALL: setConstantContextTransforms()");

	context.transform(1, 0, 0, 1, page.canvas.width/2, page.canvas.height/2); //Put 0,0 in the center of the canvas
	context.transform(zoom, 0, 0, zoom, 0, 0); //Scale the canvas
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
	zoom = 1;
	//
}

function pannedGraph(delta) {
	console.log("FUNCTION CALL: pannedGraph("+delta+")");

	updateGraphDisplay();
}
function rotatedGraph(delta) {
	console.log("FUNCTION CALL: rotatedGraph("+delta+")");

	updateGraphDisplay();
}
function mouseMoved(event) {
	mouseLocation[0] = event.clientX;
	mouseLocation[1] = event.clientY;

	var delta = [];
	delta[0] = mouseLocation[0] - oldMouseLocation[0];
	delta[1] = mouseLocation[1] - oldMouseLocation[1];
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
	keys[String(event.which)] = true;
	if(keys["16"]) { //Shift key pressed
		currentlyRotating = true;
		oldMouseLocation[0] = event.clientX;
		oldMouseLocation[1] = event.clientY;
	}
}
function keyup(event) {
	keys[String(event.which)] = false;
	if(keys["16"]) { //Shift key released
		currentlyRotating = false;
	}
}
function mousedown(event) {
	mouseButtons[String(event.which)] = true;
	currentlyPanning = mouseButtons["1"];
}
function mouseup(event) {
	mouseButtons[String(event.which)] = false;
	currentlyPanning = mouseButtons["1"];
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