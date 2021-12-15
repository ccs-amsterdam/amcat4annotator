import React, { useState, useEffect } from "react";
import { AnnotationEvents } from "./AnnotationEvents";
import { Popup, List } from "semantic-ui-react";
import { getColor, getColorGradient } from "library/tokenDesign";

/**
 * The NavigationEvents component handles all eventlisteners
 * AnnotateNavigation furthermore takes the position and selection information
 * from the navigation to highlight the tokens and show popups
 */
const AnnotateNavigation = ({
  tokens,
  variableMap,
  annotations,
  disableAnnotations,
  editMode,
  triggerCodeSelector,
  eventsBlocked,
  fullScreenNode,
}) => {
  const [currentToken, setCurrentToken] = useState({ i: null });
  const [tokenSelection, setTokenSelection] = useState([]);

  useEffect(() => {
    if (!variableMap) return null;
    showAnnotations(tokens, annotations, variableMap, editMode);
  }, [tokens, annotations, variableMap, editMode]);

  useEffect(() => {
    showSelection(tokens, tokenSelection);
  }, [tokens, tokenSelection]);

  return (
    <>
      <AnnotationPopup
        tokens={tokens}
        currentToken={currentToken}
        annotations={annotations}
        variableMap={variableMap}
        fullScreenNode={fullScreenNode}
        onlyFirst={false}
      />
      {disableAnnotations ? null : (
        <AnnotationEvents
          tokens={tokens}
          annotations={annotations}
          currentToken={currentToken}
          setCurrentToken={setCurrentToken}
          tokenSelection={tokenSelection}
          setTokenSelection={setTokenSelection}
          triggerCodePopup={triggerCodeSelector}
          editMode={editMode}
          eventsBlocked={eventsBlocked}
        />
      )}
    </>
  );
};

const showAnnotations = (tokens, annotations, variableMap, editMode) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.ref?.current) continue;

    let tokenAnnotations = allowedAnnotations(annotations?.[token.index], variableMap);
    if (!tokenAnnotations || Object.keys(tokenAnnotations).length === 0) {
      if (token.ref.current.classList.contains("annotated")) {
        token.ref.current.classList.remove("annotated");
        token.ref.current.style.cursor = "default";
        setTokenColor(token, null, null, null);
      }
      continue;
    }

    annotateToken(token, tokenAnnotations, variableMap);

    if (editMode) {
      // in edit mode, make annotations look clickable
      token.ref.current.style.cursor = "pointer";
    }
  }
};

// in the current design imported span annotations are always expanded
// because this is also more efficient in toggling on/off
//
// const expandAnnotations = (annotations) => {
//   for (let index of Object.keys(annotations)) {
//     for (let variable of Object.keys(annotations[index])) {
//       const span = annotations[index][variable].span;
//       for (let spanI = span[0]; spanI <= span[1]; spanI++) {
//         if (!annotations[spanI]) annotations[spanI] = {};
//         annotations[spanI][variable] = { ...annotations[index][variable], index: spanI };
//       }
//     }
//   }
//   return annotations;
// };

const allowedAnnotations = (annotations, variableMap) => {
  if (!annotations) return null;

  if (annotations && variableMap) {
    annotations = { ...annotations };
    for (let id of Object.keys(annotations)) {
      const variable = annotations[id].variable;
      if (!variableMap[variable]) {
        delete annotations[id];
        continue;
      }
      const codeMap = variableMap[variable].codeMap;
      const code = annotations[id].value;
      if (!codeMap[code] || !codeMap[code].active || !codeMap[code].activeParent)
        delete annotations[id];
    }
  }
  return annotations;
};

