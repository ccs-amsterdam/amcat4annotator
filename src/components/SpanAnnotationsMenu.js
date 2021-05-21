import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ref, Table } from "semantic-ui-react";
import { triggerCodeselector } from "../actions";
import "./spanAnnotationsStyle.css";

const COLWIDTHS = [2, 4]; // for offset and text

const SpanAnnotationsMenu = ({ doc, tokens }) => {
  const annotations = useSelector((state) => state.spanAnnotations);

  if (!tokens) return null;

  return (
    <Table
      style={{ fontSize: "10px" }}
      fixed
      role="grid"
      arioa-labelledby="header"
      selectable
      unstackable
      singleLine
      compact="very"
      size="small"
    >
      <Table.Header className="annotations-thead">
        <Table.HeaderCell width={COLWIDTHS[0]}>Offset</Table.HeaderCell>
        <Table.HeaderCell width={COLWIDTHS[1]}>Code</Table.HeaderCell>
        <Table.HeaderCell>Text</Table.HeaderCell>
      </Table.Header>
      <Table.Body className="annotations-tbody">
        {annotationRows(tokens, doc, annotations)}
      </Table.Body>
    </Table>
  );
};

const AnnotationRow = ({ tokens, token, code, text }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const infocus = useSelector((state) => {
    return state.currentToken >= token.span[0] && state.currentToken <= token.span[1];
  });

  const ref = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (infocus) {
      if (ref.current) {
        ref.current.style.backgroundColor = "grey";
        ref.current.scrollIntoView(false, {
          block: "start",
        });
      }
    } else {
      if (ref.current) ref.current.style.backgroundColor = null;
    }
  }, [infocus]);

  const getColor = (annotationCode, codeMap) => {
    if (codeMap[annotationCode]) {
      return codeMap[annotationCode].color;
    } else {
      return "lightgrey";
    }
  };
  const color = getColor(code, codeMap);

  return (
    <Table.Row
      className="annotations-tr"
      onClick={() => {
        tokens[token.index].ref.current.scrollIntoView(false);
        dispatch(triggerCodeselector(null, null, null));
        dispatch(triggerCodeselector("menu", token.index, code));
      }}
      onMouseOver={() => {
        //dispatch(setTokenSelection(token.span));
        //tokens[token.index].ref.current.scrollIntoView(false);
      }}
    >
      <Ref innerRef={ref}>
        <Table.Cell width={COLWIDTHS[0]} cref={ref}>
          {token.offset}
        </Table.Cell>
      </Ref>
      <Table.Cell width={COLWIDTHS[1]} style={color ? { background: color } : null}>
        <span title={code}>{code}</span>
      </Table.Cell>
      <Table.Cell>
        <span title={text}>{text}</span>
      </Table.Cell>
    </Table.Row>
  );
};

const annotationRows = (tokens, doc, annotations) => {
  const rows = [];

  for (const tokenIndex of Object.keys(annotations)) {
    for (const code of Object.keys(annotations[tokenIndex])) {
      const token = annotations[tokenIndex][code];
      if (token.index !== token.span[0]) continue;
      const text = doc.text.slice(token.offset, token.offset + token.length);

      const row = <AnnotationRow tokens={tokens} token={token} code={code} text={text} />;
      rows.push(row);
    }
  }
  return rows;
};

export default SpanAnnotationsMenu;
