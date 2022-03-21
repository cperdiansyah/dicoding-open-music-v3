const ExportPlaylistsPayloadSchema = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const ExportsValidator = {
  validateExportPlaylistsPayload: (payload) => {
    const { error } = ExportPlaylistsPayloadSchema.validate(payload);

    if (error) {
      throw new InvariantError(error.message);
    }
  },
};

module.exports = ExportsValidator;
