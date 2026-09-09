import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/service_model.dart';
import '../theme/salon_theme.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';
import 'booking_screen.dart';

typedef ServiceLoader = Future<List<ServiceModel>> Function();

class ServiceCatalogController extends ChangeNotifier {
  ServiceCatalogController({ServiceLoader? loader})
      : _loader = loader ?? _defaultLoader;

  final ServiceLoader _loader;

  List<ServiceModel> _services = const [];
  bool _isLoading = false;
  String? _error;
  String _query = '';
  String _category = 'All';

  List<ServiceModel> get services => _filteredServices;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get category => _category;

  List<String> get categories {
    final values = <String>{'All', ..._services.map((s) => s.category)};
    return values.toList(growable: false);
  }

  List<ServiceModel> get _filteredServices {
    final query = _query.trim().toLowerCase();
    return _services.where((service) {
      final categoryMatches =
          _category == 'All' || service.category == _category;
      final queryMatches = query.isEmpty ||
          service.name.toLowerCase().contains(query) ||
          service.description.toLowerCase().contains(query);
      return categoryMatches && queryMatches;
    }).toList(growable: false);
  }

  Future<void> load() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _loader();
      _services = List.unmodifiable(result);
    } catch (error) {
      _error = error.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setQuery(String value) {
    _query = value;
    notifyListeners();
  }

  void setCategory(String value) {
    _category = value;
    notifyListeners();
  }

  static Future<List<ServiceModel>> _defaultLoader() async {
    await Future<void>.delayed(const Duration(milliseconds: 650));
    return const [
      ServiceModel(
        id: 'hydr-01',
        name: 'Signature Hydrafacial',
        category: 'Facial',
        description:
            'Deep cleansing, exfoliation, extraction and hydration for a refreshed complexion.',
        durationMinutes: 45,
        price: 185,
        imageUrl:
            'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=85',
        featured: true,
        includedItems: [
          'Deep Cleansing',
          'Gentle Extraction',
          'Custom Serum',
          'LED Light Therapy',
        ],
      ),
      ServiceModel(
        id: 'hair-01',
        name: 'Signature Haircut',
        category: 'Hair',
        description:
            'Personalised cut and styling session with a Luxe Salon specialist.',
        durationMinutes: 60,
        price: 85,
        imageUrl:
            'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=85',
        featured: true,
      ),
      ServiceModel(
        id: 'nail-01',
        name: 'Gel Manicure',
        category: 'Nails',
        description:
            'Shape, cuticle care and long-lasting gel colour with a glossy finish.',
        durationMinutes: 50,
        price: 70,
        imageUrl:
            'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85',
      ),
      ServiceModel(
        id: 'skin-01',
        name: 'Bridal Glow Package',
        category: 'Skincare',
        description:
            'A complete pre-event glow ritual designed around your skin goals.',
        durationMinutes: 90,
        price: 240,
        imageUrl:
            'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=85',
      ),
    ];
  }
}

class ServiceCatalogScreen extends StatelessWidget {
  const ServiceCatalogScreen({
    super.key,
    this.loadServices,
    this.onServiceSelected,
  });

  final ServiceLoader? loadServices;
  final ValueChanged<ServiceModel>? onServiceSelected;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ServiceCatalogController(loader: loadServices)..load(),
      child: _ServiceCatalogView(onServiceSelected: onServiceSelected),
    );
  }
}

class _ServiceCatalogView extends StatefulWidget {
  const _ServiceCatalogView({this.onServiceSelected});

  final ValueChanged<ServiceModel>? onServiceSelected;

  @override
  State<_ServiceCatalogView> createState() => _ServiceCatalogViewState();
}

