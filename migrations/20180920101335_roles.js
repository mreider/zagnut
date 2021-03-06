
exports.up = function(knex, Promise) {
  return knex.raw(`CREATE TABLE roles (
    id                MEDIUMINT     NOT NULL AUTO_INCREMENT,
    role              VARCHAR(255)  NOT NULL,
    created_at        DATETIME      NOT NULL      DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL      DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  );`);
};

exports.down = function(knex, Promise) {
  return knex.raw(`DROP TABLE roles;`);
};
