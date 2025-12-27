const keyboard = document.querySelector('#keyboard');
const screen = document.querySelector("#screen");
const clearBtn = document.querySelector("#clear");

screen.textContent = "0";

// Map HTML button text to standard math symbols for processing
const symbolMap = {
    'X': '*',
    '÷': '/',
    '-': '-',
    '+': '+',
    '%': '%'
};

keyboard.addEventListener("click", (e) => {
    const target = e.target;
    if (!target.matches('button')) return;

    const btnValue = target.textContent;
    const lastChar = screen.textContent.slice(-1);
    
    // Check if the last character is an operator
    const isLastCharOperator = ['+', '−', '×', '÷', '%'].includes(lastChar);

    switch (target.id) {
        case "clear":
            screen.textContent = "0";
            clearBtn.textContent = "AC";
            break;

        case "backspace":
            if (screen.textContent === "Error" || screen.textContent === "Infinity" || screen.textContent === "NaN" || screen.textContent === "0") {
                screen.textContent = "0";
                clearBtn.textContent = "AC";
                return;
            }
            screen.textContent = screen.textContent.slice(0, -1);
            if (screen.textContent === "0") clearBtn.textContent = "AC";
            break;

        case "equals":
            // Don't calculate if ends with operator
            if (isLastCharOperator) return; 
            
            const result = parseAndCalculate(screen.textContent);
            screen.textContent = result;
            break;

        case "add":
        case "subtract":
        case "multiply":
        case "divide":
        case "percent":

            // Prevent double operators (e.g., "5++") -> Replace the last one
            if (isLastCharOperator) {
                screen.textContent = screen.textContent.slice(0, -1) + btnValue;
            } else {
                screen.textContent += btnValue;
            }
            break;

        case "decimal":
            // Prevent multiple decimals in the current number segment
            // Split by operators to find the current number being typed
            const currentNumber = screen.textContent.split(/[+−×÷%]/).pop();
            if (!currentNumber.includes(".")) {
                screen.textContent += ".";
            }
            break;

        default: // Numbers 0-9
            if (screen.textContent === "0" || screen.textContent === "Error") {
                screen.textContent = btnValue;
            } else {
                screen.textContent += btnValue;
            }
            break;
    }
    // Logic to toggle "AC" to "C"
    if (screen.textContent !== "0") {
        clearBtn.textContent = "C";
    }
});

/**
 * Parsing Logic (Replacing eval)
 * 1. Tokenize: Split string into numbers and operators.
 * 2. Pass 1: Handle Multiplication (*), Division (/), and Modulo (%).
 * 3. Pass 2: Handle Addition (+) and Subtraction (-).
*/
function parseAndCalculate(expression) {
    // 1. Tokenize: Extract numbers and operators
    // This regex splits by the visual operators in the HTML
    const tokens = expression.split(/([+−×÷%])/).map(t => t.trim()).filter(t => t !== "");
    
    // If we have just a number, return it
    if (tokens.length === 0) return "0";
    if (tokens.length === 1) return tokens[0];

    // Convert numbers from strings to floats
    let parsedTokens = tokens.map(t => {
        // If it's an operator from our map, keep it, otherwise parse float
        return ['+', '−', '×', '÷', '%'].includes(t) ? t : parseFloat(t);
    });

    // 2. First Pass: High Precedence (×, ÷, %)
    for (let i = 0; i < parsedTokens.length; i++) {
        const operator = parsedTokens[i];
        
        if (operator === '×' || operator === '÷' || operator === '%') {
            const prev = parsedTokens[i - 1];
            const next = parsedTokens[i + 1];
            
            let intermediateResult;
            
            if (operator === '×') intermediateResult = prev * next;
            else if (operator === '÷') {
                if(next === 0) return "Error";
                intermediateResult = prev / next;
            }
            else if (operator === '%') intermediateResult = prev % next;

            // Replace [prev, operator, next] with [intermediateResult]
            // We go back one index (i-1) and delete 3 items
            parsedTokens.splice(i - 1, 3, intermediateResult);
            
            // Reset index to verify the new token at this position
            i--; 
        }
    }

    // 3. Second Pass: Low Precedence (+, −)
    // Now parsedTokens should look like [10, '+', 5, '−', 2]
    let result = parsedTokens[0];
    
    for (let i = 1; i < parsedTokens.length; i += 2) {
        const operator = parsedTokens[i];
        const nextNumber = parsedTokens[i + 1];

        if (operator === '+') {
            result += nextNumber;
        } else if (operator === '−') {
            result -= nextNumber;
        }
    }

    // Rounding to avoid floating point errors (e.g. 0.1 + 0.2 = 0.300000004)
    return Math.round(result * 100000000) / 100000000;
}
