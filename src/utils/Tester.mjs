import fs from "fs";
import path from "path";
import * as diff from "diff";
import { Table } from "console-table-printer";

const NORMAL = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

const __dirname = path.resolve(path.dirname(""));

const stringify = (o) =>
  JSON.stringify(o, (_, v) => (v instanceof Set && [...v]) || v, 2);

/**
 * This classy thingy should read and write snapshots from and to snapshotDir based on the unique but durable Tester id.
 * Also prints colorful tables, errors and info about new snapshots.
 * @param id
 */
export default function Tester(id) {
  this.id = id;
  if (!id)
    throw "Tester needs a stable and unique id for snapshots and printing";
  this.snapshotDir = `${__dirname}/src/snapshots`;
  this.snapshotPath = `${this.snapshotDir}/${this.id}.json`;
  // initialize snapshots
  try {
    const string = fs.readFileSync(this.snapshotPath).toString();
    this.snapshots = (string && JSON.parse(string)) || {};
  } catch (e) {
    fs.mkdirSync(this.snapshotDir, { recursive: true }, (err) => {
      if (err) throw err;
    });
    fs.writeFileSync(this.snapshotPath, "");
    this.snapshots = {};
  }

  this.assertions = [];

  /**
   * Test if a strict equals b
   *
   * @param should test description
   * @param a
   * @param b
   * @param isSnapshot for internal use
   */
  this.assert = (should, a, b) => {
    const assertion = a === b;
    this.assertions.push([
      {
        should,
        assertion,
      },
      { color: (assertion && "green") || "red" },
      { a, b },
    ]);
  };

  /**
   * Snapshot test any result
   *
   * @param should test description
   * @param result
   * @returns
   */
  this.snapshot = (should, result) => {
    if (result === undefined) throw "Snapshot result must not be undefined";
    const previous = this.snapshots[should];
    const resultCopy = JSON.parse(stringify(result));
    if (previous === undefined) {
      this.snapshots[should] = resultCopy;
      fs.writeFileSync(this.snapshotPath, stringify(this.snapshots));
      this.assertions.push([
        { should, assertion: false },
        { color: "yellow" },
        { newSnapshot: resultCopy },
      ]);
      return;
    }
    this.assert(should, stringify(resultCopy), stringify(previous));
  };

  /**
   * Print table
   */
  this.print = () => {
    console.log("\n", CYAN, this.id, NORMAL, "\n");
    const table = new Table();
    this.assertions.map((assertion) => table.addRow(...assertion));

    const passedCount = this.assertions.reduce(
      (ac, [{ assertion }]) => (assertion && ac + 1) || ac,
      0
    );

    const newSnapshots = this.assertions
      .map(
        ([{ should }, _, { newSnapshot }]) =>
          newSnapshot && { should, newSnapshot }
      )
      .filter(Boolean);

    newSnapshots.forEach(({ should, newSnapshot }) => {
      console.log(
        [YELLOW, "New snapshot:", should, stringify(newSnapshot)].join("\n")
      );
    });

    const failedAssertions = this.assertions
      .map(
        ([{ should, assertion }, _, { a, b, newSnapshot }]) =>
          !assertion && !newSnapshot && { should, a, b }
      )
      .filter(Boolean);

    failedAssertions.forEach(({ should, a, b }) => {
      console.log([RED, "Failed assertion:", should].join("\n"));
      if (a && b) {
        diff
          .diffChars(stringify(a), stringify(b))
          .forEach(({ added, removed, value }) => {
            console.log((added && GREEN) || (removed && RED) || NORMAL, value);
          });
      }
    });

    table.printTable();

    console.log(
      `${
        (passedCount === this.assertions.length && GREEN) || RED
      } ${passedCount} / ${this.assertions.length} passed`
    );
    console.log(NORMAL, " ");
  };
}
