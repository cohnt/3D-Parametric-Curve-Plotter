//Constants


//Global Variables
var page = {};
var keys = {};
var context;
var xFunction;
var yFunction;
var zFunction;

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