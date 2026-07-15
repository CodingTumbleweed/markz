# Installing Markz

Markz is distributed as unsigned open-source binaries via [GitHub Releases](https://github.com/CodingTumbleweed/markz/releases). Builds are not code-signed; your operating system may show security warnings on first launch. This is expected for early beta releases.

## System requirements

| Platform | Minimum version | Architecture |
|----------|-----------------|--------------|
| macOS | 11 (Big Sur) | Apple Silicon (arm64) or Intel (x64) |
| Windows | 10 | x64 |
| Linux | Ubuntu 20.04 or equivalent | x64 |

**Disk space:** ~300 MB per install.

## Download

1. Open the [latest release](https://github.com/CodingTumbleweed/markz/releases/latest) on GitHub.
2. Download the artifact for your platform (see table below).
3. Optionally verify the download against `SHA256SUMS.txt` included in the release.

| Platform | File | Description |
|----------|------|-------------|
| macOS (Apple Silicon) | `Markz-{version}-arm64.dmg` | Recommended installer |
| macOS (Intel) | `Markz-{version}-x64.dmg` | Recommended installer |
| macOS | `Markz-{version}-{arch}.zip` | Portable archive (unzip, drag to Applications) |
| Windows | `Markz-Setup-{version}.exe` | NSIS installer |
| Windows | `Markz-{version}.exe` | Portable executable (no install) |
| Linux | `Markz-{version}.AppImage` | Universal binary; chmod +x and run |
| Linux | `markz_{version}_amd64.deb` | Debian/Ubuntu package |

## macOS installation

### From DMG (recommended)

1. Open the downloaded `.dmg` file.
2. Drag **Markz** to the **Applications** folder.
3. Eject the DMG.
4. **Remove the browser quarantine flag** (recommended before first launch):

```bash
xattr -cr /Applications/Markz.app
```

5. Open Markz from Applications (see Gatekeeper notes below if macOS blocks launch).

### Unsigned app warning (Gatekeeper)

On first launch, macOS may say the app "cannot be opened because the developer cannot be verified."

When opening a `.md` file via Finder **Open With → Markz**, macOS may instead show:

> **"Markz" is damaged and can't be opened. You should move it to the Trash.**

This is the same Gatekeeper/quarantine issue — the app is not corrupted. Browsers mark downloaded apps with a quarantine attribute that blocks unsigned binaries. See [#3](https://github.com/CodingTumbleweed/markz/issues/3).

**Option A — Right-click open (recommended)**

1. Right-click (or Control-click) **Markz** in Applications.
2. Choose **Open**.
3. Click **Open** in the dialog. You only need to do this once.

**Option B — Remove quarantine attribute**

```bash
xattr -cr /Applications/Markz.app
```

Then open Markz normally.

## Windows installation

### From NSIS installer

1. Run `Markz-Setup-{version}.exe`.
2. Choose an install directory if prompted.
3. Finish the installer and launch Markz from the Start menu or desktop shortcut.

### SmartScreen warning

Windows may show "Windows protected your PC" because the build is unsigned.

1. Click **More info**.
2. Click **Run anyway**.

### Portable executable

Download the portable `.exe`, place it anywhere, and run directly. No installer required.

## Linux installation

### AppImage (recommended)

```bash
chmod +x Markz-{version}.AppImage
./Markz-{version}.AppImage
```

To integrate with your desktop environment, use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or move the AppImage to `~/Applications` and mark it executable.

### Debian package

```bash
sudo dpkg -i markz_{version}_amd64.deb
```

If dependencies are missing:

```bash
sudo apt-get install -f
```

## Opening Markdown files

After installation and clearing quarantine (macOS), you can open files from Finder:

- **Double-click** a `.md`, `.markdown`, or `.mdown` file (if Markz is the default app).
- **Right-click → Open With → Markz** — if you see the "damaged" error, run `xattr -cr /Applications/Markz.app` first.
- **From Markz:** File → Open, or File → Open Folder for a workspace.
- **Open Quickly:** `Cmd+P` (macOS) or `Ctrl+P` (Windows/Linux) after opening a folder.
- **Command line:** `markz path/to/file.md` (when the CLI shim is on your PATH after install).

## Upgrading

1. Download the new release from GitHub.
2. Replace the previous install:
   - **macOS:** Replace `Markz.app` in Applications.
   - **Windows:** Run the new installer (or replace the portable exe).
   - **Linux:** Replace the AppImage or reinstall the `.deb`.
3. Your settings in `~/.markz/config.json` are preserved across upgrades.

There is no in-app auto-update in beta releases. Check [GitHub Releases](https://github.com/CodingTumbleweed/markz/releases) for new versions.

## Building from source

For contributors or if no binary matches your platform:

```bash
git clone https://github.com/CodingTumbleweed/markz.git
cd markz
npm install
npm run dev          # development
npm run package:mac  # or package:win / package:linux
```

Installers are written to `release/`.

## Troubleshooting

| Issue | Suggestion |
|-------|------------|
| **"Markz is damaged and can't be opened"** (macOS) | Not corruption — Gatekeeper quarantine on unsigned builds. Run `xattr -cr /Applications/Markz.app`, then right-click Markz → **Open** once. Common when opening `.md` files via **Open With**. ([#3](https://github.com/CodingTumbleweed/markz/issues/3)) |
| App won't open on macOS | Use right-click → Open, or `xattr -cr /Applications/Markz.app` |
| SmartScreen blocks Windows install | More info → Run anyway |
| AppImage won't run on Linux | `chmod +x` on the file; check FUSE/AppImage support on your distro |
| `.md` files don't open in Markz | Clear quarantine on macOS (`xattr -cr`), confirm file association, or use File → Open |

## Reporting issues

- Bugs and feature requests: [GitHub Issues](https://github.com/CodingTumbleweed/markz/issues)
- Security vulnerabilities: see [SECURITY.md](../SECURITY.md) (do not file public issues for undisclosed security bugs)

## Known beta limitations

- Builds are **unsigned** (Gatekeeper / SmartScreen warnings).
- **Click-to-edit** in some block widget regions is a known issue ([#1](https://github.com/CodingTumbleweed/markz/issues/1)).
- **macOS "damaged" error** when opening `.md` files from Finder — quarantine on unsigned builds; run `xattr -cr /Applications/Markz.app` ([#3](https://github.com/CodingTumbleweed/markz/issues/3)).
- **Pandoc** is not bundled; docx/epub/LaTeX export requires a separate Pandoc install (future feature).
- **Auto-update** is not enabled in beta; download new releases manually.

See [Release Notes](RELEASE_NOTES.md) for the full changelog.
