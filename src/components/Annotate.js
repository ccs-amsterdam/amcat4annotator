import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Breadcrumb, BreadcrumbSection, Grid, Pagination } from "semantic-ui-react";
import { randomColor } from "randomcolor";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationText from "./AnnotationText";
import db from "../apis/dexie";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [doc, setDoc] = useState(null);
  const [nDocuments, setNDocuments] = useState(0);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    if (!codingjob) return null;
    setActivePage(1);
    setupCodingjob(codingjob, setDoc, setNDocuments);
  }, [codingjob, dispatch]);

  const pageChange = (event, data) => {
    documentSelector(codingjob, data.activePage - 1, setDoc);
    setActivePage(data.activePage);
  };

  return (
    <Grid container columns={2}>
      <Grid.Row>
        <Grid.Column width={10}>
          <Breadcrumb>
            <BreadcrumbSection link style={{ minWidth: "5em" }}>
              <CodingjobSelector type="dropdown" />
            </BreadcrumbSection>
            <Breadcrumb.Divider />
            <BreadcrumbSection>{doc ? doc.title : null}</BreadcrumbSection>
          </Breadcrumb>
        </Grid.Column>
        <Grid.Column floated="right" width={1}>
          {documentPagination(activePage, nDocuments, pageChange)}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <AnnotationText doc={doc ? doc : null} />
      </Grid.Row>
    </Grid>
  );
};

const documentPagination = (activePage, nDocuments, pageChange) => {
  return (
    <Pagination
      activePage={activePage}
      size={"mini"}
      firstItem={null}
      lastItem={null}
      siblingRange={0}
      boundaryRange={0}
      defaultActivePage={1}
      ellipsisItem={null}
      totalPages={nDocuments}
      onPageChange={pageChange}
    />
  );
};

const getParentTree = (codes, code) => {
  const parents = [];
  let parent = codes[code].parent;
  while (parent) {
    parents.push(parent);
    parent = codes[parent].parent;
  }
  return parents.reverse();
};

const prepareCodes = (cb) => {
  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codes = cb.codes.reduce((result, code) => {
    result[code.code] = code;
    return result;
  }, {});

  for (const code of Object.keys(codes)) {
    if (!codes[code].color) codes[code].color = randomColor({ seed: code, luminosity: "light" });
    codes[code].tree = getParentTree(codes, code);
  }
  return codes;
};

const setupCodingjob = async (codingjob, setDoc, setNDocuments) => {
  const n = await db.getJobDocumentCount(codingjob);
  setNDocuments(n);
  if (n > 0) {
    documentSelector(codingjob, 0, setDoc);
  } else {
    setDoc(null);
  }
};

const documentSelector = async (codingjob, i, setDoc) => {
  if (!codingjob) return null;
  const docs = await db.getJobDocumentsBatch(codingjob, i, 1);
  if (docs) {
    setDoc({
      doc_id: docs[0].doc_id,
      title: docs[0].title,
      text: docs[0].title + "\n\n" + docs[0].text,
      annotations: prepareAnnotations(docs[0].annotations),
    });
  }
};

const prepareAnnotations = (annotations) => {
  if (!annotations || annotations === "") return {};
  const anns = JSON.parse(annotations);

  // create an object where the key is an offset, and the
  // value is an array that tells which codes start and end there
  // used in Tokens for matching to token indices
  // (matching to tokenindices is needed for speed, to keep coding nice and responsive)
  return anns.reduce((obj, ann) => {
    if (!obj[ann.offset]) obj[ann.offset] = { start: [], end: [] };
    if (!obj[ann.offset + ann.length]) obj[ann.offset + ann.length] = { start: [], end: [] };
    obj[ann.offset].start.push(ann.code);
    obj[ann.offset + ann.length].end.push(ann.code);
    return obj;
  }, {});
};

export default Annotate;
