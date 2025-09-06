# Frequently Asked Questions (FAQ)

Common questions and answers for the Healthcare Analytics Dashboard.

## Installation & Setup

### Q: Do I need to be a programmer to use this?
**A:** No! This tool is designed for healthcare administrators, benefits managers, and anyone who works with Excel or CSV files. No programming knowledge required.

### Q: What operating systems are supported?
**A:** 
- **Windows 10** or newer (fully supported with PowerShell scripts)
- **Windows 11** (fully supported)
- **macOS 10.14+** (basic support)
- **Linux** (basic support)

### Q: How much disk space do I need?
**A:** About 1GB total:
- Node.js: ~200MB
- Application files: ~300MB  
- Dependencies: ~500MB

### Q: Can I install this on a work computer with restrictions?
**A:** Maybe. You'll need:
- Permission to install software (Node.js)
- Permission to run PowerShell scripts
- Internet access for initial download
- Administrator access may be required

Contact your IT department if you're unsure.

### Q: Is this safe for sensitive healthcare data?
**A:** Yes! The application:
- Runs entirely on your computer
- Never uploads data to the internet
- Doesn't require user accounts or logins
- Processes files locally only
- Complies with data privacy requirements

## Using the Dashboard

### Q: What file formats can I upload?
**A:** Supported formats:
- **CSV files** (.csv) - most common
- **Excel files** (.xlsx) 
- **Tab-delimited files** (.tsv, .txt)

### Q: My CSV file won't upload. What's wrong?
**A:** Common issues:
1. **File format**: Make sure it's actually a CSV file, not just renamed
2. **Column headers**: First row should contain column names
3. **Special characters**: Remove symbols like #, $, % from data cells
4. **File size**: Very large files (>50MB) may take longer
5. **Encoding**: Save as UTF-8 if you have special characters

**Quick fix**: Open in Excel and "Save As" → CSV format.

### Q: What columns should my data files have?

**Budget/Financial Data:**
- Date or Month column
- Budget amounts
- Actual expenses (Medical Claims, Rx, Admin Fees)
- Employee Count (optional)

**Claims Data:**
- Member/Claimant ID
- Medical costs
- Prescription costs  
- Service types
- Total amounts

**Don't worry about exact names** - the system automatically detects your columns!

### Q: The dashboard shows "No data" after uploading files.
**A:** Try these solutions:
1. **Check file format**: Make sure files are proper CSV format
2. **Check column headers**: First row should have column names
3. **Upload both files**: You need both budget and claims data
4. **Refresh the page**: Sometimes a browser refresh helps
5. **Check browser console**: Press F12 and look for error messages

### Q: Can I use this with data from [specific software]?
**A:** If your software can export to CSV or Excel format, then yes! Common software that works:
- Excel
- Google Sheets
- QuickBooks
- SAP
- Most HR/Benefits platforms
- Database exports

## Technical Issues

### Q: I see "npm is not recognized" error.
**A:** Node.js isn't installed or isn't in your PATH. Solutions:
1. **Install Node.js**: Download from https://nodejs.org
2. **Restart PowerShell**: Close and reopen after installation
3. **Restart computer**: Sometimes required for PATH updates
4. **Use our installer**: `./scripts/install.ps1` handles this automatically

### Q: "Port 3005 is already in use" error.
**A:** Another program is using the same port. Solutions:
1. **Use our script**: `./scripts/dev.ps1 -Force` (recommended)
2. **Find the program**: `netstat -ano | findstr 3005` then `taskkill /PID [number] /F`
3. **Use different port**: `./scripts/dev.ps1 -Port 3000`

### Q: PowerShell won't run scripts.
**A:** Windows blocks scripts by default. Fix:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
This is safe and standard for development work.

### Q: The application is running slowly.
**A:** Performance tips:
1. **Close other programs**: Free up RAM
2. **Use smaller files**: Split large CSV files if needed
3. **Restart the application**: `Ctrl+C` then `npm run dev` again
4. **Check system resources**: Task Manager → Performance tab
5. **Use production build**: `npm run build` then `npm start`

### Q: Browser shows "This site can't be reached".
**A:** Connection issues:
1. **Check the address**: Should be `http://localhost:3005`
2. **Check if server is running**: Look for "Ready" message in PowerShell
3. **Try different port**: Use `./scripts/dev.ps1 -Port 3000`
4. **Firewall issues**: Temporarily disable Windows Firewall to test
5. **Browser cache**: Try private/incognito mode

### Q: Windows Defender blocked the installation.
**A:** Windows is being cautious with new software:
1. **Click "More info"** on the warning
2. **Click "Run anyway"** 
3. **Add to exceptions**: Windows Security → Virus protection → Exclusions
4. **Temporarily disable**: Turn off real-time protection during install

## Data & Privacy

### Q: Where is my data stored?
**A:** Your data is stored:
- **Temporarily in browser memory** while using the dashboard
- **Never saved to disk** unless you explicitly export
- **Never sent to external servers**
- **Completely local** to your computer

### Q: Can others access my data?
**A:** No. The application:
- Runs only on your computer
- Doesn't create network connections for data sharing
- Requires physical access to your computer to view
- Doesn't store data in shared locations

### Q: Is this HIPAA compliant?
**A:** The application itself doesn't store or transmit PHI, so it doesn't directly fall under HIPAA. However:
- All processing is local to your machine
- No data leaves your computer
- No user accounts or logging
- No external data sharing

