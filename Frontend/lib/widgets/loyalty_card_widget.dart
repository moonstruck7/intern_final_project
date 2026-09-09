import 'package:flutter/material.dart';
import '../theme/salon_theme.dart';

/// A reusable gradient loyalty / membership card.
class LoyaltyCardWidget extends StatelessWidget {
  const LoyaltyCardWidget({
    super.key,
    required this.points,
    required this.tier,
    required this.nextTierPoints,
    this.appointmentsCount = 0,
    this.totalSpent = 0,
  });

  final int points;
  final String tier;
  final int nextTierPoints;
  final int appointmentsCount;
  final double totalSpent;

  @override
  Widget build(BuildContext context) {
    final progress = (points / nextTierPoints).clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 4, 20, 4),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: SalonTheme.loyaltyGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: SalonTheme.cocoa.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ─────────────────────────────────────────
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: SalonTheme.goldAccent.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: SalonTheme.goldAccent.withValues(alpha: 0.6),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.stars_rounded,
                        size: 13, color: SalonTheme.goldAccent),
                    const SizedBox(width: 4),
                    Text(
                      '$tier Member',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: SalonTheme.goldAccent,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              const Icon(Icons.spa_rounded,
                  color: Colors.white38, size: 22),
            ],
          ),

          const SizedBox(height: 14),

          // ── Points ─────────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$points',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      height: 1,
                    ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  'pts',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 4),
          Text(
            'Loyalty Points',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white60,
                ),
          ),

          const SizedBox(height: 14),

          // ── Progress bar ───────────────────────────────────────
          ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white24,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(SalonTheme.goldAccent),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${nextTierPoints - points} pts to next tier',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white60,
                ),
          ),

          const SizedBox(height: 16),

          // ── Stats row ──────────────────────────────────────────
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: 'Visits',
                  value: '$appointmentsCount',
                  icon: Icons.calendar_month_rounded,
                ),
                Container(
                    width: 1, height: 30, color: Colors.white24),
                _StatItem(
                  label: 'Spent',
                  value: '\$${totalSpent.toStringAsFixed(0)}',
                  icon: Icons.payments_outlined,
                ),
                Container(
                    width: 1, height: 30, color: Colors.white24),
                _StatItem(
                  label: 'Points',
                  value: '$points',
                  icon: Icons.stars_rounded,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 16),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white54,
                fontSize: 10,
              ),
        ),
      ],
    );
  }
}
