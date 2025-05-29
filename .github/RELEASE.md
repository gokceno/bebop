# Release Process

This repository uses automated releases via GitHub Actions and Changesets.

## How to Release

1. **Create a changeset** when making changes:
   ```bash
   bun changeset
   ```
   This will prompt you to describe your changes and select which packages should be versioned.

2. **Commit and push** your changes along with the generated changeset file.

3. **Automatic Release**: When you push to `main`, the GitHub Action will immediately:
   - Update package versions based on changesets
   - Update CHANGELOGs
   - Build all packages
   - Publish to GitHub Package Registry
   - Create GitHub releases with tags

## Package Registry

Packages are published to the GitHub Package Registry:
- Registry: `https://npm.pkg.github.com`
- Scope: `@gokceno`

## Installing Published Packages

To install packages from this registry:

1. Create or update `.npmrc` in your project:
   ```
   @gokceno:registry=https://npm.pkg.github.com
   ```

2. Authenticate with GitHub (requires a personal access token with `read:packages` scope):
   ```bash
   npm login --scope=@gokceno --registry=https://npm.pkg.github.com
   ```

3. Install the package:
   ```bash
   npm install @gokceno/bebop-client
   ```

## Manual Release

If you need to manually trigger a release:

```bash
# Version packages
bun changeset version

# Build packages
bun build

# Publish to registry
bun release
```

## Permissions

The GitHub Action requires the following permissions:
- `contents: write` - to create releases and tags
- `packages: write` - to publish to GitHub Package Registry