class BookingStaff {
  const BookingStaff({
    required this.id,
    required this.displayName,
    this.designation,
  });

  final String id;
  final String displayName;
  final String? designation;

  factory BookingStaff.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final displayName = json['displayName']?.toString().trim();
    if (id == null ||
        id.isEmpty ||
        displayName == null ||
        displayName.isEmpty) {
      throw const FormatException('Invalid staff directory entry.');
    }
    return BookingStaff(
      id: id,
      displayName: displayName,
      designation: json['designation']?.toString(),
    );
  }
}

class AvailabilityWindow {
  const AvailabilityWindow({
    required this.id,
    required this.staffId,
    required this.date,
    required this.startTime,
    required this.endTime,
  });

  final String id;
  final String staffId;
  final String date;
  final String startTime;
  final String endTime;

  factory AvailabilityWindow.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final staffId = json['staffId']?.toString().trim();
    final date = json['date']?.toString();
    final startTime = json['startTime']?.toString();
    final endTime = json['endTime']?.toString();
    final timePattern = RegExp(r'^([01]\d|2[0-3]):[0-5]\d$');
    if (id == null ||
        id.isEmpty ||
        staffId == null ||
        staffId.isEmpty ||
        date == null ||
        DateTime.tryParse(date) == null ||
        startTime == null ||
        !timePattern.hasMatch(startTime) ||
        endTime == null ||
        !timePattern.hasMatch(endTime)) {
      throw const FormatException('Invalid availability entry.');
    }
    return AvailabilityWindow(
      id: id,
      staffId: staffId,
      date: date,
      startTime: startTime,
      endTime: endTime,
    );
  }
}
