# Windows Setup Guide

Complete step-by-step setup instructions for Windows 10 and Windows 11 users.

## Prerequisites Check

Before starting, make sure you have:
- Windows 10 version 1903+ or Windows 11
- At least 4GB free RAM
- 1GB free disk space
- Administrator access (for software installation)
- Internet connection

## Method 1: Automatic Installation (Recommended)

### Step 1: Open PowerShell

1. Press `Windows Key + R`
2. Type `powershell` and press Enter
3. If you see a blue window, you're ready!

**Alternative ways to open PowerShell:**
- Right-click Start button → "Windows PowerShell" or "Terminal"
- Search "PowerShell" in Start menu
- Press `Windows Key + X` → Choose "Windows PowerShell"

### Step 2: Run the Installer

Copy and paste this command into PowerShell:

```powershell
irm https://raw.githubusercontent.com/your-repo/main/scripts/install.ps1 | iex
```

**What this does:**
- Downloads the installer script
- Checks if Node.js is installed (installs it if missing)
- Downloads and installs all required packages
- Sets up PowerShell permissions
- Tests that everything works

### Step 3: Start the Dashboard

Once installation completes:

```powershell
npm run dev
```

### Step 4: Open Your Browser

Navigate to: http://localhost:3005

**You should see the dashboard ready to use!**

## Method 2: Manual Installation

If the automatic installer doesn't work, follow these manual steps:

### Step 1: Install Node.js

1. Go to https://nodejs.org
2. Click the green "LTS" button (usually version 18 or 20)
3. Download the Windows installer (.msi file)
4. Run the installer with default settings
5. **Important**: Restart your computer after installation

### Step 2: Verify Node.js Installation

Open PowerShell and type:
```powershell
node --version
npm --version
```

You should see version numbers like:
```
v18.20.4
9.8.1
```

If you see "command not found", restart PowerShell or your computer.

### Step 3: Download the Project

**Option A: Download ZIP**
1. Go to the GitHub repository
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to your Desktop or Documents

**Option B: Use Git (if you have it)**
```powershell
git clone https://github.com/your-repo/data-prototype.git
cd data-prototype
```

### Step 4: Install Dependencies

Navigate to the project folder in PowerShell:
```powershell
cd path\to\your\project\folder
npm install
```

This will take a few minutes and download all required packages.

### Step 5: Start the Application

```powershell
npm run dev
```

## PowerShell Execution Policy Issues

If you see an error about "execution policy":

### Quick Fix
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Understanding the Error
Windows blocks PowerShell scripts by default for security. Our scripts are safe, but you need to allow them to run.

**What the fix does:**
- Allows scripts that you create or download from the internet (with confirmation)
- Only affects your user account, not the entire computer
- Is a standard practice for development work

## Common Windows Issues

### Issue: "npm is not recognized"

**Cause**: Node.js isn't installed or not in your PATH.

**Solutions:**
1. **Restart PowerShell** after installing Node.js
2. **Restart your computer** completely
3. **Reinstall Node.js** from nodejs.org
4. **Check your PATH**: Search "Environment Variables" in Start menu → "Path" should include Node.js folder

### Issue: "Port 3005 is already in use"

**Cause**: Another program is using the same port.

**Solutions:**

**Option 1: Use our script**
```powershell
./scripts/dev.ps1 -Force
```

**Option 2: Find and stop the program**
```powershell
netstat -ano | findstr 3005
```
Look at the last number (PID) and stop it:
```powershell
taskkill /PID [number] /F
```

**Option 3: Use a different port**
```powershell
./scripts/dev.ps1 -Port 3000
```

### Issue: "Access denied" or permission errors

**Cause**: Windows is blocking file access.

**Solutions:**
1. **Run PowerShell as Administrator**:
   - Right-click PowerShell → "Run as Administrator"
   - Try the installation again

2. **Check antivirus software**:
   - Temporarily disable real-time protection
   - Add the project folder to exceptions

3. **Windows Defender SmartScreen**:
   - If Windows blocks the installer, click "More info" → "Run anyway"

### Issue: Files won't download or "Access to path denied"

**Cause**: Windows Security or firewall blocking downloads.

**Solutions:**
1. **Windows Security**:
   - Open Windows Security
   - Go to "Virus & threat protection"
   - Click "Manage settings" under "Real-time protection"
   - Temporarily turn off real-time protection
   - Try installation again
   - **Remember to turn protection back on!**

2. **Windows Firewall**:
   - Search "Windows Defender Firewall" in Start menu
   - Click "Allow an app through firewall"
   - Find "Node.js" and make sure both Private and Public are checked

### Issue: PowerShell scripts won't run

**Cause**: Execution policy is too restrictive.

**Solution:**
```powershell
Get-ExecutionPolicy
```

If it shows "Restricted", run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Windows-Specific Features

### PowerShell Scripts

We provide special PowerShell scripts for Windows users:

```powershell
./scripts/install.ps1           # Complete installation
./scripts/dev.ps1              # Start development server  
./scripts/build.ps1            # Build for production
./scripts/troubleshoot.ps1     # Diagnose and fix issues
./scripts/cleanup.ps1          # Clean up or uninstall
```

### Getting Help from Scripts

Each script has built-in help:
```powershell
./scripts/install.ps1 -Help
./scripts/dev.ps1 -Help
./scripts/troubleshoot.ps1 -Help
```

### Windows Performance Tips

**For better performance on Windows:**

1. **Use an SSD**: If possible, install on an SSD drive
2. **Close other programs**: Free up RAM for better performance
3. **Windows Updates**: Keep Windows updated for best Node.js compatibility
4. **Antivirus exclusions**: Add the project folder to antivirus exclusions

## Testing Your Installation

Run our comprehensive test:
```powershell
./scripts/troubleshoot.ps1
```

This will check:
- ✅ PowerShell version
- ✅ Node.js installation
- ✅ Project structure
- ✅ Dependencies
- ✅ Port availability
- ✅ Build process

## Next Steps

Once everything is working:

1. **Upload your data files** to the dashboard
2. **Explore the charts** and analytics
3. **Try the keyboard shortcuts** (Ctrl+K for command menu)
4. **Export your data** in various formats

## Getting Help

**Built-in help:**
```powershell
./scripts/troubleshoot.ps1      # Automatic problem detection
./scripts/install.ps1 -Help     # Installation help
```

**Manual support:**
- Check the main README.md for general usage
- Create an issue on GitHub for bugs
- Email support for personalized help

## Uninstalling

To completely remove everything:
```powershell
./scripts/cleanup.ps1 -Full
```

This will:
- Remove all installed packages
- Clean up build files
- Clear caches
- **Keep your data files safe**

---

*This guide covers Windows-specific setup. For general usage instructions, see the main README.md file.*