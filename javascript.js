const keyboard = document.querySelector('#keyboard');
const screen = document.querySelector("#screen");
const clearBtn = document.querySelector("#clear");

let lastWasEquals = false; // track whether last action produced a result via "="

clearBehavior();

// helper regex for signed numbers, allowing .21, 21., -0.5, +.3 etc.
const numberPattern = '[+-]?(?:\\d*\\.\\d+|\\d+\\.?\\d*)';
const exprRe = new RegExp(`^\\s*(${numberPattern})\\s*([+\\-\\/X%])\\s*(${numberPattern})\\s*$`);

function clearBehavior() {
  screen.textContent = "0";
  lastWasEquals = false;
  updateClearBtn();
}

function updateClearBtn() {
  // AC only when the screen is exactly "0" (fresh state). Otherwise show "C".
  clearBtn.textContent = (screen.textContent === "0") ? "AC" : "C";
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
  const m = String(str).match(exprRe);
  if (!m) return "ERROR";
  return operateHelper(m[1], m[2], m[3]);
}

// format number to max 4 decimal places, then strip trailing zeros/dot
function formatResult(num) {
  if (!Number.isFinite(num)) return "ERROR";
  const s = Number(num).toFixed(4);         // always 4 decimal places
  return s.replace(/\.?0+$/, "");           // remove trailing zeros and optional dot
}

// recompute info about the current screen text (safer than keeping many flags)
function lastTokenInfo(screenTxt) {
  return {
    isNewScreenState: screenTxt === "0" || screenTxt === undefined || screenTxt === "ERROR" || screenTxt === "undefined" || screenTxt === "",
    isLastThingOp: /[+\-\/X%]$/.test(screenTxt),
    lastNumberMatch: screenTxt.match(/([+\-]?(?:\d*\.?\d+|\d+\.?))$/), // last number (if any)
  };
}

keyboard.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName !== 'BUTTON') return;

  let screenTxt = screen.textContent;
  const info = lastTokenInfo(screenTxt);
  const isNewScreenState = info.isNewScreenState;
  const isLastThingOp = info.isLastThingOp;
  const lastNumber = info.lastNumberMatch ? info.lastNumberMatch[0] : null;
  const lastNumberHasDecimal = lastNumber ? lastNumber.includes('.') : false;

  switch (target.id) {
    case "clear":
      // AC when fresh, C otherwise
      if (clearBtn.textContent === "AC") {
        clearBehavior();
      } else {
        // C: clear current entry to 0 (but keep state like lastWasEquals = false)
        screen.textContent = "0";
        lastWasEquals = false;
        updateClearBtn();
      }
      break;

    case "backspace":
      lastWasEquals = false;
      if (isNewScreenState) {
        clearBehavior();
      } else {
        screenTxt = screenTxt.slice(0, -1);
        if (screenTxt === "" || screenTxt === "+" || screenTxt === "-") {
          clearBehavior();
        } else {
          screen.textContent = screenTxt;
          updateClearBtn();
        }
      }
      break;

    case "percent":
    case "divide":
    case "multiply":
    case "subtract":
    case "add": {
      const op = target.textContent; // "+", "-", "/", "X", "%"
      if (lastWasEquals) {
        if (screen.textContent === "ERROR") {
          clearBehavior();
        } else {
          screen.textContent = screen.textContent + op;
          lastWasEquals = false;
        }
      } else if (isNewScreenState) {
        // allow unary + or - at start
        if (op === "+" || op === "-") {
          screen.textContent = op;
        } else {
          // ignore other ops when there's no number yet
        }
      } else if (isLastThingOp) {
        // replace the last operator with the new one
        screen.textContent = screenTxt.slice(0, -1) + op;
      } else {
        // if there's already a complete "num1 op num2", evaluate it first then append operator
        const m = String(screenTxt).match(exprRe);
        if (m) {
          const ans = operate(screenTxt);
          if (ans === undefined || ans === "ERROR") {
            screen.textContent = "ERROR";
          } else {
            screen.textContent = String(ans) + op;
          }
        } else {
          // just append operator
          screen.textContent = screenTxt + op;
        }
      }
      lastWasEquals = false;
      updateClearBtn();
      break;
    }

    case "decimal":
      // If last action was "=", start fresh with "0."
      if (lastWasEquals) {
        screen.textContent = "0.";
        lastWasEquals = false;
        updateClearBtn();
        break;
      }

      if (isNewScreenState) {
        screen.textContent = "0.";
      } else if (isLastThingOp) {
        screen.textContent = screenTxt + "0.";
      } else {
        if (!lastNumberHasDecimal) {
          screen.textContent = screenTxt + ".";
        } else {
          // ignore extra decimal
        }
      }
      lastWasEquals = false;
      updateClearBtn();
      break;

    case "equals": {
      const m = String(screenTxt).match(exprRe);
      if (!m) break; // nothing complete to evaluate
      const ans = operate(screenTxt);
      if (ans === undefined || ans === "ERROR") {
        screen.textContent = "ERROR";
        lastWasEquals = false;
      } else {
        screen.textContent = formatResult(ans);
        lastWasEquals = true; // note that the last action was "="
      }
      updateClearBtn();
      break;
    }

    case "zero":
    case "one":
    case "two":
    case "three":
    case "four":
    case "five":
    case "six":
    case "seven":
    case "eight":
    case "nine": {
      const val = target.textContent;
      // If last action was "=", pressing a digit starts fresh
      if (lastWasEquals || isNewScreenState || screenTxt === "ERROR") {
        screen.textContent = val;
      } else if (screenTxt === "0") {
        screen.textContent = val;
      } else {
        screen.textContent = screenTxt + val;
      }
      lastWasEquals = false;
      updateClearBtn();
      break;
    }
  }

  // final normalization: if screen is empty or invalid, reset
  if (!screen.textContent || screen.textContent === "") {
    clearBehavior();
  }
});
