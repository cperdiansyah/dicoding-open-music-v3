const ClientError = require('../../exceptions/ClientError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);

    this.postSongToplaylistHandler = this.postSongToplaylistHandler.bind(this);
    this.getSongsWithPlaylistHandler =
      this.getSongsWithPlaylistHandler.bind(this);
    this.deleteSongByFromPlaylistHandler =
      this.deleteSongByFromPlaylistHandler.bind(this);

    this.getActivitiesHandler = this.getActivitiesHandler.bind(this);
  }
  /* Playlist handler */
  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist(name, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;

    const playlistsMap = await this._service.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists: playlistsMap.map((playlists) => ({
          id: playlists.id,
          name: playlists.name,
          username: playlists.username,
        })),
      },
    };
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylistById(id);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  /* Playlist with song handler */

  async postSongToplaylistHandler(request, h) {
    this._validator.validatePostSongPayload(request.payload);

    const { playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    await this._service.addSongToPlaylist(playlistId, songId);

    await this._service.postActivity(playlistId, songId, credentialId, 'add');

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsWithPlaylistHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    const playlist = await this._service.getPlaylistById(playlistId);

    const songs = await this._service.getSongsFromPlaylist(playlistId);

    return {
      status: 'success',
      data: {
        playlist: { ...playlist, songs },
      },
    };
  }

  async deleteSongByFromPlaylistHandler(request, h) {
    const { playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deleteSongFromPlaylist(playlistId, songId);
    await this._service.postActivity(
      playlistId,
      songId,
      credentialId,
      'delete'
    );

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }

  /* Activities */

  async getActivitiesHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    const activities = await this._service.getActivities(playlistId);

    const activityResponse = activities.map((activity) => ({
      username: activity.username,
      title: activity.title,
      action: activity.action,
      time: activity.time,
    }));

    return {
      status: 'success',
      data: {
        playlistId,
        activities: activityResponse,
      },
    };
  }
}

module.exports = PlaylistsHandler;
