/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('albums', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'SMALLINT ',
      notNull: true,
    },
    coverUrl: {
      type: 'varchar(255)',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('albums');
};
