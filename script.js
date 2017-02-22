//Constants
var zoomPowerConstant = 1.1; //This is used when calculating the zoom factor when scrolling.
var mouseWheelCalibrationConstant = 53; //This is the value given when the mouse is scrolled one notch.
var defaults = { //The defaults that the page loads when you first open it.
	x: "cos(arccos(cos(T)))",
	y: "(E^(1/25))*cos(T)",
	z: "(E^(1/25))*sin(T)",
	tmin: "-200",
	tmax: "100",
	tstep: "0.05",
	center: function() { return [0, 0, 0]; },
	viewVector: function() { return [1, 1, 1]; },
	viewBasis: function() {
		var foo = Math.sqrt(2);
		var bar = Math.sqrt(1.5);
		return [[-1/foo, 1/foo, 0], [-0.5/bar, -0.5/bar, 1/bar]];
	},
	zoom: 50,
	viewRotation: 0,
	maxPoints: 6,
	minPoints: 3
};
var axisColors = ["#ff0000", "#00cc00", "#0000ff"];
var lightAxisColors = ["#ffaaaa", "#aaccaa", "#aaaaff"];
var canvasBackgroundColor = "#dddddd";
var curveColor = "#000000";
var showNegativeAxes = true;
var dragRotatingConstant = 1/100; //This constant slows down the rate that dragging rotates the graph.
var dragPanningConstant = 1/40; //This constant slows down the rate that dragging pans the graph.
var axesStrokeConstant = 2; //Make the axis lines thicker than default.
var debugModeAreaLineBreaks = 1; //The number of line breaks above the debug area.
var mouseDeltasToKeep = 8; //How many of the last mouse movements to keep recorded for panning/rotating.
var debugMode = true;
var debugModeOnGraph = false;
var rotateCheckButtonSpeed = 25; //How often the program checks if the rotate button is still pressed, in milliseconds.
var rotateDegreesPerTick = 1.5; //How many degrees the view rotates per tick.
var mathSpecialStrings = ["(", ")", "+", "-", "*", "/", "^", "%", "arcsin", "arccos", "arctan", "cos", "sin", "tan", "cot", "sec", "csc", "sqrt", "logbase", "log", "ln", "max", "min", "floor", "ceil", "round", "PI", "E", "T", ","];
var precedence = {
	"+": 2,
	"-": 2,
	"*": 3,
	"/": 3,
	"^": 5,
	"sin": 4,
	"cos": 4,
	"tan": 4,
	"cot": 4,
	"sec": 4,
	"csc": 4,
	"%": 4,
	"arcsin": 4,
	"arccos": 4,
	"arctan": 4,
	"sqrt": 4,
	"logbase": 4,
	"log": 4,
	"ln": 4,
	"max": 4,
	"min": 4,
	"floor": 4,
	"ceil": 4,
	"round": 4
};
var associativity = {
	"+": "left",
	"-": "left",
	"*": "left",
	"/": "left",
	"^": "right",
	"sin": "right",
	"cos": "right",
	"tan": "right",
	"cot": "right",
	"sec": "right",
	"csc": "right",
	"%": "left",
	"arcsin": "right",
	"arccos": "right",
	"arctan": "right",
	"sqrt": "right",
	"logbase": "right",
	"log": "right",
	"ln": "right",
	"max": "right",
	"min": "right",
	"floor": "right",
	"ceil": "right",
	"round": "right"
};
var funcArgs = {
	"+": 2,
	"-": 2,
	"*": 2,
	"/": 2,
	"^": 2,
	"sin": 1,
	"cos": 1,
	"tan": 1,
	"cot": 1,
	"sec": 1,
	"csc": 1,
	"%": 2,
	"arcsin": 1,
	"arccos": 1,
	"arctan": 1,
	"sqrt": 1,
	"logbase": 2,
	"log": 1,
	"ln": 1,
	"max": 2,
	"min": 2,
	"floor": 1,
	"ceil": 1,
	"round": 1
}

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
var viewRotation = 0;
var center = [];
var front; //True if looking from the front, false if looking from the back.
var userFunction = []; //Array of length 3, which each entry being a function you can call.
var curveCoordinates = []; //Array containing all of the points, in order of the parametric curve.
var keptMouseDeltas = [];

