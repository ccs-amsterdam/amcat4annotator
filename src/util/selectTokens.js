export const selectTokens = (tokens, item, contextUnit) => {
  let newTokens = [];

  let tokenRange = [0, tokens.length - 1];
  let tokenContext = [0, tokens.length - 1];

  console.log(item);

  if (item.textUnit === "span") {
    tokenRange = item.annotation.span;
  }

  if (item.textUnit === "paragraph" || item.textUnit === "sentence") {
    tokenRange = getTokenRange(tokens, item.textUnit, item.unitIndex, item.unitIndex);
  }

  if (contextUnit.selected !== "document")
    tokenContext = getContextRange(tokens, contextUnit, tokenRange);

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].textPart = "textUnit";
    if (tokens[i].index < tokenRange[0]) tokens[i].textPart = "contextBefore";
    if (tokens[i].index > tokenRange[1]) tokens[i].textPart = "contextAfter";
    if (tokens[i].index < tokenContext[0]) continue;
    if (tokens[i].index > tokenContext[1]) break;
    newTokens.push(tokens[i]);
  }
  return newTokens;
};

const getTokenRange = (tokens, field, startValue, endValue) => {
  const range = [tokens[0].index, tokens[tokens.length - 1].index];

  const start = tokens.find((token) => token[field] === startValue);
  if (start) range[0] = start.index;
  const end = tokens.find((token) => token[field] === endValue + 1);
  if (end) range[1] = end.index - 1;

  return range;
};

const getContextRange = (tokens, contextUnit, tokenRange) => {
  const field = contextUnit.selected;
  const offset = -tokens[0].index;

  let range = [tokens[tokenRange[0] + offset][field], tokens[tokenRange[1] + offset][field]];
  range[0] = range[0] - contextUnit.range[contextUnit.selected][0];
  range[1] = range[1] + contextUnit.range[contextUnit.selected][1];
  return getTokenRange(tokens, field, range[0], range[1]);
};
