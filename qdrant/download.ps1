$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://github.com/qdrant/qdrant/releases/download/v1.18.2/qdrant-x86_64-pc-windows-msvc.zip"
$out = "C:\Users\ys\Desktop\ai-resume-agent\qdrant\qdrant.zip"
Write-Host "Downloading Qdrant v1.18.2..."
Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 900 -UseBasicParsing
Write-Host "Download completed!"