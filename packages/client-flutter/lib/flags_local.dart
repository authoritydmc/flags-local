import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;

class FeatureFlag {
  final String id;
  final String name;
  final bool enabled;
  final int? percentage;
  final Map<String, dynamic> environments;
  final dynamic value;

  FeatureFlag({
    required this.id,
    required this.name,
    required this.enabled,
    this.percentage,
    required this.environments,
    this.value,
  });

  factory FeatureFlag.fromJson(Map<String, dynamic> json) {
    return FeatureFlag(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      enabled: json['enabled'] as bool? ?? false,
      percentage: json['percentage'] as int?,
      environments: json['environments'] as Map<String, dynamic>? ?? {},
      value: json['value'],
    );
  }
}

class FlagsLocalClient extends ChangeNotifier {
  final String baseUrl;
  final String environment;
  final Map<String, FeatureFlag> _flags = {};

  FlagsLocalClient({
    this.baseUrl = 'http://localhost:4040',
    this.environment = 'development',
  });

  Future<void> fetchFlags() async {
    try {
      final uri = Uri.parse('$baseUrl/api/v1/flags');
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final List<dynamic> list = jsonDecode(res.body);
        _flags.clear();
        for (final item in list) {
          final flag = FeatureFlag.fromJson(item as Map<String, dynamic>);
          _flags[flag.id] = flag;
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  bool isEnabled(String flagId, {String? userKey, bool fallback = false}) {
    final flag = _flags[flagId];
    if (flag == null) return fallback;

    final envVal = flag.environments[environment];
    final isEnvEnabled = envVal is bool ? envVal : flag.enabled;
    if (!isEnvEnabled) return false;

    if (flag.percentage != null) {
      final pct = flag.percentage!;
      if (pct <= 0) return false;
      if (pct >= 100) return true;

      final key = userKey ?? 'anonymous';
      final bytes = utf8.encode('$flagId:$key');
      final digest = sha256.convert(bytes);
      final hashSub = digest.toString().substring(0, 8);
      final val = int.parse(hashSub, radix: 16);
      return (val % 100) < pct;
    }

    return true;
  }
}

class FeatureGate extends StatelessWidget {
  final FlagsLocalClient client;
  final String flag;
  final String? userKey;
  final Widget child;
  final Widget? fallback;

  const FeatureGate({
    Key? key,
    required this.client,
    required this.flag,
    this.userKey,
    required this.child,
    this.fallback,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: client,
      builder: (context, _) {
        final enabled = client.isEnabled(flag, userKey: userKey);
        if (enabled) return child;
        return fallback ?? const SizedBox.shrink();
      },
    );
  }
}
