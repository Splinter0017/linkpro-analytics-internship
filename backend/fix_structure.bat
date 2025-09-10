@echo off
echo Creating proper project structure...

REM Create directories if they don't exist
if not exist "src\database" mkdir "src\database"
if not exist "src\models" mkdir "src\models"
if not exist "src\routes" mkdir "src\routes"

REM Create __init__.py files
echo. > src\__init__.py
echo. > src\database\__init__.py
echo. > src\models\__init__.py
echo. > src\routes\__init__.py

REM Move files to correct locations (if they exist in wrong places)
if exist "database\connection.py" move "database\connection.py" "src\database\"
if exist "database\models.py" move "database\models.py" "src\database\"
if exist "models\click.py" move "models\click.py" "src\models\"
if exist "models\link.py" move "models\link.py" "src\models\"
if exist "models\user.py" move "models\user.py" "src\models\"
if exist "routes\tracking.py" move "routes\tracking.py" "src\routes\"
if exist "config.py" move "config.py" "src\"

REM Copy files if they're in the current directory
if exist "connection.py" copy "connection.py" "src\database\" && del "connection.py"
if exist "models.py" copy "models.py" "src\database\" && del "models.py"
if exist "click.py" copy "click.py" "src\models\" && del "click.py"
if exist "link.py" copy "link.py" "src\models\" && del "link.py"
if exist "user.py" copy "user.py" "src\models\" && del "user.py"
if exist "tracking.py" copy "tracking.py" "src\routes\" && del "tracking.py"

echo Project structure created successfully!
echo.
echo Your structure should now be:
echo backend/
echo   src/
echo     __init__.py
echo     main.py
echo     config.py
echo     database/
echo       __init__.py
echo       connection.py
echo       models.py
echo     models/
echo       __init__.py
echo       click.py
echo       link.py
echo       user.py
echo     routes/
echo       __init__.py
echo       tracking.py
echo   .env
echo   requirements.txt