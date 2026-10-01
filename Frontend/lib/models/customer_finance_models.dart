// ignore_for_file: curly_braces_in_flow_control_structures

class CustomerPayment {
  const CustomerPayment({
    required this.id,
    required this.amountMinor,
    required this.method,
    required this.status,
    required this.createdAt,
  });
  final String id;
  final int amountMinor;
  final String method;
  final String status;
  final DateTime? createdAt;
  factory CustomerPayment.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final amount = json['amountMinor'];
    if (id == null || id.isEmpty || amount is! num || amount < 1)
      throw const FormatException();
    return CustomerPayment(
      id: id,
      amountMinor: amount.toInt(),
      method: json['method']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}

class CustomerInvoice {
  const CustomerInvoice({
    required this.id,
    required this.invoiceNumber,
    required this.totalMinor,
    required this.status,
    required this.createdAt,
    required this.payments,
  });
  final String id;
  final String invoiceNumber;
  final int totalMinor;
  final String status;
  final DateTime? createdAt;
  final List<CustomerPayment> payments;
  int get paidMinor =>
      payments.fold(0, (sum, payment) => sum + payment.amountMinor);
  int get balanceMinor => totalMinor - paidMinor;
  factory CustomerInvoice.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final number = json['invoiceNumber']?.toString().trim();
    final total = json['totalMinor'];
    final rawPayments = json['payments'];
    if (id == null ||
        id.isEmpty ||
        number == null ||
        number.isEmpty ||
        total is! num ||
        total < 0 ||
        rawPayments is! List)
      throw const FormatException();
    return CustomerInvoice(
      id: id,
      invoiceNumber: number,
      totalMinor: total.toInt(),
      status: json['status']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      payments: List.unmodifiable(
        rawPayments.map((item) {
          if (item is! Map) throw const FormatException();
          return CustomerPayment.fromJson(item.cast<String, dynamic>());
        }),
      ),
    );
  }
}

class CustomerNotification {
  const CustomerNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.readAt,
    required this.createdAt,
  });
  final String id;
  final String title;
  final String body;
  final DateTime? readAt;
  final DateTime? createdAt;
  bool get isUnread => readAt == null;
  CustomerNotification copyWithReadAt(DateTime readAt) => CustomerNotification(
    id: id,
    title: title,
    body: body,
    readAt: readAt,
    createdAt: createdAt,
  );
  factory CustomerNotification.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'])?.toString().trim();
    final title = json['title']?.toString().trim();
    final body = json['body']?.toString().trim();
    if (id == null ||
        id.isEmpty ||
        title == null ||
        title.isEmpty ||
        body == null ||
        body.isEmpty)
      throw const FormatException();
    return CustomerNotification(
      id: id,
      title: title,
      body: body,
      readAt: DateTime.tryParse(json['readAt']?.toString() ?? ''),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}