//Classes
function mathFunc(f, args) {
	this.func = f;
	this.args = args;
}

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
	getCurvePoints();

	updateGraphDisplay();
}
function updateGraphDisplay() {
	console.log("FUNCTION CALL: updateGraphDisplay()");

	clearCanvas();
	setConstantContextTransforms();
	orthonormalizeViewBasis();
	dynamicContextTransformations();
	var axisPoints = getAxisPoints();
	TEMP = axisPoints.slice(0);
	drawAxes(axisPoints);

	drawCurve();

	if(debugMode) {
		updateDebugDisplay();
	}
}
function getCurvePoints() {
	console.log("FUNCTION CALL: getCurvePoints()");
	
	var tMin = Number(page.tminInputField.value);
	var tMax = Number(page.tmaxInputField.value);
	var tStep = Number(page.tstepInputField.value);

	if(isNaN(tMin) || isNaN(tMax) || isNaN(tStep)) {
		return;
	}
	else {
		curveCoordinates = [];
		var t = tMin;
		var fT;
		while(t <= tMax) {
			fT = [0, 0, 0];
			for(var i=0; i<userFunction.length; ++i) {
				fT[i] = userFunction[i].func(t, userFunction[i].args);
			}
			curveCoordinates.push(fT);
			t += tStep;
		}
	}
}
function drawCurve() {
	if(curveCoordinates.length == 0) {
		return;
	}

	console.log("FUNCTION CALL: drawCurve()");

	context.strokeStyle = curveColor;

	var currentPoint = projectOntoScreen(curveCoordinates[0]);
	context.moveTo(currentPoint[0], currentPoint[1]);
	context.beginPath();

	for(var i=1; i<curveCoordinates.length; ++i) {
		currentPoint = projectOntoScreen(curveCoordinates[i]);
		context.lineTo(currentPoint[0], currentPoint[1]);
	}
	context.stroke();
}
function dynamicContextTransformations() {
	console.log("FUNCTION CALL: dynamicContextTransformations()");

	var originLocation = projectOntoScreen(center);
	context.transform(Math.cos(degToRad(viewRotation)), -Math.sin(degToRad(viewRotation)), Math.sin(degToRad(viewRotation)), Math.cos(degToRad(viewRotation)), 0, 0);
	context.transform(1, 0, 0, 1, -originLocation[0], -originLocation[1]);
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

	if(debugModeOnGraph) {
		drawViewVector(); //This is used for debugging purposes. Furthermore, you should never see this vector, as it should be perfectly edge-on.
		drawBasisVectors(); //This is used for debugging purposes.
	}
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
	userFunction[0] = processFunction(page.xInputField.value);
	userFunction[1] = processFunction(page.yInputField.value);
	userFunction[2] = processFunction(page.zInputField.value);
}
function processFunction(functionString) {
	console.log("FUNCTION CALL: processFunction("+functionString+")");

	//Using these resources:
	//http://stackoverflow.com/questions/114586/smart-design-of-a-math-parser
	//http://lukaszwrobel.pl/blog/math-parser-part-1-introduction
	//https://en.wikipedia.org/wiki/Infix_notation
	//https://en.wikipedia.org/wiki/Shunting-yard_algorithm
	//https://en.wikipedia.org/wiki/Reverse_Polish_notation
	//http://scriptasylum.com/tutorials/infix_postfix/algorithms/postfix-evaluation/index.htm
	//https://upload.wikimedia.org/wikipedia/commons/2/24/Shunting_yard.svg
	//http://wcipeg.com/wiki/Shunting_yard_algorithm
	//http://stackoverflow.com/questions/11708195/infix-to-postfix-with-function-support

	var infixString = functionString;
	var infixArray = infixStringToArray(infixString);
	var postfixArray = convertInfixToPostfix(infixArray);
	return convertPostfixToFunction(postfixArray);
}
function convertPostfixToFunction(postfix) {
	var stack = [];
	var nextToken;
	var stackObjArgs;
	var stackObjFunc;
	var args;
	var inputs = [];
	while(postfix.length > 0) {
		nextToken = postfix.shift();
		if(isOperand(nextToken)) {
			stackObjArgs = Number(nextToken);
			if(nextToken == "PI") {
				stackObjFunc = function(t) {
					return Math.PI;
				}
			}
			else if(nextToken == "E") {
				stackObjFunc = function(t) {
					return Math.E;
				}
			}
			else if(nextToken == "T") {
				stackObjFunc = function(t) {
					return t;
				}
			}
			else {
				stackObjFunc = function(t) {
					return this.args;
				}
			}
			stack.push(new mathFunc(stackObjFunc, stackObjArgs));
		}
		else { //It's not an operand, so it's an operator.
			args = funcArgs[nextToken];
			if(stack.length < args) {
				throw("Not enough values for function! "+nextToken+" requires "+args+" inputs, but only received "+stack.length+"!");
			}
			else {
				inputs = [];
				for(var i=0; i<args; ++i) {
					inputs.unshift(stack.pop());
				}
				stack.push(makeFunction(nextToken, inputs));
			}
		}
	}
	return stack[0];
}
function makeFunction(func, args) {
	var returnObjFunc;
	var returnObjArgs = args.slice(0);
	switch(func) {
		case "+":
			returnObjFunc = function(t) {
				return this.args[0].func(t, this.args[0].args)+this.args[1].func(t, this.args[1].args);
			}
			break;
		case "-":
			returnObjFunc = function(t) {
				return this.args[0].func(t, this.args[0].args)-this.args[1].func(t, this.args[1].args);
			}
			break;
		case "*":
			returnObjFunc = function(t) {
				return this.args[0].func(t, this.args[0].args)*this.args[1].func(t, this.args[1].args);
			}
			break;
		case "/":
			returnObjFunc = function(t) {
				return this.args[0].func(t, this.args[0].args)/this.args[1].func(t, this.args[1].args);
			}
			break;
		case "^":
			returnObjFunc = function(t) {
				return Math.pow(this.args[0].func(t, this.args[0].args), this.args[1].func(t, this.args[1].args));
			}
			break;
		case "sin":
			returnObjFunc = function(t) {
				return Math.sin(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "cos":
			returnObjFunc = function(t) {
				return Math.cos(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "tan":
			returnObjFunc = function(t) {
				return Math.tan(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "cot":
			returnObjFunc = function(t) {
				return 1/Math.tan(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "sec":
			returnObjFunc = function(t) {
				return 1/Math.cos(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "csc":
			returnObjFunc = function(t) {
				return 1/Math.sin(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "%":
			returnObjFunc = function(t) {
				return this.args[0].func(t, this.args[0].args)%this.args[1].func(t, this.args[1].args);
			}
			break;
		case "arcsin":
			returnObjFunc = function(t) {
				return Math.asin(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "arccos":
			returnObjFunc = function(t) {
				return Math.acos(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "arctan":
			returnObjFunc = function(t) {
				return Math.atan(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "sqrt":
			returnObjFunc = function(t) {
				return Math.sqrt(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "logbase":
			returnObjFunc = function(t) {
				return Math.log(this.args[1].func(t, this.args[1].args))/Math.log(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "log":
			returnObjFunc = function(t) {
				return Math.log(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "ln":
			returnObjFunc = function(t) {
				return Math.log(this.args[0].func(t, this.args[0].args))/Math.log(Math.E);
			}
			break;
		case "max":
			returnObjFunc = function(t) {
				var a = this.args[0].func(t, this.args[0].args);
				var b = this.args[1].func(t, this.args[1].args);
				return a>b ? a : b;
			}
			break;
		case "min":
			returnObjFunc = function(t) {
				var a = this.args[0].func(t, this.args[0].args);
				var b = this.args[1].func(t, this.args[1].args);
				return a<b ? a : b;
			}
			break;
		case "floor":
			returnObjFunc = function(t) {
				return Math.floor(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "ceil":
			returnObjFunc = function(t) {
				return Math.ceil(this.args[0].func(t, this.args[0].args));
			}
			break;
		case "round":
			returnObjFunc = function(t) {
				return Math.round(this.args[0].func(t, this.args[0].args));
			}
			break;
	}
	return new mathFunc(returnObjFunc, returnObjArgs);
}
function infixStringToArray(infix) {
	console.log("FUNCTION CALL: infixStringToArray("+infix+")");

	var infixArray = [];
	var currentString = infix;
	var nextChar;
	var num = "";
	var lastCharOperator = true;
	var negative;
	while(currentString.length > 0) {
		nextChar = false;
		negative = false;
		if(lastCharOperator && currentString[0] == "-" && !isNaN(currentString[1])) {
			negative = true;
		}
		if(!negative) {
			for(var i=0; i<mathSpecialStrings.length; ++i) {
				if(0 == currentString.indexOf(mathSpecialStrings[i])) {
					infixArray.push(mathSpecialStrings[i]);
					currentString = currentString.substr(mathSpecialStrings[i].length);
					nextChar = true;
					lastCharOperator = true;
					break;
				}
			}
		}
		if(!nextChar) {
			lastCharOperator = false;
			num = "";
			if(currentString[0] == "-") {
				num += "-";
				currentString = currentString.substr(1);
			}
			if(currentString[0] == ".") {
				num += "0";
				currentString = currentString.substr(1);
			}
			if(!isOperand(currentString[0])) {
				throw("Error! Unrecognized character: " + currentString[0]);
			}
			while(!isNaN(currentString[0]) || currentString[0] == ".") {
				num = num + currentString[0];
				currentString = currentString.substr(1);
			}
			infixArray.push(num);
		}
	}
	console.log(infixArray);
	return infixArray;
}
function convertInfixToPostfix(infix) {
	console.log("FUNCTION CALL: convertInfixToPostfix("+infix+")");
	
	//The SHUNTING-YARD ALGORITHM...

	var postfix = [];
	stack = [];
	var stackLast;
	for(var i=0; i<infix.length; ++i) {
		if(isOperand(infix[i])) {
			postfix.push(infix[i]);
		}
		else if(infix[i] == "(") {
			stack.push(infix[i]);
		}
		else if(infix[i] == ")") {
			stackLast = stack.pop();
			while(stackLast != "(") {
				postfix.push(stackLast);
				stackLast = stack.pop();
			}
		}
		else if(infix[i] == ",") {
			stackLast = stack[stack.length-1];
			while(stackLast != "(") {
				postfix.push(stackLast);
				stack.pop();
			}
		}
		else if(isOperator(infix[i])) {
			if(stack.length == 0 || stack[stack.length-1] == "(") {
				stack.push(infix[i]);
			}
			else if(precedence[infix[i]] > precedence[stack[stack.length-1]]) {
				stack.push(infix[i]);
			}
			else if((precedence[infix[i]] == precedence[stack[stack.length-1]]) && (associativity[infix[i]] == "right")) {
				stack.push(infix[i]);
			}
			else {
				postfix.push(stack.pop());
				stack.push(infix[i]);
			}
		}
	}
	while(stack.length > 0) {
		postfix.push(stack.pop());
	}
	console.log(postfix);
	return postfix;
}
function isOperand(char) {
	if(!isNaN(Number(char))) {
		return true;
	}
	else if(char == "PI") {
		return true;
	}
	else if(char == "E") {
		return true;
	}
	else if(char == "T") {
		return true;
	}
	else {
		return false;
	}
}
function isOperator(char) {
	var foo = false;
	for(var i=0; i<mathSpecialStrings.length; ++i) {
		if(char == mathSpecialStrings[i]) {
			foo = true;
			break;
		}
	}
	return foo;
}
function recenter() {
	console.log("FUNCTION CALL: recenter()");

	zoom = defaults.zoom;
	viewVector = defaults.viewVector();
	viewBasis = defaults.viewBasis();
	center = defaults.center();
	viewRotation = defaults.viewRotation;

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
	var maxPointCount = defaults.maxPoints;
	var minPointCount = defaults.minPoints;
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

				if(currentPointCount < minPointCount) {
					finished = false;
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
				context.stroke();
				context.strokeStyle = lightAxisColors[i];
				context.beginPath();
			}
			else {
				context.lineTo(axes[i][j][0], axes[i][j][1]);
			}
		}
		context.stroke();
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
function degToRad(d) {
	//
	return d * Math.PI * (1/180);
}

function pannedGraph(d) {
	console.log("FUNCTION CALL: pannedGraph("+d+")");

	var d3 = [0, 0, 0];
	for(var i=0; i<d3.length; ++i) {
		d3[i] += -1*d[0]*viewBasis[0][i];
		d3[i] += d[1]*viewBasis[1][i];
		d3[i] *= dragPanningConstant;
		d3[i] *= defaults.zoom/zoom;
	}

	for(var i=0; i<d3.length; ++i) {
		center[i] += d3[i];
	}

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
	delta[0] = Math.cos(degToRad(-viewRotation))*(mouseLocation[0]-oldMouseLocation[0]) - Math.sin(degToRad(-viewRotation))*(mouseLocation[1]-oldMouseLocation[1]);
	delta[1] = Math.sin(degToRad(-viewRotation))*(mouseLocation[0]-oldMouseLocation[0]) + Math.cos(degToRad(-viewRotation))*(mouseLocation[1]-oldMouseLocation[1]);

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
	if(event.which == 81 && !keys[String(81)]) { //Q
		viewRotation += -1*rotateDegreesPerTick;
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		updateGraphDisplay();
	}
	else if(event.which == 69 && !keys[String(69)]) { //E
		viewRotation += rotateDegreesPerTick;
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		updateGraphDisplay();
	}
	keys[String(event.which)] = true;
	updateGraphDisplay();
}
function rotatingCheckAgain() {
	if(keys[String(81)]) {
		viewRotation += -1*rotateDegreesPerTick;
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	else if(keys[String(69)]) {
		viewRotation += rotateDegreesPerTick;
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	updateGraphDisplay();
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