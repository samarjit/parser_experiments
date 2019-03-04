module.exports = Grammar;

function Grammar(Token, All, Any, Plus, Optional, Node) {
  const Star = rule => Optional(Plus(rule));

  // An "immutable" pure functional reduction of ECMAScript grammar:
  // loosely based on https://gist.github.com/avdg/1f10e268e484b1284b46
  // and http://tomcopeland.blogs.com/EcmaScript.html
  // Matches (almost) anything you can put on the right hand side of an assignment operator in ES6

  // Y combinator
  const Y = function (gen) {
    return (function(f) {return f(f)})( function(f) {
      return gen(function() {return f(f).apply(null, arguments)});
    });
  }

  return Y(function(Expression) {
    Token(/\s+/g, 'ignore');   // Ignore whitespace
   
    // const Identifier = Token(/([a-z]+)/g, 'identifier');
    // const SumExpression = All(Identifier, '=', Identifier, '+', Identifier);
    // const SumExpression = Node(All(Identifier, '=', Identifier, 'AND', Identifier),
    // ([result, left, right]) => ({ type: 'Assignment', result, left, right }));

    const StringToken = (
        Token(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, 'string'),   // single-quoted
        Token(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, 'string')    // double-quoted
    );
    const NumericToken = (
        Token(/\b((?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?)\b/g, 'number'),   // decimal
        Token(/\b(0[xX][0-9a-fA-F]+)\b/g, 'number')                                   // hex
    );
    Token(/(=>|\.\.\.|\|\||&&|>>>|>>|<<|<=|>=|\btypeof\b|\binstanceof\b|\bin\b|===|!==|!=|==|\+\+|--|\bNOT\b|\bANY\b|\bAND\b|\bnew\b|[{}[\]().?:|&=,^%*/<>+\-~!])/g, 'verbatim');

    const IdentifierToken = Token(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'identifier');
    const Identifier = Node(IdentifierToken, ([name], $) => ({ type: 'Identifier', name, anchors: [$.context.tokens[$.ti].start, $.context.tokens[$.ti].end] }));
    
    const SumExpression = Node(All(Identifier, '=', Identifier, 'AND', Identifier),
        ([result, left, right]) => ({ type: 'Assignment', result, left, right }));

    const NullToken = Token(/\b(null)\b/g, 'null');
    const BooleanToken = Token(/\b(true|false)\b/g, 'boolean');

    // Literals
    const StringLiteral = Node(StringToken, ([value]) => ({ type: 'Literal', value }));
    const NumericLiteral = Node(NumericToken, ([raw]) => ({ type: 'Literal', value: +raw, raw }));
    const NullLiteral = Node(NullToken, ([raw]) => ({ type: 'Literal', value: null, raw }));
    const BooleanLiteral = Node(BooleanToken, ([raw]) => ({ type: 'Literal', value: raw === 'true', raw }));
    const Literal = Any(StringLiteral, NumericLiteral, NullLiteral, BooleanLiteral);
    
    const Operator = Rule => Node(Rule, (_, $) => $.context.tokens[$.ti].captures[0]);
    const UnaryOperator = Operator(Any('NOT'));
    
    const EmptyElement = Node(',', () => ({ type: 'EmptyElement'}));
    const Elision = All(',', Star(EmptyElement));

    const CompoundExpression = Node(All(Expression, Star(All(',', Expression))),
      leafs => leafs.length > 1 ? { type: 'CompoundExpression', leafs } : leafs[0]);
    const PrimaryExpression = Any(Identifier, Literal, All('(', CompoundExpression, ')'));

    const UnaryExpression = Node(All(Star(UnaryOperator), PrimaryExpression ),
    parts => parts.reduceRight((argument, operator) => ({ type: 'UnaryExpression', argument, operator })));


    const ApplyBinaryOp = (BinaryOp, Expr) => Node(All(Operator(BinaryOp), Expr), ([operator, right]) => ({operator, right}));
    const ExpressionConstructor = (Expr, BinaryOp) => Node(All(Expr, Star(ApplyBinaryOp(BinaryOp, Expr))),
      parts => parts.reduce((left, { operator, right }) => ({ type: 'BinaryExpression', left, right, operator })));

    const BinaryOperatorPrecedence = [
        Any('+', '-'),
        'AND',
        'ANY',
      ];
    const LogicalORExpression = BinaryOperatorPrecedence.reduce(ExpressionConstructor, UnaryExpression);

    const ConditionalExpression = Node(All(LogicalORExpression, Optional(All('?', Expression, ':', Expression))),
      ([test, consequent, alternate]) => consequent ? ({ type: 'ConditionalExpression', test, consequent, alternate }) : test);


    return ConditionalExpression;
  });
}