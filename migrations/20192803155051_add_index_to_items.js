exports.up = async function(knex) {
  return knex.raw(`
  ALTER TABLE items
  ADD COLUMN order_index TINYINT NULL DEFAULT '0' AFTER mailers;
  `);
};
exports.down = function(knex, Promise) {
  return knex.raw(`
    ALTER TABLE items
    DROP COLUMN order_index;
  `);
};