**Always check with your compliance officer** for your specific organization's requirements.

### Q: Can I use this for PHI (Protected Health Information)?
**A:** Technically yes, since data stays on your computer, but:
- **Remove identifying information** when possible
- **Use aggregate data** rather than individual records
- **Follow your organization's policies**
- **Encrypt your computer** if required by policy

## Features & Functionality

### Q: Can I customize the charts and colors?
**A:** Currently limited customization:
- **Theme toggle**: Switch between light and dark modes
- **Colors**: Automatically optimized for accessibility
- **Chart types**: Fixed to the 4-tile layout

Future versions may include more customization options.

### Q: Can I export the charts as images?
**A:** Yes! Several options:
- **Right-click charts**: "Save image as" in most browsers
- **Screenshot tools**: Windows Snipping Tool, Snagit, etc.
- **Print to PDF**: Browser print function
- **Export data**: CSV/Excel export available

### Q: How do I save my work?
**A:** The dashboard doesn't auto-save, but you can:
- **Export processed data**: Use the export functions
- **Bookmark the page**: If using file URLs
- **Screenshot charts**: For reports and presentations
- **Keep original files**: Always maintain backups of source data

### Q: Can multiple people use this at the same time?
**A:** Each installation serves one user at a time:
- **Same computer**: Only one instance can run on port 3005
- **Different computers**: Each person needs their own installation
- **Shared data**: Export/import CSV files to share results

## Troubleshooting

### Q: Something broke and nothing works.
**A:** Emergency reset procedure:
1. **Stop everything**: Press `Ctrl+C` in PowerShell
2. **Run diagnostics**: `./scripts/troubleshoot.ps1 -Fix`
3. **If that doesn't work**: `./scripts/cleanup.ps1 -Full` then `./scripts/install.ps1`
4. **Still broken?**: Restart your computer and try again

### Q: The troubleshooting script doesn't help.
**A:** Manual troubleshooting:
1. **Check Node.js**: `node --version` should show a version number
2. **Check npm**: `npm --version` should show a version number
3. **Check files**: `ls` or `dir` should show package.json
4. **Check ports**: `netstat -ano | findstr 3005` should be empty
5. **Check permissions**: Run PowerShell as Administrator

### Q: I'm getting weird errors in red text.
**A:** Red error messages usually indicate:
- **Missing dependencies**: Run `npm install`
- **Port conflicts**: Use `./scripts/dev.ps1 -Force`
- **Permission issues**: Run PowerShell as Administrator
- **Corrupted installation**: Clean reinstall with `./scripts/cleanup.ps1 -Full`

### Q: It worked yesterday but not today.
**A:** Common causes:
- **Another program using the port**: Restart computer or use `-Force` flag
- **Windows updates**: Restart computer after updates
- **Antivirus interference**: Check if files were quarantined
- **Corrupted cache**: Use `./scripts/cleanup.ps1 -Cache`

## Getting Help

### Q: Where can I get more help?
**A:** Help resources in order of speed:
1. **Built-in troubleshooter**: `./scripts/troubleshoot.ps1`
2. **This FAQ**: You're reading it!
3. **README file**: Comprehensive usage guide
4. **WINDOWS-SETUP.md**: Detailed Windows instructions
5. **GitHub Issues**: Report bugs and get community help
6. **Email support**: For personalized assistance

### Q: How do I report a bug?
**A:** To report bugs effectively:
1. **Run diagnostics**: `./scripts/troubleshoot.ps1 -Detailed`
2. **Note your system**: Windows version, browser, file types
3. **Describe the problem**: What were you trying to do?
4. **Include error messages**: Copy exact text of any errors
5. **Steps to reproduce**: How can someone else see the same problem?

### Q: Can I request new features?
**A:** Yes! Feature requests are welcome:
- **GitHub Issues**: Create a feature request
- **Email**: Send detailed descriptions
- **Community discussion**: Talk with other users

Priority is given to features that help the most users.

### Q: Is there a user community?
**A:** Check the GitHub repository for:
- **Discussions**: General questions and tips
- **Issues**: Bug reports and feature requests
- **Wiki**: Community-contributed guides
- **Releases**: Updates and new features

## Updates & Maintenance

### Q: How do I update to a new version?
**A:** Update process:
1. **Backup your data**: Export any important results
2. **Download new version**: From GitHub releases
3. **Clean install**: Use `./scripts/cleanup.ps1 -Full` then reinstall
4. **Or update dependencies**: `npm update` (may not get all changes)

### Q: How often should I update?
**A:** Update when:
- **Security updates available**: Important for safety
- **New features you want**: Check release notes
- **Bug fixes for problems you're experiencing**: Read changelog
- **Major version changes**: Usually worth updating

### Q: Will updates break my data?
**A:** Updates shouldn't affect your data because:
- **Data isn't stored** by the application
- **Original files remain unchanged**
- **Exports are standard CSV/Excel format**
- **Settings don't persist** between sessions

Always keep backups of original files just in case.

---

## Still Have Questions?

**Quick Solutions:**
- Run `./scripts/troubleshoot.ps1` for automated problem-solving
- Check README.md for detailed usage instructions
- Try `./scripts/install.ps1 -Help` for installation help

**Get Human Help:**
- Create a GitHub Issue with your question
- Email support with "Healthcare Dashboard" in the subject
- Include system details and error messages

*Most problems can be solved with the automated troubleshooting script!*