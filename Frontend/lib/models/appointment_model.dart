import 'service_model.dart';

enum AppointmentStatus {
  upcoming,
  completed,
  cancelled,
}

extension AppointmentStatusX on AppointmentStatus {
  String get label {
    switch (this) {
      case AppointmentStatus.upcoming:
        return 'Upcoming';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
    }
  }

  static AppointmentStatus fromValue(String? value) {
    switch (value?.toLowerCase()) {
      case 'completed':
        return AppointmentStatus.completed;
      case 'cancelled':
        return AppointmentStatus.cancelled;
      default:
        return AppointmentStatus.upcoming;
    }
  }
}

class AppointmentModel {
  const AppointmentModel({
    required this.id,
    required this.service,
    required this.dateTime,
    required this.durationMinutes,
    required this.staffName,
    required this.staffImageUrl,
    required this.status,
    required this.totalPrice,
    this.location = 'Luxe Salon',
    this.notes = '',
  });

  final String id;
  final ServiceModel service;
  final DateTime dateTime;
  final int durationMinutes;
  final String staffName;
  final String staffImageUrl;
  final AppointmentStatus status;
  final double totalPrice;
  final String location;
  final String notes;

  DateTime get endDateTime =>
      dateTime.add(Duration(minutes: durationMinutes));

  String get timeRange {
    String formatTime(DateTime value) {
      final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
      final minute = value.minute.toString().padLeft(2, '0');
      final suffix = value.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $suffix';
    }

    return '${formatTime(dateTime)} – ${formatTime(endDateTime)}';
  }

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    final serviceJson =
        (json['service'] as Map?)?.cast<String, dynamic>() ?? const {};
    return AppointmentModel(
      id: json['id'] as String? ?? '',
      service: ServiceModel.fromJson(serviceJson),
      dateTime: DateTime.tryParse(json['dateTime'] as String? ?? '') ??
          DateTime.now(),
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 60,
      staffName: json['staffName'] as String? ?? 'Any specialist',
      staffImageUrl: json['staffImageUrl'] as String? ?? '',
      status: AppointmentStatusX.fromValue(json['status'] as String?),
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0,
      location: json['location'] as String? ?? 'Luxe Salon',
      notes: json['notes'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'service': service.toJson(),
      'dateTime': dateTime.toIso8601String(),
      'durationMinutes': durationMinutes,
      'staffName': staffName,
      'staffImageUrl': staffImageUrl,
      'status': status.name,
      'totalPrice': totalPrice,
      'location': location,
      'notes': notes,
    };
  }

  AppointmentModel copyWith({
    String? id,
    ServiceModel? service,
    DateTime? dateTime,
    int? durationMinutes,
    String? staffName,
    String? staffImageUrl,
    AppointmentStatus? status,
    double? totalPrice,
    String? location,
    String? notes,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      service: service ?? this.service,
      dateTime: dateTime ?? this.dateTime,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      staffName: staffName ?? this.staffName,
      staffImageUrl: staffImageUrl ?? this.staffImageUrl,
      status: status ?? this.status,
      totalPrice: totalPrice ?? this.totalPrice,
      location: location ?? this.location,
      notes: notes ?? this.notes,
    );
  }
}
