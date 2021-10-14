import { useState, useEffect } from "react";
import { prepareDocument } from "util/createDocuments";
import hash from "object-hash";

const useUnit = (unit, safetyCheck, returnTokens) => {
  const [tokens, setTokens] = useState();
  const [annotations, setAnnotations] = useState();

  useEffect(() => {
    if (!unit?.text && !unit.text_fields) return null;
    console.log(unit);
    const document = prepareDocument(unit);

    safetyCheck.current = {
      tokens: document.tokens,
      annotationsChanged: false,
      annotations: hash(document.annotations),
    };
    setTokens(document.tokens);
    setAnnotations(document.annotations);
    if (returnTokens) returnTokens(document.tokens);
  }, [unit, returnTokens, safetyCheck]);

  // if returnAnnotations is falsy (so not passed to Document), make setAnnotations
  // falsy as well. This is used further down as a sign that annotations are disabled
  return [tokens, annotations, setAnnotations];
};

export default useUnit;
