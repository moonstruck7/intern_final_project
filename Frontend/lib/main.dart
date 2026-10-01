import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'auth/auth_controller.dart';
import 'auth/auth_repository.dart';
import 'auth/session_store.dart';
import 'screens/login_screen.dart';
import 'screens/service_catalog_screen.dart';
import 'screens/my_appointments_screen.dart';
import 'theme/salon_theme.dart';
import 'widgets/loyalty_card_widget.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LuxeSalonApp());
}

class LuxeSalonApp extends StatelessWidget {
  const LuxeSalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Provider<ApiClient>(
      create: (_) => ApiClient(),
      dispose: (_, apiClient) => apiClient.dispose(),
      child: Provider<AuthRepository>(
        create: (context) => AuthRepository(
          apiClient: context.read<ApiClient>(),
          sessionStore: SecureSessionStore(),
        ),
        child: ChangeNotifierProvider(
          create: (context) =>
              AuthController(context.read<AuthRepository>())..restore(),
          child: MaterialApp(
            title: 'Luxe Salon',
            debugShowCheckedModeBanner: false,
            theme: SalonTheme.light(),
            home: const _AuthGate(),
          ),
        ),
      ),
    );
  }
}

class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    return switch (context.watch<AuthController>().state) {
      AuthState.loading => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      AuthState.authenticated => const SalonHomeShell(),
      AuthState.unauthenticated || AuthState.error => const LoginScreen(),
    };
  }
}

class SalonHomeShell extends StatefulWidget {
  const SalonHomeShell({super.key});

  @override
  State<SalonHomeShell> createState() => _SalonHomeShellState();
}

class _SalonHomeShellState extends State<SalonHomeShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    ServiceCatalogScreen(),
    MyAppointmentsScreen(),
    _InboxScreen(),
    _ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore_rounded),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month_rounded),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Inbox',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// ── INBOX SCREEN ──────────────────────────────────────────────────────────────
class _InboxScreen extends StatelessWidget {
  const _InboxScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox'),
        actions: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.done_all_rounded, size: 16),
            label: const Text('Mark all read'),
            style: TextButton.styleFrom(
              foregroundColor: SalonTheme.cocoa,
              textStyle: Theme.of(context).textTheme.labelMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: const [
          _InboxTile(
            type: _InboxType.appointment,
            title: 'Upcoming appointment',
            message: 'Your Signature Hydrafacial with Emma is on Thu, Sep 5 at 2:30 PM.',
            timeAgo: '2h ago',
            isUnread: true,
          ),
          SizedBox(height: 10),
          _InboxTile(
            type: _InboxType.loyalty,
            title: 'Loyalty reward unlocked 🎁',
            message: 'You\'ve earned 50 points from your last visit. You now have 320 pts!',
            timeAgo: '1d ago',
            isUnread: true,
          ),
          SizedBox(height: 10),
          _InboxTile(
            type: _InboxType.promo,
            title: 'Exclusive offer just for you',
            message:
                '20% off your next Bridal Glow Package. Valid until Sep 15.',
            timeAgo: '3d ago',
            isUnread: false,
          ),
          SizedBox(height: 10),
          _InboxTile(
            type: _InboxType.appointment,
            title: 'Booking confirmed',
            message: 'Your Signature Haircut with Sarah on Aug 22 at 11:00 AM was confirmed.',
            timeAgo: '2w ago',
            isUnread: false,
          ),
        ],
      ),
    );
  }
}

enum _InboxType { appointment, loyalty, promo }

class _InboxTile extends StatelessWidget {
  const _InboxTile({
    required this.type,
    required this.title,
    required this.message,
    required this.timeAgo,
    this.isUnread = false,
  });

  final _InboxType type;
  final String title;
  final String message;
  final String timeAgo;
  final bool isUnread;

