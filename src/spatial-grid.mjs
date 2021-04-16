/**
 * Creates a grid object that has:
 *
 * bounds: min and max x and y coordinates, that are used to determine entities position relative to the grid
 * dimensions: width and height, that are used to determine the amount of cells in x and y axis respectively
 * cells: a two dimensional array of sets of entity ids eg. [[{},{2}], [{},{}]] where cells[0][1] === 2
 * entities: a mapping of entity id to the cells it is inhabiting
 *
 * @param bounds Must contain xMin, xMax, yMin, yMax. Used to translate entity position into grid cell indices
 * @param dimensions Must contain width and height. Used to determine the amount of cells in x and y axis respectively
 * @returns @object a grid object with initialized but empty cells
 */
const create = ({ xMin, xMax, yMin, yMax }, { width, height }) => ({
  bounds: {
    xMin,
    xMax,
    yMin,
    yMax,
    height: yMax - yMin,
    width: xMax - xMin,
  },
  dimensions: { width, height },
  cells: Array(width)
    .fill(null)
    .map(() =>
      Array(height)
        .fill(null)
        .map(() => new Set())
    ),
  entities: {},
});

/**
 * Clamp between 0.0 and a little bit < 1.0.
 *
 * @param x
 * @returns @float
 */
const sat = (x) => Math.min(Math.max(x, 0.0), 1 - Number.EPSILON);

/**
 * Find the range of cell indices that are inside an area with a specific position and dimensions.
 *
 * @param grid grid created by create
 * @param area position {x, y} and dimensions {width, height}
 * @returns @object {xMin, yMin, xMax, yMax}
 */
const getCellIndices = (grid, { position, dimensions }) => {
  const { xMin, yMin } = grid.bounds;
  // find relative position as a ratio, eg. 0.5, so you can multiply it by the amount of cells eg. 5,
  // so you can get the cell index eg. 2 in this case
  const minRelativeX = position.x - dimensions.width / 2 - xMin;
  const minRelativeY = position.y - dimensions.height / 2 - yMin;
  const maxRelativeX = minRelativeX + dimensions.width;
  const maxRelativeY = minRelativeY + dimensions.height;
  const minRatioX = sat(minRelativeX / grid.bounds.width);
  const minRatioY = sat(minRelativeY / grid.bounds.height);
  const maxRatioX = sat(maxRelativeX / grid.bounds.width);
  const maxRatioY = sat(maxRelativeY / grid.bounds.height);
  return {
    xMin: Math.floor(minRatioX * grid.dimensions.width),
    yMin: Math.floor(minRatioY * grid.dimensions.height),
    xMax: Math.floor(maxRatioX * grid.dimensions.width),
    yMax: Math.floor(maxRatioY * grid.dimensions.height),
  };
};

/**
 * Iterate all cells in the range of "indicesRange" and call the fn with the cells x and y indices.
 *
 * @param indicesRange {xMin, yMin, xMax, yMax}
 * @param fn Side effecting function. Takes the cells x and y indices
 */
const forEachIndex = (indicesRange, fn) => {
  for (let x = indicesRange.xMin; x <= indicesRange.xMax; x++) {
    for (let y = indicesRange.yMin; y <= indicesRange.yMax; y++) {
      fn(x, y);
    }
  }
};

/**
 * Create a function that returns objects with incrementing ids.
 *
 * @returns @function spawnEntity this function can be given additional attributes that are merged to the created object
 */
const createSpawnEntity = () => {
  let autoIncrementId = 1;
  return (attributes) => ({
    id: autoIncrementId++,
    ...attributes,
  });
};

/**
 * Add entity id to "cells" based on its size and position relative to the grid.
 * Also add a mapping of the entities id and indice range to "entities".
 *
 * @param grid grid made by create
 * @param entity must have position {x, y}, dimensions {width, height} and id
 * @returns
 */
const addEntity = (grid, entity) => {
  const indices = getCellIndices(grid, entity);
  const addToIndex = (x, y) => grid.cells[x][y].add(entity.id);
  forEachIndex(indices, addToIndex);
  grid.entities[entity.id] = indices;
  return grid;
};

/**
 * Remove entity from grid "cells" and the "entities" map.
 *
 * @param grid grid made by create
 * @param entity must have id
 * @returns
 */
const removeEntity = (grid, entity) => {
  const indices = grid.entities[entity.id];
  const removeFromIndex = (x, y) => grid.cells[x][y].delete(entity.id);
  forEachIndex(indices, removeFromIndex);
  //delete grid.entities[entity.id];
  // setting to undefined is enough and way faster
  grid.entities[entity.id] = undefined;
  return grid;
};

/**
 * Helper to test if and indice range is equal by value.
 *
 * @param a
 * @param b
 * @returns
 */
const equalIndices = (a, b) => {
  return (
    a.xMin === b.xMin &&
    a.xMax === b.xMax &&
    a.yMin === b.yMin &&
    a.yMax === b.yMax
  );
};

/**
 * Takes an entity with an updated position and changes it's location in the grid,
 * if there has been enough movement.
 *
 * @param grid
 * @param entity
 * @returns
 */
const updateEntity = (grid, entity) => {
  const previousIndices = grid.entities[entity.id];
  const currentIndices = getCellIndices(grid, entity);
  if (equalIndices(previousIndices, currentIndices)) {
    return grid;
  }

  const addToIndex = (x, y) => grid.cells[x][y].add(entity.id);
  const removeFromIndex = (x, y) => grid.cells[x][y].delete(entity.id);

  forEachIndex(previousIndices, removeFromIndex);
  forEachIndex(currentIndices, addToIndex);
  grid.entities[entity.id] = currentIndices;
  return grid;
};

/**
 * Return a set of entities in the grid tha t are inside an area with given position and dimensions.
 *
 * @param grid
 * @param position
 * @param dimensions
 * @returns
 */
const findNearby = (grid, position, dimensions) => {
  const indices = getCellIndices(grid, { position, dimensions });
  const nearby = new Set();
  const addToNearby = (entity) => nearby.add(entity);
  const addCellEntitiesToNearby = (x, y) =>
    grid.cells[x][y].forEach(addToNearby);
  forEachIndex(indices, addCellEntitiesToNearby);
  return nearby;
};

/**
 * Convert a grid to a string eg. for storage.
 *
 * @param grid
 * @returns
 */
const stringify = (grid) =>
  JSON.stringify(grid, (_, v) => (v instanceof Set && [...v]) || v, 2);

/**
 * Convert a stringified grid back to normal.
 *
 * @param grid
 * @returns
 */
const parse = (stringifiedGrid) => {
  const grid = JSON.parse(stringifiedGrid);
  grid.cells.forEach((_, idx) => {
    grid.cells[idx] = grid.cells[idx].map((y) => new Set(y));
  });
  return grid;
};

/**
 * Convert a grid to a buffer eg. for storage.
 *
 * @param grid
 * @returns
 */
const serialize = (grid) => Buffer.from(stringify(grid));

/**
 * Convert a binary grid back to normal.
 *
 * @param buffer
 * @returns
 */
const deserialize = (buffer) => parse(buffer.toString());

export default {
  create,
  equalIndices,
  getCellIndices,
  addEntity,
  removeEntity,
  updateEntity,
  findNearby,
  createSpawnEntity,
  stringify,
  parse,
  serialize,
  deserialize,
};