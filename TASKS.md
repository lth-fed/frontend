do the following, if you have any questions write them in this document and continue with the other
points.

- [x] Move activity filters to the main tab and add per-group notification settings.
- [x] Surface backend errors for purchases, transfers, receipts, and payment initiation.
- [x] Restore scrolling in the shell while retaining per-route scroll positions.
- [x] Make groups opened from an activity return to that activity, including fallback navigation.
- [x] Check purchase completion immediately; free purchases complete without the five-second poll.
- [x] Finish the native push application setup and document account-owned configuration.
  - The iOS entitlement and Capacitor AppDelegate callbacks are now enabled in source.
  - Android's project-specific Firebase file and Apple account/provisioning steps require the
    respective account owners. Follow [docs/push-notifications.md](docs/push-notifications.md),
    which includes exact file locations and official setup resources.
