; Кастомный инсталлятор для VoidHub
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

; Настройки
Name "${GAME_NAME}"
OutFile "${OUT_FILE}"
InstallDir "$PROGRAMFILES64\${GAME_NAME}"
InstallDirRegKey HKLM "Software\${GAME_NAME}" "InstallDir"
RequestExecutionLevel admin
BrandingText "${GAME_NAME} v${GAME_VERSION}"



; Интерфейс
!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"

; Кастомные страницы
!define MUI_WELCOMEPAGE_TITLE "Добро пожаловать в ${GAME_NAME}!"
!define MUI_WELCOMEPAGE_TEXT "Свободная платформа для игр.$\r$\n$\r$\nЭта программа установит ${GAME_NAME} на ваш компьютер.$\r$\n$\r$\nРекомендуется закрыть все другие приложения перед началом установки."

!define MUI_FINISHPAGE_TITLE "Установка ${GAME_NAME} завершена!"
!define MUI_FINISHPAGE_TEXT "${GAME_NAME} успешно установлен.$\r$\n$\r$\nНажмите 'Завершить' для выхода из мастера установки."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${GAME_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Запустить ${GAME_NAME}"

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
  CreateDirectory "$SMPROGRAMS\${GAME_NAME}"
  CreateShortcut "$SMPROGRAMS\${GAME_NAME}\${GAME_NAME}.lnk" "$INSTDIR\${GAME_EXE}" "" "$INSTDIR\${GAME_EXE}" 0
  CreateShortcut "$SMPROGRAMS\${GAME_NAME}\Удалить ${GAME_NAME}.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${GAME_NAME}.lnk" "$INSTDIR\${GAME_EXE}" "" "$INSTDIR\${GAME_EXE}" 0
  
  ; Запись в реестр
  WriteRegStr HKLM "Software\${GAME_NAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\${GAME_NAME}" "Version" "${GAME_VERSION}"
  
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
  
  Delete "$SMPROGRAMS\${GAME_NAME}\*.lnk"
  RMDir "$SMPROGRAMS\${GAME_NAME}"
  Delete "$DESKTOP\${GAME_NAME}.lnk"
  
  DeleteRegKey HKLM "Software\${GAME_NAME}"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${GAME_ID}"
SectionEnd
