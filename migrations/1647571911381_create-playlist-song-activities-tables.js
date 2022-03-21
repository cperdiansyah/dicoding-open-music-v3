/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('activities', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    action: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    time: {
      type: 'TIMESTAMP',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'activities',
    'fk_activities.playlist.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE'
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('activities', 'fk_activities.playlist.id');

  pgm.dropTable('activities');
};
