import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Breadcrumb,
  BreadcrumbSection,
  ButtonGroup,
  Grid,
  Dropdown,
  Popup,
  Button,
  Input,
  Form,
  Icon,
  Radio,
} from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationPage from "./AnnotationPage";
import db from "../apis/dexie";
import ItemSelector from "./ItemSelector";
import { blockEvents } from "../actions";

const UNITSELECTIONDEFAULT = {
  value: "all",
  annotationMix: 0,
  n: null,
  ordered: true,
};

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const mode = useSelector((state) => state.mode);

  const [textUnit, setTextUnit] = useState("document");
  const [unitSelection, setUnitSelection] = useState(UNITSELECTIONDEFAULT);
  const [unitSelectionSettings, setUnitSelectionSettings] = useState(UNITSELECTIONDEFAULT);
  const [contextUnit, setContextUnit] = useState({
    selected: "document",
    range: { paragraph: [1, 1], sentence: [2, 2] },
  });

  const [taskType, setTaskType] = useState("open annotation");
  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  useEffect(() => {
    if (!codingjob) return null;
    setupCodingjob(
      codingjob,
      textUnit,
      unitSelectionSettings,
      setJobItem,
      setJobItems,
      setUnitSelection
    );
  }, [codingjob, textUnit, unitSelectionSettings, setJobItem, setJobItems, setUnitSelection]);

  if (!codingjob) {
    return (
      <Grid stackable container style={{ height: "100vh", marginTop: "2em" }}>
        Select a codingjob: <CodingjobSelector type={"dropdown"} />
      </Grid>
    );
  }

  const designButtons = () => {
    return (
      <Grid.Column>
        <ButtonGroup compact>
          <TextUnitDropdown textUnit={textUnit} setTextUnit={setTextUnit} />
          <ContextUnitDropdown
            textUnit={textUnit}
            contextUnit={contextUnit}
            setContextUnit={setContextUnit}
          />

          <UnitSelectionPopup
            textUnit={textUnit}
            unitSelection={unitSelection}
            setUnitSelectionSettings={setUnitSelectionSettings}
          />
          {/* <SamplePopup unitSelection={unitSelection} sample={sample} setSample={setSample} /> */}

          <TaskTypeDropdown taskType={taskType} setTaskType={setTaskType} />
        </ButtonGroup>
      </Grid.Column>
    );
  };

  return (
    <div style={{ paddingLeft: "1em", float: "left", height: "100vh" }}>
      <Grid stackable>
        <Grid.Row style={{ paddingBottom: "0" }}>
          <Grid.Column width={8}>
            {mode === "design" ? <ItemBreadcrumb jobItem={jobItem} /> : null}
          </Grid.Column>
          <Grid.Column align="middle" floated="right" width={8}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>{mode === "design" ? designButtons() : null}</Grid.Row>
        <Grid.Row style={{ paddingLeft: "1em" }}>
          <AnnotationPage item={jobItem} taskType={taskType} contextUnit={contextUnit} />
        </Grid.Row>
      </Grid>
    </div>
  );
};

