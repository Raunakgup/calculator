const keyboard = document.querySelector('#keyboard');
const screen = document.querySelector("#screen");
const clearBtn = document.querySelector("#clear");
clearBehavior();

function clearBehavior() {
    screen.textContent = "0";
    clearBtn.textContent = "AC";
    isDecimalBefore = false;
    isOpBefore = false;
}

function operateHelper(num1, op, num2) {
    num1 = Number(num1);
    num2 = Number(num2);
    if (isNaN(num1) || isNaN(num2)) return "ERROR";
    switch (op) {
        case "+":
            return num1 + num2;
        case "-":
            return num1 - num2;
        case "%":
            if (num2 === 0) return undefined;
            return num1 % num2;
        case "X":
            return num1 * num2;
        case "/":
            if (num2 === 0) return undefined;
            return num1 / num2;
        default:
            return "ERROR";
    }
}
function operate(str) {
    const obj = separateString(str);
    if (obj === null) return "ERROR";
    return operateHelper(obj["num1"], obj["op"], obj["num2"]);
}
function separateString(str) {
    const re = /^\s*((?:\d*\.\d+|\d+))\s*([+\-\/X%])\s*((?:\d*\.\d+|\d+))\s*$/;
    const m = String(str).match(re);
    if (!m) return null;
    return {
        num1: m[1],
        op: m[2],
        num2: m[3]
    };
}
function ifNewScreenState(screenTxt) {
    if (screenTxt === "0" || screenTxt === undefined || screenTxt === "Error") return true;
    return false;
}
keyboard.addEventListener("click", (e) => {
    const target = e.target;
    if (!e.target.tagName === 'BUTTON') return;
    const screenTxt = screen.textContent;
    const isLastThingOp = ['+', '-', '%', '/', 'X'].includes(screenTxt.at(-1));

    const isNewScreenState = ifNewScreenState(screenTxt);
    switch (target.id) {
        case "clear":
            clearBehavior();
            break;
        case "backspace":
            if (isNewScreenState) {
                clearBehavior();
            } else {
                screen.textContent = screenTxt.slice(0,-1);
            }
            break;
        case "percent":
        case "divide":
        case "multiply":
        case "subtract":
        case "add":
            const op = target.textContent;
            console.log(op);
            if (isNewScreenState) {
                if (op === "+" || op === "-") {
                    clearBehavior();
                    screen.textContent = op;
                }
            } else if (isLastThingOp) {
                screen.textContent = screenTxt.slice(-1) + op;
            } else {
                if (isOpBefore) {
                    // eval result
                    const ans = operate(screenTxt);
                    if (ans === undefined || ans === "ERROR") {
                        screen.textContent = ans;
                    }
                    screen.textContent = operate(screenTxt) + op;
                    isOpBefore = false;
                } else {
                    screen.textContent += op;
                    isOpBefore = true;
                }
                isDecimalBefore = false;
            }
            break;
        case "decimal":
            if (isNewScreenState) {
                clearBehavior();
            }
            else if (isLastThingOp) {
                alert("There needs to be a number before the decimal if it is being written after an operator.");
            } else {
                if (isDecimalBefore) {
                    alert("There is a decimal in the number already.")
                } else {
                    screen.textContent += ".";
                    isDecimalBefore = true;
                }
            }
            break;
        case "zero":
        case "one":
        case "two":
        case "three":
        case "four":
        case "five":
        case "six":
        case "seven":
        case "eight":
        case "nine":
            const val = target.textContent;
            if (isNewScreenState) {
                clearBehavior();
            }
            if(screenTxt === "0"){
                screen.textContent = val;
            }else{
                screen.textContent += val;
            }
            break;
    }
    if(screen.textContent === "" || screen.textContent ===  "0"){
        clearBehavior();
    }
});