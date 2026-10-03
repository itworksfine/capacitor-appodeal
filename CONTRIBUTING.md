# Contributing

This guide provides instructions for contributing to this Capacitor plugin.

## Developing

### Local Setup

1. Fork and clone the repo.
1. Install the dependencies.

    ```shell
    npm install
    ```

1. Install SwiftLint if you're on macOS.

    ```shell
    brew install swiftlint
    ```

### Scripts

#### `npm run build`

Build the plugin web assets and generate plugin API documentation using [`@capacitor/docgen`](https://github.com/ionic-team/capacitor-docgen).

It will compile the TypeScript code from `src/` into ESM JavaScript in `dist/esm/`. These files are used in apps with bundlers when your plugin is imported.

Then, Rollup will bundle the code into a single file at `dist/plugin.js`. This file is used in apps without bundlers by including it as a script in `index.html`.

#### `npm run verify`

Build and validate the web and native projects.

This is useful to run in CI to verify that the plugin builds for all platforms.

#### `npm run lint` / `npm run fmt`

Check formatting and code quality, autoformat/autofix if possible.

This template is integrated with ESLint, Prettier, and SwiftLint. Using these tools is completely optional, but the [Capacitor Community](https://github.com/capacitor-community/) strives to have consistent code style and structure for easier cooperation.

## Publishing

Releases are automated with [release-please](https://github.com/googleapis/release-please). Commits on `main` follow [Conventional Commits](https://www.conventionalcommits.org/) (PRs are squash-merged, so the PR title is the commit):

- `fix:` releases a patch
- `feat:` releases a minor
- `feat!:` or a `BREAKING CHANGE:` footer releases a major (a minor before 1.0)
- `chore:`, `docs:`, `ci:`, `refactor:`, `test:` don't release

release-please keeps a release PR open with the version bump and `CHANGELOG.md`. Merging it tags `vX.Y.Z`, creates the GitHub Release and publishes to npm with provenance.

> **Note**: The [`files`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files) array in `package.json` specifies which files get published. If you rename files/directories or add files elsewhere, you may need to update it.
