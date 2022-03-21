/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('user_album_likes', {
    id: {
      type: 'varchar(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'varchar(50)',
      notNull: true,
    },
    album_id: {
      type: 'varchar(50)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'user_album_likes',
    'fk_user_album_likes.user.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
  );

  pgm.addConstraint(
    'user_album_likes',
    'fk_user_album_likes.album.id',
    'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE'
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('user_album_likes', 'fk_user_album_likes.album.id');
  pgm.dropConstraint('user_album_likes', 'fk_user_album_likes.user.id');

  pgm.dropTable('user_album_likes');
};
