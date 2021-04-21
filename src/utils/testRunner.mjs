import fs from "fs";
import { exec } from "child_process";
import async from "async";

/**
 * This should run all files from the test folder and output the results
 */

const testFolder = "src/tests/";

const files = fs.readdirSync(testFolder);
const funcs = files.map((file) =>
  exec.bind(null, `node --trace-uncaught ${testFolder}${file}`)
);

const getResults = (err, data) => {
  if (err) {
    return console.log(err);
  }
  const results = data.map((lines) => lines.join("")).join("");
  console.log(results);
};

async.series(funcs, getResults);
