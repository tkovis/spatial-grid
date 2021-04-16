import SpatialGrid from "./spatial-grid.mjs";

const rand_range = (a, b) => Math.random() * (b - a) + a;

class GridTester {
  constructor(finds, clients) {
    this._NUM_CLIENTS = clients;
    this._ITERATIONS = finds;

    this._CLIENT_BOUNDS = [
      [-1000.0, -1000.0],
      [1000.0, 1000.0],
    ];

    this._CLIENT_POSITIONS = [];
    for (let i = 0; i < this._NUM_CLIENTS; ++i) {
      this._CLIENT_POSITIONS.push({
        x: rand_range(this._CLIENT_BOUNDS[0][0], this._CLIENT_BOUNDS[1][0]),
        y: rand_range(this._CLIENT_BOUNDS[0][1], this._CLIENT_BOUNDS[1][1]),
      });
    }

    this._CLIENT_QUERIES = [];
    for (let i = 0; i < this._ITERATIONS; ++i) {
      const position = {
        x: rand_range(this._CLIENT_BOUNDS[0][0], this._CLIENT_BOUNDS[1][0]),
        y: rand_range(this._CLIENT_BOUNDS[0][1], this._CLIENT_BOUNDS[1][1]),
      };

      this._CLIENT_QUERIES.push(position);
    }

    this._CLIENT_MOVES = [];
    for (let i = 0; i < this._NUM_CLIENTS; ++i) {
      const position = [Math.random(), Math.random()];

      this._CLIENT_MOVES.push(position);
    }

    const spawnEntity = SpatialGrid.createSpawnEntity();
    this._grid = SpatialGrid.create(
      { xMin: -1000.0, yMin: -1000.0, xMax: 1000.0, yMax: 1000.0 },
      { width: 100, height: 100 }
    );
    this._clients = [];
    for (let i = 0; i < this._NUM_CLIENTS; ++i) {
      const entity = spawnEntity({
        position: this._CLIENT_POSITIONS[i],
        dimensions: { height: 15, width: 15 },
      });
      this._clients.push(entity);
    }
  }

  Test_addEntity() {
    let startTime = performance.now();
    this._clients.forEach((entity) => {
      SpatialGrid.addEntity(this._grid, entity);
    });
    return performance.now() - startTime;
  }

  Test_findNearby() {
    let startTime = performance.now();
    for (let i = 0; i < this._ITERATIONS; ++i) {
      SpatialGrid.findNearby(this._grid, this._CLIENT_QUERIES[i], {
        height: 15,
        width: 15,
      });
    }
    let totalTime = performance.now() - startTime;
    return totalTime;
  }

  Test_updateEntity() {
    for (let i = 0; i < this._clients.length; ++i) {
      const c = this._clients[i];
      c.position.x = this._CLIENT_POSITIONS[i].x;
      c.position.y = this._CLIENT_POSITIONS[i].y;
      SpatialGrid.updateEntity(this._grid, this._clients[i]);
    }

    let startTime = performance.now();
    for (let i = 0; i < this._clients.length; ++i) {
      const c = this._clients[i];
      c.position.x += this._CLIENT_MOVES[i][0];
      c.position.y += this._CLIENT_MOVES[i][1];
      SpatialGrid.updateEntity(this._grid, this._clients[i]);
    }
    let totalTime = performance.now() - startTime;

    return totalTime;
  }

  Test_removeEntity() {
    let startTime = performance.now();
    for (let i = 1; i <= this._NUM_CLIENTS; i++) {
      SpatialGrid.removeEntity(this._grid, { id: i });
    }
    return performance.now() - startTime;
  }

  persists() {
    let startTime = performance.now();
    fs.writeFileSync(
      "./grid.json",
      Buffer.from(SpatialGrid.stringify(this._grid))
    );
    return performance.now() - startTime;
  }

  read() {
    let startTime = performance.now();
    SpatialGrid.parse(fs.readFileSync("./grid.json").toString());
    return performance.now() - startTime;
  }
}

const results = [];
const sum = (ac, cv) => ac + cv;
const avg = (n) => n.reduce(sum, 0.0) / n.length;
const finds = 10000;
const clients = 100000;
const iterations = 10;

for (let i = 0; i < iterations; i++) {
  const tester = new GridTester(finds, clients);
  const add = tester.Test_addEntity();
  const find = tester.Test_findNearby();
  const update = tester.Test_updateEntity();
  const remove = tester.Test_removeEntity();
  results.push({ add, find, update, remove });
}

console.log("---------RESULTS-----------");
console.table(results);
console.log("---------AVERAGE-----------");
console.table([
  {
    add:
      Math.round(avg(results.map(({ add }) => add))) +
      "ms / " +
      clients +
      " clients",
    find:
      Math.round(avg(results.map(({ find }) => find))) +
      "ms / " +
      finds +
      " iterations",
    update:
      Math.round(avg(results.map(({ update }) => update))) +
      "ms / " +
      clients +
      " clients",
    remove:
      Math.round(avg(results.map(({ remove }) => remove))) +
      "ms / " +
      clients +
      " clients",
  },
  {
    add:
      Math.round((avg(results.map(({ add }) => add)) / clients) * 1000 * 10) /
        10 +
      "µs / client",
    find:
      Math.round((avg(results.map(({ find }) => find)) / finds) * 1000 * 10) /
        10 +
      "µs / iteration",
    update:
      Math.round(
        (avg(results.map(({ update }) => update)) / clients) * 1000 * 10
      ) /
        10 +
      "µs / client",
    remove:
      Math.round(
        (avg(results.map(({ remove }) => remove)) / clients) * 1000 * 10
      ) /
        10 +
      "µs / client",
  },
]);
console.log("---------WORST-------------");
console.table([
  {
    add:
      Math.round(Math.max(...results.map(({ add }) => add))) +
      "ms / " +
      clients +
      " clients",
    find:
      Math.round(Math.max(...results.map(({ find }) => find))) +
      "ms / " +
      finds +
      " iterations",
    update:
      Math.round(Math.max(...results.map(({ update }) => update))) +
      "ms / " +
      clients +
      " clients",
    remove:
      Math.round(Math.max(...results.map(({ remove }) => remove))) +
      "ms / " +
      clients +
      " clients",
  },
  {
    add:
      Math.round(
        (Math.max(...results.map(({ add }) => add)) / clients) * 1000 * 10
      ) /
        10 +
      "µs / client",
    find:
      Math.round(
        (Math.max(...results.map(({ find }) => find)) / finds) * 1000 * 10
      ) /
        10 +
      "µs / iteration",
    update:
      Math.round(
        (Math.max(...results.map(({ update }) => update)) / clients) * 1000 * 10
      ) /
        10 +
      "µs / client",
    remove:
      Math.round(
        (Math.max(...results.map(({ remove }) => remove)) / clients) * 1000 * 10
      ) /
        10 +
      "µs / client",
  },
]);