class _ServiceCatalogViewState extends State<_ServiceCatalogView> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<ServiceCatalogController>();

    return Scaffold(
      body: RefreshIndicator(
        color: SalonTheme.cocoa,
        onRefresh: controller.load,
        child: CustomScrollView(
          slivers: [
            // ── Gradient App Bar ──────────────────────────────────
            SliverAppBar(
              expandedHeight: 160,
              pinned: true,
              backgroundColor: SalonTheme.cream,
              scrolledUnderElevation: 0.5,
              shadowColor: Colors.black12,
              titleSpacing: 20,
              title: Text(
                'Luxe Salon',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: SalonTheme.deepChocolate,
                ),
              ),
              actions: [
                IconButton(
                  tooltip: 'Notifications',
                  onPressed: () {},
                  icon: const Icon(Icons.notifications_none_rounded),
                  color: SalonTheme.deepChocolate,
                ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: _HeroHeader(),
              ),
            ),

            // ── Search bar ────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
                child: SearchBar(
                  controller: _searchController,
                  hintText: 'Search services, styles…',
                  leading: const Icon(Icons.search_rounded,
                      color: SalonTheme.cocoa),
                  trailing: [
                    if (_searchController.text.isNotEmpty)
                      IconButton(
                        onPressed: () {
                          _searchController.clear();
                          controller.setQuery('');
                          setState(() {});
                        },
                        icon: const Icon(Icons.clear_rounded),
                      ),
                  ],
                  onChanged: (value) {
                    controller.setQuery(value);
                    setState(() {});
                  },
                  elevation: const WidgetStatePropertyAll(0),
                  backgroundColor:
                      WidgetStatePropertyAll(SalonTheme.warmSurface),
                  padding: const WidgetStatePropertyAll(
                      EdgeInsets.symmetric(horizontal: 14)),
                  shape: WidgetStatePropertyAll(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                      side: const BorderSide(
                          color: Color(0xFFEBDDD5), width: 1),
                    ),
                  ),
                ),
              ),
            ),

            // ── Error ─────────────────────────────────────────────
            if (controller.error != null)
              SliverToBoxAdapter(
                child: ErrorBannerWidget(
                  message: controller.error!,
                  onRetry: controller.load,
                ),
              ),

            // ── Category chips ────────────────────────────────────
            SliverToBoxAdapter(
              child: SizedBox(
                height: 46,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: controller.categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = controller.categories[index];
                    final selected = controller.category == cat;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      child: FilterChip(
                        label: Text(cat),
                        selected: selected,
                        onSelected: (_) => controller.setCategory(cat),
                        showCheckmark: false,
                        backgroundColor: SalonTheme.warmSurface,
                        selectedColor: SalonTheme.cocoa,
                        labelStyle:
                            Theme.of(context).textTheme.labelMedium?.copyWith(
                                  color: selected
                                      ? Colors.white
                                      : SalonTheme.deepChocolate,
                                  fontWeight: FontWeight.w700,
                                ),
                        side: BorderSide.none,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 6),
                      ),
                    );
                  },
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 8)),

            // ── Service list ──────────────────────────────────────
            if (controller.isLoading)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                sliver: SliverList.builder(
                  itemCount: 4,
                  itemBuilder: (_, _) => const Padding(
                    padding: EdgeInsets.only(bottom: 14),
                    child: ServiceCardShimmer(),
                  ),
                ),
              )
            else if (controller.services.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: SalonEmptyState(
                  title: 'No services found',
                  message:
                      'Try another search term or choose a different category.',
                  icon: Icons.search_off_rounded,
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                sliver: SliverList.builder(
                  itemCount: controller.services.length,
                  itemBuilder: (context, index) {
                    final service = controller.services[index];
                    final isFeatured = service.featured && index == 0;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: isFeatured
                          ? _FeaturedServiceCard(
                              service: service,
                              onTap: () => _openBooking(context, service),
                            )
                          : _ServiceCard(
                              service: service,
                              onTap: () => _openBooking(context, service),
                            ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _openBooking(BuildContext context, ServiceModel service) {
    if (widget.onServiceSelected != null) {
      widget.onServiceSelected!(service);
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BookingScreen(service: service),
      ),
    );
  }
}

// ── Hero header ──────────────────────────────────────────────────────────────
class _HeroHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFCF8F4), Color(0xFFF5EDE5)],
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            right: -30,
            top: -20,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SalonTheme.peach.withValues(alpha: 0.15),
              ),
            ),
          ),
          Positioned(
            right: 60,
            bottom: 10,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SalonTheme.roseDust.withValues(alpha: 0.10),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Hello, Shreya 👋',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: SalonTheme.cocoa,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Find your glow',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: SalonTheme.deepChocolate,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Featured hero card (first featured service) ───────────────────────────────
class _FeaturedServiceCard extends StatelessWidget {
  const _FeaturedServiceCard({
    required this.service,
    required this.onTap,
  });

  final ServiceModel service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 220,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: SalonTheme.cocoa.withValues(alpha: 0.18),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image
              Image.network(
                service.imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  color: SalonTheme.warmSurface,
                  child: const Icon(Icons.spa_rounded,
                      size: 60, color: SalonTheme.cocoa),
                ),
              ),
              // Gradient overlay
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: SalonTheme.heroGradient,
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Featured badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: SalonTheme.peach.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.auto_awesome_rounded,
                              size: 12, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            'FEATURED',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    // Service name
                    Text(
                      service.name,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _InfoPill(
                          icon: Icons.schedule_rounded,
                          label: service.durationLabel,
                        ),
                        const SizedBox(width: 8),
                        _InfoPill(
                          icon: Icons.payments_outlined,
                          label: '\$${service.price.toStringAsFixed(0)}',
                        ),
                        const Spacer(),
                        // CTA button
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            'Book →',
                            style: Theme.of(context)
                                .textTheme
                                .labelMedium
                                ?.copyWith(
                                  color: SalonTheme.cocoa,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
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
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.22),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
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

// ── Regular service card ──────────────────────────────────────────────────────
class _ServiceCard extends StatelessWidget {
  const _ServiceCard({
    required this.service,
    required this.onTap,
  });

  final ServiceModel service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFF0E5DD), width: 1),
      ),
      child: InkWell(
        onTap: onTap,
        splashColor: SalonTheme.peach.withValues(alpha: 0.12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Image with category chip overlay
              Stack(
                children: [
                  SizedBox(
                    width: 105,
                    height: 105,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(15),
                      child: Image.network(
                        service.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: scheme.surfaceContainerHighest,
                          child: const Icon(Icons.spa_rounded,
                              color: SalonTheme.cocoa),
                        ),
                        loadingBuilder: (context, child, progress) =>
                            progress == null
                                ? child
                                : const CustomShimmerLoader(
                                    width: 105,
                                    height: 105,
                                    borderRadius: 15,
                                  ),
                      ),
                    ),
                  ),
                  // Category chip
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        service.category,
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      service.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                            height: 1.4,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Icon(Icons.schedule_rounded,
                            size: 14,
                            color: scheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          service.durationLabel,
                          style:
                              Theme.of(context).textTheme.labelMedium?.copyWith(
                                    color: scheme.onSurfaceVariant,
                                  ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            gradient: SalonTheme.cocoaGradient,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '\$${service.price.toStringAsFixed(0)}',
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
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
