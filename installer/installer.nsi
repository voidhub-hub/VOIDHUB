; Кастомный инсталлятор для игр
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

; Настройки
Name "${GAME_NAME}"
OutFile "${OUT_FILE}"
InstallDir "$PROGRAMFILES64\GamePlatform\Games\${GAME_ID}"
InstallDirRegKey HKLM "Software\GamePlatform\${GAME_ID}" "InstallDir"
RequestExecutionLevel admin



; Интерфейс
!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_BGCOLOR "0F0F1E"
!define MUI_TEXTCOLOR "FFFFFF"

; Страницы
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\${GAME_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Запустить ${GAME_NAME}"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Russian"

; Установка
Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Копирование файлов
  File /r "${SOURCE_DIR}\*.*"
  
  ; Создание ярлыков
  CreateDirectory "$SMPROGRAMS\GamePlatform"
  CreateShortcut "$SMPROGRAMS\GamePlatform\${GAME_NAME}.lnk" "$INSTDIR\${GAME_EXE}"
  CreateShortcut "$DESKTOP\${GAME_NAME}.lnk" "$INSTDIR\${GAME_EXE}"
  
  ; Запись в реестр
  WriteRegStr HKLM "Software\GamePlatform\${GAME_ID}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\GamePlatform\${GAME_ID}" "Version" "${GAME_VERSION}"
  
  ; Деинсталлятор
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}" "DisplayName" "${GAME_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}" "DisplayIcon" "$INSTDIR\${GAME_EXE}"
  
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}" "EstimatedSize" "$0"
SectionEnd

; Деинсталляция
Section "Uninstall"
  Delete "$INSTDIR\*.*"
  RMDir /r "$INSTDIR"
  
  Delete "$SMPROGRAMS\GamePlatform\${GAME_NAME}.lnk"
  Delete "$DESKTOP\${GAME_NAME}.lnk"
  
  DeleteRegKey HKLM "Software\GamePlatform\${GAME_ID}"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}"
SectionEnd
