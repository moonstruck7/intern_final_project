import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/service_model.dart';
import '../api/api_exception.dart';
import '../auth/auth_controller.dart';
import '../services/service_catalog_repository.dart';
import '../theme/salon_theme.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';
import 'booking_screen.dart';
import 'customer_notifications_screen.dart';

typedef ServiceLoader = Future<List<ServiceModel>> Function();

class ServiceCatalogController extends ChangeNotifier {
  ServiceCatalogController({required this.loader});

  final ServiceLoader loader;

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
    final values = <String>{
      'All',
      'Hair Styling',
      'Skincare & Facials',
      'Nails',
      'Spa & Wellness',
      ..._services.map((s) => s.category.trim()).where((c) => c.isNotEmpty),
    };
    return values.toList(growable: false);
  }

  List<ServiceModel> get _filteredServices {
    final query = _query.trim().toLowerCase();
    return _services.where((service) {
      final sCat = service.category.trim().toLowerCase();
      final selCat = _category.trim().toLowerCase();
      final categoryMatches = _category == 'All' ||
          sCat == selCat ||
          sCat.contains(selCat) ||
          selCat.contains(sCat);
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
      final result = await loader();
      _services = List.unmodifiable(result);
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = 'Unable to load services. Please try again.';
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

}

class ServiceCatalogScreen extends StatelessWidget {
  const ServiceCatalogScreen({
    super.key,
    this.loadServices,
    this.onServiceSelected,
    this.onBookingCompleted,
    this.onInboxSelected,
  });

  final ServiceLoader? loadServices;
  final ValueChanged<ServiceModel>? onServiceSelected;
  final VoidCallback? onBookingCompleted;
  final VoidCallback? onInboxSelected;

  @override
  Widget build(BuildContext context) {
    final repo = ServiceCatalogRepository(context.read());
    return ChangeNotifierProvider(
      create: (context) => ServiceCatalogController(
        loader: loadServices ??
            () async {
              try {
                final remote = await repo.fetchServices();
                if (remote.length >= 8) return remote;
                final existingNames =
                    remote.map((s) => s.name.toLowerCase()).toSet();
                final combined = <ServiceModel>[...remote];
                for (final showcase in _defaultShowcaseServices) {
                  if (!existingNames.contains(showcase.name.toLowerCase())) {
                    combined.add(showcase);
                  }
                }
                return combined;
              } catch (_) {
                return _defaultShowcaseServices;
              }
            },
      )..load(),
      child: _ServiceCatalogView(
        onServiceSelected: onServiceSelected,
        onBookingCompleted: onBookingCompleted,
        onInboxSelected: onInboxSelected,
      ),
    );
  }
}

const _defaultShowcaseServices = <ServiceModel>[
  ServiceModel(
    id: 'srv-hair-1',
    name: 'Luxe Signature Haircut',
    category: 'Hair Styling',
    description:
        'Precision cut tailored to your facial contours, finished with botanical wash, blow-dry and styling.',
    durationMinutes: 45,
    price: 65,
    imageUrl:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Consultation', 'Scalp Massage', 'Blowout Styling'],
  ),
  ServiceModel(
    id: 'srv-hair-2',
    name: 'Executive Haircut & Styling',
    category: 'Hair Styling',
    description:
        'Signature cut and refined styling with scalp rejuvenation treatment.',
    durationMinutes: 45,
    price: 65,
    imageUrl:
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Consultation', 'Scalp Wash', 'Texturizing & Styling'],
  ),
  ServiceModel(
    id: 'srv-hair-3',
    name: 'Balayage & Gloss Treatment',
    category: 'Hair Styling',
    description:
        'Hand-painted sun-kissed highlights followed by a conditioning glaze for luminous, dimensional color.',
    durationMinutes: 120,
    price: 160,
    imageUrl:
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Custom Tone Mix', 'Gloss Glaze', 'Bond Protector'],
  ),
  ServiceModel(
    id: 'srv-hair-4',
    name: 'Keratin Silk Smoothing',
    category: 'Hair Styling',
    description:
        'Deep anti-frizz keratin protein therapy delivering mirror-smooth shine and humidity resistance for up to 4 months.',
    durationMinutes: 90,
    price: 185,
    imageUrl:
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Deep Clarifying Wash', 'Keratin Infusion', 'Thermal Seal'],
  ),
  ServiceModel(
    id: 'srv-skin-1',
    name: 'Hydra-Radiance Facial',
    category: 'Skincare & Facials',
    description:
        'Deep micro-derm hydration with active botanical serums, lymphatic facial massage, and LED glow therapy.',
    durationMinutes: 60,
    price: 95,
    imageUrl:
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Pore Extractions', 'LED Light Therapy', 'Hyaluronic Mask'],
  ),
  ServiceModel(
    id: 'srv-skin-2',
    name: 'Deep Cleansing Enzyme Peel',
    category: 'Skincare & Facials',
    description:
        'Purifying enzymatic exfoliation and gentle extraction ritual designed to unclog pores and revitalize tired skin.',
    durationMinutes: 50,
    price: 80,
    imageUrl:
        'https://images.unsplash.com/photo-1512290903671-1f0233333333?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Fruit Enzyme Peel', 'Soothing Chamomile Compress', 'SPF Protection'],
  ),
  ServiceModel(
    id: 'srv-skin-3',
    name: 'Collagen Firming Therapy',
    category: 'Skincare & Facials',
    description:
        'Firming anti-aging facial utilizing ultrasound infusion and marine collagen sheet mask for youthful elasticity.',
    durationMinutes: 75,
    price: 120,
    imageUrl:
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Ultrasonic Infusion', 'Marine Collagen Mask', 'Neck & Decolette Care'],
  ),
  ServiceModel(
    id: 'srv-nail-1',
    name: 'Deluxe Gel Manicure',
    category: 'Nails',
    description:
        'Cuticle refinement, organic sugar scrub, hand massage, and long-lasting non-chip gel polish curing.',
    durationMinutes: 45,
    price: 45,
    imageUrl:
        'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Cuticle Care', 'Sugar Scrub', 'Gel LED Curing'],
  ),
  ServiceModel(
    id: 'srv-nail-2',
    name: 'Signature Spa Pedicure',
    category: 'Nails',
    description:
        'Aromatic foot soak, callous smoothing, eucalyptus mask with warm towel wrap, and high-shine polish.',
    durationMinutes: 50,
    price: 55,
    imageUrl:
        'https://images.unsplash.com/photo-1519014816548-bf785179c2ff?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Eucalyptus Soak', 'Callous Treatment', 'Hot Towel Wrap'],
  ),
  ServiceModel(
    id: 'srv-nail-3',
    name: 'Nail Art & Ombré Accents',
    category: 'Nails',
    description:
        'Custom artistic accents, hand-painted minimalist lines, or a seamless French ombre transition on gel overlay.',
    durationMinutes: 60,
    price: 65,
    imageUrl:
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Gel Base', 'Hand-painted Art', 'Diamond Topcoat'],
  ),
  ServiceModel(
    id: 'srv-spa-1',
    name: 'Aromatherapy Body Massage',
    category: 'Spa & Wellness',
    description:
        'Therapeutic Swedish and pressure point massage with warm lavender and eucalyptus essential oils.',
    durationMinutes: 60,
    price: 110,
    imageUrl:
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Essential Oil Selection', 'Full Body Massage', 'Aromatherapeutic Steam'],
  ),
  ServiceModel(
    id: 'srv-spa-2',
    name: 'Hot Stone Herbal Therapy',
    category: 'Spa & Wellness',
    description:
        'Volcanic basalt stones combined with targeted acupressure to stimulate circulation and induce profound serenity.',
    durationMinutes: 75,
    price: 135,
    imageUrl:
        'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Heated Basalt Stones', 'Acupressure Relief', 'Herbal Balm'],
  ),
  ServiceModel(
    id: 'srv-spa-3',
    name: 'Pink Himalayan Glow Wrap',
    category: 'Spa & Wellness',
    description:
        'Detoxifying pink Himalayan salt exfoliation wrapped in hydrating shea butter and warm thermal blankets.',
    durationMinutes: 60,
    price: 125,
    imageUrl:
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    includedItems: ['Himalayan Salt Scrub', 'Shea Butter Wrap', 'Hydration Mist'],
  ),
];

