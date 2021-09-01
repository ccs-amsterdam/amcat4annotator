import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import hash from "object-hash";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";

import db from "../apis/dexie";

const AnnotationPage = ({ item, taskType, contextUnit }) => {
  const [doc, setDoc] = useState(null);
  const codeMap = useSelector(state => state.codeMap);

  useEffect(() => {
    if (!item) return null;
    setDoc(null);
    documentSelector(item, setDoc, hash(codeMap));
  }, [codeMap, item, taskType, setDoc]);

  const renderTask = taskType => {
    switch (taskType) {
      case "open annotation":
        return <SpanAnnotationEditor doc={doc} item={item} contextUnit={contextUnit} />;
      case "question based":
        return <SpanAnnotationsCoder doc={doc} item={item} contextUnit={contextUnit} />;
      default:
        return null;
    }
  };

  if (!item || !doc) return null;

  return renderTask(taskType);
};

const documentSelector = async (item, setDoc, codeMapHash) => {
  //let doc = await db.getJobDocuments(codingjob, item.docIndex, 1);
  let doc = await db.getDocument(item.doc_uid);
  if (!doc) return;
  //doc = doc[0]; // getJobDocuments returns array of length 1
  doc.codeMapHash = codeMapHash;
  doc.writable = false;
  if (doc) setDoc(doc);
};

export default React.memo(AnnotationPage);
