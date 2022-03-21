const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }
  /* Service for playlist */

  async addPlaylist(name, owner) {
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [nanoid(16), name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT playlists.*, users.username FROM playlists
        LEFT JOIN users ON playlists.owner = users.id
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getPlaylistById(id) {
    const query = {
      text: `
        SELECT playlists.*, users.username FROM playlists 
        LEFT JOIN users ON playlists.owner = users.id
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id

        WHERE playlists.id = $1
      `,
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  /* Service for song with relation in playlist */
  async addSongToPlaylist(playlistId, songId) {
    await this.verifyPostSongToPlaylist(songId);
    const query = {
      text: 'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id',
      values: [nanoid(16), playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
  }

  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: `
      SELECT songs.id, songs.title, songs.performer FROM songs
      JOIN playlist_songs ON songs.id = playlist_songs.song_id 
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus');
    }
  }

  /* Activities */
  async getActivities(playlistId) {
    const query = {
      text: `
        SELECT activities.*, users.username, songs.title
        FROM activities
        LEFT JOIN users ON activities.user_id = users.id
        LEFT JOIN songs ON activities.song_id = songs.id
        WHERE activities.playlist_id = $1
        ORDER BY activities.time ASC
      `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async postActivity(playlistId, songId, userId, action) {
    const date = new Date().toISOString();
    const query = {
      text: `
      INSERT INTO activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id
      `,
      values: [nanoid(16), playlistId, songId, userId, action, date],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Aktifitas gagal ditambahkan');
    }
  }

  /* Service for authentications */
  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPostSongToPlaylist(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistService;
