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

    // Tokens: mostly from https://www.regular-expressions.info/examplesprogrammer.html

    // Assigning the same type to two Tokens makes them return the same matching rule, so one can be ignored
    const StringToken = (
      Token(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, 'string'),   // single-quoted
      Token(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, 'string')    // double-quoted
    );

    const NumericToken = (
      Token(/\b((?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?)\b/g, 'number'),   // decimal
      Token(/\b(0[xX][0-9a-fA-F]+)\b/g, 'number')                                   // hex
    );

    const NullToken = Token(/\b(null)\b/g, 'null');
    const BooleanToken = Token(/\b(true|false)\b/g, 'boolean');
    const RegExToken = Token(/\/([^/]+)\/([gimuy]*\b)?/g, 'regex');

    // Define 'verbatim' after the tokens so the latter get the chance to match first
    Token(/(=>|\.\.\.|\|\||&&|>>>|>>|<<|<=|>=|\btypeof\b|\binstanceof\b|\bin\b|===|!==|!=|==|\+\+|--|\bNOT\b|\bANY\b|\bAND\b|\bnew\b|[{}[\]().?:|&=,^%*/<>+\-~!])/g, 'verbatim');

    const IdentifierToken = Token(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'identifier');
    const Identifier = Node(IdentifierToken, ([name], $) => ({ type: 'Identifier', name, anchors: [$.context.tokens[$.ti].start, $.context.tokens[$.ti].end] }));

    // Literals
    const StringLiteral = Node(StringToken, ([value]) => ({ type: 'Literal', value }));
    const NumericLiteral = Node(NumericToken, ([raw]) => ({ type: 'Literal', value: +raw, raw }));
    const NullLiteral = Node(NullToken, ([raw]) => ({ type: 'Literal', value: null, raw }));
    const BooleanLiteral = Node(BooleanToken, ([raw]) => ({ type: 'Literal', value: raw === 'true', raw }));
    const RegExLiteral = Node(RegExToken, ([raw, flags]) => ({ type: 'Literal', value: new RegExp(raw, flags), raw: `/${raw}/${flags||''}` }));

    const Literal = Any(StringLiteral, NumericLiteral, NullLiteral, BooleanLiteral, RegExLiteral);

    const PrimaryTerm = Any(Identifier, Literal, All('(', Expression , ')'));
    const UnaryExpression = Node(All ('NOT', PrimaryTerm), ( right) => ({type: 'NOT', right:  right}));
    const BinaryAndExpression = Node(All(PrimaryTerm, 'AND', PrimaryTerm), ([left, right]) => ({type: 'AND', left, right}));
    const BinaryAnyExpression = Node(All(PrimaryTerm, 'ANY', PrimaryTerm), ([left, right]) => ({type: 'ANY', left, right}));
    
    // const CompoundExpression = Node(All('(', Expression , ')'),
    // (leafs) => leafs);
    return Any(UnaryExpression, BinaryAndExpression, BinaryAnyExpression);
  });
}