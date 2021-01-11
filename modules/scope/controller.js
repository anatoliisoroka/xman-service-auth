//imports
//local libraries
const { httpStatus, getScopeList } = require('../../utilities/constants');

exports.get = async (req, res) => {
    const meta = {}
    if (req.query.all === 'false') {
        meta.scopes = req.user.scope
    } else {
        meta.scopes = getScopeList
    }
    return res.status(200).json( { status: httpStatus.success, message: 'Successfully notify the team', code: 200, meta } );
}

exports.getPublic = async (req, res) => {
    const meta = { scopes: getScopeList }
    return res.status(200).json( { status: httpStatus.success, message: 'Successfully notify the team', code: 200, meta } );
}