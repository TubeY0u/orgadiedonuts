$dest = Split-Path -Parent $MyInvocation.MyCommand.Path

$maps  = @('de_mirage','de_inferno','de_ancient','de_anubis','de_dust2','de_nuke','de_overpass','de_vertigo')
$names = @('mirage',   'inferno',   'ancient',   'anubis',   'dust2',   'nuke',   'overpass',   'vertigo')

# Steam finden
$steamPath = $null
foreach ($rp in @('HKCU:\Software\Valve\Steam','HKLM:\Software\Valve\Steam','HKLM:\Software\Wow6432Node\Valve\Steam')) {
    try { $v = (Get-ItemProperty $rp -EA Stop).SteamPath; if ($v -and (Test-Path $v)) { $steamPath = $v; break } } catch {}
}
if (-not $steamPath) {
    foreach ($p in @('C:\Program Files (x86)\Steam','C:\Program Files\Steam','D:\Steam','E:\Steam')) {
        if (Test-Path $p) { $steamPath = $p; break }
    }
}

$cs2Root = Join-Path $steamPath 'steamapps\common\Counter-Strike Global Offensive'
Write-Host "CS2: $cs2Root" -ForegroundColor Green

# vpk.exe ueberall suchen
Write-Host "Suche vpk.exe..." -ForegroundColor Cyan
$vpkExe = Get-ChildItem -Path $steamPath -Recurse -Filter 'vpk.exe' -EA SilentlyContinue | Select-Object -First 1
if ($vpkExe) {
    Write-Host "  vpk.exe: $($vpkExe.FullName)" -ForegroundColor Green
} else {
    Write-Host "  vpk.exe nicht gefunden. Suche VPK-Dateien..." -ForegroundColor Yellow
    $vpkFiles = Get-ChildItem -Path $cs2Root -Recurse -Filter 'pak01_dir.vpk' -EA SilentlyContinue
    $vpkFiles | ForEach-Object { Write-Host "  VPK: $($_.FullName)" -ForegroundColor Gray }
}

$ok = 0
for ($i = 0; $i -lt $maps.Count; $i++) {
    $mapId   = $maps[$i]
    $outName = $names[$i] + '.png'
    $outPath = Join-Path $dest $outName

    if (Test-Path $outPath) { Write-Host "  skip   $outName" -ForegroundColor Gray; $ok++; continue }

    $copied = $false

    # VPK-Extraktion wenn vpk.exe gefunden
    if ($vpkExe) {
        $pakDir  = Join-Path $cs2Root 'game\csgo'
        $innerPath = "panorama\images\overviews\$mapId.png"
        $tmp = Join-Path $env:TEMP "cs2map_$mapId"
        New-Item -ItemType Directory -Force -Path $tmp | Out-Null
        Push-Location $tmp
        & $vpkExe.FullName x $pakDir $innerPath 2>$null | Out-Null
        Pop-Location
        $extracted = Get-ChildItem -Path $tmp -Recurse -Filter "$mapId.png" -EA SilentlyContinue | Select-Object -First 1
        if ($extracted) {
            Copy-Item $extracted.FullName $outPath
            Write-Host "  OK     $outName  (VPK)" -ForegroundColor Green
            $ok++; $copied = $true
        }
        Remove-Item $tmp -Recurse -Force -EA SilentlyContinue
    }

    # Internet-Fallback mit mehr URLs
    if (-not $copied) {
        $urls = @(
            "https://cdn.csgostats.gg/map-images/$mapId.jpg",
            "https://totalcsgo.com/images/maps/$mapId.jpg",
            "https://www.csgopedia.com/wp-content/maps/$mapId.jpg",
            "https://liquipedia.net/counterstrike/images/$mapId.png"
        )
        foreach ($url in $urls) {
            try {
                Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing -TimeoutSec 20 -EA Stop
                if ((Get-Item $outPath).Length -gt 5000) {
                    Write-Host "  OK     $outName  ($url)" -ForegroundColor Green
                    $ok++; $copied = $true; break
                } else {
                    Remove-Item $outPath -EA SilentlyContinue
                }
            } catch {}
        }
    }

    if (-not $copied) { Write-Host "  --     $outName  (nicht gefunden)" -ForegroundColor DarkGray }
}

Write-Host ""
Write-Host "$ok / 8 Karten bereit." -ForegroundColor Cyan
Write-Host ""
pause
