# Native push notification setup

The Capacitor plugin, permission request, application registration/deregistration, Android Gradle
integration, iOS delegate callbacks, and iOS entitlement are in the repository. The remaining setup
requires access to the Firebase and Apple developer accounts and therefore cannot be generated from
source control.

## Android (Firebase Cloud Messaging)

1. In Firebase, add an Android app with package name `se.teknologappen.tappen`.
2. Download its `google-services.json` and place it at `frontend/android/app/google-services.json`.
3. Run `pnpm android` (or `npx cap sync android`) and build/install the app on a device.
4. Confirm login triggers `POST /v0/push/register` with an Android FCM token.

The Gradle Google Services plugin is already declared and is applied automatically when that file
exists. Capacitor's Android plugin provides the Firebase Messaging dependency and notification
permission handling.

- [Capacitor Push Notifications setup](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Android/FCM setup](https://firebase.google.com/docs/cloud-messaging/android/get-started)

## iOS (Apple Push Notification service)

1. Open `frontend/ios/App/App.xcodeproj` in Xcode.
2. Select the `App` target and the correct development team.
3. Under **Signing & Capabilities**, add **Push Notifications**. The checked-in entitlement and
   AppDelegate callbacks are already present.
4. In the Apple Developer portal, enable Push Notifications for the explicit App ID matching the
   Xcode bundle identifier and regenerate affected provisioning profiles if necessary.
5. Configure the APNs key or certificate used by the notification-sending backend, then install a
   signed build on a physical device and confirm login triggers `POST /v0/push/register` with an iOS
   APNs token.

Xcode/signing changes the development APNs environment to production for distribution builds. A
simulator or an unsigned profile cannot validate production token delivery.

- [Apple: register an app with APNs](https://developer.apple.com/documentation/UserNotifications/registering-your-app-with-apns)
- [Apple: enable App ID capabilities](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/)
