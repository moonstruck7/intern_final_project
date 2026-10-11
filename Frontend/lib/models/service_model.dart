class ServiceModel {
  const ServiceModel({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.durationMinutes,
    required this.price,
    required this.imageUrl,
    this.categoryId,
    this.status = 'active',
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

  /// Canonical backend category reference. The catalog endpoint currently does
  /// not expose a customer-facing category name.
  final String? categoryId;
  final String status;
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
      categoryId: json['categoryId'] as String?,
      status: json['status'] as String? ?? 'active',
      featured: json['featured'] as bool? ?? false,
      includedItems:
          (json['includedItems'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList(growable: false) ??
          const <String>[],
    );
  }

  String get effectiveImageUrl {
    if (imageUrl.trim().isNotEmpty) return imageUrl.trim();
    final lower = category.toLowerCase();
    if (lower.contains('hair')) {
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.contains('skin') || lower.contains('facial')) {
      return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.contains('nail')) {
      return 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.contains('spa') || lower.contains('mass') || lower.contains('body')) {
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';
  }

  /// Parses the canonical `/api/v1/catalog/services` representation.
  factory ServiceModel.fromCatalogJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final name = json['name']?.toString().trim();
    final categoryId = (json['categoryId'] is Map
            ? json['categoryId']['_id']
            : json['categoryId'])
        ?.toString()
        .trim();
    final price = json['price'];
    final duration = json['durationMinutes'];
    final status = json['status']?.toString();

    if (id == null ||
        id.isEmpty ||
        name == null ||
        name.isEmpty ||
        categoryId == null ||
        categoryId.isEmpty ||
        price is! num ||
        !price.isFinite ||
        price < 0 ||
        duration is! num ||
        duration.toInt() != duration ||
        duration <= 0 ||
        (status != 'active' && status != 'inactive')) {
      throw const FormatException('Invalid service catalog item.');
    }

    var categoryStr = (json['category'] ??
            (json['categoryId'] is Map ? json['categoryId']['name'] : null))
        ?.toString()
        .trim() ??
        '';

    if (categoryStr.isEmpty || categoryStr == 'Other' || categoryStr == 'General' || categoryStr == 'Hair & Styling') {
      final lowerName = name.toLowerCase();
      if (lowerName.contains('facial') || lowerName.contains('skin') || lowerName.contains('peel') || lowerName.contains('collagen')) {
        categoryStr = 'Skincare & Facials';
      } else if (lowerName.contains('massage') || lowerName.contains('spa') || lowerName.contains('wrap') || lowerName.contains('stone')) {
        categoryStr = 'Spa & Wellness';
      } else if (lowerName.contains('nail') || lowerName.contains('manicure') || lowerName.contains('pedicure')) {
        categoryStr = 'Nails';
      } else if (categoryStr.isEmpty) {
        categoryStr = 'Hair Styling';
      }
    }
    final descriptionStr = json['description']?.toString().trim() ?? '';
    final imageUrlStr = json['imageUrl']?.toString().trim() ?? '';
    final featuredVal = json['featured'] == true;
    final includedItemsVal = (json['includedItems'] as List<dynamic>?)
            ?.map((item) => item.toString())
            .toList(growable: false) ??
        const <String>[];

    return ServiceModel(
      id: id,
      name: name,
      category: categoryStr,
      categoryId: categoryId,
      description: descriptionStr,
      durationMinutes: duration.toInt(),
      price: price.toDouble(),
      imageUrl: imageUrlStr,
      status: status!,
      featured: featuredVal,
      includedItems: includedItemsVal,
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
      'categoryId': categoryId,
      'status': status,
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
    String? categoryId,
    String? status,
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
      categoryId: categoryId ?? this.categoryId,
      status: status ?? this.status,
      featured: featured ?? this.featured,
      includedItems: includedItems ?? this.includedItems,
    );
  }
}
