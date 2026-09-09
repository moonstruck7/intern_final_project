import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SalonTheme {
  SalonTheme._();

  // ── Brand palette ──────────────────────────────────────────────
  static const Color cocoa = Color(0xFF6B3F2A);
  static const Color cocoaLight = Color(0xFF8B5E48);
  static const Color peach = Color(0xFFE9A87C);
  static const Color peachLight = Color(0xFFF5C9A8);
  static const Color cream = Color(0xFFFCF8F4);
  static const Color warmSurface = Color(0xFFF5EDE5);
  static const Color roseDust = Color(0xFFB5697A);
  static const Color roseLight = Color(0xFFF2D5DB);
  static const Color deepChocolate = Color(0xFF2C1810);
  static const Color goldAccent = Color(0xFFD4A843);

  // ── Gradient helpers ───────────────────────────────────────────
  static const LinearGradient cocoaGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [cocoa, cocoaLight],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xE0200E06)],
    stops: [0.3, 1.0],
  );

  static const LinearGradient loyaltyGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7B4A30), Color(0xFFA0634A)],
  );

  static const LinearGradient roseGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [roseDust, Color(0xFFCB8090)],
  );

  // ── Full ThemeData ─────────────────────────────────────────────
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: cocoa,
      brightness: Brightness.light,
    ).copyWith(
      primary: cocoa,
      onPrimary: Colors.white,
      secondary: peach,
      onSecondary: Colors.white,
      tertiary: roseDust,
      onTertiary: Colors.white,
      surface: cream,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: warmSurface,
      surfaceContainer: const Color(0xFFEEE0D8),
      primaryContainer: const Color(0xFFF5E3D9),
      onPrimaryContainer: deepChocolate,
      secondaryContainer: const Color(0xFFF9E4D4),
      onSecondaryContainer: const Color(0xFF3B2119),
      tertiaryContainer: roseLight,
      onTertiaryContainer: const Color(0xFF3D1520),
    );

    final baseText = GoogleFonts.nunitoTextTheme().copyWith(
      displayLarge: GoogleFonts.playfairDisplay(
          fontSize: 57, fontWeight: FontWeight.w700, color: deepChocolate),
      displayMedium: GoogleFonts.playfairDisplay(
          fontSize: 45, fontWeight: FontWeight.w700, color: deepChocolate),
      displaySmall: GoogleFonts.playfairDisplay(
          fontSize: 36, fontWeight: FontWeight.w600, color: deepChocolate),
      headlineLarge: GoogleFonts.playfairDisplay(
          fontSize: 32, fontWeight: FontWeight.w700, color: deepChocolate),
      headlineMedium: GoogleFonts.playfairDisplay(
          fontSize: 28, fontWeight: FontWeight.w600, color: deepChocolate),
      headlineSmall: GoogleFonts.nunito(
          fontSize: 24, fontWeight: FontWeight.w800, color: deepChocolate),
      titleLarge: GoogleFonts.nunito(
          fontSize: 22, fontWeight: FontWeight.w800, color: deepChocolate),
      titleMedium: GoogleFonts.nunito(
          fontSize: 16, fontWeight: FontWeight.w700, color: deepChocolate),
      titleSmall: GoogleFonts.nunito(
          fontSize: 14, fontWeight: FontWeight.w700, color: deepChocolate),
      bodyLarge: GoogleFonts.nunito(
          fontSize: 16, fontWeight: FontWeight.w500, color: deepChocolate),
      bodyMedium: GoogleFonts.nunito(
          fontSize: 14, fontWeight: FontWeight.w500, color: deepChocolate),
      bodySmall: GoogleFonts.nunito(
          fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF6B5043)),
      labelLarge: GoogleFonts.nunito(
          fontSize: 14, fontWeight: FontWeight.w700, color: deepChocolate),
      labelMedium: GoogleFonts.nunito(
          fontSize: 12, fontWeight: FontWeight.w600, color: deepChocolate),
      labelSmall: GoogleFonts.nunito(
          fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B5043)),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: baseText,
      scaffoldBackgroundColor: cream,
      appBarTheme: AppBarTheme(
        backgroundColor: cream,
        foregroundColor: deepChocolate,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        shadowColor: Colors.black12,
        centerTitle: false,
        titleTextStyle: GoogleFonts.nunito(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: deepChocolate,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        shadowColor: Colors.black12,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: warmSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: cocoa, width: 1.5),
        ),
        hintStyle: GoogleFonts.nunito(
          color: const Color(0xFFAA8878),
          fontSize: 14,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: cocoa,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 52),
          textStyle: GoogleFonts.nunito(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: cocoa,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: cocoa, width: 1.5),
          textStyle: GoogleFonts.nunito(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        labelStyle: GoogleFonts.nunito(
          fontWeight: FontWeight.w700,
          fontSize: 13,
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelStyle: GoogleFonts.nunito(
          fontWeight: FontWeight.w800,
          fontSize: 14,
        ),
        unselectedLabelStyle: GoogleFonts.nunito(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        labelColor: cocoa,
        unselectedLabelColor: const Color(0xFFAA8878),
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFF5E3D9),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.nunito(
            fontSize: 11,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            color: selected ? cocoa : const Color(0xFFAA8878),
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? cocoa : const Color(0xFFAA8878),
            size: 24,
          );
        }),
        elevation: 8,
        shadowColor: Colors.black12,
        surfaceTintColor: Colors.transparent,
      ),
      dividerTheme: const DividerThemeData(
        space: 1,
        thickness: 0.5,
        color: Color(0xFFEBDDD5),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: deepChocolate,
        contentTextStyle: GoogleFonts.nunito(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