  @override
  Widget build(BuildContext context) {
    final (accentColor, bgColor, icon) = switch (type) {
      _InboxType.appointment => (
        SalonTheme.cocoa,
        const Color(0xFFF5E3D9),
        Icons.calendar_month_rounded,
      ),
      _InboxType.loyalty => (
        SalonTheme.goldAccent,
        const Color(0xFFFAF0DC),
        Icons.stars_rounded,
      ),
      _InboxType.promo => (
        SalonTheme.roseDust,
        const Color(0xFFF5E0E4),
        Icons.local_offer_rounded,
      ),
    };

    return Container(
      decoration: BoxDecoration(
        color: isUnread ? Colors.white : const Color(0xFFFBF7F4),
        borderRadius: BorderRadius.circular(18),
        border: Border(left: BorderSide(color: accentColor, width: 4)),
        boxShadow: isUnread
            ? [
                BoxShadow(
                  color: accentColor.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon circle
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
              child: Icon(icon, size: 20, color: accentColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                fontWeight: isUnread
                                    ? FontWeight.w800
                                    : FontWeight.w700,
                              ),
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: SalonTheme.cocoa,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    timeAgo,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: accentColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();

  @override
  Widget build(BuildContext context) {
    final customer = context.watch<AuthController>().customer;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ── Gradient header ──────────────────────────────────
          SliverAppBar(
            expandedHeight: 230,
            pinned: true,
            backgroundColor: SalonTheme.cream,
            actions: [
              IconButton(
                tooltip: 'Edit profile',
                onPressed: () {},
                icon: const Icon(Icons.edit_outlined),
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _ProfileHeader(
                displayName: customer?.displayName ?? 'Customer',
                email: customer?.email ?? '',
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Column(
              children: [
                // ── Loyalty card ─────────────────────────────────
                const Padding(
                  padding: EdgeInsets.only(top: 4),
                  child: LoyaltyCardWidget(
                    points: 320,
                    tier: 'Gold',
                    nextTierPoints: 500,
                    appointmentsCount: 8,
                    totalSpent: 1240,
                  ),
                ),

                const SizedBox(height: 20),

                // ── Settings sections ─────────────────────────────
                _SettingsSection(
                  title: 'Account',
                  tiles: const [
                    _SettingsTile(
                      icon: Icons.person_outline_rounded,
                      iconColor: SalonTheme.cocoa,
                      title: 'Personal Information',
                    ),
                    _SettingsTile(
                      icon: Icons.credit_card_outlined,
                      iconColor: Color(0xFF2D7A4F),
                      title: 'Payment Methods',
                    ),
                    _SettingsTile(
                      icon: Icons.location_on_outlined,
                      iconColor: SalonTheme.roseDust,
                      title: 'Saved Addresses',
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                _SettingsSection(
                  title: 'Preferences',
                  tiles: const [
                    _SettingsTile(
                      icon: Icons.notifications_none_rounded,
                      iconColor: SalonTheme.goldAccent,
                      title: 'Notifications',
                    ),
                    _SettingsTile(
                      icon: Icons.lock_outline_rounded,
                      iconColor: Color(0xFF5C6BC0),
                      title: 'Privacy & Security',
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                _SettingsSection(
                  title: 'Support',
                  tiles: const [
                    _SettingsTile(
                      icon: Icons.help_outline_rounded,
                      iconColor: Color(0xFF0288D1),
                      title: 'Help & FAQ',
                    ),
                    _SettingsTile(
                      icon: Icons.star_border_rounded,
                      iconColor: SalonTheme.goldAccent,
                      title: 'Rate the App',
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // ── Logout ──────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 36),
                  child: OutlinedButton.icon(
                    onPressed: () => context.read<AuthController>().logout(),
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: const Text('Sign out'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      foregroundColor: const Color(0xFF9E2D2D),
                      side: const BorderSide(
                        color: Color(0xFFE8BEBE),
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
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

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.displayName, required this.email});

  final String displayName;
  final String email;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFCF8F4), Color(0xFFF5E8DF)],
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            right: -20,
            top: -30,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SalonTheme.peach.withValues(alpha: 0.12),
              ),
            ),
          ),
          Positioned(
            left: -30,
            bottom: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SalonTheme.roseDust.withValues(alpha: 0.08),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 72, 20, 20),
            child: Row(
              children: [
                // Avatar with gradient ring
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    gradient: SalonTheme.loyaltyGradient,
                    shape: BoxShape.circle,
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const CircleAvatar(
                      radius: 40,
                      backgroundColor: SalonTheme.warmSurface,
                      child: Icon(
                        Icons.person_rounded,
                        size: 40,
                        color: SalonTheme.cocoa,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        displayName,
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: SalonTheme.deepChocolate,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        email,
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: SalonTheme.cocoa),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          gradient: SalonTheme.loyaltyGradient,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.stars_rounded,
                              size: 13,
                              color: SalonTheme.goldAccent,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Gold Member',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: SalonTheme.goldAccent,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
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

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.tiles});

  final String title;
  final List<_SettingsTile> tiles;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title.toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                fontSize: 11,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: const Border.fromBorderSide(
                BorderSide(color: Color(0xFFF0E5DD), width: 1),
              ),
            ),
            child: Column(
              children: [
                for (int i = 0; i < tiles.length; i++) ...[
                  tiles[i],
                  if (i < tiles.length - 1)
                    const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 0,
                      color: Color(0xFFF0E5DD),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.title,
  }) : trailing = null;

  final IconData icon;
  final Color iconColor;
  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: iconColor),
      ),
      title: Text(
        title,
        style: Theme.of(context).textTheme.bodyMedium
            ?.copyWith(fontWeight: FontWeight.w700),
      ),
      trailing:
          trailing ??
          Icon(
            Icons.chevron_right_rounded,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: 20,
          ),
      onTap: () {},
    );
  }
}
