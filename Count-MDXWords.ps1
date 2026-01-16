# Count words in all .mdx files within a folder (recursively)

# Set your target directory (edit this path)
$targetFolder = "./src/content"

# Initialize total word counter
$totalWords = 0

# Get all .mdx files recursively
$files = Get-ChildItem -Path $targetFolder -Filter "*.mdx" -Recurse

foreach ($file in $files) {
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Count words (split by whitespace, filter out empty)
    $wordCount = ($content -split '\s+' | Where-Object { $_ -ne "" }).Count
    
    # Print per-file result
    Write-Output ("{0}`t{1}" -f $file.Name, $wordCount)
    
    # Add to total
    $totalWords += $wordCount
}

# Print total
Write-Host "------------------------"
Write-Host "Total words across all .mdx files: $totalWords"