import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/service_model.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../services/customer_booking_repository.dart';
import '../theme/salon_theme.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';

class BookingTimeSlot {
  const BookingTimeSlot({required this.time, this.isAvailable = true});

  final TimeOfDay time;
  final bool isAvailable;

  String get label {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final suffix = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $suffix';
  }
}

class SalonStaff {
  const SalonStaff({
    required this.id,
    required this.name,
    required this.imageUrl,
    this.specialty = '',
  });

  final String id;
  final String name;
  final String imageUrl;
  final String specialty;
}

class BookingController extends ChangeNotifier {
  BookingController({required this.service, required this.bookingRepository}) {
    selectedDate = _dateOnly(DateTime.now());
  }

  final ServiceModel service;
  final CustomerBookingRepository bookingRepository;

  late DateTime selectedDate;
  TimeOfDay? selectedTime;
  SalonStaff? selectedStaff;

  List<BookingTimeSlot> slots = const [];
  List<SalonStaff> staff = const [];
  bool isLoadingSlots = false;
  bool isLoadingStaff = false;
  bool isSubmitting = false;
  String? error;
  int _availabilityRequest = 0;

  bool get canContinue =>
      selectedTime != null &&
      selectedStaff != null &&
      !isLoadingSlots &&
      !isSubmitting;

  Future<void> load() async {
    error = null;
    isLoadingStaff = true;
    notifyListeners();

    try {
      staff = List.unmodifiable(
        (await bookingRepository.fetchStaff()).map(
          (person) => SalonStaff(
            id: person.id,
            name: person.displayName,
            specialty: person.designation ?? '',
            imageUrl: '',
          ),
        ),
      );
    } on ApiException catch (exception) {
      error = exception.message;
    } catch (_) {
      error = 'Unable to load staff. Please try again.';
    } finally {
      isLoadingStaff = false;
      notifyListeners();
    }

    if (selectedStaff != null) await selectDate(selectedDate);
  }

  Future<void> selectDate(DateTime date) async {
    final request = ++_availabilityRequest;
    selectedDate = _dateOnly(date);
    selectedTime = null;
    slots = const [];
    if (selectedStaff == null) {
      notifyListeners();
      return;
    }
    isLoadingSlots = true;
    error = null;
    notifyListeners();

    try {
      final dateValue = _formatDate(selectedDate);
      final staffId = selectedStaff!.id;
      final windows = await bookingRepository.fetchAvailability(
        staffId: staffId,
        date: dateValue,
      );
      if (request != _availabilityRequest ||
          selectedStaff?.id != staffId ||
          _formatDate(selectedDate) != dateValue) {
        return;
      }
      // The backend provides availability windows, not a slot policy. Selecting
      // each window's canonical start time avoids inventing local intervals.
      slots = List.unmodifiable(
        windows.map(
          (window) => BookingTimeSlot(time: _parseTime(window.startTime)),
        ),
      );
    } on ApiException catch (exception) {
      if (request != _availabilityRequest) return;
      slots = const [];
      error = exception.message;
    } catch (_) {
      if (request != _availabilityRequest) return;
      slots = const [];
      error = 'Unable to load availability. Please try again.';
    } finally {
      if (request == _availabilityRequest) {
        isLoadingSlots = false;
        notifyListeners();
      }
    }
  }

  void selectTime(BookingTimeSlot slot) {
    if (!slot.isAvailable) return;
    selectedTime = slot.time;
    notifyListeners();
  }

  void selectStaff(SalonStaff person) {
    if (selectedStaff?.id == person.id) {
      return;
    }
    selectedStaff = person;
    selectDate(selectedDate);
  }

