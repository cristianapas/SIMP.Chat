Add-Type -AssemblyName System.Drawing

$iconImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "app-icon.png"))

# 1. header.bmp: 150x57, 24bpp
$hb = New-Object System.Drawing.Bitmap(150, 57, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$hg = [System.Drawing.Graphics]::FromImage($hb)
$hg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$hg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$hg.Clear([System.Drawing.Color]::White)

# Draw icon on right side (x=98, y=6, w=44, h=44)
$hg.DrawImage($iconImg, 98, 6, 44, 44)

# Draw text "SIMP.Chat"
$font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$brushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 30, 60))
$hg.DrawString("SIMP.Chat", $font, $brushText, 10, 16)
$hb.Save("src-tauri/nsis/header.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$hg.Dispose()
$hb.Dispose()

# 2. sidebar.bmp: 164x314, 24bpp
$sb = New-Object System.Drawing.Bitmap(164, 314, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$sg = [System.Drawing.Graphics]::FromImage($sb)
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background gradient: deep blue
$sbgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(0, 0)),
    (New-Object System.Drawing.PointF(164, 314)),
    [System.Drawing.Color]::FromArgb(255, 10, 25, 60),
    [System.Drawing.Color]::FromArgb(255, 20, 50, 110)
)
$sg.FillRectangle($sbgBrush, 0, 0, 164, 314)

# Draw icon centered at top: x=42, y=36, w=80, h=80
$sg.DrawImage($iconImg, 42, 36, 80, 80)

# Title: SIMP.Chat
$titleFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sg.DrawString("SIMP.Chat", $titleFont, $titleBrush, 82, 130, $sf)

# Tagline
$subFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 180, 205, 245))
$sg.DrawString("Cliente de mensajería`nchat.mpba.gov.ar", $subFont, $subBrush, 82, 165, $sf)

$sb.Save("src-tauri/nsis/sidebar.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$sg.Dispose()
$sb.Dispose()
$iconImg.Dispose()

Write-Host "header.bmp and sidebar.bmp created successfully!"
