import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/service_model.dart';
import '../theme/salon_theme.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';

class BookingTimeSlot {
  const BookingTimeSlot({
    required this.time,
    this.isAvailable = true,
  });

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

typedef SlotLoader = Future<List<BookingTimeSlot>> Function(DateTime date);
typedef StaffLoader = Future<List<SalonStaff>> Function();

class BookingController extends ChangeNotifier {
  BookingController({
    required this.service,
    SlotLoader? slotLoader,
    StaffLoader? staffLoader,
  })  : _slotLoader = slotLoader ?? _defaultSlotLoader,
        _staffLoader = staffLoader ?? _defaultStaffLoader {
    selectedDate = _dateOnly(DateTime.now());
  }

  final ServiceModel service;
  final SlotLoader _slotLoader;
  final StaffLoader _staffLoader;

  late DateTime selectedDate;
  TimeOfDay? selectedTime;
  SalonStaff? selectedStaff;

  List<BookingTimeSlot> slots = const [];
  List<SalonStaff> staff = const [];
  bool isLoadingSlots = false;
  bool isLoadingStaff = false;
  String? error;

  bool get canContinue =>
      selectedTime != null && selectedStaff != null && !isLoadingSlots;

  Future<void> load() async {
    error = null;
    isLoadingStaff = true;
    notifyListeners();

    try {
      staff = List.unmodifiable(await _staffLoader());
      selectedStaff ??= staff.isNotEmpty ? staff.first : null;
    } catch (e) {
      error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoadingStaff = false;
      notifyListeners();
    }

    await selectDate(selectedDate);
  }

  Future<void> selectDate(DateTime date) async {
    selectedDate = _dateOnly(date);
    selectedTime = null;
    isLoadingSlots = true;
    error = null;
    notifyListeners();

    try {
      slots = List.unmodifiable(await _slotLoader(selectedDate));
    } catch (e) {
      slots = const [];
      error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoadingSlots = false;
      notifyListeners();
    }
  }

  void selectTime(BookingTimeSlot slot) {
    if (!slot.isAvailable) return;
    selectedTime = slot.time;
    notifyListeners();
  }

  void selectStaff(SalonStaff person) {
    selectedStaff = person;
    notifyListeners();
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

  static Future<List<BookingTimeSlot>> _defaultSlotLoader(
      DateTime date) async {
    await Future<void>.delayed(const Duration(milliseconds: 450));
    const times = [
      TimeOfDay(hour: 9, minute: 0),
      TimeOfDay(hour: 9, minute: 30),
      TimeOfDay(hour: 10, minute: 0),
      TimeOfDay(hour: 10, minute: 30),
      TimeOfDay(hour: 11, minute: 0),
      TimeOfDay(hour: 11, minute: 30),
      TimeOfDay(hour: 13, minute: 0),
      TimeOfDay(hour: 13, minute: 30),
      TimeOfDay(hour: 14, minute: 0),
      TimeOfDay(hour: 14, minute: 30),
      TimeOfDay(hour: 15, minute: 0),
      TimeOfDay(hour: 16, minute: 0),
    ];

    final unavailable = date.day % 3 == 0 ? {1, 5, 9} : {3, 8};
    return List.generate(
      times.length,
      (index) => BookingTimeSlot(
        time: times[index],
        isAvailable: !unavailable.contains(index),
      ),
    );
  }

  static Future<List<SalonStaff>> _defaultStaffLoader() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return const [
      SalonStaff(
        id: 'emma',
        name: 'Emma',
        specialty: 'Facials',
        imageUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      ),
      SalonStaff(
        id: 'sarah',
        name: 'Sarah',
        specialty: 'Hair',
        imageUrl:
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      ),
      SalonStaff(
        id: 'mia',
        name: 'Mia',
        specialty: 'Nails',
        imageUrl:
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
      ),
    ];
  }
}

class BookingScreen extends StatelessWidget {
  const BookingScreen({
    super.key,
    required this.service,
    this.loadSlots,
    this.loadStaff,
    this.onConfirmed,
  });

  final ServiceModel service;
  final SlotLoader? loadSlots;
  final StaffLoader? loadStaff;
  final ValueChanged<DateTime>? onConfirmed;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BookingController(
        service: service,
        slotLoader: loadSlots,
        staffLoader: loadStaff,
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
                        icon: const Icon(Icons.arrow_back_ios_new_rounded,
                            size: 18, color: Colors.white),
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
                            child: const Icon(Icons.spa_rounded,
                                size: 60, color: SalonTheme.cocoa),
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
                                    horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(
                                  color: SalonTheme.peach.withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  controller.service.category,
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelSmall
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
                                    label:
                                        controller.service.durationLabel,
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
                    padding:
                        const EdgeInsets.fromLTRB(20, 22, 20, 0),
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
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  gradient: SalonTheme.cocoaGradient,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  controller.selectedTimeLabel,
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelMedium
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
                            onRetry: () => controller
                                .selectDate(controller.selectedDate),
                          )
                        else if (controller.isLoadingSlots)
                          const _SlotShimmer()
                        else if (controller.slots.isEmpty)
                          const SalonEmptyState(
                            title: 'No times available',
                            message:
                                'There are no bookable slots for this date. Try another day.',
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
                )
              ],
            ),
            child: SafeArea(
              minimum: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: GestureDetector(
                onTap: controller.canContinue
                    ? () =>
                        _showConfirmation(context, controller, onConfirmed)
                    : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: controller.canContinue
                        ? SalonTheme.cocoaGradient
                        : const LinearGradient(
                            colors: [Color(0xFFCCBBB0), Color(0xFFCCBBB0)]),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: controller.canContinue
                        ? [
                            BoxShadow(
                              color: SalonTheme.cocoa.withValues(alpha: 0.4),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : [],
                  ),
                  child: Center(
                    child: Text(
                      'Continue to Confirm',
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
      onConfirmed?.call(controller.selectedDateTime);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('🎉 Appointment confirmed successfully.')),
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
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
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
          final selected = date.year == selectedDate.year &&
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
                        )
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
                              : Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${date.day}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: selected
                              ? Colors.white
                              : SalonTheme.deepChocolate,
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
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
          onTap: slot.isAvailable
              ? () => controller.selectTime(slot)
              : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 10),
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
                      )
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
                    fontWeight:
                        selected ? FontWeight.w800 : FontWeight.w600,
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
                gradient:
                    selected ? SalonTheme.cocoaGradient : null,
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
                        )
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
                    style: Theme.of(context)
                        .textTheme
                        .labelMedium
                        ?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: selected
                              ? Colors.white
                              : SalonTheme.deepChocolate,
                        ),
                  ),
                  if (person.specialty.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      person.specialty,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(
                            fontSize: 9.5,
                            color: selected
                                ? Colors.white70
                                : Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
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
                  )
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
                    value:
                        '\$${controller.service.price.toStringAsFixed(0)}',
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
                    )
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
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
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
        (_) => const CustomShimmerLoader(width: 90, height: 40, borderRadius: 12),
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
