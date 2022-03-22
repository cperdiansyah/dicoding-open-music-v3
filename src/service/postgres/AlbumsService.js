const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }
  /* CRUD Album */
  async addAlbum(name, year) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO albums (id, name, year) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const { rows } = await this._pool.query('SELECT * FROM albums');
    return rows;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows[0];
  }

  async getSongByAlbumId(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal diedit');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus');
    }
  }

  /* Add Cover Album */

  async addAlbumCover(albumid, coverurl) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2',
      values: [coverurl, albumid],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Cover gagal ditambahkan');
    }
  }

  /* Likes Album */
  async addAlbumLike(albumid, userid) {
    const getLikeQuery = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumid, userid],
    };
    const getLikeResult = await this._pool.query(getLikeQuery);

    /* Pengkodisian kalau belum ada like di album */
    if (!getLikeResult.rowCount) {
      /* Lakukan like */
      await this.userLikeAlbums(userid, albumid);
    } else {
      /* Lakukan dislikes */
      await this.userDislikeAlbums(userid, albumid);
    }
    // await this._cacheService.delete(`likes:${albumid}`);
  }

  async userLikeAlbums(userId, album_id) {
    const query = {
      text: 'INSERT INTO user_album_likes (id, user_id, album_id) VALUES ($1, $2, $3)',
      values: [nanoid(16), userId, album_id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Like gagal ditambahkan');
    }
  }

  async userDislikeAlbums(userId, albumid) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumid, userId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Like gagal dihapus');
    }
  }

  async getLikeAlbum(albumid) {
    /*  try {
      // get from cache
      const result = await this._cacheService.get(`likes:${albumid}`);
      return { likes: JSON.parse(result), isCache: 1 };
    } catch (error) { */
    // if cache doesn't exist
    const query = {
      text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
      values: [albumid],
    };
    const result = await this._pool.query(query);

    // save to cache
    /* await this._cacheService.set(
      `likes:${albumid}`,
      JSON.stringify(result.rows)
    ); */
    return { likes: result.rows };
    // }
  }
}

module.exports = AlbumsService;
