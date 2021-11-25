import React, { useEffect, useState } from "react";
import {
  Icon,
  Form,
  Radio,
  Checkbox,
  Input,
  Dropdown,
  Popup,
  Button,
  Grid,
} from "semantic-ui-react";
import Help from "./Help";
import CodesEditor from "./CodesEditor";
import db from "apis/dexie";

const defaultUnitSettings = {
  textUnit: null, // document, paragraph, sentence or span (span only if codingUnit is annotations)
  unitSelection: "allTextUnits", // or: annotations
  annotation: null,
  contextUnit: "document", // or: paragraph, sentence, no context
  contextWindow: [1, 1],

  n: null,
  seed: 42,
  ordered: false,
  balanceDocuments: true,
  balanceAnnotations: true,
  validCodes: null,
  highlightAnnotation: false,
};

const UnitSettings = ({ codingjob }) => {
  const unitSettings = codingjob?.unitSettings || defaultUnitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  if (!unitSettings) return null;
  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <Grid style={{ paddingTop: "1em" }}>
        <Grid.Column width={8}>
          <CodingUnitForm
            codingjob={codingjob}
            unitSettings={unitSettings}
            setUnitSettings={setUnitSettings}
          />
        </Grid.Column>
        <Grid.Column width={8}>
          <ContextUnitForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
        </Grid.Column>
      </Grid>
      <br />
      <br />
      <SampleForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
      <br />
      <br />
      <SelectValidCodes codingjob={codingjob} />
    </div>
  );
};

const CodingUnitForm = ({ codingjob, unitSettings, setUnitSettings }) => {
  useEffect(() => {
    if (unitSettings?.textUnit === null)
      setUnitSettings({
        ...unitSettings,
        textUnit: "document",
        value: "allTextUnits",
        n: null,
        totalUnits: null,
      });
  }, [unitSettings, setUnitSettings]);

  const radioButton = (value, label, annotated, jump) => {
    const unitSelection = annotated ? "annotations" : "allTextUnits";
    let checked = unitSettings.textUnit === value && unitSettings.unitSelection === unitSelection;

    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          checked={checked}
          onChange={(e, d) =>
            setUnitSettings({
              ...unitSettings,
              textUnit: value,
              unitSelection: unitSelection,
              n: null,
              totalUnits: null,
            })
          }
          style={{ marginLeft: jump ? "1em" : "0em" }}
        />
      </Form.Field>
    );
  };

  const annotationDropdown = () => {
    if (!codingjob.importedCodes) return null;
    if (Object.keys(codingjob.importedCodes).length === 0) return null;
    const options = Object.keys(codingjob.importedCodes).map((code) => ({
      key: code,
      value: code,
      text: code,
    }));
    if (unitSettings.annotation === null)
      setUnitSettings({ ...unitSettings, annotation: options[0].value });
    return (
      <span style={{ fontWeight: "bold" }}>
        Annotation:{"   "}
        <Dropdown
          options={options}
          value={unitSettings.annotation}
          onChange={(e, d) => setUnitSettings({ ...unitSettings, annotation: d.value })}
        />
      </span>
    );
  };

  const annotationButtons = () => {
    if (!unitSettings.annotation) return null;
    return (
      <>
        {radioButton("span", "Span annotation", true, true)}
        {radioButton("document", "Span + document", true, true)}
        {radioButton("paragraph", "Span + paragraph", true, true)}
        {radioButton("sentence", "Span + sentence", true, true)}
      </>
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Coding unit</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("document", "Document", false)}
        {radioButton("paragraph", "Paragraph", false)}
        {radioButton("sentence", "Sentence", false)}
        {annotationDropdown()}
        {annotationButtons()}
      </Form.Group>
    </Form>
  );
};

const ContextUnitForm = ({ unitSettings, setUnitSettings }) => {
  const setContextWindow = (value) => {
    setUnitSettings({
      ...unitSettings,
      contextWindow: value,
    });
  };

  const radioButton = (value, label) => {
    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          disabled={unitSettings.textUnit === "document"}
          checked={unitSettings.contextUnit === value}
          onChange={(e, d) =>
            setUnitSettings({
              ...unitSettings,
              contextUnit: value,
            })
          }
        />
        {"  "}
        {(value === "paragraph" || value === "sentence") && value === unitSettings.contextUnit ? (
          <ContextWindow
            contextUnit={unitSettings.contextUnit}
            contextWindow={unitSettings.contextWindow}
            setContextWindow={setContextWindow}
          />
        ) : null}
      </Form.Field>
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Context unit</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("document", "Document")}
        {radioButton("paragraph", "Paragraph")}
        {radioButton("sentence", "Sentence")}
        {radioButton("none", "No context")}
      </Form.Group>
    </Form>
  );
};

