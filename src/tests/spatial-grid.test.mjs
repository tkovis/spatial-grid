import Tester from "../utils/Tester.mjs";
import SpatialGrid from "../spatial-grid.mjs";

/**
 * Test and demonstrate some of SpatialGrid api. Create pretty snapshots of results so you can browse results without running anything.
 */

const tester = new Tester("spatial-grid");

const bounds = { x1: -25, y1: -25, x2: 25, y2: 25 };
const dimensions = { width: 5, height: 5 };

const grid = SpatialGrid.create(bounds, dimensions);

tester.snapshot("The grid have a 5 by 5 array of sets as cells", grid);

const entity1 = {
  position: { x: 0, y: 0 },
  dimensions: { width: 5, height: 5 },
};

tester.snapshot(
  "The incides should be 2 2 to 2 2, because the position is in the center and the entity is small enough to fit in a sigle cell",
  SpatialGrid.getCellIndices(grid, entity1)
);

const entity2 = {
  position: { x: 0, y: 0 },
  dimensions: { width: 25, height: 25 },
};

tester.snapshot(
  "The incides should be 1 1 to 3 3, because the position is in the center and the entity is big enough to need 3 cells",
  SpatialGrid.getCellIndices(grid, entity2)
);

const entity3 = {
  position: { x: 25, y: 25 },
  dimensions: { width: 5, height: 5 },
};

tester.snapshot(
  "The incides should be 4 4 to 4 4, because the position is in the corner and the entity is small enough to fit in a single cell",
  SpatialGrid.getCellIndices(grid, entity3)
);

const spawnEntity = SpatialGrid.createSpawnEntity();

tester.snapshot(
  "Spawner should spawn entities with incrementing ids and optional attributes",
  [spawnEntity(), spawnEntity({ key: "value" })]
);

const entity4 = spawnEntity({
  position: { x: 0, y: 0 },
  dimensions: { width: 5, height: 5 },
});

tester.snapshot(
  "Should get 2 2 grid cell for entity position",
  SpatialGrid.getCellIndices(grid, entity4)
);

tester.snapshot(
  "The grid should have an entity id in 2,2 cell and an entry in the entity map with its indices",
  SpatialGrid.addEntity(grid, entity4)
);

const entity5 = spawnEntity({
  position: { x: 10, y: 10 },
  dimensions: { width: 5, height: 5 },
});
tester.snapshot(
  "The grid should have a new entity id in 3,3 cell and an entry in the entity map with its indices",
  SpatialGrid.addEntity(grid, entity5)
);

tester.snapshot(
  "The grid should no longer have the deleted entity in its entities map or cells",
  SpatialGrid.removeEntity(grid, entity5)
);

const aIndices = { xMin: 1, xMax: 2, yMin: 3, yMax: 4 };
const bIndices = { xMin: 1, xMax: 2, yMin: 3, yMax: 4 };

tester.snapshot(
  "return true for equal indices",
  SpatialGrid.equalIndices(aIndices, bIndices)
);

aIndices.xMin = 0;

tester.snapshot(
  "return false for unequal indices",
  SpatialGrid.equalIndices(aIndices, bIndices)
);

entity4.position.x = entity4.position.x + 0.1;

tester.snapshot(
  "Moving slightly should not change the grid",
  SpatialGrid.updateEntity(grid, entity4)
);

entity4.position.x = entity4.position.x + 15;

tester.snapshot(
  "Moving enough should change the grid",
  SpatialGrid.updateEntity(grid, entity4)
);

tester.snapshot(
  "There are no nearby entities in the middle",
  SpatialGrid.findNearby(grid, { x: 0, y: 0 }, { width: 5, height: 5 })
);

tester.snapshot(
  "Entity 3 is found after moving a little bit to the positive x",
  SpatialGrid.findNearby(grid, { x: 10, y: 0 }, { width: 5, height: 5 })
);

tester.print();