  DateTime get selectedDateTime {
    final time = selectedTime;
    if (time == null) return selectedDate;
    return DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      time.hour,
      time.minute,
    );
  }

  static DateTime _dateOnly(DateTime date) =>
      DateTime(date.year, date.month, date.day);

  Future<bool> submit() async {
    if (!canContinue || selectedStaff == null || selectedTime == null) {
      return false;
    }
    isSubmitting = true;
    error = null;
    notifyListeners();
    try {
      await bookingRepository.createAppointment(
        serviceId: service.id,
        staffId: selectedStaff!.id,
        date: _formatDate(selectedDate),
        startTime: _formatTime(selectedTime!),
      );
      return true;
    } on ApiException catch (exception) {
      error = exception.message;
      return false;
    } catch (_) {
      error = 'Unable to create the appointment. Please try again.';
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  static String _formatDate(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  static String _formatTime(TimeOfDay time) =>
      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  static TimeOfDay _parseTime(String value) {
    final parts = value.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }
}

class BookingScreen extends StatelessWidget {
  const BookingScreen({super.key, required this.service, this.onConfirmed});

  final ServiceModel service;
  final ValueChanged<DateTime>? onConfirmed;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => BookingController(
        service: service,
        bookingRepository: CustomerBookingRepository(
          apiClient: context.read<ApiClient>(),
          authRepository: context.read<AuthRepository>(),
        ),
      )..load(),
      child: _BookingView(onConfirmed: onConfirmed),
    );
  }
}

class _BookingView extends StatelessWidget {
  const _BookingView({this.onConfirmed});

