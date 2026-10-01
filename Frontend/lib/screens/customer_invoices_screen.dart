import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/customer_finance_models.dart';
import '../services/customer_account_repository.dart';
import '../widgets/error_banner_widget.dart';

class CustomerInvoicesController extends ChangeNotifier {
  CustomerInvoicesController(this.repository);
  final CustomerAccountRepository repository;
  List<CustomerInvoice> invoices = const [];
  bool loading = false;
  String? error;
  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      invoices = await repository.fetchInvoices();
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Unable to load invoice history. Please try again.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}

class CustomerInvoicesScreen extends StatelessWidget {
  const CustomerInvoicesScreen({super.key});
  @override
  Widget build(BuildContext context) => ChangeNotifierProvider(
    create: (context) => CustomerInvoicesController(
      CustomerAccountRepository(
        apiClient: context.read<ApiClient>(),
        authRepository: context.read<AuthRepository>(),
      ),
    )..load(),
    child: const _InvoicesView(),
  );
}

class _InvoicesView extends StatelessWidget {
  const _InvoicesView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<CustomerInvoicesController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Invoice history')),
      body: RefreshIndicator(
        onRefresh: c.load,
        child: c.loading
            ? const Center(child: CircularProgressIndicator())
            : c.error != null
            ? ListView(
                children: [
                  ErrorBannerWidget(message: c.error!, onRetry: c.load),
                ],
              )
            : c.invoices.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 260),
                  SalonEmptyState(
                    title: 'No invoices',
                    message:
                        'Invoices from your salon visits will appear here.',
                    icon: Icons.receipt_long_outlined,
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: c.invoices.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _InvoiceTile(invoice: c.invoices[i]),
              ),
      ),
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  const _InvoiceTile({required this.invoice});
  final CustomerInvoice invoice;
  @override
  Widget build(BuildContext context) {
    String money(int minor) => (minor / 100).toStringAsFixed(2);
    return Card(
      child: ExpansionTile(
        title: Text(invoice.invoiceNumber),
        subtitle: Text(
          '${invoice.status} · Total ${money(invoice.totalMinor)}',
        ),
        children: [
          ListTile(
            title: Text('Paid ${money(invoice.paidMinor)}'),
            subtitle: Text('Balance ${money(invoice.balanceMinor)}'),
          ),
          for (final payment in invoice.payments)
            ListTile(
              leading: const Icon(Icons.payments_outlined),
              title: Text('${payment.method} · ${money(payment.amountMinor)}'),
              subtitle: Text(payment.status),
            ),
        ],
      ),
    );
  }
}