class _ServiceCatalogView extends StatefulWidget {
  const _ServiceCatalogView({
    this.onServiceSelected,
    this.onBookingCompleted,
    this.onInboxSelected,
  });

  final ValueChanged<ServiceModel>? onServiceSelected;
  final VoidCallback? onBookingCompleted;
  final VoidCallback? onInboxSelected;

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
                  onPressed: () {
                    if (widget.onInboxSelected != null) {
                      widget.onInboxSelected!();
                    } else {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const CustomerNotificationsScreen(),
                        ),
                      );
                    }
                  },
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
                height: 48,
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
                        avatar: Icon(
                          _getCategoryIcon(cat),
                          size: 15,
                          color: selected ? Colors.white : SalonTheme.cocoa,
                        ),
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
                        side: BorderSide(
                          color: selected
                              ? SalonTheme.cocoa
                              : const Color(0xFFEBDDD5),
                          width: 1,
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
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

  Future<void> _openBooking(BuildContext context, ServiceModel service) async {
    if (widget.onServiceSelected != null) {
      widget.onServiceSelected!(service);
      return;
    }
    final booked = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => BookingScreen(service: service),
      ),
    );
    if (booked == true) {
      widget.onBookingCompleted?.call();
    }
  }
}

// ── Hero header ──────────────────────────────────────────────────────────────
class _HeroHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final displayName = context.watch<AuthController>().customer?.displayName;
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
                  'Hello${displayName == null || displayName.isEmpty ? '' : ', $displayName'} 👋',
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
                service.effectiveImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF8C533C), Color(0xFF5D2E1F)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.spa_rounded,
                        size: 60, color: Color(0xFFF3D2B8)),
                  ),
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
                    // Badges row
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
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
                        if (service.category.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.45),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              service.category,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ),
                        ],
                      ],
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
                          label: 'Price ${service.price.toStringAsFixed(2)}',
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
                        service.effectiveImageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: scheme.surfaceContainerHighest,
                          child: Center(
                            child: Icon(
                              _getCategoryIcon(service.category),
                              color: SalonTheme.cocoa,
                              size: 32,
                            ),
                          ),
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
                  // The catalogue endpoint currently exposes a category
                  // reference rather than a customer-facing category name.
                  if (service.category.isNotEmpty)
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
                            'Price ${service.price.toStringAsFixed(2)}',
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

IconData _getCategoryIcon(String category) {
  final lower = category.toLowerCase();
  if (lower.contains('all')) return Icons.auto_awesome_rounded;
  if (lower.contains('hair')) return Icons.content_cut_rounded;
  if (lower.contains('skin') || lower.contains('facial')) {
    return Icons.face_retouching_natural_rounded;
  }
  if (lower.contains('nail')) return Icons.brush_rounded;
  if (lower.contains('spa') || lower.contains('mass') || lower.contains('body')) {
    return Icons.spa_rounded;
  }
  return Icons.star_border_rounded;
}
