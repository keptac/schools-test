module.exports = () => `SELECT * FROM fees_structure WHERE school_id = ? AND status='active'`;
