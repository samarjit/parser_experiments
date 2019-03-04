function ASTNode(token, leftChildNode, rightChildNode) {
	this.token = token.value;
	this.leftChildNode = leftChildNode;
	this.rightChildNode = rightChildNode;
}

function Token(type, value) {
    this.type = type;
    this.value = value
 }
function tokenize(str) {
    var result=[]; //array of tokens

    // remove spaces; remember they don't matter?
    str.replace(/\s+/g, "");
    // convert to array of characters
    str=str.split("");
    str.forEach(function (char, idx) {
        if(isDigit(char)) {
            result.push(new Token("Literal", char));
        } else if (isLetter(char)) {
            result.push(new Token("Variable", char));
        } else if (isOperator(char)) {
            result.push(new Token("Operator", char));
        } else if (isLeftParenthesis(char)) {
            result.push(new Token("Left Parenthesis", char));
        } else if (isRightParenthesis(char)) {
            result.push(new Token("Right Parenthesis", char));
        } else if (isComma(char)) {
            result.push(new Token("Function Argument Separator", char));
        }
    });
    return result;
}

function isComma(ch) {
return (ch === ",");
}
function isDigit(ch) {
return /\d/.test(ch);
}
function isLetter(ch) {
return /[a-z]/i.test(ch);
}
function isOperator(ch) {
return /\+|-|\*|\/|\^/.test(ch);
}
function isLeftParenthesis(ch) {
return (ch === "(");
}
function isRightParenthesis(ch) {
return (ch == ")");
}
   
function parse(inp){
	var outStack=[];
	var opStack=[];

	Array.prototype.addNode = function (operatorToken) {
		rightChildNode = this.pop();
		leftChildNode = this.pop();
		this.push(new ASTNode(operatorToken, leftChildNode, rightChildNode));
	}

	Array.prototype.peek = function() {
		return this.slice(-1)[0];
	};

	var assoc = {
		"^" : "right",
		"*" : "left",
		"/" : "left",
		"+" : "left",
		"-" : "left"
	};

	var prec = {
		"^" : 4,
		"*" : 3,
		"/" : 3,
		"+" : 2,
		"-" : 2
	};

	Token.prototype.precedence = function() {
		return prec[this.value];
	};
	
	Token.prototype.associativity = function() {
		return assoc[this.value];
	};

	//tokenize
	var tokens=tokenize(inp);

	tokens.forEach(function(v) {
		//If the token is a number, then push it to the output stack
		if(v.type === "Literal" || v.type === "Variable" ) {
			outStack.push(new ASTNode(v, null, null));
		} 
		//If the token is a function token, then push it onto the stack.
		else if(v.type === "Function") {
			opStack.push(v);
		} //If the token is a function argument separator 
		else if(v.type === "Function Argument Separator") {
			//Until the token at the top of the stack is a left parenthesis
			//pop operators off the stack onto the output queue.
			while(opStack.peek()
				&& opStack.peek().type !== "Left Parenthesis") {
				outStack.addNode(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Mismatched parentheses");
				return;
			}*/
		} 
		//If the token is an operator, o1, then:
		else if(v.type == "Operator") {
			  //while there is an operator token o2, at the top of the operator stack and either
			  while (opStack.peek() && (opStack.peek().type === "Operator") 
				//o1 is left-associative and its precedence is less than or equal to that of o2, or
				&& ((v.associativity() === "left" && v.precedence() <= opStack.peek().precedence())
					//o1 is right associative, and has precedence less than that of o2,
					|| (v.associativity() === "right" && v.precedence() < opStack.peek().precedence()))) {
			  	outStack.addNode(opStack.pop());
			}
			//at the end of iteration push o1 onto the operator stack
			opStack.push(v);
		} 
		
		//If the token is a left parenthesis (i.e. "("), then push it onto the stack.
		else if(v.type === "Left Parenthesis") {
			opStack.push(v);
		}
		//If the token is a right parenthesis (i.e. ")"):
		else if(v.type === "Right Parenthesis") {
			//Until the token at the top of the stack is a left parenthesis, pop operators off the stack onto the output queue.
			while(opStack.peek() 
				&& opStack.peek().type !== "Left Parenthesis") {
				outStack.addNode(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Unmatched parentheses");
				return;
			}*/
			//Pop the left parenthesis from the stack, but not onto the output queue.
			opStack.pop();

			//If the token at the top of the stack is a function token, pop it onto the output queue.
			if(opStack.peek() && opStack.peek().type === "Function") {
				outStack.addNode(opStack.pop());
			}
		}
	});

	while(opStack.peek()) {
		outStack.addNode(opStack.pop());
	}

	return outStack.pop();
}




ASTNode.prototype.toString = function(count) {
    if (!this.leftChildNode && !this.rightChildNode)
      return this.token + "\t=>null\n" + Array(count+1).join("\t") + "=>null";
    var count = count || 1;
    count++;
    return this.token + "\t=>" + this.leftChildNode.toString(count) + "\n" + Array(count).join("\t") + "=>" + this.rightChildNode.toString(count);
 };
 var ast = parse("3 + 4 * 2 / ( 1 - 5 ) ^ 2 ^ 3");
 console.log("" + ast);