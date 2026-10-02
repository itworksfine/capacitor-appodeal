#!/usr/bin/env bash
# Builds the plugin for devices, then runs its tests on the first available
# iPhone simulator, whichever Xcode is selected.
set -euo pipefail

scheme=JongbongaCapacitorAppodeal

xcodebuild build -scheme "$scheme" -destination generic/platform=iOS

simulator=$(xcrun simctl list devices available -j | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    const runtimes = JSON.parse(s).devices;
    const ios = Object.keys(runtimes).filter((r) => r.includes("iOS")).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const runtime of ios) {
      const phone = runtimes[runtime].find((d) => d.name.startsWith("iPhone"));
      if (phone) return console.log(phone.udid);
    }
    process.exit(1);
  });
')

xcodebuild test -scheme "$scheme" -destination "id=$simulator"
