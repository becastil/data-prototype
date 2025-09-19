# Healthcare Analytics Dashboard

A simple, easy-to-use website that turns your healthcare spreadsheets into beautiful charts and graphs. No technical knowledge required!

## What Does This Do?

This tool helps you visualize your healthcare data by:
- **Converting Excel/CSV files** into interactive charts
- **Showing budget trends** with colorful graphs
- **Analyzing claims data** with easy-to-understand visualizations
- **Tracking enrollment numbers** over time

Perfect for healthcare administrators, benefits managers, and anyone who works with healthcare data.

## Quick Start - Get Running in 5 Minutes ⚡

### For Windows Users (Easiest Method)

1. **Download and run our installer**:
   ```
   Copy and paste this into PowerShell (search for "PowerShell" in Start menu):
   ```
   ```powershell
   irm https://raw.githubusercontent.com/your-repo/main/scripts/install.ps1 | iex
   ```

2. **Wait for everything to install automatically**
   - The installer will download everything you need
   - Just say "yes" when it asks permission

3. **Start the dashboard**:
   ```powershell
   npm run dev
   ```

4. **Open your browser** to http://localhost:3005

**That's it!** You should see the dashboard ready to upload your files.

### Alternative Method (Any Computer)

If the quick installer doesn't work, follow these steps:

**Step 1: Install Node.js**
- Go to https://nodejs.org
- Download the "LTS" version (the green button)
- Install it like any other program
- Restart your computer

**Step 2: Download this project**
- Download as ZIP from GitHub, or
- If you know Git: `git clone https://github.com/your-repo/data-prototype.git`

**Step 3: Open PowerShell/Terminal in the project folder**
- **Windows**: Right-click in the folder → "Open in Terminal" or "Open PowerShell window here"
- **Mac**: Right-click in the folder → "New Terminal at Folder"

**Step 4: Install and start**
```bash
npm install
npm run dev
```

**Step 5: Open your browser** to http://localhost:3005

## Authentication & RBAC

