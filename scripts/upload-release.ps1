# Script para subir el ZIP compilado a GitHub como Release Asset
# Uso: .\scripts\upload-release.ps1 -Version 1.2.0 -Token <GITHUB_TOKEN>

param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    
    [Parameter(Mandatory = $false)]
    [string]$Version = $null
)

# Constantes
$REPO = "R4aveen/zentria-cli"
$OWNER = "R4aveen"
$REPO_NAME = "zentria-cli"
$BUILD_DIR = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "build"

# Si no se especifica versión, leerla de package.json
if (-not $Version) {
    $packageJson = Join-Path (Split-Path -Parent $BUILD_DIR) "package.json"
    $packageData = Get-Content $packageJson -Raw | ConvertFrom-Json
    $Version = $packageData.version
}

$ZIP_FILE = Join-Path $BUILD_DIR "Zentria-CLI-v$Version.zip"
$TAG = "v$Version"
$RELEASE_NOTES = "📦 distribución compilada - CLI ejecutable listo para usuarios finales"

# Validar que el ZIP exista
if (-not (Test-Path $ZIP_FILE)) {
    Write-Host "❌ ZIP no encontrado: $ZIP_FILE" -ForegroundColor Red
    Write-Host "   Ejecuta primero: npm run build:exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✧ Subiendo release a GitHub..." -ForegroundColor Cyan
Write-Host "  Repositorio: $REPO" -ForegroundColor Gray
Write-Host "  Release: $TAG" -ForegroundColor Gray
Write-Host "  ZIP: $(Split-Path $ZIP_FILE -Leaf)" -ForegroundColor Gray

# Headers para GitHub API
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    # 1. Verificar que el tag exista, si no, crearlo
    Write-Host "`n1️⃣  Verificando tag en git..." -ForegroundColor Cyan
    git tag -l $TAG | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Tag $TAG existe localmente" -ForegroundColor Green
    } else {
        Write-Host "   ⓘ Tag $TAG no existe, creándolo..." -ForegroundColor Yellow
        git tag $TAG
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo crear tag localmente"
        }
        Write-Host "   ✓ Tag creado" -ForegroundColor Green
    }
    
    # Empujar tag a GitHub
    Write-Host "   Empujando tag a GitHub..." -ForegroundColor Gray
    git push origin $TAG -q
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo hacer push del tag a GitHub"
    }
    Write-Host "   ✓ Tag empujado" -ForegroundColor Green

    # 2. Crear o actualizar release
    Write-Host "`n2️⃣  Creando release en GitHub..." -ForegroundColor Cyan
    
    $releaseUrl = "https://api.github.com/repos/$REPO/releases/tags/$TAG"
    $releaseResponse = Invoke-RestMethod -Uri $releaseUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
    
    if ($releaseResponse) {
        Write-Host "   ✓ Release ya existe" -ForegroundColor Green
        $releaseId = $releaseResponse.id
    } else {
        Write-Host "   Creando nueva release..." -ForegroundColor Gray
        $createBody = @{
            tag_name = $TAG
            name = "Zentria CLI v$Version"
            body = $RELEASE_NOTES
            draft = $false
            prerelease = $false
        } | ConvertTo-Json
        
        $createUrl = "https://api.github.com/repos/$REPO/releases"
        $releaseResponse = Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $createBody
        $releaseId = $releaseResponse.id
        Write-Host "   ✓ Release creada (ID: $releaseId)" -ForegroundColor Green
    }

    # 3. Subir ZIP como asset
    Write-Host "`n3️⃣  Subiendo asset..." -ForegroundColor Cyan
    Write-Host "   Archivo: $(Split-Path $ZIP_FILE -Leaf)" -ForegroundColor Gray
    Write-Host "   Tamaño: $([math]::Round((Get-Item $ZIP_FILE).Length / 1MB, 2)) MB" -ForegroundColor Gray
    
    # Eliminar asset anterior si existe
    $assetsUrl = "https://api.github.com/repos/$REPO/releases/$releaseId/assets"
    $assets = Invoke-RestMethod -Uri $assetsUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
    
    foreach ($asset in $assets) {
        if ($asset.name -eq "Zentria-CLI-v$Version.zip") {
            Write-Host "   Removiendo asset anterior..." -ForegroundColor Yellow
            $deleteUrl = "https://api.github.com/repos/$REPO/releases/assets/$($asset.id)"
            Invoke-RestMethod -Uri $deleteUrl -Method Delete -Headers $headers | Out-Null
            Start-Sleep -Milliseconds 500
        }
    }
    
    # Subir nuevo asset
    $uploadUrl = "https://uploads.github.com/repos/$REPO/releases/$releaseId/assets?name=$(Split-Path $ZIP_FILE -Leaf)"
    $fileBytes = [System.IO.File]::ReadAllBytes($ZIP_FILE)
    
    $uploadHeaders = $headers.Clone()
    $uploadHeaders["Content-Type"] = "application/zip"
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $fileBytes
    Write-Host "   ✓ Asset subido exitosamente" -ForegroundColor Green
    Write-Host "   URL: $($uploadResponse.browser_download_url)" -ForegroundColor Cyan

    Write-Host "`n✴︎ ¡Release publicada correctamente!" -ForegroundColor Green
    Write-Host "`n📋 Resumen:`n" -ForegroundColor Cyan
    Write-Host "   Release: https://github.com/$REPO/releases/tag/$TAG"
    Write-Host "   Asset: Zentria-CLI-v$Version.zip"
    Write-Host "   Los usuarios ahora pueden descargar la versión compilada"

} catch {
    Write-Host "`n❌ Error durante la subida:" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}
