import React, { useState, useEffect } from "react";
import { Container, Grid, Header, List, ListItem, Table, Popup, Button } from "semantic-ui-react";
import AnnotateTable from "./AnnotateTable";
import Document from "components/Document/Document";
import { codeBookEdgesToMap } from "util/codebook";

const AnnotateTask = ({ unit, codebook }) => {
  const [annotations, setAnnotations] = useState([]);

  const [tokens, setTokens] = useState();

  useEffect(() => {
    // settings is an array with the settings for each question
    // This needs a little preprocessing, so we only update it when codebook changes (not per unit)
    if (codebook?.codeMap) return null;
    if (!codebook?.codes) return null;
    codebook.codeMap = codeBookEdgesToMap(codebook.codes);
  }, [codebook]);

  if (!unit || codebook?.codeMap === null) return null;

  return (
    <Grid
      centered
      style={{ height: "100%", width: "100%", paddingTop: "0" }}
      verticalAlign={"top"}
      columns={2}
    >
      <Grid.Column width={10} style={{ paddingRight: "0em", height: "100%" }}>
        <Document
          unit={unit}
          codes={codebook?.codes}
          settings={codebook?.settings}
          onChangeAnnotations={setAnnotations}
          returnTokens={setTokens}
        />
      </Grid.Column>
      <Grid.Column
        width={6}
        style={{
          paddingRight: "0em",
          marginTop: "1em",
          height: "100%",
          overflow: "auto",
        }}
      >
        <Instructions codebook={codebook} />

        <AnnotateTable tokens={tokens} codeMap={codebook?.codeMap} annotations={annotations} />
      </Grid.Column>
    </Grid>
  );
};

const Instructions = ({ codebook }) => {
  const [open, setOpen] = useState(false);
  if (!codebook) return null;

  return (
    <Popup
      flowing
      open={open}
      position="bottom right"
      trigger={
        <Button fluid primary size="tiny" onClick={() => setOpen(!open)} style={{}}>
          Instructions
        </Button>
      }
    >
      <Container style={{ paddingTop: "2em", width: "500px" }}>
        <Header as="h4" align="center">
          Edit span annotations
        </Header>
        <p align="center">Assign codes to words or phrases. A word can have multiple codes.</p>
        <Table unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>Keyboard</Table.HeaderCell>
              <Table.HeaderCell>Mouse</Table.HeaderCell>
              <Table.HeaderCell>Touchpad</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <strong>Navigate</strong>
              </Table.Cell>
              <Table.Cell>
                <i>Arrow keys</i>
              </Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Select words</strong>
              </Table.Cell>
              <Table.Cell>
                <i>spacebar</i>
                <br />
                Hold to select mutiple
              </Table.Cell>
              <Table.Cell>
                <i>Left-click</i>
                <br />
                Hold to select multiple
              </Table.Cell>
              <Table.Cell>
                <i>tab</i> first word 2 times, then last word 1 time
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Edit code</strong>
              </Table.Cell>
              <Table.Cell>
                Press <i>spacebar</i> (don't hold) on an annotation
              </Table.Cell>
              <Table.Cell>
                <i>Left-click</i> (don't hold) on an annotation
              </Table.Cell>
              <Table.Cell>
                <i>tab</i> an annotation 3 times
              </Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell>
                <strong>Quick keys</strong> <br />
                in popup
              </Table.HeaderCell>
              <Table.HeaderCell colSpan="3">
                <List as="ul">
                  {codebook.searchBox || codebook.buttonMode === "recent" ? (
                    <ListItem as="li">
                      <i>text input</i> automatically opens dropdown{" "}
                    </ListItem>
                  ) : null}
                  <ListItem as="li">
                    navigate buttons with <i>arrow keys</i>, select with <i>spacebar</i>
                  </ListItem>
                  <ListItem as="li">
                    use <i>escape</i> to close popup and <i>delete</i> to remove code
                  </ListItem>
                </List>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Container>
    </Popup>
  );
};

export default React.memo(AnnotateTask);
