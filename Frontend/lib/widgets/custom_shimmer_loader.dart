import 'package:flutter/material.dart';

class CustomShimmerLoader extends StatefulWidget {
  const CustomShimmerLoader({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 12,
  });

  final double? width;
  final double? height;
  final double borderRadius;

  @override
  State<CustomShimmerLoader> createState() => _CustomShimmerLoaderState();
}

class _CustomShimmerLoaderState extends State<CustomShimmerLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = (_controller.value * 2) - 0.5;
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment(-1.0 + t, 0),
              end: Alignment(1.0 + t, 0),
              colors: [
                scheme.surfaceContainerHighest,
                scheme.surface,
                scheme.surfaceContainerHighest,
              ],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcATop,
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(widget.borderRadius),
            ),
          ),
        );
      },
    );
  }
}

class ServiceCardShimmer extends StatelessWidget {
  const ServiceCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: const [
            CustomShimmerLoader(width: 92, height: 92, borderRadius: 12),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CustomShimmerLoader(width: 120, height: 15),
                  SizedBox(height: 10),
                  CustomShimmerLoader(width: double.infinity, height: 11),
                  SizedBox(height: 7),
                  CustomShimmerLoader(width: 170, height: 11),
                  SizedBox(height: 16),
                  CustomShimmerLoader(width: 90, height: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AppointmentCardShimmer extends StatelessWidget {
  const AppointmentCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            CustomShimmerLoader(width: 90, height: 18),
            SizedBox(height: 14),
            CustomShimmerLoader(width: double.infinity, height: 22),
            SizedBox(height: 9),
            CustomShimmerLoader(width: 180, height: 12),
            SizedBox(height: 18),
            CustomShimmerLoader(width: double.infinity, height: 44),
          ],
        ),
      ),
    );
  }
}
