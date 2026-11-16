' ========================================================
' Market Pulse AI Terminal - 100% Silent Background Host Runner
' Launches host_watchdog.js directly via node.exe with ZERO console popup
' ========================================================
Dim objShell, fso, scriptDir, projectDir, watchdogPath
Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)
watchdogPath = fso.BuildPath(scriptDir, "host_watchdog.js")

objShell.CurrentDirectory = projectDir
objShell.Run "node.exe """ & watchdogPath & """", 0, False

Set objShell = Nothing
Set fso = Nothing