const annotateToken = (token, annotations, variableMap) => {
  // Set specific classes for nice css to show the start/end of codes
  let nLeft = 0;
  let nRight = 0;
  const colors = { pre: [], text: [], post: [] };
  let nAnnotations = Object.keys(annotations).length;

  for (let id of Object.keys(annotations)) {
    const annotation = annotations[id];
    const codeMap = variableMap[annotation.variable].codeMap;
    const color = getColor(annotation.value, codeMap);

    colors.text.push(color);
    if (annotation.span[0] === annotation.index) {
      nLeft++;
      //colors.pre.push("#ffffff50");
    } else colors.pre.push(color);
    if (annotation.span[1] === annotation.index) {
      nRight++;
      //valueColors.post.push("#ffffff50");
    } else colors.post.push(color);
  }

  const allLeft = nLeft === nAnnotations;
  const allRight = nRight === nAnnotations;
  const anyLeft = nLeft > 0;
  const anyRight = nRight > 0;

  const cl = token.ref.current.classList;
  cl.add("annotated");
  allLeft ? cl.add("allLeft") : cl.remove("allLeft");
  anyLeft & !allLeft ? cl.add("anyLeft") : cl.remove("anyLeft");
  allRight ? cl.add("allRight") : cl.remove("allRight");
  anyRight & !allRight ? cl.add("anyRight") : cl.remove("anyRight");

  const textColor = getColorGradient(colors.text);
  const preColor = allLeft ? "white" : getColorGradient(colors.pre);
  const postColor = allRight ? "white" : getColorGradient(colors.post);
  setTokenColor(token, preColor, textColor, postColor);
  //setTokenLabels(token, ["test", "this"]);
};

// const setTokenLabels = (token, labels) => {
//   token.ref.current.style.lineHeight = `${labels.length * 1}em`;
//   token.ref.current.style.marginBottom = "-1em";
// };

const setTokenColor = (token, pre, text, post) => {
  const children = token.ref.current.children;
  children[0].style.background = pre;
  children[1].style.background = text;
  children[2].style.background = post;
};

const showSelection = (tokens, selection) => {
  for (let token of tokens) {
    if (!token.ref?.current) continue;
    token.ref.current.classList.remove("tapped");
    if (selection.length === 0 || selection[0] === null || selection[1] === null) {
      token.ref.current.classList.remove("selected");
      continue;
    }

    let [from, to] = selection;
    //if (to === null) return false;
    if (from > to) [to, from] = [from, to];
    let selected = token.arrayIndex >= from && token.arrayIndex <= to;
    const cl = token.ref.current.classList;
    if (selected && token.codingUnit) {
      const left = from === token.arrayIndex;
      const right = to === token.arrayIndex;
      cl.add("selected");
      left ? cl.add("start") : cl.remove("start");
      right ? cl.add("end") : cl.remove("end");
    } else cl.remove("selected");
  }
};

const AnnotationPopup = React.memo(
  ({ tokens, currentToken, annotations, variableMap, fullScreenNode, onlyFirst }) => {
    const [content, setContent] = useState(null);
    const [refresh, setRefresh] = useState();

    useEffect(() => {
      if (
        !tokens?.[currentToken.i]?.ref ||
        !annotations?.[tokens[currentToken.i].index] ||
        !variableMap
      ) {
        setContent(null);
        return null;
      }

      const tokenAnnotations = annotations[tokens[currentToken.i].index];
      const ids = Object.keys(tokenAnnotations);
      const list = ids.reduce((arr, id, i) => {
        const variable = tokenAnnotations[id].variable;
        const value = tokenAnnotations[id].value;
        if (onlyFirst && currentToken.i !== tokenAnnotations[id].span[0]) return arr;
        if (!variableMap[variable]) return arr;
        const codeMap = variableMap[variable].codeMap;
        if (!codeMap[value]) return arr;

        arr.push(
          <List.Item
            key={i}
            style={{
              backgroundColor: getColor(value, codeMap),
              padding: "0.3em",
            }}
          >
            <b>{variable}</b>
            {": " + value}
          </List.Item>
        );
        return arr;
      }, []);

      setContent(<List>{list}</List>);
      setRefresh(0);
    }, [tokens, currentToken, annotations, onlyFirst, variableMap, setRefresh]);

    // ugly hack, but popup won't scroll along, so refresh position at intervalls if content is not null
    if (content) setTimeout(() => setRefresh(refresh + 1), 50);

    return (
      <Popup
        mountNode={fullScreenNode || undefined}
        context={tokens?.[currentToken.i]?.ref}
        basic
        hoverable={false}
        position="top left"
        mouseLeaveDelay={1}
        open={true}
        style={{
          margin: "0",
          padding: "0",
          border: "1px solid",
        }}
      >
        {content}
      </Popup>
    );
  }
);

export default AnnotateNavigation;
