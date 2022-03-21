class ExportsHandler {
  constructor(service, playlistsService, validator) {
    this._service = service;
    this._validator = validator;
    this._playlistsService = playlistsService;

    this.postExportPlaylistsHandler =
      this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { id: userId } = request.auth.credentials;
    const { playlistid } = request.params;
    const { targetEmail } = request.payload;

    // Playlist check
    await this._playlistsService.verifyPlaylistAccess(playlistid, userId);

    const message = {
      playlistid,
      targetEmail,
    };

    await this._service.sendMessage(
      'export:playlists',
      JSON.stringify(message)
    );

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
