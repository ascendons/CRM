# Install Required Tools - Manual Guide

Run these commands in your terminal to install the required tools.

---

## 1. Install AWS CLI (2 minutes)

```bash
# Download installer
cd /tmp
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"

# Install (will ask for sudo password)
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version
# Should show: aws-cli/2.x.x

# Clean up
rm AWSCLIV2.pkg
```

---

## 2. Configure AWS CLI (5 minutes)

You need AWS credentials first. Get them from AWS Console:

### Get AWS Credentials:

1. Go to: https://console.aws.amazon.com
2. Sign in to your AWS account
3. Click your name (top right) → Security Credentials
4. Scroll to "Access keys" section
5. Click "Create access key"
6. Choose "Command Line Interface (CLI)"
7. Click "Next" → "Create access key"
8. **IMPORTANT**: Copy and save both:
   - Access Key ID
   - Secret Access Key

### Configure CLI:

```bash
aws configure

# When prompted, enter:
AWS Access Key ID: <paste your access key>
AWS Secret Access Key: <paste your secret key>
Default region name: us-east-1
Default output format: json
```

### Verify:

```bash
aws sts get-caller-identity

# Should show:
# {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "..."
# }
```

---

## 3. Install Elastic Beanstalk CLI (1 minute)

```bash
# Install via pip3
pip3 install awsebcli --upgrade --user

# Add to PATH (for zsh - macOS default)
echo 'export PATH="$HOME/Library/Python/3.11/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Verify
eb --version
# Should show: EB CLI 3.x.x
```

**If it doesn't work**, try:
```bash
# Find where eb was installed
find ~ -name "eb" -type f 2>/dev/null | grep bin

# Add that directory to PATH manually
export PATH="/path/from/above:$PATH"
```

---

## 4. Install Amplify CLI (1 minute)

```bash
# Install via npm
npm install -g @aws-amplify/cli

# Verify
amplify --version
# Should show: x.x.x
```

---

## 5. Verification (30 seconds)

Run this to check everything:

```bash
echo "Checking installations..."
echo ""
echo "AWS CLI:      $(command -v aws && aws --version || echo '❌ Not installed')"
echo "EB CLI:       $(command -v eb && eb --version || echo '❌ Not installed')"
echo "Amplify CLI:  $(command -v amplify && amplify --version || echo '❌ Not installed')"
echo "Node.js:      $(node --version)"
echo "pip3:         $(pip3 --version)"
echo ""
echo "AWS Config:   $(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '❌ Not configured')"
```

All should show ✅ before proceeding.

---

## Troubleshooting

### AWS CLI not found after install
```bash
# Check if installed
which aws

# If not found, add to PATH
export PATH="/usr/local/bin:$PATH"
```

### EB CLI not found
```bash
# Try different Python versions
pip3.11 install awsebcli --user
# OR
python3 -m pip install awsebcli --user

# Add to PATH
export PATH="$HOME/Library/Python/3.11/bin:$PATH"
```

### Amplify not found
```bash
# Check npm global directory
npm config get prefix

# If it shows /usr/local, you may need sudo
sudo npm install -g @aws-amplify/cli
```

---

## Quick Install (All at Once)

If you prefer, copy and paste this entire block:

```bash
# Install AWS CLI
cd /tmp
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
rm AWSCLIV2.pkg

# Install EB CLI
pip3 install awsebcli --upgrade --user
echo 'export PATH="$HOME/Library/Python/3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Verify all
echo ""
echo "✅ Installation complete!"
echo ""
aws --version
eb --version
amplify --version
```

Then configure AWS:

```bash
aws configure
# Enter your credentials
```

---

## Next Steps

After all tools are installed:

1. **Verify everything works:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Start deployment:**
   ```bash
   cd /Users/pankajthakur/IdeaProjects/CRM
   ./deploy-tier1.sh
   ```

---

## Need Help?

If you get stuck on any step, check:
- AWS CLI docs: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- EB CLI docs: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html
- Amplify docs: https://docs.amplify.aws/cli/start/install/
