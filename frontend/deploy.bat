@echo off
echo Building LinkPro Analytics Dashboard for Production...

:: Create production directory
if not exist "dist" mkdir dist

:: Copy all files to dist folder
xcopy /s /e /y "*.html" dist\
xcopy /s /e /y "css" dist\css\
xcopy /s /e /y "js" dist\js\
xcopy /s /e /y "assets" dist\assets\ 2>nul

:: Minify JavaScript files (optional - requires Node.js)
:: npm install -g terser
:: terser js/api.js -o dist/js/api.min.js
:: terser js/charts.js -o dist/js/charts.min.js
:: terser js/dashboard.js -o dist/js/dashboard.min.js

echo Production build complete in dist/ folder
pause