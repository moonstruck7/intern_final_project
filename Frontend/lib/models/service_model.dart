class ServiceModel {
  const ServiceModel({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.durationMinutes,
    required this.price,
    required this.imageUrl,
    this.featured = false,
    this.includedItems = const <String>[],
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final int durationMinutes;
  final double price;
  final String imageUrl;
  final bool featured;
  final List<String> includedItems;

  String get durationLabel {
    if (durationMinutes < 60) return '$durationMinutes min';
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    return minutes == 0 ? '$hours hr' : '$hours hr $minutes min';
  }

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      category: json['category'] as String? ?? 'Other',
      description: json['description'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      imageUrl: json['imageUrl'] as String? ?? '',
      featured: json['featured'] as bool? ?? false,
      includedItems: (json['includedItems'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList(growable: false) ??
          const <String>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'description': description,
      'durationMinutes': durationMinutes,
      'price': price,
      'imageUrl': imageUrl,
      'featured': featured,
      'includedItems': includedItems,
    };
  }

  ServiceModel copyWith({
    String? id,
    String? name,
    String? category,
    String? description,
    int? durationMinutes,
    double? price,
    String? imageUrl,
    bool? featured,
    List<String>? includedItems,
  }) {
    return ServiceModel(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      description: description ?? this.description,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      featured: featured ?? this.featured,
      includedItems: includedItems ?? this.includedItems,
    );
  }
}