const SampleForm = React.memo(({ unitSettings, setUnitSettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSettings
  const [pct, setPct] = useState(100);
  const totalUnits = unitSettings.totalUnits || 0;

  useEffect(() => {
    setPct(Math.round((100 * unitSettings.n) / totalUnits));
    setDelayed(unitSettings);
  }, [totalUnits, unitSettings, setDelayed]);

  useEffect(() => {
    if (delayed === unitSettings) return null;
    const timer = setTimeout(() => {
      setUnitSettings(delayed);
    }, 300);
    return () => clearTimeout(timer);
  }, [delayed, unitSettings, setUnitSettings]);

  const setWithoutDelay = (field, value) => {
    setUnitSettings({ ...unitSettings, [field]: value });
  };

  // const onChangeMix = (e, d) => {
  //   setDelayed((current) => ({ ...current, annotationMix: Number(d.value) }));
  // };

  const onChangeSeed = (e, d) => {
    setDelayed((current) => ({ ...current, seed: Number(d.value) }));
  };

  const onChangeShuffle = (e, d) => {
    setWithoutDelay("ordered", !d.checked);
  };

  const onChangeBalanceDoc = (e, d) => {
    setWithoutDelay("balanceDocuments", d.checked);
  };
  const onChangeBalanceAnn = (e, d) => {
    setWithoutDelay("balanceAnnotations", d.checked);
  };

  const onChangeN = (e, d) => {
    let value = Number(d.value);
    //value = value > n ? Math.min(totalUnits, value + 4) : Math.max(0, value - 4);
    setPct(Math.round((100 * value) / totalUnits));
    setDelayed((current) => ({ ...current, n: value }));
  };

  const onChangePCT = (e, d) => {
    let value = Number(d.value);
    //value = value > pct ? Math.min(100, value + 4) : Math.max(0, value - 4);
    let valueN = Math.ceil((value / 100) * totalUnits);
    if (valueN >= 0) {
      setPct(value);
      setDelayed((current) => ({ ...current, n: valueN }));
    }
  };

  if (delayed === null) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <div>
          <label>Sample settings</label>
          <Help
            header={"Sampling and shuffling"}
            texts={[
              "If % < 100, a random sample will be drawn.",
              "If shuffle is enabled, the order of the units will be randomized.",
              "Seed initializes the random number generator. Simply put, using the same seed gives the same 'random' results if the data is the same.",
            ]}
          />
        </div>

        {/* <Help header={"test"} texts={["test", "this"]} /> */}
      </Form.Group>

      <Form.Group>
        <Form.Field
          width={8}
          min={1}
          max={totalUnits}
          label="N"
          size="mini"
          control={Input}
          type="number"
          value={delayed.n}
          onChange={onChangeN}
        />
        <Form.Field
          width={8}
          min={0}
          step={5}
          max={100}
          label="%"
          size="mini"
          control={Input}
          type="number"
          value={pct}
          onChange={onChangePCT}
        />
      </Form.Group>

      <Form.Group>
        <Form.Field width={8}>
          <label>Shuffle</label>
          <Checkbox toggle size="mini" checked={!unitSettings.ordered} onChange={onChangeShuffle} />
        </Form.Field>

        <Form.Field width={8}>
          <label>Seed</label>
          <Input size="mini" type="number" min={1} value={delayed.seed} onChange={onChangeSeed} />
        </Form.Field>
      </Form.Group>

      <Form.Group grouped widths="equal">
        <Form.Field>
          <b>Balance</b>
          <Help
            header={"Balanced sampling"}
            texts={[
              "Balance sampled Units evenly over groups. Uses a simple approach where unique groups are created (documents, codes, or documentsXcodes), and samples are drawn from these groups one by one",
              "For documents: get an equal number of paragraphs, sentences or annotations per document",
              "For codes: if units are annotations, get an equal number annotations for each unique code. (You can toggle which codes to include in the codebook, see top-right corner)",
            ]}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            size="mini"
            label="documents"
            checked={unitSettings.balanceDocuments}
            onChange={onChangeBalanceDoc}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            disabled={unitSettings.unitSelection !== "annotations"}
            size="mini"
            label="codes"
            checked={unitSettings.balanceAnnotations}
            onChange={onChangeBalanceAnn}
          />
        </Form.Field>
      </Form.Group>
      <br />
    </Form>
  );
});

