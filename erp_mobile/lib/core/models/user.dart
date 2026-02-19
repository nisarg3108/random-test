class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? avatar;
  final String? tenantId;
  final String? tenantName;
  final List<String> permissions;

  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatar,
    this.tenantId,
    this.tenantName,
    this.permissions = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    String resolveName() {
      if (json['name'] != null) return json['name'] as String;
      final first = json['firstName'] as String? ?? '';
      final last = json['lastName'] as String? ?? '';
      final full = '$first $last'.trim();
      return full.isNotEmpty ? full : (json['email'] as String? ?? '');
    }

    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      name: resolveName(),
      role: json['role'] ?? 'USER',
      avatar: json['avatar'],
      tenantId: json['tenantId']?.toString(),
      tenantName: json['tenant']?['name'],
      permissions: List<String>.from(json['permissions'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'avatar': avatar,
        'tenantId': tenantId,
      };

  bool hasPermission(String permission) => permissions.contains(permission);

  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isManager => role == 'MANAGER' || isAdmin;
}
