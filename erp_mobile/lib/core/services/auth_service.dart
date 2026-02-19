import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _api = apiService;

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post(kLoginEndpoint, {
      'email': email,
      'password': password,
    });

    // Save token and user
    final token = response['token'] ?? response['accessToken'];
    final userData = response['user'] ?? response;

    if (token != null) {
      await StorageService.saveToken(token.toString());
    }
    if (userData != null) {
      await StorageService.saveUser(Map<String, dynamic>.from(userData));
    }

    return response;
  }

  Future<void> logout() async {
    try {
      await _api.post(kLogoutEndpoint, {});
    } catch (_) {
      // Ignore logout API errors, always clear local storage
    } finally {
      await StorageService.clearAll();
    }
  }

  Future<User?> getProfile() async {
    try {
      final response = await _api.get(kProfileEndpoint);
      final userData = response['user'] ?? response;
      return User.fromJson(Map<String, dynamic>.from(userData));
    } catch (_) {
      return null;
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await StorageService.getToken();
    return token != null && token.isNotEmpty;
  }

  Future<User?> getCachedUser() async {
    final userData = await StorageService.getUser();
    if (userData == null) return null;
    return User.fromJson(userData);
  }
}