// at some point maybe implement document filters
// like min paragraph and max tokens and such
//
// const DocumentFilters = () => {
//   const onChangeUseMinUnitIndex = (e, d) => {
//     setWithoutDelay("useMinUnitIndex", d.checked);
//   };
//   const onChangeUseMaxUnitIndex = (e, d) => {
//     setWithoutDelay("useMaxUnitIndex", d.checked);
//   };
//   const onChangeMinUnitIndex = (e, d) => {
//     let value = Number(d.value);
//     setDelayed((current) => ({ ...current, minUnitIndex: value }));
//   };
//   const onChangeMaxUnitIndex = (e, d) => {
//     let value = Number(d.value);
//     setDelayed((current) => ({ ...current, maxUnitIndex: value }));
//   };

//   return (
//     <Form>
//       <Form.Group>
//         <Form.Field width={8}>
//           <label>Maximum {unitSettings.textUnit}</label>

//           <Input
//             width={5}
//             min={0}
//             label={
//               <Checkbox
//                 toggle
//                 style={{ width: "6em" }}
//                 disabled={unitSettings.textUnit === "document"}
//                 checked={unitSettings.useMaxUnitIndex}
//                 onChange={onChangeUseMaxUnitIndex}
//               />
//             }
//             size="mini"
//             type="number"
//             value={unitSettings.maxUnitIndex}
//             onChange={onChangeMaxUnitIndex}
//           ></Input>
//         </Form.Field>
//       </Form.Group>
//     </Form>
//   );
// };

const ContextWindow = ({ contextUnit, contextWindow, setContextWindow }) => {
  if (contextUnit === "document") return null;

  return (
    <Popup
      hoverable
      trigger={
        <Button
          style={{
            padding: "0em 0.2em 0em 0.2em",
            background: "white",
            border: "1px solid",
          }}
        >{`${contextWindow[0]} - ${contextWindow[1]}`}</Button>
      }
    >
      <Dropdown.Menu>
        <Dropdown.Header content={`Set ${contextUnit} window`} />
        <Grid style={{ paddingTop: "1em", width: "20em" }}>
          <Grid.Column width={8}>
            <Input
              size="mini"
              value={contextWindow[0]}
              type="number"
              style={{ width: "6em" }}
              label={"before"}
              onChange={(e, d) => setContextWindow([Number(d.value), contextWindow[1]])}
            />
          </Grid.Column>
          <Grid.Column width={5}>
            <Input
              size="mini"
              value={contextWindow[1]}
              type="number"
              labelPosition="right"
              style={{ width: "6em" }}
              label={"after"}
              onChange={(e, d) => setContextWindow([contextWindow[0], Number(d.value)])}
            />
          </Grid.Column>
        </Grid>
      </Dropdown.Menu>
    </Popup>
  );
};

const SelectValidCodes = ({ codingjob }) => {
  if (!codingjob?.unitSettings) return null;
  if (!codingjob.unitSettings.totalUnits) return null;
  if (codingjob.unitSettings.textUnit !== "span") return null;

  const setCodes = (codes) => {
    const newImportedCodes = { ...codingjob.importedCodes };
    newImportedCodes[codingjob.unitSettings.annotation] = codes;
    db.setCodingjobProp(codingjob, "importedCodes", newImportedCodes);
  };

  const unitSettings = codingjob.unitSettings;
  // const setUnitSettings = (us) => {
  //   db.setCodingjobProp(codingjob, "unitSettings", us);
  // };

  if (!unitSettings) return null;
  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <div>
          <label>Manage annotation codes</label>
          <Help
            header={"Annotation codes"}
            texts={[
              "Click on the gear icon to add, remove, move, rename and change the colors of codes",
              "You can also toggle codes off if you just want to disable them in the current unit selection",
            ]}
          />
        </div>
      </Form.Group>
      <CodesEditor
        codes={codingjob.importedCodes[codingjob.unitSettings.annotation]}
        setCodes={setCodes}
        canAdd={false}
      />
    </Form>
  );
};

export default React.memo(UnitSettings);
