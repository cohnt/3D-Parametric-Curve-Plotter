//Constants


//Global Variables
var page = {};
var context;
var xFunction;
var yFunction;
var zFunction;

//Classes


//Functions
function setup() {
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

	loadInitialAndDefaults();
	updateGraphComputations();
}
function loadInitialAndDefaults() {

}
function updateGraphComputations() {

	updateGraphDisplay();
}
function updateGraphDisplay() {

}

//Event Listeners


//Executed Code
window.setTimeout(setup, 0);