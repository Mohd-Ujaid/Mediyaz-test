/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Checking environment for PDF/DOCX tools...');

// Check LibreOffice paths
const libreOfficePaths = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
];

let libreOfficeFound = false;
for (const p of libreOfficePaths) {
  if (fs.existsSync(p)) {
    console.log(`LibreOffice found at: ${p}`);
    libreOfficeFound = true;
    break;
  }
}
if (!libreOfficeFound) {
  console.log('LibreOffice not found in standard paths.');
}

// Check MS Word via PowerShell
try {
  const psCommand = `powershell -NoProfile -Command "
  try {
    \\$word = New-Object -ComObject Word.Application
    if (\\$word) {
      Write-Output 'Word COM Object: AVAILABLE'
      \\$word.Quit()
    }
  } catch {
    Write-Output ('Word COM Object: NOT AVAILABLE - ' + \\$_.Exception.Message)
  }
  "`;
  const output = execSync(psCommand).toString().trim();
  console.log(output);
} catch (error) {
  console.error('Error running PowerShell Word COM check:', error.message);
}

// Check if docx2pdf or other python libraries are available
try {
  const output = execSync('pip show docx2pdf').toString();
  console.log('docx2pdf Python library: AVAILABLE');
} catch (error) {
  console.log('docx2pdf Python library: NOT AVAILABLE');
}

try {
  const output = execSync('python --version').toString().trim();
  console.log(`Python: ${output}`);
} catch (error) {
  console.log('Python: NOT AVAILABLE');
}
