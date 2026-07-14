# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.2.x (beta) | Yes |
| 0.1.x (alpha) | No |
| < 0.2.0 | No |

## Reporting a vulnerability

If you discover a security issue in Markz, please report it responsibly:

1. **Do not** open a public GitHub issue for undisclosed vulnerabilities.
2. Email **usman.akram.se@gmail.com** with:
   - A description of the issue
   - Steps to reproduce
   - Affected version(s)
   - Impact assessment (if known)
3. Allow up to **7 business days** for an initial response.

We will acknowledge valid reports, work on a fix, and coordinate disclosure once a patched release is available.

## Scope

In scope:

- Remote code execution via crafted Markdown, images, or exports
- Sandbox escapes in the Electron renderer or main process
- Path traversal or arbitrary file write via IPC handlers
- XSS or script injection in rendered content or exported HTML/PDF

Out of scope:

- Issues requiring physical access to an unlocked machine
- Social engineering
- Denial of service from extremely large local files (performance hardening is ongoing)
- Unsigned binary warnings from macOS Gatekeeper or Windows SmartScreen (expected for unsigned OSS builds)

## Privacy

Markz is **offline-first**:

- No accounts or cloud sync
- No telemetry or analytics
- Settings stored locally at `~/.markz/config.json`
- Network use is limited to optional CDN resources in HTML export (KaTeX/Mermaid) and user-initiated actions

## Safe usage

- Only open Markdown and workspace files from sources you trust.
- Pandoc-based import/export (when enabled) invokes external binaries; use a trusted Pandoc installation.
- Keep Markz updated to the latest release from [GitHub Releases](https://github.com/CodingTumbleweed/markz/releases).
