//Constants
var zoomPowerConstant = 1.1; //This is used when calculating the zoom factor when scrolling.
var mouseWheelCalibrationConstant = 53; //This is the value given when the mouse is scrolled one notch.

//Global Variables
var page = {};
var keys = {};
var mouseButtons = {};
var context;
var xFunction;
var yFunction;
var zFunction;
var mouseLocation = [];
var zoom = 1;

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
	page.recenterButton.addEventListener("click", updateGraphDisplay);

	document.addEventListener("keydown", function(event) {
		keys[String(event.which)] = true;
	});
	document.addEventListener("keyup", function(event) {
		keys[String(event.which)] = false;
	});
	document.addEventListener("mousemove", function(event) {
		mouseLocation[0] = event.clientX;
		mouseLocation[1] = event.clientY;
		if(mouseButtons["1"]) { //Left mouse button pressed, meaning we're panning.

		}
		else if(keys["16"]) { //Shift key pressed, meaning we're rotating

		}
	});
	page.canvas.addEventListener("mousedown", function(event) {
		mouseButtons[String(event.which)] = true;
	});
	document.addEventListener("mouseup", function(event) {
		mouseButtons[String(event.which)] = false;
	});
	page.canvas.addEventListener("wheel", function(event) {
		var wheelChange = event.deltaY;
		var zoomMultiplier = Math.pow(zoomPowerConstant, wheelChange*(1/mouseWheelCalibrationConstant)); //I may want to change how this zoom works later.
		zoom *= zoomMultiplier;
		console.log(zoom);
	});

	loadInitialAndDefaults();
	updateGraphComputations();
}
function loadInitialAndDefaults() {
	console.log("FUNCTION CALL: loadInitialAndDefaults()");

}
function updateGraphComputations() {
	console.log("FUNCTION CALL: updateGraphComputations()");

	updateGraphDisplay();
}
function updateGraphDisplay() {
	console.log("FUNCTION CALL: updateGraphDisplay()");
}
function processFunctions() {
	console.log("FUNCTION CALL: processFunctions()");
}

//Executed Code
window.setTimeout(setup, 0);