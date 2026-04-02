class User {
  constructor(id, username, password, role) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.role = role; // 'student' or 'admin'
  }

  static findById(id) {
    // Placeholder for database lookup
    return { id: id, username: 'testuser', role: 'student' };
  }

  static findByUsername(username) {
    // Placeholder for database lookup
    return { id: 1, username: username, password: 'hashedpassword', role: 'student' };
  }
}

module.exports = User;