The dashboard now requires authenticated access. Credentials are managed by [NextAuth.js](https://next-auth.js.org/) and are fully driven by environment variables so that no secrets are committed to the repository.

### Required environment variables

| Variable | Description |
| --- | --- |
| `AUTH_SECRET` | A 32+ character random string used to sign JSON Web Tokens. Generate one with `openssl rand -hex 32`. |
| `AUTH_USERS` | JSON array describing the allowed users. Each user includes an `id`, `email`, BCrypt `passwordHash`, `role`, and a list of RBAC `scopes`. |

Example `AUTH_USERS` value:

```json
[
  {
    "id": "admin-1",
    "email": "admin@example.com",
    "passwordHash": "$2a$10$EXAMPLEHASHFROMBCRYPT1234567890abcdefghi",
    "role": "admin",
    "scopes": ["phi:read", "phi:write"]
  }
]
```

Generate a password hash locally:

```bash
node -e "require('bcryptjs').hash('super-secret-password', 12).then(console.log)"
```

After the variables are configured, visit `/auth/signin` to log in. RBAC-protected API routes such as `/api/audit/logs` require the caller to include the appropriate scopes (for example, `phi:read`). Unauthorized requests are rejected with structured JSON error responses.

## How to Use the Dashboard

### 1. Upload Your Data Files

The dashboard has two upload areas:

**Left Panel: Budget Data**
- Upload your budget/financial CSV file
- Should contain monthly budget amounts, admin fees, claims data

**Right Panel: Claims Data** 
- Upload your claims/enrollment CSV file  
- Should contain individual claim amounts, member data

**Supported File Types**: CSV, Excel (.xlsx), Tab-delimited (.tsv)

### 2. View Your Analytics

Once uploaded, you'll see 4 main sections:

**📊 Budget vs Expenses Trend**
- Shows how your actual spending compares to budget over time
- Colorful bars show different cost categories
- Line shows your budget target

**🔵 Cost Distribution Chart** 
- Scatter plot showing how costs are distributed
- Each dot represents cost ranges ($0-25k, $25k-50k, etc.)

**📈 Enrollment Trends**
- Line chart showing member enrollment over time
- Statistics showing growth/decline percentages

**📋 Data Table**
- Detailed view of all your data
- Click column headers to sort
- Search and filter capabilities

## Keyboard Shortcuts (Optional Power Features)

Press these key combinations for faster navigation:

- **Ctrl+K** (Windows) or **⌘K** (Mac): Open command menu
- **Ctrl+D** or **⌘D**: Switch between light/dark themes
- **Ctrl+E** or **⌘E**: Export your data
- **F1**: Show help and all shortcuts

## Troubleshooting

### "Command not found" or "npm is not recognized"

**Problem**: Your computer can't find the required software.

**Solutions**:
1. **Windows**: Run our troubleshooting script:
   ```powershell
   ./scripts/troubleshoot.ps1
   ```

2. **Install Node.js manually**:
   - Go to https://nodejs.org
   - Download and install the LTS version
   - Restart PowerShell/Terminal
   - Try again

### "Port already in use" or "Address already in use"

**Problem**: Something else is using the same port (3005).

**Solutions**:
1. **Windows**: Use our port fixer:
   ```powershell
   ./scripts/dev.ps1 -Force
   ```

2. **Manual fix**: Find and stop the conflicting program:
   ```powershell
   # Windows
   netstat -ano | findstr 3005
   # Look at the last number (PID) and stop it:
   taskkill /PID [number] /F
   ```

3. **Use a different port**:
   ```powershell
   ./scripts/dev.ps1 -Port 3000
   ```

### Dashboard won't load or shows errors

**Problem**: The application isn't starting properly.

**Solutions**:
1. **Run our automated fix**:
   ```powershell
   # Windows
   ./scripts/troubleshoot.ps1 -Fix
   ```

2. **Fresh install**:
   ```powershell
   # Clean everything and start over
   ./scripts/cleanup.ps1 -Full
   ./scripts/install.ps1
   ```

3. **Check for errors**:
   - Look at the PowerShell/Terminal window for red error messages
   - Try restarting your computer
   - Make sure your antivirus isn't blocking the application

### CSV files won't upload or show "Error parsing file"

**Problem**: Your CSV file format isn't recognized.

**Solutions**:
1. **Check your file format**:
   - Make sure it's saved as CSV (comma-separated)
   - Open in Excel and "Save As" → CSV format
   
2. **Check column headers**:
   - Make sure your CSV has headers in the first row
   - Common headers: Date, Month, Claims, Budget, Admin Fees
   
3. **Remove special characters**:
   - Avoid symbols like #, $, % in data cells
   - Remove extra spaces or line breaks

## Uninstalling

To completely remove the application:

```powershell
# Windows - removes everything
./scripts/cleanup.ps1 -Full
```

This will delete all installed files but keep your original data safe.

## Getting Help

### Built-in Help
1. **Troubleshooting script**: `./scripts/troubleshoot.ps1`
2. **Help commands**: `./scripts/install.ps1 -Help`
3. **Command palette**: Press Ctrl+K or ⌘K in the dashboard

### Manual Support
- **Email**: [your-support-email]
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `docs/` folder for detailed guides

## What Files Can I Upload?

### Budget/Financial Data Files
Your file should have columns like:
- **Date/Month**: When the expense occurred
- **Medical Claims**: Medical claim costs
- **Rx/Prescription**: Prescription costs  
- **Admin Fees**: Administrative fees
- **Stop Loss**: Stop loss amounts
- **Budget**: Target budget amounts
- **Employee Count**: Number of enrolled employees

### Claims Data Files  
Your file should have columns like:
- **Member/Claimant ID**: Unique identifier
- **Medical Cost**: Individual medical costs
- **Rx Cost**: Individual prescription costs
- **Service Type**: Type of service
- **Total**: Total claim amount

**Don't worry about exact column names** - the system will automatically detect your data!

## Advanced Features (Optional)

### Exporting Your Data
- **CSV Export**: Download processed data as spreadsheet
- **PDF Export**: Generate printable reports
- **Excel Export**: Full Excel workbook with multiple sheets

### Customizing Colors and Themes
- Toggle between light and dark themes
- Colors automatically adjust for accessibility
- High contrast mode available

### Performance Features
- Handles large files (10,000+ rows)
- Fast loading with progress bars
- Works on older computers

## System Requirements

**Minimum Requirements**:
- Windows 10 or newer, macOS 10.14+, or Linux
- 4GB RAM
- 1GB free disk space
- Internet connection (for initial setup)

**Recommended**:
- 8GB+ RAM for large files
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Security & Privacy

- **Your data never leaves your computer**
- No cloud uploads or external sharing
- All processing happens locally
- No user accounts or login required
- Safe to use with sensitive healthcare data

---

## Quick Reference Commands

### Starting the Dashboard
```powershell
npm run dev              # Start development mode
npm run build            # Build for production  
npm start               # Run production version
```

### Windows PowerShell Scripts
```powershell
./scripts/install.ps1           # Install everything
./scripts/dev.ps1              # Start development server
./scripts/build.ps1            # Build the application  
./scripts/troubleshoot.ps1     # Fix common problems
./scripts/cleanup.ps1          # Clean up or uninstall
```

### Getting Help
```powershell
./scripts/install.ps1 -Help    # Installation help
./scripts/dev.ps1 -Help       # Development help
./scripts/troubleshoot.ps1 -Help  # Troubleshooting help
```

---

*This dashboard is designed to be simple and user-friendly. If you run into any issues, start with the troubleshooting script or reach out for help!*