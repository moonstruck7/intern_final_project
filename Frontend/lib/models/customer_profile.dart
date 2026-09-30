class CustomerProfile {
  const CustomerProfile({
    required this.id,
    required this.displayName,
    this.email,
    this.phone,
    required this.status,
  });

  final String id;
  final String displayName;
  final String? email;
  final String? phone;
  final String status;

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      displayName: (json['displayName'] ?? '').toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      status: (json['status'] ?? '').toString(),
    );
  }
}
