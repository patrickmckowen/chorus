import ExpoModulesCore
import MusicKit

final class DeveloperTokenEmptyException: GenericException<Void> {
  override var reason: String {
    "Developer token is empty."
  }
}

final class MusicKitNotAvailableException: GenericException<Void> {
  override var reason: String {
    "MusicKit is not available on this device. Use a real iOS 15+ device."
  }
}

public class AppleMusicAuthModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleMusicAuth")

    AsyncFunction("requestAuthorization") { () async throws -> String in
      #if targetEnvironment(simulator)
        throw MusicKitNotAvailableException(())
      #endif

      guard #available(iOS 15.0, *) else {
        throw MusicKitNotAvailableException(())
      }

      let status = await MusicAuthorization.request()
      return status.toString
    }

    AsyncFunction("getUserToken") { (developerToken: String) async throws -> String in
      #if targetEnvironment(simulator)
        throw MusicKitNotAvailableException(())
      #endif

      guard #available(iOS 15.0, *) else {
        throw MusicKitNotAvailableException(())
      }

      let trimmedToken = developerToken.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmedToken.isEmpty else {
        throw DeveloperTokenEmptyException(())
      }

      do {
        let provider = MusicUserTokenProvider()
        let token = try await provider.userToken(for: trimmedToken, options: [])
        return token
      } catch {
        throw Exception(
          name: "APPLE_MUSIC_USER_TOKEN_FAILED",
          description: error.localizedDescription
        )
      }
    }
  }
}

private extension MusicAuthorization.Status {
  var toString: String {
    switch self {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .restricted:
      return "restricted"
    case .notDetermined:
      return "notDetermined"
    @unknown default:
      return "unknown"
    }
  }
}

