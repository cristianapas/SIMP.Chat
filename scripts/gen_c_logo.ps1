Add-Type -AssemblyName System.Drawing

function Create-RoundedRectanglePath {
    param(
        [System.Drawing.Rectangle]$rect,
        [int]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2

    $arc = New-Object System.Drawing.Rectangle($rect.X, $rect.Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)

    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)

    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)

    $arc.X = $rect.X
    $path.AddArc($arc, 90, 90)

    $path.CloseFigure()
    return $path
}

$size = 1024
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Draw squircle
$bgRect = New-Object System.Drawing.Rectangle(64, 64, 896, 896)
$bgPath = Create-RoundedRectanglePath $bgRect 230
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(64, 64)),
    (New-Object System.Drawing.PointF(960, 960)),
    [System.Drawing.Color]::FromArgb(255, 15, 34, 89),    # Deep MPBA dark blue
    [System.Drawing.Color]::FromArgb(255, 37, 99, 235)    # Modern royal blue
)
$g.FillPath($bgBrush, $bgPath)

# Add subtle inner highlight rim
$rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 6)
$g.DrawPath($rimPen, $bgPath)

# Draw Letter 'C'
# Center is 512, 512. Radius = 245. Pen width = 125.
# Arc: start 40 deg, sweep 280 deg
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 125)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

$arcRect = New-Object System.Drawing.Rectangle(267, 267, 490, 490)
$g.DrawArc($pen, $arcRect, 40, 280)

$bmp.Save("app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "app-icon.png created successfully (1024x1024)"
