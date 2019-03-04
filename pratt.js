let mPrefixParselets = {};
let mInfixParselets = {};
let TokenType = {
    NAME: 'name',
    PLUS: 'plus',
    MINUS: 'minus',
    TILDE: 'tilde',
    BANG: 'bang',
    LEFT_PAREN: 'left_paren',
    RIGHT_PAREN: 'right_paren',
    LEFT_CURLY: 'left_curly',
    RIGHT_CURLY: 'right_crly',
    getType: function (v) {
        if(!v) {
            return null;
        }
        let sw = '';
        if(v.type === 'punctuator') {
            sw = v.value;
        } else {
            sw = v.type;
        }
        switch(sw) {
            case 'name': return this.NAME; break;
            case '+': return this.PLUS; break;
            case '-': return this.MINUS; break;
            case '~': return this.TILDE; break;
            case '!': return this.BANG; break;
            case '(': return this.LEFT_PAREN; break;
            case ')': return this.RIGHT_PAREN; break;
            case '{': return this.LEFT_CURLY; break;
            case '}': return this.RIGHT_CURLY; break;
            default: return this.NAME;
        }
    }
};

let tok;
let count = 0
function lexer(expr) {
    tok  = tokenize(expr);
    console.log(tok);
    count = 0;
}

function consume() {
    count++;
    return tok[count -1];
}
function peek(){
    return tok[count];
}

function NameExpression(val){
    this.print = () => {
        return val;
    }
    this.name = val;
    this.type = 'NameExpression';
}

function PrefixExpression(op, val){
    this.print = () => {
        return op + ' ' + val.print();
    }
    this.op= op;
    this.val= val;
    this.type= 'PrefixExpression';
}

function OperatorExpression(left, op, right) {
    this.print = () => {
        return ' ( ' + left.print() + ' ' + op + ' ' + right.print() + ' ) ';
    }
    this.left= left;
    this.op = op;
    this.right= right;
    this.type= 'OperatorExpression';
}

function registerPre(token, parselet) { 
    mPrefixParselets[token] = parselet;
}

function registerIn(token, parselet) { 
    mInfixParselets[token] = parselet;
}

function parseNameExpr(parser, token) {
    return new NameExpression(token.value);
}

function parseOperator(parser, token) {
    let operand = parser.parseExpression();
    return new PrefixExpression(TokenType.getType(token), operand);
}

function parseInfix(parser, left, token) {
    let right = parser.parseExpression();
    return new OperatorExpression(left, TokenType.getType(token), right);
}

function parseGroup(parser, token) {
    let right = parser.parseExpression();
    let temp = peek();
    if(TokenType.getType(temp) === TokenType.RIGHT_PAREN) {
        consume();
    } else {
        throw new Error('Was expecing ")" but found ' + JSON.stringify(temp));
    }
    return right;
}
function parseGroupCurly(parser, token) {
    let right = parser.parseExpression();
    let temp = peek();
    if(TokenType.getType(temp) === TokenType.RIGHT_CURLY) {
        consume();
    } else {
        throw new Error('Was expecing ")" but found ' + temp);
    }
    return right;
}
function parseExpression() {
    token = consume();
    let typ = TokenType.getType(token);
    prefix = mPrefixParselets[typ];

    if (!prefix) throw new Error("Could not parse \"" + token.value + "\".");

    let left = prefix(this, token);
    token = peek();
    infix = mInfixParselets[TokenType.getType(token)];
    if(!infix) {
        return left;
    }
    consume();
    return infix(this, left, token);

}

registerPre(TokenType.NAME, parseNameExpr);
registerPre(TokenType.PLUS, parseOperator);
registerPre(TokenType.MINUS, parseOperator);
registerPre(TokenType.TILDE, parseOperator);
registerPre(TokenType.BANG, parseOperator);
registerPre(TokenType.LEFT_PAREN, parseGroup);
registerPre(TokenType.LEFT_CURLY, parseGroupCurly);
// registerPre(TokenType.RIGHT_PAREN, parseOperator);

registerIn(TokenType.NAME, parseNameExpr);
registerIn(TokenType.PLUS, parseInfix);
registerIn(TokenType.MINUS, parseInfix);

lexer('c-({aa+b}+d+e)+p');
let expression = parseExpression();
console.log(expression.print());