  final ValueChanged<DateTime>? onConfirmed;

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<BookingController>();

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                // ── Hero image app bar ──────────────────────────
                SliverAppBar(
                  expandedHeight: 240,
                  pinned: true,
                  backgroundColor: SalonTheme.cream,
                  foregroundColor: Colors.white,
                  leading: Padding(
                    padding: const EdgeInsets.all(8),
                    child: CircleAvatar(
                      backgroundColor: Colors.black38,
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 18,
                          color: Colors.white,
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),
                  ),
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          controller.service.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            color: SalonTheme.warmSurface,
                            child: const Icon(
                              Icons.spa_rounded,
                              size: 60,
                              color: SalonTheme.cocoa,
                            ),
                          ),
                        ),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: SalonTheme.heroGradient,
                          ),
                        ),
                        // Service info overlay at bottom
                        Positioned(
                          left: 20,
                          right: 20,
                          bottom: 16,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 9,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: SalonTheme.peach.withValues(
                                    alpha: 0.9,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  controller.service.category,
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                controller.service.name,
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  _HeroPill(
                                    icon: Icons.schedule_rounded,
                                    label: controller.service.durationLabel,
                                  ),
                                  const SizedBox(width: 8),
                                  _HeroPill(
                                    icon: Icons.payments_outlined,
                                    label:
                                        '\$${controller.service.price.toStringAsFixed(0)}',
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Date selection ──────────────────────
                        _SectionLabel('Select Date'),
                        const SizedBox(height: 12),
                        _DateSelector(
                          selectedDate: controller.selectedDate,
                          onDateSelected: controller.selectDate,
                        ),
                        const SizedBox(height: 26),

                        // ── Time slots ──────────────────────────
                        Row(
                          children: [
                            _SectionLabel('Available Times'),
                            const Spacer(),
                            if (controller.selectedTime != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: SalonTheme.cocoaGradient,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  controller.selectedTimeLabel,
                                  style: Theme.of(context).textTheme.labelMedium
                                      ?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (controller.error != null)
                          ErrorBannerWidget(
                            message: controller.error!,
                            onRetry: controller.staff.isEmpty
                                ? controller.load
                                : () => controller.selectDate(
                                    controller.selectedDate,
                                  ),
                          )
                        else if (controller.isLoadingSlots)
                          const _SlotShimmer()
                        else if (controller.slots.isEmpty)
                          const SalonEmptyState(
                            title: 'No times available',
                            message: 'There are no bookable slots for this date. Try another day.',
                            icon: Icons.access_time_filled_rounded,
                          )
                        else
                          _TimeSlotFlow(controller: controller),

                        const SizedBox(height: 26),

                        // ── Staff picker ────────────────────────
                        _SectionLabel('Choose Specialist'),
                        const SizedBox(height: 12),
                        if (controller.isLoadingStaff)
                          const _StaffShimmer()
                        else if (controller.staff.isEmpty)
                          const SalonEmptyState(
                            title: 'No staff available',
                            message: 'There are no active specialists available for booking.',
                            icon: Icons.person_off_outlined,
                          )
                        else
                          _StaffPicker(controller: controller),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Sticky confirm button ────────────────────────────
          Container(
            decoration: BoxDecoration(
              color: SalonTheme.cream,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              minimum: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: GestureDetector(
                onTap: controller.canContinue
                    ? () => _showConfirmation(context, controller, onConfirmed)
                    : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: controller.canContinue
                        ? SalonTheme.cocoaGradient
                        : const LinearGradient(
                            colors: [Color(0xFFCCBBB0), Color(0xFFCCBBB0)],
                          ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: controller.canContinue
                        ? [
                            BoxShadow(
                              color: SalonTheme.cocoa.withValues(alpha: 0.4),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [],
                  ),
                  child: Center(
                    child: Text(
                      controller.isSubmitting
                          ? 'Submitting…'
                          : 'Continue to Confirm',
                      style: GoogleFonts.nunito(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showConfirmation(
    BuildContext context,
    BookingController controller,
    ValueChanged<DateTime>? onConfirmed,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: SalonTheme.cream,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => _ConfirmationSheet(controller: controller),
    );

    if (result == true && context.mounted) {
      final booked = await controller.submit();
      if (!context.mounted) return;
      if (booked) {
        onConfirmed?.call(controller.selectedDateTime);
      } else if (controller.error != null) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(controller.error!)));
        return;
      }
      if (!booked) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Appointment confirmed successfully.')),
      );
    }
  }
}

extension on BookingController {
  String get selectedTimeLabel {
    final time = selectedTime;
    if (time == null) return '';
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final suffix = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $suffix';
  }
}

// ── Section label ─────────────────────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w800,
        color: SalonTheme.deepChocolate,
      ),
    );
  }
}

// ── Hero pill ─────────────────────────────────────────────────────────────────
class _HeroPill extends StatelessWidget {
  const _HeroPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall
                ?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

// ── Date selector ─────────────────────────────────────────────────────────────
class _DateSelector extends StatelessWidget {
  const _DateSelector({
    required this.selectedDate,
    required this.onDateSelected,
  });

  final DateTime selectedDate;
  final ValueChanged<DateTime> onDateSelected;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final firstDay = DateTime(today.year, today.month, today.day);

    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 21,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final date = firstDay.add(Duration(days: index));
          final selected =
              date.year == selectedDate.year &&
              date.month == selectedDate.month &&
              date.day == selectedDate.day;
          final isToday = index == 0;

          return GestureDetector(
            onTap: () => onDateSelected(date),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 62,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                gradient: selected ? SalonTheme.cocoaGradient : null,
                color: selected ? null : SalonTheme.warmSurface,
                borderRadius: BorderRadius.circular(18),
                border: isToday && !selected
                    ? Border.all(color: SalonTheme.cocoa, width: 1.5)
                    : null,
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: SalonTheme.cocoa.withValues(alpha: 0.30),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _weekday(date.weekday),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: selected
                          ? Colors.white70
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${date.day}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: selected ? Colors.white : SalonTheme.deepChocolate,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    _month(date.month),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: selected ? Colors.white60 : null,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String _weekday(int value) =>
      const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][value - 1];

  String _month(int value) => const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][value - 1];
}

// ── Time slot flow ────────────────────────────────────────────────────────────
class _TimeSlotFlow extends StatelessWidget {
  const _TimeSlotFlow({required this.controller});

  final BookingController controller;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: controller.slots.map((slot) {
        final selected = controller.selectedTime == slot.time;
        return GestureDetector(
          onTap: slot.isAvailable ? () => controller.selectTime(slot) : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              gradient: selected ? SalonTheme.cocoaGradient : null,
              color: selected
                  ? null
                  : slot.isAvailable
                  ? Colors.white
                  : SalonTheme.warmSurface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected
                    ? Colors.transparent
                    : slot.isAvailable
                    ? const Color(0xFFEBDDD5)
                    : const Color(0xFFF0E8E3),
                width: 1.2,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: SalonTheme.cocoa.withValues(alpha: 0.25),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Text(
              slot.label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: selected
                    ? Colors.white
                    : slot.isAvailable
                    ? SalonTheme.deepChocolate
                    : Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                decoration: slot.isAvailable
                    ? null
                    : TextDecoration.lineThrough,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Staff picker ──────────────────────────────────────────────────────────────
class _StaffPicker extends StatelessWidget {
  const _StaffPicker({required this.controller});

  final BookingController controller;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: controller.staff.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final person = controller.staff[index];
          final selected = controller.selectedStaff?.id == person.id;
          return GestureDetector(
            onTap: () => controller.selectStaff(person),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 88,
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                gradient: selected ? SalonTheme.cocoaGradient : null,
                color: selected ? null : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: selected
                      ? Colors.transparent
                      : const Color(0xFFEBDDD5),
                  width: 1.2,
                ),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: SalonTheme.cocoa.withValues(alpha: 0.30),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: selected
                            ? Colors.white30
                            : const Color(0xFFEBDDD5),
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 25,
                      backgroundImage: NetworkImage(person.imageUrl),
                      onBackgroundImageError: (_, _) {},
                      backgroundColor: SalonTheme.warmSurface,
                      child: person.imageUrl.isEmpty
                          ? const Icon(Icons.person_rounded)
                          : null,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    person.name,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: selected ? Colors.white : SalonTheme.deepChocolate,
                    ),
                  ),
                  if (person.specialty.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      person.specialty,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontSize: 9.5,
                        color: selected
                            ? Colors.white70
                            : Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Confirmation sheet ────────────────────────────────────────────────────────
class _ConfirmationSheet extends StatelessWidget {
  const _ConfirmationSheet({required this.controller});

  final BookingController controller;

  @override
  Widget build(BuildContext context) {
    final date = controller.selectedDateTime;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Confirm your appointment',
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: SalonTheme.deepChocolate,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Review your booking details below',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: const Border(
                  left: BorderSide(color: SalonTheme.cocoa, width: 4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: SalonTheme.cocoa.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _SummaryRow(
                    icon: Icons.spa_outlined,
                    label: 'Service',
                    value: controller.service.name,
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    icon: Icons.calendar_month_outlined,
                    label: 'Date',
                    value: '${_month(date.month)} ${date.day}, ${date.year}',
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    icon: Icons.schedule_outlined,
                    label: 'Time',
                    value: controller.selectedTimeLabel,
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    icon: Icons.person_outline_rounded,
                    label: 'Specialist',
                    value: controller.selectedStaff!.name,
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    icon: Icons.payments_outlined,
                    label: 'Total',
                    value: '\$${controller.service.price.toStringAsFixed(0)}',
                    bold: true,
                    accent: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(true),
              child: Container(
                height: 54,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: SalonTheme.cocoaGradient,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: SalonTheme.cocoa.withValues(alpha: 0.4),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '✓  Confirm Appointment',
                    style: GoogleFonts.nunito(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _month(int value) => const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][value - 1];
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
    this.bold = false,
    this.accent = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool bold;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: SalonTheme.cocoa),
        const SizedBox(width: 12),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
              color: accent ? SalonTheme.cocoa : null,
              fontSize: bold ? 16 : null,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Shimmers ──────────────────────────────────────────────────────────────────
class _SlotShimmer extends StatelessWidget {
  const _SlotShimmer();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: List.generate(
        9,
        (_) =>
            const CustomShimmerLoader(width: 90, height: 40, borderRadius: 12),
      ),
    );
  }
}

class _StaffShimmer extends StatelessWidget {
  const _StaffShimmer();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        CustomShimmerLoader(width: 88, height: 120, borderRadius: 18),
        SizedBox(width: 10),
        CustomShimmerLoader(width: 88, height: 120, borderRadius: 18),
        SizedBox(width: 10),
        CustomShimmerLoader(width: 88, height: 120, borderRadius: 18),
      ],
    );
  }
}