const ItemBreadcrumb = ({ jobItem }) => {
  const paragraph = () => {
    return (
      <BreadcrumbSection>
        <Breadcrumb.Divider />
        {`paragraph ${jobItem.parIndex + 1}`}
      </BreadcrumbSection>
    );
  };
  const sentence = () => {
    return (
      <BreadcrumbSection>
        {" "}
        <Breadcrumb.Divider />
        {`sentence ${jobItem.sentIndex + 1}`}
      </BreadcrumbSection>
    );
  };
  const annotation = () => {
    return (
      <BreadcrumbSection>
        <Breadcrumb.Divider />
        {`token ${jobItem.annotation.span[0] + 1}-${jobItem.annotation.span[1] + 1}`}
      </BreadcrumbSection>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbSection link style={{ minWidth: "5em" }}>
        <CodingjobSelector type="dropdown" />
      </BreadcrumbSection>
      <Breadcrumb.Divider />
      <BreadcrumbSection>
        {jobItem?.docIndex !== null ? `document ${jobItem.docIndex + 1}` : null}
      </BreadcrumbSection>
      {jobItem && jobItem.parIndex != null ? paragraph() : null}
      {jobItem && jobItem.sentIndex != null ? sentence() : null}
      {jobItem && jobItem.annotation != null ? annotation() : null}
    </Breadcrumb>
  );
};

const TaskTypeDropdown = ({ taskType, setTaskType }) => {
  return (
    <Dropdown text={<>{buttonLabel(taskType, "Task")}</>} inline button compact style={buttonStyle}>
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Task type" />
        <Dropdown.Item onClick={() => setTaskType("open annotation")}>
          Open annotation
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>Question based</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>Edit labels</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>Validate labels</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>
          Question per label
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>
          Question per text
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const buttonStyle = { paddingTop: 0, font: "Serif", fontStyle: "normal" };

const buttonLabel = (text, type) => {
  return (
    <span>
      <font style={{ fontSize: 9 }}>{type}:</font>
      <br />
      {text}
    </span>
  );
};

const TextUnitDropdown = ({ textUnit, setTextUnit }) => {
  return (
    <Dropdown
      text={<>{buttonLabel(textUnit, "Text unit")}</>}
      inline
      button
      compact
      style={buttonStyle}
    >
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Text unit" />
        <Dropdown.Item onClick={() => setTextUnit("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => setTextUnit("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => setTextUnit("sentence")}>Sentence</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const ContextUnitDropdown = ({ textUnit, contextUnit, setContextUnit }) => {
  const onClick = (unit) => {
    if (contextUnit.selected !== unit) {
      setContextUnit({ ...contextUnit, selected: unit });
    }
  };
  return (
    <Dropdown
      disabled={textUnit === "document"}
      text={
        <>
          {buttonLabel(contextUnit.selected, "Context unit")}
          <ContextUnitRange contextUnit={contextUnit} setContextUnit={setContextUnit} />
        </>
      }
      inline
      button
      compact
      style={{ ...buttonStyle }}
    >
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Context Unit" />
        <Dropdown.Item onClick={() => onClick("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => onClick("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => onClick("sentence")}>Sentence</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const ContextUnitRange = ({ contextUnit, setContextUnit }) => {
  const onChange = (value, which) => {
    if (value >= 0) {
      const newContext = { ...contextUnit };
      newContext.range[contextUnit.selected][which] = value;
      setContextUnit(newContext);
    }
  };

  const range = contextUnit.range[contextUnit.selected];
  if (contextUnit.selected === "document") return null;

  return (
    <Popup
      on="click"
      trigger={
        <Button
          style={{
            paddingTop: 0,
            paddingBottom: 0,
            border: "none",
            boxShadow: "none",
            width: "5em",
          }}
        >{`${range[0]} - ${range[1]}`}</Button>
      }
    >
      <Dropdown.Menu>
        <Dropdown.Header content={`${contextUnit.selected} window`} />
        <Grid style={{ paddingTop: "1em", width: "20em" }}>
          <Grid.Column width={8}>
            <Input
              size="mini"
              value={range[0]}
              type="number"
              style={{ width: "6em" }}
              label={"before"}
              onChange={(e, d) => onChange(Number(d.value), 0)}
            />
          </Grid.Column>
          <Grid.Column width={5}>
            <Input
              size="mini"
              value={range[1]}
              type="number"
              labelPosition="right"
              style={{ width: "6em" }}
              label={"after"}
              onChange={(e, d) => onChange(Number(d.value), 1)}
            />
          </Grid.Column>
        </Grid>
      </Dropdown.Menu>
    </Popup>
  );
};

const UnitSelectionPopup = ({ textUnit, unitSelection, setUnitSelectionSettings }) => {
  //unitSelection.includes("annotation")

  const dispatch = useDispatch();
  const [n, setN] = useState(unitSelection.n);
  const [mix, setMix] = useState(0);
  const [pct, setPct] = useState(100);

  useEffect(() => {
    setN(unitSelection.totalItems);
    setPct(100);
  }, [textUnit, unitSelection.totalItems, unitSelection.value]);

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  useEffect(() => {
    if (unitSelection.n === n && unitSelection.annotationMix === mix) return null;
    const timer = setTimeout(() => {
      setUnitSelectionSettings((old) => ({ ...old, n: n, annotationMix: mix }));
    }, 500);
    return () => clearTimeout(timer);
  }, [n, mix, setUnitSelectionSettings, unitSelection]);

  const onUnitSelection = (e, d) => {
    setUnitSelectionSettings((old) => ({ ...old, value: d.value, n: null }));
  };

  const onChangeMix = (e, d) => {
    setMix(Number(d.value));
  };

  const onChangeN = (e, d) => {
    setN(Number(d.value));
    setPct(Math.round((100 * d.value) / unitSelection.totalItems));
  };
  const onChangePCT = (e, d) => {
    const value = Math.ceil((d.value / 100) * unitSelection.totalItems);
    if (value > 0) {
      setPct(d.value);
      setN(value);
    }
  };

  return (
    <Popup
      flowing
      hoverable
      wide
      position="bottom left"
      on="click"
      style={{ minWidth: "25em" }}
      trigger={
        <Button style={buttonStyle}>{buttonLabel(unitSelection.value, "Unit selection")}</Button>
      }
    >
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Unit selection</label>
        </Form.Group>
        <Form.Group grouped>
          <Form.Field
            control={Radio}
            value="all"
            label="all texts"
            checked={unitSelection.value === "all"}
            onChange={onUnitSelection}
          />
          <Form.Field
            control={Radio}
            value="has annotation"
            label="texts with annotations"
            checked={unitSelection.value === "has annotation"}
            onChange={onUnitSelection}
          />

          <Form.Field
            control={Radio}
            value="per annotation"
            label="annotations"
            checked={unitSelection.value === "per annotation"}
            onChange={onUnitSelection}
          />
        </Form.Group>
        <br />
        <Form.Group>
          <Icon name="setting" />
          <label>Sample</label>
        </Form.Group>

        <Form.Group>
          <Form.Field
            width={5}
            min={1}
            max={unitSelection.totalItems}
            label="N"
            size="mini"
            control={Input}
            type="number"
            value={n}
            onChange={onChangeN}
          />
          <Form.Field
            width={4}
            min={0}
            max={100}
            label="%"
            size="mini"
            control={Input}
            type="number"
            value={pct}
            onChange={onChangePCT}
          />
        </Form.Group>
        <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
          Add random units without annotation
        </label>
        <Form.Group inline>
          <Form.Field
            disabled={!unitSelection.value.includes("annotation")}
            width={4}
            min={0}
            size="mini"
            control={Input}
            type="number"
            value={unitSelection.annotationMix}
            onChange={onChangeMix}
          />
          <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
            % of{" "}
            {unitSelection.value === "has annotation" ? "units with annotation" : "annotations"}
          </label>
        </Form.Group>
      </Form>
    </Popup>
  );
};

const setupCodingjob = async (
  codingjob,
  textUnit,
  unitSelectionSettings,
  setJobItem,
  setJobItems,
  setUnitSelection
) => {
  let [totalItems, items] = await db.getCodingjobItems(codingjob, textUnit, unitSelectionSettings);
  setJobItems(items);
  setJobItem(items[0]);
  setUnitSelection({ ...unitSelectionSettings, totalItems: totalItems });
};

// from: https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
// const getRandomSubarray = (arr, size) => {
//   var shuffled = arr.slice(0),
//     i = arr.length,
//     min = i - size,
//     temp,
//     index;
//   while (i-- > min) {
//     index = Math.floor((i + 1) * Math.random());
//     temp = shuffled[index];
//     shuffled[index] = shuffled[i];
//     shuffled[i] = temp;
//   }
//   return shuffled.slice(min);
// };

export default Annotate;
